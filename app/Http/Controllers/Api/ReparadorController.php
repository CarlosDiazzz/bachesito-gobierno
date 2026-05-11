<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReparadorService;

class ReparadorController extends Controller
{
    public function __construct(private ReparadorService $service) {}

    public function index()
    {
        return response()->json($this->service->listar());
    }

    public function asignaciones()
    {
        return response()->json($this->service->asignacionesRecientes());
    }
}
