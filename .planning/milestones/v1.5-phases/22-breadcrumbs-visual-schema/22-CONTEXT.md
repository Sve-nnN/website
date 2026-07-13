# Phase 22: Breadcrumbs (visual + schema) - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous), resolved at Claude's Discretion — no grey area rose to product-decision level; Juan's profile favors execute-end-to-end over per-detail confirmation, and nothing here is irreversible.

<domain>
## Phase Boundary

Un trail de breadcrumbs visible en la página índice de Servicios y en las 4 landings individuales (ES/EN), más el `BreadcrumbList` JSON-LD correspondiente, ambos derivados de una única función `buildTrail()` — sin agregar campos nuevos a Payload ni migraciones (BREAD-01/02/03).

</domain>

<decisions>
## Implementation Decisions

### Trail Structure & Naming
- Trail incluye 3 niveles: `Inicio/Home` (raíz del locale) → `Servicios/Services` (índice) → nombre de la landing individual. La página índice muestra un trail de 2 niveles (`Inicio > Servicios`).
- El label de cada landing usa el `title` localizado ya existente en el doc de `pages` (sin duplicar strings hardcodeados).
- El label de "Inicio"/"Servicios" se resuelve por locale con un pequeño diccionario local en el propio `buildTrail()` (no requiere nuevo contenido en Payload).

### Implementación
- Nuevo módulo puro `src/lib/breadcrumbs.ts` exportando `buildTrail(locale, path)` (o firma equivalente que reciba locale + slug opcional) — única fuente de verdad, sin acceso a DB (reutiliza `SERVICE_SLUGS`/`SERVICES_INDEX_SLUG` de `src/lib/services-data.ts` para las URLs, y recibe el título ya fetcheado por la page como argumento en vez de volver a consultarlo).
- El array resultado alimenta directamente el prop `breadcrumbs` que el componente `Hero` (variant `listing`) ya acepta (`{label, url}[]`, ver `src/blocks/Hero/Component.tsx` y `config.ts`) — no se usa el campo editorial manual de Payload para estas páginas, se pasa como prop computado desde el server component. Cero cambio de schema, cero migración.
- URLs de los crumbs respetan el segmento dual ya existente por locale (`/servicios` vs `/services`), igual que `services-data.ts`.
- Último crumb (página actual) no es clickeable — reutiliza el `isLast` ya implementado en `HeroComponent`.

### JSON-LD
- Se agrega un `<JsonLd data={...}>` (componente ya existente, `src/components/JsonLd.tsx`) directamente en `servicios/page.tsx`, `services/page.tsx`, `servicios/[slug]/page.tsx` y `services/[slug]/page.tsx`, construido desde el mismo `buildTrail()`.
- URLs del `BreadcrumbList` son absolutas, usando el mismo patrón `NEXT_PUBLIC_SERVER_URL`/`SITE_URL` ya usado en `src/lib/sitemap-data.ts`.
- Todos los items (incluido el último) llevan `item` con URL absoluta — no se omite en el último por consistencia y para pasar validación limpia con el agente `seo-schema`.
- `position` 1-indexado, `@type: "BreadcrumbList"`, cada `itemListElement` con `@type: "ListItem"`.

### Claude's Discretion
Naming exacto de la firma de `buildTrail()`, estructura interna del diccionario de labels ES/EN, y el nombre del archivo/función que arma el `BreadcrumbList` object a partir del trail (probablemente co-ubicado en el mismo `breadcrumbs.ts`).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/JsonLd.tsx` — componente ya usado en Home/Authors/Blog/CaseStudies para emitir `<script type="application/ld+json">`, serializa con `JSON.stringify` (mitigación de XSS ya resuelta).
- `src/blocks/Hero/Component.tsx` + `config.ts` — el prop `breadcrumbs` (`{label, url}[]`) y el render `<nav aria-label="Breadcrumb">` ya existen desde Phase 10.8, solo expuestos hoy en el campo editorial de Payload (variant `listing`). Fase 22 reutiliza el mismo prop shape pero alimentado por código en vez de por CMS.
- `src/lib/services-data.ts` — `SERVICE_SLUGS`, `SERVICES_INDEX_SLUG`, `getServicesIndexPage`, `getServicePage` ya resuelven el allowlist de slugs y el fetch localizado.

### Established Patterns
- Server components (`page.tsx`) hacen `getPayload`/fetch de datos y pasan props a bloques — no hay lógica de fetching en componentes cliente para este flujo.
- JSON-LD se inserta inline en cada `page.tsx` que lo necesita, construyendo el objeto ahí mismo (ver Author/CaseStudy/Blog pages) — no hay un wrapper genérico de schema, cada page arma su propio objeto.

### Integration Points
- `servicios/page.tsx`, `services/page.tsx`, `servicios/[slug]/page.tsx`, `services/[slug]/page.tsx` — los 4 archivos que necesitan tocar: agregar `buildTrail()` + pasarlo a `RenderBlocks`/Hero (donde corresponda) + `<JsonLd>`.
- Ninguna de estas 4 pages renderiza el bloque `Hero` directamente hoy (usan `RenderBlocks blocks={doc.content?.layout}` genérico) — el Hero con variant `listing` vive dentro del `layout` seedeado del doc en Payload. Confirmar en planning si el trail visual debe inyectarse vía prop-override al bloque Hero dentro de `RenderBlocks`, o si conviene renderizar el `<nav>` de breadcrumbs por fuera del layout directamente en la page (más simple, sin tocar `RenderBlocks`). Sugerido: resolver esto en plan-phase con lectura de `RenderBlocks.tsx`.

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia puntual de Juan más allá de lo ya capturado en REQUIREMENTS.md (BREAD-01/02/03) y ROADMAP.md — fase de bajo riesgo, sin ambigüedad de producto.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
