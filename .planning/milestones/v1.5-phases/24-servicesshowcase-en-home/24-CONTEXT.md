# Phase 24: ServicesShowcase en Home - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous), resolved at Claude's Discretion. Bloque nuevo con superficie visual, pero patrón ya establecido dos veces en el repo (`FeaturedCaseStudiesBlock`, `FeaturedPostsBlock`) — nada aquí es una decisión de producto abierta, es seguir el precedente. UI-SPEC se genera aparte vía UI Design Contract Gate antes de planear (fase tiene "UI hint: yes").

<domain>
## Phase Boundary

Home gana un bloque `ServicesShowcase` con las 4 tarjetas de servicio (leídas dinámicamente de `SERVICE_SLUGS`, no hardcodeadas), enlazando a sus landings en el locale activo, registrado de forma puramente aditiva en Payload (SVCHOME-01/02/03).

</domain>

<decisions>
## Implementation Decisions

### Fuente de datos
- El bloque NO usa una relación curada tipo `featured-content` (a diferencia de `FeaturedCaseStudiesBlock`) — los 4 servicios son un set fijo, no una selección editorial. El componente server-side llama directamente a `getServicesIndexPage`/`getServicePage`-style helpers de `src/lib/services-data.ts` (o una función nueva ahí que devuelva las 4 `pages` docs por `SERVICE_SLUGS`, en el locale activo) — mismo patrón de fetch ya usado en `servicios/page.tsx`.
- Título/subtítulo de la sección: campo `text` localizado editable por instancia (igual que `FeaturedCaseStudiesBlock.title`), sin default hardcodeado — el seed del Home debe poblarlo con copy real bilingüe.

### Card / Layout
- Reutiliza el patrón de grid ya establecido (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` en `FeaturedCaseStudiesBlockComponent`) adaptado a 4 items (probablemente `sm:grid-cols-2 lg:grid-cols-4` o `lg:grid-cols-2` en 2x2 — a discreción del planner/UI-SPEC según lo que se vea mejor con el contenido real de cada servicio).
- Cada tarjeta usa `page.title` + `page.meta?.description` (o un excerpt corto) como copy, no texto hardcodeado en el bloque.
- Elevación/spacing de las tarjetas debe seguir los tokens ya establecidos en Phase 7/10 (Design-Token Foundation, Cards/Listados) — no reinventar valores.

### Registro en Payload
- Bloque 100% aditivo: nuevo `src/blocks/ServicesShowcase/config.ts` + `Component.tsx`, registrado en el array de blocks de la colección `pages` (o donde corresponda, igual que los demás bloques de contenido) + `blockComponents` map en `RenderBlocks.tsx` + `payload generate:types`. Sin tocar columnas existentes. Si el planner descubre que necesita tocar algo existente, debe pedir aprobación nombrada de Juan primero (regla dura del proyecto).
- El bloque se agrega al layout de Home vía seed script (no manualmente en admin) — mismo patrón que Phases 13/19/20/21.

### Claude's Discretion
Nombre exacto del slug del bloque (`servicesShowcase` sugerido), grid exacto (2x2 vs 4 en fila según breakpoint), si cada tarjeta lleva un ícono/imagen o es solo texto (evaluar con UI-SPEC contra el resto del sitio), copy exacto del título de sección y de cada card excerpt (grounded en el contenido real ya seedeado de cada servicio en Phase 19).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/blocks/FeaturedCaseStudiesBlock/` y `FeaturedPostsBlock/` — precedente directo de bloque "vitrina" server-side, mismo grid pattern, mismo `Container` wrapper.
- `src/lib/services-data.ts` — `SERVICE_SLUGS`, `getServicePage(locale, slug)` ya resuelven fetch localizado + allowlist.
- `src/lib/canonical.ts` (Phase 23) — si las cards necesitan generar URLs, seguir el mismo patrón de URL dual-segment ya usado ahí (locale → segmento correcto).

### Established Patterns
- Bloques server-side hacen su propio `getPayload`/fetch dentro del Component, reciben props tipadas desde `payload-types.ts` generado.
- `RenderBlocks.tsx` mapea `blockType` → componente; nuevo bloque se agrega ahí.

### Integration Points
- `src/blocks/ServicesShowcase/` (nuevo)
- `src/blocks/RenderBlocks.tsx` (registro del nuevo blockType)
- Colección/config donde vive el array de blocks de `pages` (leer para confirmar dónde exactamente)
- Seed script del Home (agregar la instancia del bloque al layout)

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia puntual adicional de Juan — seguir el research/SUMMARY.md del milestone (ya citado en ROADMAP.md) que definió esta fase como "aditiva, sin tocar columnas existentes".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
