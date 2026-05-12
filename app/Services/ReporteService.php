<?php

namespace App\Services;

use App\Models\Reporte;
use App\Models\HistorialEstado;
use App\Models\Asignacion;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReporteService
{
    public function listar(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $q = Reporte::with([
            'ciudadano:id,name',
            'colonia:id,nombre',
            'municipio:id,nombre',
            'fotos',
        ]);

        if ($search = $filters['search'] ?? null) {
            $q->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                  ->orWhere('nombre_via', 'like', "%{$search}%")
                  ->orWhereHas('colonia', fn ($q) => $q->where('nombre', 'like', "%{$search}%"));
            });
        }

        if ($estado = $filters['estado'] ?? null) {
            $q->where('estado', $estado);
        }

        if ($prioridad = $filters['prioridad'] ?? null) {
            $q->where('prioridad', $prioridad);
        }

        if ($municipioId = $filters['municipio_id'] ?? null) {
            $q->where('municipio_id', $municipioId);
        }

        return $q->orderByDesc('score_prioridad')
                 ->orderByDesc('fecha_reporte')
                 ->paginate($perPage);
    }

    private function fotoUrl(?\App\Models\ReporteFoto $foto): ?string
    {
        if (!$foto) return null;

        // Siempre reconstruir desde storage_path: devuelve URL relativa /storage/...
        // para que funcione tanto en local como vía proxy (ngrok, etc.)
        if ($foto->storage_path) {
            return '/storage/' . ltrim($foto->storage_path, '/');
        }

        // Fallback: convertir URL absoluta a relativa si es del mismo dominio
        if ($foto->url) {
            $appUrl = rtrim(config('app.url'), '/');
            return str_starts_with($foto->url, $appUrl)
                ? substr($foto->url, strlen($appUrl))
                : $foto->url;
        }

        return null;
    }

    public function formato(Reporte $reporte): array
    {
        $fotosOrdenadas = $reporte->fotos->sortBy('orden');
        $foto = $this->fotoUrl($fotosOrdenadas->first())
            ?? "https://placehold.co/400x300/9099B8/white?text=Sin+Foto";

        return [
            'id'               => $reporte->id,
            'folio'            => $reporte->folio,
            'estado'           => $reporte->estado,
            'prioridad'        => $reporte->prioridad,
            'score_prioridad'  => $reporte->score_prioridad ?? 0,
            'nombre_via'       => $reporte->nombre_via,
            'colonia'          => $reporte->colonia?->nombre ?? '—',
            'municipio'        => $reporte->municipio?->nombre ?? '—',
            'latitud'          => (float) $reporte->latitud,
            'longitud'         => (float) $reporte->longitud,
            'descripcion'      => $reporte->descripcion,
            'ciudadano'        => $reporte->ciudadano?->name ?? '—',
            'fecha_reporte'    => $reporte->fecha_reporte?->toIso8601String(),
            'foto'             => $foto,
            'fotos'            => $fotosOrdenadas->map(fn ($f) => $this->fotoUrl($f))->filter()->values()->toArray(),
            'tipo_via'         => $reporte->tipo_via,
            'direccion_aproximada' => $reporte->direccion_aproximada,
        ];
    }

    public function actualizarEstado(Reporte $reporte, string $nuevoEstado, int $userId, ?string $notas = null): Reporte
    {
        $estadoAnterior = $reporte->estado;

        $reporte->update([
            'estado'           => $nuevoEstado,
            'fecha_resolucion' => in_array($nuevoEstado, ['resuelto', 'cerrado']) ? now() : $reporte->fecha_resolucion,
        ]);

        HistorialEstado::create([
            'reporte_id'      => $reporte->id,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo'    => $nuevoEstado,
            'user_id'         => $userId,
            'motivo'          => $notas,
        ]);

        return $reporte->fresh();
    }

    public function asignar(Reporte $reporte, int $reparadorId, int $asignadoPorId, ?string $notas = null): Asignacion
    {
        $dependenciaId = DB::table('user_dependencias')
            ->where('user_id', $reparadorId)
            ->value('dependencia_id');

        $asignacion = Asignacion::create([
            'reporte_id'        => $reporte->id,
            'asignado_a'        => $reparadorId,
            'asignado_por'      => $asignadoPorId,
            'dependencia_id'    => $dependenciaId ?? $reporte->dependencia_id,
            'estado'            => 'pendiente',
            'notas_asignacion'  => $notas,
            'fecha_asignacion'  => now(),
        ]);

        $this->actualizarEstado($reporte, 'asignado', $asignadoPorId, $notas);

        return $asignacion;
    }
}
