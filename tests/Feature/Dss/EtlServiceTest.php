<?php

namespace Tests\Feature\Dss;

use App\Models\DssEtlAnomalia;
use App\Models\DssEtlEjecucion;
use App\Models\DssReporteLimpio;
use App\Models\User;
use App\Services\Dss\EtlService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Módulo DSS (Proyecto Integrador DSTD): pruebas de las reglas de limpieza del ETL.
class EtlServiceTest extends TestCase
{
    use RefreshDatabase;

    private int $municipioId;

    private int $coloniaId;

    private int $userId;

    private int $consecutivo = 0;

    protected function setUp(): void
    {
        parent::setUp();

        $estadoId = DB::table('estados')->insertGetId([
            'clave_inegi' => '20', 'nombre' => 'Oaxaca', 'abreviatura' => 'OAX',
        ]);
        $this->municipioId = DB::table('municipios')->insertGetId([
            'clave_inegi' => '20067', 'estado_id' => $estadoId, 'nombre' => 'Oaxaca de Juárez',
        ]);
        $this->coloniaId = DB::table('colonias')->insertGetId([
            'municipio_id' => $this->municipioId, 'nombre' => 'Centro Histórico', 'cp' => '68000',
        ]);
        $this->userId = User::factory()->create()->id;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Inserta un reporte limpio por defecto; $datos sobrescribe columnas.
     * $confianza = null → sin análisis IA.
     */
    private function crearReporte(array $datos = [], ?float $confianza = 90, string $severidad = 'media'): int
    {
        $this->consecutivo++;

        $id = DB::table('reportes')->insertGetId(array_merge([
            'folio' => sprintf('TEST-%04d', $this->consecutivo),
            'ciudadano_id' => $this->userId,
            'municipio_id' => $this->municipioId,
            'colonia_id' => $this->coloniaId,
            'tipo_via' => 'calle_secundaria',
            // Cada reporte a ~550 m del anterior para no generar duplicados accidentales
            'latitud' => 17.0400 + $this->consecutivo * 0.005,
            'longitud' => -96.7200,
            'estado' => 'pendiente',
            'prioridad' => 'media',
            'score_prioridad' => 50,
            'fecha_reporte' => now()->subDays(10),
            'created_at' => now(),
            'updated_at' => now(),
        ], $datos));

        if ($confianza !== null) {
            DB::table('reporte_ai_analisis')->insert([
                'reporte_id' => $id,
                'confianza' => $confianza,
                'severidad_ia' => $severidad,
                'es_bache' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $id;
    }

    private function ejecutar(): DssEtlEjecucion
    {
        $ejecucion = app(EtlService::class)->ejecutar();
        $this->assertSame('completado', $ejecucion->estado, (string) $ejecucion->mensaje_error);

        return $ejecucion;
    }

    private function anomaliasDe(int $reporteId): Collection
    {
        return DssEtlAnomalia::where('reporte_id', $reporteId)->get();
    }

    private function limpioDe(int $reporteId): ?DssReporteLimpio
    {
        return DssReporteLimpio::where('reporte_id', $reporteId)->first();
    }

    // ── Datos limpios ─────────────────────────────────────────────────────────

    public function test_datos_limpios_no_generan_anomalias(): void
    {
        $ids = [$this->crearReporte(), $this->crearReporte(), $this->crearReporte()];

        $e = $this->ejecutar();

        $this->assertSame(3, $e->registros_leidos);
        $this->assertSame(3, $e->registros_cargados);
        $this->assertSame(0, $e->registros_descartados);
        $this->assertSame(0, $e->registros_con_advertencia);
        $this->assertSame(0, DssEtlAnomalia::count());
        $this->assertSame(100.0, $e->tasaCalidad());

        $limpio = $this->limpioDe($ids[0]);
        $this->assertTrue($limpio->datos_suficientes);
        $this->assertSame(1, $limpio->num_reportes_fusionados);
        $this->assertSame(10, $limpio->dias_pendiente);
        $this->assertEqualsWithDelta(0.60, $limpio->severidad, 0.001);
        $this->assertEqualsWithDelta(0.50, $limpio->tipo_via, 0.001);
    }

    // ── Regla 1: coordenadas ──────────────────────────────────────────────────

    public function test_regla_1_coordenadas_fuera_de_oaxaca_se_descartan(): void
    {
        $cero = $this->crearReporte(['latitud' => 0, 'longitud' => 0]);
        $cdmx = $this->crearReporte(['latitud' => 19.4326, 'longitud' => -99.1332]);
        $valido = $this->crearReporte();

        $e = $this->ejecutar();

        $this->assertSame(2, $e->registros_descartados);
        $this->assertSame(1, $e->registros_cargados);

        foreach ([$cero, $cdmx] as $id) {
            $a = $this->anomaliasDe($id)->sole();
            $this->assertSame('coordenada_fuera_rango', $a->tipo_anomalia);
            $this->assertSame('descartado', $a->accion_tomada);
            $this->assertSame('error', $a->severidad);
            $this->assertNull($this->limpioDe($id));
        }

        $this->assertStringContainsString('19.4326', $this->anomaliasDe($cdmx)->sole()->valor_original);
        $this->assertNotNull($this->limpioDe($valido));
    }

    // ── Regla 2: duplicados ───────────────────────────────────────────────────

    public function test_regla_2_duplicados_se_fusionan_en_el_mas_antiguo(): void
    {
        $original = $this->crearReporte(['latitud' => 17.0500, 'longitud' => -96.7100, 'fecha_reporte' => now()->subDays(10)]);
        // ~5 m al norte y 2 días después
        $duplicado = $this->crearReporte(['latitud' => 17.050045, 'longitud' => -96.7100, 'fecha_reporte' => now()->subDays(8)]);
        // Mismo punto pero 9 días después del original: NO es duplicado
        $otroMomento = $this->crearReporte(['latitud' => 17.0500, 'longitud' => -96.7100, 'fecha_reporte' => now()->subDays(1)]);

        $e = $this->ejecutar();

        $this->assertSame(2, $e->registros_cargados);
        $this->assertSame(0, $e->registros_descartados);

        $a = $this->anomaliasDe($duplicado)->sole();
        $this->assertSame('duplicado', $a->tipo_anomalia);
        $this->assertSame('fusionado', $a->accion_tomada);
        $this->assertStringContainsString('TEST-0001', $a->valor_original);

        $this->assertNull($this->limpioDe($duplicado));
        $this->assertSame(2, $this->limpioDe($original)->num_reportes_fusionados);
        $this->assertSame(1, $this->limpioDe($otroMomento)->num_reportes_fusionados);
        $this->assertCount(0, $this->anomaliasDe($original));
    }

    // ── Regla 3: tipo_via ─────────────────────────────────────────────────────

    public function test_regla_3_tipo_via_nulo_se_imputa(): void
    {
        $avenidaId = DB::table('calles')->insertGetId([
            'municipio_id' => $this->municipioId, 'colonia_id' => $this->coloniaId,
            'nombre' => 'Avenida Juárez', 'tipo' => 'avenida', 'importancia' => 'principal',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $conCalle = $this->crearReporte(['tipo_via' => null, 'calle_id' => $avenidaId]);
        $sinCalle = $this->crearReporte(['tipo_via' => null]);

        $e = $this->ejecutar();

        $this->assertSame(2, $e->registros_cargados);
        $this->assertSame(2, $e->registros_con_advertencia);

        foreach ([$conCalle, $sinCalle] as $id) {
            $a = $this->anomaliasDe($id)->sole();
            $this->assertSame('tipo_via_faltante', $a->tipo_anomalia);
            $this->assertSame('imputado', $a->accion_tomada);
            $this->assertSame('advertencia', $a->severidad);
        }

        // avenida → avenida_principal (0.90); sin calle → calle_secundaria (0.50)
        $this->assertEqualsWithDelta(0.90, $this->limpioDe($conCalle)->tipo_via, 0.001);
        $this->assertEqualsWithDelta(0.50, $this->limpioDe($sinCalle)->tipo_via, 0.001);
        $this->assertStringContainsString(EtlService::TIPO_VIA_IMPUTADO, $this->anomaliasDe($sinCalle)->sole()->regla_aplicada);
    }

    // ── Regla 4: análisis IA ──────────────────────────────────────────────────

    public function test_regla_4_sin_analisis_ia_o_confianza_baja_se_marca(): void
    {
        $sinIa = $this->crearReporte([], null);
        $confianzaBaja = $this->crearReporte([], 30);
        $confianzaOk = $this->crearReporte([], 50);

        $e = $this->ejecutar();

        $this->assertSame(3, $e->registros_cargados);
        $this->assertSame(2, $e->registros_con_advertencia);

        foreach ([$sinIa, $confianzaBaja] as $id) {
            $a = $this->anomaliasDe($id)->sole();
            $this->assertSame('sin_analisis_ia', $a->tipo_anomalia);
            $this->assertSame('marcado', $a->accion_tomada);
            $this->assertFalse($this->limpioDe($id)->datos_suficientes);
        }

        $this->assertSame('30', $this->anomaliasDe($confianzaBaja)->sole()->valor_original);
        $this->assertTrue($this->limpioDe($confianzaOk)->datos_suficientes);
        $this->assertCount(0, $this->anomaliasDe($confianzaOk));
    }

    // ── Regla 5: fechas ───────────────────────────────────────────────────────

    public function test_regla_5_fecha_de_reporte_futura_se_descarta(): void
    {
        $futuro = $this->crearReporte(['fecha_reporte' => now()->addDays(3)]);

        $e = $this->ejecutar();

        $this->assertSame(1, $e->registros_descartados);
        $a = $this->anomaliasDe($futuro)->sole();
        $this->assertSame('fecha_invalida', $a->tipo_anomalia);
        $this->assertSame('descartado', $a->accion_tomada);
        $this->assertSame('error', $a->severidad);
        $this->assertNull($this->limpioDe($futuro));
    }

    public function test_regla_5_resolucion_anterior_al_reporte_se_marca(): void
    {
        $id = $this->crearReporte([
            'fecha_reporte' => now()->subDays(10),
            'fecha_resolucion' => now()->subDays(15),
        ]);

        $e = $this->ejecutar();

        $this->assertSame(1, $e->registros_cargados);
        $a = $this->anomaliasDe($id)->sole();
        $this->assertSame('fecha_invalida', $a->tipo_anomalia);
        $this->assertSame('fecha_resolucion', $a->campo);
        $this->assertSame('marcado', $a->accion_tomada);
        $this->assertNotNull($this->limpioDe($id));
    }

    // ── Regla 6: colonia faltante ─────────────────────────────────────────────

    public function test_regla_6_colonia_nula_se_imputa_por_la_calle(): void
    {
        $reformaId = DB::table('colonias')->insertGetId([
            'municipio_id' => $this->municipioId, 'nombre' => 'Reforma', 'cp' => '68050',
        ]);
        $calleId = DB::table('calles')->insertGetId([
            'municipio_id' => $this->municipioId, 'colonia_id' => $reformaId,
            'nombre' => 'Calle Eucalipto', 'tipo' => 'calle', 'importancia' => 'local',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $id = $this->crearReporte(['colonia_id' => null, 'calle_id' => $calleId]);

        $e = $this->ejecutar();

        $a = $this->anomaliasDe($id)->sole();
        $this->assertSame('campo_faltante', $a->tipo_anomalia);
        $this->assertSame('colonia_id', $a->campo);
        $this->assertSame('imputado', $a->accion_tomada);
        $this->assertSame('advertencia', $a->severidad);
        $this->assertStringContainsString("'Reforma' de la calle asociada", $a->regla_aplicada);
        $this->assertSame($reformaId, $this->limpioDe($id)->colonia_id);
        $this->assertSame(1, $e->registros_con_advertencia);
        // El ETL no modifica reportes: la colonia imputada solo vive en dss_reportes_limpios
        $this->assertNull(DB::table('reportes')->where('id', $id)->value('colonia_id'));
    }

    public function test_regla_6_colonia_nula_se_imputa_por_el_reporte_limpio_mas_cercano(): void
    {
        $vecino = $this->crearReporte(['latitud' => 17.0600, 'longitud' => -96.7100]);
        // ~100 m al norte del vecino, sin colonia ni calle
        $sinColonia = $this->crearReporte(['colonia_id' => null, 'latitud' => 17.0609, 'longitud' => -96.7100]);

        $this->ejecutar();

        $a = $this->anomaliasDe($sinColonia)->sole();
        $this->assertSame('imputado', $a->accion_tomada);
        $this->assertStringContainsString('reporte limpio más cercano (TEST-0001', $a->regla_aplicada);
        $this->assertSame($this->coloniaId, $this->limpioDe($sinColonia)->colonia_id);
        $this->assertCount(0, $this->anomaliasDe($vecino));
    }

    public function test_regla_6_colonia_nula_sin_referencia_se_marca_sin_colonia(): void
    {
        $this->crearReporte(['latitud' => 17.0600, 'longitud' => -96.7100]);
        // ~1 km del único reporte con colonia: fuera del radio de 200 m
        $aislado = $this->crearReporte(['colonia_id' => null, 'latitud' => 17.0690, 'longitud' => -96.7100]);

        $e = $this->ejecutar();

        $a = $this->anomaliasDe($aislado)->sole();
        $this->assertSame('campo_faltante', $a->tipo_anomalia);
        $this->assertSame('marcado', $a->accion_tomada);
        $this->assertStringContainsString("'Sin colonia'", $a->regla_aplicada);
        $this->assertNull($this->limpioDe($aislado)->colonia_id);
        $this->assertSame(2, $e->registros_cargados);   // se carga, no se descarta
    }

    // ── Reproducibilidad e integridad ─────────────────────────────────────────

    public function test_dos_ejecuciones_sobre_los_mismos_datos_dan_los_mismos_conteos(): void
    {
        $this->crearReporte();
        $this->crearReporte(['latitud' => 0, 'longitud' => 0]);
        $this->crearReporte(['tipo_via' => null]);
        $this->crearReporte([], null);
        $this->crearReporte(['latitud' => 17.0500, 'longitud' => -96.7100, 'fecha_reporte' => now()->subDays(5)]);
        $this->crearReporte(['latitud' => 17.0500, 'longitud' => -96.7100, 'fecha_reporte' => now()->subDays(4)]);
        $this->crearReporte(['fecha_reporte' => now()->addDay()]);

        $primera = $this->ejecutar();
        $segunda = $this->ejecutar();

        $this->assertNotSame($primera->id, $segunda->id);

        foreach (['registros_leidos', 'registros_cargados', 'registros_descartados', 'registros_con_advertencia'] as $campo) {
            $this->assertSame($primera->$campo, $segunda->$campo, $campo);
        }

        $this->assertSame($primera->conteoPorTipo(), $segunda->conteoPorTipo());
        $this->assertSame(
            $primera->reportesLimpios()->orderBy('reporte_id')->pluck('reporte_id')->all(),
            $segunda->reportesLimpios()->orderBy('reporte_id')->pluck('reporte_id')->all()
        );
    }

    public function test_el_etl_no_modifica_la_tabla_reportes(): void
    {
        $this->crearReporte(['tipo_via' => null]);
        $this->crearReporte(['latitud' => 0, 'longitud' => 0]);
        $antes = DB::table('reportes')->orderBy('id')->get()->toArray();

        $this->ejecutar();

        $this->assertEquals($antes, DB::table('reportes')->orderBy('id')->get()->toArray());
    }
}
