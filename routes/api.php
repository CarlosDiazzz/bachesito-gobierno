<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

Route::get('/ping', fn() => response()->json(['status' => 'ok', 'proyecto' => 'BachesITO', 'version' => '1.0.0']));
Route::get('/estados', [App\Http\Controllers\Api\MexicoController::class, 'estados']);
Route::get('/municipios', [App\Http\Controllers\Api\MexicoController::class, 'municipios']);
Route::get('/municipios/{id}/colonias', [App\Http\Controllers\Api\MexicoController::class, 'colonias']);
Route::get('/colonias/buscar', [App\Http\Controllers\Api\MexicoController::class, 'buscarPorCp']);
