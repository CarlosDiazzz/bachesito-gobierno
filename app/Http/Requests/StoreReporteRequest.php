<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'foto'                 => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'latitud'              => 'required|numeric|between:-90,90',
            'longitud'             => 'required|numeric|between:-180,180',
            'descripcion'          => 'required|string|min:10|max:1000',
            'tipo_via'             => 'required|in:avenida_principal,calle_secundaria,callejon,boulevard,carretera,privada',
            'nombre_via'           => 'required|string|max:255',
            'municipio_id'         => 'required|exists:municipios,id',
            'colonia_id'           => 'nullable|exists:colonias,id',
            'calle_id'             => 'nullable|exists:calles,id',
            'direccion_aproximada' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'latitud.required'      => 'La ubicación es obligatoria.',
            'descripcion.required'  => 'Describe el bache.',
            'descripcion.min'       => 'La descripción debe tener al menos 10 caracteres.',
            'tipo_via.required'     => 'Indica el tipo de vía.',
            'nombre_via.required'   => 'Indica el nombre de la calle o avenida.',
            'municipio_id.required' => 'Selecciona un municipio.',
            'municipio_id.exists'   => 'Municipio no válido.',
        ];
    }
}
