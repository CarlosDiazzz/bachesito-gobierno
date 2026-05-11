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
        Schema::create('historial_estados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporte_id')->constrained('reportes')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('estado_anterior', ['pendiente', 'validado', 'rechazado', 'asignado', 'en_proceso', 'resuelto', 'cerrado'])->nullable();
            $table->enum('estado_nuevo', ['pendiente', 'validado', 'rechazado', 'asignado', 'en_proceso', 'resuelto', 'cerrado']);
            $table->text('motivo')->nullable();
            $table->timestamps();
            $table->index('reporte_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_estados');
    }
};
