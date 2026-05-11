<?php
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn() => response()->json(['status'=>'ok','proyecto'=>'BachesITO','version'=>'1.0.0']));
Route::get('/estados', [App\Http\Controllers\Api\MexicoController::class, 'estados']);
Route::get('/municipios', [App\Http\Controllers\Api\MexicoController::class, 'municipios']);
Route::get('/municipios/{id}/colonias', [App\Http\Controllers\Api\MexicoController::class, 'colonias']);
Route::get('/colonias/buscar', [App\Http\Controllers\Api\MexicoController::class, 'buscarPorCp']);
