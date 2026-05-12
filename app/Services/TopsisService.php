<?php

namespace App\Services;

use App\Models\Reporte;
use Illuminate\Support\Collection;

class TopsisService
{
    // Pesos multicriterio — suma = 1.0
    private array $weights = [
        'severidad'      => 0.30,
        'tipo_via'       => 0.25,
        'dias_pendiente' => 0.20,
        'densidad_zona'  => 0.15,
        'score_ia'       => 0.10,
    ];

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

    public function rankear(): array
    {
        $reportes = Reporte::with([
            'aiAnalisis',
            'colonia:id,nombre',
            'municipio:id,nombre',
            'fotos',
        ])->whereIn('estado', $this->estadosActivos)->get();

        if ($reportes->isEmpty()) return [];

        $matrix     = $reportes->map(fn ($r) => $this->buildRow($r, $reportes));
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

    public function resumenZonas(): array
    {
        $reportes = Reporte::with(['colonia:id,nombre', 'aiAnalisis'])
            ->whereIn('estado', $this->estadosActivos)
            ->get();

        return $reportes
            ->groupBy('colonia_id')
            ->map(fn ($grupo) => $this->buildZonaSummary($grupo))
            ->sortByDesc('riesgo')
            ->values()
            ->toArray();
    }

    // ── Construcción de la matriz ─────────────────────────────────────────────

    private function buildRow(Reporte $r, Collection $todos): array
    {
        $dias = (int) now()->diffInDays($r->fecha_reporte ?? now());

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
