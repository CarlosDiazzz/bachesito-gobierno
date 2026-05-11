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
        Schema::create('reportes', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->foreignId('ciudadano_id')->constrained('users');
            $table->foreignId('zona_id')->nullable()->constrained('zonas')->nullOnDelete();
            $table->foreignId('dependencia_id')->nullable()->constrained('dependencias')->nullOnDelete();
            $table->foreignId('municipio_id')->nullable()->constrained('municipios')->nullOnDelete();
            $table->foreignId('colonia_id')->nullable()->constrained('colonias')->nullOnDelete();
            $table->enum('tipo_via', ['avenida_principal', 'calle_secundaria', 'callejon', 'boulevard', 'carretera', 'privada'])->nullable();
            $table->string('nombre_via')->nullable();
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);
            $table->string('direccion_aproximada')->nullable();
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['pendiente', 'validado', 'rechazado', 'asignado', 'en_proceso', 'resuelto', 'cerrado'])->default('pendiente');
            $table->enum('prioridad', ['critica', 'alta', 'media', 'baja'])->default('media');
            $table->float('score_prioridad')->nullable();
            $table->timestamp('fecha_reporte')->useCurrent();
            $table->timestamp('fecha_limite_estimada')->nullable();
            $table->timestamp('fecha_resolucion')->nullable();
            $table->timestamps();
            $table->index('estado');
            $table->index('prioridad');
            $table->index('ciudadano_id');
            $table->index('dependencia_id');
            $table->index('municipio_id');
            $table->index(['latitud', 'longitud']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes');
    }
};
