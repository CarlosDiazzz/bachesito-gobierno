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
        Schema::create('insignias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->text('descripcion');
            $table->string('icono_url')->nullable();
            $table->string('color')->default('#1D9E75');
            $table->integer('puntos_requeridos')->default(0);
            $table->integer('reportes_requeridos')->default(0);
            $table->enum('nivel', ['bronce', 'plata', 'oro', 'platino']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insignias');
    }
};
