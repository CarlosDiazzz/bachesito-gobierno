<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $oaxacaId = DB::table('municipios')->where('clave_inegi','20067')->value('id');
        $centroId = DB::table('colonias')->where('nombre','Centro Histórico')->where('municipio_id',$oaxacaId)->value('id');
        $munDepId = DB::table('dependencias')->where('clave','MUN-OAX-067')->value('id');

        $roles = DB::table('roles')->pluck('id', 'name')->toArray();

        $users = [
            [
                'email' => 'admin@bachesito.gob.mx',
                'name' => 'Administrador BachesITO',
                'password' => Hash::make('BachesITO2026!'),
                'status' => 'active',
                'municipio_id' => $oaxacaId,
                'colonia_id' => $centroId,
                'role' => 'autoridad',
                'dependencia' => $munDepId,
                'es_jefe' => true
            ],
            [
                'email' => 'supervisor@bachesito.gob.mx',
                'name' => 'María López Supervisora',
                'password' => Hash::make('Supervisor2026!'),
                'status' => 'active',
                'municipio_id' => $oaxacaId,
                'colonia_id' => $centroId,
                'role' => 'supervisor',
                'dependencia' => $munDepId,
                'es_jefe' => false
            ],
            [
                'email' => 'reparador@bachesito.gob.mx',
                'name' => 'Carlos Méndez Reparador',
                'password' => Hash::make('Reparador2026!'),
                'status' => 'active',
                'municipio_id' => $oaxacaId,
                'colonia_id' => $centroId,
                'role' => 'reparador',
                'dependencia' => $munDepId,
                'es_jefe' => false
            ],
            [
                'email' => 'ciudadano@bachesito.gob.mx',
                'name' => 'Ana García Ciudadana',
                'password' => Hash::make('Ciudadano2026!'),
                'status' => 'active',
                'municipio_id' => $oaxacaId,
                'colonia_id' => $centroId,
                'role' => 'ciudadano',
                'dependencia' => null,
                'es_jefe' => false
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            $depId = $userData['dependencia'];
            $esJefe = $userData['es_jefe'];
            
            unset($userData['role'], $userData['dependencia'], $userData['es_jefe']);
            
            DB::table('users')->insertOrIgnore($userData);
            
            $userId = DB::table('users')->where('email', $userData['email'])->value('id');
            
            if ($userId) {
                // Attach role
                DB::table('user_roles')->insertOrIgnore([
                    'user_id' => $userId,
                    'role_id' => $roles[$roleName],
                    'assigned_at' => now(),
                    'assigned_by' => null,
                ]);

                // Attach dependency
                if ($depId) {
                    DB::table('user_dependencias')->insertOrIgnore([
                        'user_id' => $userId,
                        'dependencia_id' => $depId,
                        'es_jefe' => $esJefe,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
