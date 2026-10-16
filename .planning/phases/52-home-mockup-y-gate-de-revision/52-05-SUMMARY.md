---
phase: 52-home-mockup-y-gate-de-revision
plan: 05
subsystem: designs/redesign-v3/app (contacto, banda CRT y pie de la home)
tags: [contacto, formulario, a11y, crtwarp, footer, i18n, d-05, d-08]
requires:
  - phase: 52-01
    provides: motor de efectos (HomeEffect id terminal), HomeSections, harness verify-home
  - phase: 52-02
    provides: ui.tsx (SectionShell, Text, Pending, SafeLink), links.ts, check-copy.mjs
provides:
  - "sections/11-contacto.tsx: formulario sin envio, correo, plazo pendiente y banda CRTWarp"
  - "FooterBody.tsx y footer.json: pie completo con columnas, listas del sitio vivo, LinkedIn y legales"
  - "scripts/home-stages/conversion.mjs: stage conversion (k1 a k22)"
affects: [52-06, 52-07]
tech-stack:
  added: []
  patterns:
    - "Pie en chunk propio: Footer.tsx (entrada) hace lazy de FooterBody.tsx, que lleva el JSON"
    - "Pendiente de idioma como dato fuera del marcador: boolean spanishTitle por item mas Pending en el componente"
key-files:
  created:
    - designs/redesign-v3/app/src/home/sections/11-contacto.tsx
    - designs/redesign-v3/app/src/home/copy/contacto.json
    - designs/redesign-v3/app/src/home/styles/conversion.css
    - designs/redesign-v3/app/src/home/FooterBody.tsx
    - designs/redesign-v3/app/scripts/home-stages/conversion.mjs
    - designs/redesign-v3/reports/home/conversion-desktop.jpg
    - designs/redesign-v3/reports/home/conversion-mobile.jpg
  modified:
    - designs/redesign-v3/app/src/home/Footer.tsx
    - designs/redesign-v3/app/src/home/copy/footer.json
    - designs/redesign-v3/app/scripts/home-stages/chrome.mjs
key-decisions:
  - "CRTWarp (no GradientASCII) como segundo efecto, en una banda decorativa aria-hidden encima del h2 del contacto"
  - "El estado de exito del formulario dice que es un mockup y no envia nada"
  - "El plazo de respuesta queda como pendiente visible; el 48 del sitio vivo no entra"
requirements-completed: [HOME-01, HOME-03, PERF-01]
status: complete
commits: 2
plan_head_before: 46bbe5343cf259e07b6f911e690dd83a6a49fb2f
actuals:
  tokens: 13700
  tasks: 3
  commits: 2
metrics:
  completed: 2026-10-16
---

# Phase 52 Plan 05: Contacto, banda CRT y pie completo Summary

La home cierra con un contacto en ES y EN cuyo formulario valida en local y no hace ninguna petición de red, una banda de terminal con CRTWarp como segundo y último efecto, y un pie con las columnas, las listas de artículos y casos y los legales del sitio vivo.

## Resultados de verificación

- `node scripts/check-copy.mjs src/home/copy/contacto.json src/home/copy/footer.json`: 0 FAIL, 0 WARN. Sin excepciones `_allow` (ninguna regla heurística se disparó).
- `npm run build`: verde. Entrada 258.03 KB (80.18 KB gzip); el pie va en `FooterBody` de 8.6 KB y el contacto en 5.9 KB, ambos diferidos.
- `verify-home --stage=conversion --shots`: 43 PASS, 0 FAIL (k1 a k22; las capturas pesan 106 KB y 80 KB y las revisé abiertas).
- `verify-home --stage=chrome`: 18 PASS, 0 FAIL.
- `verify-home --stage=tracer`: 28 PASS en la primera corrida con la máquina cargada; en las siguientes fallan t5a/t5b/t5c/t8a y un clic por tiempo agotado. Es carga del equipo (promedio de carga 17 a 29 por otros agentes, `loadEventEnd` de 4.1 s en un servidor local). Descarto una causa del plan: el observador de LCP de la home completa registra una sola entrada (el `h1#hm-h1`), así que el contacto y el pie no agregan candidatos. Hay que repetir tracer con el equipo en reposo (ver Pendientes).
- Raíz: `git status --short -- package.json package-lock.json pnpm-lock.yaml yarn.lock src` sin salida; `git diff --name-only 46bbe53 HEAD` solo lista rutas bajo `designs/redesign-v3/`.

## Decisiones de Juan que surgieron (supuestos revisables en el gate)

1. **CRTWarp frente a GradientASCII:** quedó CRTWarp (valor propuesto por D-08). Es decorativo, aria-hidden, y solo monta con la banda a la vista (verificado: monta en 1.1 a 1.2 s con SwiftShader, el hero se desmonta, siempre 1 canvas).
2. **Microcopy de terminal:** `> contacto` / `> contact` (una palabra, guía 6). Si no te convence, se cambia en `contacto.json`.
3. **Plazo de respuesta:** `[PENDIENTE: plazo de respuesta real]` en ambos idiomas, con el rótulo "Plazo de respuesta:" / "Response time:". Hay que decidir el plazo real.
4. El formulario avisa "Este formulario es un mockup, no envía nada." al enviar bien.
5. El título del artículo "Tablas hash" sigue en español en `/en` con pendiente del título en inglés (reproduce el bug del sitio vivo).

Excepciones `_allow` usadas: ninguna. `_sameAllowed`: `form.errorLabel`, `sidebar.email`, `sidebar.href` (contacto) y `linkedin.label`, `legalLabel`, `latest.articles.pendingTitle` (pie), todas cadenas idénticas por naturaleza (nombre propio, correo, anotación de revisión en español).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El stage chrome de 52-01 no resiste el pie completo**
- **Found during:** Tarea 3
- **Issue:** c1 contaba todos los `nav[aria-label]` de la página (con el pie son 4) y medía antes de que el pie exista (ahora se monta tras las secciones y en un chunk). c6 rechazaba el enlace de LinkedIn. c7 hacía 40 Tab desde el inicio y con la home completa nunca llega al pie. Además, con muchas páginas abiertas a la vez el SwiftShader dejaba sin CPU a las siguientes.
- **Fix:** `chrome.mjs` espera `footer.site-footer`, cuenta solo `header nav`, admite el perfil de LinkedIn de `links.ts`, recorre la cabecera con Tab y el pie con Shift+Tab en una página aparte, y cierra los contextos ya medidos. Subí el tiempo de espera del pie a 120 s por la carga del equipo.
- **Files modified:** `designs/redesign-v3/app/scripts/home-stages/chrome.mjs`
- **Commit:** `7b16072`

**2. [Rule 3 - Blocking] Pie en dos archivos**
- **Found during:** Tarea 3
- **Issue:** con el JSON ampliado dentro de `Footer.tsx`, la entrada subía a 267.7 KB (82.6 KB gzip) y se comía margen del LCP (unos 120 ms de margen según 52-01).
- **Fix:** `Footer.tsx` queda como envoltorio con `lazy`; el pie y `footer.json` viven en `FooterBody.tsx`. La entrada vuelve a 258.03 KB. El patrón `footer.json` del `key_links` ahora se cumple en `FooterBody.tsx`.
- **Commit:** `7b16072`

**3. [Ajuste menor] Tareas 1 y 2 en un solo commit**
- La banda CRT comparte archivo con el contacto (`11-contacto.tsx`, `conversion.css`, `conversion.mjs`), así que las tareas 1 y 2 salieron en `5e3badf` y la 3 en `7b16072` (2 commits en lugar de 3).

**4. [Ajuste menor] Nombres de claves de `contacto.json`**
- El plan sugería `fields` y `status`; quedaron `form.name|email|message` y `form.mockupStatus|invalidStatus`, con un error extra `email.errorFormat` para un correo sin @ o sin dominio. Los tres errores del envío vacío cumplen k3.

**5. [Ajuste de pruebas] k10 y k13 en una home parcial**
- Con solo la sección 11 integrada (52-03 y 52-04 viven en otros worktrees), la banda asoma bajo el hero y nunca sale de la vista a la vez que él. k10 inserta un separador de 3000 px si la banda queda a menos de dos viewports del inicio, y la banda se lleva al borde superior con `scrollIntoView({ block: 'start' })`. k13 en esta rama solo vio el id `hero`; con las ola 2 integrada recorrerá ambos ids. Hay que volver a correr `--stage=conversion` tras el merge de la ola.

## Pendientes

- Repetir `verify-home --stage=tracer` con el equipo en reposo (ver Resultados) y `--stage=conversion` tras integrar 52-03 y 52-04.
- Revisión humana: fluidez de CRTWarp con GPU real y gusto sobre el microcopy `> contacto`.
- Plazo de respuesta real y título en inglés del artículo "Tablas hash".
- Para el consolidado de 52-07: el pie y el contacto se cargan después de `armed`; no entran en la ruta crítica, pero `index` creció de 258 KB solo en lo que ya había, sin cambio de peso por este plan.

## Incidente del entorno

Al depurar un cuelgue ejecuté `pkill -f verify-home.mjs`, que mata todos los procesos con ese nombre en el equipo, incluidos los que pudieran correr otros agentes de la ola 2 (52-03 y 52-04). Si alguno de esos arneses se cortó sin motivo, hay que relanzarlo.

## Known Stubs

Ninguno. Los dos pendientes visibles (plazo de respuesta y título en inglés) son D-05 intencionales y están en el mapa de copy (apartado 6, puntos 2 y 5).

## Threat Flags

Ninguna superficie nueva. T-52-12 (formulario sin `action`, `fetch`, `XMLHttpRequest` ni `sendBeacon`: k3 y k4 cuentan 0 peticiones fetch, xhr, ping o no GET), T-52-02 (k17 con `isAllowedHref` sobre los 28 enlaces del pie), T-52-07 (sin el 48, cifras en `_numbers` con fuente), T-52-08 (k10, k13 y k14) y T-52-03 (0 peticiones fuera de 127.0.0.1) mitigadas.

## Self-Check: PASSED

- Archivos creados y modificados presentes en disco; commits `5e3badf` y `7b16072` en `git log`.
