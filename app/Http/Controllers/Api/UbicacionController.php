<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Calle;
use App\Models\Colonia;
use App\Models\Municipio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UbicacionController extends Controller
{
    public function sugerir(Request $request)
    {
        $data = $request->validate([
            'latitud'  => 'required|numeric|between:-90,90',
            'longitud' => 'required|numeric|between:-180,180',
        ]);

        $lat = (float) $data['latitud'];
        $lng = (float) $data['longitud'];

        $geo = $this->reverseGeocode($lat, $lng);

        $municipio = $this->resolverMunicipio($geo['municipio'] ?? null, $lat, $lng);
        $colonia = $municipio ? $this->resolverColonia($municipio->id, $geo['colonia'] ?? null) : null;
        $calle = $municipio ? $this->resolverCalle($municipio->id, $geo['calle'] ?? null) : null;

        $tipoVia = $this->mapearTipoVia($calle?->tipo, $geo['calle'] ?? null);
        $nombreVia = $calle?->nombre ?? ($geo['calle'] ?? null);

        return response()->json([
            'municipio_id'         => $municipio?->id,
            'municipio_nombre'     => $municipio?->nombre,
            'colonia_id'           => $colonia?->id,
            'colonia_nombre'       => $colonia?->nombre,
            'calle_id'             => $calle?->id,
            'calle_nombre'         => $calle?->nombre ?? $geo['calle'] ?? null,
            'tipo_via'             => $tipoVia,
            'nombre_via'           => $nombreVia,
            'direccion_aproximada' => $geo['direccion'] ?? null,
            'fuente'               => empty($geo) ? 'estimado-local' : 'nominatim',
        ]);
    }

    private function reverseGeocode(float $lat, float $lng): array
    {
        try {
            $response = Http::acceptJson()
                ->withHeaders(['User-Agent' => 'BachesITO/1.0 (+https://bachesito.local)'])
                ->timeout(6)
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format'         => 'jsonv2',
                    'lat'            => $lat,
                    'lon'            => $lng,
                    'addressdetails' => 1,
                    'zoom'           => 18,
                ]);

            if (! $response->ok()) {
                return [];
            }

            $json = $response->json();
            $address = $json['address'] ?? [];

            return [
                'municipio' => $address['city']
                    ?? $address['town']
                    ?? $address['municipality']
                    ?? $address['village']
                    ?? $address['county']
                    ?? null,
                'colonia'   => $address['suburb']
                    ?? $address['neighbourhood']
                    ?? $address['quarter']
                    ?? $address['city_district']
                    ?? null,
                'calle'     => $address['road']
                    ?? $address['pedestrian']
                    ?? $address['footway']
                    ?? null,
                'direccion' => $json['display_name'] ?? null,
            ];
        } catch (\Throwable) {
            return [];
        }
    }

    private function resolverMunicipio(?string $municipioNombre, float $lat, float $lng): ?Municipio
    {
        $municipios = Municipio::select('id', 'nombre', 'latitud', 'longitud')->get();
        if ($municipios->isEmpty()) {
            return null;
        }

        if ($municipioNombre) {
            $target = $this->normalizar($municipioNombre);
            $porNombre = $municipios->first(function (Municipio $m) use ($target) {
                $nombre = $this->normalizar($m->nombre);
                return $nombre === $target
                    || str_contains($nombre, $target)
                    || str_contains($target, $nombre);
            });

            if ($porNombre) {
                return $porNombre;
            }
        }

        return $municipios
            ->filter(fn (Municipio $m) => $m->latitud !== null && $m->longitud !== null)
            ->sortBy(fn (Municipio $m) => (($lat - (float) $m->latitud) ** 2) + (($lng - (float) $m->longitud) ** 2))
            ->first();
    }

    private function resolverColonia(int $municipioId, ?string $coloniaNombre): ?Colonia
    {
        if (! $coloniaNombre) {
            return null;
        }

        $target = $this->normalizar($coloniaNombre);
        $colonias = Colonia::where('municipio_id', $municipioId)->get(['id', 'nombre']);

        return $colonias->first(function (Colonia $c) use ($target) {
            $nombre = $this->normalizar($c->nombre);
            return $nombre === $target
                || str_contains($nombre, $target)
                || str_contains($target, $nombre);
        });
    }

    private function resolverCalle(int $municipioId, ?string $calleNombre): ?Calle
    {
        if (! $calleNombre) {
            return null;
        }

        $target = $this->normalizar($calleNombre);
        $calles = Calle::where('municipio_id', $municipioId)->get(['id', 'nombre', 'tipo']);

        return $calles->first(function (Calle $c) use ($target) {
            $nombre = $this->normalizar($c->nombre);
            return $nombre === $target
                || str_contains($nombre, $target)
                || str_contains($target, $nombre);
        });
    }

    private function mapearTipoVia(?string $tipoCalle, ?string $nombreVia): string
    {
        if ($tipoCalle) {
            return match ($tipoCalle) {
                'avenida'   => 'avenida_principal',
                'boulevard' => 'boulevard',
                'carretera' => 'carretera',
                'callejon'  => 'callejon',
                'privada'   => 'privada',
                default     => 'calle_secundaria',
            };
        }

        $nombre = $this->normalizar((string) $nombreVia);
        if (str_starts_with($nombre, 'avenida') || str_starts_with($nombre, 'av ')) return 'avenida_principal';
        if (str_starts_with($nombre, 'boulevard') || str_starts_with($nombre, 'blvd')) return 'boulevard';
        if (str_starts_with($nombre, 'carretera')) return 'carretera';
        if (str_starts_with($nombre, 'callejon')) return 'callejon';
        if (str_starts_with($nombre, 'privada')) return 'privada';

        return 'calle_secundaria';
    }

    private function normalizar(string $value): string
    {
        return Str::lower(trim(Str::ascii($value)));
    }
}
