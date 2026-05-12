<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalizarFotoRequest;
use App\Services\AiService;
use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;

class AiController extends Controller
{
    public function __construct(private AiService $aiService) {}

    public function analizarZona(Request $request)
    {
        $reportes = $request->input('reportes', []);

        if (empty($reportes)) {
            return response()->json(['resumen' => null, 'zonas' => []]);
        }

        $total    = count($reportes);
        $criticos = collect($reportes)->whereIn('prioridad', ['critica', 'alta'])->count();
        $estados  = collect($reportes)->groupBy('estado')->map->count();
        $resueltos = $estados['resuelto'] ?? 0;

        $lista = collect($reportes)->take(20)->map(fn($r) => sprintf(
            '- %s en %s (%s, prioridad: %s, estado: %s)',
            $r['folio'] ?? 'Sin folio',
            $r['nombre_via'] ?? 'vía desconocida',
            $r['municipio'] ?? '',
            $r['prioridad'] ?? '?',
            $r['estado'] ?? '?'
        ))->implode("\n");

        $prompt = <<<PROMPT
Eres un asistente de infraestructura vial para el estado de Oaxaca, México.
Analiza estos {$total} reportes de baches ciudadanos y genera un resumen breve y útil en español,
como si le hablaras directamente a un ciudadano que quiere saber cómo está su colonia.

Datos:
{$lista}

Responde en JSON con exactamente esta estructura:
{
  "resumen": "2-3 oraciones explicando el estado general de los baches reportados en la zona, mencionando las vías más afectadas si las hay",
  "alerta": true o false (true si hay más de 2 reportes críticos o de alta prioridad sin resolver),
  "zonas_criticas": ["lista de máximo 3 calles o zonas con más problemas, solo nombres cortos"],
  "consejo": "una recomendación práctica de 1 oración para el ciudadano"
}
PROMPT;

        try {
            $response = OpenAI::chat()->create([
                'model'    => 'gpt-4o-mini',
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'response_format' => ['type' => 'json_object'],
                'max_tokens' => 400,
                'temperature' => 0.4,
            ]);

            $data = json_decode($response->choices[0]->message->content, true) ?? [];

            return response()->json([
                'resumen'        => $data['resumen']       ?? null,
                'alerta'         => $data['alerta']        ?? ($criticos > 2),
                'zonas_criticas' => $data['zonas_criticas'] ?? [],
                'consejo'        => $data['consejo']        ?? null,
                'stats'          => compact('total', 'criticos', 'resueltos'),
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'resumen'        => null,
                'alerta'         => $criticos > 2,
                'zonas_criticas' => [],
                'consejo'        => null,
                'stats'          => compact('total', 'criticos', 'resueltos'),
            ]);
        }
    }

    public function preanalizar(AnalizarFotoRequest $request)
    {
        $file      = $request->file('foto');
        $base64    = base64_encode(file_get_contents($file->getRealPath()));
        $mimeType  = $file->getMimeType();

        try {
            $resultado = $this->aiService->analizarImagen($base64, $mimeType);
        } catch (\Throwable $e) {
            report($e);

            $isClientError = $e instanceof \InvalidArgumentException;

            return response()->json([
                'message'    => $isClientError ? $e->getMessage() : 'No fue posible analizar la imagen con IA.',
                'error_code' => $isClientError ? 'ai_invalid_image' : 'ai_unavailable',
                'detalle'    => app()->isLocal() && ! $isClientError ? $e->getMessage() : null,
            ], $isClientError ? 422 : 502);
        }

        return response()->json([
            'es_bache'                => $resultado['es_bache'],
            'confianza'               => $resultado['confianza'],
            'severidad_ia'            => $resultado['severidad_ia'],
            'profundidad_estimada_cm' => $resultado['profundidad_estimada_cm'],
            'area_estimada_m2'        => $resultado['area_estimada_m2'],
            'razon'                   => $resultado['razon'],
            'recomendacion'           => $resultado['recomendacion'] ?? null,
            'modelo_usado'            => $resultado['modelo_usado'],
        ]);
    }
}
