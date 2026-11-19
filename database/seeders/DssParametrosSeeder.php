<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Módulo DSS (Proyecto Integrador DSTD).
 *
 * Parámetros de costo del modelo de decisión. Son SUPUESTOS de referencia,
 * no cifras oficiales del municipio; deben ajustarse con datos reales.
 */
class DssParametrosSeeder extends Seeder
{
    public function run(): void
    {
        $parametros = [
            [
                'clave' => 'costo_m2',
                'valor' => 450,
                'unidad' => 'MXN/m2',
                'descripcion' => 'SUPUESTO: costo de bacheo por metro cuadrado (mezcla asfáltica, mano de obra y compactación). Valor de referencia, no oficial.',
            ],
            [
                'clave' => 'costo_fijo_movilizacion',
                'valor' => 1200,
                'unidad' => 'MXN',
                'descripcion' => 'SUPUESTO: costo fijo por bache por movilizar cuadrilla, equipo y señalización. Valor de referencia, no oficial.',
            ],
            [
                'clave' => 'area_default_m2',
                'valor' => 0.5,
                'unidad' => 'm2',
                'descripcion' => 'SUPUESTO: área usada cuando el análisis IA no estima el área del bache.',
            ],
        ];

        foreach ($parametros as $p) {
            DB::table('dss_parametros')->updateOrInsert(
                ['clave' => $p['clave']],
                $p + ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
