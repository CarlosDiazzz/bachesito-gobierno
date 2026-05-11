<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Patrocinio extends Model
{
    protected $fillable = [
        'reporte_id',
        'empresa_nombre',
        'empresa_contacto',
        'monto',
        'estado',
    ];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
