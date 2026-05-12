<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    // IDs fijos de la BD
    private int $municipioId  = 1;
    private int $depMunId     = 1;   // Municipio de Oaxaca de Juárez
    private int $depSiviId    = 3;   // Secretaría de Infraestructura Vial
    private int $depSapaoId   = 2;   // SAPAO
    private int $adminId      = 1;
    private int $supervisorId = 2;
    private int $reparadorId  = 3;
    private int $ciudadanoId  = 4;

    public function run(): void
    {
        $this->seedReportes();
        $this->seedPresupuestosExtra();
    }

    // ─────────────────────────────────────────────────
    //  REPORTES + fotos + AI + score + asignaciones + historial
    // ─────────────────────────────────────────────────
    private function seedReportes(): void
    {
        $reportes = [
            [
                'folio'         => 'BCH-20067-20260501-0001',
                'colonia_id'    => 1,  // Centro Histórico
                'tipo_via'      => 'avenida_principal',
                'nombre_via'    => 'Avenida Independencia',
                'latitud'       => 17.0669, 'longitud' => -96.7203,
                'descripcion'   => 'Cráter de gran tamaño en carril central, profundidad aproximada 15 cm, afecta dos carriles.',
                'estado'        => 'pendiente',
                'prioridad'     => 'critica',
                'score'         => 91.5,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSiviId,
                'fecha_offset'  => -5,
                'ai_bache'      => true, 'ai_conf' => 96, 'ai_sev' => 'alta',
                'ai_prof'       => 15.0, 'ai_area' => 0.80,
                'ai_razon'      => 'Bache de gran dimensión visible claramente en carril central. Riesgo alto para vehículos.',
                'foto_color'    => 'F44C63',
                'historial'     => [],
                'asignacion'    => null,
            ],
            [
                'folio'         => 'BCH-20067-20260502-0001',
                'colonia_id'    => 5,  // Volcanes
                'tipo_via'      => 'avenida_principal',
                'nombre_via'    => 'Periférico Norte',
                'latitud'       => 17.0810, 'longitud' => -96.7350,
                'descripcion'   => 'Bache profundo de aprox. 12 cm frente a tope de seguridad. Peligroso en horario nocturno.',
                'estado'        => 'validado',
                'prioridad'     => 'alta',
                'score'         => 78.2,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSiviId,
                'fecha_offset'  => -4,
                'ai_bache'      => true, 'ai_conf' => 89, 'ai_sev' => 'alta',
                'ai_prof'       => 12.0, 'ai_area' => 0.45,
                'ai_razon'      => 'Daño severo en pavimento con bordes definidos. Alta confianza en clasificación.',
                'foto_color'    => 'F98927',
                'historial'     => [
                    ['anterior' => 'pendiente', 'nuevo' => 'validado', 'user_id' => $this->supervisorId, 'motivo' => 'Verificado en campo por supervisor.', 'offset' => -3],
                ],
                'asignacion'    => null,
            ],
            [
                'folio'         => 'BCH-20067-20260503-0001',
                'colonia_id'    => 3,  // Reforma
                'tipo_via'      => 'avenida_principal',
                'nombre_via'    => 'Calzada Madero',
                'latitud'       => 17.0589, 'longitud' => -96.7350,
                'descripcion'   => 'Múltiples baches en la misma cuadra. Total de 4 baches de tamaño medio que dificultan el tránsito.',
                'estado'        => 'en_proceso',
                'prioridad'     => 'alta',
                'score'         => 74.8,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depMunId,
                'fecha_offset'  => -7,
                'ai_bache'      => true, 'ai_conf' => 92, 'ai_sev' => 'alta',
                'ai_prof'       => 9.0, 'ai_area' => 0.35,
                'ai_razon'      => 'Múltiples puntos de daño en pavimento en zona de alta densidad vehicular.',
                'foto_color'    => 'F98927',
                'historial'     => [
                    ['anterior' => 'pendiente',  'nuevo' => 'validado',   'user_id' => $this->supervisorId, 'motivo' => 'Confirmado por brigada de inspección.',     'offset' => -6],
                    ['anterior' => 'validado',   'nuevo' => 'asignado',   'user_id' => $this->adminId,     'motivo' => 'Asignado a Carlos Méndez.',                  'offset' => -5],
                    ['anterior' => 'asignado',   'nuevo' => 'en_proceso', 'user_id' => $this->reparadorId, 'motivo' => 'Trabajos iniciados, material en sitio.',      'offset' => -2],
                ],
                'asignacion'    => ['reparador_id' => $this->reparadorId, 'offset' => -5],
            ],
            [
                'folio'         => 'BCH-20067-20260503-0002',
                'colonia_id'    => 1,  // Centro Histórico
                'tipo_via'      => 'calle_secundaria',
                'nombre_via'    => 'Calle García Vigil',
                'latitud'       => 17.0680, 'longitud' => -96.7190,
                'descripcion'   => 'Bache mediano junto a la banqueta, cerca del mercado Benito Juárez. Daño aproximado 8 cm.',
                'estado'        => 'asignado',
                'prioridad'     => 'media',
                'score'         => 55.3,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depMunId,
                'fecha_offset'  => -6,
                'ai_bache'      => true, 'ai_conf' => 84, 'ai_sev' => 'media',
                'ai_prof'       => 8.0, 'ai_area' => 0.22,
                'ai_razon'      => 'Bache de tamaño medio con bordes irregulares. Severidad media confirmada.',
                'foto_color'    => 'F6C541',
                'historial'     => [
                    ['anterior' => 'pendiente', 'nuevo' => 'validado',  'user_id' => $this->supervisorId, 'motivo' => 'Inspeccionado por supervisor zona centro.', 'offset' => -5],
                    ['anterior' => 'validado',  'nuevo' => 'asignado',  'user_id' => $this->adminId,      'motivo' => 'Asignado según disponibilidad de brigada.',  'offset' => -3],
                ],
                'asignacion'    => ['reparador_id' => $this->reparadorId, 'offset' => -3],
            ],
            [
                'folio'         => 'BCH-20067-20260428-0001',
                'colonia_id'    => 2,  // Jalatlaco
                'tipo_via'      => 'calle_secundaria',
                'nombre_via'    => 'Calle Rufino Tamayo',
                'latitud'       => 17.0621, 'longitud' => -96.7109,
                'descripcion'   => 'Bache en esquina completamente reparado. Se utilizó mezcla asfáltica en frío.',
                'estado'        => 'resuelto',
                'prioridad'     => 'media',
                'score'         => 50.0,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depMunId,
                'fecha_offset'  => -14,
                'ai_bache'      => true, 'ai_conf' => 79, 'ai_sev' => 'media',
                'ai_prof'       => 7.0, 'ai_area' => 0.18,
                'ai_razon'      => 'Daño moderado en intersección. Condición mejorada respecto a reportes previos.',
                'foto_color'    => '59B038',
                'historial'     => [
                    ['anterior' => 'pendiente',  'nuevo' => 'validado',   'user_id' => $this->supervisorId, 'motivo' => 'Validado en recorrido de rutina.',          'offset' => -13],
                    ['anterior' => 'validado',   'nuevo' => 'asignado',   'user_id' => $this->adminId,      'motivo' => 'Asignado a brigada sur.',                   'offset' => -12],
                    ['anterior' => 'asignado',   'nuevo' => 'en_proceso', 'user_id' => $this->reparadorId,  'motivo' => 'Inicio de trabajos de bacheo.',             'offset' => -10],
                    ['anterior' => 'en_proceso', 'nuevo' => 'resuelto',   'user_id' => $this->reparadorId,  'motivo' => 'Bacheo completado. Área compactada y lista.','offset' => -8],
                ],
                'asignacion'    => ['reparador_id' => $this->reparadorId, 'offset' => -12],
                'fecha_resolucion_offset' => -8,
            ],
            [
                'folio'         => 'BCH-20067-20260504-0001',
                'colonia_id'    => 2,  // Jalatlaco
                'tipo_via'      => 'callejon',
                'nombre_via'    => 'Callejón del Calvario',
                'latitud'       => 17.0615, 'longitud' => -96.7098,
                'descripcion'   => 'Grieta pequeña sin urgencia en el inicio del callejón. Área de baja circulación vehicular.',
                'estado'        => 'pendiente',
                'prioridad'     => 'baja',
                'score'         => 28.1,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depMunId,
                'fecha_offset'  => -1,
                'ai_bache'      => true, 'ai_conf' => 71, 'ai_sev' => 'baja',
                'ai_prof'       => 3.0, 'ai_area' => 0.08,
                'ai_razon'      => 'Grieta superficial en zona de bajo tráfico. Sin riesgo inmediato para vehículos.',
                'foto_color'    => '9099B8',
                'historial'     => [],
                'asignacion'    => null,
            ],
            [
                'folio'         => 'BCH-20067-20260504-0002',
                'colonia_id'    => 4,  // El Retiro
                'tipo_via'      => 'avenida_principal',
                'nombre_via'    => 'Avenida Universidad',
                'latitud'       => 17.0750, 'longitud' => -96.7180,
                'descripcion'   => 'Bache enorme frente a entrada principal de la UABJO. Peligro inminente, zona de alta afluencia estudiantil.',
                'estado'        => 'validado',
                'prioridad'     => 'critica',
                'score'         => 95.2,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSiviId,
                'fecha_offset'  => -2,
                'ai_bache'      => true, 'ai_conf' => 98, 'ai_sev' => 'alta',
                'ai_prof'       => 18.0, 'ai_area' => 1.20,
                'ai_razon'      => 'Daño crítico de gran extensión frente a infraestructura educativa. Requiere atención urgente.',
                'foto_color'    => 'F44C63',
                'historial'     => [
                    ['anterior' => 'pendiente', 'nuevo' => 'validado', 'user_id' => $this->adminId, 'motivo' => 'Prioridad máxima por ubicación frente a UABJO.', 'offset' => -1],
                ],
                'asignacion'    => null,
            ],
            [
                'folio'         => 'BCH-20067-20260430-0001',
                'colonia_id'    => 1,  // Centro Histórico
                'tipo_via'      => 'calle_secundaria',
                'nombre_via'    => 'Calle Morelos',
                'latitud'       => 17.0660, 'longitud' => -96.7210,
                'descripcion'   => 'Foto enviada no corresponde a un bache real. Se observa una mancha de aceite, no daño estructural.',
                'estado'        => 'rechazado',
                'prioridad'     => 'baja',
                'score'         => 10.0,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depMunId,
                'fecha_offset'  => -10,
                'ai_bache'      => false, 'ai_conf' => 12, 'ai_sev' => null,
                'ai_prof'       => null, 'ai_area' => null,
                'ai_razon'      => 'La imagen muestra una mancha de aceite o suciedad, no se detecta daño estructural en el pavimento.',
                'foto_color'    => '9099B8',
                'historial'     => [
                    ['anterior' => 'pendiente', 'nuevo' => 'rechazado', 'user_id' => $this->supervisorId, 'motivo' => 'Foto no corresponde a bache. Se notifica al ciudadano.', 'offset' => -9],
                ],
                'asignacion'    => null,
            ],
            [
                'folio'         => 'BCH-20067-20260505-0001',
                'colonia_id'    => 8,  // Xochimilco
                'tipo_via'      => 'calle_secundaria',
                'nombre_via'    => 'Calle Juárez',
                'latitud'       => 17.0645, 'longitud' => -96.7320,
                'descripcion'   => 'Bache profundo en calle empedrada histórica. Daño visible desde hace 2 semanas, zona turística.',
                'estado'        => 'pendiente',
                'prioridad'     => 'alta',
                'score'         => 72.4,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSiviId,
                'fecha_offset'  => -3,
                'ai_bache'      => true, 'ai_conf' => 88, 'ai_sev' => 'alta',
                'ai_prof'       => 11.0, 'ai_area' => 0.40,
                'ai_razon'      => 'Daño profundo en zona histórica con alto tráfico peatonal y turístico. Prioridad elevada.',
                'foto_color'    => 'F98927',
                'historial'     => [],
                'asignacion'    => null,
            ],
            [
                'folio'         => 'BCH-20067-20260427-0001',
                'colonia_id'    => 11, // Ex Marquesado
                'tipo_via'      => 'carretera',
                'nombre_via'    => 'Carretera Oaxaca-Istmo',
                'latitud'       => 17.0520, 'longitud' => -96.7450,
                'descripcion'   => 'Bache crítico en carretera de acceso principal. Afecta transporte de carga y transporte público.',
                'estado'        => 'en_proceso',
                'prioridad'     => 'critica',
                'score'         => 88.7,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSiviId,
                'fecha_offset'  => -12,
                'ai_bache'      => true, 'ai_conf' => 95, 'ai_sev' => 'alta',
                'ai_prof'       => 16.0, 'ai_area' => 1.10,
                'ai_razon'      => 'Bache crítico en vía de alta velocidad. Riesgo grave para transporte pesado.',
                'foto_color'    => 'F44C63',
                'historial'     => [
                    ['anterior' => 'pendiente',  'nuevo' => 'validado',   'user_id' => $this->supervisorId, 'motivo' => 'Verificado en inspección de carretera.',        'offset' => -11],
                    ['anterior' => 'validado',   'nuevo' => 'asignado',   'user_id' => $this->adminId,      'motivo' => 'Asignado con carácter urgente.',                'offset' => -10],
                    ['anterior' => 'asignado',   'nuevo' => 'en_proceso', 'user_id' => $this->reparadorId,  'motivo' => 'Equipo en sitio. Bacheo en progreso.',          'offset' => -4],
                ],
                'asignacion'    => ['reparador_id' => $this->reparadorId, 'offset' => -10],
            ],
            [
                'folio'         => 'BCH-20067-20260506-0001',
                'colonia_id'    => 1,  // Centro Histórico
                'tipo_via'      => 'calle_secundaria',
                'nombre_via'    => 'Calle Macedonio Alcalá',
                'latitud'       => 17.0672, 'longitud' => -96.7195,
                'descripcion'   => 'Bache mediano en peatonal más famosa de Oaxaca. Urgente reparar por impacto turístico.',
                'estado'        => 'asignado',
                'prioridad'     => 'media',
                'score'         => 62.1,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depMunId,
                'fecha_offset'  => -2,
                'ai_bache'      => true, 'ai_conf' => 85, 'ai_sev' => 'media',
                'ai_prof'       => 6.0, 'ai_area' => 0.15,
                'ai_razon'      => 'Bache moderado en zona peatonal de alta visibilidad turística.',
                'foto_color'    => 'F6C541',
                'historial'     => [
                    ['anterior' => 'pendiente', 'nuevo' => 'validado',  'user_id' => $this->supervisorId, 'motivo' => 'Confirmado. Zona turística prioritaria.',  'offset' => -1],
                    ['anterior' => 'validado',  'nuevo' => 'asignado',  'user_id' => $this->adminId,      'motivo' => 'Asignado a brigada centro histórico.',      'offset' => -1],
                ],
                'asignacion'    => ['reparador_id' => $this->reparadorId, 'offset' => -1],
            ],
            [
                'folio'         => 'BCH-20067-20260425-0001',
                'colonia_id'    => 10, // Linda Vista
                'tipo_via'      => 'boulevard',
                'nombre_via'    => 'Boulevard Benito Juárez',
                'latitud'       => 17.0860, 'longitud' => -96.7150,
                'descripcion'   => 'Bache resuelto exitosamente. Bacheo con mezcla en caliente. Superficie compactada y señalizada.',
                'estado'        => 'resuelto',
                'prioridad'     => 'alta',
                'score'         => 76.0,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSiviId,
                'fecha_offset'  => -20,
                'ai_bache'      => true, 'ai_conf' => 91, 'ai_sev' => 'alta',
                'ai_prof'       => 13.0, 'ai_area' => 0.60,
                'ai_razon'      => 'Bache profundo en boulevard principal. Alta prioridad confirmada por IA.',
                'foto_color'    => '59B038',
                'historial'     => [
                    ['anterior' => 'pendiente',  'nuevo' => 'validado',   'user_id' => $this->supervisorId, 'motivo' => 'Validado.',              'offset' => -19],
                    ['anterior' => 'validado',   'nuevo' => 'asignado',   'user_id' => $this->adminId,      'motivo' => 'Asignado.',              'offset' => -18],
                    ['anterior' => 'asignado',   'nuevo' => 'en_proceso', 'user_id' => $this->reparadorId,  'motivo' => 'Trabajos iniciados.',     'offset' => -15],
                    ['anterior' => 'en_proceso', 'nuevo' => 'resuelto',   'user_id' => $this->reparadorId,  'motivo' => 'Reparación completada.',  'offset' => -12],
                ],
                'asignacion'    => ['reparador_id' => $this->reparadorId, 'offset' => -18],
                'fecha_resolucion_offset' => -12,
            ],
            [
                'folio'         => 'BCH-20067-20260507-0001',
                'colonia_id'    => 6,  // La Estrella
                'tipo_via'      => 'calle_secundaria',
                'nombre_via'    => 'Calle Pino Suárez',
                'latitud'       => 17.0700, 'longitud' => -96.7280,
                'descripcion'   => 'Hundimiento del pavimento en esquina con Calle Flores Magón. Posible falla en tubería subterránea.',
                'estado'        => 'pendiente',
                'prioridad'     => 'alta',
                'score'         => 68.5,
                'ciudadano_id'  => $this->ciudadanoId,
                'dependencia_id'=> $this->depSapaoId,
                'fecha_offset'  => -1,
                'ai_bache'      => true, 'ai_conf' => 87, 'ai_sev' => 'alta',
                'ai_prof'       => 14.0, 'ai_area' => 0.55,
                'ai_razon'      => 'Hundimiento severo con posible origen en falla de infraestructura subterránea.',
                'foto_color'    => 'F98927',
                'historial'     => [],
                'asignacion'    => null,
            ],
        ];

        foreach ($reportes as $r) {
            $now        = Carbon::now();
            $fechaRep   = $now->copy()->addDays($r['fecha_offset'])->setHour(rand(7,18))->setMinute(rand(0,59));
            $fechaRes   = isset($r['fecha_resolucion_offset'])
                ? $now->copy()->addDays($r['fecha_resolucion_offset'])->setHour(rand(9,17))
                : null;

            // Reporte
            $reporteId = DB::table('reportes')->insertGetId([
                'folio'              => $r['folio'],
                'ciudadano_id'       => $r['ciudadano_id'],
                'dependencia_id'     => $r['dependencia_id'],
                'municipio_id'       => $this->municipioId,
                'colonia_id'         => $r['colonia_id'],
                'tipo_via'           => $r['tipo_via'],
                'nombre_via'         => $r['nombre_via'],
                'latitud'            => $r['latitud'],
                'longitud'           => $r['longitud'],
                'descripcion'        => $r['descripcion'],
                'estado'             => $r['estado'],
                'prioridad'          => $r['prioridad'],
                'score_prioridad'    => $r['score'],
                'fecha_reporte'      => $fechaRep,
                'fecha_resolucion'   => $fechaRes,
                'created_at'         => $fechaRep,
                'updated_at'         => $fechaRep,
            ]);

            // Foto
            DB::table('reporte_fotos')->insert([
                'reporte_id'   => $reporteId,
                'url'          => "https://placehold.co/800x600/{$r['foto_color']}/white?text=" . urlencode($r['nombre_via']),
                'storage_path' => "reportes/{$reporteId}/foto_principal.jpg",
                'tipo'         => 'ciudadano',
                'es_principal' => true,
                'orden'        => 0,
                'created_at'   => $fechaRep,
                'updated_at'   => $fechaRep,
            ]);

            // AI Análisis
            DB::table('reporte_ai_analisis')->insert([
                'reporte_id'              => $reporteId,
                'modelo_usado'            => 'gpt-4o',
                'es_bache'                => $r['ai_bache'] ? 1 : 0,
                'confianza'               => $r['ai_conf'],
                'severidad_ia'            => $r['ai_sev'],
                'profundidad_estimada_cm' => $r['ai_prof'],
                'area_estimada_m2'        => $r['ai_area'],
                'razon'                   => $r['ai_razon'],
                'raw_response'            => json_encode(['modo' => 'seeder_demo']),
                'tokens_usados'           => rand(180, 280),
                'created_at'              => $fechaRep,
                'updated_at'              => $fechaRep,
            ]);

            // Score detalle
            $scoreSev   = $r['ai_bache'] ? match($r['ai_sev']) { 'alta'=>9.5,'media'=>6.0,default=>2.0 } * ($r['ai_conf']/100) : 0;
            $scoreVia   = match($r['tipo_via']) { 'avenida_principal'=>5.0,'boulevard'=>4.5,'carretera'=>4.0,'calle_secundaria'=>2.5,'callejon'=>1.0,default=>2.5 };
            $scorePci   = min(($r['ai_prof'] ?? 0) / 2, 10);
            $scoreArea  = min(($r['ai_area'] ?? 0) * 10, 10);

            DB::table('reporte_score_detalle')->insert([
                'reporte_id'                  => $reporteId,
                'score_severidad'             => round($scoreSev, 2),
                'score_tipo_via'              => $scoreVia,
                'score_pci'                   => round($scorePci, 2),
                'score_infraestructura_critica'=> 0,
                'score_trafico'               => round($scoreArea, 2),
                'score_reportes_zona'         => 0,
                'score_final'                 => $r['score'],
                'formula_aplicada'            => 'score = (sev*0.35 + via*0.25 + prof*0.15 + area*0.10 + infra*0.10 + zona*0.05) * 10',
                'calculado_at'                => $fechaRep,
                'created_at'                  => $fechaRep,
                'updated_at'                  => $fechaRep,
            ]);

            // Historial de estados
            foreach ($r['historial'] as $h) {
                $fechaH = $now->copy()->addDays($h['offset'])->setHour(rand(8,17));
                DB::table('historial_estados')->insert([
                    'reporte_id'      => $reporteId,
                    'user_id'         => $h['user_id'],
                    'estado_anterior' => $h['anterior'],
                    'estado_nuevo'    => $h['nuevo'],
                    'motivo'          => $h['motivo'],
                    'created_at'      => $fechaH,
                    'updated_at'      => $fechaH,
                ]);
            }

            // Asignación
            if ($r['asignacion']) {
                $fechaA = $now->copy()->addDays($r['asignacion']['offset'])->setHour(rand(8,16));
                $estadoAsig = match($r['estado']) {
                    'en_proceso' => 'en_proceso',
                    'resuelto'   => 'completada',
                    default      => 'pendiente',
                };
                DB::table('asignaciones')->insert([
                    'reporte_id'       => $reporteId,
                    'asignado_a'       => $r['asignacion']['reparador_id'],
                    'asignado_por'     => $this->adminId,
                    'dependencia_id'   => $r['dependencia_id'],
                    'estado'           => $estadoAsig,
                    'notas_asignacion' => 'Asignación desde panel de gestión.',
                    'fecha_asignacion' => $fechaA,
                    'fecha_inicio'     => $estadoAsig !== 'pendiente' ? $fechaA->copy()->addHours(2) : null,
                    'fecha_completada' => $estadoAsig === 'completada' ? $fechaRes : null,
                    'created_at'       => $fechaA,
                    'updated_at'       => $fechaA,
                ]);
            }
        }

        $this->command->info('✓ ' . count($reportes) . ' reportes creados con fotos, AI, score, historial y asignaciones.');
    }

    // ─────────────────────────────────────────────────
    //  PRESUPUESTOS (agrega más para llegar a 10+)
    // ─────────────────────────────────────────────────
    private function seedPresupuestosExtra(): void
    {
        $extras = [
            ['mes' => 6,  'concepto' => 'Bacheo de emergencia Periférico Norte',    'tipo' => 'asignado', 'monto' => 780000, 'dep' => $this->depSiviId],
            ['mes' => 6,  'concepto' => 'Ejecución obra Periférico Norte',          'tipo' => 'ejercido', 'monto' => 620000, 'dep' => $this->depSiviId],
            ['mes' => 7,  'concepto' => 'Mantenimiento vial zona centro histórico', 'tipo' => 'asignado', 'monto' => 450000, 'dep' => $this->depMunId],
            ['mes' => 7,  'concepto' => 'Mantenimiento vial zona centro histórico', 'tipo' => 'ejercido', 'monto' => 290000, 'dep' => $this->depMunId],
            ['mes' => 8,  'concepto' => 'Bacheo preventivo colonias norte',         'tipo' => 'asignado', 'monto' => 920000, 'dep' => $this->depSiviId],
            ['mes' => 9,  'concepto' => 'Rehabilitación carretera Oaxaca-Istmo',    'tipo' => 'asignado', 'monto' => 1500000,'dep' => $this->depSiviId],
            ['mes' => 10, 'concepto' => 'Pavimentación nueva Colonia Volcanes',     'tipo' => 'asignado', 'monto' => 680000, 'dep' => $this->depMunId],
        ];

        foreach ($extras as $p) {
            DB::table('presupuestos')->insert([
                'dependencia_id' => $p['dep'],
                'municipio_id'   => $this->municipioId,
                'anio'           => 2026,
                'mes'            => $p['mes'],
                'concepto'       => $p['concepto'],
                'tipo'           => $p['tipo'],
                'monto'          => $p['monto'],
                'notas'          => null,
                'registrado_por' => $this->adminId,
                'created_at'     => Carbon::now()->subDays(rand(1,30)),
                'updated_at'     => Carbon::now()->subDays(rand(1,30)),
            ]);
        }

        $total = DB::table('presupuestos')->count();
        $this->command->info("✓ Presupuestos: {$total} registros en total.");
    }
}
