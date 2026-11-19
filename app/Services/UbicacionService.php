<?php

namespace App\Services;

use App\Models\Calle;
use App\Models\Colonia;
use App\Models\Municipio;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Resolución de municipio, colonia y calle a partir de coordenadas.
 *
 * Usa reverse geocoding de Nominatim (OpenStreetMap) y busca los nombres en los
 * catálogos locales. Respeta la política de uso de Nominatim: User-Agent
 * identificable, una sola petición por resolución y sin reintentos.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
class UbicacionService
{
    public const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

    /** Timeout (s) para la sugerencia interactiva del panel. */
    public const TIMEOUT_SUGERENCIA = 6;

    /** Timeout (s) al registrar un reporte: nunca debe bloquear el registro. */
    public const TIMEOUT_REGISTRO = 3;

    /**
     * Sugerencia completa para el formulario del panel (municipio, colonia, calle, tipo de vía).
     */
    public function sugerir(float $lat, float $lng): array
    {
        $geo = $this->reverseGeocode($lat, $lng, self::TIMEOUT_SUGERENCIA);

        $municipio = $this->resolverMunicipio($geo['municipio'] ?? null, $lat, $lng);
        $colonia = $municipio ? $this->resolverColonia($municipio->id, $geo['colonia'] ?? null) : null;
        $calle = $municipio ? $this->resolverCalle($municipio->id, $geo['calle'] ?? null) : null;

        return [
            'municipio_id' => $municipio?->id,
            'municipio_nombre' => $municipio?->nombre,
            'colonia_id' => $colonia?->id,
            'colonia_nombre' => $colonia?->nombre,
            'calle_id' => $calle?->id,
            'calle_nombre' => $calle?->nombre ?? $geo['calle'] ?? null,
            'tipo_via' => $this->mapearTipoVia($calle?->tipo, $geo['calle'] ?? null),
            'nombre_via' => $calle?->nombre ?? ($geo['calle'] ?? null),
            'direccion_aproximada' => $geo['direccion'] ?? null,
            'fuente' => empty($geo) ? 'estimado-local' : 'nominatim',
        ];
    }

    /**
     * Municipio y colonia para el registro de un reporte ciudadano.
     *
     * - Municipio: el indicado; si no, el nombre de Nominatim; si no, el texto del
     *   ciudadano; si no, el municipio con centroide más cercano a las coordenadas.
     * - Colonia (dentro del municipio): nombre de Nominatim; si no, texto del ciudadano;
     *   si ninguno coincide con el catálogo, null. No se imputa por vecinos: eso lo
     *   hace el ETL del módulo DSS, que lo registra como anomalía.
     *
     * Si Nominatim falla o tarda más de TIMEOUT_REGISTRO, se continúa sin él.
     *
     * @return array{municipio_id: ?int, colonia_id: ?int, fuente_municipio: string, fuente_colonia: ?string}
     */
    public function resolverParaRegistro(
        float $lat,
        float $lng,
        ?string $coloniaTexto = null,
        ?string $municipioTexto = null,
        ?int $municipioId = null,
    ): array {
        $geo = $this->reverseGeocode($lat, $lng, self::TIMEOUT_REGISTRO);

        [$municipio, $fuenteMunicipio] = match (true) {
            $municipioId !== null => [Municipio::find($municipioId), 'solicitud'],
            ($m = $this->buscarMunicipioPorNombre($geo['municipio'] ?? null)) !== null => [$m, 'nominatim'],
            ($m = $this->buscarMunicipioPorNombre($municipioTexto)) !== null => [$m, 'texto_ciudadano'],
            default => [$this->municipioMasCercano($lat, $lng), 'coordenadas'],
        };

        $colonia = null;
        $fuenteColonia = null;

        if ($municipio) {
            if ($colonia = $this->resolverColonia($municipio->id, $geo['colonia'] ?? null)) {
                $fuenteColonia = 'nominatim';
            } elseif ($colonia = $this->resolverColonia($municipio->id, $coloniaTexto)) {
                $fuenteColonia = 'texto_ciudadano';
            }
        }

        return [
            'municipio_id' => $municipio?->id,
            'colonia_id' => $colonia?->id,
            'fuente_municipio' => $municipio ? $fuenteMunicipio : 'sin_resolver',
            'fuente_colonia' => $fuenteColonia,
        ];
    }

    // ── Nominatim ─────────────────────────────────────────────────────────────

    /** Una sola petición, sin reintentos. Devuelve [] si falla. */
    public function reverseGeocode(float $lat, float $lng, int $timeout = self::TIMEOUT_SUGERENCIA): array
    {
        try {
            $response = Http::acceptJson()
                ->withHeaders(['User-Agent' => $this->userAgent()])
                ->connectTimeout(min(2, $timeout))
                ->timeout($timeout)
                ->get(self::NOMINATIM_URL, [
                    'format' => 'jsonv2',
                    'lat' => $lat,
                    'lon' => $lng,
                    'addressdetails' => 1,
                    'zoom' => 18,
                    'accept-language' => 'es',
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
                'colonia' => $address['suburb']
                    ?? $address['neighbourhood']
                    ?? $address['quarter']
                    ?? $address['city_district']
                    ?? null,
                'calle' => $address['road']
                    ?? $address['pedestrian']
                    ?? $address['footway']
                    ?? null,
                'direccion' => $json['display_name'] ?? null,
            ];
        } catch (\Throwable) {
            return [];
        }
    }

    private function userAgent(): string
    {
        return config('services.nominatim.user_agent', 'BachesITO/1.0 (+https://bachesito.local)');
    }

    // ── Catálogos ─────────────────────────────────────────────────────────────

    public function resolverMunicipio(?string $municipioNombre, float $lat, float $lng): ?Municipio
    {
        return $this->buscarMunicipioPorNombre($municipioNombre) ?? $this->municipioMasCercano($lat, $lng);
    }

    private function buscarMunicipioPorNombre(?string $nombre): ?Municipio
    {
        $target = $this->normalizar((string) $nombre);
        if ($target === '') {
            return null;
        }

        return Municipio::select('id', 'nombre', 'latitud', 'longitud')->get()
            ->first(fn (Municipio $m) => $this->coincide($this->normalizar($m->nombre), $target));
    }

    private function municipioMasCercano(float $lat, float $lng): ?Municipio
    {
        return Municipio::select('id', 'nombre', 'latitud', 'longitud')->get()
            ->filter(fn (Municipio $m) => $m->latitud !== null && $m->longitud !== null)
            ->sortBy(fn (Municipio $m) => (($lat - (float) $m->latitud) ** 2) + (($lng - (float) $m->longitud) ** 2))
            ->first();
    }

    public function resolverColonia(int $municipioId, ?string $coloniaNombre): ?Colonia
    {
        $target = $this->normalizar((string) $coloniaNombre);
        if ($target === '') {
            return null;
        }

        return Colonia::where('municipio_id', $municipioId)->get(['id', 'nombre'])
            ->first(fn (Colonia $c) => $this->coincide($this->normalizar($c->nombre), $target));
    }

    public function resolverCalle(int $municipioId, ?string $calleNombre): ?Calle
    {
        $target = $this->normalizar((string) $calleNombre);
        if ($target === '') {
            return null;
        }

        return Calle::where('municipio_id', $municipioId)->get(['id', 'nombre', 'tipo'])
            ->first(fn (Calle $c) => $this->coincide($this->normalizar($c->nombre), $target));
    }

    public function mapearTipoVia(?string $tipoCalle, ?string $nombreVia): string
    {
        if ($tipoCalle) {
            return match ($tipoCalle) {
                'avenida' => 'avenida_principal',
                'boulevard' => 'boulevard',
                'carretera' => 'carretera',
                'callejon' => 'callejon',
                'privada' => 'privada',
                default => 'calle_secundaria',
            };
        }

        $nombre = $this->normalizar((string) $nombreVia);
        if (str_starts_with($nombre, 'avenida') || str_starts_with($nombre, 'av ')) {
            return 'avenida_principal';
        }
        if (str_starts_with($nombre, 'boulevard') || str_starts_with($nombre, 'blvd')) {
            return 'boulevard';
        }
        if (str_starts_with($nombre, 'carretera')) {
            return 'carretera';
        }
        if (str_starts_with($nombre, 'callejon')) {
            return 'callejon';
        }
        if (str_starts_with($nombre, 'privada')) {
            return 'privada';
        }

        return 'calle_secundaria';
    }

    /** Misma regla de coincidencia que usaba UbicacionController. */
    private function coincide(string $nombreCatalogo, string $target): bool
    {
        return $nombreCatalogo !== ''
            && ($nombreCatalogo === $target
                || str_contains($nombreCatalogo, $target)
                || str_contains($target, $nombreCatalogo));
    }

    private function normalizar(string $value): string
    {
        return Str::lower(trim(Str::ascii($value)));
    }
}
