<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReporteAiAnalisis extends Model
{
    protected $table = 'reporte_ai_analisis';

    protected $fillable = [
        'reporte_id',
        'modelo_usado',
        'es_bache',
        'confianza',
        'severidad_ia',
        'profundidad_estimada_cm',
        'area_estimada_m2',
        'razon',
        'raw_response',
        'tokens_usados',
    ];

    protected $casts = [
        'es_bache' => 'boolean',
        'raw_response' => 'array',
    ];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
