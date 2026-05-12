<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Catálogos geográficos
            EstadoSeeder::class,
            MunicipioSeeder::class,
            ColoniaSeeder::class,
            CalleSeeder::class,
            // Sistema
            RolesPermissionsSeeder::class,
            InsigniasSeeder::class,
            DependenciaSeeder::class,
            ZonaSeeder::class,
            // Usuarios y presupuesto base
            AdminSeeder::class,
            PresupuestoSeeder::class,
            // Datos de demostración (baches, fotos, IA, historial, asignaciones)
            DemoDataSeeder::class,
        ]);
    }
}
