<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use App\Services\TopsisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalisisController extends Controller
{
    public function __construct(
        private TopsisService $topsis,
        private AiService     $ai,
    ) {}

    public function topsis(): JsonResponse
    {
        $ranking = $this->topsis->rankear();
        $zonas   = $this->topsis->resumenZonas();

        return response()->json([
            'ranking'      => $ranking,
            'zonas'        => $zonas,
            'meta'         => [
                'total'        => count($ranking),
                'pesos'        => $this->topsis->pesos(),
                'generado_at'  => now()->toIso8601String(),
            ],
        ]);
    }

    public function iaRecomendacion(Request $request): JsonResponse
    {
        $request->validate([
            'ranking' => 'required|array|min:1',
            'zonas'   => 'nullable|array',
        ]);

        $resultado = $this->ai->generarRecomendacion(
            $request->input('ranking'),
            $request->input('zonas', [])
        );

        return response()->json($resultado);
    }
}
