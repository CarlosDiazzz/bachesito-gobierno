<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asignacion extends Model
{
    protected $table = 'asignaciones';

    protected $fillable = [
        'reporte_id',
        'asignado_a',
        'asignado_por',
        'dependencia_id',
        'estado',
        'notas_asignacion',
        'fecha_asignacion',
        'fecha_inicio',
        'fecha_completada',
    ];

    protected $casts = [
        'fecha_asignacion' => 'datetime',
        'fecha_inicio' => 'datetime',
        'fecha_completada' => 'datetime',
    ];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }

    public function asignadoA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asignado_a');
    }

    public function asignadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asignado_por');
    }

    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class);
    }
}
