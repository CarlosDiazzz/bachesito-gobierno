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
        Schema::create('calles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('municipio_id')->constrained('municipios');
            $table->foreignId('colonia_id')->nullable()->constrained('colonias')->nullOnDelete();
            $table->string('nombre');
            $table->enum('tipo', ['avenida', 'calle', 'boulevard', 'callejon', 'carretera', 'privada', 'andador', 'cerrada'])->default('calle');
            $table->enum('importancia', ['principal', 'secundaria', 'local'])->default('local');
            $table->boolean('es_pavimentada')->default(true);
            $table->timestamps();
            $table->index('municipio_id');
            $table->index('colonia_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calles');
    }
};
