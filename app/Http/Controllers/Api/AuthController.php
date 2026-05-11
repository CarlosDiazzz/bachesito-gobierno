<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        $user = User::with(['roles.permissions', 'municipio', 'dependencias'])->find(Auth::id());
        $user->update(['last_login_at' => now()]);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'ok',
            'user'    => $this->formatUser($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = User::with(['roles.permissions', 'municipio', 'dependencias'])->find($request->user()->id);

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
        $permissions = [];
        foreach ($user->roles as $role) {
            foreach ($role->permissions as $perm) {
                $permissions[] = $perm->name;
            }
        }

        return [
            'id'                   => $user->id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'avatar_url'           => $user->avatar_url,
            'status'               => $user->status,
            'puntos_civicos_total' => $user->puntos_civicos_total,
            'municipio'            => $user->municipio?->nombre ?? null,
            'roles'                => $user->roles->pluck('name')->toArray(),
            'permissions'          => array_values(array_unique($permissions)),
            'dependencias'         => $user->dependencias->pluck('nombre')->toArray(),
        ];
    }
}
