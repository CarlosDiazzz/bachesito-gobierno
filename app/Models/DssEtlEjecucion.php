<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Módulo DSS (Proyecto Integrador DSTD)
class DssEtlEjecucion extends Model
{
    protected $table = 'dss_etl_ejecuciones';

    protected $fillable = [
        'iniciado_at',
        'finalizado_at',
        'registros_leidos',
        'registros_cargados',
        'registros_descartados',
        'registros_con_advertencia',
        'estado',
        'mensaje_error',
        'ejecutado_por',
    ];

    protected $casts = [
        'iniciado_at' => 'datetime',
        'finalizado_at' => 'datetime',
        'registros_leidos' => 'integer',
        'registros_cargados' => 'integer',
        'registros_descartados' => 'integer',
        'registros_con_advertencia' => 'integer',
    ];

    public function anomalias(): HasMany
    {
        return $this->hasMany(DssEtlAnomalia::class, 'ejecucion_id');
    }

    public function reportesLimpios(): HasMany
    {
        return $this->hasMany(DssReporteLimpio::class, 'ejecucion_id');
    }

    public function ejecutadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ejecutado_por');
    }

    /** Tasa de calidad = cargados / leídos × 100. */
    public function tasaCalidad(): ?float
    {
        if ($this->registros_leidos === 0) {
            return null;
        }

        return round($this->registros_cargados / $this->registros_leidos * 100, 1);
    }

    /** Conteo de anomalías agrupado por tipo. */
    public function conteoPorTipo(): array
    {
        $conteo = array_fill_keys(DssEtlAnomalia::TIPOS, 0);

        $this->anomalias()
            ->selectRaw('tipo_anomalia, count(*) as total')
            ->groupBy('tipo_anomalia')
            ->pluck('total', 'tipo_anomalia')
            ->each(function ($total, $tipo) use (&$conteo) {
                $conteo[$tipo] = (int) $total;
            });

        return $conteo;
    }
}
