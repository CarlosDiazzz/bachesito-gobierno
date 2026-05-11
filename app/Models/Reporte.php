<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Reporte extends Model
{
    protected $fillable = [
        'folio',
        'ciudadano_id',
        'zona_id',
        'dependencia_id',
        'municipio_id',
        'colonia_id',
        'calle_id',
        'tipo_via',
        'nombre_via',
        'latitud',
        'longitud',
        'direccion_aproximada',
        'descripcion',
        'estado',
        'prioridad',
        'score_prioridad',
        'fecha_reporte',
        'fecha_limite_estimada',
        'fecha_resolucion',
    ];

    protected $casts = [
        'fecha_reporte' => 'datetime',
        'fecha_limite_estimada' => 'datetime',
        'fecha_resolucion' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($reporte) {
            $municipio = Municipio::find($reporte->municipio_id);
            $claveInegi = $municipio ? $municipio->clave_inegi : '00000';
            $date = now()->format('Ymd');
            
            $sequence = static::whereDate('created_at', now()->toDateString())
                ->where('municipio_id', $reporte->municipio_id)
                ->count() + 1;
            
            $reporte->folio = sprintf('BCH-%s-%s-%04d', $claveInegi, $date, $sequence);
        });
    }

    public function ciudadano(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ciudadano_id');
    }

    public function zona(): BelongsTo
    {
        return $this->belongsTo(Zona::class);
    }

    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class);
    }

    public function municipio(): BelongsTo
    {
        return $this->belongsTo(Municipio::class);
    }

    public function colonia(): BelongsTo
    {
        return $this->belongsTo(Colonia::class);
    }

    public function calle(): BelongsTo
    {
        return $this->belongsTo(Calle::class);
    }

    public function fotos(): HasMany
    {
        return $this->hasMany(ReporteFoto::class);
    }

    public function aiAnalisis(): HasOne
    {
        return $this->hasOne(ReporteAiAnalisis::class);
    }

    public function scoreDetalle(): HasOne
    {
        return $this->hasOne(ReporteScoreDetalle::class);
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(Asignacion::class);
    }

    public function comentarios(): HasMany
    {
        return $this->hasMany(Comentario::class);
    }

    public function historialEstados(): HasMany
    {
        return $this->hasMany(HistorialEstado::class);
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class);
    }

    public function puntosCivicos(): HasMany
    {
        return $this->hasMany(PuntoCivico::class);
    }

    public function patrocinios(): HasMany
    {
        return $this->hasMany(Patrocinio::class);
    }
}
