<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PresupuestoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $munDepId  = DB::table('dependencias')->where('clave','MUN-OAX-067')->value('id');
        $sapaoId   = DB::table('dependencias')->where('clave','SAPAO-OAX')->value('id');
        $oaxacaId  = DB::table('municipios')->where('clave_inegi','20067')->value('id');
        $adminId   = DB::table('users')->where('email','admin@bachesito.gob.mx')->value('id');

        DB::table('presupuestos')->insertOrIgnore([
            ['dependencia_id'=>$munDepId, 'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>1,  'concepto'=>'Bacheo emergente Centro',        'tipo'=>'asignado',    'monto'=>450000.00, 'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$munDepId, 'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>1,  'concepto'=>'Bacheo emergente Centro',        'tipo'=>'ejercido',    'monto'=>280000.00, 'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$munDepId, 'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>2,  'concepto'=>'Reencarpetamiento Periférico',   'tipo'=>'asignado',    'monto'=>1200000.00,'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$munDepId, 'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>2,  'concepto'=>'Reencarpetamiento Periférico',   'tipo'=>'ejercido',    'monto'=>950000.00, 'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$munDepId, 'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>3,  'concepto'=>'Bacheo zona norte',              'tipo'=>'asignado',    'monto'=>320000.00, 'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$munDepId, 'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>3,  'concepto'=>'Bacheo zona norte',              'tipo'=>'comprometido', 'monto'=>320000.00,'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$sapaoId,  'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>1,  'concepto'=>'Reparación red hidráulica',      'tipo'=>'asignado',    'monto'=>800000.00, 'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
            ['dependencia_id'=>$sapaoId,  'municipio_id'=>$oaxacaId, 'anio'=>2026, 'mes'=>1,  'concepto'=>'Reparación red hidráulica',      'tipo'=>'ejercido',    'monto'=>610000.00, 'registrado_por'=>$adminId, 'created_at'=>now(), 'updated_at'=>now()],
        ]);
    }
}
