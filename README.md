# 🛣️ BachesITO — Sistema de Gestión Vial Inteligente

<p align="center">
  <img src="public/images/logo.png" width="200" alt="BachesITO Logo">
</p>

> **Transformando la infraestructura vial con identidad y tecnología.**  
> Proyecto institucional para el Municipio de Oaxaca de Juárez diseñado para la detección, priorización y gestión eficiente de baches mediante Inteligencia Artificial.

---

## 🌟 Descripción General

**BachesITO** es una plataforma integral que conecta a la ciudadanía con el gobierno municipal. Permite reportar desperfectos viales en tiempo real, los cuales son analizados automáticamente por modelos de IA para determinar su gravedad y prioridad de reparación.

Este sistema no solo optimiza los recursos públicos, sino que también refuerza la identidad institucional a través de una interfaz moderna inspirada en la herencia cultural de Oaxaca (colores guinda, oro y patrones de grecas zapotecas).

## 🚀 Características Principales

- **🤖 Análisis con IA (GPT-4o Vision):** Clasificación automática del tipo de daño, dimensiones estimadas y nivel de peligro a partir de una fotografía.
- **📊 Score de Prioridad:** Algoritmo inteligente que asigna puntajes basados en la ubicación, tráfico de la zona y análisis técnico de la IA.
- **🗺️ Mapa Interactivo:** Visualización geoespacial de reportes para supervisores y cuadrillas de reparación.
- **💼 Panel Administrativo:** Gestión completa de presupuestos, asignación de cuadrillas y seguimiento de estados (Pendiente, Asignado, Resuelto).
- **📱 Interfaz Adaptativa:** Diseño optimizado para uso en campo (móvil) y oficina (escritorio).

## 🛠️ Stack Tecnológico

### Backend
- **Laravel 11:** Framework principal de PHP.
- **OpenAI API:** Integración de GPT-4o Vision para pre-análisis técnico.
- **SQLite:** Base de datos ágil para el entorno de desarrollo/producción actual.
- **Laravel Sanctum:** Autenticación robusta basada en tokens.

### Frontend
- **React (Vite):** Biblioteca de UI para una experiencia SPA (Single Page Application) fluida.
- **Tailwind CSS & Custom Design:** Estilos institucionales personalizados.
- **Lucide React:** Iconografía moderna y minimalista.
- **React Leaflet:** Integración de mapas basada en OpenStreetMap.

## 📦 Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto localmente:

### Requisitos Previos
- PHP 8.3+
- Composer
- Node.js & NPM

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CarlosDiazzz/bachesito-gobierno.git
   cd bachesito-gobierno
   ```

2. **Instalar dependencias:**
   ```bash
   composer install
   npm install
   ```

3. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   *Nota: Configura tu `OPENAI_API_KEY` en el archivo `.env` para habilitar el análisis por IA.*

4. **Base de datos:**
   ```bash
   touch database/database.sqlite
   php artisan migrate --seed
   ```

5. **Compilar y Correr:**
   ```bash
   npm run build
   # En terminales separadas:
   php artisan serve
   npm run dev
   ```

## 📊 Módulo DSS (Proyecto Integrador DSTD)

Módulo agregado para la materia **Desarrollo de Software para la Toma de Decisiones**. Se
construye sobre el sistema existente sin modificar la tabla `reportes`.

**Ya existía antes del módulo (base del sistema):**
- `app/Services/TopsisService.php`: ranking TOPSIS con escenarios *equilibrado* y *rezago* y filtros.
- `GET /api/analisis/topsis` y la pantalla `Priorizacion.jsx` (ranking, zonas, comparación de escenarios y recomendación IA).
- La validación geográfica de reportes dentro de Oaxaca de Juárez (`ReporteController::OAXACA_BOUNDS`).

**Agregado para la materia (prefijo / carpeta `Dss`):**

| Componente | Ubicación |
|---|---|
| Proceso ETL (extraer → transformar → cargar) con 5 reglas de limpieza | `app/Services/Dss/EtlService.php` |
| Comando de consola `php artisan dss:etl` | `app/Console/Commands/DssEtlCommand.php` |
| Tablas `dss_etl_ejecuciones`, `dss_etl_anomalias`, `dss_reportes_limpios` | `database/migrations/2026_11_19_*` y modelos `app/Models/Dss*.php` |
| API `/api/dss/etl/{ultima,anomalias,ejecutar}` | `app/Http/Controllers/Api/DssController.php` |
| Pestaña **Calidad de datos** en Priorización | `resources/js/components/dss/TabCalidadDatos.jsx` |
| Datos sucios simulados (folios `SIM-`) | `database/seeders/DatosSuciosSeeder.php` |
| Pruebas de cada regla y de reproducibilidad | `tests/Feature/Dss/EtlServiceTest.php` |
| Documentación | [`docs/dss/diccionario-datos.md`](docs/dss/diccionario-datos.md), [`docs/dss/etl.md`](docs/dss/etl.md) |

Único cambio en código existente: `ReporteController::OAXACA_BOUNDS` pasó de `private` a `public` para
reutilizar los mismos límites geográficos en el ETL.

```bash
php artisan migrate
php artisan db:seed --class=DatosSuciosSeeder   # opcional: datos de demostración con errores
php artisan dss:etl
php artisan test tests/Feature/Dss
```

## 🏛️ Identidad Visual

El proyecto utiliza los colores oficiales del Municipio de Oaxaca de Juárez:
- **Guinda Institucional:** `#691332`
- **Oro Oaxaqueño:** `#BC955C`
- **Grecas Zapotecas:** Patrones geométricos inspirados en Mitla, integrados en la interfaz para resaltar la identidad local.

---

**Desarrollado con ❤️ para el Municipio de Oaxaca de Juárez.**  
*BachesITO v1.0 · HackaTec 2026*
