<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePresupuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'concepto' => 'sometimes|string|max:255',
            'tipo'     => 'sometimes|in:asignado,ejercido,comprometido,disponible',
            'monto'    => 'sometimes|numeric|min:0.01',
            'mes'      => 'sometimes|nullable|integer|min:1|max:12',
            'notas'    => 'nullable|string|max:1000',
        ];
    }
}
