<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Presupuesto extends Model
{
    protected $fillable = [
        'dependencia_id',
        'municipio_id',
        'anio',
        'mes',
        'concepto',
        'tipo',
        'monto',
        'notas',
        'registrado_por',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class);
    }

    public function municipio(): BelongsTo
    {
        return $this->belongsTo(Municipio::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
