<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Módulo DSS (Proyecto Integrador DSTD): anomalías de calidad detectadas en cada ejecución del ETL.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dss_etl_anomalias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ejecucion_id')->constrained('dss_etl_ejecuciones')->cascadeOnDelete();
            $table->foreignId('reporte_id')->nullable()->constrained('reportes')->nullOnDelete();
            $table->enum('tipo_anomalia', [
                'duplicado',
                'coordenada_fuera_rango',
                'tipo_via_faltante',
                'sin_analisis_ia',
                'fecha_invalida',
                'campo_faltante',
            ]);
            $table->string('campo')->nullable();
            $table->text('valor_original')->nullable();
            $table->enum('accion_tomada', ['descartado', 'imputado', 'fusionado', 'marcado']);
            $table->text('regla_aplicada');
            $table->enum('severidad', ['error', 'advertencia']);
            $table->timestamps();
            $table->index('ejecucion_id');
            $table->index('tipo_anomalia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dss_etl_anomalias');
    }
};
