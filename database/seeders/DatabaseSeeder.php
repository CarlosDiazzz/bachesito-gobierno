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
            EstadoSeeder::class,
            MunicipioSeeder::class,
            ColoniaSeeder::class,
            CalleSeeder::class,
            RolesPermissionsSeeder::class,
            InsigniasSeeder::class,
            DependenciaSeeder::class,
            ZonaSeeder::class,
            AdminSeeder::class,
            PresupuestoSeeder::class,
        ]);
    }
}
