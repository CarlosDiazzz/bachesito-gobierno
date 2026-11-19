<?php

namespace App\Services\Dss;

use App\Models\DssEtlEjecucion;
use App\Models\Reporte;

/**
 * Módulo DSS (Proyecto Integrador DSTD).
 *
 * Indicadores del módulo de decisión. Se calculan sobre el ranking ya filtrado
 * (misma fuente, escenario, filtros y presupuesto que la recomendación), así
 * que cambian junto con él. Cada indicador incluye su fórmula, fuente e
 * interpretación generada por reglas.
 */
class IndicadoresService
{
    /** Número de colonias que se muestran en la concentración. */
    public const TOP_COLONIAS = 5;

    /** Umbrales para interpretar la tasa de calidad de datos (%). */
    public const CALIDAD_ALTA = 90;

    public const CALIDAD_ACEPTABLE = 75;

    /**
     * @param  array  $ranking  Filas del ranking con costo_estimado y decision (RecomendacionService).
     * @param  array  $metaRecomendacion  meta devuelta por RecomendacionService::aplicar().
     * @param  array  $fuente  TopsisService::fuente().
     * @param  int  $numSinSustento  Reportes excluidos del ranking por datos insuficientes.
     */
    public function calcular(array $ranking, array $metaRecomendacion, array $fuente, int $numSinSustento = 0): array
    {
        return [
            $this->antiguedadBacklog($ranking),
            $this->coberturaPresupuestal($ranking, $metaRecomendacion, $numSinSustento),
            $this->bachesCubiertos($ranking, $metaRecomendacion, $numSinSustento),
            $this->concentracionColonias($ranking),
            $this->tasaCalidad($fuente),
        ];
    }

    /**
     * Reportes activos creados o actualizados después de iniciar la ejecución ETL usada.
     *
     * Se usa updated_at (y no historial_estados) porque también detecta reportes nuevos y
     * cambios de score/prioridad. Todas las escrituras a reportes pasan por Eloquent update(),
     * que solo escribe si hay un cambio real. Se incluye además reporte_ai_analisis.updated_at:
     * un re-análisis IA cambia severidad, confianza y área (usados por el ETL) aunque el score
     * del reporte no cambie.
     *
     * @return array{etl_desactualizado: bool, reportes_nuevos_desde_etl: int}
     */
    public function estadoEtl(?int $ejecucionId): array
    {
        $ejecucion = $ejecucionId ? DssEtlEjecucion::find($ejecucionId) : null;

        if (! $ejecucion?->iniciado_at) {
            return ['etl_desactualizado' => false, 'reportes_nuevos_desde_etl' => 0];
        }

        $desde = $ejecucion->iniciado_at;

        $nuevos = Reporte::whereIn('estado', EtlService::ESTADOS_ACTIVOS)
            ->where(fn ($q) => $q->where('created_at', '>', $desde)
                ->orWhere('updated_at', '>', $desde)
                ->orWhereHas('aiAnalisis', fn ($ia) => $ia->where('updated_at', '>', $desde)))
            ->count();

        return ['etl_desactualizado' => $nuevos > 0, 'reportes_nuevos_desde_etl' => $nuevos];
    }

    // ── Indicadores ───────────────────────────────────────────────────────────

    private function antiguedadBacklog(array $ranking): array
    {
        $dias = array_map(fn ($f) => (int) ($f['criterios']['dias_pendiente'] ?? 0), $ranking);
        $n = count($dias);
        $media = $n > 0 ? round(array_sum($dias) / $n, 1) : 0.0;
        $mediana = $this->mediana($dias);

        return $this->indicador(
            'antiguedad_backlog',
            'Antigüedad media del backlog',
            $media,
            'días',
            'Σ dias_pendiente / n baches rankeados (también se reporta la mediana)',
            'Criterio dias_pendiente de dss_reportes_limpios (o de reportes si no hay ETL)',
            $n === 0
                ? 'No hay baches pendientes en la selección.'
                : "Los baches pendientes llevan en promedio {$this->num($media)} días sin atender (mediana {$this->num($mediana)} días).",
            ['mediana' => $mediana, 'n' => $n]
        );
    }

    private function coberturaPresupuestal(array $ranking, array $meta, int $numSinSustento): array
    {
        $costoTotal = round(array_sum(array_column($ranking, 'costo_estimado')), 2);
        $costoRecomendados = (float) ($meta['costo_recomendados'] ?? 0);
        $hayPresupuesto = ($meta['presupuesto'] ?? null) !== null;
        // Sin presupuesto no hay cobertura que medir: null (no 0) para no sugerir una cobertura nula.
        $valor = $hayPresupuesto ? $this->porcentaje($costoRecomendados, $costoTotal) : null;

        $interpretacion = match (true) {
            ! $hayPresupuesto => 'Sin presupuesto definido: no se puede calcular la cobertura.',
            $costoTotal == 0 => 'No hay costo pendiente que cubrir en la selección.',
            $valor >= 100 => 'El presupuesto cubre todo el costo pendiente ('.$this->dinero($costoTotal).').',
            default => "El presupuesto cubre el {$this->num($valor)} % del costo pendiente ("
                .$this->dinero($costoRecomendados).' de '.$this->dinero($costoTotal).').',
        }.$this->notaSinSustento($numSinSustento);

        return $this->indicador(
            'cobertura_presupuestal',
            'Cobertura presupuestal',
            $valor,
            '%',
            'costo de recomendados / costo total de baches rankeados × 100',
            'Costo estimado (área × costo_m2 + costo fijo, dss_parametros) y presupuesto usado',
            $interpretacion,
            ['costo_recomendados' => $costoRecomendados, 'costo_total_pendiente' => $costoTotal]
        );
    }

    private function bachesCubiertos(array $ranking, array $meta, int $numSinSustento): array
    {
        $total = count($ranking);
        $recomendados = (int) ($meta['num_recomendados'] ?? 0);
        $hayPresupuesto = ($meta['presupuesto'] ?? null) !== null;
        $valor = $hayPresupuesto ? $this->porcentaje($recomendados, $total) : null;

        return $this->indicador(
            'baches_cubiertos',
            'Baches cubiertos',
            $valor,
            '%',
            'baches recomendados / total de baches rankeados × 100',
            'Decisión por presupuesto (RecomendacionService) sobre el ranking TOPSIS',
            match (true) {
                ! $hayPresupuesto => 'Sin presupuesto definido: no hay baches recomendados.',
                $total === 0 => 'No hay baches pendientes en la selección.',
                default => "Con el presupuesto se pueden atender {$recomendados} de {$total} baches ({$this->num($valor)} %).",
            }.$this->notaSinSustento($numSinSustento),
            ['recomendados' => $recomendados, 'total' => $total, 'sin_sustento' => $numSinSustento]
        );
    }

    private function concentracionColonias(array $ranking): array
    {
        $total = count($ranking);
        $conteo = collect($ranking)->countBy(fn ($f) => in_array($f['colonia'] ?? null, [null, '', '—'], true) ? 'Sin colonia' : $f['colonia'])
            ->sortDesc()
            ->take(self::TOP_COLONIAS);

        $detalle = $conteo->map(fn ($n, $colonia) => [
            'colonia' => $colonia,
            'pendientes' => $n,
            'porcentaje' => $this->porcentaje($n, $total),
        ])->values()->all();

        $valor = $this->porcentaje($conteo->sum(), $total);
        $primera = $detalle[0] ?? null;

        return $this->indicador(
            'concentracion_colonias',
            'Concentración por colonia',
            $valor,
            '%',
            'pendientes de las '.self::TOP_COLONIAS.' colonias con más baches / total de baches rankeados × 100',
            'Colonia del reporte (colonias.nombre, vía reportes.colonia_id)',
            $primera === null
                ? 'No hay baches pendientes en la selección.'
                : "{$primera['colonia']} concentra el {$this->num($primera['porcentaje'])} % de los pendientes; "
                    .'las '.count($detalle)." colonias principales suman el {$this->num($valor)} %.",
            ['top' => $detalle]
        );
    }

    private function tasaCalidad(array $fuente): array
    {
        $ejecucion = ! empty($fuente['ejecucion_etl_id'])
            ? DssEtlEjecucion::find($fuente['ejecucion_etl_id'])
            : null;
        $valor = $ejecucion ? ($ejecucion->tasaCalidad() ?? 0.0) : null;

        $interpretacion = match (true) {
            $ejecucion === null => 'No disponible: el ranking no proviene de una ejecución ETL.',
            $ejecucion->registros_leidos === 0 => 'La ejecución ETL no leyó reportes.',
            $valor >= self::CALIDAD_ALTA => "Calidad alta: el {$this->num($valor)} % de los reportes leídos se cargó sin descartarse ni fusionarse.",
            $valor >= self::CALIDAD_ACEPTABLE => "Calidad aceptable: el {$this->num($valor)} % de los reportes leídos se cargó; revisar las anomalías.",
            default => "Calidad baja: solo el {$this->num($valor)} % de los reportes leídos se cargó; revisar la captura de datos.",
        };

        return $this->indicador(
            'tasa_calidad_datos',
            'Tasa de calidad de datos',
            $valor,
            '%',
            'registros cargados / registros leídos × 100',
            $ejecucion ? "Ejecución ETL #{$ejecucion->id} (dss_etl_ejecuciones)" : 'Sin ejecución ETL',
            $interpretacion,
            $ejecucion ? [
                'leidos' => $ejecucion->registros_leidos,
                'cargados' => $ejecucion->registros_cargados,
                'descartados' => $ejecucion->registros_descartados,
            ] : []
        );
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    private function indicador(string $clave, string $nombre, ?float $valor, string $unidad, string $formula, string $fuente, string $interpretacion, array $detalle = []): array
    {
        return compact('clave', 'nombre', 'valor', 'unidad', 'formula', 'fuente', 'interpretacion', 'detalle');
    }

    private function notaSinSustento(int $n): string
    {
        return match (true) {
            $n === 1 => ' No incluye 1 reporte excluido por falta de sustento (datos insuficientes).',
            $n > 1 => " No incluye {$n} reportes excluidos por falta de sustento (datos insuficientes).",
            default => '',
        };
    }

    private function porcentaje(float $parte, float $total): float
    {
        return $total > 0 ? round($parte / $total * 100, 1) : 0.0;
    }

    private function mediana(array $valores): float
    {
        $n = count($valores);
        if ($n === 0) {
            return 0.0;
        }

        sort($valores);
        $mitad = intdiv($n, 2);

        return $n % 2 ? (float) $valores[$mitad] : round(($valores[$mitad - 1] + $valores[$mitad]) / 2, 1);
    }

    private function num(float $v): string
    {
        return fmod($v, 1.0) === 0.0 ? number_format($v, 0) : number_format($v, 1);
    }

    private function dinero(float $v): string
    {
        return '$'.number_format($v, fmod($v, 1.0) === 0.0 ? 0 : 2);
    }
}
