<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReporteRequest;
use App\Http\Requests\UpdateReporteRequest;
use App\Http\Requests\AsignarReporteRequest;
use App\Models\Reporte;
use App\Services\ReporteService;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function __construct(private ReporteService $service) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'estado', 'prioridad', 'municipio_id']);
        $perPage = min((int) $request->get('per_page', 20), 100);

        $paginated = $this->service->listar($filters, $perPage);

        return response()->json([
            'data'  => $paginated->getCollection()->map(fn ($r) => $this->service->formato($r))->values(),
            'meta'  => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    public function show(Reporte $reporte)
    {
        $reporte->load(['ciudadano:id,name', 'colonia:id,nombre', 'municipio:id,nombre', 'fotos', 'asignaciones.asignadoA:id,name']);
        return response()->json($this->service->formato($reporte));
    }

    public function store(StoreReporteRequest $request)
    {
        $reporte = Reporte::create(array_merge(
            $request->validated(),
            [
                'ciudadano_id'  => $request->user()->id,
                'fecha_reporte' => now(),
            ]
        ));

        $reporte->load(['ciudadano:id,name', 'colonia:id,nombre', 'municipio:id,nombre', 'fotos']);

        return response()->json($this->service->formato($reporte), 201);
    }

    public function updateEstado(UpdateReporteRequest $request, Reporte $reporte)
    {
        $reporte = $this->service->actualizarEstado(
            $reporte,
            $request->estado,
            $request->user()->id,
            $request->notas
        );

        $reporte->load(['ciudadano:id,name', 'colonia:id,nombre', 'municipio:id,nombre', 'fotos']);

        return response()->json($this->service->formato($reporte));
    }

    public function asignar(AsignarReporteRequest $request, Reporte $reporte)
    {
        $asignacion = $this->service->asignar(
            $reporte,
            $request->reparador_id,
            $request->user()->id,
            $request->notas_asignacion
        );

        return response()->json([
            'message'    => 'Reporte asignado correctamente.',
            'asignacion' => $asignacion,
        ]);
    }

    public function mapa(Request $request)
    {
        $filters = $request->only(['estado', 'prioridad', 'municipio_id']);

        $reportes = $this->service->listar($filters, 500)->getCollection()
            ->map(fn ($r) => $this->service->formato($r))
            ->values();

        return response()->json($reportes);
    }
}
