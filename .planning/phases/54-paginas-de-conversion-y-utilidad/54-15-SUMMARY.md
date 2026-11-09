---
phase: 54-paginas-de-conversion-y-utilidad
plan: 15
subsystem: ui
tags: [mui, payload-pages, services-index, local-landings, placeholder-filter, dual-urls, ssr-selftest, a11y, seo]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (Section, FaqAccordion, IconTile, lists), plan 06 (MuiRichText, CtaSection, getCtaData) y plan 09 (SERVICE_ICON_BY_SLUG, ServiceCtaBand, ServiceDetailPage)
provides:
  - getServicesIndexData, buildIndexCards y buildCompareRows (src/lib/services-index-data.ts)
  - ServicesIndexView y ServicesIndexPage, compartidos por /servicios y /services
  - composeLocalSlots y splitInlineStat (src/lib/local-landing-view.ts), modulo puro
  - LocalHeroStat, LocalHeroActions y LocalProof (src/components/pages/LocalLanding.tsx)
  - LocalLandingPage, Server Component compartido por las landings Lima y Madrid
  - 54-index-ssr.ts, 54-local-ssr.ts y 54-dual-urls.mjs (contrato de 24 URLs con selftest)
affects: [54-16]

plan_head_before: 5ab815c57188da5a84c55b06bfc100bbcf8f0278
actuals:
  tokens: 21800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Descripcion de cada tarjeta por posicion de columna del content del indice, con respaldo al subtitulo del hero; nunca por texto"
    - "Un servicio que no resuelve se omite sin desplazar las descripciones de los demas (se indexa por posicion de SERVICE_SLUGS)"
    - "El aside del hero solo se pasa a PageHero cuando hay dato real, para que la rejilla no quede en dos columnas con una vacia"
    - "Toda prueba local pasa por withoutPlaceholders, isPlaceholder y omitPlaceholder; sin nada real el componente devuelve null"

key-files:
  created:
    - src/lib/services-index-data.ts
    - src/components/pages/ServicesIndexView.tsx
    - src/components/pages/ServicesIndexPage.tsx
    - src/lib/local-landing-view.ts
    - src/components/pages/LocalLanding.tsx
    - src/components/pages/LocalLandingPage.tsx
    - scripts/verify/54-index-ssr.ts
    - scripts/verify/54-local-ssr.ts
    - scripts/verify/54-dual-urls.mjs
  modified:
    - src/app/(frontend)/[locale]/servicios/page.tsx
    - src/app/(frontend)/[locale]/services/page.tsx
    - src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx
    - src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
    - messages/es.json
    - messages/en.json

key-decisions:
  - "La prueba local se filtra tambien en el aside del hero: el inlineStat de Madrid es un marcador, asi que Madrid no pinta aside"
  - "Los botones del hero anterior (Conversar sobre tu proyecto, Ver casos en Lima) se conservan como LocalHeroActions para no perder enlaces internos"
  - "La franja de prueba local es un div band y no una section: una region sin nombre accesible seria ruido y no se inventa copy para nombrarla"
  - "No se agrega BreadcrumbList a las landings: el plan exige JSON-LD identico (T-54-64)"

patterns-established:
  - "El contrato dual-urls se prueba tambien contra produccion como linea base antes de empujar: el contrato ya se cumple en la version vigente"

requirements-completed: []

duration: 50min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 15: Indice de servicios y landings Lima y Madrid en MUI Summary

**El indice de servicios se renderiza con cuatro tarjetas y una tabla comparativa accesible derivadas de los docs reales, y las landings Lima y Madrid pasan a MUI con la prueba local y la estadistica del hero filtradas de marcadores [PLACEHOLDER], todo bajo las URLs duales actuales y con metadata, ISR y JSON-LD intactos.**

## Performance

- **Duration:** unos 50 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3 (la 1 es tracer)
- **Files:** 9 creados, 6 modificados

## Accomplishments

- `buildIndexCards` toma la descripcion por posicion de columna del primer `content` del indice (cuatro columnas con encabezado y parrafo, en el orden de SERVICE_SLUGS) y cae al subtitulo del hero si la forma no coincide. `buildCompareRows` toma el primer encabezado del primer content del servicio, el outcome y el timeline de su serviceScopeCard. Cada lectura de servicio falla por separado con `console.error('[services]')`.
- `ServicesIndexView`: `PageHero`, `UL` de `Card` con `IconTile`, h2 con enlace estirado, foco dibujado en la tarjeta con `:has(a:focus-visible)` y hover anulado con `html[data-motion="paused"]`. La tabla va en un `TableContainer` con `tabIndex 0`, `role="region"` y `aria-label`, encabezados `scope="col"` y primera celda `th scope="row"` con el titulo como enlace. Cierra con la caja `raised` y el boton "Hablar con Juan" hacia `/#contacto`.
- `ServicesIndexPage` emite los mismos JSON-LD (`buildServicesIndexJsonLd` y `buildBreadcrumbJsonLd`); las dos rutas gemelas conservan `revalidate = 60`, `generateStaticParams` vacio y `generateMetadata`.
- `LocalLandingPage` conserva `buildLocalService` con los mismos argumentos y la misma URL (SEO-42). `composeLocalSlots` reparte hero, proof, prose, faq y cta (solo el ultimo es cierre); un blockType desconocido cae a `generic` y se pinta con `RenderBlocks`.
- `LocalProof` descarta marcadores con `withoutPlaceholders` e `isPlaceholder`. Con los docs reales: Lima produce una tarjeta (el taller 2025 con 18 asistentes) y Madrid no produce marcado alguno ni encabezado ni hueco.
- `54-dual-urls.mjs` cubre 24 URLs (indice, cuatro servicios, variantes cruzadas y las cuatro landings) con canonical por idioma y hreflang es, en y x-default.

## Task Commits

1. **Task 1 (tracer): indice de servicios con tarjetas y tabla desde los docs reales** - `c1ea85c` (feat)
2. **Task 2: landings Lima y Madrid con prueba local filtrada y estadistica en el aside** - `9cf7c21` (feat)
3. **Task 3: contrato de URLs duales y de canonical** - `8c0702c` (test)

La rama NO se empujo. No se escribio en ninguna base, no se leyo `.env` y no se toco el preview ni la app `web` de produccion. El plan no hizo que el preview lea `home_page*` ni `about_page*`, asi que el supuesto A7 no aplica aqui y sigue pendiente de 54-16.

## Verificacion

- `tsx scripts/verify/54-index-ssr.ts`: 43 casos en PASS (8 sinteticos y 17 por idioma contra los docs reales). Incluye descripcion igual al parrafo de la columna i, tres columnas que caen al subtitulo, cuatro filas, cuatro `th scope="col"`, contenedor con tabindex 0, role region y aria-label, un solo h1, niveles sin saltos y ningun main.
- `tsx scripts/verify/54-local-ssr.ts`: 82 casos en PASS (puros y cuatro docs reales: Lima y Madrid en es y en). Ninguna salida contiene `[PLACEHOLDER]` ni texto de relleno, Lima una tarjeta, Madrid cero marcado y cero aside, cifra del hero separada, un h1, ids en los h2 de la prosa.
- `node scripts/verify/54-dual-urls.mjs --selftest`: PASS (fixture valido sin fallos y doce defectuosos detectados). Ejecutado ademas contra `https://juan-tech.com`: las 24 URLs en PASS, lo que confirma que el contrato ya se cumple en la version vigente.
- `node scripts/verify/54-messages-parity.mjs`: PASS tras agregar `services.index.viewService`.
- `npx tsc --noEmit`: sin errores. `npm run build` (variables de solo build): salida 0.
- Greps de aceptacion de las tres tareas en verde (sin `main`, sin `component="ul|ol"` en LocalLanding, `withoutPlaceholders`, `isPlaceholder`, `buildLocalService`, `RenderBlocks`, `TableContainer`, `tabIndex`, `SERVICE_ICON_BY_SLUG`).
- Diff de las cuatro rutas: solo se quita el cuerpo de render y los imports que ya no usan; `generateMetadata`, `revalidate` y `generateStaticParams` quedan iguales.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] El inlineStat de Madrid tambien es un marcador**
- **Found during:** Tarea 2
- **Issue:** el plan filtra la prueba local, pero el hero de Madrid trae `inlineStat: "[PLACEHOLDER] Estadistica real pendiente..."`. Pasarlo a `LocalHeroStat` habria publicado el marcador en el aside (T-54-62).
- **Fix:** `LocalHeroStat` devuelve null con texto vacio o con marcador, y la pagina solo pasa `aside` a `PageHero` cuando hay estadistica real, para que el hero de Madrid quede en una columna. Tambien se filtran con `omitPlaceholder` el eyebrow, el titulo y el lead del hero.
- **Files modified:** `src/components/pages/LocalLanding.tsx`, `src/components/pages/LocalLandingPage.tsx`
- **Commit:** `9cf7c21`

**2. [Rule 2 - Missing critical] Los enlaces del hero de las landings se perderian (SEO-03)**
- **Issue:** el hero real trae enlaces (`/contact` y, en Lima, `/case-studies`). El plan no los renderiza, y el bloque anterior si.
- **Fix:** `LocalHeroActions` pinta esos enlaces como botones (contained y outlined) dentro del `PageHero`, saneados con `resolveLinkHref`.
- **Files modified:** `src/components/pages/LocalLanding.tsx`, `src/components/pages/LocalLandingPage.tsx`
- **Commit:** `9cf7c21`

**3. [Rule 3 - Blocking] Clave de mensajes que faltaba**
- **Issue:** el pie de la tarjeta lleva "Ver servicio" y `services.index` no traia esa clave.
- **Fix:** se agrego `services.index.viewService` en es ("Ver servicio", texto del plan) y en en ("View service"); la paridad de mensajes sigue en PASS.
- **Files modified:** `messages/es.json`, `messages/en.json`
- **Commit:** `c1ea85c`

### Otras desviaciones menores

- La franja de prueba local es un `div` con fondo band y no una `section` con `aria-labelledby`: no hay encabezado propio y no se inventa copy para nombrar la region.
- Las autopruebas corren en es y en (el plan pedia es); el doc en ingles de ambas landings y del indice se descarga igual y pasa.
- La variante cruzada del contrato se amplio a las cuatro combinaciones (`/services`, `/en/servicios` y sus equivalentes por slug) en lugar de la redaccion ambigua del plan.

## Known Stubs

Ninguno. Los marcadores `[PLACEHOLDER]` siguen en la base de produccion (Lima: dos estadisticas y la cita; Madrid: todo); la vista nunca los pinta. Limpiarlos en el CMS sigue pendiente, fuera de este plan.

## Threat Flags

Ninguno: no hay endpoints, rutas ni accesos a archivos nuevos. T-54-62 a T-54-66 quedan mitigados como indica el registro (marcadores filtrados y probados contra los docs reales, JSON-LD con las mismas funciones y argumentos, lecturas protegidas, canonical por idioma verificado).

## Self-Check: PASSED

- Archivos creados: los nueve existen en disco (verificado con `git show --stat` de los tres commits).
- Commits `c1ea85c`, `9cf7c21` y `8c0702c` presentes en `git log`.
