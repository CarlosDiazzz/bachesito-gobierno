<?php

namespace App\Services;

use App\Models\DssEtlAnomalia;
use App\Models\DssEtlEjecucion;
use App\Models\DssReporteLimpio;
use App\Models\Reporte;
use Illuminate\Support\Collection;

class TopsisService
{
    // Pesos multicriterio — suma = 1.0
    private const ESCENARIOS = [
    'equilibrado' => [
        'nombre' => 'Atención equilibrada',
        'descripcion' => 'Equilibra gravedad, tipo de vía, antigüedad, concentración de reportes y análisis técnico.',
        'pesos' => [
            'severidad'      => 0.30,
            'tipo_via'       => 0.25,
            'dias_pendiente' => 0.20,
            'densidad_zona'  => 0.15,
            'score_ia'       => 0.10,
        ],
    ],
    'rezago' => [
        'nombre' => 'Reducción del rezago',
        'descripcion' => 'Aumenta la importancia de los reportes que llevan más días sin ser atendidos.',
        'pesos' => [
            'severidad'      => 0.25,
            'tipo_via'       => 0.15,
            'dias_pendiente' => 0.40,
            'densidad_zona'  => 0.15,
            'score_ia'       => 0.05,
        ],
    ],
];

private array $weights;
private string $escenarioActual = 'equilibrado';

public function __construct()
{
    $this->usarEscenario($this->escenarioActual);
}

public function usarEscenario(string $escenario): void
{
    if (!array_key_exists($escenario, self::ESCENARIOS)) {
        throw new \InvalidArgumentException(
            "El escenario de priorización '{$escenario}' no existe."
        );
    }

    $this->escenarioActual = $escenario;
    $this->weights = self::ESCENARIOS[$escenario]['pesos'];
}

public function escenarios(): array
{
    return self::ESCENARIOS;
}

public function escenarioActual(): string
{
    return $this->escenarioActual;
}

    private array $sevMap = [
        'alta'  => 1.00,
        'media' => 0.60,
        'baja'  => 0.20,
    ];

    private array $viaMap = [
        'carretera'          => 1.00,
        'avenida_principal'  => 0.90,
        'boulevard'          => 0.80,
        'calle_secundaria'   => 0.50,
        'callejon'           => 0.20,
    ];

    private array $estadosActivos = ['pendiente', 'validado', 'asignado', 'en_proceso'];

    // ── API pública ───────────────────────────────────────────────────────────

    public function rankear(array $filtros = []): array
    {
        $query = Reporte::with([
            'aiAnalisis',
            'colonia:id,nombre',
            'municipio:id,nombre',
            'fotos',
        ])->whereIn('estado', $this->estadosActivos);

        $this->aplicarFiltros($query, $filtros);

        // Módulo DSS: si hay una ejecución ETL completada, se decide sobre los datos limpios.
        $this->ejecucionEtl = DssEtlEjecucion::where('estado', 'completado')->latest('id')->first();
        $this->sinSustento  = [];

        if ($this->ejecucionEtl) {
            $limpios = DssReporteLimpio::with('colonia:id,nombre')
                ->where('ejecucion_id', $this->ejecucionEtl->id)
                ->get()
                ->keyBy('reporte_id');

            // Excluye descartados y fusionados (no están en dss_reportes_limpios)
            $query->whereIn('id', $limpios->keys());

            // datos_suficientes = false no entra al cálculo para no distorsionar la normalización
            [$reportes, $insuficientes] = $query->get()
                ->partition(fn ($r) => $limpios[$r->id]->datos_suficientes);

            $this->sinSustento = $this->construirSinSustento($insuficientes);
            $reportes = $reportes->values();

            if ($reportes->isEmpty()) return [];

            $matrix = $reportes->map(fn ($r) => $this->buildRowLimpio($r, $limpios[$r->id]));
        } else {
            $reportes = $query->get();

            if ($reportes->isEmpty()) return [];

            $matrix = $reportes->map(fn ($r) => $this->buildRow($r, $reportes));
        }


        $normalized = $this->vectorNormalize($matrix);
        $weighted   = $this->applyWeights($normalized);

        [$idealBest, $idealWorst] = $this->idealSolutions($weighted);

        return $weighted
            ->map(fn ($row) => $this->computeScore($row, $idealBest, $idealWorst))
            ->sortByDesc('topsis_score')
            ->values()
            ->map(fn ($r, $i) => array_merge($r, ['rank' => $i + 1]))
            ->toArray();
    }

    public function resumenZonas(array $filtros = []): array
    {
        $query = Reporte::with(['colonia:id,nombre', 'aiAnalisis'])
            ->whereIn('estado', $this->estadosActivos);

        $this->aplicarFiltros($query, $filtros);

        $reportes = $query->get();

        return $reportes
            ->groupBy('colonia_id')
            ->map(fn ($grupo) => $this->buildZonaSummary($grupo))
            ->sortByDesc('riesgo')
            ->values()
            ->toArray();
    }

    // ── Filtros para el análisis ──────────────────────────────────────────────

    private function aplicarFiltros($query, array $filtros): void
    {
        if (!empty($filtros['colonia_id'])) {
            $query->where('colonia_id', (int) $filtros['colonia_id']);
        }

        if (!empty($filtros['colonia'])) {
            $nombreColonia = trim($filtros['colonia']);

            $query->whereHas('colonia', function ($subquery) use ($nombreColonia) {
                $subquery->where('nombre', 'like', "%{$nombreColonia}%");
            });
        }

        if (!empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
        }

        if (!empty($filtros['severidad'])) {
            $query->whereHas('aiAnalisis', function ($subquery) use ($filtros) {
                $subquery->where(
                    'severidad_ia',
                    $filtros['severidad']
                );
            });
        }

        if (
            isset($filtros['dias_min'])
            && $filtros['dias_min'] !== ''
            && (int) $filtros['dias_min'] > 0
        ) {
            $query->where(
                'fecha_reporte',
                '<=',
                now()->subDays((int) $filtros['dias_min'])
            );
        }

        if (!empty($filtros['buscar'])) {
            $buscar = trim($filtros['buscar']);

            $query->where(function ($subquery) use ($buscar) {
                $subquery
                    ->where('folio', 'like', "%{$buscar}%")
                    ->orWhere('nombre_via', 'like', "%{$buscar}%")
                    ->orWhere('direccion_aproximada', 'like', "%{$buscar}%")
                    ->orWhereHas('colonia', function ($colonia) use ($buscar) {
                        $colonia->where('nombre', 'like', "%{$buscar}%");
                    });
            });
        }
    }
    // ── Construcción de la matriz ─────────────────────────────────────────────

    private function buildRow(Reporte $r, Collection $todos): array
    {
        $dias = (int) ($r->fecha_reporte ?? now())->diffInDays(now());

        $densidad = $todos->filter(function ($other) use ($r) {
            return $other->id !== $r->id
                && $this->distanciaM((float)$r->latitud, (float)$r->longitud,
                                     (float)$other->latitud, (float)$other->longitud) <= 200;
        })->count();

        return [
            'reporte' => $r,
            'raw'     => [
                'severidad'      => $this->sevMap[$r->aiAnalisis?->severidad_ia ?? ''] ?? 0.10,
                'tipo_via'       => $this->viaMap[$r->tipo_via ?? ''] ?? 0.30,
                'dias_pendiente' => (float) max($dias, 1),
                'densidad_zona'  => (float) max($densidad + 1, 1),
                'score_ia'       => (float) ($r->score_prioridad ?? 0),
            ],
        ];
    }

    // ── Módulo DSS: fuente de datos limpia (ETL) ──────────────────────────────

    private ?DssEtlEjecucion $ejecucionEtl = null;
    private array $sinSustento = [];

    /** Fila de la matriz a partir de los criterios ya transformados por el ETL. */
    private function buildRowLimpio(Reporte $r, DssReporteLimpio $l): array
    {
        return [
            'reporte' => $r,
            'limpio'  => $l,
            'raw'     => [
                'severidad'      => (float) $l->severidad,
                'tipo_via'       => (float) $l->tipo_via,
                'dias_pendiente' => (float) max($l->dias_pendiente, 1),
                'densidad_zona'  => (float) max($l->densidad_zona, 1),
                'score_ia'       => (float) $l->score_ia,
            ],
        ];
    }

    /** Reportes con datos_suficientes = false y el motivo registrado por el ETL. */
    private function construirSinSustento(Collection $reportes): array
    {
        if ($reportes->isEmpty()) return [];

        $motivos = DssEtlAnomalia::where('ejecucion_id', $this->ejecucionEtl->id)
            ->whereIn('reporte_id', $reportes->pluck('id'))
            ->where('tipo_anomalia', 'sin_analisis_ia')
            ->get()
            ->groupBy('reporte_id');

        return $reportes->map(fn ($r) => [
            'id'         => $r->id,
            'folio'      => $r->folio,
            'nombre_via' => $r->nombre_via,
            'colonia'    => $r->colonia?->nombre ?? '—',
            'estado'     => $r->estado,
            'motivo'     => $motivos->get($r->id)?->pluck('regla_aplicada')->implode(' ')
                            ?: 'El ETL marcó el reporte con datos insuficientes.',
        ])->values()->all();
    }

    public function sinSustento(): array
    {
        return $this->sinSustento;
    }

    /** Origen de los datos del último ranking calculado. */
    public function fuente(): array
    {
        if (!$this->ejecucionEtl) {
            return [
                'fuente'           => 'reportes_sin_etl',
                'ejecucion_etl_id' => null,
                'ejecucion_etl_at' => null,
                'aviso_fuente'     => 'No hay una ejecución ETL completada: el ranking usa los reportes sin depurar '
                                    . '(pueden incluir duplicados, coordenadas inválidas o datos faltantes). '
                                    . 'Ejecuta el ETL en la pestaña "Calidad de datos".',
            ];
        }

        return [
            'fuente'           => 'dss_reportes_limpios',
            'ejecucion_etl_id' => $this->ejecucionEtl->id,
            'ejecucion_etl_at' => $this->ejecucionEtl->finalizado_at?->toIso8601String(),
            'aviso_fuente'     => null,
        ];
    }

    // ── TOPSIS steps ─────────────────────────────────────────────────────────

    private function vectorNormalize(Collection $matrix): Collection
    {
        $keys  = array_keys($this->weights);
        $norms = collect($keys)->mapWithKeys(fn ($k) => [
            $k => sqrt($matrix->sum(fn ($row) => $row['raw'][$k] ** 2)),
        ]);

        return $matrix->map(fn ($row) => array_merge($row, [
            'normalized' => collect($row['raw'])
                ->map(fn ($v, $k) => $norms[$k] > 0 ? $v / $norms[$k] : 0)
                ->toArray(),
        ]));
    }

    private function applyWeights(Collection $normalized): Collection
    {
        return $normalized->map(fn ($row) => array_merge($row, [
            'weighted' => collect($row['normalized'])
                ->map(fn ($v, $k) => $v * $this->weights[$k])
                ->toArray(),
        ]));
    }

    private function idealSolutions(Collection $weighted): array
    {
        $keys = array_keys($this->weights);
        $best  = collect($keys)->mapWithKeys(fn ($k) => [$k => $weighted->max("weighted.$k")]);
        $worst = collect($keys)->mapWithKeys(fn ($k) => [$k => $weighted->min("weighted.$k")]);
        return [$best, $worst];
    }

    private function computeScore(array $row, $idealBest, $idealWorst): array
    {
        $dBest  = sqrt(collect($row['weighted'])->sum(fn ($v, $k) => ($v - $idealBest[$k]) ** 2));
        $dWorst = sqrt(collect($row['weighted'])->sum(fn ($v, $k) => ($v - $idealWorst[$k]) ** 2));
        $score  = ($dBest + $dWorst) > 0 ? $dWorst / ($dBest + $dWorst) : 0;

        $r = $row['reporte'];
        return [
            'id'            => $r->id,
            'folio'         => $r->folio,
            'nombre_via'    => $r->nombre_via,
            'colonia'       => $r->colonia?->nombre ?? '—',
            'municipio'     => $r->municipio?->nombre ?? '—',
            'estado'        => $r->estado,
            'prioridad'     => $r->prioridad,
            'latitud'       => $r->latitud,
            'longitud'      => $r->longitud,
            'descripcion'   => $r->descripcion,
            'fecha_reporte' => $r->fecha_reporte?->toIso8601String(),
            'foto'          => $r->fotos->first()?->storage_path
                ? '/storage/' . ltrim($r->fotos->first()->storage_path, '/')
                : ($r->fotos->first()?->url),
            'topsis_score'  => round($score * 100, 1),
            'd_mejor'       => round($dBest, 4),
            'd_peor'        => round($dWorst, 4),
            'criterios'     => [
                'severidad'      => round($row['raw']['severidad'], 2),
                'tipo_via'       => round($row['raw']['tipo_via'], 2),
                'dias_pendiente' => (int) $row['raw']['dias_pendiente'],
                'densidad_zona'  => (int) $row['raw']['densidad_zona'],
                'score_ia'       => round($row['raw']['score_ia'], 1),
            ],
            'ai_severidad'  => $r->aiAnalisis?->severidad_ia,
            'ai_confianza'  => $r->aiAnalisis?->confianza,
            'ai_prof_cm'    => $r->aiAnalisis?->profundidad_estimada_cm,
            'ai_area_m2'    => $r->aiAnalisis?->area_estimada_m2,
            // Módulo DSS: datos del ETL y desglose del cálculo para la explicación
            'num_reportes_fusionados' => ($row['limpio'] ?? null)?->num_reportes_fusionados ?? 1,
            // Colonia resuelta por el ETL (puede venir imputada); 'colonia' conserva el dato original
            'colonia_dss'      => isset($row['limpio']) ? $row['limpio']->colonia?->nombre : $r->colonia?->nombre,
            'colonia_imputada' => isset($row['limpio']) && $row['limpio']->colonia_id !== $r->colonia_id,
            'explicacion'   => [
                'criterios' => collect($this->weights)->map(fn ($peso, $k) => [
                    'crudo'          => round($row['raw'][$k], 4),
                    'normalizado'    => round($row['normalized'][$k], 4),
                    'peso'           => $peso,
                    'ponderado'      => round($row['weighted'][$k], 4),
                    'ideal_positivo' => round($idealBest[$k], 4),
                    'ideal_negativo' => round($idealWorst[$k], 4),
                ])->toArray(),
                'd_ideal_positivo' => round($dBest, 4),
                'd_ideal_negativo' => round($dWorst, 4),
                'score'            => round($score, 4),
            ],
        ];
    }

    // ── Zonas ─────────────────────────────────────────────────────────────────

    private function buildZonaSummary(Collection $grupo): array
    {
        $primera  = $grupo->first();
        $conteos  = $grupo->pluck('prioridad')->countBy()->toArray();
        $scoreProm = $grupo->avg('score_prioridad') ?? 0;

        $riesgo = (($conteos['critica'] ?? 0) * 3
                 + ($conteos['alta']    ?? 0) * 2
                 + ($conteos['media']   ?? 0) * 1) * 0.6
                 + $scoreProm * 0.004;

        return [
            'colonia_id'   => $primera->colonia_id,
            'colonia'      => $primera->colonia?->nombre ?? 'Sin colonia',
            'total'        => $grupo->count(),
            'criticos'     => $conteos['critica'] ?? 0,
            'altos'        => $conteos['alta']    ?? 0,
            'medios'       => $conteos['media']   ?? 0,
            'bajos'        => $conteos['baja']    ?? 0,
            'score_zona'   => round($scoreProm, 1),
            'riesgo'       => round($riesgo, 2),
        ];
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    public function pesos(): array
    {
        return $this->weights;
    }

    private function distanciaM(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2
              + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return 6371000 * 2 * asin(sqrt($a));
    }
}
