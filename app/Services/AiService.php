<?php

namespace App\Services;

use App\Models\Reporte;
use App\Models\ReporteAiAnalisis;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\Log;
use OpenAI;
use OpenAI\Exceptions\ErrorException as OpenAIErrorException;

class AiService
{
    private const PROMPT = <<<'PROMPT'
Analiza esta imagen y determina si muestra un bache o daño en el pavimento de una calle o avenida pública.

Responde ÚNICAMENTE con JSON válido con esta estructura exacta:
{
  "es_bache": true/false,
  "confianza": 0-100,
  "severidad_ia": "alta" | "media" | "baja" | null,
  "profundidad_estimada_cm": número o null,
  "area_estimada_m2": número o null,
  "razon": "explicación breve en español de máximo 150 caracteres",
  "recomendacion": "acción recomendada en español de máximo 100 caracteres"
}

Criterios de severidad:
- alta: bache profundo (>10cm), grande (>0.5m²), peligro inmediato para vehículos
- media: bache moderado, inconveniente pero transitable con precaución
- baja: grieta o hundimiento menor, daño cosmético o incipiente
- null: no es un bache

Si la imagen no muestra claramente una calle o pavimento, responde con es_bache: false.
PROMPT;

    public function analizarImagen(string $imagenBase64, string $mimeType = 'image/jpeg'): array
    {
        if (empty(config('openai.api_key'))) {
            return $this->mockResponse();
        }

        try {
            $openAi = OpenAI::factory()
                ->withApiKey((string) config('openai.api_key'))
                ->withOrganization(config('openai.organization'))
                ->withHttpClient(new GuzzleClient([
                    'timeout' => config('openai.request_timeout', 30),
                    'verify'  => config('openai.verify', true),
                ]));

            if (is_string(config('openai.project'))) {
                $openAi->withProject(config('openai.project'));
            }

            if (is_string(config('openai.base_uri'))) {
                $openAi->withBaseUri(config('openai.base_uri'));
            }

            $response = $openAi->make()->chat()->create([
                'model'      => 'gpt-4o',
                'max_tokens' => 300,
                'messages'   => [
                    [
                        'role'    => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => self::PROMPT,
                            ],
                            [
                                'type'      => 'image_url',
                                'image_url' => [
                                    'url'    => "data:{$mimeType};base64,{$imagenBase64}",
                                    'detail' => 'low',
                                ],
                            ],
                        ],
                    ],
                ],
            ]);

            $content = $response->choices[0]->message->content;
            $tokens  = $response->usage->totalTokens ?? 0;

            $json = json_decode(
                preg_replace('/^```json\s*|\s*```$/m', '', trim($content)),
                true
            );

            if (! $json || ! isset($json['es_bache'])) {
                throw new \RuntimeException('Respuesta JSON inválida de OpenAI');
            }

            return array_merge($json, [
                'tokens_usados' => $tokens,
                'raw_response'  => ['content' => $content],
                'modelo_usado'  => 'gpt-4o',
            ]);
        } catch (\Throwable $e) {
            Log::error('AiService error', [
                'message'   => $e->getMessage(),
                'exception' => $e::class,
            ]);

            if ($e instanceof OpenAIErrorException) {
                throw new \InvalidArgumentException($e->getMessage(), 0, $e);
            }

            if (str_contains($e->getMessage(), 'cURL error 60')) {
                throw new \RuntimeException(
                    'No fue posible conectar con OpenAI. Verifica certificados SSL/CA en PHP (cURL error 60).',
                    0,
                    $e
                );
            }

            throw new \RuntimeException(
                'No fue posible analizar la imagen con IA en este momento.',
                0,
                $e
            );
        }
    }

    public function guardarAnalisis(Reporte $reporte, array $resultado): ReporteAiAnalisis
    {
        return ReporteAiAnalisis::updateOrCreate(
            ['reporte_id' => $reporte->id],
            [
                'modelo_usado'            => $resultado['modelo_usado']           ?? 'gpt-4o',
                'es_bache'                => $resultado['es_bache']               ?? false,
                'confianza'               => $resultado['confianza']              ?? 0,
                'severidad_ia'            => $resultado['severidad_ia']           ?? null,
                'profundidad_estimada_cm' => $resultado['profundidad_estimada_cm'] ?? null,
                'area_estimada_m2'        => $resultado['area_estimada_m2']       ?? null,
                'razon'                   => $resultado['razon']                  ?? null,
                'raw_response'            => $resultado['raw_response']           ?? null,
                'tokens_usados'           => $resultado['tokens_usados']          ?? null,
            ]
        );
    }

    public function generarRecomendacion(array $ranking, array $zonas): array
    {
        $top = array_slice($ranking, 0, 8);

        $resumenBaches = collect($top)->map(fn ($r) => [
            'rank'      => $r['rank'],
            'folio'     => $r['folio'],
            'via'       => $r['nombre_via'],
            'colonia'   => $r['colonia'],
            'estado'    => $r['estado'],
            'prioridad' => $r['prioridad'],
            'topsis'    => $r['topsis_score'],
            'severidad' => $r['ai_severidad'] ?? '—',
            'dias'      => $r['criterios']['dias_pendiente'],
            'densidad'  => $r['criterios']['densidad_zona'],
        ])->toArray();

        $resumenZonas = collect($zonas)->take(5)->map(fn ($z) => [
            'colonia'  => $z['colonia'],
            'total'    => $z['total'],
            'criticos' => $z['criticos'],
            'riesgo'   => $z['riesgo'],
        ])->toArray();

        $prompt = <<<PROMPT
Eres un asesor experto en infraestructura vial urbana para el H. Ayuntamiento de Oaxaca de Juárez, México.
Se aplicó TOPSIS multicriterio (pesos: severidad IA 30 %, tipo de vía 25 %, días sin atender 20 %, densidad zonal 15 %, score previo 10 %) para priorizar baches activos.

TOP BACHES POR TOPSIS:
PROMPT;
        $prompt .= json_encode($resumenBaches, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $prompt .= "\n\nZONAS MÁS AFECTADAS:\n";
        $prompt .= json_encode($resumenZonas, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $prompt .= <<<'PROMPT'


Con base en estos datos, genera una recomendación estratégica de intervención.
Responde ÚNICAMENTE con JSON válido con esta estructura:
{
  "decision_principal": "decisión concisa (máx 130 chars)",
  "orden_atencion": [{"folio":"...","razon":"..."}],
  "zonas_criticas": ["colonia1","colonia2"],
  "justificacion": "razonamiento técnico de 2-3 oraciones",
  "advertencias": ["advertencia corta"],
  "tipo_intervencion": "bacheo_focalizado|rehabilitacion_integral|mantenimiento_preventivo",
  "urgencia": "inmediata|alta|media"
}
PROMPT;

        if (empty(config('openai.api_key'))) {
            return $this->mockRecomendacion($top);
        }

        try {
            $openAi = OpenAI::factory()
                ->withApiKey((string) config('openai.api_key'))
                ->withOrganization(config('openai.organization'))
                ->withHttpClient(new GuzzleClient([
                    'timeout' => config('openai.request_timeout', 30),
                    'verify'  => config('openai.verify', true),
                ]))->make();

            $response = $openAi->chat()->create([
                'model'       => 'gpt-4o',
                'temperature' => 0.25,
                'max_tokens'  => 600,
                'messages'    => [['role' => 'user', 'content' => $prompt]],
            ]);

            $content = $response->choices[0]->message->content ?? '{}';
            $content = preg_replace('/^```json\s*|\s*```$/m', '', trim($content));
            $decoded = json_decode($content, true);

            return [
                'recomendacion' => $decoded,
                'tokens_usados' => $response->usage?->totalTokens ?? 0,
                'modelo'        => 'gpt-4o',
                'generado_at'   => now()->toIso8601String(),
            ];
        } catch (\Throwable $e) {
            Log::error('AiService::generarRecomendacion', ['error' => $e->getMessage()]);
            return $this->mockRecomendacion($top);
        }
    }

    private function mockRecomendacion(array $top): array
    {
        $folios = collect($top)->take(3)->pluck('folio')->toArray();
        return [
            'recomendacion' => [
                'decision_principal'  => 'Atender inmediatamente los ' . count($top) . ' baches con mayor score TOPSIS, priorizando vías principales.',
                'orden_atencion'      => collect($top)->take(3)->map(fn ($r) => [
                    'folio' => $r['folio'],
                    'razon' => 'Alto score TOPSIS (' . $r['topsis_score'] . ') con severidad ' . ($r['ai_severidad'] ?? 'media'),
                ])->toArray(),
                'zonas_criticas'      => collect($top)->pluck('colonia')->unique()->take(2)->values()->toArray(),
                'justificacion'       => 'Los baches con mayor puntuación TOPSIS combinan alta severidad, vías de alta circulación y tiempo prolongado sin atención. Se recomienda iniciar con los críticos en avenidas principales para maximizar el impacto en la movilidad ciudadana.',
                'advertencias'        => ['Verificar disponibilidad de brigadas antes de asignar.'],
                'tipo_intervencion'   => 'bacheo_focalizado',
                'urgencia'            => 'alta',
            ],
            'tokens_usados' => 0,
            'modelo'        => 'mock',
            'generado_at'   => now()->toIso8601String(),
        ];
    }

    /** Respuesta simulada cuando no hay API key configurada */
    private function mockResponse(): array
    {
        return [
            'es_bache'                => true,
            'confianza'               => 85,
            'severidad_ia'            => 'media',
            'profundidad_estimada_cm' => 8.0,
            'area_estimada_m2'        => 0.3,
            'razon'                   => 'Análisis simulado (sin API key). Bache detectado en pavimento.',
            'recomendacion'           => 'Bacheo de emergencia recomendado.',
            'tokens_usados'           => 0,
            'raw_response'            => ['modo' => 'simulado'],
            'modelo_usado'            => 'mock',
        ];
    }
}
