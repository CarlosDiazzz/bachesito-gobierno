<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        $user = User::with(['municipio', 'dependencias'])->find(Auth::id());
        $user->update(['last_login_at' => now()]);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'ok',
            'user'    => $this->formatUser($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = User::with(['municipio', 'dependencias'])->find($request->user()->id);

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    private function formatUser(User $user): array
    {
        // Query roles directly — user_roles has no created_at/updated_at (withTimestamps fails)
        $roles = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $user->id)
            ->pluck('roles.name')
            ->toArray();

        // Query permissions via role_permissions (no timestamps either)
        $roleIds = DB::table('user_roles')
            ->where('user_id', $user->id)
            ->pluck('role_id')
            ->toArray();

        $permissions = [];
        if (!empty($roleIds)) {
            $permissions = DB::table('role_permissions')
                ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->whereIn('role_permissions.role_id', $roleIds)
                ->pluck('permissions.name')
                ->unique()
                ->values()
                ->toArray();
        }

        return [
            'id'                   => $user->id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'avatar_url'           => $user->avatar_url,
            'status'               => $user->status,
            'puntos_civicos_total' => $user->puntos_civicos_total,
            'municipio'            => $user->municipio?->nombre ?? null,
            'roles'                => $roles,
            'permissions'          => $permissions,
            'dependencias'         => $user->dependencias->pluck('nombre')->toArray(),
        ];
    }
}
