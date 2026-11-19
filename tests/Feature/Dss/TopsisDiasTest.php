<?php

namespace Tests\Feature\Dss;

use App\Models\User;
use App\Services\TopsisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Módulo DSS (Proyecto Integrador DSTD): días pendientes en TopsisService con Carbon 3.
class TopsisDiasTest extends TestCase
{
    use RefreshDatabase;

    private int $municipioId;

    private int $userId;

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

    private function crearReporte(string $folio, int $diasAtras, string $severidad, string $tipoVia, float $score, float $lat): int
    {
        $id = DB::table('reportes')->insertGetId([
            'folio' => $folio,
            'ciudadano_id' => $this->userId,
            'municipio_id' => $this->municipioId,
            'tipo_via' => $tipoVia,
            'latitud' => $lat,
            'longitud' => -96.7200,
            'estado' => 'pendiente',
            'prioridad' => 'media',
            'score_prioridad' => $score,
            'fecha_reporte' => now()->subDays($diasAtras),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('reporte_ai_analisis')->insert([
            'reporte_id' => $id,
            'confianza' => 90,
            'severidad_ia' => $severidad,
            'es_bache' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    public function test_reporte_de_hace_30_dias_tiene_30_dias_pendientes(): void
    {
        $this->crearReporte('TEST-30', 30, 'media', 'calle_secundaria', 50, 17.0600);

        $ranking = app(TopsisService::class)->rankear();

        $this->assertCount(1, $ranking);
        $this->assertSame(30, $ranking[0]['criterios']['dias_pendiente']);
    }

    public function test_escenarios_equilibrado_y_rezago_producen_rankings_distintos(): void
    {
        // A: grave y en avenida, pero reciente. B: gravedad media y con rezago de 60 días.
        // Los reportes están a ~550 m entre sí para que la densidad no influya.
        $this->crearReporte('TEST-A', 2, 'alta', 'avenida_principal', 80, 17.0500);
        $this->crearReporte('TEST-B', 60, 'media', 'calle_secundaria', 40, 17.0550);
        $this->crearReporte('TEST-C', 30, 'baja', 'callejon', 20, 17.0600);

        $topsis = app(TopsisService::class);

        $topsis->usarEscenario('equilibrado');
        $equilibrado = array_column($topsis->rankear(), 'folio');

        $topsis->usarEscenario('rezago');
        $rezago = array_column($topsis->rankear(), 'folio');

        $this->assertSame('TEST-A', $equilibrado[0]);
        $this->assertSame('TEST-B', $rezago[0]);
        $this->assertNotSame($equilibrado, $rezago);
    }
}
