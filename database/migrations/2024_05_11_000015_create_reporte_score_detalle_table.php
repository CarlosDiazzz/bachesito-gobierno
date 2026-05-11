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
        Schema::create('reporte_score_detalle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporte_id')->unique()->constrained('reportes')->cascadeOnDelete();
            $table->float('score_severidad')->default(0);
            $table->float('score_trafico')->default(0);
            $table->float('score_tipo_via')->default(0);
            $table->float('score_infraestructura_critica')->default(0);
            $table->float('score_pci')->default(0);
            $table->float('score_reportes_zona')->default(0);
            $table->float('score_final')->default(0);
            $table->text('formula_aplicada')->nullable();
            $table->timestamp('calculado_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reporte_score_detalle');
    }
};
