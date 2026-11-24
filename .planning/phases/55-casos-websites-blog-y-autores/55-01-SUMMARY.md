---
phase: 55-casos-websites-blog-y-autores
plan: 01
subsystem: ui
tags: [websites, mui, payload, unstable_cache, tracer, preview, i18n]
requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: primitivas MUI (PageHero, ScoreRing, TechChips, CtaSection, UL, linkFor), arnés SSR 54 y patrón de despliegue del preview
provides:
  - getCachedWebsitesIndex(locale) con overrideAccess false, select, populate y tag websites:all
  - websites-data.ts (domainFor, siteKind, toWebsiteIndexProps) y WebsitesIndexView
  - BrowserFrame y ProjectCard compartidos, sin PhoneFrame
  - namespace websites.index y websites.detail en ES y EN (55-08 no edita messages)
  - 55-websites-ssr.ts y 55-tracer-live.mjs, con el ciclo push, despliegue y verificación en vivo probado
affects: [55-02, 55-08, 55-10, 55-12, home D-26]
tech-stack:
  added: []
  patterns:
    - "Lectura cacheada que lanza dentro de unstable_cache y se captura en la ruta (no fija fallos)"
    - "populate de media siempre con filename junto a url (el url lo genera el adaptador de Cloudinary)"
    - "Contrato en vivo que compara contra la API pública de producción, no contra el origen que renderiza"
key-files:
  created:
    - src/lib/websites-data.ts
    - src/components/pages/websites/WebsitesIndexView.tsx
    - src/components/mui/Frames.tsx
    - src/components/mui/ProjectCard.tsx
    - src/components/mui/format-date.ts
    - scripts/verify/55-websites-ssr.ts
    - scripts/verify/55-tracer-live.mjs
    - .planning/phases/55-casos-websites-blog-y-autores/deferred-items.md
  modified:
    - src/lib/cache.ts
    - src/lib/cache-tags.ts
    - src/app/(frontend)/[locale]/websites/page.tsx
    - messages/es.json
    - messages/en.json
key-decisions:
  - "El cierre (CtaSection) vive en la ruta (Server Component) como en ServicesIndexPage, no dentro de la vista: la vista no depende de getCtaData"
  - "ProjectCard usa la caja de imagen 16:10 del sandbox con la insignia de tipo; BrowserFrame se usa en el destacado (y en el detalle de 55-08)"
  - "El filtro por tipo no se ofrece cuando solo existe un tipo"
  - "formatLongDateUtc vive en un módulo cliente propio (src/components/mui/format-date.ts) porque websites-data importa home-data-b y arrastraría payload al cliente"
requirements-completed: []
duration: 25min
completed: 2026-11-09
status: complete
commits: 4
plan_head_before: e7eb22656590258bae4f25c96fa72a553aafbaae
actuals:
  tokens: 26000
  tasks: 3
  commits: 4
---

# Phase 55 Plan 01: Índice de Websites en MUI (tracer) Summary

Índice de Websites en MUI con lectura cacheada de Payload (overrideAccess false, select, populate), servido por dev.juan-tech.com en ES y EN con las seis tarjetas, sus capturas y el mismo conjunto de sitios que la API pública de producción.

## Qué quedó hecho

- **Tarea 1 (tracer), commit 488bb82:** `CACHE_TAGS.websites()`, `getCachedWebsitesIndex`, funciones puras de datos, vista mínima, ruta con SEO sin cambios (`revalidate = 60`, `generateStaticParams` vacío, `generateMetadata` y JSON-LD de migas intactos) y `55-websites-ssr.ts` con fixtures defectuosos.
- **Tarea 2, commit 0758b6f:** `BrowserFrame` (16:10, `object-fit: cover`, `object-position: top`, sin `PhoneFrame`), `ProjectCard`, destacado con el primer sitio, filtro `ToggleButtonGroup` con conteo y solo los tipos presentes, estado vacío, anillos condicionales, nota de medición con `lighthouseCapturedAt` en UTC sin afirmar dispositivo y namespace `websites.index` y `websites.detail` en ES y EN.
- **Tarea 3, commits 6612d0b y 49a143a:** `55-tracer-live.mjs` (contrato, recuento contra producción, paridad de metadatos, selftest), push de `feat/mui-redesign`, espera del despliegue por la API de Dokploy y verificación en vivo.

## Resultados de verificación

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | PASS |
| `tsx scripts/verify/55-websites-ssr.ts` | PASS (28 comprobaciones, incluidos 4 fixtures defectuosos que fallan) |
| `npm run build` con variables falsas (dos veces) | PASS |
| `54-messages-parity.mjs`, `54-rsc-boundary.mjs`, `54-no-sandbox-data.mjs` | PASS |
| `55-tracer-live.mjs --selftest` | PASS (11 casos) |
| Precondición de esquema (`git diff origin/feat/mui-redesign -- src/migrations src/collections src/globals`) | vacía, en los dos push |
| `55-tracer-live.mjs` contra dev.juan-tech.com | PASS en `/websites` y `/en/websites` |
| Recuento | producción: 6 sitios (6 con captura); preview: 6 tarjetas con enlace y 6 capturas, en ES y EN |
| `53-shell-contract.mjs` contra el preview | PASS (es y en) |
| `53-crawl-parity.mjs` | PASS, 169 URLs, 0 diferencias |
| Logs del preview (`readLogs`, tail 1000) | 0 apariciones de permission denied |

Despliegues: `ef_cfpcSaDBuL-G038q6X` (6612d0b, done 04:28:48 UTC) y `x17mvy3pYu73PzacFoqqO` (49a143a, done 04:36:31 UTC). El preview lee con `juantech_preview_ro` y la lectura `overrideAccess: false` más `select` más `populate` funciona con ese rol.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El `populate` de media dejaba `url` en null y las seis tarjetas salían sin captura**
- **Found during:** Tarea 3 (primer despliegue; el contrato de enlaces daba PASS con seis tarjetas, pero el HTML solo tenía el avatar del cierre como imagen)
- **Issue:** el `url` de Media lo genera el adaptador de Cloudinary desde `filename` en `afterRead`. Con `populate: { media: { url, width, height, alt } }` llega `null` (medido contra la API: `populate[media][url]` devuelve `"url": null`, agregando `populate[media][filename]` devuelve la URL).
- **Fix:** `filename: true` en el `populate` de `getCachedWebsitesIndex` y `55-tracer-live.mjs` ahora exige una captura por cada sitio con captura en producción (un contrato solo de enlaces daba falso verde, el riesgo T-55-04).
- **Files modified:** src/lib/cache.ts, scripts/verify/55-tracer-live.mjs
- **Commit:** 49a143a
- **Efecto en otros planes:** 55-08, 55-10 y 55-12 leen media con `populate` y deben incluir `filename`. Queda anotado en `deferred-items.md` de la fase, junto con el mismo defecto latente en `readHomeSites` de `src/lib/home-data-b.ts` (fase 54, fuera del alcance de este plan, no se tocó).

**2. [Rule 3 - Blocking] Módulo de fecha separado para el cliente**
- **Found during:** Tarea 2
- **Issue:** el formato de fecha no podía vivir en `websites-data.ts`, que importa `home-data-b` (arrastra payload y `@payload-config`) y las vistas son `'use client'`.
- **Fix:** `src/components/mui/format-date.ts` (`formatLongDateUtc`), reutilizable por 55-08.

### Diferencias de diseño menores respecto al texto del plan

- `ProjectCard` usa la caja de imagen 16:10 del sandbox con la insignia de tipo y no envuelve la captura en `BrowserFrame`; el marco con barra va en el destacado. Es el marcado del sandbox (D-01) y evita un doble borde dentro de la tarjeta.
- El cierre con `CtaSection` se arma en la ruta, igual que `ServicesIndexPage`, y no dentro de `WebsitesIndexView`.
- `ROADMAP.md` no tiene lista de planes de la fase 55 (dice "Plans: TBD"), así que no hubo casilla de 55-01 que marcar.

## Cadenas en inglés para aprobación de Juan

Namespace `websites` (ES con mi voz, EN traducción literal y simple). Revisar sobre todo: `index.emptyText` ("I'm preparing new website case studies. Check back soon."), `index.kinds.other` ("Other technologies"), `detail.buildTitle` ("What I built and what challenges it had"), `detail.externalNotice` y `detail.relatedCaseTitle`. No se copiaron eyebrows ni leads del sandbox (D-28).

## Elementos para la revisión humana de Juan

1. Abrir `https://dev.juan-tech.com/websites` y `/en/websites` y mirar: destacado con el primer sitio (juan-tech, sin puntajes porque los cuatro son null), filtro Next.js (4) y WordPress (2), anillos y nota "medidos el 14 de julio de 2026", capturas recortadas desde arriba.
2. Decidir si quiere la nota de medición repetida en cada tarjeta (el plan la pide así; el sandbox no la traía en tarjetas).
3. `juan-tech.com` aparece como dominio derivado del slug (A6 de RESEARCH) en la barra del marco del destacado.

## Known Stubs

Ninguno. `WebsitesIndexView` no lee datos del sandbox; el estado vacío usa mensajes reales.

## Threat Flags

Ninguno nuevo. T-55-01 a T-55-04 mitigados: `overrideAccess: false` dentro de la función cacheada, precondición de esquema verificada antes de cada push, el dominio sale solo de `hostnameOf` y la comparación de tarjetas usa la API de producción.

## Self-Check: PASSED

Archivos creados y commits 488bb82, 0758b6f, 6612d0b y 49a143a verificados en el siguiente paso.
