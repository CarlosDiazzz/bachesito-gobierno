<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ColoniaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('colonias')->insertOrIgnore([
            // Oaxaca de Juárez (municipio_id = 1)
            ['municipio_id'=>1, 'nombre'=>'Centro Histórico',           'tipo'=>'colonia',         'cp'=>'68000'],
            ['municipio_id'=>1, 'nombre'=>'Jalatlaco',                  'tipo'=>'barrio',          'cp'=>'68080'],
            ['municipio_id'=>1, 'nombre'=>'Reforma',                    'tipo'=>'colonia',         'cp'=>'68050'],
            ['municipio_id'=>1, 'nombre'=>'El Retiro',                  'tipo'=>'colonia',         'cp'=>'68020'],
            ['municipio_id'=>1, 'nombre'=>'Volcanes',                   'tipo'=>'fraccionamiento', 'cp'=>'68030'],
            ['municipio_id'=>1, 'nombre'=>'La Estrella',                'tipo'=>'colonia',         'cp'=>'68040'],
            ['municipio_id'=>1, 'nombre'=>'Trinidad de las Huertas',    'tipo'=>'colonia',         'cp'=>'68120'],
            ['municipio_id'=>1, 'nombre'=>'Xochimilco',                 'tipo'=>'barrio',          'cp'=>'68090'],
            ['municipio_id'=>1, 'nombre'=>'San Felipe del Agua',        'tipo'=>'colonia',         'cp'=>'68020'],
            ['municipio_id'=>1, 'nombre'=>'Linda Vista',                'tipo'=>'fraccionamiento', 'cp'=>'68130'],
            ['municipio_id'=>1, 'nombre'=>'Ex Marquesado',              'tipo'=>'colonia',         'cp'=>'68030'],
            ['municipio_id'=>1, 'nombre'=>'Colonia del Valle',          'tipo'=>'colonia',         'cp'=>'68020'],
            ['municipio_id'=>1, 'nombre'=>'Montoya',                    'tipo'=>'colonia',         'cp'=>'68050'],
            ['municipio_id'=>1, 'nombre'=>'Candiani',                   'tipo'=>'colonia',         'cp'=>'68120'],
            ['municipio_id'=>1, 'nombre'=>'Dolores',                    'tipo'=>'colonia',         'cp'=>'68040'],
            ['municipio_id'=>1, 'nombre'=>'Vistahermosa',               'tipo'=>'fraccionamiento', 'cp'=>'68026'],
            ['municipio_id'=>1, 'nombre'=>'El Rosario',                 'tipo'=>'colonia',         'cp'=>'68040'],
            ['municipio_id'=>1, 'nombre'=>'Patria Nueva',               'tipo'=>'colonia',         'cp'=>'68100'],
            ['municipio_id'=>1, 'nombre'=>'La Noria',                   'tipo'=>'colonia',         'cp'=>'68050'],
            ['municipio_id'=>1, 'nombre'=>'Niños Héroes',               'tipo'=>'colonia',         'cp'=>'68030'],
            ['municipio_id'=>1, 'nombre'=>'5 de Diciembre',             'tipo'=>'colonia',         'cp'=>'68060'],
            ['municipio_id'=>1, 'nombre'=>'Alemán',                     'tipo'=>'colonia',         'cp'=>'68060'],
            ['municipio_id'=>1, 'nombre'=>'Benito Juárez',              'tipo'=>'colonia',         'cp'=>'68050'],
            ['municipio_id'=>1, 'nombre'=>'INFONAVIT El Rosario',       'tipo'=>'unidad_hab',      'cp'=>'68040'],
            ['municipio_id'=>1, 'nombre'=>'Colinas de San Bartolo',     'tipo'=>'fraccionamiento', 'cp'=>'68130'],

            // Tuxtepec (municipio_id = 2)
            ['municipio_id'=>2, 'nombre'=>'Centro',                     'tipo'=>'colonia',         'cp'=>'68300'],
            ['municipio_id'=>2, 'nombre'=>'Benito Juárez',              'tipo'=>'colonia',         'cp'=>'68300'],
            ['municipio_id'=>2, 'nombre'=>'Insurgentes',                'tipo'=>'colonia',         'cp'=>'68310'],
            ['municipio_id'=>2, 'nombre'=>'Independencia',              'tipo'=>'colonia',         'cp'=>'68310'],

            // Juchitán (municipio_id = 3)
            ['municipio_id'=>3, 'nombre'=>'Centro',                     'tipo'=>'colonia',         'cp'=>'70000'],
            ['municipio_id'=>3, 'nombre'=>'Cheguigo Norte',             'tipo'=>'colonia',         'cp'=>'70010'],
            ['municipio_id'=>3, 'nombre'=>'Laborio',                    'tipo'=>'barrio',          'cp'=>'70000'],

            // Salina Cruz (municipio_id = 4)
            ['municipio_id'=>4, 'nombre'=>'Centro',                     'tipo'=>'colonia',         'cp'=>'70600'],
            ['municipio_id'=>4, 'nombre'=>'Las Palmas',                 'tipo'=>'colonia',         'cp'=>'70610'],
            ['municipio_id'=>4, 'nombre'=>'Jardines del Puerto',        'tipo'=>'fraccionamiento', 'cp'=>'70620'],
        ]);
    }
}
