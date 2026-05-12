<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReparadorService;
use Illuminate\Support\Facades\DB;

class ReparadorController extends Controller
{
    public function __construct(private ReparadorService $service) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function show(int $id)
    {
        $user = User::findOrFail($id);

        // Verificar que es reparador o supervisor
        $esPersonal = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $id)
            ->whereIn('roles.name', ['reparador', 'supervisor'])
            ->exists();

        if (! $esPersonal) {
            return response()->json(['message' => 'Usuario no es personal de campo.'], 404);
        }

        return response()->json($this->service->detalle($user));
    }

    public function asignaciones()
    {
        return response()->json($this->service->asignacionesRecientes());
    }
}
