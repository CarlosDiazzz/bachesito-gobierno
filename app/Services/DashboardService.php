<?php

namespace App\Services;

use App\Models\Reporte;
use App\Models\Presupuesto;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function stats(): array
    {
        $anio = now()->year;
        $mes  = now()->month;

        $presupuestoTotal    = Presupuesto::where('tipo', 'asignado')->where('anio', $anio)->sum('monto');
        $presupuestoEjercido = Presupuesto::where('tipo', 'ejercido')->where('anio', $anio)->sum('monto');

        $tiempoPromedio = Reporte::where('estado', 'resuelto')
            ->whereNotNull('fecha_resolucion')
            ->selectRaw('AVG(CAST((julianday(fecha_resolucion) - julianday(fecha_reporte)) AS REAL)) as promedio')
            ->value('promedio');

        return [
            'total'                   => Reporte::count(),
            'pendientes'              => Reporte::where('estado', 'pendiente')->count(),
            'en_proceso'              => Reporte::whereIn('estado', ['asignado', 'en_proceso'])->count(),
            'resueltos_mes'           => Reporte::where('estado', 'resuelto')
                                                 ->whereMonth('fecha_resolucion', $mes)
                                                 ->whereYear('fecha_resolucion', $anio)
                                                 ->count(),
            'criticos'                => Reporte::where('prioridad', 'critica')
                                                 ->whereNotIn('estado', ['resuelto', 'cerrado', 'rechazado'])
                                                 ->count(),
            'presupuesto_total'       => (float) $presupuestoTotal,
            'presupuesto_ejercido'    => (float) $presupuestoEjercido,
            'tiempo_promedio_dias'    => round((float) $tiempoPromedio, 1),
        ];
    }
}
