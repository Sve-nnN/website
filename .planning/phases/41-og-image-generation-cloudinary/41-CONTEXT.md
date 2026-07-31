# Phase 41: OG Image Generation (Cloudinary) - Context

**Gathered:** 2026-07-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Toda página pública devuelve un `og:image` real y dinámico (1200x630, título de la página visible en la imagen), generado vía transforms de Cloudinary igual que `JuanPortfolio` — resuelve el único error crítico de la auditoría opengraph.to (score 17/100, sin `og:image` en ninguna página). Incluye `og:url` y `twitter:card` correctos. NO incluye el resto de meta tags (favicon/canonical/manifest/theme-color — Phase 42) ni performance (Phase 43).

</domain>

<decisions>
## Implementation Decisions

### Cloudinary Assets (verificado en vivo, no asumido)

- Cuenta Cloudinary confirmada compartida con JuanPortfolio (`cloud_name=dmufha3qv`) — verificado vía Admin API (`cloudinary.api.resources`), no por asunción.
- `portfolio/og-scrim` (image, 1200x300 scrim PNG) existe — reusar tal cual, cero re-upload.
- Los 53 `portfolio/fallback-image-1..53` (avif) existen — reusar el mismo pool + misma función de hash determinístico por slug que JuanPortfolio (`getFallbackBySlug`).
- `Array-Bold.woff2` existe como raw asset `type: authenticated` — reusar tal cual (mismo `l_text:Array-Bold.woff2_...` transform string que JuanPortfolio).
- **Cero uploads nuevos a Cloudinary en esta fase.**

### Mecanismo de generación

- Portar casi textual: `cloudinaryUrl.ts` (`getCloudinaryOgWithTitle`), `generateMeta.ts` (orquestador), `mergeOpenGraph.ts` (merge/defaults) de JuanPortfolio — mismo transform string (`w_1200,h_630,c_fill,g_auto,f_jpg,q_auto` + scrim layer `g_south` + text layer `g_south_east,x_50,y_50,co_white`), mismo truncado de título a 65 chars con ellipsis.
- Prioridad de imagen de fondo (orden JuanPortfolio, sin cambios): `meta.image` (plugin-seo, editorial explícito) → hero image del doc si es URL Cloudinary → fallback determinístico por slug (pool de 53).
- No usar `next/og`/`ImageResponse` — Cloudinary hace el rendering server-side, ya validado en producción por JuanPortfolio.

### Meta tags de esta fase (alcance OG-03/OG-04)

- `twitter:card: summary_large_image` sitewide en el layout raíz.
- `twitter:creator` **omitido** — Juan confirmó no tener cuenta de Twitter/X, a diferencia de JuanPortfolio (`@jcangulo`). No inventar ni reusar ese handle.
- `twitter:image` se hereda de `openGraph.images`, sin declaración separada (mismo patrón JuanPortfolio).
- `og:url` resuelto vía `metadataBase` (ya seteado en `[locale]/layout.tsx`) + `openGraph.url` relativo por página.
- `og:locale`: `es_ES`/`en_US` según el patrón de JuanPortfolio.

### Claude's Discretion

- `og:site_name` ("Juan Carlos Angulo") — no estaba en el audit ni fue preguntado, se agrega igual por ser gratis y estándar.
- Estructura exacta del archivo del util portado (nombres de archivo, split en 1 vs 3 módulos) — sigue la convención ya usada en el resto de `src/lib/` de este repo, no la carpeta `src/utilities/` de JuanPortfolio.
- Orden de wiring de las ~18 rutas públicas listadas en el Success Criteria de ROADMAP — el planner decide el agrupamiento en plans/waves.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/cloudinary-adapter.ts` — ya expone `cloud_name`/`api_key`/`api_secret` vía env vars, patrón para leer credenciales.
- `@payloadcms/plugin-seo` ya wireado (`payload.config.ts:93-112`) sobre `pages`, `posts`, `case-studies`, `authors`, `websites` — expone campo `meta.image` (upload) por doc, pero HOY ningún `generateMetadata` lo lee. Este es el gap real: wiring, no schema.
- `src/lib/sitemap-data.ts` — ya tiene `SITE_URL`/`getServerSideURL`-equivalente, reusable para resolver URLs absolutas de `og:url`.

### Established Patterns

- `generateMetadata` existe ya en ~18 archivos de rutas (`grep -rl generateMetadata src/app/(frontend)`), todos devolviendo solo `{ title, description }` — mismo shape a extender en todos.
- `[locale]/layout.tsx` es el único root real del árbol frontend público (no hay `src/app/layout.tsx` por encima) — `metadataBase` ya vive ahí, es donde va `twitter: { card: ... }` sitewide.
- Fuentes locales del sitio (`src/fonts.ts`) usan `Array-Regular.woff2` local — el `Array-Bold.woff2` de Cloudinary es un asset aparte, solo para el transform de imagen, no para CSS.

### Integration Points

- Cada uno de los ~18 `generateMetadata` debe importar el util nuevo y agregar `openGraph.images`/`openGraph.url`.
- Root layout (`src/app/(frontend)/[locale]/layout.tsx`) gana el bloque `twitter`.

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia visual nueva — replicar exactamente el resultado visual de JuanPortfolio (scrim oscuro + título blanco Array-Bold abajo a la derecha, 1200x630).

</specifics>

<deferred>
## Deferred Ideas

None — discusión se mantuvo dentro del alcance de la fase.

</deferred>
