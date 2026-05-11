<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Insignia extends Model
{
    protected $fillable = [
        'nombre',
        'descripcion',
        'icono_url',
        'color',
        'puntos_requeridos',
        'reportes_requeridos',
        'nivel',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_insignias')
            ->withPivot('obtenida_at');
    }
}
