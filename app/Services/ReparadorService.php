<?php

namespace App\Services;

use App\Models\User;
use App\Models\Asignacion;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReparadorService
{
    public function listar(): array
    {
        $ids = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->whereIn('roles.name', ['reparador', 'supervisor'])
            ->pluck('user_roles.user_id');

        return User::whereIn('id', $ids)
            ->get()
            ->map(fn ($u) => $this->formato($u))
            ->toArray();
    }

    public function formato(User $user): array
    {
        $asignados = Asignacion::where('asignado_a', $user->id)
            ->whereIn('estado', ['pendiente', 'aceptada', 'en_proceso'])
            ->count();
        $resueltos = Asignacion::where('asignado_a', $user->id)
            ->where('estado', 'completada')
            ->count();

        $rol = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $user->id)
            ->value('roles.name');

        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'status'    => $user->status ?? 'activo',
            'rol'       => $rol ?? 'reparador',
            'asignados' => $asignados,
            'resueltos' => $resueltos,
        ];
    }

    public function detalle(User $user): array
    {
        $base = $this->formato($user);

        // ── Stats completos ──────────────────────────────────────────────
        $enProceso  = Asignacion::where('asignado_a', $user->id)->where('estado', 'en_proceso')->count();
        $canceladas = Asignacion::where('asignado_a', $user->id)->where('estado', 'cancelada')->count();
        $total      = Asignacion::where('asignado_a', $user->id)->count();

        // Tiempo promedio de resolución (días)
        $tiempoPromedio = Asignacion::where('asignado_a', $user->id)
            ->where('estado', 'completada')
            ->whereNotNull('fecha_asignacion')
            ->whereNotNull('fecha_completada')
            ->selectRaw('AVG(CAST((julianday(fecha_completada) - julianday(fecha_asignacion)) AS REAL)) as promedio')
            ->value('promedio');

        // Score promedio de reportes atendidos
        $scorePromedio = DB::table('asignaciones as a')
            ->join('reportes as r', 'r.id', '=', 'a.reporte_id')
            ->where('a.asignado_a', $user->id)
            ->whereNotNull('r.score_prioridad')
            ->avg('r.score_prioridad');

        // ── Asignaciones activas con detalle del reporte ─────────────────
        $activas = Asignacion::with([
            'reporte:id,folio,nombre_via,estado,prioridad,score_prioridad,colonia_id,latitud,longitud',
            'reporte.colonia:id,nombre',
        ])
        ->where('asignado_a', $user->id)
        ->whereIn('estado', ['pendiente', 'aceptada', 'en_proceso'])
        ->orderByDesc('fecha_asignacion')
        ->get()
        ->map(fn ($a) => [
            'id'               => $a->id,
            'reporte_id'       => $a->reporte_id,
            'folio'            => $a->reporte?->folio,
            'nombre_via'       => $a->reporte?->nombre_via,
            'colonia'          => $a->reporte?->colonia?->nombre,
            'estado_reporte'   => $a->reporte?->estado,
            'prioridad'        => $a->reporte?->prioridad,
            'score'            => $a->reporte?->score_prioridad,
            'estado_asignacion'=> $a->estado,
            'notas'            => $a->notas_asignacion,
            'fecha_asignacion' => $a->fecha_asignacion?->toIso8601String(),
            'dias_activo'      => $a->fecha_asignacion
                ? (int) $a->fecha_asignacion->diffInDays(now())
                : null,
        ])
        ->toArray();

        // ── Historial completados (últimos 10) ───────────────────────────
        $historial = Asignacion::with([
            'reporte:id,folio,nombre_via,prioridad,score_prioridad',
        ])
        ->where('asignado_a', $user->id)
        ->where('estado', 'completada')
        ->orderByDesc('fecha_completada')
        ->limit(10)
        ->get()
        ->map(fn ($a) => [
            'id'               => $a->id,
            'reporte_id'       => $a->reporte_id,
            'folio'            => $a->reporte?->folio,
            'nombre_via'       => $a->reporte?->nombre_via,
            'prioridad'        => $a->reporte?->prioridad,
            'score'            => $a->reporte?->score_prioridad,
            'fecha_asignacion' => $a->fecha_asignacion?->toIso8601String(),
            'fecha_completada' => $a->fecha_completada?->toIso8601String(),
            'dias_resolucion'  => ($a->fecha_asignacion && $a->fecha_completada)
                ? (int) $a->fecha_asignacion->diffInDays($a->fecha_completada)
                : null,
        ])
        ->toArray();

        // ── Actividad mensual (últimos 6 meses) ──────────────────────────
        $meses = collect(range(5, 0))->map(function ($offset) use ($user) {
            $inicio = now()->startOfMonth()->subMonths($offset);
            $fin    = (clone $inicio)->endOfMonth();
            $mes    = $inicio->locale('es')->isoFormat('MMM');

            $completados = Asignacion::where('asignado_a', $user->id)
                ->where('estado', 'completada')
                ->whereBetween('fecha_completada', [$inicio, $fin])
                ->count();

            $recibidos = Asignacion::where('asignado_a', $user->id)
                ->whereBetween('fecha_asignacion', [$inicio, $fin])
                ->count();

            return ['mes' => ucfirst($mes), 'completados' => $completados, 'recibidos' => $recibidos];
        })->toArray();

        // ── Dependencia ──────────────────────────────────────────────────
        $dependencia = DB::table('user_dependencias as ud')
            ->join('dependencias as d', 'd.id', '=', 'ud.dependencia_id')
            ->where('ud.user_id', $user->id)
            ->value('d.nombre');

        return array_merge($base, [
            'en_proceso'       => $enProceso,
            'canceladas'       => $canceladas,
            'total'            => $total,
            'tiempo_promedio'  => round((float) $tiempoPromedio, 1),
            'score_promedio'   => round((float) $scorePromedio, 1),
            'dependencia'      => $dependencia,
            'activas'          => $activas,
            'historial'        => $historial,
            'actividad_meses'  => $meses,
        ]);
    }

    public function asignacionesRecientes(int $limit = 10): array
    {
        return Asignacion::with([
            'reporte:id,folio,nombre_via,estado',
            'asignadoA:id,name',
        ])
        ->whereIn('estado', ['pendiente', 'aceptada', 'en_proceso'])
        ->orderByDesc('fecha_asignacion')
        ->limit($limit)
        ->get()
        ->map(fn ($a) => [
            'id'               => $a->id,
            'folio'            => $a->reporte?->folio,
            'nombre_via'       => $a->reporte?->nombre_via,
            'estado_reporte'   => $a->reporte?->estado,
            'reparador'        => $a->asignadoA?->name,
            'estado'           => $a->estado,
            'fecha_asignacion' => $a->fecha_asignacion?->toIso8601String(),
        ])
        ->toArray();
    }
}
