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
        Schema::create('reporte_ai_analisis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporte_id')->unique()->constrained('reportes')->cascadeOnDelete();
            $table->string('modelo_usado')->default('gpt-4o');
            $table->boolean('es_bache')->default(false);
            $table->float('confianza')->default(0);
            $table->enum('severidad_ia', ['alta', 'media', 'baja'])->nullable();
            $table->float('profundidad_estimada_cm')->nullable();
            $table->float('area_estimada_m2')->nullable();
            $table->text('razon')->nullable();
            $table->json('raw_response')->nullable();
            $table->float('tokens_usados')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reporte_ai_analisis');
    }
};
