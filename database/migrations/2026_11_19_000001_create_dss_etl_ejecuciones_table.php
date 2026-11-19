<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Módulo DSS (Proyecto Integrador DSTD): bitácora de ejecuciones del proceso ETL.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dss_etl_ejecuciones', function (Blueprint $table) {
            $table->id();
            $table->timestamp('iniciado_at')->nullable();
            $table->timestamp('finalizado_at')->nullable();
            $table->unsignedInteger('registros_leidos')->default(0);
            $table->unsignedInteger('registros_cargados')->default(0);
            $table->unsignedInteger('registros_descartados')->default(0);
            $table->unsignedInteger('registros_con_advertencia')->default(0);
            $table->enum('estado', ['en_proceso', 'completado', 'fallido'])->default('en_proceso');
            $table->text('mensaje_error')->nullable();
            $table->foreignId('ejecutado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dss_etl_ejecuciones');
    }
};
