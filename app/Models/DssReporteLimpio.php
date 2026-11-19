<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Módulo DSS (Proyecto Integrador DSTD)
class DssReporteLimpio extends Model
{
    protected $table = 'dss_reportes_limpios';

    protected $fillable = [
        'ejecucion_id',
        'reporte_id',
        'severidad',
        'tipo_via',
        'dias_pendiente',
        'densidad_zona',
        'score_ia',
        'colonia_id',
        'latitud',
        'longitud',
        'num_reportes_fusionados',
        'datos_suficientes',
    ];

    protected $casts = [
        'severidad' => 'float',
        'tipo_via' => 'float',
        'dias_pendiente' => 'integer',
        'densidad_zona' => 'integer',
        'score_ia' => 'float',
        'num_reportes_fusionados' => 'integer',
        'datos_suficientes' => 'boolean',
    ];

    public function ejecucion(): BelongsTo
    {
        return $this->belongsTo(DssEtlEjecucion::class, 'ejecucion_id');
    }

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }

    public function colonia(): BelongsTo
    {
        return $this->belongsTo(Colonia::class);
    }
}
