<?php

namespace Tests\Feature\Dss;

use App\Models\User;
use App\Services\Dss\EtlService;
use App\Services\Dss\RecomendacionService;
use App\Services\TopsisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Módulo DSS (Proyecto Integrador DSTD): TOPSIS sobre datos limpios y recomendación por presupuesto.
class TopsisRecomendacionTest extends TestCase
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

    /** Reporte real en la tabla reportes (para pasar por el ETL o por la lógica sin ETL). */
    private function crearReporte(array $datos = [], ?float $confianza = 90, ?float $area = 0.5, string $sev = 'media'): int
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
            'score_prioridad' => 50 + $this->consecutivo,
            'fecha_reporte' => now()->subDays(5 + $this->consecutivo * 3),
            'created_at' => now(),
            'updated_at' => now(),
        ], $datos));

        if ($confianza !== null) {
            DB::table('reporte_ai_analisis')->insert([
                'reporte_id' => $id, 'confianza' => $confianza, 'severidad_ia' => $sev,
                'area_estimada_m2' => $area, 'es_bache' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        return $id;
    }

    /**
     * Reporte con criterios ya transformados en dss_reportes_limpios
     * (permite fijar exactamente los valores de la matriz de decisión).
     */
    private function crearLimpio(string $folio, array $criterios, ?float $area): int
    {
        if ($this->ejecucionId === null) {
            $this->ejecucionId = DB::table('dss_etl_ejecuciones')->insertGetId([
                'iniciado_at' => now(), 'finalizado_at' => now(), 'estado' => 'completado',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $id = $this->crearReporte(['folio' => $folio], 90, $area);

        DB::table('dss_reportes_limpios')->insert(array_merge($criterios, [
            'ejecucion_id' => $this->ejecucionId,
            'reporte_id' => $id,
            'latitud' => 17.05,
            'longitud' => -96.72,
            'num_reportes_fusionados' => 1,
            'datos_suficientes' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return $id;
    }

    /** Los 3 baches del ejemplo de cálculo manual (docs/dss/modelo.md). */
    private function crearEjemploManual(): void
    {
        $this->crearLimpio('B1', ['severidad' => 1.0, 'tipo_via' => 0.9, 'dias_pendiente' => 10, 'densidad_zona' => 3, 'score_ia' => 80], 1.0);
        $this->crearLimpio('B2', ['severidad' => 0.6, 'tipo_via' => 0.5, 'dias_pendiente' => 40, 'densidad_zona' => 1, 'score_ia' => 60], null);
        $this->crearLimpio('B3', ['severidad' => 0.2, 'tipo_via' => 1.0, 'dias_pendiente' => 25, 'densidad_zona' => 2, 'score_ia' => 40], 0.2);
    }

    private function recomendar(?float $presupuesto, string $escenario = 'equilibrado'): array
    {
        $topsis = app(TopsisService::class);
        $topsis->usarEscenario($escenario);

        return app(RecomendacionService::class)->aplicar($topsis->rankear(), $presupuesto);
    }

    private function porFolio(array $ranking): array
    {
        return collect($ranking)->keyBy('folio')->all();
    }

    // ── Fuente de datos ───────────────────────────────────────────────────────

    public function test_ranking_excluye_descartados_y_fusionados(): void
    {
        $this->crearReporte();
        $this->crearReporte(['latitud' => 0, 'longitud' => 0]);                       // descartado
        $this->crearReporte(['fecha_reporte' => now()->addDays(2)]);                   // descartado
        $this->crearReporte(['latitud' => 17.0900, 'longitud' => -96.7000, 'fecha_reporte' => now()->subDays(6)]);
        $this->crearReporte(['latitud' => 17.0900, 'longitud' => -96.7000, 'fecha_reporte' => now()->subDays(5)]); // fusionado

        app(EtlService::class)->ejecutar();
        $topsis = app(TopsisService::class);
        $folios = array_column($topsis->rankear(), 'folio');

        $this->assertSame('dss_reportes_limpios', $topsis->fuente()['fuente']);
        $this->assertEqualsCanonicalizing(['TEST-0001', 'TEST-0004'], $folios);
        $this->assertSame(2, $this->porFolio($topsis->rankear())['TEST-0004']['num_reportes_fusionados']);
    }

    public function test_datos_insuficientes_van_a_sin_sustento_con_motivo(): void
    {
        $this->crearReporte();
        $this->crearReporte();
        $this->crearReporte([], null);   // sin análisis IA
        $this->crearReporte([], 20);     // confianza baja

        app(EtlService::class)->ejecutar();
        $topsis = app(TopsisService::class);
        $folios = array_column($topsis->rankear(), 'folio');
        $sinSustento = collect($topsis->sinSustento())->keyBy('folio');

        $this->assertEqualsCanonicalizing(['TEST-0001', 'TEST-0002'], $folios);
        $this->assertEqualsCanonicalizing(['TEST-0003', 'TEST-0004'], $sinSustento->keys()->all());
        $this->assertStringContainsString('no tiene análisis IA', $sinSustento['TEST-0003']['motivo']);
        $this->assertStringContainsString('Confianza', $sinSustento['TEST-0004']['motivo']);
    }

    public function test_sin_ejecucion_etl_usa_reportes_sin_etl(): void
    {
        $this->crearReporte();
        $this->crearReporte(['latitud' => 0, 'longitud' => 0]);

        $topsis = app(TopsisService::class);
        $ranking = $topsis->rankear();
        $fuente = $topsis->fuente();

        $this->assertCount(2, $ranking); // sin ETL no se depura nada
        $this->assertSame('reportes_sin_etl', $fuente['fuente']);
        $this->assertNull($fuente['ejecucion_etl_id']);
        $this->assertNotEmpty($fuente['aviso_fuente']);
        $this->assertSame([], $topsis->sinSustento());
    }

    // ── Selección por presupuesto ─────────────────────────────────────────────

    public function test_presupuesto_cero_no_recomienda_ninguno(): void
    {
        $this->crearEjemploManual();

        $r = $this->recomendar(0);

        $this->assertSame(0, $r['meta']['num_recomendados']);
        $this->assertSame(3, $r['meta']['num_en_espera']);
        $this->assertSame(['en_espera'], array_values(array_unique(array_column($r['ranking'], 'decision'))));
    }

    public function test_presupuesto_suficiente_recomienda_todos(): void
    {
        $this->crearEjemploManual();

        $r = $this->recomendar(1_000_000);

        $this->assertSame(3, $r['meta']['num_recomendados']);
        $this->assertSame(0, $r['meta']['num_en_espera']);
        $this->assertEqualsWithDelta(1650 + 1425 + 1290, $r['meta']['costo_recomendados'], 0.01);
        $this->assertEqualsWithDelta(1_000_000 - 4365, $r['meta']['saldo_restante'], 0.01);
    }

    public function test_greedy_salta_el_caro_y_toma_uno_posterior_mas_barato(): void
    {
        $this->crearEjemploManual();

        // Orden equilibrado: B1 ($1,650), B2 ($1,425, área supuesta), B3 ($1,290)
        $r = $this->recomendar(3000);
        $f = $this->porFolio($r['ranking']);

        $this->assertSame(['B1', 'B2', 'B3'], array_column($r['ranking'], 'folio'));
        $this->assertSame('recomendado', $f['B1']['decision']);
        $this->assertSame('en_espera', $f['B2']['decision']);    // 1,425 > saldo 1,350
        $this->assertSame('recomendado', $f['B3']['decision']);  // 1,290 ≤ saldo 1,350
        $this->assertTrue($f['B2']['costo_detalle']['area_supuesta']);
        $this->assertEqualsWithDelta(60, $r['meta']['saldo_restante'], 0.01);
        $this->assertStringStartsWith('Recomendado: posición 3 de 3', $f['B3']['explicacion']['frase']);
        $this->assertSame(
            'Recomendado: posición 3 de 3, destaca en tipo de vía; costo $1,290, entra con saldo de $60.',
            $f['B3']['explicacion']['frase']
        );
        $this->assertStringStartsWith('En espera: posición 2 de 3', $f['B2']['explicacion']['frase']);
    }

    public function test_un_solo_reporte(): void
    {
        $this->crearLimpio('UNICO', ['severidad' => 0.6, 'tipo_via' => 0.5, 'dias_pendiente' => 12, 'densidad_zona' => 1, 'score_ia' => 50], 0.5);

        $r = $this->recomendar(5000);

        $this->assertCount(1, $r['ranking']);
        $fila = $r['ranking'][0];
        $this->assertSame(1, $fila['rank']);
        // Con una sola alternativa ambos ideales coinciden con ella: D+ = D- = 0 y la fórmula devuelve 0.
        $this->assertSame(0.0, (float) $fila['topsis_score']);
        $this->assertSame('recomendado', $fila['decision']);
        $this->assertEqualsWithDelta(1425, $fila['costo_estimado'], 0.01);
    }

    public function test_sin_presupuesto_del_mes_avisa_y_no_decide(): void
    {
        $this->crearEjemploManual();

        $r = $this->recomendar(null);

        $this->assertNull($r['meta']['presupuesto']);
        $this->assertNotEmpty($r['meta']['aviso_presupuesto']);
        $this->assertSame(0, $r['meta']['num_recomendados']);
        $this->assertSame([null], array_values(array_unique(array_column($r['ranking'], 'decision'))));
    }

    public function test_usa_el_disponible_del_mes_actual_si_no_se_envia_presupuesto(): void
    {
        $this->crearEjemploManual();
        $depId = DB::table('dependencias')->insertGetId([
            'nombre' => 'Municipio', 'clave' => 'MUN-TEST', 'tipo' => 'municipio',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['asignado' => 5000, 'ejercido' => 1000, 'comprometido' => 500] as $tipo => $monto) {
            DB::table('presupuestos')->insert([
                'dependencia_id' => $depId, 'municipio_id' => $this->municipioId,
                'anio' => now()->year, 'mes' => now()->month, 'concepto' => 'Test',
                'tipo' => $tipo, 'monto' => $monto, 'registrado_por' => $this->userId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $r = $this->recomendar(null);

        $this->assertSame('presupuestos_mes', $r['meta']['presupuesto_origen']);
        $this->assertEqualsWithDelta(3500, $r['meta']['presupuesto'], 0.01);
        $this->assertSame(2, $r['meta']['num_recomendados']); // B1 1,650 + B2 1,425 = 3,075
    }

    // ── Reproducibilidad y ejemplo manual ─────────────────────────────────────

    public function test_reproducible_con_mismo_presupuesto_y_pesos(): void
    {
        $this->crearEjemploManual();

        $quitarFecha = fn (array $r) => array_map(fn ($f) => array_diff_key($f, ['fecha_reporte' => 1]), $r['ranking']);

        $a = $this->recomendar(3000);
        $b = $this->recomendar(3000);

        $this->assertSame($quitarFecha($a), $quitarFecha($b));
        $this->assertSame($a['meta'], $b['meta']);
    }

    public function test_ejemplo_de_calculo_manual_coincide_con_el_sistema(): void
    {
        $this->crearEjemploManual();

        // Valores calculados a mano en docs/dss/modelo.md (sección "Ejemplo de cálculo manual")
        $esperado = [
            'equilibrado' => [
                'B1' => ['d+' => 0.1256, 'd-' => 0.2320, 'c' => 0.6486],
                'B2' => ['d+' => 0.1570, 'd-' => 0.1616, 'c' => 0.5072],
                'B3' => ['d+' => 0.2191, 'd-' => 0.1143, 'c' => 0.3428],
            ],
            'rezago' => [
                'B1' => ['d+' => 0.2491, 'd-' => 0.1926, 'c' => 0.4360],
                'B2' => ['d+' => 0.1280, 'd-' => 0.2630, 'c' => 0.6726],
                'B3' => ['d+' => 0.2145, 'd-' => 0.1408, 'c' => 0.3963],
            ],
        ];

        foreach ($esperado as $escenario => $baches) {
            $f = $this->porFolio($this->recomendar(3000, $escenario)['ranking']);

            foreach ($baches as $folio => $v) {
                $e = $f[$folio]['explicacion'];
                $this->assertEqualsWithDelta($v['d+'], $e['d_ideal_positivo'], 0.0001, "$escenario $folio D+");
                $this->assertEqualsWithDelta($v['d-'], $e['d_ideal_negativo'], 0.0001, "$escenario $folio D-");
                $this->assertEqualsWithDelta($v['c'], $e['score'], 0.0001, "$escenario $folio C");
            }
        }

        $this->assertEqualsWithDelta(0.8452, $f['B1']['explicacion']['criterios']['severidad']['normalizado'], 0.0001);
    }

    // ── Endpoint ──────────────────────────────────────────────────────────────

    public function test_endpoint_conserva_campos_anteriores_y_agrega_los_nuevos(): void
    {
        $this->crearEjemploManual();
        Sanctum::actingAs(User::find($this->userId));

        $res = $this->getJson('/api/analisis/topsis?escenario=equilibrado&presupuesto=3000')->assertOk();

        $res->assertJsonStructure([
            'ranking' => [['id', 'folio', 'topsis_score', 'rank', 'criterios', 'd_mejor', 'd_peor',
                'costo_estimado', 'decision', 'explicacion' => ['criterios', 'frase', 'score']]],
            'zonas',
            'sin_sustento',
            'meta' => ['total', 'escenario', 'pesos', 'escenarios', 'filtros', 'generado_at',
                'fuente', 'ejecucion_etl_id', 'presupuesto', 'costo_recomendados', 'saldo_restante',
                'num_recomendados', 'num_en_espera'],
        ]);
        $this->assertSame(2, $res->json('meta.num_recomendados'));
    }
}
