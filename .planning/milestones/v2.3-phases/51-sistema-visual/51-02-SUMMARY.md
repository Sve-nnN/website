---
phase: 51-sistema-visual
plan: 02
subsystem: design-system
tags: [css-fallbacks, webgl, single-canvas-slot, react-bits-catalog, weight-budgets, wcag-2.2.2]
requires: [51-01]
provides:
  - effects.css con 15 efectos delimitados por fx:NAME (fallback visible sin JS)
  - effects.js con slot unico, shaders halftone, crt y slats, ticker ASCII, pausa, spotlight, reveal y puerta de lectura
  - system-demo.js, galeria #efectos, secciones #catalogo y #pesos
  - tools/catalog.json, tools/weight.mjs, reports/weights.json
  - stages fallbacks y effects en tools/verify-states.mjs
affects: [51-03, 52, 53, 54, 55]
tech-stack:
  added: []
  patterns: [css-first-js-enhancement, single-canvas-slot, opt-in-demo-by-button, reading-surface-gate, measured-weight-budgets]
key-files:
  created:
    - designs/redesign-v3/assets/js/system-demo.js
    - designs/redesign-v3/assets/img/sample-halftone.svg
    - designs/redesign-v3/tools/catalog.json
    - designs/redesign-v3/tools/weight.mjs
    - designs/redesign-v3/reports/weights.json
    - designs/redesign-v3/reports/shots/fallbacks-desktop.jpg
    - designs/redesign-v3/reports/shots/fallbacks-mobile.jpg
    - designs/redesign-v3/reports/shots/demo-grain.jpg
    - designs/redesign-v3/reports/shots/demo-waves.jpg
    - designs/redesign-v3/reports/shots/demo-crt.jpg
    - designs/redesign-v3/reports/shots/demo-slats.jpg
  modified:
    - designs/redesign-v3/assets/css/effects.css
    - designs/redesign-v3/assets/css/tokens.css
    - designs/redesign-v3/assets/css/system-doc.css
    - designs/redesign-v3/assets/js/effects.js
    - designs/redesign-v3/system.html
    - designs/redesign-v3/tools/pairs.json
    - designs/redesign-v3/tools/verify-states.mjs
    - designs/redesign-v3/reports/contrast.json
decisions:
  - "Un efecto por tramo fx:NAME; el CSS compartido (.fx-content, .fx-canvas) pasa a un tramo fx:core fuera de los topes por efecto"
  - "Solo grain se monta en automatico; waves, crt y slats son demos por boton; los adicionales no agregan shader"
  - "saveData tambien enciende data-saver=on para que el CSS apague el movimiento"
  - "Los tokens --spot y --dither-25/50/75 viven en tokens.css (un data URI no admite var())"
requirements: [SYS-03, SYS-04, SYS-05]
status: complete
commits: 3
plan_head_before: 9b5ebaca12f93d766f1bf55fda15448d93113ccb
actuals:
  tokens: 36000
  tasks: 3
  commits: 3
metrics:
  completed: 2026-10-15
---

# Phase 51 Plan 02: Efectos, motor de slot unico y catalogo medido Summary

Quince efectos con fallback CSS visible sin JavaScript, motor de slot unico con tres shaders originales como demos opt-in, ticker ASCII en DOM, pausa de movimiento (WCAG 2.2.2), superficies de lectura inertes y catalogo de 17 filas verificado en linea contra reactbits.dev con peso medido por efecto.

## Que se construyo

**Tarea 1 (`1d9eadb`): fallbacks CSS y galeria.**
- `effects.css` (13.1 KB crudos, 3337 B gzip) con un tramo `fx:NAME` por efecto: grain, waves, crt, slats, pixel, ascii, noise (con variante viva), dither (Bayer 4x4 en tres bandas), blinds, reveal, transition, spotlight, star, dotgrid y reading, mas `fx:core`.
- Todo movimiento vive en `@media (prefers-reduced-motion: no-preference)` y bajo `:root:not([data-motion="reduced"]):not([data-saver="on"])`. Solo `transform` y `opacity`, salvo `--star-angle` registrada con `@property`. Ningun bucle dura menos de 1 s.
- `system.html`: seccion `#efectos` con parrafo de reglas, boton local `Pausar animaciones` y 15 tarjetas `article[data-effect]` en "Efectos pedidos" (6) y "Adicionales del scout" (9). Cada una con nombre exacto de origen, etiqueta "Fallback CSS siempre visible" y, en grain, waves, crt y slats, boton de demo oculto y `p[role=status]`.
- `assets/img/sample-halftone.svg` (640x400, sin texto), pares de contraste del spotlight en `pairs.json` (51 pares, 0 problemas) y tokens `--spot`, `--dither-25`, `--dither-50`, `--dither-75`.

**Tarea 2 (`788649c`): motor.**
- `effects.js` reescrito de forma compacta (16.0 KB, 5591 B gzip). API de 51-01 intacta; agrega `FX.bindPause`, `FX.scan` y `FX.motionGates`.
- Shaders originales `halftone` (celdas de 8 px con onda diagonal y vineta), `crt` (barril `1+.08*dot(c,c)`, plasma cuantizado, scanlines, mascara de fosforo) y `slats` (columnas de 10 px con campo ondulado y crestas ambar). Sin GLSL de React Bits.
- `FX.demo` alterna, destruye cualquier efecto activo (incluido el grain del hero) y tiene prioridad sobre el montaje automatico hasta que se apaga, sale del viewport o falla un gate. Ignora ancho y puntero, respeta reduced-motion, data-motion, saveData y data-saver.
- Ticker ASCII a 10 fps con `textContent`, spotlight con `rAF`, reveal con `.is-pending` a `.is-in`, pausa con `aria-pressed`, `sessionStorage` y reaccion a atributos puestos desde fuera. Nada dentro de `[data-surface="reading"]` se registra ni monta.
- `system-demo.js`: delegacion de eventos; la region de estado dice la demo activa y "N de 1 canvas permitido", o el motivo del bloqueo.

**Tarea 3 (`7a74fd9`): catalogo y pesos.**
- `catalog.json`: 17 filas (8 de investigacion, 8 del scout, Dot Grid como mencion), 9 excluidos documentados sin implementacion, vecinos, fuentes, licencia y presupuestos.
- `weight.mjs`: raw, gzip 9 y brotli 11 con `node:zlib`, tramos por marcador, tablas inyectadas entre `catalog:` y `weights:`, idempotente, `--online` verifica nombre, ruta, registro 200 y dependencias de las 17 filas y guarda `verifiedAt` (2026-10-15).

## Verificacion (salidas reales)

Condicion de fallo del harness (`verify-states.mjs`): cada check imprime `PASS` o `FAIL`; el proceso termina con codigo 1 si hay al menos un `FAIL`, 2 si el stage no esta registrado. Agregue la linea final `RESULT: PASS|FAIL (exit N)` para que sea explicito. `weight.mjs` termina con 1 si un presupuesto o tope por efecto se excede, faltan marcadores o la verificacion `--online` falla (nunca pasa en silencio). `contrast.mjs` termina con 1 si un par esperado falla o uno prohibido pasa.

| Comando | Resultado |
|---|---|
| `contrast.mjs` | 51 pares, 0 con problema, exit 0 |
| `verify-states.mjs --stage=fallbacks --shots` | 35 PASS, 0 FAIL |
| `verify-states.mjs --stage=effects --shots` | 48 PASS, 0 FAIL |
| `weight.mjs --online` | 17 nombres, rutas, registros 200 y dependencias coinciden; exit 0 |
| `weight.mjs` segunda corrida + `shasum system.html` | hash identico (idempotente), exit 0 |
| `verify-states.mjs --stage=all` | 183 PASS, 0 FAIL, exit 0 |
| `git status --short src package.json package-lock.json pnpm-lock.yaml yarn.lock` | vacio |

Datos medidos relevantes:
- Cobertura de `.fx-slats`: 71.1 % de pixeles a mas de 40 de distancia RGB de la tinta (umbral 40 %).
- `document.getAnimations()`: 5 con movimiento permitido (waves, crt, noise viva, slats, star), todas infinitas y de 1 s o mas; 0 con reduced-motion, con `data-motion="reduced"` y con `data-saver="on"`; 0 dentro de la superficie de lectura.
- Slot unico: sondeo cada 100 ms durante 1500 ms, siempre 1 canvas; crt, slats y grain reemplazan al anterior; repetir la demo activa deja 0. A 390 px el montaje automatico deja 0 canvas; una demo explicita monta 1.
- Pausa: `aria-pressed`, `data-motion="reduced"` y `FX.count()` en 0; al soltar el canvas del hero vuelve en menos de 2000 ms; persiste al recargar. Atributos externos: 0 canvas en 500 ms y vuelta del hero en 2000 ms.
- Pesos (gzip, sin minificar): effects.js 5591 de 5632; effects.css 3337 de 6144; CSS del kit 5897 de 14336; JS mas CSS 11488 de 24576; fuentes 59644 B crudos de 65536. Costo por efecto (CSS mas JS) entre 155 B (Dot Grid) y 998 B (CRTWarp), tope 2048 B.
- Pesos de registro verificados en linea (gzip de los archivos): Noise 3258, Dither 7055, Halftone Reveal 8569, Pixel Transition 4452, Faulty Terminal 8717, Spotlight Card 3570, Gradient Blinds 6155, Star Border 6220, Dot Grid 6149; coinciden con las cotas del scout.
- Capturas abiertas y revisadas: `fallbacks-desktop.jpg`, `fallbacks-mobile.jpg` (sin JS), las cuatro `demo-*.jpg` (shaders reales corriendo) y recortes de `#catalogo` y `#pesos`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Selector `.fx-grain` ambiguo en el stage tracer de 51-01**
- **Found during:** Tarea 3, corrida `--stage=all`.
- **Issue:** la tarjeta de grano de la galeria agrego un segundo `.fx-grain` y `page.locator('.fx-grain')` fallo por strict mode.
- **Fix:** `page.locator('.fx-grain[data-fx]')`, mismo check y misma condicion.
- **Commit:** `7a74fd9`

**2. [Rule 1 - Bug] Check de recursos externos marcaba enlaces `<a href>` de documentacion**
- **Found during:** Tarea 3. La tabla del catalogo enlaza a reactbits.dev, como pide el plan ("URL como enlace").
- **Issue:** la regex de `tokens` trataba cualquier `href="https:"` como carga externa.
- **Fix:** en HTML la regla ahora mira solo `script`, `link`, `img`, `iframe`, `source`, `video`, `audio`, `embed` y `object`; `url()`, `@import` y CSS/JS quedan igual. Es un refinamiento al nombre del check ("script src, link href, url()"), no una relajacion de las cargas.
- **Commit:** `7a74fd9`

**3. [Rule 1 - Bug] Reveal roto por MIME en el servidor del harness**
- **Found during:** revision visual de la primera captura: la imagen del reveal mostraba solo el `alt`.
- **Issue:** el servidor estatico del harness no mapeaba `.svg`.
- **Fix:** `'.svg': 'image/svg+xml'` en `MIME`. Bajo `file://` y en servidores reales no ocurria.
- **Commit:** `1d9eadb`

**4. [Rule 1 - Bug] Transicion pixel con detalle sobre la portada**
- **Found during:** revision visual: el texto de detalle se veia sobre el gradiente de la portada (z-index equivalentes).
- **Fix:** portada `z-index: 3`, tablero `2`, detalle `1`; el detalle vive sobre `--ink-raised`, no sobre el gradiente. Enlaces dentro de `.fx-content` en papel y el de detalle en `--violet-text-raised`.
- **Commit:** `1d9eadb`

### Cambios al alcance de archivos

- **`tokens.css`, `system-doc.css`** no estaban en `files_modified`. Hizo falta `--spot` (la capa rgba del contraste del spotlight se resuelve por token), `--dither-25/50/75` (un data URI no admite `var()`, el hex vive en el unico archivo permitido) y los estilos de galeria, que son solo de documentacion.
- **Capturas extra** `demo-grain|waves|crt|slats.jpg` en `reports/shots/`: evidencia visual de que los shaders compilan y corren (el stage solo comprobaba `FX.active()`).
- **Prueba de pausa:** el plan pide "al soltarlo vuelve el canvas del hero", pero el boton de la galeria esta lejos del hero. El harness hace el ciclo con `click()` programatico con el hero visible y, aparte, un clic real desde la galeria (aria-pressed, persistencia al recargar).
- **`effects.js` compactado:** reescribi el archivo de 51-01 sin comentarios largos para entrar en 5632 B gzip. La API publica y el comportamiento de 51-01 no cambian (el stage tracer pasa igual).
- **`.fx-ascii`** lleva `box-shadow: inset 0 0 0 1px` como marco: el stage exige que la vista previa se pinte con `background-image`, `box-shadow` o `mask-image` y el `pre` solo tenia color de fondo.

## Known Stubs

Ninguno. El ASCII y los textos de las tarjetas son contenido de documentacion final. Los efectos de produccion los consumen las fases 52 a 55.

## Threat Flags

Ninguno nuevo. T-51-05 mitigado (`effects.js` y `system-demo.js` solo usan `textContent`, `setAttribute` y custom properties numericas; sin `innerHTML`, `fetch` ni `eval`). T-51-06 (slot unico, 30 fps, DPR 1.5, ticker a 10 fps, destruccion fuera del viewport y con la pestana oculta). T-51-08 (GLSL y CSS escritos desde cero, sin abrir fuentes de React Bits; los nueve excluidos no existen como clase, tipo ni tarjeta). T-51-09 (bucles de 1 s o mas verificados en el harness, parpadeo CRT solo de opacidad entre .92 y 1 cada 6 s, boton de pausa visible).

## Items para la revision humana de Juan

1. **Abrir `system.html` en un navegador con GPU real** y activar las cuatro demos. Solo probe con render por software de Chromium headless; los shaders compilan y se ven bien en capturas, pero el rendimiento en GPU real sigue sin medirse.
2. **Revisar `reports/shots/fallbacks-desktop.jpg` y `fallbacks-mobile.jpg`, y abrir la pagina con JavaScript desactivado.** Decidir si el fallback de cada efecto se parece lo suficiente al original de React Bits (Star Border es una aproximacion: anillo orbitando, no una estrella que recorre el contorno).
3. **Holgura minima en presupuesto:** `effects.js` pesa 5591 B de 5632 B gzip. Cualquier agregado de plan 03 o de la fase 52 lo excede; hay que subir el tope o minificar en produccion. Los topes son valores de diseno que Juan puede revisar.
4. **Lectura:** `--quiet` sobre `--ink-raised` con grano de 8 % y un punto del dot grid da 4.52:1 (umbral 4.5). Cumple sin holgura.
5. **El boton "Pausar animaciones" de la cabecera** y el simulador de reduced-motion y saveData los coloca el plan 03; por ahora solo existe el boton local de la galeria.
6. **ASCII a 12 px:** el campo de 44 columnas se recorta en cards de 22 rem en mobile (por diseno, `overflow: hidden`); confirmar que la textura se lee bien igual.

## Self-Check: PASSED

- Archivos listados en `key-files` verificados en disco.
- Commits `1d9eadb`, `788649c`, `7a74fd9` presentes en la rama `worktree-agent-ac8ce7b51e0996e47`.
- `git rev-list --count 9b5ebac..HEAD` devuelve 3 antes del commit de documentacion.
