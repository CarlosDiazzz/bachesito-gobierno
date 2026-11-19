<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Módulo DSS (Proyecto Integrador DSTD)
class DssEtlAnomalia extends Model
{
    protected $table = 'dss_etl_anomalias';

    public const TIPOS = [
        'duplicado',
        'coordenada_fuera_rango',
        'tipo_via_faltante',
        'sin_analisis_ia',
        'fecha_invalida',
        'campo_faltante',
    ];

    protected $fillable = [
        'ejecucion_id',
        'reporte_id',
        'tipo_anomalia',
        'campo',
        'valor_original',
        'accion_tomada',
        'regla_aplicada',
        'severidad',
    ];

    public function ejecucion(): BelongsTo
    {
        return $this->belongsTo(DssEtlEjecucion::class, 'ejecucion_id');
    }

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
