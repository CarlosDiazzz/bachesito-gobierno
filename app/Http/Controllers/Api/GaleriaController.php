<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GaleriaFoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GaleriaController extends Controller
{
    public function index()
    {
        $photos = GaleriaFoto::orderBy('orden')
            ->orderByDesc('created_at')
            ->get(['id', 'titulo', 'descripcion', 'url', 'mime_type', 'orden', 'created_at']);

        return response()->json(['data' => $photos]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'photos' => 'required|array|max:12',
            'photos.*' => 'required|file|image|mimes:jpeg,png,jpg,webp|max:10240',
            'titles' => 'nullable|array',
            'descriptions' => 'nullable|array',
        ]);

        $uploaded = [];

        foreach ($request->file('photos') as $index => $photo) {
            $filename = Str::slug(pathinfo($photo->getClientOriginalName(), PATHINFO_FILENAME))
                . '-' . time() . '-' . $index
                . '.' . $photo->getClientOriginalExtension();

            $path = $photo->storeAs('galeria', $filename, 'public');
            $url = Storage::url($path);

            $record = GaleriaFoto::create([
                'user_id' => $request->user()->id,
                'titulo' => $request->input('titles.'.$index) ?? null,
                'descripcion' => $request->input('descriptions.'.$index) ?? null,
                'url' => $url,
                'storage_path' => $path,
                'mime_type' => $photo->getMimeType(),
                'orden' => $index,
            ]);

            $uploaded[] = [
                'id' => $record->id,
                'url' => $record->url,
                'titulo' => $record->titulo,
                'descripcion' => $record->descripcion,
            ];
        }

        return response()->json(['uploaded' => $uploaded], 201);
    }
}
