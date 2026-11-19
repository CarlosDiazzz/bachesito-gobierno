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

  public function topsis(Request $request): JsonResponse
{
    $datos = $request->validate([
        'escenario'  => 'nullable|in:equilibrado,rezago',
        'colonia_id' => 'nullable|integer|exists:colonias,id',
        'colonia'    => 'nullable|string|max:100',
        'estado'     => 'nullable|in:pendiente,validado,asignado,en_proceso',
        'severidad'  => 'nullable|in:alta,media,baja',
        'dias_min'   => 'nullable|integer|min:0|max:3650',
        'buscar'     => 'nullable|string|max:100',
    ]);

    $escenario = $datos['escenario'] ?? 'equilibrado';
    unset($datos['escenario']);

    $filtros = array_filter(
        $datos,
        fn ($valor) => $valor !== null && $valor !== ''
    );

    $this->topsis->usarEscenario($escenario);

    $ranking = $this->topsis->rankear($filtros);
    $zonas = $this->topsis->resumenZonas($filtros);

    return response()->json([
        'ranking' => $ranking,
        'zonas' => $zonas,
        'meta' => [
            'total' => count($ranking),
            'escenario' => $this->topsis->escenarioActual(),
            'pesos' => $this->topsis->pesos(),
            'escenarios' => $this->topsis->escenarios(),
            'filtros' => $filtros,
            'generado_at' => now()->toIso8601String(),
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
