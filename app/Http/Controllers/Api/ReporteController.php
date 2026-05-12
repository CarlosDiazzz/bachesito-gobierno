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

    public function storeCiudadano(Request $request)
    {
        $request->validate([
            'foto'               => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'latitud'            => 'required|numeric|between:-90,90',
            'longitud'           => 'required|numeric|between:-180,180',
            'nombre_via'         => 'nullable|string|max:255',
            'descripcion'        => 'nullable|string|max:1000',
            'direccion_aproximada' => 'nullable|string|max:500',
            'municipio_id'       => 'nullable|integer|exists:municipios,id',
            'location_source'    => 'nullable|in:exif,gps,manual',
        ]);

        $ciudadanoId = \App\Models\User::where('email', 'ciudadano@bachesito.gob.mx')->value('id') ?? 1;

        $reporte = Reporte::create([
            'ciudadano_id'        => $ciudadanoId,
            'latitud'             => $request->latitud,
            'longitud'            => $request->longitud,
            'nombre_via'          => $request->nombre_via ?? 'Sin nombre',
            'descripcion'         => $request->descripcion,
            'direccion_aproximada'=> $request->direccion_aproximada,
            'municipio_id'        => $request->municipio_id,
            'tipo_via'            => 'calle_secundaria',
            'fecha_reporte'       => now(),
        ]);

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

            try {
                $base64    = base64_encode(file_get_contents($file->getRealPath()));
                $resultado = $this->aiService->analizarImagen($base64, $file->getMimeType());
                $this->aiService->guardarAnalisis($reporte, $resultado);
                $reporte->load('aiAnalisis');
            } catch (\Throwable) {}
        }

        $this->scoreService->calcular($reporte->fresh(['aiAnalisis']));
        $reporte->load(['municipio:id,nombre', 'fotos']);

        return response()->json([
            'folio'      => $reporte->folio,
            'id'         => $reporte->id,
            'estado'     => $reporte->estado,
            'municipio'  => $reporte->municipio?->nombre,
            'nombre_via' => $reporte->nombre_via,
            'latitud'    => $reporte->latitud,
            'longitud'   => $reporte->longitud,
        ], 201);
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

    public function subirFoto(Request $request, Reporte $reporte)
    {
        $request->validate([
            'foto'        => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
            'tipo'        => 'nullable|in:ciudadano,verificacion,resolucion',
            're_analizar' => 'nullable|boolean',
        ]);

        $file  = $request->file('foto');
        $tipo  = $request->input('tipo', 'verificacion');

        // Guardar en storage/app/public/reportes/{id}/
        $nombre = now()->format('YmdHis') . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path   = $file->storeAs("reportes/{$reporte->id}", $nombre, 'public');
        $url    = Storage::url($path);

        // Si ya existía foto principal dejarla; si no, esta será la principal
        $esPrincipal = ! $reporte->fotos()->where('es_principal', true)->exists();
        $orden       = $reporte->fotos()->max('orden') + 1;

        $foto = ReporteFoto::create([
            'reporte_id'   => $reporte->id,
            'url'          => $url,
            'storage_path' => $path,
            'tipo'         => $tipo,
            'es_principal' => $esPrincipal,
            'orden'        => $orden,
        ]);

        $aiActualizado = null;

        // Re-analizar con IA si se solicita
        if (filter_var($request->input('re_analizar', false), FILTER_VALIDATE_BOOLEAN)) {
            $base64    = base64_encode(file_get_contents($file->getRealPath()));
            $resultado = $this->aiService->analizarImagen($base64, $file->getMimeType());
            $this->aiService->guardarAnalisis($reporte, $resultado);
            $reporte->load('aiAnalisis');
            $this->scoreService->calcular($reporte->fresh(['aiAnalisis']));

            $ai = $reporte->fresh(['aiAnalisis'])->aiAnalisis;
            $aiActualizado = $ai ? [
                'es_bache'                => $ai->es_bache,
                'confianza'               => $ai->confianza,
                'severidad_ia'            => $ai->severidad_ia,
                'profundidad_estimada_cm' => $ai->profundidad_estimada_cm,
                'area_estimada_m2'        => $ai->area_estimada_m2,
                'razon'                   => $ai->razon,
                'modelo_usado'            => $ai->modelo_usado,
            ] : null;
        }

        return response()->json([
            'foto' => [
                'id'          => $foto->id,
                'url'         => $foto->url,
                'tipo'        => $foto->tipo,
                'es_principal'=> $foto->es_principal,
                'orden'       => $foto->orden,
            ],
            'ai_actualizado'    => $aiActualizado,
            'score_prioridad'   => $reporte->fresh()->score_prioridad,
            'prioridad'         => $reporte->fresh()->prioridad,
        ], 201);
    }

    public function eliminarFoto(Reporte $reporte, ReporteFoto $foto)
    {
        if ($foto->reporte_id !== $reporte->id) {
            return response()->json(['message' => 'Foto no pertenece a este reporte.'], 403);
        }

        // Eliminar archivo del disco
        if ($foto->storage_path && Storage::disk('public')->exists($foto->storage_path)) {
            Storage::disk('public')->delete($foto->storage_path);
        }

        $eraFotoPrincipal = $foto->es_principal;
        $foto->delete();

        // Si era la principal, asignar la siguiente disponible
        if ($eraFotoPrincipal) {
            $reporte->fotos()->orderBy('orden')->first()?->update(['es_principal' => true]);
        }

        return response()->json(['message' => 'Foto eliminada correctamente.']);
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
