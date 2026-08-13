# Phase 15: Sitemap XSL + HTML Navegable - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

`sitemap.xml` deja de ser el `MetadataRoute.Sitemap` nativo de Next.js (sin soporte para processing-instruction) y pasa a un route handler custom que arma el XML a mano con `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`. Se agrega `public/sitemap.xsl` (hoja de estilos, tabla legible). Se agrega `sitemap.html` como página real navegable (mismo contenido que el XML, agrupado por sección). Footer gana un link "Sitemap" apuntando a `/sitemap.html` (no existía, corrige asunción incorrecta de REQUIREMENTS.md).

</domain>

<decisions>
## Implementation Decisions

### Arquitectura técnica
- `src/app/sitemap.xml/route.ts` (route handler custom) reemplaza `src/app/sitemap.ts` (convención nativa de Next, sin soporte XSL) — reusa la misma query a Payload (mismas 5 colecciones: pages/posts/case-studies/authors/categories, mismo filtro `_status: published`, mismos `alternates` ES/EN)
- `public/sitemap.xsl` estático — tabla simple (URL / última modificación / idioma), estilos inline, sin JS, paleta consistente con el sitio (tokens no aplican acá por ser XSL puro, usar valores CSS directos aproximados a la paleta)
- `sitemap.html` servido vía route handler (no puede ser un `page.tsx` de Next con esa extensión literal) — misma data que el XML, agrupada visualmente por sección (Páginas / Blog / Case Studies / Autores / Categorías)

### Footer (hallazgo real durante discuss — corrige asunción de REQUIREMENTS.md)
- El footer actual (`src/components/SiteFooter.tsx`, global `Footer.legalLinks`) **no tiene** un link "Sitemap" — la asunción de SITEMAP-02 ("el footer ya tiene un link Sitemap") viene del sitio de referencia viejo, no del rebuild actual. Se agrega como nuevo item en el array editable `legalLinks` del global Footer (vía seed, no hardcodeado — mantiene el hard rule de "todo editable desde Payload"), apuntando a `/sitemap.html`

### Claude's Discretion
- Diseño visual exacto de la tabla XSL y de la página `sitemap.html` (ambas deben ser legibles, no necesitan pixel-perfect design system compliance — son utilitarias, no páginas de marca)
- Agrupación exacta de secciones en `sitemap.html`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/sitemap.ts` — lógica de query ya construida (5 colecciones, filtro published, alternates ES/EN) — se porta al route handler nuevo, no se reescribe desde cero
- `src/components/SiteFooter.tsx` línea ~154 — `footer.legalLinks?.map(...)` ya renderiza el array editable de links legales

### Integration Points
- `src/app/sitemap.xml/route.ts` (nuevo, reemplaza `src/app/sitemap.ts`)
- `public/sitemap.xsl` (nuevo)
- `src/app/sitemap-page` o ruta equivalente para servir `/sitemap.html` (nuevo)
- Global `Footer` (Payload) — seed que agrega item a `legalLinks[]`

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia visual específica — página utilitaria, criterio de "legible y funcional" alcanza.

</specifics>

<deferred>
## Deferred Ideas

None — discusión se mantuvo dentro del alcance de la fase.

</deferred>
