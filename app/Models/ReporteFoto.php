<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReporteFoto extends Model
{
    protected $fillable = [
        'reporte_id',
        'url',
        'storage_path',
        'tipo',
        'es_principal',
        'orden',
    ];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
