<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePresupuestoRequest;
use App\Http\Requests\UpdatePresupuestoRequest;
use App\Models\Presupuesto;
use App\Services\PresupuestoService;
use Illuminate\Http\Request;

class PresupuestoController extends Controller
{
    public function __construct(private PresupuestoService $service) {}

    public function index(Request $request)
    {
        $anio        = (int) $request->get('anio', now()->year);
        $municipioId = $request->get('municipio_id');

        return response()->json([
            'resumen'      => $this->service->resumenAnual($anio, $municipioId),
            'por_mes'      => $this->service->porMes($anio, $municipioId),
            'movimientos'  => $this->service->listar($anio, $municipioId)->map(fn ($p) => [
                'id'          => $p->id,
                'mes'         => $p->mes,
                'concepto'    => $p->concepto,
                'tipo'        => $p->tipo,
                'monto'       => (float) $p->monto,
                'dependencia' => $p->dependencia?->nombre,
                'municipio'   => $p->municipio?->nombre,
                'registrado'  => $p->registradoPor?->name,
                'notas'       => $p->notas,
                'created_at'  => $p->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function store(StorePresupuestoRequest $request)
    {
        $presupuesto = Presupuesto::create(array_merge(
            $request->validated(),
            ['registrado_por' => $request->user()->id]
        ));

        return response()->json($presupuesto->load(['dependencia:id,nombre', 'municipio:id,nombre']), 201);
    }

    public function update(UpdatePresupuestoRequest $request, Presupuesto $presupuesto)
    {
        $presupuesto->update($request->validated());
        return response()->json($presupuesto->fresh(['dependencia:id,nombre', 'municipio:id,nombre']));
    }

    public function destroy(Presupuesto $presupuesto)
    {
        $presupuesto->delete();
        return response()->json(['message' => 'Eliminado correctamente.']);
    }
}
