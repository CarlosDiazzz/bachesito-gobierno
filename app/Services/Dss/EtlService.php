<?php

namespace App\Services\Dss;

use App\Http\Controllers\Api\ReporteController;
use App\Models\Colonia;
use App\Models\DssEtlEjecucion;
use App\Models\Reporte;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Módulo DSS (Proyecto Integrador DSTD).
 *
 * Proceso ETL que lee la tabla `reportes` (sin modificarla), aplica reglas de
 * limpieza y calidad de datos, y carga el resultado en `dss_reportes_limpios`.
 * Cada problema detectado queda registrado en `dss_etl_anomalias`.
 */
class EtlService
{
    // ── Umbrales de las reglas de limpieza ────────────────────────────────────

    /** Regla 2: distancia máxima (m) para considerar dos reportes duplicados. */
    public const DISTANCIA_DUPLICADO_M = 15;

    /** Regla 2: diferencia máxima (días) entre fechas de reporte de dos duplicados. */
    public const DIAS_DUPLICADO = 7;

    /** Regla 3: valor imputado cuando falta tipo_via y la calle no lo aporta. */
    public const TIPO_VIA_IMPUTADO = 'calle_secundaria';

    /** Regla 4: confianza mínima (0–1) del análisis IA para considerarlo suficiente. */
    public const UMBRAL_CONFIANZA = 0.5;

    /** Regla 4: la IA guarda la confianza en escala 0–100; se divide entre este valor. */
    public const ESCALA_CONFIANZA = 100;

    /** Regla 6: radio (m) para imputar la colonia del reporte limpio más cercano. */
    public const RADIO_IMPUTACION_COLONIA_M = 200;

    /** Radio (m) para calcular la densidad de la zona (mismo valor que TopsisService). */
    public const RADIO_DENSIDAD_M = 200;

    /** Estados activos: el mismo conjunto que usa TopsisService. */
    public const ESTADOS_ACTIVOS = ['pendiente', 'validado', 'asignado', 'en_proceso'];

    // ── Escalas de transformación (las mismas que TopsisService) ─────────────

    private const SEVERIDAD_MAP = ['alta' => 1.00, 'media' => 0.60, 'baja' => 0.20];

    private const SEVERIDAD_DEFAULT = 0.10;

    private const TIPO_VIA_MAP = [
        'carretera' => 1.00,
        'avenida_principal' => 0.90,
        'boulevard' => 0.80,
        'calle_secundaria' => 0.50,
        'callejon' => 0.20,
    ];

    private const TIPO_VIA_DEFAULT = 0.30;

    /** Equivalencia calles.tipo → reportes.tipo_via (solo equivalencias directas). */
    private const CALLE_TIPO_A_TIPO_VIA = [
        'avenida' => 'avenida_principal',
        'calle' => 'calle_secundaria',
        'boulevard' => 'boulevard',
        'callejon' => 'callejon',
        'carretera' => 'carretera',
        'privada' => 'privada',
    ];

    private CarbonInterface $ahora;

    // ── API pública ───────────────────────────────────────────────────────────

    public function ejecutar(?int $userId = null): DssEtlEjecucion
    {
        $this->ahora = now();

        $ejecucion = DssEtlEjecucion::create([
            'iniciado_at' => $this->ahora,
            'estado' => 'en_proceso',
            'ejecutado_por' => $userId,
        ]);

        try {
            $reportes = $this->extraer();
            $resultado = $this->transformar($reportes);
            $this->cargar($ejecucion, $reportes->count(), $resultado);
        } catch (Throwable $e) {
            Log::error('[DSS ETL] Ejecución fallida', [
                'ejecucion_id' => $ejecucion->id,
                'error' => $e->getMessage(),
            ]);

            $ejecucion->update([
                'estado' => 'fallido',
                'finalizado_at' => now(),
                'mensaje_error' => $e->getMessage(),
            ]);
        }

        return $ejecucion->fresh();
    }

    // ── Fase 1: Extraer ───────────────────────────────────────────────────────

    private function extraer(): Collection
    {
        return Reporte::with(['aiAnalisis', 'colonia:id,nombre', 'calle'])
            ->whereIn('estado', self::ESTADOS_ACTIVOS)
            ->orderBy('id')
            ->get();
    }

    // ── Fase 2: Transformar ───────────────────────────────────────────────────

    /**
     * @return array{limpios: array, anomalias: array, descartados: int, con_advertencia: int}
     */
    private function transformar(Collection $reportes): array
    {
        $anomalias = [];

        // Reglas 1 y 5a: descartan el registro.
        $validos = $reportes->filter(function (Reporte $r) use (&$anomalias) {
            $anomalia = $this->validarCoordenadas($r) ?? $this->validarFechaReporte($r);

            if ($anomalia) {
                $anomalias[] = $anomalia;

                return false;
            }

            return true;
        });

        $descartados = $reportes->count() - $validos->count();

        // Regla 2: fusiona duplicados (se conserva el más antiguo).
        [$conservados, $fusionados, $anomaliasDuplicados] = $this->deduplicar($validos);
        array_push($anomalias, ...$anomaliasDuplicados);

        // Reglas 3, 4, 5b y 6: imputan o marcan, pero el registro se carga.
        $limpios = [];
        $conAdvertencia = 0;

        foreach ($conservados as $r) {
            [$tipoVia, $anomaliaVia] = $this->imputarTipoVia($r);
            $anomaliaIa = $this->validarAnalisisIa($r);
            $anomaliaResolucion = $this->validarFechaResolucion($r);
            [$coloniaId, $anomaliaColonia] = $this->imputarColonia($r, $conservados);

            $propias = array_filter([$anomaliaVia, $anomaliaIa, $anomaliaResolucion, $anomaliaColonia]);
            array_push($anomalias, ...$propias);

            if (count($propias) > 0) {
                $conAdvertencia++;
            }

            $limpios[$r->id] = [
                'reporte' => $r,
                'tipo_via' => $tipoVia,
                'colonia_id' => $coloniaId,
                'num_reportes_fusionados' => 1 + ($fusionados[$r->id] ?? 0),
                'datos_suficientes' => $anomaliaIa === null,
            ];
        }

        return [
            'limpios' => $this->calcularCriterios($limpios),
            'anomalias' => $anomalias,
            'descartados' => $descartados,
            'con_advertencia' => $conAdvertencia,
        ];
    }

    /** Regla 1: coordenadas nulas o fuera de Oaxaca de Juárez → descartado. */
    private function validarCoordenadas(Reporte $r): ?array
    {
        $b = ReporteController::OAXACA_BOUNDS;
        $lat = $r->latitud;
        $lng = $r->longitud;

        $dentro = $lat !== null && $lng !== null
            && (float) $lat >= $b['lat_min'] && (float) $lat <= $b['lat_max']
            && (float) $lng >= $b['lng_min'] && (float) $lng <= $b['lng_max'];

        if ($dentro) {
            return null;
        }

        return $this->anomalia(
            $r,
            'coordenada_fuera_rango',
            'latitud,longitud',
            ($lat ?? 'NULL').', '.($lng ?? 'NULL'),
            'descartado',
            sprintf(
                'Coordenadas nulas o fuera de Oaxaca de Juárez (lat %.2f a %.2f, lng %.2f a %.2f): el registro se descarta.',
                $b['lat_min'], $b['lat_max'], $b['lng_min'], $b['lng_max']
            ),
            'error'
        );
    }

    /** Regla 5a: fecha_reporte faltante o en el futuro → descartado. */
    private function validarFechaReporte(Reporte $r): ?array
    {
        if ($r->fecha_reporte === null) {
            return $this->anomalia(
                $r, 'campo_faltante', 'fecha_reporte', null, 'descartado',
                'Sin fecha de reporte no se pueden calcular los días pendientes: el registro se descarta.',
                'error'
            );
        }

        if ($r->fecha_reporte->greaterThan($this->ahora)) {
            return $this->anomalia(
                $r, 'fecha_invalida', 'fecha_reporte', $r->fecha_reporte->toDateTimeString(), 'descartado',
                'La fecha de reporte está en el futuro respecto a la ejecución del ETL: el registro se descarta.',
                'error'
            );
        }

        return null;
    }

    /**
     * Regla 2: reportes a menos de DISTANCIA_DUPLICADO_M metros y con menos de
     * DIAS_DUPLICADO días de diferencia son el mismo bache. Se conserva el más
     * antiguo y los demás se fusionan en él.
     *
     * @return array{0: Collection, 1: array<int,int>, 2: array}
     */
    private function deduplicar(Collection $reportes): array
    {
        $ordenados = $reportes->sortBy([
            fn ($a, $b) => $a->fecha_reporte <=> $b->fecha_reporte,
            fn ($a, $b) => $a->id <=> $b->id,
        ]);

        $conservados = collect();
        $fusionados = [];
        $anomalias = [];
        $limiteSegundos = self::DIAS_DUPLICADO * 86400;

        foreach ($ordenados as $r) {
            $original = $conservados->first(function (Reporte $c) use ($r, $limiteSegundos) {
                $distancia = $this->distanciaM(
                    (float) $c->latitud, (float) $c->longitud,
                    (float) $r->latitud, (float) $r->longitud
                );
                $segundos = abs($r->fecha_reporte->diffInSeconds($c->fecha_reporte));

                return $distancia < self::DISTANCIA_DUPLICADO_M && $segundos < $limiteSegundos;
            });

            if ($original === null) {
                $conservados->push($r);

                continue;
            }

            $fusionados[$original->id] = ($fusionados[$original->id] ?? 0) + 1;

            $distancia = $this->distanciaM(
                (float) $original->latitud, (float) $original->longitud,
                (float) $r->latitud, (float) $r->longitud
            );

            $anomalias[] = $this->anomalia(
                $r, 'duplicado', 'latitud,longitud,fecha_reporte',
                sprintf('Duplicado de %s (%.1f m, %s)', $original->folio, $distancia, $r->fecha_reporte->toDateTimeString()),
                'fusionado',
                sprintf(
                    'Está a menos de %d m y a menos de %d días de un reporte anterior: se fusiona con el más antiguo (%s).',
                    self::DISTANCIA_DUPLICADO_M, self::DIAS_DUPLICADO, $original->folio
                ),
                'advertencia'
            );
        }

        return [$conservados, $fusionados, $anomalias];
    }

    /**
     * Regla 3: tipo_via nulo → se toma de la calle asociada; si la calle no da
     * el dato, se imputa TIPO_VIA_IMPUTADO.
     *
     * @return array{0: string, 1: ?array}
     */
    private function imputarTipoVia(Reporte $r): array
    {
        if ($r->tipo_via !== null && $r->tipo_via !== '') {
            return [$r->tipo_via, null];
        }

        $desdeCalle = self::CALLE_TIPO_A_TIPO_VIA[$r->calle?->tipo ?? ''] ?? null;

        if ($desdeCalle !== null) {
            return [$desdeCalle, $this->anomalia(
                $r, 'tipo_via_faltante', 'tipo_via', null, 'imputado',
                "tipo_via nulo: se imputa '{$desdeCalle}' a partir del tipo de la calle asociada ('{$r->calle->tipo}').",
                'advertencia'
            )];
        }

        return [self::TIPO_VIA_IMPUTADO, $this->anomalia(
            $r, 'tipo_via_faltante', 'tipo_via', null, 'imputado',
            "tipo_via nulo y la calle asociada no aporta el dato: se imputa el valor por defecto '".self::TIPO_VIA_IMPUTADO."'.",
            'advertencia'
        )];
    }

    /** Regla 4: sin análisis IA o confianza < UMBRAL_CONFIANZA → marcado. */
    private function validarAnalisisIa(Reporte $r): ?array
    {
        $ia = $r->aiAnalisis;

        if ($ia === null) {
            return $this->anomalia(
                $r, 'sin_analisis_ia', 'reporte_ai_analisis', null, 'marcado',
                'El reporte no tiene análisis IA: se carga con datos_suficientes = false.',
                'advertencia'
            );
        }

        $confianza = (float) $ia->confianza / self::ESCALA_CONFIANZA;

        if ($confianza < self::UMBRAL_CONFIANZA) {
            return $this->anomalia(
                $r, 'sin_analisis_ia', 'reporte_ai_analisis.confianza', (string) $ia->confianza, 'marcado',
                sprintf(
                    'Confianza del análisis IA %.2f menor al umbral %.2f: se carga con datos_suficientes = false.',
                    $confianza, self::UMBRAL_CONFIANZA
                ),
                'advertencia'
            );
        }

        return null;
    }

    /** Regla 5b: fecha_resolucion anterior a fecha_reporte → marcado. */
    private function validarFechaResolucion(Reporte $r): ?array
    {
        if ($r->fecha_resolucion === null || ! $r->fecha_resolucion->lessThan($r->fecha_reporte)) {
            return null;
        }

        return $this->anomalia(
            $r, 'fecha_invalida', 'fecha_resolucion', $r->fecha_resolucion->toDateTimeString(), 'marcado',
            'La fecha de resolución es anterior a la fecha de reporte ('.$r->fecha_reporte->toDateTimeString().'): se marca para revisión.',
            'advertencia'
        );
    }

    /**
     * Regla 6: colonia_id nulo → se imputa la colonia de la calle asociada o, si no, la del
     * reporte limpio más cercano (con colonia original) a ≤ RADIO_IMPUTACION_COLONIA_M metros.
     * Si no es posible, se marca y el reporte queda como "Sin colonia".
     *
     * @return array{0: ?int, 1: ?array}
     */
    private function imputarColonia(Reporte $r, Collection $conservados): array
    {
        if ($r->colonia_id !== null) {
            return [$r->colonia_id, null];
        }

        if ($r->calle?->colonia_id) {
            $nombre = Colonia::find($r->calle->colonia_id)?->nombre ?? "#{$r->calle->colonia_id}";

            return [$r->calle->colonia_id, $this->anomalia(
                $r, 'campo_faltante', 'colonia_id', null, 'imputado',
                "colonia_id nulo: se imputa la colonia '{$nombre}' de la calle asociada ('{$r->calle->nombre}').",
                'advertencia'
            )];
        }

        // Solo se toman como referencia reportes con colonia original (no imputada en esta ejecución)
        $cercano = $conservados
            ->filter(fn (Reporte $o) => $o->id !== $r->id && $o->colonia_id !== null)
            ->map(fn (Reporte $o) => [
                'reporte' => $o,
                'distancia' => $this->distanciaM(
                    (float) $r->latitud, (float) $r->longitud,
                    (float) $o->latitud, (float) $o->longitud
                ),
            ])
            ->filter(fn ($c) => $c['distancia'] <= self::RADIO_IMPUTACION_COLONIA_M)
            ->sortBy([['distancia', 'asc'], [fn ($a, $b) => $a['reporte']->id <=> $b['reporte']->id]])
            ->first();

        if ($cercano !== null) {
            $o = $cercano['reporte'];
            $nombre = $o->colonia?->nombre ?? "#{$o->colonia_id}";

            return [$o->colonia_id, $this->anomalia(
                $r, 'campo_faltante', 'colonia_id', null, 'imputado',
                sprintf(
                    "colonia_id nulo y sin calle con colonia: se imputa '%s' del reporte limpio más cercano (%s, a %.0f m; radio máximo %d m).",
                    $nombre, $o->folio, $cercano['distancia'], self::RADIO_IMPUTACION_COLONIA_M
                ),
                'advertencia'
            )];
        }

        return [null, $this->anomalia(
            $r, 'campo_faltante', 'colonia_id', null, 'marcado',
            sprintf(
                "colonia_id nulo, sin calle con colonia y sin reporte limpio con colonia a ≤ %d m: queda como 'Sin colonia'.",
                self::RADIO_IMPUTACION_COLONIA_M
            ),
            'advertencia'
        )];
    }

    /** Calcula los 5 criterios TOPSIS sobre los registros ya depurados. */
    private function calcularCriterios(array $limpios): array
    {
        $reportes = collect($limpios)->pluck('reporte');

        return collect($limpios)->map(function (array $fila) use ($reportes) {
            /** @var Reporte $r */
            $r = $fila['reporte'];

            $densidad = $reportes->filter(fn (Reporte $o) => $o->id !== $r->id
                && $this->distanciaM(
                    (float) $r->latitud, (float) $r->longitud,
                    (float) $o->latitud, (float) $o->longitud
                ) <= self::RADIO_DENSIDAD_M
            )->count();

            $dias = (int) floor($r->fecha_reporte->diffInDays($this->ahora));

            return [
                'reporte_id' => $r->id,
                'severidad' => self::SEVERIDAD_MAP[$r->aiAnalisis?->severidad_ia ?? ''] ?? self::SEVERIDAD_DEFAULT,
                'tipo_via' => self::TIPO_VIA_MAP[$fila['tipo_via']] ?? self::TIPO_VIA_DEFAULT,
                'dias_pendiente' => max($dias, 1),
                'densidad_zona' => $densidad + 1,
                'score_ia' => (float) ($r->score_prioridad ?? 0),
                'colonia_id' => $fila['colonia_id'],
                'latitud' => $r->latitud,
                'longitud' => $r->longitud,
                'num_reportes_fusionados' => $fila['num_reportes_fusionados'],
                'datos_suficientes' => $fila['datos_suficientes'],
            ];
        })->values()->all();
    }

    // ── Fase 3: Cargar ────────────────────────────────────────────────────────

    private function cargar(DssEtlEjecucion $ejecucion, int $leidos, array $resultado): void
    {
        DB::transaction(function () use ($ejecucion, $leidos, $resultado) {
            $marcaTiempo = ['created_at' => $this->ahora, 'updated_at' => $this->ahora];
            $base = ['ejecucion_id' => $ejecucion->id] + $marcaTiempo;

            foreach (array_chunk($resultado['anomalias'], 200) as $lote) {
                DB::table('dss_etl_anomalias')->insert(
                    array_map(fn ($a) => $base + $a, $lote)
                );
            }

            foreach (array_chunk($resultado['limpios'], 200) as $lote) {
                DB::table('dss_reportes_limpios')->insert(
                    array_map(fn ($l) => $base + $l, $lote)
                );
            }

            $ejecucion->update([
                'registros_leidos' => $leidos,
                'registros_cargados' => count($resultado['limpios']),
                'registros_descartados' => $resultado['descartados'],
                'registros_con_advertencia' => $resultado['con_advertencia'],
                'estado' => 'completado',
                'finalizado_at' => now(),
            ]);
        });
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    private function anomalia(
        Reporte $r,
        string $tipo,
        ?string $campo,
        ?string $valorOriginal,
        string $accion,
        string $regla,
        string $severidad,
    ): array {
        return [
            'reporte_id' => $r->id,
            'tipo_anomalia' => $tipo,
            'campo' => $campo,
            'valor_original' => $valorOriginal,
            'accion_tomada' => $accion,
            'regla_aplicada' => $regla,
            'severidad' => $severidad,
        ];
    }

    private function distanciaM(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 6371000 * 2 * asin(sqrt($a));
    }
}
