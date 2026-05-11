<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalizarFotoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'foto' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'foto.required' => 'Debes subir una foto.',
            'foto.image'    => 'El archivo debe ser una imagen.',
            'foto.max'      => 'La imagen no puede pesar más de 10 MB.',
        ];
    }
}
