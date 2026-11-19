<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use App\Services\Dss\IndicadoresService;
use App\Services\Dss\RecomendacionService;
use App\Services\TopsisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalisisController extends Controller
{
    public function __construct(
        private TopsisService $topsis,
        private AiService     $ai,
        private RecomendacionService $recomendacion,
        private IndicadoresService $indicadores,
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
        'presupuesto' => 'nullable|numeric|min:0|max:1000000000',
    ]);

    $escenario = $datos['escenario'] ?? 'equilibrado';
    $presupuesto = isset($datos['presupuesto']) && $datos['presupuesto'] !== ''
        ? (float) $datos['presupuesto']
        : null;
    unset($datos['escenario'], $datos['presupuesto']);

    $filtros = array_filter(
        $datos,
        fn ($valor) => $valor !== null && $valor !== ''
    );

    $this->topsis->usarEscenario($escenario);

    $ranking = $this->topsis->rankear($filtros);
    $zonas = $this->topsis->resumenZonas($filtros);

    // Módulo DSS: costo, decisión por presupuesto y explicación por bache
    $recomendacion = $this->recomendacion->aplicar($ranking, $presupuesto);
    $ranking = $recomendacion['ranking'];
    $fuente = $this->topsis->fuente();

    return response()->json([
        'ranking' => $ranking,
        'zonas' => $zonas,
        'sin_sustento' => $this->topsis->sinSustento(),
        'indicadores' => $this->indicadores->calcular(
            $ranking, $recomendacion['meta'], $fuente, count($this->topsis->sinSustento())
        ),
        'meta' => [
            ...$fuente,
            ...$this->indicadores->estadoEtl($fuente['ejecucion_etl_id']),
            ...$recomendacion['meta'],
            'num_sin_sustento' => count($this->topsis->sinSustento()),
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
