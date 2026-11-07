---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
plan: 01
subsystem: ui
tags: [mui, emotion, next-15, postcss, css-layers, tailwind-v3, theme]

requires:
  - phase: 52
    provides: sitio Tailwind/shadcn en master y sandbox MUI aprobado en designs/design-system-mui
provides:
  - rama feat/mui-redesign con MUI 9.5 y Emotion 11.14 fijados con versiones exactas
  - tema oscuro (tokens, theme, augment) en src/theme montado solo bajo (frontend)
  - plugin PostCSS que envuelve globals.css en @layer tailwind bajo @layer mui
  - scripts de verificacion de capas (con control negativo) y de estilos computados
affects: [53-02, 53-03, 53-04, 53-05, 53-06, 54, 55, 56, 57]

plan_head_before: e38cdf423454dffef283cf57df1815ec530a4a51

actuals:
  tokens: 6700
  tasks: 3
  commits: 2

tech-stack:
  added: ["@mui/material@9.5.0", "@mui/material-nextjs@9.5.0", "@emotion/react@11.14.0", "@emotion/styled@11.14.1", "@emotion/cache@11.14.0"]
  patterns:
    - "Capas CSS: Tailwind v3 envuelto en @layer tailwind, declarado antes de @layer mui"
    - "Proveedores MUI solo en (frontend)/[locale]/layout.tsx; el admin (payload) queda intacto"
    - "Tema importado solo desde un archivo cliente (Providers.tsx), nunca como prop de un server component"

key-files:
  created:
    - src/theme/tokens.ts
    - src/theme/theme.ts
    - src/theme/augment.d.ts
    - src/theme/Providers.tsx
    - postcss-tailwind-layer.cjs
    - scripts/verify/53-layer-check.mjs
    - scripts/verify/53-computed-styles.mjs
  modified:
    - package.json
    - package-lock.json
    - tsconfig.json
    - postcss.config.js
    - "src/app/(frontend)/[locale]/layout.tsx"
    - .planning/config.json

key-decisions:
  - "Capas con el plan A de RESEARCH (plugin PostCSS + @layer tailwind, mui) en lugar de la receta de UI-SPEC nota 2, que asume Tailwind v4"
  - "Next se queda en 15.4.11 (D-09); MUI 9.5 compila sin subirlo"
  - "@mui/lab no se instala en esta fase (D-09)"

patterns-established:
  - "El plugin PostCSS local solo actua si el archivo termina en globals.css, asi no toca CSS de @payloadcms/next"
  - "Verificacion de fuga al admin: comprobar chunks no vacios en los manifiestos, no la mera mencion de @mui"

requirements-completed: [BASE-02]

coverage:
  - id: D1
    description: "Rama feat/mui-redesign creada desde master, con commits propios, sin push y sin commits de codigo en master"
    requirement: BASE-01
    verification:
      - kind: other
        ref: "git log master..feat/mui-redesign --oneline (2 commits)"
        status: pass
    human_judgment: false
  - id: D2
    description: "MUI 9.5.0, material-nextjs 9.5.0 y Emotion con versiones exactas; next sigue en 15.4.11; sin @mui/lab"
    requirement: BASE-02
    verification:
      - kind: other
        ref: "node -e lectura de package.json dependencies"
        status: pass
    human_judgment: false
  - id: D3
    description: "next build compila con MUI 9.5 sobre Next 15.4.11"
    requirement: BASE-02
    verification:
      - kind: integration
        ref: "npm run build (variables ficticias del plan), exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tema oscuro montado solo bajo (frontend); ningun archivo ni chunk del admin carga MUI o Emotion"
    requirement: BASE-02
    verification:
      - kind: other
        ref: "grep -rEn '@mui|@emotion|@/theme' src/app/(payload) vacio; git diff master -- src/app/(payload) vacio; manifiestos de cliente del admin sin modulos MUI/Emotion/theme con chunks"
        status: pass
    human_judgment: false
  - id: D5
    description: "Salida de globals.css dentro de @layer tailwind con orden `tailwind, mui` primero, y verificacion con control negativo"
    requirement: BASE-02
    verification:
      - kind: other
        ref: "node scripts/verify/53-layer-check.mjs -> OK (673 nodos en capa; 627 reglas sin capa sin el plugin)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Fondo del body rgb(24,24,24) y boton contained rgb(255,122,69) en navegador"
    requirement: BASE-02
    verification: []
    human_judgment: false
    rationale: "Script listo (53-computed-styles.mjs); se ejecuta en los planes 05 y 06 contra una pagina con datos reales, como dice el plan"

duration: 40min
completed: 2026-11-06
status: complete
---

# Phase 53 Plan 01: Rama, MUI 9.5 y capas CSS Summary

**MUI 9.5 con tema oscuro montado solo en (frontend) sobre Next 15.4.11, con Tailwind v3 envuelto por un plugin PostCSS en `@layer tailwind` bajo `@layer mui` para que el reset de Tailwind no aplaste a MUI.**

## Performance

- **Duration:** aprox. 40 min de trabajo (commits del 2026-11-06 17:27 a 18:03 -05:00) mas el cierre y la re-verificacion del 2026-11-07
- **Started:** 2026-11-06T22:27:22Z (primer commit de tarea)
- **Completed:** 2026-11-07T16:31:11Z (cierre y SUMMARY)
- **Tasks:** 3 (Task 1 gate humano, Task 2 tracer, Task 3 auto)
- **Files modified:** 12 (13 contando package-lock.json)

## Accomplishments

- Rama `feat/mui-redesign` creada desde master con dos commits propios, sin push; `git diff master -- "src/app/(payload)"` vacio.
- MUI 9.5.0, `@mui/material-nextjs` 9.5.0 y Emotion fijados con `--save-exact`; `next` sigue en 15.4.11 y `@mui/lab` no esta instalado.
- `npm run build` termina con codigo 0 (supuesto A7 de RESEARCH confirmado: MUI 9.5 compila con Next 15.4.11).
- `AppRouterCacheProvider` (`enableCssLayer`), `InitColorSchemeScript`, `ThemeProvider` oscuro y `CssBaseline` viven solo en `(frontend)/[locale]/layout.tsx`; `viewport.themeColor` es `#181818` y el body ya no lleva `font-sans`.
- El CSS compilado de `globals.css` queda entero en `@layer tailwind` con la sentencia `@layer tailwind, mui` primero; hay verificacion determinista con control negativo.

## Task Commits

1. **Task 1: Verificar legitimidad de @mui/material y @mui/material-nextjs** - sin commit. Gate `blocking-human` aprobado por Juan ("approved") antes de instalar.
2. **Task 2: Rama feat/mui-redesign con MUI 9.5 montado en (frontend)** - `d5d8bbb` (feat)
3. **Task 3: Capas CSS y scripts de verificacion** - `147164b` (feat)

**Plan metadata:** commit docs de cierre (ver STATE.md y el log de la rama)

## Files Created/Modified

- `src/theme/tokens.ts` - tokens oscuros y fuentes del sandbox; `font.mono` con respaldo `var(--font-geist-mono, ui-monospace)`
- `src/theme/theme.ts` - `createTheme` v9 solo oscuro (`use client`), con `scrollPaddingBottom: 72`
- `src/theme/augment.d.ts` - extensiones de paleta (`accentText`, `raised`, `fieldBorder`, `band`, `mono`)
- `src/theme/Providers.tsx` - `ThemeProvider` + `GlobalStyles` de orden de capas + `CssBaseline`
- `postcss-tailwind-layer.cjs` - plugin `wrap-tailwind-in-layer`, solo actua en `globals.css`; se borra con Tailwind en la fase 57 (CAL-03)
- `postcss.config.js` - agrega la clave de plugin `./postcss-tailwind-layer.cjs`
- `scripts/verify/53-layer-check.mjs` - verifica forma de la salida y control negativo
- `scripts/verify/53-computed-styles.mjs` - estilos computados de body y boton contained con Playwright (`BASE_URL`, `PATH_TO_CHECK`, `REQUIRE_BUTTON`)
- `src/app/(frontend)/[locale]/layout.tsx` - proveedores MUI, `suppressHydrationWarning`, `themeColor`
- `tsconfig.json` - `designs/**/*` en `exclude`
- `package.json`, `package-lock.json` - dependencias exactas
- `.planning/config.json` - `workflow.use_worktrees: false` (ver desviaciones)

## Decisions Made

- Capas con el plan A de RESEARCH (decision del orquestador): la receta literal de UI-SPEC nota 2 queda sustituida porque asume Tailwind v4.
- Next no se sube (limite de `@payloadcms/next`, D-09).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Clausula de verificacion del Task 2 produce un falso positivo**
- **Found during:** cierre del plan (re-ejecucion de `<verify>` del Task 2)
- **Issue:** la ultima clausula (`! grep -rlE "@mui|emotion" .next/server/app/(payload) --include=*client-reference-manifest.js`) falla: cuatro manifiestos del admin y de las rutas API mencionan dos modulos de MUI (`appRouterV13.mjs` e `InitColorSchemeScript.mjs`). Next 15 vuelca en cada manifiesto el mapa de modulos cliente de toda la compilacion (tambien aparecen `SiteHeaderChrome`, `ScrollReveal`, `Providers.tsx` y otros del frontend), con `chunks: []` para los que la ruta no carga. La mencion no implica carga.
- **Fix:** se sustituyo la comprobacion por una que mide lo que importa (T-53-01): ningun modulo cuyo ruta contenga `@mui`, `emotion` o `src/theme` tiene `chunks` no vacios en los cuatro manifiestos de `(payload)`, y los chunks de cliente de `.next/static/chunks/app/(payload)` no contienen `MuiButton`, `emotion-cache`, `data-emotion` ni `@layer mui`. Resultado: 0 modulos con chunks en los cuatro manifiestos; sin cadenas MUI en los chunks del admin; los chunks de `(frontend)` si las contienen.
- **Files modified:** ninguno (solo cambia la forma de verificar)
- **Verification:** ejecutado el 2026-11-07 sobre el build recien generado
- **Commit:** n/a

**2. [Rule 3 - Blocking] `.planning/config.json` incluido en el commit del Task 2**
- **Found during:** revision de `d5d8bbb`
- **Issue:** el commit incluye `workflow.use_worktrees: false` en `.planning/config.json`, fuera de la lista de archivos del plan. El cambio es aditivo y refleja la decision de ejecutar en el arbol principal.
- **Fix:** se deja como esta y se documenta aqui.
- **Commit:** `d5d8bbb`

**Total deviations:** 2 (ambas de proceso, sin cambio de comportamiento). **Impact:** ninguno sobre el alcance.

## Auth Gates

Task 1 fue el gate `blocking-human` de legitimidad de paquetes. Juan lo aprobo antes de instalar. No hubo gates de autenticacion.

## Verification Results (re-ejecutadas el 2026-11-07)

| Comprobacion | Resultado |
|---|---|
| `git branch --show-current` | `feat/mui-redesign` |
| `git log master..feat/mui-redesign` | 2 commits (`147164b`, `d5d8bbb`) |
| `package.json` | material 9.5.0, material-nextjs 9.5.0, emotion react 11.14.0 / styled 11.14.1 / cache 11.14.0, next 15.4.11, sin `@mui/lab` |
| `tsconfig.json` | `designs/**/*` en `exclude` |
| `src/theme/theme.ts` | empieza con `'use client'`; contiene `scrollPaddingBottom: 72` |
| `src/theme/tokens.ts` | contiene `var(--font-geist-mono, ui-monospace)` |
| `layout.tsx` | `enableCssLayer: true` (1), `suppressHydrationWarning`, `themeColor: '#181818'`, sin `font-sans` |
| `grep @mui/@emotion/@/theme` en `src/app/(payload)` | sin coincidencias; `git diff master -- src/app/(payload)` vacio |
| `npm run build` (variables ficticias) | exit 0 |
| `node scripts/verify/53-layer-check.mjs` | `OK (capa tailwind con 673 nodos; control negativo: 627 reglas sin capa sin el plugin)` |
| `node --check scripts/verify/53-computed-styles.mjs` | sin errores; contiene `rgb(24, 24, 24)`, `rgb(255, 122, 69)`, `REQUIRE_BUTTON` |
| `@layer tailwind` en `.next/static/css` | presente (`916abc1a2b2929c0.css`) |
| Manifiestos del admin | 0 modulos MUI/Emotion/theme con chunks (ver desviacion 1) |
| `npm audit --omit=dev` | 44 vulnerabilidades (4 low, 22 moderate, 14 high, 4 critical) en el arbol actual, todas por dependencias transitivas ajenas a MUI (por ejemplo `zod` via `@payloadcms/plugin-mcp`). La linea base previa a la instalacion se mostro en el gate del Task 1 y no se archivo; no se puede comparar numericamente aqui. |

## Deferred

- Estilos computados en navegador (`53-computed-styles.mjs`: body `rgb(24, 24, 24)` y boton contained `rgb(255, 122, 69)`) no se corrieron: el plan los difiere a los planes 05 y 06 porque necesitan una pagina con datos reales.
- Auditoria de vulnerabilidades: sin linea base numerica archivada para comparar; reabrir si se quiere un delta exacto.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. El script `53-computed-styles.mjs` usa Playwright ya declarado como devDependency y solo apunta a `BASE_URL`.

## Issues Encountered

El ejecutor anterior murio por un error de red despues de commitear las dos tareas y antes de escribir el SUMMARY; este cierre re-ejecuto toda la verificacion contra los archivos reales.

## Next Phase Readiness

- Listo para los planes 02 a 06: el tema compila, las capas funcionan y el admin queda aislado.
- BASE-01 sigue pendiente: este plan solo cubre la rama; el preview (`dev.juan-tech.com`, `noindex`, fuera del sitemap) llega con los planes 02 y 06.
- BASE-02 queda marcado como completo por el montaje y el aislamiento del admin; los planes 05 y 06 aportan la prueba en navegador.

## Self-Check: PASSED

- Archivos creados: `src/theme/tokens.ts`, `theme.ts`, `augment.d.ts`, `Providers.tsx`, `postcss-tailwind-layer.cjs`, `scripts/verify/53-layer-check.mjs`, `scripts/verify/53-computed-styles.mjs` presentes.
- Commits `d5d8bbb` y `147164b` presentes en `feat/mui-redesign`.
