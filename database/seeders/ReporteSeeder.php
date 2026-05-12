<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReporteSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $reportes = [
            [
                'folio'         => 'OAX-2025-0001',
                'nombre_via'    => 'Av. Juárez',
                'descripcion'   => 'Bache de gran tamaño frente al banco, riesgo para motociclistas.',
                'latitud'       => 17.0665,
                'longitud'      => -96.7213,
                'prioridad'     => 'critica',
                'estado'        => 'pendiente',
                'score_prioridad' => 95,
            ],
            [
                'folio'         => 'OAX-2025-0002',
                'nombre_via'    => 'Calle Macedonio Alcalá',
                'descripcion'   => 'Varios baches en la zona peatonal, peligroso en época de lluvias.',
                'latitud'       => 17.0672,
                'longitud'      => -96.7198,
                'prioridad'     => 'alta',
                'estado'        => 'validado',
                'score_prioridad' => 78,
            ],
            [
                'folio'         => 'OAX-2025-0003',
                'nombre_via'    => 'Periférico Nte.',
                'descripcion'   => 'Hundimiento progresivo en el carril derecho.',
                'latitud'       => 17.0812,
                'longitud'      => -96.7340,
                'prioridad'     => 'critica',
                'estado'        => 'en_proceso',
                'score_prioridad' => 92,
            ],
            [
                'folio'         => 'OAX-2025-0004',
                'nombre_via'    => 'Blvd. Eduardo Vasconcelos',
                'descripcion'   => 'Bache mediano frente a la secundaria, niños en riesgo al salir.',
                'latitud'       => 17.0590,
                'longitud'      => -96.7410,
                'prioridad'     => 'alta',
                'estado'        => 'asignado',
                'score_prioridad' => 71,
            ],
            [
                'folio'         => 'OAX-2025-0005',
                'nombre_via'    => 'Calle Tinoco y Palacios',
                'descripcion'   => 'Bache pequeño pero profundo, ya causó accidente de bicicleta.',
                'latitud'       => 17.0655,
                'longitud'      => -96.7175,
                'prioridad'     => 'media',
                'estado'        => 'pendiente',
                'score_prioridad' => 54,
            ],
            [
                'folio'         => 'OAX-2025-0006',
                'nombre_via'    => 'Carr. Internacional',
                'descripcion'   => 'Bache de 1.5 metros de diámetro en zona de alta velocidad.',
                'latitud'       => 17.0505,
                'longitud'      => -96.7520,
                'prioridad'     => 'critica',
                'estado'        => 'validado',
                'score_prioridad' => 99,
            ],
            [
                'folio'         => 'OAX-2025-0007',
                'nombre_via'    => 'Calle Armenta y López',
                'descripcion'   => 'Grietas y levantamiento del pavimento por raíces.',
                'latitud'       => 17.0641,
                'longitud'      => -96.7228,
                'prioridad'     => 'baja',
                'estado'        => 'resuelto',
                'score_prioridad' => 30,
            ],
            [
                'folio'         => 'OAX-2025-0008',
                'nombre_via'    => 'Av. Ferrocarril',
                'descripcion'   => 'Múltiples baches acumulados tras lluvias del mes pasado.',
                'latitud'       => 17.0755,
                'longitud'      => -96.7280,
                'prioridad'     => 'alta',
                'estado'        => 'pendiente',
                'score_prioridad' => 80,
            ],
            [
                'folio'         => 'OAX-2025-0009',
                'nombre_via'    => 'Calle Reforma',
                'descripcion'   => 'Bache frente a la entrada de la escuela primaria.',
                'latitud'       => 17.0620,
                'longitud'      => -96.7260,
                'prioridad'     => 'media',
                'estado'        => 'en_proceso',
                'score_prioridad' => 60,
            ],
            [
                'folio'         => 'OAX-2025-0010',
                'nombre_via'    => 'Prolongación Pino Suárez',
                'descripcion'   => 'Bache al costado del mercado, zona muy concurrida.',
                'latitud'       => 17.0700,
                'longitud'      => -96.7300,
                'prioridad'     => 'alta',
                'estado'        => 'pendiente',
                'score_prioridad' => 76,
            ],
        ];

        foreach ($reportes as $data) {
            DB::table('reportes')->insert([
                'folio'            => $data['folio'],
                'nombre_via'       => $data['nombre_via'],
                'descripcion'      => $data['descripcion'],
                'latitud'          => $data['latitud'],
                'longitud'         => $data['longitud'],
                'prioridad'        => $data['prioridad'],
                'estado'           => $data['estado'],
                'score_prioridad'  => $data['score_prioridad'],
                'municipio_id'     => 1,
                'colonia_id'       => 1,
                'ciudadano_id'     => 1,
                'fecha_reporte'    => $now->subDays(rand(0, 30)),
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);
        }
    }
}
