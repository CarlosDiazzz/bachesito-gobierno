<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DependenciaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $oaxacaId = DB::table('municipios')->where('clave_inegi','20067')->value('id');

        DB::table('dependencias')->insertOrIgnore([
            ['nombre'=>'Municipio de Oaxaca de Juárez',    'clave'=>'MUN-OAX-067', 'tipo'=>'municipio',      'municipio_id'=>$oaxacaId, 'responsable_nombre'=>'Dirección de Obras Públicas',      'responsable_email'=>'obras@oaxaca.gob.mx',  'activa'=>true, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'SAPAO',                             'clave'=>'SAPAO-OAX',   'tipo'=>'sapao',          'municipio_id'=>$oaxacaId, 'responsable_nombre'=>'Gerencia SAPAO',                    'responsable_email'=>'gerencia@sapao.gob.mx', 'activa'=>true, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Secretaría de Infraestructura Vial','clave'=>'SIV-OAX',     'tipo'=>'infraestructura','municipio_id'=>$oaxacaId, 'responsable_nombre'=>'Secretaría de Infraestructura',     'responsable_email'=>'siv@oaxaca.gob.mx',    'activa'=>true, 'created_at'=>now(), 'updated_at'=>now()],
        ]);
    }
}
