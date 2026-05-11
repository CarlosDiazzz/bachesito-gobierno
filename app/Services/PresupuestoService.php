<?php

namespace App\Services;

use App\Models\Presupuesto;
use Illuminate\Support\Collection;

class PresupuestoService
{
    public function resumenAnual(int $anio, ?int $municipioId = null): array
    {
        $q = Presupuesto::where('anio', $anio);
        if ($municipioId) $q->where('municipio_id', $municipioId);

        $total    = (clone $q)->where('tipo', 'asignado')->sum('monto');
        $ejercido = (clone $q)->where('tipo', 'ejercido')->sum('monto');

        return [
            'total'      => (float) $total,
            'ejercido'   => (float) $ejercido,
            'disponible' => (float) ($total - $ejercido),
            'porcentaje' => $total > 0 ? round(($ejercido / $total) * 100, 1) : 0,
        ];
    }

    public function porMes(int $anio, ?int $municipioId = null): Collection
    {
        $meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

        $q = Presupuesto::selectRaw('mes, tipo, SUM(monto) as total')
            ->where('anio', $anio)
            ->whereIn('tipo', ['asignado', 'ejercido'])
            ->groupBy('mes', 'tipo');

        if ($municipioId) $q->where('municipio_id', $municipioId);

        $raw = $q->get()->groupBy('mes');

        return collect(range(1, 12))->map(function ($m) use ($raw, $meses) {
            $rows     = $raw->get($m, collect());
            $asignado = $rows->firstWhere('tipo', 'asignado')?->total ?? 0;
            $ejercido = $rows->firstWhere('tipo', 'ejercido')?->total ?? 0;
            return [
                'mes'      => $meses[$m - 1],
                'asignado' => (float) $asignado,
                'ejercido' => (float) $ejercido,
            ];
        })->filter(fn ($m) => $m['asignado'] > 0 || $m['ejercido'] > 0)->values();
    }

    public function listar(int $anio, ?int $municipioId = null)
    {
        $q = Presupuesto::with(['dependencia:id,nombre', 'municipio:id,nombre', 'registradoPor:id,name'])
            ->where('anio', $anio)
            ->orderBy('mes')
            ->orderBy('created_at', 'desc');

        if ($municipioId) $q->where('municipio_id', $municipioId);

        return $q->get();
    }
}
