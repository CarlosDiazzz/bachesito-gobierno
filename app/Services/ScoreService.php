<?php

namespace App\Services;

use App\Models\Reporte;
use App\Models\ReporteScoreDetalle;

class ScoreService
{
    private const PESOS_TIPO_VIA = [
        'avenida_principal' => 5.0,
        'boulevard'         => 4.5,
        'carretera'         => 4.0,
        'calle_secundaria'  => 2.5,
        'privada'           => 1.5,
        'callejon'          => 1.0,
    ];

    private const PESOS_SEVERIDAD = [
        'alta'  => 10.0,
        'media' => 6.0,
        'baja'  => 2.0,
    ];

    public function calcular(Reporte $reporte): float
    {
        $severidadIa = $reporte->aiAnalisis?->severidad_ia ?? 'media';
        $confianza   = ($reporte->aiAnalisis?->confianza   ?? 70) / 100;
        $profundidad = $reporte->aiAnalisis?->profundidad_estimada_cm ?? 5;
        $area        = $reporte->aiAnalisis?->area_estimada_m2 ?? 0.2;

        // Componentes del score
        $scoreSeveridad       = self::PESOS_SEVERIDAD[$severidadIa] * $confianza;
        $scoreTipoVia         = self::PESOS_TIPO_VIA[$reporte->tipo_via ?? 'calle_secundaria'] ?? 2.5;
        $scoreProfundidad     = min($profundidad / 2, 10);
        $scoreArea            = min($area * 10, 10);
        $scoreReportesZona    = $this->reportesEnZona($reporte) * 0.5;

        $scoreInfra = $this->esCercaInfraEsencial($reporte) ? 5.0 : 0.0;

        $scoreFinal = (
            ($scoreSeveridad   * 0.35) +
            ($scoreTipoVia     * 0.25) +
            ($scoreProfundidad * 0.15) +
            ($scoreArea        * 0.10) +
            ($scoreInfra       * 0.10) +
            ($scoreReportesZona * 0.05)
        ) * 10;

        $scoreFinal = round(min(max($scoreFinal, 0), 100), 1);

        $this->guardarDetalle($reporte, [
            'score_severidad'              => round($scoreSeveridad, 2),
            'score_tipo_via'               => round($scoreTipoVia, 2),
            'score_pci'                    => round($scoreProfundidad, 2),
            'score_infraestructura_critica' => $scoreInfra,
            'score_trafico'                => round($scoreArea, 2),
            'score_reportes_zona'          => round($scoreReportesZona, 2),
            'score_final'                  => $scoreFinal,
            'formula_aplicada'             => 'score = (sev*0.35 + via*0.25 + prof*0.15 + area*0.10 + infra*0.10 + zona*0.05) * 10',
            'calculado_at'                 => now(),
        ]);

        $reporte->update(['score_prioridad' => $scoreFinal]);

        $prioridad = match(true) {
            $scoreFinal >= 75 => 'critica',
            $scoreFinal >= 50 => 'alta',
            $scoreFinal >= 25 => 'media',
            default           => 'baja',
        };
        $reporte->update(['prioridad' => $prioridad]);

        return $scoreFinal;
    }

    private function reportesEnZona(Reporte $reporte): int
    {
        if (! $reporte->latitud || ! $reporte->longitud) return 0;

        // Radio ~500m en grados
        $radio = 0.005;
        return Reporte::whereBetween('latitud',  [$reporte->latitud  - $radio, $reporte->latitud  + $radio])
                      ->whereBetween('longitud', [$reporte->longitud - $radio, $reporte->longitud + $radio])
                      ->where('id', '!=', $reporte->id)
                      ->count();
    }

    private function esCercaInfraEsencial(Reporte $reporte): bool
    {
        $nombre = strtolower($reporte->nombre_via ?? '');
        $palabras = ['hospital', 'escuela', 'universidad', 'mercado', 'bomberos', 'emergencia'];
        foreach ($palabras as $p) {
            if (str_contains($nombre, $p)) return true;
        }
        return false;
    }

    private function guardarDetalle(Reporte $reporte, array $data): void
    {
        ReporteScoreDetalle::updateOrCreate(
            ['reporte_id' => $reporte->id],
            $data
        );
    }
}
