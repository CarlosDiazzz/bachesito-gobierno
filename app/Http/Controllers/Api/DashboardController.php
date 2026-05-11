<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Services\ReporteService;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService,
        private ReporteService   $reporteService,
    ) {}

    public function stats()
    {
        return response()->json($this->dashboardService->stats());
    }

    public function criticos()
    {
        $reportes = $this->reporteService->listar([
            'prioridad' => 'critica',
        ], 5)->getCollection()
             ->map(fn ($r) => $this->reporteService->formato($r))
             ->values();

        return response()->json($reportes);
    }

    public function recientes()
    {
        $reportes = $this->reporteService->listar([], 6)->getCollection()
             ->map(fn ($r) => $this->reporteService->formato($r))
             ->values();

        return response()->json($reportes);
    }
}
