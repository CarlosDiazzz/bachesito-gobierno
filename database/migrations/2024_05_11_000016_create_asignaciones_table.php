<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('asignaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporte_id')->constrained('reportes')->cascadeOnDelete();
            $table->foreignId('asignado_a')->constrained('users');
            $table->foreignId('asignado_por')->constrained('users');
            $table->foreignId('dependencia_id')->constrained('dependencias');
            $table->enum('estado', ['pendiente', 'aceptada', 'en_proceso', 'completada', 'cancelada'])->default('pendiente');
            $table->text('notas_asignacion')->nullable();
            $table->timestamp('fecha_asignacion')->nullable();
            $table->timestamp('fecha_inicio')->nullable();
            $table->timestamp('fecha_completada')->nullable();
            $table->timestamps();
            $table->index('reporte_id');
            $table->index('asignado_a');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asignaciones');
    }
};
