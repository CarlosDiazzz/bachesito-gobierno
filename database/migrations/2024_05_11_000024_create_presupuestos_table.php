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
        Schema::create('presupuestos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dependencia_id')->constrained('dependencias');
            $table->foreignId('municipio_id')->constrained('municipios');
            $table->year('anio');
            $table->tinyInteger('mes')->nullable();
            $table->string('concepto');
            $table->enum('tipo', ['asignado', 'ejercido', 'comprometido', 'disponible']);
            $table->decimal('monto', 14, 2);
            $table->text('notas')->nullable();
            $table->foreignId('registrado_por')->constrained('users');
            $table->timestamps();
            $table->index(['dependencia_id', 'anio', 'mes']);
            $table->index('municipio_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presupuestos');
    }
};
