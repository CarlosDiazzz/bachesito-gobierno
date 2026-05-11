<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReporteScoreDetalle extends Model
{
    protected $table = 'reporte_score_detalle';

    protected $fillable = [
        'reporte_id',
        'score_severidad',
        'score_trafico',
        'score_tipo_via',
        'score_infraestructura_critica',
        'score_pci',
        'score_reportes_zona',
        'score_final',
        'formula_aplicada',
        'calculado_at',
    ];

    protected $casts = [
        'calculado_at' => 'datetime',
    ];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
