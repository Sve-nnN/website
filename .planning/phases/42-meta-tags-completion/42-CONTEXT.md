# Phase 42: Meta Tags Completion - Context

**Gathered:** 2026-08-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Los 7 warnings/tips restantes de la auditoría opengraph.to quedan resueltos sitewide: favicon (.ico/.png/.svg), apple-touch-icon, `theme-color`, `manifest.json`, y `alternates.canonical` correcto en cada tipo de ruta pública. NO incluye performance (Phase 43) ni la reescritura de `meta.description` corto (36 chars) — eso es contenido, no meta-tag wiring, y no estaba en el alcance original de META-01..05; queda anotado como follow-up, no se toca en esta fase.

</domain>

<decisions>
## Implementation Decisions

### Favicon / Brand Assets

- Reusar el isotipo real de JuanPortfolio (monograma "J" blanco sobre fondo negro redondeado, con dark-mode variant vía `prefers-color-scheme` embebido en el propio SVG) — confirmado por Juan, coherente con el principio de réplica 1:1 del proyecto.
- Fuente: `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/public/favicon.ico` (48x48, 3 tamaños embebidos) y `favicon.svg` (self-contained, sin dependencias externas) — copiar tal cual a `public/` de este repo.
- **No existe ya un apple-touch-icon.png en ningún lado** (verificado — ni en JuanPortfolio, ni generado). Debe rasterizarse desde `favicon.svg` a 180×180 PNG. `sharp` (`0.35.3`) ya es dependencia de este repo (usado por Payload uploads) y soporta input SVG vía librsvg — usar `sharp(svgBuffer).resize(180,180).png()` en un script puntual (no en runtime), commitear el PNG resultante a `public/apple-touch-icon.png`. Mismo patrón para `favicon-32x32.png` (tip del audit).
- El SVG tiene 2 variantes embebidas (`#light-icon`/`#dark-icon` vía media query) — al rasterizar a PNG para apple-touch-icon/32x32, usar la variante `light-icon` (fondo negro, es la que se ve correctamente sin soporte de media-query en un raster estático).

### theme-color / manifest.json

- `theme-color`: `#F7581E` (token `--primary` existente en `globals.css:19`, ember) — confirmado por Juan, cero decisiones de diseño nuevas.
- `manifest.json` — `background_color`: `#FAFAF7` (token `--background` existente), `name`: "Juan Carlos Angulo", `short_name`: "Juan Angulo" (cabe en el límite de caracteres típico de home-screen labels), `theme_color`: mismo `#F7581E`, `start_url`: `/`, `display`: `standalone`, `icons`: referencia a los mismos PNG rasterizados arriba (192x192 y 512x512 — rasterizar esos 2 tamaños adicionales del mismo SVG para cumplir el spec mínimo de manifest).

### Canonical (META-01)

- `alternates.canonical` debe estar presente y ser locale-aware en TODAS las rutas públicas — mismo criterio que Phase 41 usó para `og:url` (~19 rutas). Varias rutas ya tienen `alternates` parcial (ej. Servicios usa `buildServiceAlternates`) — no duplicar esa lógica, solo confirmar/completar donde falte. Verificar con curl real (no solo lectura de código) por tipo de ruta, mismo rigor que Phase 41.

### Fuera de alcance (explícito)

- `twitter:site` (tip nuevo detectado en el audit en vivo) — Juan confirmó en Phase 41 que no tiene cuenta de Twitter/X (misma decisión que `twitter:creator`). No se agrega.
- `meta.description` corto (36 chars, "Ingeniero de software y experto SEO.") — es contenido editorial, no meta-tag wiring. Se anota como follow-up para un futuro milestone/quick-fix de copy, no se toca acá.

### Claude's Discretion

- Mecanismo exacto de generación de PNGs (script puntual vs. paso manual) — usar `sharp`, commitear los PNG resultantes como assets estáticos en `public/`, no generar en runtime.
- Dónde vive la lógica de `alternates.canonical` para rutas que aún no la tienen — seguir el patrón ya establecido (`src/lib/canonical.ts` para Servicios, o un helper sitewide nuevo si la mayoría de rutas no tiene nada hoy) — el planner decide la estructura exacta tras auditar qué rutas ya tienen canonical vs. cuáles no.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/app/(frontend)/[locale]/layout.tsx` — único root real del árbol frontend público, ya tiene `metadataBase` y (desde Phase 41) `twitter: { card: 'summary_large_image' }`. Es donde van `icons`/`themeColor`/`manifest` sitewide.
- `src/lib/canonical.ts` (`buildServiceAlternates`) — patrón ya establecido para canonical/hreflang en Servicios, mismo módulo puro sin acceso a DB que sirvió de modelo para `og-image.ts` en Phase 41.
- `src/lib/og-image.ts` (`buildOpenGraph`, Phase 41) — ya wireado en las ~19 rutas públicas; el mismo listado de rutas aplica para el audit de canonical.
- `public/sitemap.xsl` es el único archivo hoy en `public/` de este repo — carpeta vacía de otros assets estáticos, confirma que nunca hubo favicon.

### Established Patterns

- Server-only asset generation vía `sharp` ya es una dependencia del proyecto (Payload uploads) — no hace falta agregar ninguna librería nueva para rasterizar el SVG.
- Convención de rutas Next.js 15 App Router: `metadata.icons`/`metadata.manifest` se declaran en el `metadata` export de `layout.tsx` (root del árbol público), no por archivo-convención `icon.tsx`/`apple-icon.tsx` (ese patrón genera imágenes dinámicamente en runtime, innecesario acá — los assets son estáticos).

### Integration Points

- `layout.tsx` gana `icons`, `manifest`, y (si Next 15 lo soporta como campo de `metadata` en vez de viewport export — verificar durante research/plan) `themeColor`.
- `public/` gana: `favicon.ico`, `favicon.svg`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` (o `manifest.json` — Next 15 acepta ambos nombres, el audit sugiere `site.webmanifest`, usar ese nombre exacto para calzar la ruta que el audit espera: `/site.webmanifest`).

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia visual nueva — reusar el isotipo real ya existente de JuanPortfolio, sin rediseño.

</specifics>

<deferred>
## Deferred Ideas

- Reescribir `meta.description` corto (36 chars) a 120-160 chars — contenido editorial, no meta-tag wiring, fuera de alcance de META-01..05. Candidato a quick-fix o milestone futuro.
- `twitter:site` — no aplica, Juan no tiene cuenta de Twitter/X (misma decisión que `twitter:creator` en Phase 41).

</deferred>
