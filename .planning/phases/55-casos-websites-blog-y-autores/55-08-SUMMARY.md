---
phase: 55-casos-websites-blog-y-autores
plan: 08
subsystem: ui
tags: [websites, mui, payload, unstable_cache, home-fallback, tracer, a11y]
requires:
  - phase: 55-01
    provides: websites-data.ts (domainFor, siteKind, toWebsiteIndexProps), getCachedWebsitesIndex, BrowserFrame, ProjectCard, formatLongDateUtc, namespace websites.detail
  - phase: 55-04
    provides: CACHE_TAGS.websites() y hooks de invalidación de Websites
  - phase: 55-06
    provides: base de la fase (sin dependencia de código en este plan)
provides:
  - getCachedWebsiteBySlug(slug, locale) con overrideAccess false, select y populate con filename
  - toWebsiteDetailProps, pickSuggested, pickNeighbors y buildWebsiteJsonLd (funciones puras)
  - WebsiteDetailView en MUI y ruta [slug] con SEO intacto
  - respaldo de solo lectura de casos y sitios en la home (D-26) con selectCasesOrFallback y selectSitesOrFallback
  - 55-home-fallback-ssr.ts y fixtures del detalle en 55-websites-ssr.ts
affects: [55-11, 55-13, home]
tech-stack:
  added: []
  patterns:
    - "Lectura por slug cacheada que lanza dentro de unstable_cache; el detalle deja propagar el error (500) en vez de un 404 falso"
    - "Decisión curado o respaldo extraída a función pura y auditoría estática del código de lectura con fixtures defectuosos"
key-files:
  created:
    - scripts/verify/55-home-fallback-ssr.ts
  modified:
    - src/lib/cache.ts
    - src/lib/websites-data.ts
    - src/lib/home-data-b.ts
    - src/components/pages/websites/WebsiteDetailView.tsx
    - src/app/(frontend)/[locale]/websites/[slug]/page.tsx
    - scripts/verify/55-websites-ssr.ts
    - .planning/phases/55-casos-websites-blog-y-autores/deferred-items.md
key-decisions:
  - "El detalle no repite la galería 'Capturas de pantalla' del sandbox: hay una sola captura por sitio (D-14) y ya está en el hero dentro de BrowserFrame"
  - "pickNeighbors es circular como el sandbox y devuelve null con menos de dos sitios, así no se ofrece una navegación hacia el mismo sitio"
  - "El respaldo de casos usa su propio unstable_cache; el de sitios va dentro de la caché que ya existía (readHomeSites) para no anidar otra"
requirements-completed: []
duration: 55min
completed: 2026-11-10
status: complete
commits: 3
plan_head_before: 920ad540faf06868e529503a2c6ccc62f86a913a
actuals:
  tokens: 14000
  tasks: 3
  commits: 3
---

# Phase 55 Plan 08: Detalle de Websites en MUI y respaldo de la home Summary

Detalle de cada sitio en MUI con datos reales de Websites (captura única en BrowserFrame, puntajes con la fecha de `lighthouseCapturedAt`, retos, stack, caso relacionado, anterior y siguiente, sugeridos) y respaldo de solo lectura para las secciones Casos y Sitios de la home cuando `featured-content` viene vacío.

Nota sobre `commits`: el campo mide los tres commits de este plan. `git rev-list 920ad54..HEAD` da 5 porque 55-07 corrió en paralelo en el mismo checkout y commiteó dos veces en ese intervalo.

## Qué quedó hecho

- **Tarea 1 (tracer), commit 6b7196b:** `getCachedWebsiteBySlug` (clave `['website', slug, locale]`, tag `CACHE_TAGS.websites()`, `overrideAccess: false`, `select`, `populate` de media con `filename`, clientes y casos), `toWebsiteDetailProps`, `buildWebsiteJsonLd` (el mismo `CreativeWork` que construía la ruta), vista mínima y ruta. `revalidate = 60`, `generateStaticParams` vacío, `generateMetadata`, canonical, hreflang, Open Graph y `notFound` quedan como estaban; solo cambió de dónde sale el documento.
- **Tarea 2, commit 4de05fa:** vista completa. Hero con eyebrow, h1, tagline, `BrowserFrame` de escritorio (sin marco de teléfono), botón "Visitar el sitio" solo con dominio seguro (`https://<hostname>`, `target="_blank"`, `rel="noopener"`, texto oculto que anuncia la pestaña nueva), chip de tipo. Secciones que se omiten enteras sin datos: puntajes (anillos solo con valor, nota con fecha UTC sin afirmar dispositivo), destacados y retos en franja `band`, stack, caso relacionado, anterior y siguiente (`nav` con nombre), más proyectos con `pickSuggested` (mismo tipo primero, completa con los demás, hasta 3). Cierre con `CtaSection` en la ruta, igual que el índice. Jerarquía h1, h2 por sección, h3 por columna y por tarjeta.
- **Tarea 3, commit 856c261:** `getHomeCases` y `readHomeSites` caen a los más recientes de `case-studies` y `websites` (`sort: '-createdAt'`, `overrideAccess: false`, `select`, mapeo con `mapFeaturedCases` y `mapWebsite`) cuando lo curado queda vacío. Tags `featuredContent` más `caseStudies` o `websites`. Ninguna escritura. `selectCasesOrFallback` y `selectSitesOrFallback` puras. Corrección del defecto latente: `populate` de media con `filename: true` también en la lectura curada de sitios.

## Resultados de verificación

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` (tras cada tarea) | PASS |
| `55-websites-ssr.ts` | PASS, 69 comprobaciones (índice y detalle, ES y EN, 9 fixtures defectuosos del detalle que fallan) |
| `55-home-fallback-ssr.ts` | PASS, 26 comprobaciones (selección pura, render de `id="casos"` con 3 tarjetas y `id="sitios"` con 5, auditoría estática, 6 defectuosos que fallan) |
| `54-home-b-ssr.ts` y `54-home-ssr.ts` | PASS, 0 FAIL |
| `55-cache-tags.ts` | PASS |
| `55-messages-parity.mjs`, `54-rsc-boundary.mjs`, `55-no-sandbox-data.mjs` | PASS |
| `npm run build` con variables falsas (después de las tareas 1 y 3) | PASS, exit 0 |
| Aceptación por grep (`overrideAccess: false`, `revalidate = 60`, `notFound`, `rel="noopener"`, sin móvil ni PhoneFrame en la vista, `pickSuggested`, sin `updateGlobal` ni `payload.create/update/delete` en home-data-b) | PASS |
| Precondición de esquema | Sin cambios en `src/migrations`, `src/collections` ni `src/globals` en este plan |
| Verificación en vivo en dev.juan-tech.com | No hecha (la ola 4 no hace push); ver "Para la revisión de Juan" |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `readHomeSites` pedía el `populate` de media sin `filename`**
- **Found during:** Tarea 3 (hallazgo de 55-01 en `deferred-items.md`, indicado en la instrucción del plan)
- **Issue:** el `url` de Media lo genera el adaptador de Cloudinary desde `filename`; sin él llega null y las tarjetas de la home saldrían sin captura apenas el respaldo activara la lectura.
- **Fix:** `SITES_POPULATE` compartido por la lectura curada y la de respaldo, con `filename: true`. La auditoría estática de `55-home-fallback-ssr.ts` falla si se quita.
- **Files modified:** src/lib/home-data-b.ts, scripts/verify/55-home-fallback-ssr.ts
- **Commit:** 856c261

### Diferencias menores respecto al texto del plan

- **Galería de capturas omitida.** El sandbox repite la captura en una sección "Capturas de pantalla". Con una sola captura por sitio (D-14) sería la misma imagen dos veces, así que no se renderiza. La clave `websites.detail.screenshotsTitle` queda sin uso. La ruta vieja renderizaba todas las capturas del array; hoy cada sitio de producción tiene una.
- **`externalNotice` sin uso.** El aviso de pestaña nueva se da con texto visualmente oculto (`opensInNewTab`) dentro del botón, no con la frase larga.
- **`depth: 2` en `getCachedWebsiteBySlug`**, como pide el plan. Con `select` y `populate` el costo es el mismo que con depth 1 (no hay relaciones dentro de los campos seleccionados de cliente y caso).
- **El detalle no atrapa el error de lectura.** Si `getCachedWebsiteBySlug` lanza, la ruta responde 500 (Next no cachea el error) en vez de un 404 falso. El índice usado para anterior, siguiente y sugeridos sí se atrapa: ante un fallo el detalle se sirve sin esas dos secciones.
- **No se editó `messages`.** Todas las claves `websites.detail.*` ya existían (55-01). Los cambios de `messages/*.json` que aparecen sin commitear en el checkout son de 55-07, no de este plan.

## Authentication gates

Ninguno.

## Known Stubs

Ninguno. El detalle no lee datos del sandbox y todo bloque sin datos se omite junto con su encabezado.

## Threat Flags

Ninguno nuevo. Mitigaciones del plan: T-55-27 (el enlace externo sale solo de `domainFor` y `hostnameOf`, con `rel="noopener"`; las fixtures cubren sin cliente, URL `javascript:` y host exacto), T-55-28 (`overrideAccess: false` y `select` dentro de cada función cacheada y comprobado por la auditoría estática), T-55-29 (cero llamadas de escritura, comprobado por la auditoría estática y por grep) y T-55-30 (el `catch` de `getHomeCases` y `getHomeSites` queda fuera de `unstable_cache`).

## Para la revisión de Juan

1. Con el despliegue del preview terminado (estado `done` en Dokploy), abrir `https://dev.juan-tech.com/websites/apturio-com` y `/en/websites/apturio-com`: captura en el marco de navegador sin marco de teléfono, botón "Visitar el sitio" que abre `apturio.com` en otra pestaña, nota "medidos el 14 de julio de 2026", destacados y retos, stack, anterior y siguiente, tres proyectos más.
2. Abrir `/websites/juan-tech-com`: no debe aparecer la sección de puntajes (los cuatro son null) y el dominio `juan-tech.com` sale derivado del slug (A6).
3. Abrir `/` y `/en`: deben existir `id="casos"` con 3 tarjetas y `id="sitios"` con 5, con datos reales de las colecciones. Al curar `featured-content` en el admin, la home pasa a mostrar lo curado.
4. Cadenas en inglés del detalle ya listadas en el resumen de 55-01 para su aprobación.
5. Decisión menor: si quiere una galería cuando un sitio tenga más de una captura, se agrega después; hoy se muestra solo la primera.

## Self-Check: PASSED

Archivos verificados y commits 6b7196b, 4de05fa y 856c261 presentes en `git log`.
