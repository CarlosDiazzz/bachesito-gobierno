<?php

namespace App\Console\Commands;

use App\Services\Dss\EtlService;
use Illuminate\Console\Command;

// Módulo DSS (Proyecto Integrador DSTD)
class DssEtlCommand extends Command
{
    protected $signature = 'dss:etl';

    protected $description = 'Ejecuta el proceso ETL del módulo DSS: limpia los reportes activos y los carga en dss_reportes_limpios';

    public function handle(EtlService $etl): int
    {
        $this->info('Ejecutando ETL del módulo DSS…');

        $ejecucion = $etl->ejecutar();

        if ($ejecucion->estado === 'fallido') {
            $this->error("La ejecución #{$ejecucion->id} falló: {$ejecucion->mensaje_error}");

            return self::FAILURE;
        }

        $this->newLine();
        $this->line("Ejecución #{$ejecucion->id} · {$ejecucion->finalizado_at}");

        $tasa = $ejecucion->tasaCalidad();

        $this->table(['Métrica', 'Valor'], [
            ['Registros leídos', $ejecucion->registros_leidos],
            ['Registros cargados', $ejecucion->registros_cargados],
            ['Registros descartados', $ejecucion->registros_descartados],
            ['Registros con advertencia', $ejecucion->registros_con_advertencia],
            ['Tasa de calidad', $tasa === null ? '—' : "{$tasa} %"],
        ]);

        $this->table(
            ['Tipo de anomalía', 'Cantidad'],
            collect($ejecucion->conteoPorTipo())
                ->map(fn ($total, $tipo) => [$tipo, $total])
                ->values()
                ->all()
        );

        return self::SUCCESS;
    }
}
