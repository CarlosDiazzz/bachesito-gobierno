<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReporteRequest;
use App\Http\Requests\UpdateReporteRequest;
use App\Http\Requests\AsignarReporteRequest;
use App\Models\Reporte;
use App\Models\ReporteFoto;
use App\Services\ReporteService;
use App\Services\AiService;
use App\Services\ScoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReporteController extends Controller
{
    public function __construct(
        private ReporteService $service,
        private AiService      $aiService,
        private ScoreService   $scoreService,
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'estado', 'prioridad', 'municipio_id']);
        $perPage = min((int) $request->get('per_page', 20), 100);

        $paginated = $this->service->listar($filters, $perPage);

        return response()->json([
            'data' => $paginated->getCollection()
                ->map(fn ($r) => $this->service->formato($r))
                ->values(),
            'meta' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    public function show(Reporte $reporte)
    {
        $reporte->load([
            'ciudadano:id,name,email',
            'colonia:id,nombre',
            'municipio:id,nombre',
            'fotos',
            'aiAnalisis',
            'scoreDetalle',
            'asignaciones.asignadoA:id,name',
            'historialEstados.user:id,name',
        ]);

        return response()->json([
            ...$this->service->formato($reporte),
            'fotos'          => $reporte->fotos->map(fn ($f) => ['id' => $f->id, 'url' => $f->url, 'tipo' => $f->tipo, 'es_principal' => $f->es_principal]),
            'ai'             => $reporte->aiAnalisis ? [
                'es_bache'                => $reporte->aiAnalisis->es_bache,
                'confianza'               => $reporte->aiAnalisis->confianza,
                'severidad_ia'            => $reporte->aiAnalisis->severidad_ia,
                'profundidad_estimada_cm' => $reporte->aiAnalisis->profundidad_estimada_cm,
                'area_estimada_m2'        => $reporte->aiAnalisis->area_estimada_m2,
                'razon'                   => $reporte->aiAnalisis->razon,
                'modelo_usado'            => $reporte->aiAnalisis->modelo_usado,
            ] : null,
            'score_detalle'  => $reporte->scoreDetalle,
            'asignaciones'   => $reporte->asignaciones->map(fn ($a) => [
                'id'               => $a->id,
                'reparador'        => $a->asignadoA?->name,
                'estado'           => $a->estado,
                'fecha_asignacion' => $a->fecha_asignacion?->toIso8601String(),
                'notas'            => $a->notas_asignacion,
            ]),
            'historial'      => $reporte->historialEstados->map(fn ($h) => [
                'estado_anterior' => $h->estado_anterior,
                'estado_nuevo'    => $h->estado_nuevo,
                'user'            => $h->user?->name,
                'motivo'          => $h->motivo,
                'fecha'           => $h->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(StoreReporteRequest $request)
    {
        // 1. Crear reporte
        $reporte = Reporte::create(array_merge(
            $request->validated(),
            [
                'ciudadano_id'  => $request->user()->id,
                'fecha_reporte' => now(),
            ]
        ));

        // 2. Guardar foto si viene en el request
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $path = $file->store("reportes/{$reporte->id}", 'public');
            $url  = Storage::url($path);

            ReporteFoto::create([
                'reporte_id'   => $reporte->id,
                'url'          => $url,
                'storage_path' => $path,
                'tipo'         => 'ciudadano',
                'es_principal' => true,
                'orden'        => 0,
            ]);

            // 3. Análisis AI con la foto
            $base64    = base64_encode(file_get_contents($file->getRealPath()));
            $resultado = $this->aiService->analizarImagen($base64, $file->getMimeType());
            $this->aiService->guardarAnalisis($reporte, $resultado);

            // 4. Calcular score con resultado AI
            $reporte->load('aiAnalisis');
        }

        // 5. Calcular score de prioridad
        $this->scoreService->calcular($reporte->fresh(['aiAnalisis']));

        $reporte->load(['ciudadano:id,name', 'colonia:id,nombre', 'municipio:id,nombre', 'fotos', 'aiAnalisis']);

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
        $filters  = $request->only(['estado', 'prioridad', 'municipio_id']);
        $reportes = $this->service->listar($filters, 500)
            ->getCollection()
            ->map(fn ($r) => $this->service->formato($r))
            ->values();

        return response()->json($reportes);
    }
}
