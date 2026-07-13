# Phase 26: UI/UX Polish Pass — Low-Risk Components - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous), resolved mostly at Claude's Discretion — Juan specified exact scope and the one concrete complaint (CTA full-width) directly in his milestone request; UI-SPEC (separate step, UI hint yes) resolves the remaining visual specifics grounded in existing tokens/components.

<domain>
## Phase Boundary

CTA strip, navbar (`SiteHeader`), FAQ, sección de clientes (`ClientLogosBlock`), testimonios (`TestimonialsCarousel`) ganan tratamiento visual pulido; Case Studies (listado + detalle) gana el mismo trail de breadcrumbs visual + JSON-LD unificado que Servicios ya tiene (UIPOL-01, 02, 04, 05, 06, 09). No incluye motion/animaciones (Phase 27-28) ni Hero variants/grillas de blog (Phase 28).

</domain>

<decisions>
## Implementation Decisions

### CTA strip (UIPOL-01)
- Root cause ya identificado por el research v1.6 (FEATURES.md.v1.6): `CallToAction/Component.tsx` pone el styling de card (`rounded-2xl shadow-xl ring-1`) en el `<section>` externo, sin wrapper `Container` — a diferencia de todos los demás bloques. Fix: envolver el contenido en `Container`, igual que `Content`/`FAQ`/`TestimonialsCarousel`, manteniendo el fondo/sombra del card.

### Navbar (UIPOL-02)
- "Estado visual distinguible al hacer scroll y/o indicador de ruta activa" — a discreción del planner/UI-SPEC cuál de los dos (o ambos) implementar, usando `--duration-fast`/`--ease-out` ya existentes. No requiere nuevo estado global ni librería — `useState`+scroll listener o CSS `position: sticky` + `backdrop-blur` es suficiente, evaluar en plan-phase.

### FAQ / Clientes / Testimonios (UIPOL-04/05/06)
- Polish visual únicamente — sin cambios de datos/schema, sin nuevos bloques Payload. Reutilizar tokens de Phase 7/10 (shadow/spacing/elevación), mismo criterio que v1.5 aplicó a ServicesShowcase.

### Case Studies breadcrumbs (UIPOL-09)
- Reutilizar `buildTrail()`/`buildBreadcrumbJsonLd()` de `src/lib/breadcrumbs.ts` (Phase 22) — mismo patrón ya extendido a Servicios. El detalle de Case Study hoy arma su propio JSON-LD de breadcrumbs "a mano" (desalineado) sin trail visual — reemplazar por el helper compartido, agregando cualquier segmento de ruta faltante que `buildTrail()` no cubra hoy (case-studies no es un slug de servicio, así que puede necesitar una pequeña extensión del helper — evaluar en plan-phase si conviene generalizar `buildTrail()` o crear una función hermana específica para case-studies, sin duplicar la lógica de URL/locale).
- El listado de Case Studies hoy no tiene trail (es top-level bajo Home) — agregar breadcrumb de 1-2 niveles (Inicio > Case Studies) igual que Servicios lo tiene en su índice.

### Claude's Discretion
Detalles exactos de spacing/tamaño/hover states quedan para el UI-SPEC (paso siguiente, ya que esta fase tiene "UI hint: yes"). Nombre de la función hermana de `buildTrail()` para Case Studies si el planner decide no generalizar el helper existente.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/breadcrumbs.ts` (Phase 22) — `buildTrail()`/`buildBreadcrumbJsonLd()`, patrón de módulo puro a replicar/extender para Case Studies.
- `src/components/JsonLd.tsx` — ya con el fix de escape de Phase 22 review, reusar tal cual.
- Design tokens de Phase 7 (shadow/motion) y Phase 10 (cards) — ya establecidos, no reinventar valores.

### Established Patterns
- Todo bloque de contenido usa `Container` como wrapper — `CallToAction` es la única excepción hoy (bug).
- Breadcrumbs visuales viven en el prop `breadcrumbs` del bloque Hero (variant `listing`), computados server-side y pasados vía `blockProps` override en `RenderBlocks` (patrón de Phase 22).

### Integration Points
- `src/blocks/CallToAction/Component.tsx`
- `src/components/SiteHeader.tsx`
- `src/blocks/FAQ/Component.tsx`
- `src/blocks/ClientLogosBlock/Component.tsx`
- `src/blocks/TestimonialsCarousel/Component.tsx`
- `src/lib/breadcrumbs.ts` (posible extensión)
- Rutas de case-studies: listado + `[slug]` detalle (ubicar archivos exactos en plan-phase)

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia visual puntual más allá de lo ya capturado — Juan especificó el scope de componentes en su pedido original, sin mockups ni referencias externas para esta fase específica (a diferencia de v1.5 donde sí hubo research de competencia visual).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Motion/animaciones explícitamente diferidas a Phase 27-28.

</deferred>
