---
phase: 51-sistema-visual
plan: 01
subsystem: design-system
tags: [css-tokens, webgl, grainy-gradient, fonts, wcag-contrast, playwright]
requires: []
provides:
  - designs/redesign-v3/system.html (hero grainy, paleta, tipografia, espaciado, contraste)
  - tokens.css, base.css, effects.css (solo fx:grain), effects.js (slot unico, gates, shader grain)
  - fuentes autohospedadas con manifiesto y licencias
  - tools/verify-states.mjs (stages tracer, fonts, tokens), tools/contrast.mjs, reports/contrast.json
affects: [51-02, 51-03, 52, 53, 54, 55]
tech-stack:
  added: []
  patterns: [css-first-js-enhancement, single-canvas-slot, data-motion-data-saver-simulation]
key-files:
  created:
    - designs/redesign-v3/system.html
    - designs/redesign-v3/assets/css/tokens.css
    - designs/redesign-v3/assets/css/base.css
    - designs/redesign-v3/assets/css/effects.css
    - designs/redesign-v3/assets/css/system-doc.css
    - designs/redesign-v3/assets/js/effects.js
    - designs/redesign-v3/assets/fonts/Array-Regular.woff2
    - designs/redesign-v3/assets/fonts/Geist-latin-var.woff2
    - designs/redesign-v3/assets/fonts/GeistMono-400-latin.woff2
    - designs/redesign-v3/assets/fonts/GeistPixel-Square-upper.woff2
    - designs/redesign-v3/assets/fonts/LICENSES.txt
    - designs/redesign-v3/assets/fonts/fonts-manifest.json
    - designs/redesign-v3/tools/verify-states.mjs
    - designs/redesign-v3/tools/pairs.json
    - designs/redesign-v3/tools/contrast.mjs
    - designs/redesign-v3/reports/contrast.json
    - designs/redesign-v3/reports/shots/tracer-desktop.jpg
    - designs/redesign-v3/reports/shots/tracer-mobile.jpg
  modified: []
decisions:
  - "Pixel Label usa font-display swap, no optional: bajo file:// optional deja la pagina en Geist Mono para siempre"
  - "Sin link rel=preload de fuentes: con crossorigin fallan por CORS bajo file:// (3 errores de consola)"
  - "Fallback de fuentes con metricas medidas: Array size-adjust 92.63%, Geist 102.14%"
  - "U+00AD (guion blando) queda exento de la cobertura de Geist y Geist Mono: no existe en la fuente original"
requirements: [SYS-01, SYS-02, SYS-05]
status: complete
commits: 3
plan_head_before: 47d3d8da221a2dd80db7b791f20bf180f6ecf9d8
actuals:
  tokens: 33000
  tasks: 3
  commits: 3
metrics:
  completed: 2026-10-15
---

# Phase 51 Plan 01: Cimientos del sistema visual v3 Summary

Tracer del grainy gradient de punta a punta (fallback CSS mas shader WebGL original de un solo slot), cuatro tipografias autohospedadas con procedencia medida, tokens completos y una tabla de contraste WCAG de 48 pares calculada por script desde `tokens.css`.

## Que se construyo

**Tarea 1 (tracer, `d16a7a6`).**
- `system.html` con H1 real sobre `.fx-grain` y panel `.fx-content` con scrim.
- `effects.css` con el fallback delimitado por `fx:grain:start` y `fx:grain:end`: tres `radial-gradient` sobre tinta mas grano SVG `feTurbulence` en `overlay`, `min-height` fluido que reserva el espacio.
- `effects.js` (12.5 KB sin minificar, script clasico, sin `fetch` ni HTML como cadena): `window.FX` con `gates()`, `count()`, `active()`, `isPaused()`, `setPaused()`, `destroy()` y `demo()`, evento `fx:change`, registro `KINDS` para que el plan 02 sume tipos sin tocar el motor, montaje tras `load` + idle, `IntersectionObserver` unico (0.15), slot unico, 30 fps, DPR maximo 1.5, `MutationObserver` sobre `data-motion` y `data-saver`.
- Shader `grain` original (dos octavas de value noise sobre un campo diagonal, tres paradas, tinta dominante abajo a la izquierda, grano por pixel de +/- .06). Colores leidos de `tokens.css` con `getComputedStyle`; el GLSL no tiene hex.
- `tools/verify-states.mjs` con servidor `node:http` propio, prueba por http y por file://, stages registrados en un objeto, check `hygiene` en cada stage.

**Tarea 2 (`bb22098`).**
- Geist Sans variable 29,288 bytes (sin modificar), Geist Mono 400 recortada a 7,140 bytes, Pixel Label (Geist Pixel Square, mayusculas) 2,384 bytes. Array copiada sin modificar (cmp identico).
- `fonts-manifest.json` con bytes, sha256, origen, licencia, glifos, cobertura (`missing` vacio) y las metricas de fallback medidas con Playwright (ancho de una cadena fija a 100 px contra Arial) y `hhea` de fontTools.
- `LICENSES.txt` con OFL de Geist y de Geist Pixel mas la nota de Array. El OFL de geist-pixel-font no declara Reserved Font Name, asi que no se renombro la tabla `name`; el `font-family` publico es "Pixel Label".
- Plan B (Silkscreen) no fue necesario. fonttools 4.67.0 y Brotli solo en un venv temporal fuera del repo.

**Tarea 3 (`c09c6d6`).**
- Tokens completos (superficies elevadas, `--violet-text`, `--violet-text-raised`, `--focus`, escala tipografica, alturas de linea, `--measure`, `--tap`, radios, movimiento, `--dot`, `--grain-reading`).
- `pairs.json` con cinco grupos y 48 pares; `contrast.mjs` sin dependencias, resuelve alias `var()`, trunca a dos decimales hacia abajo, inyecta la tabla entre `contrast:start` y `contrast:end`, termina con codigo 1 si un par esperado falla o uno prohibido pasa.
- `system.html` con `#paleta` (14 swatches con `data-token` y `data-hex` mas franja `--grad`), `#tipografia`, `#espaciado` (barras y radios) y `#contraste`; `system-doc.css` solo para esa pagina.

## Verificacion (salidas reales)

| Comando | Resultado |
|---|---|
| `cmp -s src/fonts/Array-Regular.woff2 designs/redesign-v3/assets/fonts/Array-Regular.woff2` | identico |
| `verify-states.mjs --stage=tracer --shots` | 29 PASS, 0 FAIL |
| `verify-states.mjs --stage=fonts` | 52 PASS, 0 FAIL |
| `contrast.mjs` dos veces con `shasum` de system.html | idempotente (hash igual); 48 pares, 0 con problema, exit 0 |
| `verify-states.mjs --stage=tokens --shots` | 22 PASS, 0 FAIL |
| `verify-states.mjs --stage=all` (final) | 102 PASS, 0 FAIL |
| `git status --short src package.json package-lock.json pnpm-lock.yaml yarn.lock` | vacio |

Datos medidos relevantes:
- Desktop 1440 con `deviceScaleFactor: 2`: un solo canvas de 2160x945 sobre 1440x630 CSS (DPR efectivo 1.5), montado a 54 ms contra `loadEventStart` 29 ms.
- Sin JS, mobile 390 y 320, reduced-motion y saveData: cero canvas, fallback CSS visible, sin desborde horizontal (`scrollWidth` igual a `innerWidth` en 1440, 390 y 320).
- Cero errores de consola, cero respuestas 4xx y cero peticiones a origenes externos por http y por file://.
- Contraste (truncado): scrim peor caso de grano desde 6.76:1 (ambar) hasta 12.01:1 (violeta); `--violet-text` sobre tinta 4.55:1; `--violet-text-raised` sobre `--ink-top` 4.69:1; fosforo al 50% sobre tinta 4.56:1. Prohibidos fallan como se espera (paper sobre coral 3.07, paper sobre ambar 1.74, fosforo sobre ambar 1.51, fosforo sobre coral 2.65, violeta sobre tinta 3.20, quiet sobre violeta 2.70, quiet sobre scrim con ambar 3.12).
- Pesos: Array 20.8 KB, Geist 29.3 KB, Mono 7.1 KB, Pixel 2.4 KB. `effects.js` 12.5 KB sin minificar (el plan 02 mide minificado y gzip).
- Capturas abiertas y revisadas: `tracer-desktop.jpg` (gradiente con grano y H1 legible sobre scrim, tinta calmada abajo a la izquierda) y `tracer-mobile.jpg` (fallback CSS sin desborde). Tambien revise recortes de #paleta, #tipografia, #espaciado y #contraste a 1440 y 390 px.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pixel Label con `font-display: optional` nunca se aplicaba bajo file://**
- **Found during:** Tarea 3, revision visual de #tipografia.
- **Issue:** el plan pedia `optional` para la fuente pixel. Medi el ancho de la misma cadena en "Pixel Label" (336.06 px, igual que Geist Mono) contra una cara de control con la misma fuente en `block` (314.64 px): bajo `file://` la fuente llega despues del periodo de bloqueo y la pagina se queda en el fallback. `FontFace.status` decia `loaded`, asi que el stage `fonts` no lo detecta.
- **Fix:** `font-display: swap`, con comentario que documenta la medicion. Con `swap` mide 314.64 px por file:// y por http. Costo: un salto de layout de unos pocos pixeles en etiquetas cortas.
- **Files modified:** `designs/redesign-v3/assets/css/base.css`
- **Commit:** `c09c6d6`

**2. [Rule 3 - Blocking] Exencion de U+00AD en la cobertura de Geist y Geist Mono**
- **Found during:** Tarea 2.
- **Issue:** el requisito "Latin-1 completo" incluye el guion blando U+00AD (no imprimible), que no existe en la fuente original de Geist ni de Geist Mono.
- **Fix:** se registra como `exempt` en el manifiesto con la razon; `missing` queda vacio para el resto.
- **Commit:** `bb22098`

**3. [Rule 3 - Blocking] Resolucion de `playwright` desde un worktree**
- El worktree no tiene `node_modules`. El harness importa `playwright` y resuelve por la ruta ascendente hasta el `node_modules` del checkout principal (`.claude/worktrees/<id>` esta dentro del repo). No se instalo ni se toco nada.

### Otras decisiones

- **Worktree fast-forward:** el worktree nacio en `6e9b02a` y los commits de la fase 51 estaban en `master` (`47d3d8d`). Hice `git merge --ff-only master` antes de empezar (arbol limpio, ancestro directo). El ledger de commits parte de `47d3d8d`.
- **Sin `link rel=preload`:** probado y descartado, bajo file:// con `crossorigin` genera errores CORS en consola. El CLS de Array y Geist se cubre con las caras de fallback medidas.
- **Capturas de system.html completas** (`system-desktop.jpg` 657 KB, `system-mobile.jpg` 426 KB) las genera `--shots` en el stage tokens, pero no se versionaron: no estan en el plan y pesan. Se regeneran con `verify-states.mjs --stage=tokens --shots`.
- **Fuera de alcance, no ejecutado:** el prompt del orquestador prohibe tocar fuera de `designs/redesign-v3/` salvo este SUMMARY, asi que no actualice STATE.md, ROADMAP.md ni REQUIREMENTS.md, y no escribi en `.planning/WINDOWS.md`.

## Known Stubs

Ninguno. Los textos de system.html son documentacion final de esta fase; los componentes y efectos restantes los entrega el plan 02.

## Threat Flags

Ninguno nuevo. T-51-01 a T-51-04 mitigados: fuentes de origenes oficiales con sha256 verificado por el stage `fonts`; `effects.js` sin `innerHTML`, `fetch` ni `eval` (grep vacio); cero origenes externos; un canvas, 30 fps, DPR 1.5.

## Items para la revision humana de Juan

1. **Abrir `designs/redesign-v3/system.html` con doble clic** y confirmar que el gradiente animado en desktop se ve bien en GPU real. Yo solo pude probar con render por software de Chromium headless (el estado de LOW confidence de la investigacion sigue vigente).
2. **Pixel Label a 12 px se ve fino y casi como una mono clara:** la rejilla de pixeles solo se nota a tamanos grandes (a 72 px es evidente). Si Juan quiere que lo pixel se lea en etiquetas, conviene subirlas a 14 o 16 px o probar Silkscreen (plan B documentado).
3. **Margen justo en lectura:** `--quiet` sobre `--ink-raised` con grano de 8% y un punto del dot grid debajo da 4.52:1 (umbral 4.5). Cumple, pero sin holgura; si se sube `--dot` o el grano, falla.
4. **Zona calmada del shader:** la tinta domina abajo a la izquierda y el panel de texto vive ahi. Si el diseno de la home pone el texto en otra zona, hay que mover ese foco en el shader.
5. **Array es la fuente de los titulares con puntos redondeados:** se ve asi por diseno de la fuente; confirmar que es la intencion para H1 a 72 px.

## Self-Check: PASSED

- Archivos creados verificados en disco (18 de la lista `key-files`).
- Commits `d16a7a6`, `bb22098`, `c09c6d6` presentes en la rama `worktree-agent-adfdd4c0cf05b6955`.
- `git rev-list --count 47d3d8d..HEAD` devuelve 3 antes de este commit de documentacion.
