# Phase 23: Canonical + hreflang hardening - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Mode:** Infrastructure phase — smart discuss skipped. Goal keywords ("hardening") + all-technical success criteria (emits correct value, defines metadataBase, verified via curl) with no user-facing "ve/muestra" language.

<domain>
## Phase Boundary

Las 4 combinaciones de URL de servicio (ES/EN x `/servicios`/`/services`) emiten `alternates.canonical`/`alternates.languages` correctos vía `generateMetadata`, construidos con un helper compartido, y el layout raíz define `metadataBase` una sola vez para todo el sitio (SEOTECH-01/02/03).

</domain>

<decisions>
### Claude's Discretion
Todas las decisiones de implementación quedan a discreción de Claude — fase de infraestructura pura, sin ambigüedad de producto. Guías concretas encontradas en el scouting de código:
- `src/lib/sitemap-data.ts` ya resuelve `SITE_URL` (via `NEXT_PUBLIC_SERVER_URL`, con fallback fuerte a error en producción) — reutilizar esa misma constante para `metadataBase` y para construir canonicals, no duplicar la lógica de resolución de dominio.
- Ningún `generateMetadata` del repo usa `alternates` hoy — no hay convención previa que replicar, se establece en esta fase.
- `metadataBase` debe vivir en `src/app/(frontend)/[locale]/layout.tsx` (root del árbol frontend público) o en un `generateMetadata` de ese layout — evaluar en plan-phase cuál es más correcto dado que Next.js requiere `metadataBase` como campo de `Metadata`, típicamente en el layout raíz.
- El helper compartido de canonical/hreflang debe cubrir, como mínimo, las 4 páginas de Servicios (`servicios/page.tsx`, `servicios/[slug]/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`); extenderlo a otras páginas del sitio queda a discreción si es trivial hacerlo sin romper nada existente, pero no es requirement de esta fase (SEOTECH-01/02 hablan específicamente de "las 4 combinaciones de URL de servicio").

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/sitemap-data.ts` `SITE_URL` — resolución de dominio ya validada y usada en producción.
- `src/lib/breadcrumbs.ts` (Phase 22) — mismo patrón de módulo puro compartido entre los 4 page.tsx de Servicios, buen precedente de estructura para el nuevo helper canonical/hreflang.

### Established Patterns
- Cada `page.tsx` de Servicios ya tiene su propio `generateMetadata` (title/description) — el nuevo helper se integra ahí, no reemplaza lo existente.

### Integration Points
- `src/app/(frontend)/[locale]/layout.tsx` (metadataBase)
- Los 4 `page.tsx` bajo `servicios/` y `services/` (canonical + hreflang por generateMetadata)

</code_context>

<specifics>
## Specific Ideas

Ninguna — fase de infraestructura, sin ambigüedad de producto.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
