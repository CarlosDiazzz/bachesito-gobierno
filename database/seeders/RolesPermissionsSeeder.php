<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert Roles
        $roles = [
            ['name'=>'ciudadano',  'display_name'=>'Ciudadano',           'description'=>'Usuario que reporta baches desde la app pública'],
            ['name'=>'reparador',  'display_name'=>'Reparador de campo',  'description'=>'Personal operativo que atiende baches asignados'],
            ['name'=>'supervisor', 'display_name'=>'Supervisor municipal', 'description'=>'Valida reportes, asigna reparadores y supervisa zonas'],
            ['name'=>'autoridad',  'display_name'=>'Autoridad municipal',  'description'=>'Acceso total: presupuestos, reportes ejecutivos y configuración'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insertOrIgnore($role);
        }

        // Define permissions
        $permissionsList = [
            'reportes' => ['ver', 'crear', 'editar', 'eliminar', 'asignar', 'validar', 'exportar'],
            'zonas' => ['ver', 'gestionar'],
            'usuarios' => ['ver', 'gestionar'],
            'dashboard' => ['ver_basico', 'ver_completo'],
            'notificaciones' => ['ver', 'gestionar'],
            'presupuestos' => ['ver', 'crear', 'editar', 'exportar'],
            'municipios' => ['ver', 'gestionar'],
            'calles' => ['ver', 'gestionar'],
        ];

        $allPermissions = [];
        foreach ($permissionsList as $module => $actions) {
            foreach ($actions as $action) {
                $permissionName = "{$module}.{$action}";
                DB::table('permissions')->insertOrIgnore([
                    'name' => $permissionName,
                    'module' => $module,
                    'action' => $action,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $allPermissions[] = $permissionName;
            }
        }

        // Get all role IDs
        $roleIds = DB::table('roles')->pluck('id', 'name')->toArray();
        $permissionIds = DB::table('permissions')->pluck('id', 'name')->toArray();

        // Assign permissions
        $assignments = [
            'ciudadano' => [
                'reportes.ver', 'reportes.crear', 'notificaciones.ver', 'municipios.ver', 'calles.ver'
            ],
            'reparador' => [
                'reportes.ver', 'reportes.editar', 'dashboard.ver_basico', 'notificaciones.ver', 'municipios.ver', 'calles.ver', 'zonas.ver'
            ],
            'supervisor' => [
                'reportes.ver', 'reportes.crear', 'reportes.editar', 'reportes.asignar', 'reportes.validar', 'reportes.exportar', 
                'zonas.ver', 'zonas.gestionar', 'usuarios.ver', 'dashboard.ver_basico', 'dashboard.ver_completo', 
                'notificaciones.ver', 'notificaciones.gestionar', 'presupuestos.ver', 'municipios.ver', 'calles.ver', 'calles.gestionar'
            ],
            'autoridad' => $allPermissions,
        ];

        foreach ($assignments as $roleName => $perms) {
            $roleId = $roleIds[$roleName];
            foreach ($perms as $permName) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permissionIds[$permName],
                ]);
            }
        }
    }
}
