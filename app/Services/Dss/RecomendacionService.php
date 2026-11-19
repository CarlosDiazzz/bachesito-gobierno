<?php

namespace App\Services\Dss;

use App\Models\DssParametro;
use App\Models\Presupuesto;

/**
 * Módulo DSS (Proyecto Integrador DSTD).
 *
 * Convierte el ranking TOPSIS en una recomendación concreta: estima el costo de
 * cada bache, selecciona los que caben en el presupuesto (greedy en orden de
 * ranking) y genera una explicación textual por reglas (sin IA).
 */
class RecomendacionService
{
    /** Un criterio "destaca" si su valor ponderado alcanza esta fracción del ideal positivo. */
    public const UMBRAL_DESTACA = 0.75;

    /** Máximo de criterios mencionados en la frase de explicación. */
    public const MAX_CRITERIOS_DESTACADOS = 2;

    public const CRITERIO_LABEL = [
        'severidad' => 'severidad',
        'tipo_via' => 'tipo de vía',
        'dias_pendiente' => 'días pendientes',
        'densidad_zona' => 'densidad de la zona',
        'score_ia' => 'score IA',
    ];

    /**
     * @param  array  $ranking  Filas devueltas por TopsisService::rankear(), ya ordenadas.
     * @param  float|null  $presupuestoSolicitado  Presupuesto enviado por el usuario (null = usar el del mes).
     * @return array{ranking: array, meta: array}
     */
    public function aplicar(array $ranking, ?float $presupuestoSolicitado = null): array
    {
        $parametros = DssParametro::valores();
        [$presupuesto, $origen, $periodo] = $this->resolverPresupuesto($presupuestoSolicitado);

        $total = count($ranking);
        $acumulado = 0.0;
        $recomendados = 0;

        foreach ($ranking as $i => $fila) {
            $costo = $this->estimarCosto($fila['ai_area_m2'] ?? null, $parametros);
            $decision = null;

            if ($presupuesto !== null) {
                // Greedy en orden de ranking: entra si todavía cabe en el saldo.
                if ($acumulado + $costo['costo'] <= $presupuesto + 0.005) {
                    $decision = 'recomendado';
                    $acumulado += $costo['costo'];
                    $recomendados++;
                } else {
                    $decision = 'en_espera';
                }
            }

            $saldo = $presupuesto === null ? null : round($presupuesto - $acumulado, 2);

            $ranking[$i]['costo_estimado'] = $costo['costo'];
            $ranking[$i]['costo_detalle'] = $costo;
            $ranking[$i]['decision'] = $decision;
            $ranking[$i]['explicacion'] = array_merge($fila['explicacion'] ?? [], [
                'posicion' => $fila['rank'] ?? $i + 1,
                'total' => $total,
                'decision' => $decision,
                'costo' => $costo['costo'],
                'saldo_despues' => $saldo,
                'criterios_destacados' => $this->criteriosDestacados($fila['explicacion']['criterios'] ?? []),
            ]);
            $ranking[$i]['explicacion']['frase'] = $this->frase($ranking[$i]);
        }

        $meta = [
            'presupuesto' => $presupuesto,
            'presupuesto_origen' => $origen,
            'presupuesto_periodo' => $periodo,
            'costo_recomendados' => round($acumulado, 2),
            'saldo_restante' => $presupuesto === null ? null : round($presupuesto - $acumulado, 2),
            'num_recomendados' => $recomendados,
            'num_en_espera' => $presupuesto === null ? 0 : $total - $recomendados,
            'aviso_presupuesto' => $presupuesto === null
                ? sprintf(
                    'No hay presupuesto disponible registrado para %s/%d. Captura un monto para obtener recomendaciones.',
                    str_pad((string) $periodo['mes'], 2, '0', STR_PAD_LEFT), $periodo['anio']
                )
                : null,
            'parametros_costo' => $parametros,
        ];

        return ['ranking' => $ranking, 'meta' => $meta];
    }

    /**
     * Presupuesto disponible del mes actual: registros tipo "disponible" si existen;
     * si no, asignado − ejercido − comprometido. Null si el mes no tiene registros.
     */
    public function presupuestoDisponibleMes(int $anio, int $mes): ?float
    {
        $montos = Presupuesto::where('anio', $anio)
            ->where('mes', $mes)
            ->selectRaw('tipo, SUM(monto) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo')
            ->map(fn ($v) => (float) $v);

        if ($montos->isEmpty()) {
            return null;
        }

        if ($montos->has('disponible')) {
            return max($montos['disponible'], 0.0);
        }

        $disponible = ($montos['asignado'] ?? 0) - ($montos['ejercido'] ?? 0) - ($montos['comprometido'] ?? 0);

        return max(round($disponible, 2), 0.0);
    }

    /** Costo = área × costo_m2 + costo fijo de movilización. */
    public function estimarCosto(?float $areaIa, array $parametros): array
    {
        $supuesta = $areaIa === null || $areaIa <= 0;
        $area = $supuesta ? $parametros['area_default_m2'] : $areaIa;

        return [
            'area_m2' => round($area, 2),
            'area_supuesta' => $supuesta,
            'costo_m2' => $parametros['costo_m2'],
            'costo_fijo' => $parametros['costo_fijo_movilizacion'],
            'costo' => round($area * $parametros['costo_m2'] + $parametros['costo_fijo_movilizacion'], 2),
        ];
    }

    // ── Internos ──────────────────────────────────────────────────────────────

    /** @return array{0: ?float, 1: ?string, 2: array{anio:int, mes:int}} */
    private function resolverPresupuesto(?float $solicitado): array
    {
        $periodo = ['anio' => (int) now()->year, 'mes' => (int) now()->month];

        if ($solicitado !== null) {
            return [round($solicitado, 2), 'parametro', $periodo];
        }

        $delMes = $this->presupuestoDisponibleMes($periodo['anio'], $periodo['mes']);

        return [$delMes, $delMes === null ? null : 'presupuestos_mes', $periodo];
    }

    /** Criterios cuyo valor ponderado está más cerca del ideal positivo. */
    private function criteriosDestacados(array $criterios): array
    {
        return collect($criterios)
            ->filter(fn ($c) => $c['ideal_positivo'] > 0)
            ->map(fn ($c) => $c['ponderado'] / $c['ideal_positivo'])
            ->filter(fn ($ratio) => $ratio >= self::UMBRAL_DESTACA)
            ->sortDesc()
            ->keys()
            ->take(self::MAX_CRITERIOS_DESTACADOS)
            ->values()
            ->all();
    }

    private function frase(array $fila): string
    {
        $e = $fila['explicacion'];
        $posicion = "posición {$e['posicion']} de {$e['total']}";

        $nombres = array_map(fn ($k) => self::CRITERIO_LABEL[$k] ?? $k, $e['criterios_destacados']);
        $destaca = match (count($nombres)) {
            0 => 'sin un criterio dominante',
            1 => "destaca en {$nombres[0]}",
            default => 'destaca en '.implode(', ', array_slice($nombres, 0, -1)).' y '.end($nombres),
        };

        $costo = 'costo '.$this->dinero($e['costo']);

        $frase = match ($e['decision']) {
            'recomendado' => "Recomendado: {$posicion}, {$destaca}; {$costo}, entra con saldo de ".$this->dinero($e['saldo_despues']).'.',
            'en_espera' => "En espera: {$posicion}, {$destaca}; {$costo}, no cabe en el saldo disponible de ".$this->dinero($e['saldo_despues']).'.',
            default => 'Sin decisión: '.$posicion.", {$destaca}; {$costo}. No hay presupuesto definido.",
        };

        if (($fila['num_reportes_fusionados'] ?? 1) > 1) {
            $frase .= " Agrupa {$fila['num_reportes_fusionados']} reportes ciudadanos del mismo bache.";
        }

        if ($fila['costo_detalle']['area_supuesta'] ?? false) {
            $frase .= ' El costo usa el área supuesta de '.$fila['costo_detalle']['area_m2'].' m² porque la IA no estimó el área.';
        }

        return $frase;
    }

    private function dinero(float $monto): string
    {
        return '$'.number_format($monto, fmod($monto, 1.0) === 0.0 ? 0 : 2);
    }
}
