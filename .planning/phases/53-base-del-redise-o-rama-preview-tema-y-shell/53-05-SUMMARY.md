---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
plan: 05
subsystem: ui
tags: [mui, layout, landmarks, skip-link, motion-toggle, a11y, playwright, next-intl]

requires:
  - phase: 53-02
    provides: meta robots condicional y contrato del preview
  - phase: 53-03
    provides: MOTION_INIT_SCRIPT, MotionStateProvider y useMotion
  - phase: 53-04
    provides: SiteHeader y SiteFooter MUI, namespace shell
provides:
  - SkipLink y MotionToggle (src/components/shell)
  - Layout de (frontend) ensamblado con el shell MUI y un unico main#main-content
  - 22 paginas sin main propio (pasan a div)
  - scripts/verify/53-shell-contract.mjs con --selftest
  - secciones de navegador (motion, skip, lang, overflow, drawer, focus) en 53-computed-styles.mjs
affects: [53-06, 54, 55, 56, 57]

plan_head_before: aff1e6f1675e2744a3874d8b47a78e3c59efa112

actuals:
  tokens: 8100
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "El layout posee el unico landmark main; las paginas renderizan div"
    - "Funcion pura checkShellHtml exportada y reutilizada por la autoprueba y por el modo en vivo"
    - "Secciones de navegador por variable CHECKS, cada una en un contexto de Playwright limpio"

key-files:
  created:
    - src/components/shell/SkipLink.tsx
    - src/components/shell/MotionToggle.tsx
    - scripts/verify/53-shell-contract.mjs
  modified:
    - "src/app/(frontend)/[locale]/layout.tsx"
    - "22 paginas bajo src/app/(frontend)/[locale]/ (main a div)"
    - scripts/verify/53-computed-styles.mjs

key-decisions:
  - "La etiqueta del toggle de movimiento es constante y el estado lo lleva solo aria-pressed (desviacion deliberada respecto al sandbox, ya pedida por el plan)"
  - "La apertura del main del layout va en una sola linea para que el conteo con grep -o del verify (apertura mas cierre igual a 2) funcione"
  - "El script de navegador espera load mas una ventana corta de red en reposo, no networkidle a secas"

requirements-completed: []
requirements-advanced: [BASE-02, BASE-03]

coverage:
  - id: D1
    description: "Layout con SkipLink, SiteHeader, un solo main#main-content, SiteFooter y MotionToggle; script de data-motion en el head; InitColorSchemeScript primero en el body"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "npm run build exit 0; tsc --noEmit exit 0; conteo de main en el layout igual a 2; HTML real de /en/search pasa checkShellHtml sin fallos"
        status: pass
    human_judgment: false
  - id: D2
    description: "Un solo main en el HTML servido: las 22 paginas pasan de main a div"
    requirement: BASE-02
    verification:
      - kind: other
        ref: "grep global sin coincidencias fuera de layout.tsx; diff de las 22 paginas solo contiene 22 lineas de apertura y 22 de cierre"
        status: pass
    human_judgment: false
  - id: D3
    description: "Toggle de movimiento (persistencia, aria-pressed), enlace de salto, Drawer con Escape, desborde a 320, 900, 1024 y 1280 px y foco no oculto, en Chromium real"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "CHECKS=motion,skip,overflow,drawer,focus contra el standalone local en /en/search: PASS en las cinco secciones (8 paradas de Tab medidas)"
        status: pass
    human_judgment: false
    rationale: "Se probo en /en/search porque / lee la base de datos. La seccion lang y la pagina de inicio quedan para el preview del plan 06."
  - id: D4
    description: "El admin de Payload no recibe MUI ni Emotion"
    requirement: BASE-02
    verification:
      - kind: other
        ref: "git diff master -- src/app/(payload) vacio; analisis por vm de los 4 manifiestos de cliente de (payload): 12 menciones, 0 con chunks no vacios"
        status: pass
    human_judgment: false
  - id: D5
    description: "Contrato HTML del shell con autoprueba determinista"
    requirement: BASE-03
    verification:
      - kind: unit
        ref: "node scripts/verify/53-shell-contract.mjs --selftest -> SELFTEST OK, exit 0 (seis casos)"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-11-07
status: complete
---

# Phase 53 Plan 05: Ensamblado del shell en el layout Summary

**Layout de (frontend) con el shell MUI completo (enlace de salto, header, un solo main, footer y toggle de movimiento), script de data-motion en el head y scripts de contrato y de navegador, verificados contra un servidor standalone real.**

## Performance

- **Duration:** aprox. 30 min
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 29 (3 nuevos, 26 modificados)

## Accomplishments

- `SkipLink` (MUI `Link` hacia `#main-content`, fuera de pantalla hasta recibir el foco) y `MotionToggle` (botón outlined pequeño fijo abajo a la izquierda, etiqueta constante, iconos Pause y Play con `aria-hidden`, estado solo en `aria-pressed`).
- El layout monta, en este orden, `head` con `MOTION_INIT_SCRIPT`, `InitColorSchemeScript`, `AppRouterCacheProvider` (enableCssLayer), `Providers`, `NextIntlClientProvider`, `MotionProvider` viejo, `SkipLink`, `SiteHeader`, `main#main-content` (tabIndex -1, aria-label `shell.landmarks.main`), `SiteFooter` y `MotionToggle`. Se quitaron el enlace de salto de Tailwind y el `div#main-content` anteriores. Los componentes viejos siguen en disco.
- Las 22 páginas con `main` propio pasan a `div` con una sustitución mecánica acotada: el diff contiene solo 22 aperturas y 22 cierres.
- `53-shell-contract.mjs` exporta `checkShellHtml` y su `--selftest` rechaza dos `main`, falta de enlace de salto, `nav` con el mismo nombre, lang incorrecto y preview sin noindex.
- `53-computed-styles.mjs` suma las secciones `motion`, `skip`, `lang`, `overflow`, `drawer` y `focus` y conserva `styles`.

## Task Commits

1. **Task 1: Layout ensamblado, un solo main, 22 páginas ajustadas (tracer)** - `8afcd50` (feat)
2. **Task 2: Scripts de contrato HTML y de navegador** - `e1d4430` (test)

**Plan metadata:** commit docs de cierre (ver el log de la rama)

## Decisions Made

- Tracer feedback gate resuelto por la rama interactiva `end-of-phase` con `<verify>` automatizado: se corrió el verify completo (build, greps, capas y manifiestos) y pasó, así que se siguió con la tarea 2.
- El `main` del layout se escribe con todos sus atributos en la misma línea que `<main`. Con la apertura en varias líneas, el `grep -oE '[<]/?main[ >]'` del verify solo cuenta el cierre y da 1 en vez de 2.
- Las secciones de navegador usan `load` más una espera corta de red en reposo (`settle`), con tope de 5 s que no falla. Con `networkidle` a secas, los prefetch de enlaces que fallan o tardan mantienen la red activa y `goto` expira.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Clausula de manifiestos del verify de Task 1 produce un falso positivo**
- **Found during:** Task 1 (verify)
- **Issue:** `! grep -rlE "@mui|emotion" .next/server/app/(payload) --include=*client-reference-manifest.js` encuentra cuatro manifiestos. Es el mismo falso positivo documentado en 53-01: Next 15 vuelca en cada manifiesto el mapa de módulos cliente de toda la compilación, con `chunks: []` para los que la ruta no carga.
- **Fix:** se midió la fuga real con un script `vm` que lee los cuatro manifiestos y cuenta entradas de MUI, Emotion, material-nextjs, InitColorSchemeScript y Providers con `chunks` no vacíos. Resultado: 12 menciones, 0 fugas. Además `git diff master -- src/app/(payload)` está vacío.
- **Files modified:** ninguno (la medición vive en /tmp y no se versiona)
- **Commit:** n/a

**2. [Rule 3 - Blocking] 53-computed-styles.mjs no podía probar el shell sin base de datos**
- **Found during:** Task 2 (verificación opcional contra el standalone local)
- **Issue:** la página `/` lee Postgres y devuelve 500 sin base; además `networkidle` expiraba por los prefetch fallidos.
- **Fix:** variable `ENTRY_PATH` (por defecto `/`) para elegir la página de entrada y helper `settle`. Se documentó en la cabecera del script. El comportamiento por defecto no cambia.
- **Files modified:** scripts/verify/53-computed-styles.mjs
- **Commit:** e1d4430

**Total deviations:** 2 auto-fixed (ambas Rule 3). **Impact:** ninguna cambia el alcance ni el contrato del plan.

## Auth Gates

Ninguno.

## Verification Results

| Comprobacion | Resultado |
|---|---|
| `npm run build` (DATABASE_URI ficticia a 127.0.0.1) | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `grep -rEq '[<]/?main[ >]' "src/app/(frontend)" --exclude=layout.tsx` | sin coincidencias |
| `grep -oE '[<]/?main[ >]'` en el layout | 2 (una apertura, un cierre) |
| `node scripts/verify/53-layer-check.mjs` | `OK` (capa tailwind con 660 nodos; control negativo con 614 reglas sin capa) |
| Manifiestos de cliente de `(payload)` | 12 menciones, 0 con chunks no vacíos (ver desviación 1) |
| `git diff master --stat -- "src/app/(payload)"` | vacío |
| `node scripts/verify/53-shell-contract.mjs --selftest` | `SELFTEST OK`, exit 0 (seis casos PASS) |
| `node --check` de ambos scripts | exit 0 |
| HTML real de `/en/search` (standalone local, sin base) con `checkShellHtml` | cero fallos: header, nav, main, footer con aria-label, primer `<a>` a `#main-content`, `jt-motion` y `@layer mui` presentes |
| `CHECKS=motion,skip,overflow,drawer,focus` en Chromium contra `/en/search` | PASS en las cinco, `focus: 8 paradas de Tab medidas` |

Segun CLAUDE.md no se tocó ninguna base de datos: el servidor local usó `postgresql://build:build@127.0.0.1:5432/build` (nada escucha ahí) y se detuvo al terminar. No hay migraciones ni cambios de esquema.

## Deferred

- Página de inicio (`/` y `/en`) y la sección `lang` (necesita `/servicios` con datos): se comprueban en el preview del plan 06 con `53-shell-contract.mjs` (`EXPECT_PREVIEW=1`) y `53-computed-styles.mjs` completo.
- Meta robots con noindex en el HTML: depende de `PREVIEW_READONLY` en tiempo de ejecución y de que las páginas no estén prerenderizadas sin la bandera. Se verifica en el preview, no en este build.
- El contrato exige exactamente un `header` y un `footer` en `/` y `/en`. Si el contenido de la home añade otros `header` o `footer` (por ejemplo dentro de `article`), el plan 06 lo verá como FAIL y habrá que decidir si se ajusta la página o el contrato.
- Prueba manual con lector de pantalla del enlace de salto, el toggle y el Drawer: pendiente de Juan.
- BASE-03 queda como `requirements-advanced`: la verificación completa en `dev.juan-tech.com` es del plan 06.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. Mitigaciones del registro implementadas: T-53-40 (proveedores solo en el layout de `(frontend)`, `(payload)` sin cambios y sin cargas de MUI), T-53-41 (el script del head es la constante `MOTION_INIT_SCRIPT`, sin interpolación), T-53-42 (el shell conserva sus `try/catch` del plan 04) y T-53-43 (sustitución acotada con diff de 22 pares exactos).

## Issues Encountered

Ninguno bloqueante. `state.update-progress` y `roadmap.update-plan-progress` no actualizan los contadores (aviso heredado), así que la casilla de ROADMAP.md se marca a mano.

## Next Phase Readiness

- El plan 06 puede correr los dos scripts contra el preview: `BASE_URL=https://dev.juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/53-shell-contract.mjs` y `BASE_URL=... node scripts/verify/53-computed-styles.mjs`.
- Las fases 54 y 55 reemplazan el contenido de las páginas; deben conservar `div` como raíz, porque el layout posee el `main`.

## Self-Check: PASSED

- Archivos presentes: `src/components/shell/SkipLink.tsx`, `src/components/shell/MotionToggle.tsx`, `scripts/verify/53-shell-contract.mjs`, `scripts/verify/53-computed-styles.mjs`, layout modificado.
- Commits `8afcd50` y `e1d4430` presentes en `feat/mui-redesign`.
