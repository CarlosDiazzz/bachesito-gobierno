<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AsignarReporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reparador_id'     => 'required|exists:users,id',
            'notas_asignacion' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'reparador_id.required' => 'Selecciona un reparador.',
            'reparador_id.exists'   => 'El reparador seleccionado no existe.',
        ];
    }
}
