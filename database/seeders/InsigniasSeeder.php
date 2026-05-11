<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InsigniasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('insignias')->insertOrIgnore([
            ['nombre'=>'Primer Reporte',  'descripcion'=>'Reportaste tu primer bache. ¡Gracias por contribuir a Oaxaca!',              'color'=>'#CD7F32', 'puntos_requeridos'=>0,    'reportes_requeridos'=>1,   'nivel'=>'bronce', 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Vecino Activo',   'descripcion'=>'Has reportado 5 baches validados. Tu colonia te lo agradece.',                'color'=>'#C0C0C0', 'puntos_requeridos'=>100,  'reportes_requeridos'=>5,   'nivel'=>'plata',  'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Guardián Vial',   'descripcion'=>'20 reportes validados. Eres un verdadero guardián de las calles de Oaxaca.',  'color'=>'#FFD700', 'puntos_requeridos'=>500,  'reportes_requeridos'=>20,  'nivel'=>'oro',    'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Élite Cívica',    'descripcion'=>'100 reportes. Leyenda viviente del bienestar urbano de Oaxaca.',              'color'=>'#E5E4E2', 'puntos_requeridos'=>2000, 'reportes_requeridos'=>100, 'nivel'=>'platino', 'created_at'=>now(), 'updated_at'=>now()],
        ]);
    }
}
