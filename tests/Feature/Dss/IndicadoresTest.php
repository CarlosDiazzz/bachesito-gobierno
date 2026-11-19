<?php

namespace Tests\Feature\Dss;

use App\Models\User;
use App\Services\Dss\EtlService;
use App\Services\Dss\IndicadoresService;
use App\Services\Dss\RecomendacionService;
use App\Services\TopsisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Módulo DSS (Proyecto Integrador DSTD): indicadores formales y aviso de ETL desactualizado.
class IndicadoresTest extends TestCase
{
    use RefreshDatabase;

    private int $municipioId;

    private int $userId;

    private int $consecutivo = 0;

    private ?int $ejecucionId = null;

    protected function setUp(): void
    {
        parent::setUp();

        $estadoId = DB::table('estados')->insertGetId([
            'clave_inegi' => '20', 'nombre' => 'Oaxaca', 'abreviatura' => 'OAX',
        ]);
        $this->municipioId = DB::table('municipios')->insertGetId([
            'clave_inegi' => '20067', 'estado_id' => $estadoId, 'nombre' => 'Oaxaca de Juárez',
        ]);
        $this->userId = User::factory()->create()->id;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function colonia(string $nombre): int
    {
        return DB::table('colonias')->where('nombre', $nombre)->value('id')
            ?? DB::table('colonias')->insertGetId(['municipio_id' => $this->municipioId, 'nombre' => $nombre, 'cp' => '68000']);
    }

    private function crearEjecucion(int $leidos, int $cargados): void
    {
        $this->ejecucionId = DB::table('dss_etl_ejecuciones')->insertGetId([
            'iniciado_at' => now(), 'finalizado_at' => now(), 'estado' => 'completado',
            'registros_leidos' => $leidos, 'registros_cargados' => $cargados,
            'registros_descartados' => $leidos - $cargados,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function crearReporte(array $datos = [], ?float $area = 0.5): int
    {
        $this->consecutivo++;

        $id = DB::table('reportes')->insertGetId(array_merge([
            'folio' => sprintf('TEST-%04d', $this->consecutivo),
            'ciudadano_id' => $this->userId,
            'municipio_id' => $this->municipioId,
            'tipo_via' => 'calle_secundaria',
            'latitud' => 17.0400 + $this->consecutivo * 0.005,
            'longitud' => -96.7200,
            'estado' => 'pendiente',
            'prioridad' => 'media',
            'score_prioridad' => 50,
            'fecha_reporte' => now()->subDays(10),
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ], $datos));

        DB::table('reporte_ai_analisis')->insert([
            'reporte_id' => $id, 'confianza' => 90, 'severidad_ia' => 'media',
            'area_estimada_m2' => $area, 'es_bache' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return $id;
    }

    private function crearLimpio(string $colonia, int $dias, ?float $area, bool $suficiente = true): void
    {
        $coloniaId = $this->colonia($colonia);
        $id = $this->crearReporte(['colonia_id' => $coloniaId], $area);

        DB::table('dss_reportes_limpios')->insert([
            'ejecucion_id' => $this->ejecucionId, 'reporte_id' => $id,
            'severidad' => 0.6, 'tipo_via' => 0.5, 'dias_pendiente' => $dias,
            'densidad_zona' => 1, 'score_ia' => 50 + $this->consecutivo,
            'colonia_id' => $coloniaId, 'latitud' => 17.05, 'longitud' => -96.72,
            'num_reportes_fusionados' => 1, 'datos_suficientes' => $suficiente,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    /**
     * 7 baches en 6 colonias. Días: 10, 40, 25, 5, 20, 30, 15 → media 20.7, mediana 20.
     * Costos: 1,650 + 1,425 + 1,290 + 1,380 + 1,425 × 3 = 10,020.
     */
    private function crearDatosConocidos(): void
    {
        $this->crearEjecucion(10, 8);
        $this->crearLimpio('Centro', 10, 1.0);
        $this->crearLimpio('Centro', 40, null);
        $this->crearLimpio('Reforma', 25, 0.2);
        $this->crearLimpio('Jalatlaco', 5, 0.4);
        $this->crearLimpio('Volcanes', 20, 0.5);
        $this->crearLimpio('El Retiro', 30, 0.5);
        $this->crearLimpio('La Estrella', 15, 0.5);
    }

    /** @return array{indicadores: array, meta: array} */
    private function calcular(?float $presupuesto): array
    {
        $topsis = app(TopsisService::class);
        $rec = app(RecomendacionService::class)->aplicar($topsis->rankear(), $presupuesto);
        $fuente = $topsis->fuente();
        $servicio = app(IndicadoresService::class);

        return [
            'indicadores' => collect($servicio->calcular($rec['ranking'], $rec['meta'], $fuente, count($topsis->sinSustento())))
                ->keyBy('clave')->all(),
            'meta' => $rec['meta'] + $servicio->estadoEtl($fuente['ejecucion_etl_id']),
        ];
    }

    // ── Indicadores con datos conocidos ───────────────────────────────────────

    public function test_cada_indicador_tiene_la_estructura_completa(): void
    {
        $this->crearDatosConocidos();

        $ind = $this->calcular(3000)['indicadores'];

        $this->assertSame(
            ['antiguedad_backlog', 'cobertura_presupuestal', 'baches_cubiertos', 'concentracion_colonias', 'tasa_calidad_datos'],
            array_keys($ind)
        );
        foreach ($ind as $i) {
            foreach (['clave', 'nombre', 'valor', 'unidad', 'formula', 'fuente', 'interpretacion'] as $campo) {
                $this->assertArrayHasKey($campo, $i);
            }
            $this->assertNotEmpty($i['formula']);
            $this->assertNotEmpty($i['interpretacion']);
        }
    }

    public function test_antiguedad_media_y_mediana(): void
    {
        $this->crearDatosConocidos();

        $a = $this->calcular(3000)['indicadores']['antiguedad_backlog'];

        $this->assertEqualsWithDelta(20.7, $a['valor'], 0.001);   // 145 / 7
        $this->assertEqualsWithDelta(20.0, $a['detalle']['mediana'], 0.001);
        $this->assertSame('días', $a['unidad']);
        $this->assertStringContainsString('20.7 días', $a['interpretacion']);
    }

    public function test_cobertura_y_baches_cubiertos_con_presupuesto_parcial(): void
    {
        $this->crearDatosConocidos();

        $r = $this->calcular(3000);
        $cobertura = $r['indicadores']['cobertura_presupuestal'];
        $cubiertos = $r['indicadores']['baches_cubiertos'];

        $this->assertEqualsWithDelta(10020, $cobertura['detalle']['costo_total_pendiente'], 0.01);
        $this->assertEqualsWithDelta(round($r['meta']['costo_recomendados'] / 10020 * 100, 1), $cobertura['valor'], 0.001);
        $this->assertEqualsWithDelta(round($r['meta']['num_recomendados'] / 7 * 100, 1), $cubiertos['valor'], 0.001);
        $this->assertGreaterThan(0, $cobertura['valor']);
        $this->assertLessThan(100, $cobertura['valor']);
        $this->assertStringContainsString('% del costo pendiente', $cobertura['interpretacion']);
    }

    public function test_presupuesto_suficiente_cubre_el_100(): void
    {
        $this->crearDatosConocidos();

        $ind = $this->calcular(1_000_000)['indicadores'];

        $this->assertEqualsWithDelta(100.0, $ind['cobertura_presupuestal']['valor'], 0.001);
        $this->assertEqualsWithDelta(100.0, $ind['baches_cubiertos']['valor'], 0.001);
        $this->assertStringContainsString('cubre todo', $ind['cobertura_presupuestal']['interpretacion']);
    }

    public function test_sin_presupuesto_la_cobertura_es_null(): void
    {
        $this->crearDatosConocidos();

        $ind = $this->calcular(null)['indicadores'];   // no hay presupuesto del mes en la BD de prueba

        $this->assertNull($ind['cobertura_presupuestal']['valor']);
        $this->assertNull($ind['baches_cubiertos']['valor']);
        $this->assertStringStartsWith('Sin presupuesto definido', $ind['cobertura_presupuestal']['interpretacion']);
        $this->assertStringStartsWith('Sin presupuesto definido', $ind['baches_cubiertos']['interpretacion']);
    }

    public function test_interpretacion_menciona_los_excluidos_sin_sustento(): void
    {
        $this->crearDatosConocidos();
        $this->crearLimpio('Centro', 12, 0.5, false);
        $this->crearLimpio('Reforma', 8, 0.5, false);

        $ind = $this->calcular(3000)['indicadores'];

        foreach (['cobertura_presupuestal', 'baches_cubiertos'] as $clave) {
            $this->assertStringContainsString('No incluye 2 reportes excluidos por falta de sustento', $ind[$clave]['interpretacion'], $clave);
        }
        // Los excluidos no entran al denominador
        $this->assertSame(7, $ind['baches_cubiertos']['detalle']['total']);
        $this->assertEqualsWithDelta(10020, $ind['cobertura_presupuestal']['detalle']['costo_total_pendiente'], 0.01);
    }

    public function test_presupuesto_cero_da_cobertura_cero(): void
    {
        $this->crearDatosConocidos();

        $ind = $this->calcular(0)['indicadores'];

        $this->assertSame(0.0, $ind['cobertura_presupuestal']['valor']);
        $this->assertSame(0.0, $ind['baches_cubiertos']['valor']);
    }

    public function test_concentracion_por_colonia_top_5(): void
    {
        $this->crearDatosConocidos();

        $c = $this->calcular(3000)['indicadores']['concentracion_colonias'];
        $top = $c['detalle']['top'];

        $this->assertCount(5, $top);
        $this->assertSame('Centro', $top[0]['colonia']);
        $this->assertSame(2, $top[0]['pendientes']);
        $this->assertEqualsWithDelta(28.6, $top[0]['porcentaje'], 0.001);   // 2 / 7
        $this->assertEqualsWithDelta(85.7, $c['valor'], 0.001);             // 6 / 7
        $this->assertStringStartsWith('Centro concentra el 28.6 %', $c['interpretacion']);
    }

    public function test_tasa_de_calidad_de_la_ejecucion_usada(): void
    {
        $this->crearDatosConocidos();

        $t = $this->calcular(3000)['indicadores']['tasa_calidad_datos'];

        $this->assertEqualsWithDelta(80.0, $t['valor'], 0.001);   // 8 / 10
        $this->assertStringStartsWith('Calidad aceptable', $t['interpretacion']);
        $this->assertStringContainsString("#{$this->ejecucionId}", $t['fuente']);
    }

    // ── Casos límite ──────────────────────────────────────────────────────────

    public function test_sin_reportes_los_indicadores_quedan_en_cero(): void
    {
        $this->crearEjecucion(0, 0);

        $ind = $this->calcular(5000)['indicadores'];

        foreach (['antiguedad_backlog', 'cobertura_presupuestal', 'baches_cubiertos', 'concentracion_colonias', 'tasa_calidad_datos'] as $clave) {
            $this->assertSame(0.0, (float) $ind[$clave]['valor'], $clave);
        }
        $this->assertSame([], $ind['concentracion_colonias']['detalle']['top']);
        $this->assertSame(0.0, $ind['antiguedad_backlog']['detalle']['mediana']);
    }

    public function test_sin_ejecucion_etl_la_tasa_de_calidad_no_esta_disponible(): void
    {
        $this->crearReporte();

        $r = $this->calcular(5000);

        $this->assertNull($r['indicadores']['tasa_calidad_datos']['valor']);
        $this->assertStringStartsWith('No disponible', $r['indicadores']['tasa_calidad_datos']['interpretacion']);
        $this->assertFalse($r['meta']['etl_desactualizado']);
    }

    // ── Aviso de ETL desactualizado ───────────────────────────────────────────

    public function test_aviso_aparece_al_crear_un_reporte_despues_del_etl(): void
    {
        $this->crearReporte();
        app(EtlService::class)->ejecutar();

        $this->assertFalse($this->calcular(5000)['meta']['etl_desactualizado']);

        $this->travel(1)->minutes();
        $this->crearReporte(['created_at' => now(), 'updated_at' => now()]);
        // Un reporte resuelto después del ETL no cuenta: ya no está activo
        $this->crearReporte(['estado' => 'resuelto', 'created_at' => now(), 'updated_at' => now()]);

        $meta = $this->calcular(5000)['meta'];

        $this->assertTrue($meta['etl_desactualizado']);
        $this->assertSame(1, $meta['reportes_nuevos_desde_etl']);
    }

    public function test_aviso_cuenta_reportes_actualizados_despues_del_etl(): void
    {
        $id = $this->crearReporte();
        app(EtlService::class)->ejecutar();

        $this->travel(1)->minutes();
        DB::table('reportes')->where('id', $id)->update(['estado' => 'validado', 'updated_at' => now()]);

        $meta = $this->calcular(5000)['meta'];

        $this->assertTrue($meta['etl_desactualizado']);
        $this->assertSame(1, $meta['reportes_nuevos_desde_etl']);
    }

    public function test_aviso_cuenta_reanalisis_ia_aunque_el_reporte_no_cambie(): void
    {
        $id = $this->crearReporte();
        app(EtlService::class)->ejecutar();

        $this->travel(1)->minutes();
        DB::table('reporte_ai_analisis')->where('reporte_id', $id)
            ->update(['severidad_ia' => 'alta', 'updated_at' => now()]);

        $meta = $this->calcular(5000)['meta'];

        $this->assertTrue($meta['etl_desactualizado']);
        $this->assertSame(1, $meta['reportes_nuevos_desde_etl']);
    }

    // ── Endpoint ──────────────────────────────────────────────────────────────

    public function test_endpoint_devuelve_indicadores_que_cambian_con_el_presupuesto(): void
    {
        $this->crearDatosConocidos();
        Sanctum::actingAs(User::find($this->userId));

        $con0 = $this->getJson('/api/analisis/topsis?presupuesto=0')->assertOk();
        $conTodo = $this->getJson('/api/analisis/topsis?presupuesto=1000000')->assertOk();

        $cobertura = fn ($res) => collect($res->json('indicadores'))->firstWhere('clave', 'cobertura_presupuestal')['valor'];

        $this->assertEquals(0, $cobertura($con0));
        $this->assertEquals(100, $cobertura($conTodo));
        $con0->assertJsonStructure(['meta' => ['etl_desactualizado', 'reportes_nuevos_desde_etl']]);
    }
}
