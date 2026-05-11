<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MunicipioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('municipios')->insertOrIgnore([
            ['id'=>1,  'clave_inegi'=>'20067', 'estado_id'=>20, 'nombre'=>'Oaxaca de Juárez',                      'latitud'=>17.0732,  'longitud'=>-96.7266],
            ['id'=>2,  'clave_inegi'=>'20388', 'estado_id'=>20, 'nombre'=>'San Juan Bautista Tuxtepec',             'latitud'=>18.0944,  'longitud'=>-96.1222],
            ['id'=>3,  'clave_inegi'=>'20184', 'estado_id'=>20, 'nombre'=>'Heroica Ciudad de Juchitán de Zaragoza', 'latitud'=>16.4338,  'longitud'=>-95.0174],
            ['id'=>4,  'clave_inegi'=>'20430', 'estado_id'=>20, 'nombre'=>'Salina Cruz',                            'latitud'=>16.1671,  'longitud'=>-95.1997],
            ['id'=>5,  'clave_inegi'=>'20533', 'estado_id'=>20, 'nombre'=>'Santo Domingo Tehuantepec',              'latitud'=>16.3211,  'longitud'=>-95.2419],
            ['id'=>6,  'clave_inegi'=>'20218', 'estado_id'=>20, 'nombre'=>'Heroica Ciudad de Huajuapan de León',    'latitud'=>17.8094,  'longitud'=>-97.7797],
            ['id'=>7,  'clave_inegi'=>'20310', 'estado_id'=>20, 'nombre'=>'Miahuatlán de Porfirio Díaz',            'latitud'=>16.3269,  'longitud'=>-96.5961],
            ['id'=>8,  'clave_inegi'=>'20365', 'estado_id'=>20, 'nombre'=>'Ocotlán de Morelos',                     'latitud'=>16.7910,  'longitud'=>-96.6715],
            ['id'=>9,  'clave_inegi'=>'20509', 'estado_id'=>20, 'nombre'=>'Tlacolula de Matamoros',                 'latitud'=>16.9566,  'longitud'=>-96.4766],
            ['id'=>10, 'clave_inegi'=>'20570', 'estado_id'=>20, 'nombre'=>'Zimatlán de Álvarez',                    'latitud'=>16.8719,  'longitud'=>-96.7881],
            ['id'=>11, 'clave_inegi'=>'20212', 'estado_id'=>20, 'nombre'=>'Santa Cruz Huatulco',                    'latitud'=>15.7697,  'longitud'=>-96.1430],
            ['id'=>12, 'clave_inegi'=>'20400', 'estado_id'=>20, 'nombre'=>'San Pablo Villa de Mitla',               'latitud'=>16.9225,  'longitud'=>-96.4008],
            ['id'=>13, 'clave_inegi'=>'20540', 'estado_id'=>20, 'nombre'=>'Santo Tomás Jalieza',                    'latitud'=>16.8261,  'longitud'=>-96.7108],
            ['id'=>14, 'clave_inegi'=>'20080', 'estado_id'=>20, 'nombre'=>'Etla',                                   'latitud'=>17.2058,  'longitud'=>-96.7908],
            ['id'=>15, 'clave_inegi'=>'20290', 'estado_id'=>20, 'nombre'=>'Zaachila',                               'latitud'=>16.9481,  'longitud'=>-96.7544],
        ]);
    }
}
