<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Módulo DSS (Proyecto Integrador DSTD): reportes depurados y transformados, listos para el análisis TOPSIS.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dss_reportes_limpios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ejecucion_id')->constrained('dss_etl_ejecuciones')->cascadeOnDelete();
            $table->foreignId('reporte_id')->constrained('reportes')->cascadeOnDelete();
            // Criterios TOPSIS ya transformados (misma escala que TopsisService)
            $table->float('severidad');
            $table->float('tipo_via');
            $table->unsignedInteger('dias_pendiente');
            $table->unsignedInteger('densidad_zona');
            $table->float('score_ia');
            $table->foreignId('colonia_id')->nullable()->constrained('colonias')->nullOnDelete();
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);
            $table->unsignedInteger('num_reportes_fusionados')->default(1);
            $table->boolean('datos_suficientes')->default(true);
            $table->timestamps();
            $table->unique(['ejecucion_id', 'reporte_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dss_reportes_limpios');
    }
};
