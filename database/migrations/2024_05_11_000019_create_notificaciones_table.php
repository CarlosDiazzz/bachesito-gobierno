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
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reporte_id')->nullable()->constrained('reportes')->nullOnDelete();
            $table->string('titulo');
            $table->text('cuerpo');
            $table->enum('canal', ['push', 'email', 'sms', 'in_app'])->default('in_app');
            $table->enum('tipo', ['reporte_recibido', 'estado_actualizado', 'asignacion', 'resolucion', 'sistema']);
            $table->boolean('leida')->default(false);
            $table->timestamp('leida_at')->nullable();
            $table->timestamp('enviada_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'leida']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
