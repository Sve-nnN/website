---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 03
subsystem: verificacion
status: complete
tags: [a11y, axe, lighthouse, rendimiento, bundle, gate]
requires:
  - 57-01 (preview desplegado con el código final)
provides:
  - scripts/verify/57-a11y-sweep.mjs (axe 4.12.1 inyectado y recorrido de teclado por plantilla, ES y EN, 375 y 1280 px, --selftest)
  - scripts/verify/57-perf-compare.mjs (Lighthouse móvil 5x intercalado, mediana, regla con PERF_TOLERANCE, proxy de INP, --selftest)
  - scripts/verify/57-bundle-weight.mjs (CSS y JS por plantilla, sin comprimir y gzip, --compare, --selftest)
  - 57-A11Y-MANUAL.md (lista de revisión humana para el checkpoint de 57-09)
  - evidence/57-perf-baseline.json y evidence/57-bundle-before.json
affects: [57-05, 57-06, 57-07, 57-09]
tech-stack:
  added: []
  patterns:
    - "axe-core inyectado con createRequire y page.addScriptTag, sin @axe-core/playwright"
    - "Nombre accesible por CDP (Accessibility.getPartialAXTree), no por heurística de DOM"
    - "Elemento LCP leído de lcp-breakdown-insight (Lighthouse 13), con el audit viejo de respaldo"
key-files:
  created:
    - scripts/verify/57-a11y-sweep.mjs
    - scripts/verify/57-perf-compare.mjs
    - scripts/verify/57-bundle-weight.mjs
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/57-A11Y-MANUAL.md
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-perf-baseline.json
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-bundle-before.json
  modified: []
decisions:
  - "El anillo de foco cuenta solo con outline de 2 px o más, box-shadow, o el fieldset de OutlinedInput con borde de 2 px (A11Y.md sección 4)"
  - "La regla de no empeorar se aplica literal (multiplicativa, sin piso absoluto); TBT de 14 a 21 ms falla por eso y queda para la decisión de tolerancia de 57-05"
  - "El tamaño gzip sale del servidor cuando comprime y, si no, de gzip local nivel 6, marcado como local"
metrics:
  duration: 23min
  completed: 2026-11-17
actuals:
  tokens: 52000
  tasks: 3
  commits: 3
plan_head_before: b31a6bc9be2faa553b2f3968be453dca7bf0ee9f
plan_head_after: 67cc1463a9910b76dcac0e3ccc9e9931f0b81616
---

# Phase 57 Plan 03: barrido de accesibilidad, comparación de rendimiento y peso de bundle Summary

Tres scripts de gate con autoprueba (axe y teclado por plantilla, Lighthouse móvil 5x intercalado contra producción y peso de CSS y JS por plantilla), la lista manual de Juan derivada de A11Y.md 2.5.0 y las dos líneas base medidas contra el preview.

## Tareas

| Tarea | Nombre | Commit | Archivos |
|---|---|---|---|
| 1 | 57-a11y-sweep.mjs con axe y teclado | d7b50d5 | scripts/verify/57-a11y-sweep.mjs |
| 2 | 57-perf-compare.mjs y 57-bundle-weight.mjs | 8668be3 | scripts/verify/57-perf-compare.mjs, scripts/verify/57-bundle-weight.mjs |
| 3 | Lista manual y líneas base | 67cc146 | 57-A11Y-MANUAL.md, evidence/57-perf-baseline.json, evidence/57-bundle-before.json |

## Resultados

- Selftests: a11y 6 de 6 PASS (botón sin nombre da `button-name`, trampa y salto ausente fallan, página limpia pasa en 375 y 1280), perf 21 de 21 PASS, bundle 9 de 9 PASS. `package.json` y `package-lock.json` sin cambios. El grep de aceptación (sin la categoría de búsqueda) pasa.
- Línea base de rendimiento (Lighthouse 13.4.1, 5 corridas por entorno):

| URL | LCP preview / prod | TTFB | TBT | CLS | a11y | Veredicto |
|---|---|---|---|---|---|---|
| / | 3839 / 5910 ms | 447 / 249 FAIL | 21 / 14 FAIL | 0 / 0 | 1 / 1 | FAIL |
| /en | 3359 / 5169 ms | 512 / 401 FAIL | 33 / 24 FAIL | 0 / 0 | 1 / 1 | FAIL |
| /servicios/ai-seo-geo | 3712 / 4249 ms | 418 / 242 FAIL | 24 / 18 FAIL | 0 / 0 | 1 / 1 | FAIL |
| /blog/seo/estrategia-seo | 3712 / 5324 ms | 1564 / 1915 | 29 / 23 FAIL | 0 / 0,013 | 1 / 1 | FAIL |

  El LCP mejora en las cuatro URLs y la accesibilidad de Lighthouse da 1 en todas. Fallan el TTFB (preview entre 1,3 y 1,8 veces producción fuera del post) y el TBT, este último por diferencias de 6 a 9 ms. El HTML transferido sube de 31 a 52 KB en la home y el JS de 185 a 272 a 309 KB.
- Elemento LCP para 57-06 (F3): en la home del preview es un `div.MuiBox-root` sin carga de recurso (380x380 px) y en el servicio es un párrafo. Ninguno es imagen, así que F3 no aplica en esas plantillas. Producción sí tenía una imagen como LCP.
- Proxy de INP (no es INP de campo, CPU x4 a 375 px): preview entre 128 y 168 ms contra 56 a 72 ms en producción.
- Línea base de bundle (CAL-03, antes del retiro de Tailwind): 1 CSS de 53,5 KB (10,1 KB gzip) y 47 JS únicos con 1245,6 KB (406,3 KB gzip). El preview no comprime el CSS en el servidor, así que el gzip es local.

## Hallazgos para planes siguientes

1. **Foco de MUI sin anillo (A11Y.md sección 4, ALTA probable).** En la home a 1280 px, 33 de 77 paradas de Tab por idioma (botones, enlaces con forma de botón, chips y acordeones) no tienen outline ni box-shadow: ButtonBase de MUI fija `outline: 0` y anula el `:focus-visible` global de `src/theme/theme.ts`. Solo queda el ripple o un cambio de fondo. El barrido lo marca como FAIL. Corrección probable en el tema (`MuiButtonBase` con `&.Mui-focusVisible { outline }`), a decidir en 57-06 o 57-07. Juan lo confirma a ojo con el punto 1 de 57-A11Y-MANUAL.md.
2. **TTFB del preview más alto que producción** en home, EN y servicio. Coincide con F1 de la investigación.
3. **Regla de TBT:** con producción en 14 ms, el 10% deja 1,4 ms de margen, menos que el ruido. 57-05 debería decidir si agrega un piso absoluto (por ejemplo 50 ms) además de la tolerancia.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Lighthouse 13 ya no trae el audit largest-contentful-paint-element**
- **Found during:** Tarea 2, corrida de prueba
- **Issue:** el plan pedía leer `largest-contentful-paint-element`, pero en 13.4.1 el nodo vive en `lcp-breakdown-insight`; el elemento LCP salía vacío.
- **Fix:** se lee el insight y se deja el audit viejo de respaldo; además se registran las subpartes para saber si hubo carga de recurso (imagen).
- **Files modified:** scripts/verify/57-perf-compare.mjs
- **Commit:** 8668be3

**2. [Rule 1 - Bug] Falso negativo de foco en campos de MUI**
- **Found during:** Tarea 1, prueba contra la home
- **Issue:** OutlinedInput dibuja el anillo en el fieldset hermano, no en el input ni en el contenedor.
- **Fix:** si un ancestro lleva `Mui-focused`, cuenta el borde de 2 px de `.MuiOutlinedInput-notchedOutline`.
- **Commit:** d7b50d5

### Desvíos de proceso

- El worktree arrancó en master (6e9b02a); lo alineé con `feat/mui-redesign` (b31a6bc) antes de empezar, con el árbol limpio.
- La medición de bundle corrió en paralelo con la primera URL de Lighthouse durante unos 30 segundos. El efecto es menor, pero si 57-05 duda de la cifra de la home, se repite.
- No hubo `next build` local: ningún script lo necesita.

## Threat Flags

Ninguno nuevo. Los tres scripts hacen solo GET a páginas públicas; los JSON guardan métricas, rutas y selectores, sin cookies ni cabeceras de sesión (T-57-11).

## Self-Check: PASSED

- FOUND: scripts/verify/57-a11y-sweep.mjs, scripts/verify/57-perf-compare.mjs, scripts/verify/57-bundle-weight.mjs, 57-A11Y-MANUAL.md, evidence/57-perf-baseline.json, evidence/57-bundle-before.json
- FOUND: d7b50d5, 8668be3, 67cc146 en HEAD
