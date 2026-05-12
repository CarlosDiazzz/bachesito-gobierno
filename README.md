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

## 🏛️ Identidad Visual

El proyecto utiliza los colores oficiales del Municipio de Oaxaca de Juárez:
- **Guinda Institucional:** `#691332`
- **Oro Oaxaqueño:** `#BC955C`
- **Grecas Zapotecas:** Patrones geométricos inspirados en Mitla, integrados en la interfaz para resaltar la identidad local.

---

**Desarrollado con ❤️ para el Municipio de Oaxaca de Juárez.**  
*BachesITO v1.0 · HackaTec 2026*
