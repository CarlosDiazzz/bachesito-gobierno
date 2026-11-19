<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Módulo DSS (Proyecto Integrador DSTD).
 *
 * Inserta reportes SIMULADOS con errores intencionales para demostrar las
 * reglas de limpieza del ETL. No forma parte de DatabaseSeeder; se ejecuta con:
 *
 *   php artisan db:seed --class=DatosSuciosSeeder
 *
 * Todos los registros llevan folio "SIM-" y su descripción empieza con
 * "[DATO SIMULADO]". Se insertan con DB::table() porque Reporte::boot()
 * reemplaza el folio al crear con Eloquent.
 */
class DatosSuciosSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('reportes')->where('folio', 'like', 'SIM-%')->exists()) {
            $this->command?->warn('Los reportes SIM- ya existen; no se insertó nada.');

            return;
        }

        $municipioId = DB::table('municipios')->where('clave_inegi', '20067')->value('id');
        $ciudadanoId = DB::table('users')->where('email', 'ciudadano@bachesito.gob.mx')->value('id')
            ?? DB::table('users')->orderBy('id')->value('id');

        $colonia = fn (string $nombre) => DB::table('colonias')
            ->where('nombre', $nombre)->where('municipio_id', $municipioId)->value('id');
        $calle = fn (string $nombre) => DB::table('calles')
            ->where('nombre', $nombre)->where('municipio_id', $municipioId)->value('id');

        $centro = $colonia('Centro Histórico');
        $reforma = $colonia('Reforma');
        $jalatlaco = $colonia('Jalatlaco');
        $avJuarez = $calle('Avenida Juárez');
        $eucalipto = $calle('Calle Eucalipto');

        $hoy = Carbon::now()->startOfHour();

        // [sufijo folio, descripción, colonia, calle, tipo_via, lat, lng, días (negativo = pasado),
        //  días resolución (null = sin resolver), confianza IA (null = sin análisis), severidad IA]
        $reportes = [
            // ── Control: reportes correctos ───────────────────────────────────
            ['0001', 'Control: bache mediano en carril derecho.', $centro, $avJuarez, 'avenida_principal', 17.0400, -96.7000, -12, null, 92, 'alta'],
            ['0002', 'Control: grieta con hundimiento leve.', $reforma, $eucalipto, 'calle_secundaria', 17.0420, -96.7030, -8, null, 85, 'media'],
            ['0003', 'Control: bache pequeño junto a coladera.', $jalatlaco, null, 'callejon', 17.0440, -96.7060, -4, null, 78, 'baja'],
            ['0004', 'Control: bache profundo en acotamiento.', $centro, null, 'carretera', 17.0460, -96.7090, -20, null, 95, 'alta'],

            // ── Regla 1: coordenadas fuera de Oaxaca de Juárez ────────────────
            ['0005', 'Coordenadas en 0,0 (GPS sin señal).', $centro, null, 'calle_secundaria', 0.0, 0.0, -6, null, 80, 'media'],
            ['0006', 'Coordenadas en Ciudad de México.', $centro, null, 'avenida_principal', 19.4326, -99.1332, -6, null, 80, 'alta'],
            ['0007', 'Latitud al norte del límite municipal.', $reforma, null, 'calle_secundaria', 17.3000, -96.7200, -3, null, 75, 'media'],
            ['0008', 'Longitud al este del límite municipal.', $reforma, null, 'calle_secundaria', 17.0600, -96.4000, -3, null, 75, 'baja'],

            // ── Regla 2: duplicados (< 15 m y < 7 días) ───────────────────────
            ['0009', 'Duplicado A, reporte original.', $centro, null, 'avenida_principal', 17.0480, -96.7120, -10, null, 90, 'alta'],
            ['0010', 'Duplicado A, mismo bache reportado 2 días después a ~5 m.', $centro, null, 'avenida_principal', 17.048045, -96.7120, -8, null, 88, 'alta'],
            ['0011', 'Duplicado B, reporte original.', $jalatlaco, null, 'calle_secundaria', 17.0500, -96.7150, -15, null, 82, 'media'],
            ['0012', 'Duplicado B, mismo bache reportado 1 día después a ~8 m.', $jalatlaco, null, 'calle_secundaria', 17.0500, -96.715075, -14, null, 80, 'media'],

            // ── Regla 3: tipo_via nulo ────────────────────────────────────────
            ['0013', 'Sin tipo de vía; la calle asociada es avenida.', $centro, $avJuarez, null, 17.0520, -96.7180, -9, null, 87, 'alta'],
            ['0014', 'Sin tipo de vía y sin calle asociada.', $reforma, null, null, 17.0540, -96.7210, -7, null, 83, 'media'],

            // ── Regla 4: sin análisis IA o confianza baja ─────────────────────
            ['0015', 'Reporte sin análisis IA.', $jalatlaco, null, 'calle_secundaria', 17.0560, -96.7240, -5, null, null, null],
            ['0016', 'Análisis IA con confianza baja (30).', $centro, null, 'calle_secundaria', 17.0580, -96.7270, -11, null, 30, 'baja'],

            // ── Regla 5a: fecha de reporte en el futuro ───────────────────────
            ['0017', 'Fecha de reporte en el futuro (+3 días).', $centro, null, 'calle_secundaria', 17.0410, -96.7300, 3, null, 80, 'media'],
            ['0018', 'Fecha de reporte en el futuro (+30 días).', $reforma, null, 'avenida_principal', 17.0430, -96.7330, 30, null, 80, 'alta'],

            // ── Regla 5b: resolución anterior al reporte ──────────────────────
            ['0019', 'Fecha de resolución 5 días antes del reporte.', $centro, null, 'calle_secundaria', 17.0450, -96.7360, -10, -15, 84, 'media'],
            ['0020', 'Fecha de resolución 2 días antes del reporte.', $jalatlaco, null, 'callejon', 17.0470, -96.7390, -6, -8, 79, 'baja'],
        ];

        DB::transaction(function () use ($reportes, $municipioId, $ciudadanoId, $hoy) {
            foreach ($reportes as [$sufijo, $desc, $coloniaId, $calleId, $tipoVia, $lat, $lng, $dias, $diasRes, $conf, $sev]) {
                $fecha = $hoy->copy()->addDays($dias);

                $id = DB::table('reportes')->insertGetId([
                    'folio' => "SIM-{$sufijo}",
                    'ciudadano_id' => $ciudadanoId,
                    'municipio_id' => $municipioId,
                    'colonia_id' => $coloniaId,
                    'calle_id' => $calleId,
                    'tipo_via' => $tipoVia,
                    'nombre_via' => 'Vía simulada '.$sufijo,
                    'latitud' => $lat,
                    'longitud' => $lng,
                    'descripcion' => "[DATO SIMULADO] {$desc}",
                    'estado' => 'pendiente',
                    'prioridad' => 'media',
                    'score_prioridad' => 50,
                    'fecha_reporte' => $fecha,
                    'fecha_resolucion' => $diasRes === null ? null : $hoy->copy()->addDays($diasRes),
                    'created_at' => $hoy,
                    'updated_at' => $hoy,
                ]);

                if ($conf !== null) {
                    DB::table('reporte_ai_analisis')->insert([
                        'reporte_id' => $id,
                        'modelo_usado' => 'simulado',
                        'es_bache' => true,
                        'confianza' => $conf,
                        'severidad_ia' => $sev,
                        'razon' => '[DATO SIMULADO] Análisis generado por DatosSuciosSeeder.',
                        'raw_response' => json_encode(['modo' => 'datos_sucios_seeder']),
                        'created_at' => $hoy,
                        'updated_at' => $hoy,
                    ]);
                }
            }
        });

        $this->command?->info(count($reportes).' reportes simulados (SIM-) insertados.');
    }
}
