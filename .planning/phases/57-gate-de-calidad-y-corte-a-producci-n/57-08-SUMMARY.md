---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 08
subsystem: verificacion
status: complete
tags: [gate, reporte, rollback, monitoreo, bateria]
requires: [57-05, 57-06, 57-07]
provides:
  - scripts/verify/57-run-all.mjs (orquestador --selftests, --live, --strict, --vs-snapshot)
  - scripts/verify/57-gate-report.mjs (agregador del reporte con --selftest)
  - 57-GATE-REPORTE.md (reporte del gate contra el preview final)
  - 57-ROLLBACK.md (rollback ensayado)
  - 57-MONITOREO.md (28 días, revisiones en 0, 1, 3, 7, 14 y 28)
  - evidence/57-final-*.json (medición final del preview y clasificación de cada FAIL)
affects: [57-09, 57-10, 57-11, 57-12]
tech-stack:
  added: []
  patterns:
    - "Orquestador que sigue tras un FAIL y escribe un registro de pasos que el agregador lee"
    - "Clasificación del operador en un JSON de evidencia: cada FAIL con causa y dueño, sin esconderlo"
key-files:
  created:
    - scripts/verify/57-run-all.mjs
    - scripts/verify/57-gate-report.mjs
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/57-GATE-REPORTE.md
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/57-ROLLBACK.md
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/57-MONITOREO.md
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-final-clasificacion.json
  modified: []
decisions:
  - "El rollback por imagen de Dokploy existe en el código fuente (router rollbacks) pero rollbackActive es false en web y en el preview: la vía de regreso es git revert -m 1 más redespliegue"
  - "El corte exige merge commit, nunca squash ni rebase, para que git revert -m 1 exista"
  - "Un FAIL que no se pudo reproducir (53-computed-styles) se clasifica como intermitente y no se toca el script sin una causa visible"
metrics:
  completed: 2026-11-24
actuals:
  tokens: 20300
  tasks: 3
  commits: 3
plan_head_before: 7cc314825c79f7774d4683c0baf20670caf45fdb
plan_head_after: e7bf7a0febd49b8a9955119f0b572939d57c3629
requirements-completed: [GO-01, CAL-02]
---

# Phase 57 Plan 08: batería de la fase, reporte del gate, rollback ensayado y monitoreo Summary

La batería de la fase 57 corre completa con un solo comando y el reporte del gate contra el preview final dice que el corte todavía no está listo: `/blog/confirm` responde 500 en el preview por un defecto de 57-07, falta el alt EN de la foto de Sobre mí y la fecha legal sigue pendiente. El rollback quedó ensayado con diff vacío y el monitoreo tiene ventana y umbrales.

## Tareas

| Tarea | Commit | Resultado |
|---|---|---|
| 1. `57-run-all.mjs` y `57-gate-report.mjs` con autopruebas | 90f8b6f | `--selftest` de ambos, `--selftests --strict` (14 pasos, 159 PASS en la regresión 56) y la comprobación de que el orquestador no toca ninguna base, en 0 |
| 2. Batería viva contra el preview final y reporte | 571c03e | 8 pasos, 5 PASS y 3 FAIL, todos clasificados. Reporte con 5 bloqueos y 2 diferencias por aceptar |
| 3. Rollback ensayado y plan de monitoreo | e7bf7a0 | `git revert -m 1` devuelve el árbol exactamente al de master. Worktree y rama temporales eliminados |

## Resultados de la batería viva (BASE_URL preview, PROD_BASE producción, `--strict`)

El preview servía `c9aa03c` (despliegue `done`, contenedor sano). Umbrales de Juan: 10% de rendimiento con piso de 50 ms, 2% de palabras, 500 KB para el autor.

| Paso | Resultado |
|---|---|
| 53-crawl-parity | PASS |
| 57-seo-parity-all | FAIL: 170 de 174 URLs sin diferencias; 0 enlaces internos con fallo; 0 redirects distintos de 38 |
| 57-legacy-render-sweep | PASS: 174 URLs sin clases utilitarias |
| 57-headers-check | PASS: 8 de 8 |
| 57-a11y-sweep | PASS: 21 plantillas, ES y EN, 375 y 1280 px, 0 violaciones y 0 problemas de teclado |
| 57-perf-compare | PASS: las cuatro URLs. LCP del preview entre 2585 y 2661 ms contra 3497 a 4107 en producción |
| 57-bundle-weight | PASS: CSS 53,5 a 8,8 KB, JS 1245,6 a 1209,5 KB |
| 56-run-all --live | FAIL: 52 PASS y 2 pasos internos en FAIL (54-about y 53-computed-styles) |

F1 a F5 y F13 salen todos en estado Corregido o No aplica (F3): el despliegue de b522695 que 57-06 no pudo hacer ya está en el preview.

## FAIL clasificados

| FAIL | Clasificación | Causa y dueño |
|---|---|---|
| `/blog/confirm` y `/en/blog/confirm` responden 500 | Defecto de código | Plan 57-07. La página usa `Box component={CheckCircle}` dentro de un Server Component: pasa una referencia de componente a un Client Component de MUI. Es el único uso de `component` con un icono en `src`. Causa probable; no se reprodujo en local porque la página exige base de datos. En 57-06 la URL daba 200 |
| `/blog/general` y `/en/blog/general`, palabras 11% y 10% menos | Diferencia legítima | Categoría vacía: el rediseño quita el contador y una fila repetida. Juan la acepta por escrito en 57-09 |
| 54-about: `/en/sobre-mi` sin `img` con alt no vacío | Defecto de contenido | Ya estaba en la línea base de 57-01. `ALT-about-hero` está aprobada, pero el cargador del corte solo escribe 6 capturas. Exige escribir el alt EN en Media; decide Juan |
| 53-computed-styles, 6 PASS y 2 FAIL dentro de 56-run-all | Falso positivo intermitente, sin reproducir | Cuatro corridas aisladas dieron 7 PASS y OK. 56-run-all no conserva el cheque interno. No se cambió el script sin una causa visible; se vuelve a medir tras corregir 57-07 |
| Gate de decisiones: `CUT-legal-date-efectiva` | Decisión de Juan | Se fija el día del corte |

## Rollback

`git revert -m 1` ensayado el 2026-11-24 en un worktree temporal en el scratchpad, sin push ni base de datos: merge sin conflictos (commit con dos padres, 582 archivos distintos de master), revert sin conflictos y `git diff master` vacío. Cada paso de git tardó 1 s o menos. El worktree y la rama temporal se eliminaron.

A8 confirmado en el código fuente de Dokploy: el router `rollbacks` existe, pero `rollbackActive` es `false` en `web` y en el preview (lectura de solo lectura), así que no hay imágenes anteriores y la vía documentada es el revert del merge más redespliegue. 57-ROLLBACK.md exige merge commit y cubre disparadores, orden del código, tres caminos para los datos, el volcado verificado como requisito previo del `--apply` y cómo verificar el regreso.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Funcionalidad crítica] El agregador no podía dejar cada FAIL clasificado**
- **Found during:** Tarea 2
- **Issue:** el reporte solo mostraba la clase que traía cada script, y 56-run-all agrupa sus fallos internos en una línea. Sin causa ni dueño un FAIL quedaba a medias (T-57-29).
- **Fix:** `57-gate-report.mjs` acepta `evidence/57-final-clasificacion.json`, desglosa los pasos anidados de 56-run-all y cubre ambos con autopruebas 5d y 5e.
- **Commit:** 571c03e

**2. [Desvío de proceso] No se corrigieron los defectos de código**
- La Tarea 2 prohíbe arreglar aquí lo que es de código y manda de vuelta al plan dueño. `/blog/confirm` queda como bloqueo para 57-07; no se tocó ningún archivo de `src`.

### Hallazgos sobre la batería

- El barrido de clases utilitarias no incluye `/blog/confirm` (no está en el sitemap ni en `OFF_SITEMAP`), así que el 174 de 174 del plan 57-07 no cubría esa URL. Tampoco entra en el barrido de accesibilidad. Solo la paridad SEO la ve, porque la toma de las rutas extra.
- Durante la primera corrida de `--selftests` la máquina se detuvo unos 15 minutos y el selftest de a11y marcó 934 s y 54-service-slots falló por tiempo. En aislado tardan 8 s y 5 s. La repetición completa dio 14 de 14 en PASS.
- El proxy de INP del preview sigue más alto que producción (128 a 160 ms contra 56 a 64 ms). No entra en la regla, pero 57-09 debe verlo.

## Pendiente

1. Plan 57-07: corregir `/blog/confirm`, redesplegar el preview y repetir `57-run-all --live --strict`.
2. Juan: cargar el alt EN de la foto de Sobre mí, aceptar por escrito las dos diferencias de `/blog/general` y fijar la fecha legal el día del corte.
3. 57-09: revisión manual de accesibilidad (lista en el reporte) y decisión sobre el proxy de INP.
4. 57-11: guardar el snapshot `evidence/57-prod-snapshot-pre.json` antes del merge; el monitoreo y el rollback lo usan.

## Known Stubs

Ninguno.

## Threat Flags

Ninguna. Todo es lectura por HTTP; el reporte pasa cada cadena por `limpia()` y la evidencia guardada se escaneó sin cabeceras de sesión ni tokens (T-57-28). El worktree del ensayo no empujó nada (T-57-30).

## Self-Check: PASSED

- FOUND: 90f8b6f, 571c03e y e7bf7a0 en HEAD
- FOUND: scripts/verify/57-run-all.mjs, scripts/verify/57-gate-report.mjs, 57-GATE-REPORTE.md, 57-ROLLBACK.md y 57-MONITOREO.md
- `git worktree list` no muestra ningún worktree del ensayo
