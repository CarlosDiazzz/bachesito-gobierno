<?php
use Illuminate\Support\Facades\Route;

// Todas las rutas web sirven la SPA de React excepto las de API
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*')->name('spa');
