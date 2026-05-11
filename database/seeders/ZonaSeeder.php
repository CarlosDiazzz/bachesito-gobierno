<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZonaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $oaxacaId     = DB::table('municipios')->where('clave_inegi','20067')->value('id');
        $munDepId     = DB::table('dependencias')->where('clave','MUN-OAX-067')->value('id');
        $centroId     = DB::table('colonias')->where('nombre','Centro Histórico')->where('municipio_id',$oaxacaId)->value('id');
        $reformaId    = DB::table('colonias')->where('nombre','Reforma')->where('municipio_id',$oaxacaId)->value('id');
        $retiroId     = DB::table('colonias')->where('nombre','El Retiro')->where('municipio_id',$oaxacaId)->value('id');
        $jalatlaco    = DB::table('colonias')->where('nombre','Jalatlaco')->where('municipio_id',$oaxacaId)->value('id');

        DB::table('zonas')->insertOrIgnore([
            ['nombre'=>'Zona Centro',         'municipio_id'=>$oaxacaId, 'colonia_id'=>$centroId,  'dependencia_id'=>$munDepId, 'lat_centro'=>17.0669, 'lng_centro'=>-96.7203, 'radio_km'=>1.0, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Zona Reforma',        'municipio_id'=>$oaxacaId, 'colonia_id'=>$reformaId, 'dependencia_id'=>$munDepId, 'lat_centro'=>17.0589, 'lng_centro'=>-96.7350, 'radio_km'=>1.2, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Zona El Retiro',      'municipio_id'=>$oaxacaId, 'colonia_id'=>$retiroId,  'dependencia_id'=>$munDepId, 'lat_centro'=>17.0750, 'lng_centro'=>-96.7180, 'radio_km'=>0.8, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Zona Jalatlaco',      'municipio_id'=>$oaxacaId, 'colonia_id'=>$jalatlaco, 'dependencia_id'=>$munDepId, 'lat_centro'=>17.0621, 'lng_centro'=>-96.7109, 'radio_km'=>0.6, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Zona Norte',          'municipio_id'=>$oaxacaId, 'colonia_id'=>null,        'dependencia_id'=>$munDepId, 'lat_centro'=>17.0900, 'lng_centro'=>-96.7300, 'radio_km'=>2.0, 'created_at'=>now(), 'updated_at'=>now()],
            ['nombre'=>'Zona Sur',            'municipio_id'=>$oaxacaId, 'colonia_id'=>null,        'dependencia_id'=>$munDepId, 'lat_centro'=>17.0500, 'lng_centro'=>-96.7300, 'radio_km'=>2.0, 'created_at'=>now(), 'updated_at'=>now()],
        ]);
    }
}
