<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CalleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $centro    = DB::table('colonias')->where('nombre', 'Centro Histórico')->where('municipio_id', 1)->value('id');
        $reforma   = DB::table('colonias')->where('nombre', 'Reforma')->where('municipio_id', 1)->value('id');
        $jalatlaco = DB::table('colonias')->where('nombre', 'Jalatlaco')->where('municipio_id', 1)->value('id');
        $retiro    = DB::table('colonias')->where('nombre', 'El Retiro')->where('municipio_id', 1)->value('id');
        $volcanes  = DB::table('colonias')->where('nombre', 'Volcanes')->where('municipio_id', 1)->value('id');
        $estrella  = DB::table('colonias')->where('nombre', 'La Estrella')->where('municipio_id', 1)->value('id');

        DB::table('calles')->insertOrIgnore([
            // Centro Histórico
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Avenida Independencia',       'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Macedonio Alcalá',      'tipo'=>'calle',      'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Avenida Juárez',              'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle García Vigil',          'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Armenta y López',       'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Flores Magón',          'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Morelos',               'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Murguía',               'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Aldama',                'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$centro,   'nombre'=>'Calle Trujano',               'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],

            // Reforma
            ['municipio_id'=>1, 'colonia_id'=>$reforma,  'nombre'=>'Avenida Ferrocarril',         'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$reforma,  'nombre'=>'Calle Eucalipto',             'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$reforma,  'nombre'=>'Calle Jacaranda',             'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$reforma,  'nombre'=>'Calle Nardo',                 'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>false],

            // Jalatlaco
            ['municipio_id'=>1, 'colonia_id'=>$jalatlaco,'nombre'=>'Calle Rufino Tamayo',         'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$jalatlaco,'nombre'=>'Calle Juan de Dios Díaz',     'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$jalatlaco,'nombre'=>'Callejón del Calvario',       'tipo'=>'callejon',   'importancia'=>'local',       'es_pavimentada'=>false],

            // El Retiro
            ['municipio_id'=>1, 'colonia_id'=>$retiro,   'nombre'=>'Avenida Universidad',         'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$retiro,   'nombre'=>'Calle Pino Suárez',           'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$retiro,   'nombre'=>'Calle Xochitl',               'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],

            // Volcanes
            ['municipio_id'=>1, 'colonia_id'=>$volcanes, 'nombre'=>'Avenida Volcán Popocatépetl', 'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$volcanes, 'nombre'=>'Calle Volcán Iztaccíhuatl',   'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$volcanes, 'nombre'=>'Calle Volcán Pico de Orizaba','tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>false],

            // La Estrella
            ['municipio_id'=>1, 'colonia_id'=>$estrella, 'nombre'=>'Calle Saturno',               'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$estrella, 'nombre'=>'Calle Marte',                 'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>$estrella, 'nombre'=>'Calle Venus',                 'tipo'=>'calle',      'importancia'=>'local',       'es_pavimentada'=>false],

            // Rutas principales inter-colonias (sin colonia fija)
            ['municipio_id'=>1, 'colonia_id'=>null,      'nombre'=>'Periférico',                  'tipo'=>'boulevard',  'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>null,      'nombre'=>'Carretera Internacional',     'tipo'=>'carretera',  'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>null,      'nombre'=>'Avenida Simbolos Patrios',    'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>null,      'nombre'=>'Avenida Niños Héroes',        'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>1, 'colonia_id'=>null,      'nombre'=>'Calzada Madero',              'tipo'=>'avenida',    'importancia'=>'secundaria',  'es_pavimentada'=>true],

            // Tuxtepec (municipio_id = 2)
            ['municipio_id'=>2, 'colonia_id'=>null, 'nombre'=>'Avenida 20 de Noviembre',          'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>2, 'colonia_id'=>null, 'nombre'=>'Calle Independencia',              'tipo'=>'calle',      'importancia'=>'secundaria',  'es_pavimentada'=>true],
            ['municipio_id'=>2, 'colonia_id'=>null, 'nombre'=>'Boulevard Benito Juárez',          'tipo'=>'boulevard',  'importancia'=>'principal',   'es_pavimentada'=>true],

            // Juchitán (municipio_id = 3)
            ['municipio_id'=>3, 'colonia_id'=>null, 'nombre'=>'Avenida 16 de Septiembre',         'tipo'=>'avenida',    'importancia'=>'principal',   'es_pavimentada'=>true],
            ['municipio_id'=>3, 'colonia_id'=>null, 'nombre'=>'Carretera Transistmica',           'tipo'=>'carretera',  'importancia'=>'principal',   'es_pavimentada'=>true],
        ]);
    }
}
