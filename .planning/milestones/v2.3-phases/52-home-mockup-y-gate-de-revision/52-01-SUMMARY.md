---
phase: 52-home-mockup-y-gate-de-revision
plan: 01
subsystem: ui
tags: [react, vite, typescript, webgl, grainient, lighthouse, playwright, a11y, i18n]
requires:
  - phase: 51.1-entorno-react-de-mockups-con-componentes-originales-de-react
    provides: app Vite con cupo unico de originales, tokens.ts, fallbacks y baseline /system
provides:
  - Rutas / (ES) y /en (EN) con hero real (H1, ASCII aria-hidden, CTA) en el chunk de entrada
  - Motor home-effect con cupo unico, tope de 2 ids (D-08) y armado tras load, LCP y ocio (D-09)
  - HomeSections con un chunk diferido por archivo de src/home/sections
  - Cabecera con navegacion, selector de idioma y pausa, y pie, con copy ES/EN en JSON
  - Harness verify-home.mjs (stages tracer y chrome) y measure-home.mjs
  - Mediciones Lighthouse del hero (ES mobile, ES desktop, EN mobile) con mediana de 3
affects: [52-02, 52-03, 52-04, 52-05, 52-06, 52-07]
tech-stack:
  added: []
  patterns:
    - "Una seccion por archivo src/home/sections/NN-nombre.tsx con export default ({ lang }), descubierta con import.meta.glob"
    - "Copy en JSON { es, en } por bloque, importado de forma estatica"
    - "Stages del harness en scripts/home-stages/<nombre>.mjs con run(ctx)"
    - "Pie fuera de main, montado por portal en #hm-after cuando la ultima seccion cargo"
key-files:
  created:
    - designs/redesign-v3/app/src/home/HomePage.tsx
    - designs/redesign-v3/app/src/home/home-effect.tsx
    - designs/redesign-v3/app/src/home/home-env.ts
    - designs/redesign-v3/app/src/home/effect-budget.ts
    - designs/redesign-v3/app/src/home/HomeSections.tsx
    - designs/redesign-v3/app/src/home/Footer.tsx
    - designs/redesign-v3/app/src/home/links.ts
    - designs/redesign-v3/app/src/home/home.css
    - designs/redesign-v3/app/src/home/copy/page.json
    - designs/redesign-v3/app/src/home/copy/footer.json
    - designs/redesign-v3/app/scripts/verify-home.mjs
    - designs/redesign-v3/app/scripts/home-stages/tracer.mjs
    - designs/redesign-v3/app/scripts/home-stages/chrome.mjs
    - designs/redesign-v3/app/scripts/measure-home.mjs
    - designs/redesign-v3/app/public/favicon.svg
    - designs/redesign-v3/reports/lighthouse-home-summary.json
    - designs/redesign-v3/reports/lighthouse-home-es-mobile.report.html
    - designs/redesign-v3/reports/lighthouse-home-es-desktop.report.html
    - designs/redesign-v3/reports/lighthouse-home-en-mobile.report.html
    - designs/redesign-v3/reports/home/tracer-desktop.jpg
    - designs/redesign-v3/reports/home/tracer-mobile.jpg
  modified:
    - designs/redesign-v3/app/src/App.tsx
    - designs/redesign-v3/app/src/main.tsx
    - designs/redesign-v3/app/index.html
    - designs/redesign-v3/app/package.json
key-decisions:
  - "HomePage entra estatica al chunk de entrada: un chunk diferido sumaria un viaje de red al LCP"
  - "El pie vive fuera de main (landmark contentinfo real) y se monta por portal en #hm-after tras la ultima seccion"
  - "El presupuesto de efectos vive en un modulo puro (effect-budget.ts) para que el harness lo pruebe en Node sin navegador"
  - "Mobile y pantalla tactil (max-width 767px o pointer coarse) quedan bloqueados: solo fallback CSS"
requirements-completed: [HOME-01, HOME-02, PERF-01, PERF-02, PERF-03]
duration: ~65 min
completed: 2026-10-15
status: complete
commits: 3
plan_head_before: 48e78573ddf3ae00e65a9f174b72794b3731cb17
actuals:
  tokens: 16600
  tasks: 3
  commits: 3
---

# Phase 52 Plan 01: Tracer del hero de la home Summary

**Home `/` y `/en` en la app React de 51.1 con hero real (H1 sobre scrim, ASCII decorativo, CTA a #contacto), Grainient original montado solo en desktop tras load, LCP y ocio, y Lighthouse mobile en 97 a 99 de performance con LCP de 1.85 a 1.90 s y CLS 0.**

## Performance

- **Duration:** unos 65 minutos (estimado por las marcas de tiempo de los archivos)
- **Completed:** 2026-10-15
- **Tasks:** 3 de 3
- **Files:** 21 creados y 4 modificados, todos bajo `designs/redesign-v3/`

## Accomplishments

- El tracer cruza ruta, vista, motor de efectos, estilo, copy y harness con un solo camino: el hero. `verify-home --stage=tracer` da 31 PASS (con capturas) y `--stage=chrome` 18 PASS; `--stage=all` da 47 PASS y omite con INFO los stages que crean 52-02 a 52-06.
- El hero entra entero al primer viewport (H1, ASCII y CTA) en 1440x900, 1280x720, 412x823 y 390x844, en ES y EN.
- Grainient se pide a los 2.9 s de la navegacion en el harness, despues de `load` y de la ultima entrada de LCP. Con viewport movil tactil, `prefers-reduced-motion`, `saveData` y la pausa hay 0 canvas y 0 peticiones del chunk. El canvas se desmonta al salir del hero, al ocultar la pestana y al pausar, y vuelve al regresar o soltar la pausa.
- El motor acepta 2 ids y el tercero lanza un `Error` que lo nombra (probado en Node contra `effect-budget.ts`).
- Cabecera con barra (desde 768 px) y menu `details` colapsado, selector ES/EN con `aria-current`, boton Pausar animaciones con etiqueta fija, pie con enlaces legales al sitio vivo. Sin desborde a 320, 390 y 1440 px, objetivos tactiles de 44 px y contorno de foco de 2 px o mas en todo lo enfocable de cabecera y pie.
- Favicon SVG con colores que son un subconjunto exacto de `tokens.css`, `noindex` y aviso `noscript` ES/EN.

## Lighthouse del hero (build `fb44efd63d62`, Lighthouse 13.4.1, brotli en 127.0.0.1, SwiftShader)

Elemento LCP en todas las corridas: `section.fx-grain > div.hm-hero__grid > div.fx-content > h1#hm-h1` (texto real del H1). Accesibilidad 100, mejores practicas 100 y `color-contrast` aprobado en las 9 corridas. 133 KB transferidos y 8 peticiones en mobile, 139 KB y 10 en desktop.

**Mediana de 3 (las compuertas de D-11 se evaluan sobre esto):**

| Combinacion | Performance | LCP | CLS | TBT |
|-------------|-------------|-----|-----|-----|
| ES mobile | 98 | 1878 ms | 0 | 0 ms |
| EN mobile | 97 | 1877 ms | 0 | 14 ms |
| ES desktop (informativo) | 97 | 404 ms | 0 | 116 ms |

**Corridas finales, una por una (las que fallan tambien):**

| Combinacion | Corrida | Perf | LCP (ms) | CLS | TBT (ms) | Chunk de original |
|-------------|---------|------|----------|-----|----------|-------------------|
| ES mobile | 1 | 98 | 1859 | 0 | 0 | no |
| ES mobile | 2 | 98 | 1882 | 0 | 0 | no |
| ES mobile | 3 | 98 | 1878 | 0 | 0 | no |
| EN mobile | 1 | 97 | 1877 | 0 | 57 | no |
| EN mobile | 2 | 97 | 1895 | 0 | 14 | no |
| EN mobile | 3 | 99 | 1851 | 0 | 0 | no |
| ES desktop | 1 | 99 | 403 | 0 | 21 | si |
| ES desktop | 2 | 76 | 404 | 0 | 577 | si |
| ES desktop | 3 | 97 | 406 | 0 | 116 | si |

Las tres corridas anteriores de la primera pasada (mismo build) dieron: ES mobile 98/98/98 con LCP 1881, 1803 y 1884 ms; luego 98/98/98 con LCP 1899, 1877 y 1883 ms; ES desktop 78/99/99 con TBT 489, 0 y 0 ms; EN mobile 98/98/97 con LCP 1882, 1877 y 1757 ms. Ninguna compuerta fallo en ninguna pasada.

**Lectura honesta de los numeros:**

- El margen de LCP mobile contra los 2000 ms es de unos 120 ms (1851 a 1899 ms), el mismo orden que dejo el baseline de `/system` en 51.1. Cualquier peso que 52-03 a 52-05 agreguen a la ruta critica se come ese margen: por eso las secciones van en chunks separados y se montan despues de `armed`.
- La unica corrida floja es desktop 2 (perf 76, TBT 577 ms). Es el TBT con WebGL por software (SwiftShader) que la fase 51 ya dejo documentado, y varia de 0 a 577 ms entre corridas del mismo build. La mediana de desktop queda en 97. Se confirma en GPU real; no es compuerta (`tbtNote` en el JSON).
- Palancas L1 a L4 del plan: no hizo falta aplicar ninguna.

## Task Commits

1. **Tarea 1 (tracer): ruta / y /en con hero real, ASCII, CTA y Grainient diferido** - `66e1d1f` (feat)
2. **Tarea 2: cabecera con navegacion completa, pie real y stage chrome** - `7b439c4` (feat)
3. **Tarea 3: favicon, noscript, medicion Lighthouse del hero** - `d23db9e` (feat)

**Plan metadata:** commit docs de este SUMMARY (aparte).

## Decisions Made

- **HomePage estatica en el chunk de entrada.** El entry pesa 258 KB (79 KB gzip) y 34 KB de CSS; los 16 originales siguen en chunks aparte. `/system` y `/rendimiento` no se movieron (L3 no hizo falta).
- **Pie fuera de `main`.** Dentro de `main` el `footer` pierde su rol de `contentinfo`. `HomeSections` recibe `after` como dice el contrato y lo monta por `createPortal` en `div#hm-after`, hermano de `main`.
- **Bloqueo por pantalla chica con el gate del kit** (`(max-width: 767px), (pointer: coarse)`), para que Lighthouse mobile mida solo el fallback CSS.
- **Tokens leidos al montar el efecto**, nunca al cargar el modulo. Cero hex en TypeScript y en `home.css`.
- Los destinos de Blog y Autores apuntan al sitio vivo (`https://juan-tech.com/blog`, `/authors`, con `/en/` en EN) hasta las fases 54 y 55. Las rutas legales salen del HTML vivo del 2026-10-15 (`/privacy`, `/terms`, `/sitemap.html`, `/stack`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Archivos extra para cumplir el limite de tamano y poder probar el tope de efectos**
- **Found during:** Tarea 1
- **Issue:** el plan pide un motor en `home-effect.tsx` con el error del tercer id, pero el harness corre en Node y no puede importar TSX con React. Ademas, hooks de entorno, motor y presupuesto en un archivo pasaban de largo el limite de ~160 lineas.
- **Fix:** `effect-budget.ts` (modulo puro con `MAX_EFFECTS_PER_PAGE` y `claimEffectId`, que `home-effect.tsx` reexporta y usa), `home-env.ts` (pausa, matchMedia, saveData, pestana visible y armado) y `links.ts` (`liveUrl`). El chequeo t12 importa `effect-budget.ts` directo con el strip de tipos de Node 24.
- **Files modified:** `src/home/effect-budget.ts`, `src/home/home-env.ts`, `src/home/links.ts` (nuevos, fuera de `files_modified` del plan, dentro de `designs/redesign-v3/app/`)
- **Verification:** t12 PASS; `home-effect.tsx` sigue conteniendo `MAX_EFFECTS_PER_PAGE`. `home-effect.tsx` mide 185 lineas, por encima de la guia de ~160.
- **Commit:** `66e1d1f`

**2. [Rule 1 - Bug] Reglas globales de la galeria filtradas al pie de la home**
- **Found during:** Tarea 1 (captura de revision)
- **Issue:** `app.css` centra `.site-footer` a 80 rem y pinta `.site-footer a` en violeta para la galeria; el pie de la home salia corrido y con la marca en violeta.
- **Fix:** `.site-footer.hm-footer` en `home.css` anula `max-width`, `margin` y el color de los enlaces, sin tocar `app.css`.
- **Commit:** `66e1d1f`

**3. [Rule 3 - Blocking] Sondeo desde Node en lugar de `waitForFunction`**
- **Found during:** Tarea 1
- **Issue:** con SwiftShader ocupando el hilo principal, `page.waitForFunction` agotaba el tiempo aunque el canvas ya existia (falsos FAIL en t5a, t7b, t8).
- **Fix:** `waitCanvas` sondea con `locator.count()` cada 100 ms desde Node.
- **Commit:** `66e1d1f`

**4. [Rule 2 - Missing critical] Chequeos adicionales**
- t12 (el tercer id lanza y nombra el id) y t13 (ningun archivo de `src/gallery`, `assets`, `system.html` ni `tools` cambia contra el merge-base con master) en el stage tracer; c10 (favicon) en el stage chrome. Cubren decisiones del plan (D-08, restriccion dura, D-13) que no tenian chequeo.

**5. [Rule 1 - Bug] Extraccion del elemento LCP**
- Lighthouse 13 ya no trae la auditoria `largest-contentful-paint-element`; el elemento sale del insight `lcp-breakdown-insight`. `measure-home.mjs` lee primero ese y cae a la auditoria vieja. Se re-midio completo despues del arreglo (mismo hash de build), y las cifras de arriba son las de esa pasada.

**6. [Ajuste menor] Capturas a los 4 s**
- Grainient arranca casi plano en violeta y tarda unos 3 s en abrir el gradiente completo; la captura de desktop espera 4000 ms en lugar de 1200 ms para que muestre el hero como lo vera Juan.

### Disk pressure en el equipo

El disco del equipo quedo al 100 % (258 MiB libres, `/System/Volumes/Data` a 199 GiB de 228 GiB) a mitad de la ejecucion y el arnes de herramientas fallo con ENOSPC durante unos minutos. No lo causo este plan (los artefactos de este plan suman unos 3 MB). No borre nada ajeno. Conviene liberar espacio antes de las olas siguientes, que repiten Lighthouse y Playwright.

## Issues Encountered

- `humanizer`: las cadenas reescritas (subtitulos ES/EN del hero y aviso `noscript`) las revise a mano contra `research/voice-sample-juan.md` y la guia 4.1 (primera persona activa, sin voz pasiva, sin guiones largos, sin cifras), pero no invoque la skill `humanizer` como herramienta. 52-02 puede pasarla con el lint de copy.

## Known Stubs

Ninguno. El H1, los subtitulos, la navegacion y el pie son copy final. Un hueco conocido, no stub: los enlaces `#contacto`, `#casos` y `#servicios` aun no tienen destino porque las secciones llegan en 52-03 a 52-05 (`HomeSections` ya carga lo pendiente y hace `scrollIntoView` cuando exista el ancla).

## Threat Flags

Ninguna superficie nueva fuera del modelo de amenazas del plan. T-52-01 (`src/components/reactbits/` sin versionar: `git ls-files` no lista ninguno), T-52-02 (lista de destinos, chequeo c6), T-52-03 (0 peticiones externas, t9), T-52-04 (sin `/Users/` ni correos en los reportes) y T-52-SC (solo se agregaron scripts a `package.json`, ninguna dependencia) quedan mitigadas.

## Next Phase Readiness

- Contrato listo para 52-02 a 52-05: `Lang` exportado de `HomePage.tsx`, `copy/<nombre>.json` con `{ es, en }`, secciones en `src/home/sections/NN-nombre.tsx` con `export default ({ lang })`, `data-sections-ready`, `section[data-section]`, `[data-home-effect]` y `button[data-fx-pause]`. `HomeEffect id="terminal"` ya esta contemplado para la banda de 52-05.
- `verify-app.mjs --stage=report` fallara a proposito hasta la remedicion de 52-07 (el hash del build cambio). No se corrio `--stage=all` ni `--stage=report`.
- Antes de 52-07 conviene medir otra vez con `--label=final` y revisar el margen de LCP mobile (unos 120 ms).
- Revision humana pendiente (tarea 3): abrir `/` y `/en` en desktop y a 390 px y confirmar el aspecto del gradiente y del panel.

## Self-Check: PASSED

- Archivos creados y modificados: presentes en disco (21 creados, 4 modificados bajo `designs/redesign-v3/`).
- Commits `66e1d1f`, `7b439c4` y `d23db9e`: presentes en `git log`.
- `git diff --name-only 48e7857 HEAD` no lista nada fuera de `designs/redesign-v3/`.
