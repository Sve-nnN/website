---
phase: 54-paginas-de-conversion-y-utilidad
plan: 01
subsystem: ui
tags: [nextjs-15, global-not-found, next-intl, mui, 404, seo, preview]

requires:
  - phase: 53-base-del-redise-o-rama-preview-tema-y-shell
    provides: shell MUI (header, footer, Providers, useMotion), preview de solo lectura en dev.juan-tech.com, scripts 53-*
provides:
  - 404 con estado HTTP real y shell completo en el HTML para toda URL sin ruta, en ES y EN
  - SiteDocument, documento html compartido por el layout de [locale] y global-not-found
  - GrainBlob, UL y OL, linkFor y NotFoundView listos para el resto de la fase
  - 54-notfound-status.mjs con modos selftest, spawn, wait y live
  - ciclo empujar, desplegar y verificar probado contra el preview
affects: [54-02, 54-03, 54-07, 54-11, 54-12, 54-15, 54-16, 55, 57]

plan_head_before: 868bea20801f04d449cb75e7a841f3af82905af3
actuals:
  tokens: 9100
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "global-not-found.tsx (experimental.globalNotFound) para la 404 de URL sin ruta con raiz de layout en segmento dinamico"
    - "SiteDocument: un solo documento html compartido por dos raices que Next trata por separado"
    - "Contrato de 404 en dos niveles: shell completo en URL sin ruta, 404 y noindex en paginas que llaman notFound()"

key-files:
  created:
    - src/app/global-not-found.tsx
    - src/app/(frontend)/[locale]/not-found.tsx
    - src/components/shell/SiteDocument.tsx
    - src/components/pages/NotFoundView.tsx
    - src/components/mui/GrainBlob.tsx
    - src/components/mui/lists.tsx
    - src/components/mui/links.ts
    - scripts/verify/54-notfound-status.mjs
  modified:
    - src/app/(frontend)/[locale]/layout.tsx
    - next.config.mjs
    - messages/es.json
    - messages/en.json

key-decisions:
  - "La 404 de URL sin ruta se sirve con global-not-found.tsx y no con un catch-all [...rest]: en Next 15.4.11 un notFound() de pagina o de catch-all devuelve 404 pero el HTML del servidor es un documento de error vacio"
  - "El documento html (providers, header, main, footer) sale de SiteDocument, compartido por el layout y global-not-found"
  - "[locale]/not-found.tsx no lee headers: las paginas con ISR respondian 500 por 'static to dynamic at runtime'"
  - "El contrato de 404 tiene dos niveles: shell completo en URL sin ruta, y solo 404 con noindex en /servicios/nope y /en/services/nope"

patterns-established:
  - "Todo cambio al shell (proveedores, header, footer) se hace en SiteDocument, nunca solo en el layout"
  - "Un not-found de segmento no puede usar getLocale ni getTranslations sin locale: usar useLocale en una vista cliente"
  - "Listas de la fase con UL y OL de src/components/mui/lists.tsx, enlaces con linkFor"

requirements-completed: [PAG-11]

duration: 42min
completed: 2026-11-07
status: complete
---

# Phase 54 Plan 01: La 404 dentro del shell con estado real Summary

**404 con estado HTTP real y header, footer, un main y un h1 en el HTML para toda URL sin ruta, servida con `global-not-found` de Next 15.4 y verificada en dev.juan-tech.com.**

## Performance

- **Duration:** unos 42 min, la mayor parte en diagnosticar por qué un `notFound()` no trae shell en el HTML
- **Completed:** 2026-11-07
- **Tasks:** 3 de 3
- **Files modified:** 12 (8 creados, 4 modificados)

## Accomplishments

- Una URL sin ruta (`/pagina-inexistente`, `/en/foo`, `/blog/x/y/z`, `/index.html`) responde 404 real con el shell completo en el HTML, un main, un h1, noindex en el meta robots y `x-robots-tag` en el preview.
- `/servicios/nope` y `/en/services/nope` responden 404 con noindex en el preview (antes de arreglarlo respondían 500).
- Vista MUI aprobada: blob con grano, "404" decorativo con `aria-hidden`, h1 "Esta página no existe", dos botones y la navegación "Páginas sugeridas" con cuatro enlaces en una lista con reset.
- `GrainBlob` (pausa con `useMotion().paused`), `UL` y `OL`, y `linkFor(href)` quedan disponibles para los planes siguientes.
- Primer despliegue de la fase probado: `54-notfound-status.mjs`, `53-shell-contract.mjs` y `53-crawl-parity.mjs` pasan contra el preview (169 URLs, 0 diferencias).

## Task Commits

1. **Task 1: 404 dentro del shell con estado real** - `bceac14` (feat)
2. **Task 2: lista sugerida, blob de grano y 404 decorativo** - `ad8b7d6` (feat)
3. **Task 3: despliegue en el preview y verificación en vivo** - `9634775` (fix, corrección encontrada al verificar en el preview; el empuje de `ad8b7d6` fue el primero)

## Verificación

- `node scripts/verify/54-notfound-status.mjs --selftest`: 0 fallos en el válido, fallo detectado en cada defectuoso.
- `--spawn` (servidor standalone con base falsa): PASS en las seis URLs.
- Preview (`EXPECT_PREVIEW=1`, `--wait` y modo live): PASS en las seis URLs.
- `53-shell-contract.mjs` en el preview: PASS en `/` y `/en`.
- `53-crawl-parity.mjs`: 169 URLs revisadas, 0 diferencias.
- `npx tsc --noEmit` y `npm run build` sin errores. `53-messages-parity.mjs` OK.

## Files Created/Modified

- `src/app/global-not-found.tsx` - 404 de URL sin ruta con documento completo, metadata traducida y noindex
- `src/components/shell/SiteDocument.tsx` - html, providers, header, main y footer compartidos
- `src/app/(frontend)/[locale]/layout.tsx` - usa `SiteDocument`; conserva metadata, viewport y validación de locale
- `src/app/(frontend)/[locale]/not-found.tsx` - 404 de páginas con ruta que llaman `notFound()`, sin headers
- `src/components/pages/NotFoundView.tsx` - vista MUI de la 404, idioma por `useLocale()`
- `src/components/mui/{GrainBlob.tsx,lists.tsx,links.ts}` - primitivas compartidas de la fase
- `scripts/verify/54-notfound-status.mjs` - contrato de estado 404 (selftest, spawn, wait, live)
- `next.config.mjs` - `experimental.globalNotFound: true`
- `messages/es.json`, `messages/en.json` - namespace `notFound`

## Decisions Made

Ver `key-decisions`. La más importante: el plan asumía un catch-all `[...rest]` con `notFound()`. La medición del propio tracer mostró que ese camino devuelve 404 correcto pero sin shell en el HTML.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El catch-all `[...rest]/page.tsx` no puede dar shell en el HTML**
- **Found during:** Tarea 1 (modo spawn)
- **Issue:** En Next 15.4.11 un `notFound()` lanzado desde una página o catch-all devuelve 404 pero el HTML del servidor es `<html id="__next_error__">` vacío (el cliente rehace la página). Reproducido en una app mínima de Next sin nada del proyecto, con `force-dynamic`, sin él, con `await` previo y con `headers()`. También ocurre hoy en producción (`/en/blog/zzz`). La única 404 que Next renderiza completa en el servidor es la de una URL sin ruta.
- **Fix:** Se eliminó el catch-all y se agregó `src/app/global-not-found.tsx` con `experimental.globalNotFound: true`. Como esa convención se salta el layout, el documento se extrajo a `SiteDocument`, compartido con `[locale]/layout.tsx`.
- **Files modified:** `src/app/global-not-found.tsx`, `src/components/shell/SiteDocument.tsx`, `src/app/(frontend)/[locale]/layout.tsx`, `next.config.mjs`
- **Commit:** `bceac14`
- **Impacto en criterios:** los criterios `grep` sobre `[...rest]/page.tsx` ya no aplican (el archivo no existe). El supuesto A2 (estado 404 y no 200) sí se cumple.

**2. [Rule 1 - Bug] `[locale]/not-found.tsx` rompía las páginas con ISR con un 500**
- **Found during:** Tarea 3 (primer despliegue; `/servicios/nope` y `/en/services/nope` daban 500)
- **Issue:** `getLocale()` y `getTranslations()` sin locale leen headers; `servicios/[slug]` es ISR (`revalidate = 60`) y Next responde 500 con "Page changed from static to dynamic at runtime ... reason: headers" (visto en los logs del contenedor del preview).
- **Fix:** `not-found.tsx` pasó a síncrono con `metadata` estática (título neutro "404", noindex); `NotFoundView` toma el idioma de `useLocale()`.
- **Commit:** `9634775`

**3. [Rule 1 - Bug] Contrato del script en dos niveles**
- **Found during:** Tarea 3
- **Issue:** Con el diseño real, `/servicios/nope` y `/en/services/nope` tienen ruta, así que su HTML es el documento de error sin shell (límite de Next 15.4 descrito arriba). Exigirles main, h1, header y footer era imposible.
- **Fix:** `54-notfound-status.mjs` exige shell completo solo en las URLs sin ruta; en las dos de nivel página exige 404, noindex y que no sea 500. El modo `--spawn` corre las seis URLs. La cabecera del script lo documenta.
- **Commit:** `9634775`

**4. [Rule 3 - Blocking] El modo spawn necesita `HOSTNAME=localhost`**
- **Found during:** Tarea 1
- **Issue:** Con el servidor ligado a `127.0.0.1`, el middleware responde 308 a sí mismo en toda ruta sin prefijo. La línea base sin cambios (HEAD antes del plan, construida aparte) lo reproduce igual, así que es un artefacto del bind local y no del sitio.
- **Fix:** el modo spawn usa `HOSTNAME=localhost` y `http://localhost:PORT`. Comentado en el script.
- **Commit:** `bceac14`

**5. [Incidente de proceso] Se sobrescribieron `next.config.mjs` y `tsconfig.json` del repo**
- Un experimento con una app mínima en el scratchpad falló en su `mkdir` y los `cat >` posteriores corrieron en la raíz del repo. Se restauraron con `git checkout -- next.config.mjs tsconfig.json` antes de cualquier commit y se borraron los `build.log` y `srv.log` sueltos. Ningún cambio llegó a un commit. Se reconstruyó `.next` después.

**Total de desviaciones:** 4 correcciones automáticas y 1 incidente de proceso resuelto. Impacto: el mecanismo cambia (global-not-found en vez de catch-all), los criterios de aceptación de intención se cumplen.

## Authentication Gates

Ninguno. Se usó la llave SSH `~/.ssh/dokploy_ed25519` solo para leer los logs del contenedor del preview (diagnóstico del 500), sin escrituras. Para el resolver de DNS local se usó el preload del scratchpad, sin añadirlo al repo.

## Issues Encountered

- El 500 de las páginas ISR solo apareció en el preview, no en el servidor local con base falsa; el error exacto salió de los logs del contenedor.
- Los despliegues del preview tardaron entre 3 y 8 minutos.

## Deferred Issues / Límites conocidos

- **HTML de páginas con ruta que llaman `notFound()`:** en Next 15.4.11 devuelven 404 y noindex correctos, pero el HTML del servidor es un documento de error vacío y el shell lo dibuja el cliente. Pasa hoy en producción (`/en/blog/zzz`). Se corrige solo al actualizar Next (Payload 3.85 todavía pide 15.4) o convirtiendo esas rutas en conjuntos cerrados con `dynamicParams = false`; no era del alcance del plan.
- **`experimental.globalNotFound`** es experimental en 15.4. Si una actualización lo cambia, `54-notfound-status.mjs --spawn` lo detecta.
- **Traducción EN de la 404** pendiente de aprobación de Juan (UI-SPEC, Pendiente 2). Título de la 404 de páginas con ruta: "404", neutro porque ahí no hay locale sin leer headers.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. `global-not-found` no refleja la URL pedida (T-54-03), todas las 404 llevan noindex (T-54-04), no hay catch-all que cree entradas de caché ISR (T-54-01) y el push cumplió la precondición de esquema: ningún commit tocó `src/migrations` ni los globals nuevos (T-54-02).

## Next Phase Readiness

- Los planes siguientes deben editar `SiteDocument` si cambian proveedores o el shell; el layout ya no los contiene.
- Un `not-found.tsx` de segmento no puede leer headers; usar `useLocale()` en vistas cliente.
- El preview está desplegado en `9634775`.

## Self-Check: PASSED

- Archivos creados verificados en disco; commits `bceac14`, `ad8b7d6` y `9634775` presentes en `git log` y en `origin/feat/mui-redesign`.
