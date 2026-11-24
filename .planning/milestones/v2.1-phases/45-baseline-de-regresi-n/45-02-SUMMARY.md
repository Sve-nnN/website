---
phase: 45-baseline-de-regresi-n
plan: 02
subsystem: seo
tags: [regression-baseline, lighthouse, cwv, performance, measurement-only]

requires:
  - phase: 45-baseline-de-regresi-n
    provides: 45-01 (14 rutas curl-verificadas, esqueleto del baseline)
provides:
  - lh-phase45-run1/2/3.json mas run4/5-escalated.json (corridas crudas de Lighthouse mobile)
  - lh-phase45-baseline.json (mediana diffeable, shape identico a lh-phase32-baseline.json)
  - Seccion Lighthouse Mobile completa en 45-REGRESSION-BASELINE.md
affects: [45-03-search-console-trafico, phase-50-gate-cierre]

actuals:
  tokens: 9000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Regla de escalado: si el spread de performance entre 3 corridas supera 15 puntos, 2 lecturas extra y mediana de 5 en vez de 3 -- necesaria en 10/14 rutas de esta fase, confirma la magnitud de varianza que 45-RESEARCH.md ya habia observado"

key-files:
  created:
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-run1.json
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-run2.json
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-run3.json
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-run4-escalated.json
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-run5-escalated.json
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-baseline.json
  modified:
    - .planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md

key-decisions:
  - "10 de las 14 rutas superaron el umbral de 15 puntos de spread de performance entre las 3 corridas base, y se escalaron a 5 lecturas cada una (regla ya fijada en el plan, no una decision nueva). El detalle de las 5 lecturas por ruta escalada queda mas abajo en este SUMMARY."
  - "Un fallo transitorio de Lighthouse en run2 (/servicios/fullstack-development: 'Audit largest-contentful-paint did not return a numeric value') se resolvio reintentando esa unica ruta y fusionando el resultado en el mismo archivo run2.json, en vez de descartar toda la corrida -- Rule 1, bug de terceros (Lighthouse/Chrome), no del sitio."

patterns-established:
  - "Corridas de escalado se nombran lh-phase45-run{4,5}-escalated.json y solo contienen las rutas que superaron el umbral, no las 14 -- evita confundirlas con una corrida completa adicional"

requirements-completed: []

coverage:
  - id: D1
    description: "lh-phase45-run1/2/3.json cubren las 14 rutas con 7 metricas numericas cada una, cero {error} tras el reintento de la ruta que fallo transitoriamente en run2"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "node -e assertion de las 3 corridas (14 rutas, sin error, metricas numericas) -- Task 1 <verify> del plan, salida RUNS_OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "lh-phase45-baseline.json es la mediana por ruta y metrica (3 o 5 lecturas segun corresponda), con shape identico a lh-phase32-baseline.json"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "node -e shape-check contra lh-phase32-baseline.json -- Task 2 <verify> del plan"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tabla Lighthouse Mobile del baseline completa (14 filas, CWV en formato numero+banda), con nota de CrUX ausente y de no-comparable-con-PSI"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "grep -qi por 'PageSpeed Insights', CrUX/datos de campo, y los nombres de los JSON crudos -- Task 2 <verify> del plan"
        status: pass
    human_judgment: false
  - id: D4
    description: "La mediana de / (71 de performance) queda notablemente por debajo de la referencia de 94 en PSI del 2026-08-25 -- atribuido a contencion de CPU local, no a regresion del sitio (TTFB estable en la fase de research)"
    verification: []
    human_judgment: true
    rationale: "Es una lectura de plausibilidad del numero, no algo que un test automatizado pueda decidir: Juan debe confirmar si el numero le hace sentido dado lo que sabe del estado real del sitio (human-check de la Task 3 de 45-03 ya cubre esto explicitamente)."

duration: 90min
completed: 2026-09-03
status: complete
---

# Phase 45 Plan 02: Lighthouse Mobile de las 14 Rutas Summary

**Mediana de Lighthouse mobile (3 o 5 corridas segun ruta) de las 14 rutas criticas contra produccion live, con shape diffeable identico a lh-phase32-baseline.json, listo para el gate de la Phase 50.**

## Performance

- **Duration:** ~90 min (mayormente tiempo de reloj de Lighthouse: 14 rutas x 3 corridas + 10 rutas x 2 corridas de escalado = 62 invocaciones de Chrome-for-Testing)
- **Tasks:** 2
- **Files modified:** 6 (5 JSON de corridas + el documento del baseline)

## Accomplishments

- 3 corridas completas de Lighthouse mobile sobre las 14 rutas contra `https://juan-tech.com`, con un fallo transitorio de Lighthouse en una ruta de run2 detectado y reparado por reintento (no era un problema del sitio).
- Confirmada en la practica la advertencia central de 45-RESEARCH.md: **10 de las 14 rutas** tuvieron un spread de performance mayor a 15 puntos entre las 3 corridas base, disparando la regla de escalado a 5 lecturas.
- `lh-phase45-baseline.json` calculado con la mediana correcta por ruta (3 o 5 segun corresponda), shape identico a `lh-phase32-baseline.json` verificado byte a byte.
- Tabla `## Lighthouse Mobile` del baseline completa con las 14 filas, formato `numero (banda)` para los CWV, y las notas de interpretacion (CrUX ausente, laboratorio vs PageSpeed Insights) que la Phase 50 necesita para no malinterpretar ausencias o varianza como regresion.

## Task Commits

1. **Task 1: 3 corridas de Lighthouse + 2 de escalado** - `6ead724` (feat)
2. **Task 2: Mediana + tabla completa del baseline** - `cf38b95` (feat)

**Plan metadata:** (commit de cierre de plan mas abajo)

## Files Created/Modified

- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-run1.json` - corrida cruda 1, 14 rutas
- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-run2.json` - corrida cruda 2, 14 rutas (1 ruta reintentada y fusionada)
- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-run3.json` - corrida cruda 3, 14 rutas
- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-run4-escalated.json` - corrida de escalado 4, solo las 10 rutas con spread > 15
- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-run5-escalated.json` - corrida de escalado 5, solo las 10 rutas con spread > 15
- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-baseline.json` - mediana final por ruta y metrica
- `.planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md` - seccion Lighthouse Mobile completa

## Decisions Made

- Ver `key-decisions` en el frontmatter: regla de escalado aplicada segun lo previsto por el plan (no es una decision nueva de esta ejecucion, es la regla que RESEARCH y el plan ya habian fijado); el fallo transitorio de Lighthouse se trato como Rule 1 (bug externo, reintento, sin impacto en el resultado).

## Rutas escaladas a 5 lecturas (detalle completo)

Spread de performance (max - min) entre las 3 corridas base, y las 5 lecturas finales usadas para la mediana:

| Route | Spread (3 corridas) | Lecturas de performance (run1..run5) | Mediana final |
|---|---|---|---|
| /en | 21 | 72, 51, 67, 79, 75 | 72 |
| /servicios/seo-technical-audit | 26 | 86, 60, 81, 79, 60 | 79 |
| /servicios/seo-consulting | 28 | 88, 60, 79, 66, 72 | 72 |
| /servicios/fullstack-development | 23 | 67, 90, 76, 78, 69 | 76 |
| /servicios/ai-seo-geo | 35 | 42, 63, 77, 88, 87 | 77 |
| /en/services/seo-technical-audit | 18 | 81, 87, 69, 67, 91 | 81 |
| /en/services/seo-consulting | 28 | 64, 53, 81, 78, 61 | 64 |
| /en/services/fullstack-development | 25 | 65, 87, 90, 72, 88 | 87 |
| /seo-tecnico-lima | 22 | 65, 87, 76, 65, 72 | 72 |
| /en/seo-tecnico-madrid | 24 | 91, 67, 75, 82, 79 | 79 |

Las 4 rutas restantes (`/`, `/en/services/ai-seo-geo`, `/seo-tecnico-madrid`, `/en/seo-tecnico-lima`) tuvieron spread <= 15 y usan la mediana de 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug externo] Fallo transitorio de Lighthouse en run2**
- **Found during:** Task 1
- **Issue:** `/servicios/fullstack-development` en run2 fallo con `Audit "largest-contentful-paint" did not return a numeric value (scoreDisplayMode: error)` -- un error conocido de Lighthouse/Chrome bajo ciertas condiciones de carga, no relacionado con el sitio.
- **Fix:** Se reinvoco `lighthouse-mobile.mjs` solo para esa ruta contra el mismo target, y el resultado limpio se fusiono en `lh-phase45-run2.json` en la clave correspondiente, dejando las otras 13 rutas de run2 intactas.
- **Files modified:** `.planning/phases/45-baseline-de-regresi-n/lh-phase45-run2.json`
- **Verification:** `node -e` de la Task 1 confirmo cero `{error}` y metricas numericas en las 14 rutas de las 3 corridas.
- **Committed in:** `6ead724` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1, bug de terceros)
**Impact on plan:** Ninguno sobre el resultado final -- la ruta reintentada produjo un valor de performance (90) dentro del rango esperado para esa ruta, y quedo sujeta a la misma regla de escalado que las demas.

## Issues Encountered

- La varianza de performance observada confirma en la practica lo que 45-RESEARCH.md predijo por adelantado: 10 de 14 rutas necesitaron 5 lecturas en vez de 3. Esto no es un problema de esta ejecucion, es la razon por la que el plan definio la regla de escalado desde el diseño.
- La mediana de `/` (71 de performance, LCP 5461ms) queda mas lejos de la referencia de 94 en PSI del 2026-08-25 de lo que la pasada tracer de 45-01 sugeria (61 de performance). Documentado en el baseline como varianza de contencion de CPU local, con el TTFB estable de la fase de research como evidencia de que el servidor no es la variable que se mueve. No bloquea el cierre de esta fase, pero merece la revision humana de Juan que ya esta prevista en 45-03 Task 3 (human-check de fin de fase).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 45-03 puede arrancar de inmediato: la seccion Lighthouse del baseline esta cerrada, y las secciones Search Console / Trafico real y V ya tienen su esqueleto de 45-01.
- git diff --stat src/ vacio de principio a fin, confirmado antes de cada commit.

## Self-Check: PASSED

- FOUND: lh-phase45-run1.json
- FOUND: lh-phase45-run2.json
- FOUND: lh-phase45-run3.json
- FOUND: lh-phase45-run4-escalated.json
- FOUND: lh-phase45-run5-escalated.json
- FOUND: lh-phase45-baseline.json
- FOUND commit: 6ead724
- FOUND commit: cf38b95

---
*Phase: 45-baseline-de-regresi-n*
*Completed: 2026-09-03*
