<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Módulo DSS (Proyecto Integrador DSTD): parámetros del modelo de decisión (costos supuestos).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dss_parametros', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique();
            $table->decimal('valor', 14, 4);
            $table->text('descripcion')->nullable();
            $table->string('unidad', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dss_parametros');
    }
};
