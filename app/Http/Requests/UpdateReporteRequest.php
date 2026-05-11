<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'estado'    => 'required|in:pendiente,validado,rechazado,asignado,en_proceso,resuelto,cerrado',
            'prioridad' => 'nullable|in:critica,alta,media,baja',
            'notas'     => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'estado.required' => 'El estado es obligatorio.',
            'estado.in'       => 'Estado no válido.',
            'prioridad.in'    => 'Prioridad no válida.',
        ];
    }
}
