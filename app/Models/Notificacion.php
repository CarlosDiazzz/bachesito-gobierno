<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    protected $table = 'notificaciones';

    protected $fillable = [
        'user_id',
        'reporte_id',
        'titulo',
        'cuerpo',
        'canal',
        'tipo',
        'leida',
        'leida_at',
        'enviada_at',
    ];

    protected $casts = [
        'leida' => 'boolean',
        'leida_at' => 'datetime',
        'enviada_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
