<?php

namespace Tests\Feature;

use App\Models\Reporte;
use App\Models\User;
use App\Services\UbicacionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Registro ciudadano (POST /api/reportes/ciudadano): el reporte debe guardarse con
 * municipio y colonia resueltos a partir de las coordenadas.
 */
class RegistroCiudadanoUbicacionTest extends TestCase
{
    use RefreshDatabase;

    private int $oaxacaId;

    private int $etlaId;

    private int $reformaId;

    private int $jalatlacoId;

    /** Punto dentro de Oaxaca de Juárez (cerca del Tecnológico). */
    private const LAT = 17.0778;

    private const LNG = -96.7443;

    protected function setUp(): void
    {
        parent::setUp();

        $estadoId = DB::table('estados')->insertGetId(['clave_inegi' => '20', 'nombre' => 'Oaxaca', 'abreviatura' => 'OAX']);
        $this->oaxacaId = DB::table('municipios')->insertGetId([
            'clave_inegi' => '20067', 'estado_id' => $estadoId, 'nombre' => 'Oaxaca de Juárez', 'latitud' => 17.0732, 'longitud' => -96.7266,
        ]);
        $this->etlaId = DB::table('municipios')->insertGetId([
            'clave_inegi' => '20080', 'estado_id' => $estadoId, 'nombre' => 'Etla', 'latitud' => 17.2058, 'longitud' => -96.7908,
        ]);
        $this->reformaId = DB::table('colonias')->insertGetId(['municipio_id' => $this->oaxacaId, 'nombre' => 'Reforma', 'cp' => '68050']);
        $this->jalatlacoId = DB::table('colonias')->insertGetId(['municipio_id' => $this->oaxacaId, 'nombre' => 'Jalatlaco', 'cp' => '68080']);

        User::factory()->create(['email' => 'ciudadano@bachesito.gob.mx']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function fakeNominatim(?string $colonia, ?string $ciudad = 'Oaxaca de Juárez'): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                'display_name' => 'Punto de prueba',
                'address' => array_filter(['suburb' => $colonia, 'city' => $ciudad, 'road' => 'Calle de prueba']),
            ]),
        ]);
    }

    private function registrar(array $extra = [])
    {
        return $this->postJson('/api/reportes/ciudadano', array_merge([
            'latitud' => self::LAT,
            'longitud' => self::LNG,
            'nombre_via' => 'Calle de prueba',
            'descripcion' => 'Bache de prueba',
        ], $extra));
    }

    // ── Casos ─────────────────────────────────────────────────────────────────

    public function test_guarda_municipio_y_colonia_resueltos_por_nominatim(): void
    {
        $this->fakeNominatim('Reforma');

        $res = $this->registrar()->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);
        $this->assertSame($this->reformaId, $reporte->colonia_id);
        $this->assertStringStartsWith('BCH-20067-', $reporte->folio);   // ya no BCH-00000
        $res->assertJson(['municipio' => 'Oaxaca de Juárez', 'colonia' => 'Reforma']);
    }

    public function test_si_nominatim_no_coincide_usa_el_texto_del_ciudadano(): void
    {
        $this->fakeNominatim('Tecnológico');   // no existe en el catálogo

        $res = $this->registrar(['colonia' => 'Barrio de Jalatlaco', 'municipio' => 'Oaxaca de Juárez'])->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);
        $this->assertSame($this->jalatlacoId, $reporte->colonia_id);
    }

    public function test_sin_coincidencia_en_el_catalogo_la_colonia_queda_null(): void
    {
        $this->fakeNominatim('Tecnológico');
        // Aunque haya un reporte con colonia a pocos metros, al registrar NO se imputa por vecino
        // (eso lo hace el ETL y lo registra como anomalía).
        DB::table('reportes')->insert([
            'folio' => 'VECINO-1', 'ciudadano_id' => 1, 'municipio_id' => $this->oaxacaId,
            'colonia_id' => $this->reformaId, 'latitud' => self::LAT + 0.0002, 'longitud' => self::LNG,
            'estado' => 'pendiente', 'prioridad' => 'media', 'fecha_reporte' => now(),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $res = $this->registrar(['colonia' => 'Riveras del Atoyac'])->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);
        $this->assertNull($reporte->colonia_id);
    }

    public function test_si_nominatim_falla_el_registro_continua_con_municipio_por_coordenadas(): void
    {
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $res = $this->registrar(['colonia' => 'Reforma'])->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);    // centroide más cercano
        $this->assertSame($this->reformaId, $reporte->colonia_id);     // texto del ciudadano
    }

    public function test_si_nominatim_responde_error_y_no_hay_texto_la_colonia_queda_null(): void
    {
        Http::fake(['nominatim.openstreetmap.org/*' => Http::response('Too Many Requests', 429)]);

        $res = $this->registrar()->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);
        $this->assertNull($reporte->colonia_id);
        Http::assertSentCount(1);   // sin reintentos
    }

    public function test_funciona_con_el_payload_anterior_sin_campos_nuevos(): void
    {
        $this->fakeNominatim('Reforma');

        // Exactamente lo que enviaba la app ciudadana antes del cambio
        $res = $this->postJson('/api/reportes/ciudadano', [
            'latitud' => self::LAT,
            'longitud' => self::LNG,
            'nombre_via' => 'Tecnológico',
            'descripcion' => 'Bache',
            'direccion_aproximada' => 'Tecnológico, Oaxaca de Juárez',
            'location_source' => 'gps',
        ])->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);
        $this->assertSame($this->reformaId, $reporte->colonia_id);
    }

    public function test_respeta_municipio_y_colonia_enviados_explicitamente(): void
    {
        $this->fakeNominatim('Reforma');

        $res = $this->registrar(['municipio_id' => $this->oaxacaId, 'colonia_id' => $this->jalatlacoId])->assertCreated();

        $reporte = Reporte::findOrFail($res->json('id'));
        $this->assertSame($this->oaxacaId, $reporte->municipio_id);
        $this->assertSame($this->jalatlacoId, $reporte->colonia_id);
    }

    public function test_peticion_a_nominatim_cumple_la_politica_de_uso(): void
    {
        $this->fakeNominatim('Reforma');

        $this->registrar()->assertCreated();

        Http::assertSentCount(1);
        Http::assertSent(fn (HttpRequest $r) => str_starts_with($r->url(), UbicacionService::NOMINATIM_URL)
            && str_contains($r->header('User-Agent')[0] ?? '', 'BachesITO'));
        $this->assertLessThanOrEqual(3, UbicacionService::TIMEOUT_REGISTRO);
    }

    public function test_fuera_de_oaxaca_sigue_rechazandose_sin_consultar_nominatim(): void
    {
        Http::fake();

        $this->registrar(['latitud' => 19.4326, 'longitud' => -99.1332])->assertStatus(422);

        Http::assertNothingSent();
        $this->assertSame(0, Reporte::count());
    }
}
