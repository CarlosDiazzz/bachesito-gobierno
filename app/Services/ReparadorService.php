<?php

namespace App\Services;

use App\Models\User;
use App\Models\Asignacion;
use Illuminate\Support\Facades\DB;

class ReparadorService
{
    public function listar(): array
    {
        $reparadorIds = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->whereIn('roles.name', ['reparador', 'supervisor'])
            ->pluck('user_roles.user_id');

        return User::whereIn('id', $reparadorIds)
            ->get()
            ->map(fn ($u) => $this->formato($u))
            ->toArray();
    }

    public function formato(User $user): array
    {
        $asignados  = Asignacion::where('asignado_a', $user->id)
                                ->whereIn('estado', ['pendiente', 'aceptada', 'en_proceso'])
                                ->count();
        $resueltos  = Asignacion::where('asignado_a', $user->id)
                                ->where('estado', 'completada')
                                ->count();

        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'status'    => $user->status ?? 'activo',
            'asignados' => $asignados,
            'resueltos' => $resueltos,
        ];
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
