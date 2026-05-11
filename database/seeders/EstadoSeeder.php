<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('estados')->insertOrIgnore([
            ['id' => 20, 'clave_inegi' => '20', 'nombre' => 'Oaxaca', 'abreviatura' => 'Oax.']
        ]);
    }
}
