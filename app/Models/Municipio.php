<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Municipio extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'clave_inegi',
        'estado_id',
        'nombre',
        'latitud',
        'longitud',
    ];

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class);
    }

    public function colonias(): HasMany
    {
        return $this->hasMany(Colonia::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function reportes(): HasMany
    {
        return $this->hasMany(Reporte::class);
    }

    public function dependencias(): HasMany
    {
        return $this->hasMany(Dependencia::class);
    }
}
