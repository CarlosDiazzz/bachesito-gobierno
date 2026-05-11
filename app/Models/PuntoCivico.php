<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PuntoCivico extends Model
{
    protected $table = 'puntos_civicos';

    protected $fillable = [
        'user_id',
        'reporte_id',
        'concepto',
        'puntos',
        'descripcion',
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
