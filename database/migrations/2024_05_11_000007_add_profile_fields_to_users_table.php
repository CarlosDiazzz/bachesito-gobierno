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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('avatar_url')->nullable()->after('phone');
            $table->enum('status', ['active', 'suspended', 'pending'])->default('active')->after('avatar_url');
            $table->foreignId('municipio_id')->nullable()->after('status')->constrained('municipios')->nullOnDelete();
            $table->foreignId('colonia_id')->nullable()->after('municipio_id')->constrained('colonias')->nullOnDelete();
            $table->integer('puntos_civicos_total')->default(0)->after('colonia_id');
            $table->timestamp('last_login_at')->nullable()->after('puntos_civicos_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['municipio_id']);
            $table->dropForeign(['colonia_id']);
            $table->dropColumn([
                'phone',
                'avatar_url',
                'status',
                'municipio_id',
                'colonia_id',
                'puntos_civicos_total',
                'last_login_at',
            ]);
        });
    }
};
