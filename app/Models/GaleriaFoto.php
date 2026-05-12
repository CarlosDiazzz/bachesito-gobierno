<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class GaleriaFoto extends Model
{
    protected $fillable = [
        'user_id',
        'titulo',
        'descripcion',
        'url',
        'storage_path',
        'mime_type',
        'orden',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
