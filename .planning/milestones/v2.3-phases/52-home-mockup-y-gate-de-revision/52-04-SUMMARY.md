---
phase: 52-home-mockup-y-gate-de-revision
plan: 04
subsystem: designs/redesign-v3/app (secciones de método de la home)
tags: [home, servicios, auditor, about, oferta, faq, copy, a11y, d-05, d-10]
requires: ["52-01", "52-02"]
provides:
  - "Secciones 05-servicios, 06-auditor, 07-about, 09-oferta y 10-faq (ES y EN)"
  - "Copy en cinco JSON que pasan check-copy.mjs sin FAIL ni WARN"
  - "abbr.tsx: abbrNodes, siglas con <abbr> en su primera aparición por sección"
  - "Stage method del harness (36 chequeos) y capturas method-desktop y method-mobile"
affects: [52-07]
key-files:
  created:
    - designs/redesign-v3/app/src/home/sections/05-servicios.tsx
    - designs/redesign-v3/app/src/home/sections/06-auditor.tsx
    - designs/redesign-v3/app/src/home/sections/07-about.tsx
    - designs/redesign-v3/app/src/home/sections/09-oferta.tsx
    - designs/redesign-v3/app/src/home/sections/10-faq.tsx
    - designs/redesign-v3/app/src/home/copy/servicios.json
    - designs/redesign-v3/app/src/home/copy/auditor.json
    - designs/redesign-v3/app/src/home/copy/about.json
    - designs/redesign-v3/app/src/home/copy/oferta.json
    - designs/redesign-v3/app/src/home/copy/faq.json
    - designs/redesign-v3/app/src/home/styles/method.css
    - designs/redesign-v3/app/src/home/abbr.tsx
    - designs/redesign-v3/app/scripts/home-stages/method.mjs
    - designs/redesign-v3/reports/home/method-desktop.jpg
    - designs/redesign-v3/reports/home/method-mobile.jpg
key-decisions:
  - "Preguntas de la FAQ con signos de interrogación (valor por defecto de D-07, supuesto revisable en el gate)"
  - "Precio de 600 USD acreditables en la home, permitido por D-05 porque el brief lo exige (supuesto revisable)"
  - "Enlace único por tarjeta de servicio en el h3; la etiqueta Explorar servicio queda como texto visible fuera del enlace"
requirements-completed: [HOME-01, HOME-03]
status: complete
commits: 3
plan_head_before: 46bbe5343cf259e07b6f911e690dd83a6a49fb2f
actuals:
  tokens: 21000
  tasks: 3
  commits: 3
metrics:
  completed: 2026-10-15
---

# Phase 52 Plan 04: Servicios, auditor, about, oferta y FAQ Summary

Cinco secciones de la home en ES y EN: cuatro servicios con enlace a su página, el auditor propio con sus cuatro datos, un about que explica criterio sin folleto, la oferta de auditoría de 600 USD acreditables y una FAQ de lectura con `details` nativos.

## Verificación

- `node scripts/check-copy.mjs` sobre los cinco JSON: `fail=0 warn=0`, salida 0. Sin ninguna entrada `_allow` (cero excepciones usadas).
- `npm run build` (typecheck más Vite): verde.
- `node scripts/verify-home.mjs --stage=method --shots`: **36 PASS, 0 FAIL** (m1 a m16 en ES y EN, incluido 0 peticiones externas y 0 errores de consola).
- Capturas `method-desktop.jpg` (341 KB) y `method-mobile.jpg` (286 KB) abiertas y revisadas: el texto del gradiente queda en `.fx-content` y se lee; sin desbordes.
- `git diff --name-only 46bbe53 HEAD` fuera de `designs/redesign-v3/`: vacío (sin cambios en `src/`, `package.json` raíz, lockfiles, Payload ni DB). Sin paquetes nuevos.

## Afirmaciones retiradas del about (T-52-07)

| Frase del repo o del sitio vivo | Motivo | Reemplazo |
|---|---|---|
| "Mi metodología parte de auditar antes de construir" | Folleto | "Empiezo por auditar antes de construir, así sé qué infraestructura necesita el sitio" |
| "la infraestructura técnica se vuelve el motor principal del crecimiento orgánico" | Promesa sin dato | Retirada |
| "tu web ... gana terreno real en los resultados de búsqueda" | Promesa de resultado | Retirada |
| "Mi obsesión es el 100/100" | Cifra sin medición | Acción medible: mido LCP, INP y CLS en campo y laboratorio, más `[PENDIENTE: dato medido de un proyecto propio, con fecha y herramienta]` |
| "la carga se sienta prácticamente inmediata" | Adjetivo sin dato | Retirada (la cifra queda como pendiente) |
| "Auditoría profunda ... para mejorar la visibilidad" | Adjetivo suelto | "Reviso el rastreo, el renderizado y los datos estructurados ... y corrijo en el código lo que impide que Google indexe tus páginas" |

Pendientes visibles en el about: retrato, foto y el dato medido de rendimiento (3 en cada idioma). Cifras permitidas con fuente en `_numbers`: 29, 5, 500, 1 (auditor), 600 y 10 (oferta).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reglas globales de la galería rompían las tarjetas con gradiente**
- **Found during:** revisión de capturas (Tarea 3)
- **Issue:** `src/styles/app.css` (galería) declara `.card` con fondo plano, `display: grid`, `height: 100%` y radio 8 px, y llega después de `effects.css`. El gradiente `.fx-grain` quedaba tapado: el auditor y la oferta salían como paneles grises. Mismo origen que el hallazgo del pie en 52-01.
- **Fix:** `method.css` restaura el fondo del kit (con tokens, sin hex), el `display` y el radio para `.hm-block .card`, sin tocar `app.css`. Verificado con captura del auditor.
- **Commit:** 25f95f2

**2. [Rule 3 - Blocking] Archivo extra `src/home/abbr.tsx`**
- **Issue:** el plan exige `abbr` en la primera aparición de siglas, pero `ui.tsx` (de 52-02, no editable) no lo ofrece y el copy es JSON plano.
- **Fix:** `abbrNodes` (función pura, no componente, para que StrictMode dé el mismo resultado) y listas `abbrs` por idioma en `about.json`. Dentro de `designs/redesign-v3/app/`.
- **Commit:** 7673021

**3. [Ajuste de alcance] Tres commits agrupados por archivo, no por tarea**
- `method.css` y `method.mjs` se escribieron una vez para las tres tareas y se comitearon con la última; los commits se agrupan en servicios y auditor, about y oferta, FAQ más estilos, stage y capturas.

**4. [Ajuste menor] Chequeos añadidos al stage:** m2b (títulos), m8b (siglas con abbr), m9b (texto de la oferta dentro de `.fx-content`) y m10 (EN sin bloques en español, descontando los pendientes que son anotaciones en español con `lang="es"`).

## Fuera de alcance (deferred)

`check-copy.mjs` sobre toda la carpeta `copy/` reporta fallos en archivos de 52-01 que no toqué: `footer.json` V07 (cifra 2026 sin entrada en `_numbers`, ES y EN) y `page.json` V13 (`en.meta.title` en Title Case). 52-01 los debe corregir o el lint global de 52-07 fallará.

## Decisiones de Juan que surgieron (gate)

1. FAQ con signos de interrogación `¿?` (D-07, valor por defecto).
2. Precio de 600 USD acreditables visible en la home (D-05, el brief lo exige).
3. Tarjetas de servicio con la etiqueta "Explorar servicio" como texto, no como segundo enlace.
4. Siglas en el about con `abbr` y tooltip; si prefiere el texto limpio, se quitan las listas `abbrs`.
5. El enlace "Todos los servicios" apunta a `/servicios` y `/en/services` del sitio vivo (no verificado que respondan, igual que los otros destinos del sitio vivo).

## Known Stubs

Ninguno. Los tres `[PENDIENTE: ...]` del about son pendientes de dato exigidos por D-05, no stubs de código.

## Threat Flags

Ninguno. T-52-02 (SafeLink y V14, `rel` con `noopener noreferrer` verificado en m3), T-52-03 (0 peticiones externas) y T-52-07 mitigadas.

## Self-Check: PASSED

- Archivos: los 15 creados existen (sections 05, 06, 07, 09, 10; cinco JSON; method.css; abbr.tsx; method.mjs; dos capturas).
- Commits b55f828, 7673021 y 25f95f2 presentes en `git log`.
