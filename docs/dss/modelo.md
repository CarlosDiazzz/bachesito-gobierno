# Modelo de decisión: priorización de baches con TOPSIS y presupuesto

> Proyecto Integrador · Desarrollo de Software para la Toma de Decisiones (DSTD)

Implementación: `app/Services/TopsisService.php` (ranking) y `app/Services/Dss/RecomendacionService.php`
(costo, presupuesto y explicación). Endpoint: `GET /api/analisis/topsis`.

## 1. Pregunta de decisión

> **Con el presupuesto disponible este mes, ¿qué baches debe reparar primero el municipio de
> Oaxaca de Juárez?**

- **Alternativas:** reportes de bache activos (`pendiente`, `validado`, `asignado`, `en_proceso`)
  que pasaron el ETL con datos suficientes.
- **Salida:** ranking completo y, para cada bache, la decisión `recomendado` o `en_espera`, su costo
  estimado y una explicación.

## 2. Criterios

Los cinco criterios son de **beneficio**: un valor más alto significa más urgencia. Por eso el ideal
positivo es el máximo de cada columna y el ideal negativo el mínimo.

| Criterio | Fuente (después del ETL) | Escala | Dirección |
|---|---|---|---|
| `severidad` | Severidad estimada por la IA | alta 1.00 · media 0.60 · baja 0.20 | Beneficio |
| `tipo_via` | Tipo de vía (imputado si falta) | carretera 1.00 · avenida 0.90 · boulevard 0.80 · calle 0.50 · callejón 0.20 | Beneficio |
| `dias_pendiente` | Días desde el reporte | ≥ 1 | Beneficio |
| `densidad_zona` | 1 + reportes limpios a ≤ 200 m | ≥ 1 | Beneficio |
| `score_ia` | `score_prioridad` (ScoreService) | 0 – 100 | Beneficio |

El detalle de cada variable está en [diccionario-datos.md](diccionario-datos.md).

## 3. Pesos por escenario

| Criterio | Equilibrado | Rezago |
|---|---:|---:|
| severidad | 0.30 | 0.25 |
| tipo_via | 0.25 | 0.15 |
| dias_pendiente | 0.20 | 0.40 |
| densidad_zona | 0.15 | 0.15 |
| score_ia | 0.10 | 0.05 |
| **Suma** | **1.00** | **1.00** |

**Escenario "Atención equilibrada"**
- **Severidad 0.30:** es el criterio con mayor peso porque un bache profundo es el mayor riesgo
  para personas y vehículos.
- **Tipo de vía 0.25:** en vías primarias el mismo daño afecta a más usuarios y al transporte público.
- **Días pendientes 0.20:** evita que los reportes antiguos se queden sin atender indefinidamente,
  sin que la antigüedad domine sobre la gravedad.
- **Densidad de zona 0.15:** si hay varios baches cerca, una sola salida de la cuadrilla atiende
  varios, lo que da eficiencia logística.
- **Score IA 0.10:** el puntaje previo ya combina severidad y confianza; tiene poco peso para no
  contar dos veces la severidad.

**Escenario "Reducción del rezago"**
- **Días pendientes 0.40:** la política prioriza cerrar los reportes acumulados, así que la
  antigüedad pasa a ser el criterio principal.
- **Severidad 0.25:** se mantiene alta para que un bache peligroso y reciente no se quede atrás.
- **Tipo de vía 0.15:** baja para que las calles secundarias, donde suele acumularse el rezago,
  puedan competir.
- **Densidad de zona 0.15:** se mantiene igual; la eficiencia logística es la misma en los dos
  escenarios.
- **Score IA 0.05:** se reduce al mínimo porque es redundante con la severidad.

## 4. Pasos de TOPSIS

Dada la matriz de decisión $X = [x_{ij}]$ con $m$ baches (filas) y $n = 5$ criterios (columnas):

1. **Normalización vectorial**

   $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^{m} x_{kj}^2}}$$

2. **Matriz ponderada**: $v_{ij} = w_j \cdot r_{ij}$, con $\sum_j w_j = 1$.

3. **Ideales** (todos los criterios son de beneficio)

   $$A^+_j = \max_i v_{ij} \qquad A^-_j = \min_i v_{ij}$$

4. **Distancias euclidianas a los ideales**

   $$D^+_i = \sqrt{\sum_j (v_{ij} - A^+_j)^2} \qquad D^-_i = \sqrt{\sum_j (v_{ij} - A^-_j)^2}$$

5. **Coeficiente de cercanía relativa**

   $$C_i = \frac{D^-_i}{D^+_i + D^-_i} \in [0, 1]$$

   El ranking ordena $C_i$ de mayor a menor. En la interfaz se muestra como `topsis_score = C_i × 100`.

**Caso límite:** con un solo bache, $A^+ = A^- =$ ese bache, así que $D^+ = D^- = 0$ y el sistema
devuelve $C = 0$. El bache queda en la posición 1 y se recomienda si cabe en el presupuesto.

## 5. Selección por presupuesto

1. **Presupuesto $P$**, en este orden de preferencia:
   1. El monto enviado en el parámetro `presupuesto`.
   2. El disponible del mes y año actuales en la tabla `presupuestos`: la suma de los registros
      tipo `disponible` si existen; si no, `asignado − ejercido − comprometido`.
   3. Si no hay ninguno, el sistema muestra un aviso y no marca recomendaciones (`decision = null`).
2. **Costo por bache:** $c_i = \text{área}_i \times \text{costo\_m2} + \text{costo\_fijo}$ (sección 7).
3. **Regla greedy en orden de ranking:**

   ```
   acumulado = 0
   para cada bache en orden de C_i descendente:
       si acumulado + c_i ≤ P:  decision = recomendado;  acumulado += c_i
       si no:                   decision = en_espera
   ```

   Si un bache no cabe, se sigue revisando la lista: un bache posterior más barato todavía puede
   entrar. Así se aprovecha el saldo sin romper el orden de prioridad (un bache recomendado nunca
   desplaza a uno mejor rankeado que sí cabía).

4. **En `meta`:** `presupuesto`, `costo_recomendados`, `saldo_restante`, `num_recomendados` y
   `num_en_espera`.

**Explicación por bache:** cada fila trae la matriz completa (crudo, normalizado, peso, ponderado e
ideales), $D^+$, $D^-$, $C$ y una frase generada por reglas, sin IA. Un criterio "destaca" cuando su
valor ponderado alcanza al menos el 75 % del ideal positivo; se mencionan como máximo los dos más altos.

## 6. Datos insuficientes

Los reportes que el ETL marcó con `datos_suficientes = false` (sin análisis IA, o con confianza
menor a 0.5) **no entran a la matriz TOPSIS**. Incluirlos con un valor por defecto en severidad
cambiaría las normas de la columna y los ideales, y eso movería el score de todos los demás baches.
Se devuelven aparte en `sin_sustento`, con el motivo tomado de `dss_etl_anomalias`, para revisarlos o
pedir un nuevo análisis.

Si no existe ninguna ejecución ETL completada, el ranking usa los reportes sin depurar y `meta`
incluye `fuente: "reportes_sin_etl"` con un aviso.

## 7. Supuestos de costos

Los valores están guardados en la tabla `dss_parametros`. **Son supuestos de referencia, no cifras
oficiales**, y deben ajustarse con precios reales del municipio.

| Parámetro | Valor | Unidad | Uso |
|---|---:|---|---|
| `costo_m2` | 450 | MXN/m² | Mezcla asfáltica, mano de obra y compactación |
| `costo_fijo_movilizacion` | 1,200 | MXN | Cuadrilla, equipo y señalización por bache |
| `area_default_m2` | 0.5 | m² | Se usa cuando la IA no estimó el área |

## 8. Ejemplo de cálculo manual

Tres baches de prueba. Los valores se calcularon a mano, en un cálculo independiente del sistema.
El test `TopsisRecomendacionTest::test_ejemplo_de_calculo_manual_coincide_con_el_sistema` verifica
que el sistema obtiene los mismos $D^+$, $D^-$ y $C$ con 4 decimales.

### 8.1 Matriz de decisión $X$

| Bache | severidad | tipo_via | dias_pendiente | densidad_zona | score_ia | Área IA (m²) |
|---|---:|---:|---:|---:|---:|---:|
| B1 | 1.0 (alta) | 0.9 (avenida) | 10 | 3 | 80 | 1.0 |
| B2 | 0.6 (media) | 0.5 (calle) | 40 | 1 | 60 | — |
| B3 | 0.2 (baja) | 1.0 (carretera) | 25 | 2 | 40 | 0.2 |

### 8.2 Normalización vectorial

Normas: $\sqrt{\sum x^2}$ por columna.

| | severidad | tipo_via | dias_pendiente | densidad_zona | score_ia |
|---|---:|---:|---:|---:|---:|
| $\sqrt{\sum x^2}$ | √1.40 = 1.1832 | √2.06 = 1.4353 | √2325 = 48.2183 | √14 = 3.7417 | √11600 = 107.7033 |

Matriz normalizada $R$:

| Bache | severidad | tipo_via | dias_pendiente | densidad_zona | score_ia |
|---|---:|---:|---:|---:|---:|
| B1 | 0.8452 | 0.6271 | 0.2074 | 0.8018 | 0.7428 |
| B2 | 0.5071 | 0.3484 | 0.8296 | 0.2673 | 0.5571 |
| B3 | 0.1690 | 0.6967 | 0.5185 | 0.5345 | 0.3714 |

### 8.3 Escenario equilibrado ($w$ = 0.30, 0.25, 0.20, 0.15, 0.10)

Matriz ponderada $V$ e ideales:

| | severidad | tipo_via | dias_pendiente | densidad_zona | score_ia |
|---|---:|---:|---:|---:|---:|
| B1 | 0.2535 | 0.1568 | 0.0415 | 0.1203 | 0.0743 |
| B2 | 0.1521 | 0.0871 | 0.1659 | 0.0401 | 0.0557 |
| B3 | 0.0507 | 0.1742 | 0.1037 | 0.0802 | 0.0371 |
| **$A^+$** | 0.2535 | 0.1742 | 0.1659 | 0.1203 | 0.0743 |
| **$A^-$** | 0.0507 | 0.0871 | 0.0415 | 0.0401 | 0.0371 |

Distancias y cercanía:

| Bache | $D^+$ | $D^-$ | $C = D^- / (D^+ + D^-)$ | Posición |
|---|---:|---:|---:|---:|
| B1 | 0.1256 | 0.2320 | **0.6486** | 1 |
| B2 | 0.1570 | 0.1616 | **0.5072** | 2 |
| B3 | 0.2191 | 0.1143 | **0.3428** | 3 |

Ejemplo del cálculo de $D^+$ para B1:
$\sqrt{(0.2535-0.2535)^2 + (0.1568-0.1742)^2 + (0.0415-0.1659)^2 + (0.1203-0.1203)^2 + (0.0743-0.0743)^2}
= \sqrt{0.000303 + 0.015475} = 0.1256$

### 8.4 Escenario rezago ($w$ = 0.25, 0.15, 0.40, 0.15, 0.05)

| | severidad | tipo_via | dias_pendiente | densidad_zona | score_ia |
|---|---:|---:|---:|---:|---:|
| B1 | 0.2113 | 0.0941 | 0.0830 | 0.1203 | 0.0371 |
| B2 | 0.1268 | 0.0523 | 0.3318 | 0.0401 | 0.0279 |
| B3 | 0.0423 | 0.1045 | 0.2074 | 0.0802 | 0.0186 |
| **$A^+$** | 0.2113 | 0.1045 | 0.3318 | 0.1203 | 0.0371 |
| **$A^-$** | 0.0423 | 0.0523 | 0.0830 | 0.0401 | 0.0186 |

| Bache | $D^+$ | $D^-$ | $C$ | Posición |
|---|---:|---:|---:|---:|
| B2 | 0.1280 | 0.2630 | **0.6726** | 1 |
| B1 | 0.2491 | 0.1926 | **0.4360** | 2 |
| B3 | 0.2145 | 0.1408 | **0.3963** | 3 |

Al subir el peso de los días pendientes de 0.20 a 0.40, B2 (40 días) supera a B1 (10 días): ese es el
efecto que se busca con el escenario de rezago.

### 8.5 Costo y selección con $P$ = $3,000 (escenario equilibrado)

| Posición | Bache | Área | Costo = área × 450 + 1,200 | ¿Cabe en el saldo? | Decisión | Saldo |
|---:|---|---|---:|---|---|---:|
| 1 | B1 | 1.0 m² | $1,650 | 1,650 ≤ 3,000 sí | **recomendado** | $1,350 |
| 2 | B2 | 0.5 m² (supuesta) | $1,425 | 1,425 ≤ 1,350 no | en espera | $1,350 |
| 3 | B3 | 0.2 m² | $1,290 | 1,290 ≤ 1,350 sí | **recomendado** | $60 |

Resultado: 2 recomendados, $2,940 comprometidos y $60 de saldo. B3 entra aunque B2 está mejor
rankeado, porque B2 ya no cabe en el saldo (regla greedy en orden de ranking).

Frase que genera el sistema para B3:
*"Recomendado: posición 3 de 3, destaca en tipo de vía; costo $1,290, entra con saldo de $60."*
