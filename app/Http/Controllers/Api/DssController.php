<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DssEtlAnomalia;
use App\Models\DssEtlEjecucion;
use App\Services\Dss\EtlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Módulo DSS (Proyecto Integrador DSTD): ETL y calidad de datos.
class DssController extends Controller
{
    public function __construct(private EtlService $etl) {}

    public function ultimaEjecucion(): JsonResponse
    {
        $ejecucion = DssEtlEjecucion::with('ejecutadoPor:id,name')
            ->latest('id')
            ->first();

        return response()->json([
            'ejecucion' => $ejecucion ? $this->resumen($ejecucion) : null,
        ]);
    }

    public function anomalias(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'ejecucion_id' => 'nullable|integer|exists:dss_etl_ejecuciones,id',
            'tipo' => ['nullable', Rule::in(DssEtlAnomalia::TIPOS)],
            'severidad' => 'nullable|in:error,advertencia',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);

        $ejecucionId = $datos['ejecucion_id']
            ?? DssEtlEjecucion::latest('id')->value('id');

        $paginado = DssEtlAnomalia::with('reporte:id,folio')
            ->where('ejecucion_id', $ejecucionId)
            ->when($datos['tipo'] ?? null, fn ($q, $tipo) => $q->where('tipo_anomalia', $tipo))
            ->when($datos['severidad'] ?? null, fn ($q, $sev) => $q->where('severidad', $sev))
            ->orderBy('id')
            ->paginate($datos['per_page'] ?? 20)
            ->through(fn (DssEtlAnomalia $a) => [
                'id' => $a->id,
                'reporte_id' => $a->reporte_id,
                'folio' => $a->reporte?->folio,
                'tipo_anomalia' => $a->tipo_anomalia,
                'campo' => $a->campo,
                'valor_original' => $a->valor_original,
                'accion_tomada' => $a->accion_tomada,
                'regla_aplicada' => $a->regla_aplicada,
                'severidad' => $a->severidad,
            ]);

        return response()->json($paginado);
    }

    public function ejecutar(Request $request): JsonResponse
    {
        $ejecucion = $this->etl->ejecutar($request->user()?->id);
        $ejecucion->load('ejecutadoPor:id,name');

        return response()->json(
            ['ejecucion' => $this->resumen($ejecucion)],
            $ejecucion->estado === 'fallido' ? 500 : 200
        );
    }

    private function resumen(DssEtlEjecucion $e): array
    {
        return [
            'id' => $e->id,
            'estado' => $e->estado,
            'iniciado_at' => $e->iniciado_at?->toIso8601String(),
            'finalizado_at' => $e->finalizado_at?->toIso8601String(),
            'ejecutado_por' => $e->ejecutadoPor?->name,
            'registros_leidos' => $e->registros_leidos,
            'registros_cargados' => $e->registros_cargados,
            'registros_descartados' => $e->registros_descartados,
            'registros_con_advertencia' => $e->registros_con_advertencia,
            'tasa_calidad' => $e->tasaCalidad(),
            'mensaje_error' => $e->mensaje_error,
            'anomalias_por_tipo' => $e->conteoPorTipo(),
        ];
    }
}
