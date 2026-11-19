<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UbicacionService;
use Illuminate\Http\Request;

class UbicacionController extends Controller
{
    public function __construct(private UbicacionService $ubicacion) {}

    public function sugerir(Request $request)
    {
        $data = $request->validate([
            'latitud'  => 'required|numeric|between:-90,90',
            'longitud' => 'required|numeric|between:-180,180',
        ]);

        return response()->json(
            $this->ubicacion->sugerir((float) $data['latitud'], (float) $data['longitud'])
        );
    }
}
