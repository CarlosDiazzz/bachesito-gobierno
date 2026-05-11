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
