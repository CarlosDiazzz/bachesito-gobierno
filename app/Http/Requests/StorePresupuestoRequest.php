<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePresupuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dependencia_id' => 'required|exists:dependencias,id',
            'municipio_id'   => 'required|exists:municipios,id',
            'anio'           => 'required|integer|min:2020|max:2035',
            'mes'            => 'nullable|integer|min:1|max:12',
            'concepto'       => 'required|string|max:255',
            'tipo'           => 'required|in:asignado,ejercido,comprometido,disponible',
            'monto'          => 'required|numeric|min:0.01',
            'notas'          => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'dependencia_id.required' => 'Selecciona una dependencia.',
            'municipio_id.required'   => 'Selecciona un municipio.',
            'anio.required'           => 'El año es obligatorio.',
            'concepto.required'       => 'El concepto es obligatorio.',
            'tipo.required'           => 'El tipo de movimiento es obligatorio.',
            'tipo.in'                 => 'Tipo no válido.',
            'monto.required'          => 'El monto es obligatorio.',
            'monto.min'               => 'El monto debe ser mayor a cero.',
        ];
    }
}
