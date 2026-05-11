<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dependencia extends Model
{
    protected $fillable = [
        'nombre',
        'clave',
        'tipo',
        'municipio_id',
        'responsable_nombre',
        'responsable_email',
        'responsable_phone',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function municipio(): BelongsTo
    {
        return $this->belongsTo(Municipio::class);
    }

    public function reportes(): HasMany
    {
        return $this->hasMany(Reporte::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_dependencias')
            ->withPivot('es_jefe')
            ->withTimestamps();
    }

    public function zonas(): HasMany
    {
        return $this->hasMany(Zona::class);
    }

    public function presupuestos(): HasMany
    {
        return $this->hasMany(Presupuesto::class);
    }
}
