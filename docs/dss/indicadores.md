# Indicadores del módulo DSS

> Proyecto Integrador · Desarrollo de Software para la Toma de Decisiones (DSTD)

Implementación: `app/Services/Dss/IndicadoresService.php`. Los indicadores se devuelven en el campo
`indicadores` de `GET /api/analisis/topsis` y se muestran como tarjetas arriba de la pestaña
**Ranking TOPSIS**.

Se calculan **sobre el mismo ranking** que la recomendación: misma fuente (datos limpios del ETL),
escenario, filtros y presupuesto. Por eso cambian cuando el usuario cambia cualquiera de esos
parámetros. El universo es el conjunto de baches rankeados. Los reportes "sin sustento" quedan
fuera porque no participan en la decisión.

## Tabla de indicadores

| Indicador | Fórmula | Fuente | Periodicidad | Para qué sirve en la decisión |
|---|---|---|---|---|
| **Antigüedad media del backlog** (`antiguedad_backlog`, días) | $\frac{1}{n}\sum dias\_pendiente_i$, más la mediana | Criterio `dias_pendiente` de `dss_reportes_limpios` | Cada consulta (con los días de la última ejecución ETL) | Mide el rezago acumulado. Si la media es mucho menor que la mediana, hay un grupo de reportes recientes que esconde un rezago antiguo; eso apoya elegir el escenario "Reducción del rezago". |
| **Cobertura presupuestal** (`cobertura_presupuestal`, %) | $\frac{\sum costo_{recomendados}}{\sum costo_{rankeados}} \times 100$ | Costo estimado (`dss_parametros`) y presupuesto usado (parámetro o tabla `presupuestos`) | Cada consulta; el presupuesto base es mensual | Indica qué parte del problema resuelve el presupuesto del mes. Sirve para justificar una ampliación o reasignación de presupuesto. |
| **Baches cubiertos** (`baches_cubiertos`, %) | $\frac{n_{recomendados}}{n_{rankeados}} \times 100$ | Decisión greedy por presupuesto sobre el ranking | Cada consulta | Complementa la cobertura en costo con la cobertura en número de baches. Si la cobertura en costo es baja pero los baches cubiertos son muchos, se están atendiendo sobre todo baches baratos. |
| **Concentración por colonia** (`concentracion_colonias`, %) | $\frac{\sum_{top\,5} n_{colonia}}{n_{rankeados}} \times 100$, más el % de cada colonia | `reportes.colonia_id` → `colonias.nombre` | Cada consulta | Muestra si el problema está localizado. Una concentración alta favorece programar cuadrillas por zona o un programa de rehabilitación integral en esas colonias. |
| **Tasa de calidad de datos** (`tasa_calidad_datos`, %) | $\frac{registros\_cargados}{registros\_leidos} \times 100$ | Ejecución ETL usada (`dss_etl_ejecuciones`) | Cada ejecución del ETL | Indica cuánto se puede confiar en el ranking. Con una calidad baja, la recomendación descansa en pocos datos válidos y conviene revisar la captura antes de decidir. |

## Estructura de cada indicador

```json
{
  "clave": "cobertura_presupuestal",
  "nombre": "Cobertura presupuestal",
  "valor": 24.1,
  "unidad": "%",
  "formula": "costo de recomendados / costo total de baches rankeados × 100",
  "fuente": "Costo estimado (área × costo_m2 + costo fijo, dss_parametros) y presupuesto usado",
  "interpretacion": "El presupuesto cubre el 24.1 % del costo pendiente ($9,495 de $39,330).",
  "detalle": { "costo_recomendados": 9495, "costo_total_pendiente": 39330 }
}
```

La `interpretacion` se genera con reglas fijas, sin IA. Para la calidad de datos se usan estos
umbrales: ≥ 90 % alta, ≥ 75 % aceptable y < 75 % baja.

## Casos límite

| Situación | Resultado |
|---|---|
| No hay baches rankeados | Todos los valores en 0 (no hay división entre cero) y la interpretación dice "No hay baches pendientes en la selección". |
| No hay presupuesto (ni parámetro ni registro del mes) | Cobertura y baches cubiertos en 0, con la interpretación "Sin presupuesto definido". |
| No hay ejecución ETL | Tasa de calidad `null` ("No disponible"), para no dar a entender una calidad del 0 %. |
| Reporte sin colonia | Se agrupa como "Sin colonia". |

## Aviso de ETL desactualizado

El ranking usa la "foto" de la última ejecución del ETL. En `meta` se agrega:

- `reportes_nuevos_desde_etl`: número de reportes **activos** con `created_at` o `updated_at`
  posterior al inicio (`iniciado_at`) de la ejecución usada. Un cambio de estado también cuenta,
  porque el ETL guardó el estado anterior.
- `etl_desactualizado`: `true` si ese número es mayor que 0.

El conteo es global (no depende de los filtros), porque mide qué tan actualizado está el ETL en
conjunto. En la interfaz aparece el banner *"Hay N reportes nuevos desde el último ETL"* con un
botón para volver a correrlo.

## Pruebas

`tests/Feature/Dss/IndicadoresTest.php` verifica cada indicador con datos conocidos:
7 baches en 6 colonias, con media de 20.7 días, mediana de 20 días, concentración del 85.7 %,
costo total de $10,020 y calidad del 80 %. También prueba los casos de presupuesto 0, presupuesto
total, sin reportes y sin ETL, y la aparición del aviso al crear o modificar un reporte después del ETL.
