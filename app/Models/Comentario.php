<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comentario extends Model
{
    protected $fillable = [
        'reporte_id',
        'user_id',
        'contenido',
        'es_interno',
        'es_sistema',
    ];

    protected $casts = [
        'es_interno' => 'boolean',
        'es_sistema' => 'boolean',
    ];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
