---
phase: 52
plan: 07
subsystem: designs/redesign-v3
tags: [home-v4, gate, lighthouse, medicion, reporte, capturas, readme]
status: complete
requires:
  - 52-06 (runner de etapas verify:home:checks)
  - 52-01 (palancas L1 a L4 y compuertas D-11)
  - 51.1-02 (cifras base de /system)
provides:
  - "Medicion final de la home (label final) con las seis compuertas D-11 en PASS sobre el build 1a7c933d8fd7"
  - "Artefactos de 51.1 regenerados sobre el mismo build (stage report r2 verde)"
  - "REPORT.md determinista para el gate (9 secciones, cifras leidas de los JSON)"
  - "README de la app ampliado para el gate (direcciones, comandos y Que abrir)"
  - "Cuatro capturas finales (final-es/en-desktop/mobile.jpg) por debajo de 400 KB"
  - "home-checks.json del build final: 130 PASS, 3 FAIL (los 3 FAIL de isolation son preexistentes)"
affects: [gate-de-revision, 53, 54, 55, verify-work]
tech-stack:
  patterns:
    - "Reporte generado por script (home-report.mjs): ninguna cifra escrita a mano, solo lectura de los JSON medidos"
    - "Capturas finales producidas por el runner con --final-shots, sin editar imagenes a mano"
key-files:
  created:
    - designs/redesign-v3/app/scripts/home-report.mjs
    - designs/redesign-v3/reports/home/REPORT.md
    - designs/redesign-v3/reports/home/final-es-desktop.jpg
    - designs/redesign-v3/reports/home/final-es-mobile.jpg
    - designs/redesign-v3/reports/home/final-en-desktop.jpg
    - designs/redesign-v3/reports/home/final-en-mobile.jpg
  modified:
    - designs/redesign-v3/app/README.md
    - designs/redesign-v3/app/scripts/verify-app.mjs
    - designs/redesign-v3/app/scripts/verify-home-checks.mjs
    - designs/redesign-v3/reports/home/home-checks.json
    - designs/redesign-v3/reports/home/budget.json
    - designs/redesign-v3/reports/home/pending-inventory.json
  regenerated:
    - designs/redesign-v3/app/public/measurements/lighthouse-summary.json
    - designs/redesign-v3/app/public/measurements/original-vs-vanilla.json
    - designs/redesign-v3/reports/home-v4/lighthouse-summary.json
decisions:
  - "La medicion final se corre sobre un resumen limpio (resumen previo movido a /tmp) para evitar PASS sobre datos viejos fusionados por buildSha256"
  - "Ninguna palanca L1 a L4 se aplico: las seis compuertas salen PASS en la primera corrida limpia"
  - "El TBT y el LCP de desktop quedan como informativos (SwiftShader); se confirman en la GPU real de Juan (D-11)"
  - "El runner --final-shots se implemento (no existia) para que produzca las cuatro capturas finales que exige el plan"
  - "El chequeo d2 del tracer se corrigio para localizar tokens.css en el modulo que la importa tras el pivote v4"
metrics:
  duration: "~1 h 45 min"
  tasks: 2
  files: 19
  commits: 2
  completed: 2026-10-22
actuals:
  tokens: 61000
  tasks: 2
  commits: 2
---

# Phase 52 Plan 07: Medicion final de la home, reporte para el gate y capturas finales

## One-liner

Medicion final de la home v4 sobre el build `1a7c933d8fd7` con las seis compuertas D-11 en PASS, artefactos de 51.1 regenerados sobre el mismo build, REPORT.md determinista y capturas finales listas para el gate D-14.

## Estado

Las tareas 1 y 2 estan completas y commiteadas. La tarea 3 es el gate humano (D-14): **no se ejecuta y queda pendiente de la respuesta textual de Juan** (ver "Decision de Juan en el gate").

## Commits

| Hash | Mensaje | Alcance |
|------|---------|---------|
| `e228a69` | `test(52-07): medicion final de la home y regeneracion de las mediciones de 51.1` | Preflight de Chromium, medicion final de la home, regeneracion de 51.1 |
| `caf417f` | `docs(52-07): reporte de la home para el gate, README y capturas finales` | `home-report.mjs`, `REPORT.md`, README, capturas finales y evidencia del runner |

## Tarea 1: medicion final y regeneracion de 51.1

### Preflight de Chromium

En `verify-app.mjs` se importo `launch` desde `./lib/browser.mjs` y se reemplazaron los tres `await chromium.launch({ args: CHROMIUM_ARGS })` por `await launch(chromium)`. Nada mas cambio en ese sentido (ni `loadPlaywright`, ni los chequeos, ni `r2`, ni `CHROMIUM_ARGS`). Sin esto, los stages con navegador revientan con el error de revision de Playwright.

### Medicion final de la home (`designs/redesign-v3/reports/home-v4/lighthouse-summary.json`)

- `buildSha256`: `1a7c933d8fd7237f31eb85cafb0a92fcf7cfb74f369d7fbcf6addb71926750af` (`1a7c933d8fd7`), identico al de `app/public/measurements/lighthouse-summary.json`.
- `label`: `final`; `runsPerCombination`: 3; `combos.length`: 4; 3 corridas por combinacion (12 corridas).

| Idioma | Factor | Perf (mediana) | A11y | Mejores practicas | LCP (ms) | CLS | TBT (ms) | Transferido |
|--------|--------|----------------|------|-------------------|----------|-----|----------|-------------|
| ES | mobile | 91 | 100 | 100 | 1909 | 0 | 95 | 202.8 KB |
| EN | mobile | 94 | 100 | 100 | 1892 | 0 | 56 | 202.8 KB |
| ES | desktop | 75 | 100 | 100 | 402 | 0 | 394 | 219.1 KB |
| EN | desktop | 64 | 100 | 100 | 967 | 0 | 676 | 219.1 KB |

Corridas individuales de performance:

- ES mobile: 91, 91, 94 (mediana 91).
- EN mobile: 94, 90, 96 (mediana 94).
- ES desktop: 79, 70, 75 (mediana 75).
- EN desktop: 64, 59, 85 (mediana 64).

### Veredicto de las seis compuertas (D-11)

| Compuerta | Veredicto |
|-----------|-----------|
| accesibilidad 100 en todas las corridas | PASS |
| CLS 0 en todas las corridas mobile | PASS |
| performance mobile, mediana >= 90 | PASS |
| LCP mobile, mediana < 2000 ms | PASS |
| color-contrast aprobado en todas las corridas | PASS |
| ningun chunk de React Bits pedido en mobile | PASS |

Ninguna palanca L1 a L4 se aplico: las seis compuertas salieron PASS en la primera corrida limpia.

El TBT y el LCP de desktop salen exagerados porque Chromium headless renderiza WebGL por software (SwiftShader): son **informativos**, no compuertas (D-11), y se confirman en la GPU real de Juan en el gate.

### Delta de `/system` frente a 51.1

La galeria y el informe de 51.1 se regeneraron sobre el mismo build (`r2` verde):

| Metrica (mobile baseline) | 51.1 | Ahora | Delta |
|---------------------------|------|-------|-------|
| Performance (mediana) | 94 | 95 | +1 |
| LCP (mediana, ms) | 1893 | 2236 | +343 |
| Accesibilidad | 100 | 100 | 0 |
| Transferido | 127.9 KB | 158.1 KB | +30.2 KB |

El LCP de `/system` mobile empeora unos 343 ms y el performance sube ligeramente. **No es compuerta de esta fase** (la home usa su propio `measure-home.mjs`), pero Juan debe saberlo: mover el pivote v4 cambio el peso de la ruta de galeria. Anotado para el gate.

## Tarea 2: reporte, README y capturas finales

### REPORT.md (generado por `home-report.mjs`)

`designs/redesign-v3/app/scripts/home-report.mjs` genera `designs/redesign-v3/reports/home/REPORT.md` de forma determinista (9 secciones, ninguna cifra escrita a mano; re-ejecutable sin cambios de texto). Hace `fs.mkdirSync(..., { recursive: true })` antes de escribir. Verificado por grep: cero U+2013/U+2014, cero `/Users/`, ningun correo distinto de `hello@juan-tech.com`, y presentes los literales `Lighthouse`, `Supuestos`, `Cómo abrir la home`, `pendientes`, `GPU real`, `src/home/fx/` y `D-07`.

### README de la app

Ampliado sin borrar nada. `## Direcciones` incluye las cinco direcciones exactas (`http://127.0.0.1:5173/system`, `http://127.0.0.1:5173/rendimiento`, `http://127.0.0.1:4173/system`, `http://127.0.0.1:4173/system?mount=grainient`, `http://127.0.0.1:4173/rendimiento`) mas las URLs de la home. `## Comandos` anade `npm run verify:home`, `npm run verify:home:checks`, `npm run measure:home` y `npm run originals:verify -- --online`. `## Qué abrir` conserva los 8 items originales y anade 4 del gate (12 items). Stage `readme` d1 a d4 en verde.

### Capturas finales

Cuatro capturas del build final, cada una por debajo de 400 KB, generadas por el runner (viewport, sin editar a mano):

| Archivo | Dimensiones | Peso |
|---------|-------------|------|
| `final-es-desktop.jpg` | 1440x900 | 167 KB |
| `final-es-mobile.jpg` | 390x844 (@2x, 780x1688) | 121 KB |
| `final-en-desktop.jpg` | 1440x900 | 156 KB |
| `final-en-mobile.jpg` | 390x844 (@2x, 780x1688) | 116 KB |

Revisadas (no visualmente por el ejecutor, que no puede leer imagenes: se verificaron dimensiones y contenido no en blanco por muestreo de pixeles).

## Resultados por etapa del runner (`home-checks.json`, build final)

| Etapa | PASS | FAIL |
|-------|------|------|
| i18n | 17 | 0 |
| copy | 8 | 0 |
| a11y | 81 | 0 |
| budget | 14 | 0 |
| isolation | 6 | 3 |
| shots | 4 | 0 |
| **Total** | **130** | **3** |

Los 3 FAIL son todos de la etapa `isolation` y son preexistentes (ver "Desviaciones"). Las etapas i18n, copy, a11y, budget y shots salen sin FAIL.

## Excepciones del lint de voz

La unica lista de excepciones vive en la constante `ALLOW` de `scripts/lib/voice-rules.mjs` (T-52-09). Dos entradas, ambas de la regla V04:

| Regla | Ruta del copy | Razon |
|-------|---------------|-------|
| V04 | `es.casos.items.2.title` | Titulo de caso anonimo; es la descripcion literal del resultado, no un acto con agente claro. |
| V04 | `en.casos.items.2.title` | Espejo en ingles del titulo anterior; mismo caso anonimo. |

Reglas que admiten excepcion: V04, V13, V15, V16. Ningun chequeo se elimino ni se bajo un umbral.

## Desviaciones del plan

### Auto-corregidas (Regla 1 y Regla 3)

**1. [Rule 3 - Bloqueante] `--final-shots` no estaba implementado en el runner**

- **Encontrado durante:** Tarea 2, paso 3.
- **Problema:** `verify-home-checks.mjs` aceptaba `--final-shots` y lo pasaba en `ctx.wantShots`, pero ninguna etapa consumia esa bandera: las cuatro capturas `final-*.jpg` nunca se escribian. El plan (linea 119) exige que `--final-shots` escriba esas cuatro capturas.
- **Arreglo:** se anadio un bloque tras las etapas que, con `wantShots`, abre `/` y `/en` en escritorio (1440x900) y mobile (390x844, isMobile/hasTouch, DPR 2), espera el asentamiento del efecto y escribe `final-<lang>-<factor>.jpg` con calidad descendente (75/60/45) para quedar por debajo de 400 KB. Se registra un chequeo `sh1` por captura (etapa `shots`).
- **Archivos modificados:** `designs/redesign-v3/app/scripts/verify-home-checks.mjs`.
- **Commit:** `caf417f`.

**2. [Rule 1 - Bug] El chequeo `d2` del tracer quedo obsoleto tras el pivote v4**

- **Encontrado durante:** Tarea 2, paso 5 (`npm run verify`).
- **Problema:** el stage `tracer` verificaba que la URL `/@fs/` de `tokens.css` apareciera en la transformacion de `/src/main.tsx`. El pivote v4 (commit `5121099`, fase 52) movio ese import a `src/legacy/LegacyRoutes.tsx`; `main.tsx` ya no importa CSS. El chequeo existia desde 51.1 y `verify-app.mjs` no se habia vuelto a ejecutar hasta esta tarea (52-06 lo dejo explicitamente pendiente). El fallo es latente, no causado por este plan, y bloquea el `verify` en verde que exige la aceptacion de la tarea 2.
- **Arreglo minimo, preservando la intencion:** el chequeo ahora busca la referencia `/@fs/...assets/css/tokens.css` en los dos modulos conocidos (`/src/main.tsx` y `/src/legacy/LegacyRoutes.tsx`) y comprueba que responda 200. No cambia umbrales, ni `r2`, ni el nombre pasa a ser falso: se actualizo el mensaje para nombrar ambos modulos. Con esto `verify` pasa de 35 PASS / 1 FAIL a 36 PASS / 0 FAIL.
- **Archivos modificados:** `designs/redesign-v3/app/scripts/verify-app.mjs`.
- **Commit:** `caf417f`.

### Preexistentes, fuera de alcance (documentadas, no corregidas)

Los 3 FAIL de la etapa `isolation` son condiciones del entorno previas al plan:

1. **s2 y s8** - `reports/home/home-checks.json` en la **raiz del repositorio** es un archivo suelto y sin seguimiento, anterior a este plan (creado antes de los artefactos de esta sesion). Esta fuera de `designs/redesign-v3/` y de `.planning/`, y no esta en la lista blanca del repo. Este plan **no lo versiona ni lo borra** (se ignora; borrarlo requiere confirmacion de Juan).
2. **s6** - `scripts/verify-app.mjs` contiene un guion medio y uno largo, pero solo dentro de la propia regex que los **detecta** en el copy (`/[–—]/g`), el mismo patron que la etapa ya exime en `scripts/verify-home.mjs`. Existia en el commit base `48e7857`; este plan solo anadio una linea de import en ese archivo.

Ninguno de los tres afecta a la home ni a los artefactos del gate. Se anotan aqui y en `REPORT.md` seccion 4.

## Verificaciones (estado final)

| Comando | Resultado |
|---------|-----------|
| `node designs/redesign-v3/app/scripts/verify-app.mjs --stage=report` | 7 PASS, 0 FAIL |
| Verificacion automatica de la tarea 1 (`gates final 1a7c933d8fd7`) | PASS |
| `npm --prefix designs/redesign-v3/app run verify` | 36 PASS, 0 FAIL |
| `npm --prefix designs/redesign-v3/app run verify:home` | 37/37 en verde |
| `npm --prefix designs/redesign-v3/app run originals:verify -- --online` | 19 PASS, 0 FAIL |
| Verificacion automatica de la tarea 2 | PASS REPORT.md |
| `npm --prefix designs/redesign-v3/app run verify:home:checks -- --stage=all --final-shots --json=...` | 130 PASS, 3 FAIL (isolation preexistente); escribe las cuatro capturas |
| `git status --short -- package.json package-lock.json pnpm-lock.yaml yarn.lock src payload.config.ts` | vacio |

## Aislamiento

- Solo cambiaron `designs/redesign-v3/**` y `.planning/**`. Cero cambios en `src/`, `package.json`, lockfiles de la raiz, Payload, colecciones, esquema o base de datos.
- Ningun paquete nuevo. `package.json` y `package-lock.json` de la app siguen identicos a la base (s3a, s3b PASS).
- `mount-matrix.json` se restauro con `git checkout --` tras cada corrida del stage `gallery` (no pertenece a esta fase).

## Decision de Juan en el gate

**Pendiente.** Es la tarea 3 (gate humano D-14) y el ejecutor no la resuelve ni la inventa.

Juan debe revisar la home y responder con una de estas tres señales:

- `approve` - aprueba la home y la direccion visual.
- `approve-with-notes` - aprueba con notas para las fases 53 a 55.
- `changes` - pide cambios (con notas numeradas).

Sin `approve` explicito, las fases 53 a 55 no empiezan.

## Known Stubs

No hay stubs nuevos. Los "pendientes" de la home (retrato, testimonios, fecha de medicion, plazo de respuesta) son contenido que falta **a proposito** y se ve marcado en la home (D-05): se documentan en `REPORT.md` seccion 5 y los decide Juan en el gate. No bloquean la medicion ni el gate.

## Self-Check: PASSED

- [x] `designs/redesign-v3/app/scripts/home-report.mjs` existe (creado, commit `caf417f`).
- [x] `designs/redesign-v3/reports/home/REPORT.md` existe (9 secciones, markers presentes).
- [x] Las cuatro capturas `final-*.jpg` existen, por debajo de 400 KB.
- [x] Commits `e228a69` y `caf417f` existen en `master`.
- [x] `verify` (36/36), `verify:home` (37/37) y `originals:verify --online` (19/19) en verde.
- [x] Sin cambios en rutas prohibidas de la raiz.
