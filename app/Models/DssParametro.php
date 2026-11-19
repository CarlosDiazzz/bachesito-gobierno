<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Módulo DSS (Proyecto Integrador DSTD)
class DssParametro extends Model
{
    protected $table = 'dss_parametros';

    /** Valores por defecto (supuestos) si la tabla no tiene el parámetro. */
    public const DEFAULTS = [
        'costo_m2' => 450.0,
        'costo_fijo_movilizacion' => 1200.0,
        'area_default_m2' => 0.5,
    ];

    protected $fillable = ['clave', 'valor', 'descripcion', 'unidad'];

    protected $casts = ['valor' => 'float'];

    /** Devuelve todos los parámetros como [clave => valor], completando con los defaults. */
    public static function valores(): array
    {
        return array_merge(
            self::DEFAULTS,
            static::query()->pluck('valor', 'clave')->map(fn ($v) => (float) $v)->all()
        );
    }
}
