<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Calle extends Model
{
    protected $fillable = [
        'municipio_id',
        'colonia_id',
        'nombre',
        'tipo',
        'importancia',
        'es_pavimentada',
    ];

    public function municipio(): BelongsTo
    {
        return $this->belongsTo(Municipio::class);
    }

    public function colonia(): BelongsTo
    {
        return $this->belongsTo(Colonia::class);
    }

    public function reportes(): HasMany
    {
        return $this->hasMany(Reporte::class);
    }
}
