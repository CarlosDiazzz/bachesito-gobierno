# Diccionario de datos: módulo DSS

> Proyecto Integrador · Desarrollo de Software para la Toma de Decisiones (DSTD)

Variables que alimentan el análisis multicriterio **TOPSIS**, más los atributos de ubicación.
Los valores transformados se guardan en la tabla `dss_reportes_limpios` después de cada
ejecución del ETL (`php artisan dss:etl`).

## Variables

| Nombre | Tipo de dato | Fuente | Significado | Rango / valores válidos | Regla de validación | Transformación en el ETL |
|---|---|---|---|---|---|---|
| `severidad` | `float` | `reporte_ai_analisis.severidad_ia` | Gravedad del bache estimada por la IA a partir de la foto | Origen: `alta`, `media`, `baja`, `NULL`. Transformado: 0.10 – 1.00 | Si no hay análisis IA o la confianza es < 0.5, el registro se **marca** con `datos_suficientes = false` (regla 4) | `alta`→1.00, `media`→0.60, `baja`→0.20, nulo→0.10 (misma escala que `TopsisService`) |
| `tipo_via` | `float` | `reportes.tipo_via`; si es nulo, `calles.tipo` vía `reportes.calle_id` | Importancia de la vía donde está el bache | Origen: `carretera`, `avenida_principal`, `boulevard`, `calle_secundaria`, `callejon`, `privada`. Transformado: 0.20 – 1.00 | Si es nulo se **imputa** (regla 3) | `carretera`→1.00, `avenida_principal`→0.90, `boulevard`→0.80, `calle_secundaria`→0.50, `callejon`→0.20, otro (`privada`)→0.30 |
| `dias_pendiente` | `int` | Cálculo: días entre `reportes.fecha_reporte` y el momento de la ejecución | Antigüedad del reporte sin atender | ≥ 1 | `fecha_reporte` no puede ser nula ni futura; si lo es, el registro se **descarta** (regla 5) | `max(floor(días), 1)` |
| `densidad_zona` | `int` | Cálculo: reportes limpios a ≤ 200 m (haversine) | Concentración de baches en la zona | ≥ 1 | Se calcula **después** de fusionar duplicados para no inflar la densidad | `1 + número de otros reportes limpios a ≤ 200 m` |
| `score_ia` | `float` | `reportes.score_prioridad` | Puntaje de prioridad calculado por `ScoreService` | 0 – 100 | Ninguna (nulo → 0) | Copia directa; nulo → 0 |
| `colonia_id` | `int` (FK) | `reportes.colonia_id` → `colonias.id`; si es nulo, `calles.colonia_id` (vía `reportes.calle_id`) o la colonia del reporte limpio más cercano | Colonia del reporte, para agregación por zona y concentración | ID existente o `NULL` ("Sin colonia") | Si es nula, se registra `campo_faltante` (regla 6) | Copia directa; si falta, se **imputa** por calle o por vecino a ≤ 200 m; si no es posible, queda `NULL` y se **marca** |
| `latitud` | `decimal(10,7)` | `reportes.latitud` | Latitud WGS84 | 16.90 – 17.25 | Fuera de rango o nula → **descartado** (regla 1) | Copia directa |
| `longitud` | `decimal(10,7)` | `reportes.longitud` | Longitud WGS84 | -96.95 – -96.50 | Fuera de rango o nula → **descartado** (regla 1) | Copia directa |

### Atributos adicionales de `dss_reportes_limpios`

| Nombre | Tipo | Significado |
|---|---|---|
| `num_reportes_fusionados` | `int` | 1 + número de duplicados fusionados en este reporte (regla 2). Sirve como evidencia de recurrencia ciudadana. |
| `datos_suficientes` | `bool` | `false` si el análisis IA falta o no es confiable (regla 4). |
| `ejecucion_id` | FK | Ejecución del ETL que generó el registro (`dss_etl_ejecuciones`). |

## Reglas de limpieza (6 reglas)

Los umbrales son constantes con nombre al inicio de `app/Services/Dss/EtlService.php`.

| # | Regla | Umbral / constante | Tipo de anomalía | Acción | Severidad |
|---|---|---|---|---|---|
| 1 | Coordenadas nulas o fuera de Oaxaca de Juárez | `ReporteController::OAXACA_BOUNDS` (lat 16.90 – 17.25, lng -96.95 – -96.50), la misma validación que usa el registro de reportes | `coordenada_fuera_rango` | `descartado` | error |
| 2 | Duplicados: dos reportes a menos de 15 m y con menos de 7 días de diferencia. Se conserva el más antiguo y se suma a su `num_reportes_fusionados` | `DISTANCIA_DUPLICADO_M = 15`, `DIAS_DUPLICADO = 7` | `duplicado` | `fusionado` | advertencia |
| 3 | `tipo_via` nulo. Se toma el tipo de la calle asociada; si no lo aporta, se imputa el valor por defecto | `TIPO_VIA_IMPUTADO = 'calle_secundaria'` | `tipo_via_faltante` | `imputado` | advertencia |
| 4 | Sin análisis IA o con confianza menor al umbral. La IA guarda la confianza en escala 0–100, así que se divide entre 100 antes de comparar | `UMBRAL_CONFIANZA = 0.5`, `ESCALA_CONFIANZA = 100` | `sin_analisis_ia` | `marcado` (`datos_suficientes = false`) | advertencia |
| 5a | `fecha_reporte` en el futuro (o nula → `campo_faltante`) | Fecha y hora de inicio de la ejecución | `fecha_invalida` / `campo_faltante` | `descartado` | error |
| 5b | `fecha_resolucion` anterior a `fecha_reporte` | — | `fecha_invalida` | `marcado` | advertencia |
| 6 | `colonia_id` nulo. Se imputa, en este orden: (a) la colonia de la calle asociada; (b) la colonia del reporte limpio más cercano dentro del radio. Solo se toman como referencia reportes con colonia original, no imputada en la misma ejecución, para no encadenar imputaciones. Si ninguna aplica, queda como "Sin colonia" | `RADIO_IMPUTACION_COLONIA_M = 200` | `campo_faltante` (campo `colonia_id`) | `imputado` / `marcado` | advertencia |

**Orden de aplicación:** primero las reglas que descartan (1 y 5a). Un registro descartado ya no
pasa por las demás reglas. Después se deduplica (2) y al final se imputa o se marca (3, 4, 5b y 6).
La imputación de colonia solo se escribe en `dss_reportes_limpios.colonia_id`; la tabla `reportes`
no se modifica.
Un registro puede acumular varias advertencias, pero cuenta una sola vez en
`registros_con_advertencia`.

**Métricas de calidad:**
`registros_leidos = cargados + descartados + fusionados`
`tasa de calidad = cargados / leídos × 100`
