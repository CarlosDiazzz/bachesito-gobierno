<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\PresupuestoController;
use App\Http\Controllers\Api\ReparadorController;
use App\Http\Controllers\Api\MexicoController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\GaleriaController;
use App\Http\Controllers\Api\UbicacionController;

// Públicas
Route::post('/auth/login',           [AuthController::class,  'login']);
Route::post('/ai/preanalizar',       [AiController::class,    'preanalizar']);
Route::get('/reportes/mapa',                           [ReporteController::class, 'mapa']);
Route::get('/reportes/cercanos',                       [ReporteController::class, 'cercanos']);
Route::post('/ai/zona',                                [AiController::class,    'analizarZona']);
Route::post('/reportes/ciudadano',                     [ReporteController::class, 'storeCiudadano']);
Route::post('/reportes/{reporte}/fotos/ciudadano',     [ReporteController::class, 'agregarFotoCiudadano']);

// Autenticadas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',     [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard/stats',    [DashboardController::class, 'stats']);
    Route::get('/dashboard/criticos', [DashboardController::class, 'criticos']);
    Route::get('/dashboard/recientes',[DashboardController::class, 'recientes']);

    // Reportes
    Route::get('/reportes',                     [ReporteController::class, 'index']);
    Route::post('/reportes',                    [ReporteController::class, 'store']);
    Route::get('/reportes/{reporte}',           [ReporteController::class, 'show']);
    Route::patch('/reportes/{reporte}/estado',           [ReporteController::class, 'updateEstado']);
    Route::post('/reportes/{reporte}/asignar',           [ReporteController::class, 'asignar']);
    Route::post('/reportes/{reporte}/fotos',             [ReporteController::class, 'subirFoto']);
    Route::delete('/reportes/{reporte}/fotos/{foto}',    [ReporteController::class, 'eliminarFoto']);
    Route::get('/galeria', [GaleriaController::class, 'index']);
    Route::post('/galeria', [GaleriaController::class, 'store']);

    // Presupuestos
    Route::get('/presupuestos',                    [PresupuestoController::class, 'index']);
    Route::post('/presupuestos',                   [PresupuestoController::class, 'store']);
    Route::patch('/presupuestos/{presupuesto}',    [PresupuestoController::class, 'update']);
    Route::delete('/presupuestos/{presupuesto}',   [PresupuestoController::class, 'destroy']);

    // Reparadores
    Route::get('/reparadores',              [ReparadorController::class, 'index']);
    Route::get('/reparadores/asignaciones', [ReparadorController::class, 'asignaciones']);
    Route::get('/reparadores/{id}',         [ReparadorController::class, 'show']);
    Route::get('/ubicacion/sugerir',       [UbicacionController::class, 'sugerir']);
});

// Catálogos — public
Route::get('/ping',                          fn () => response()->json(['status' => 'ok', 'proyecto' => 'BachesITO', 'version' => '1.0.0']));
Route::get('/estados',                       [MexicoController::class, 'estados']);
Route::get('/municipios',                    [MexicoController::class, 'municipios']);
Route::get('/municipios/{id}/colonias',      [MexicoController::class, 'colonias']);
Route::get('/colonias/buscar',               [MexicoController::class, 'buscarPorCp']);
