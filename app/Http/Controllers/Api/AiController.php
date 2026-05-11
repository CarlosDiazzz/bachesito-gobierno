<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalizarFotoRequest;
use App\Services\AiService;
use Illuminate\Support\Facades\Storage;

class AiController extends Controller
{
    public function __construct(private AiService $aiService) {}

    /**
     * Analiza una foto ANTES de crear el reporte (preview al ciudadano/gobierno).
     */
    public function preanalizar(AnalizarFotoRequest $request)
    {
        $file      = $request->file('foto');
        $base64    = base64_encode(file_get_contents($file->getRealPath()));
        $mimeType  = $file->getMimeType();

        $resultado = $this->aiService->analizarImagen($base64, $mimeType);

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
