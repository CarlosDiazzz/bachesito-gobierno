<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estado;
use App\Models\Municipio;
use App\Models\Colonia;
use Illuminate\Http\Request;

class MexicoController extends Controller
{
    public function estados()
    {
        return response()->json(Estado::orderBy('nombre')->get(['id','nombre','clave']));
    }

    public function municipios(Request $request)
    {
        $query = Municipio::orderBy('nombre');
        if ($request->estado_id) {
            $query->where('estado_id', $request->estado_id);
        }
        return response()->json($query->get(['id','nombre','clave_municipio','estado_id']));
    }

    public function colonias(int $id)
    {
        return response()->json(
            Colonia::where('municipio_id', $id)->orderBy('nombre')->get(['id','nombre','codigo_postal'])
        );
    }

    public function buscarPorCp(Request $request)
    {
        $request->validate(['cp' => 'required|digits:5']);
        return response()->json(
            Colonia::where('codigo_postal', $request->cp)->with('municipio')->get()
        );
    }
}
