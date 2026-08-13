# Phase 43: Performance (Response Time + HTML Size) - Context

**Gathered:** 2026-08-02
**Status:** Ready for planning

<domain>
## Phase Boundary

La respuesta del servidor (1.58-2.4s medido real contra producción) y el peso del HTML de Home (276-283KB) mejoran de forma medible, sin violar la constraint de deploy standalone-Node del proyecto (sin ISR/edge nativos, sin acceso a DB durante `next build`). Foco de esta fase: Home + las 4 rutas de mayor tráfico (Servicios índice, Blog listing, un post de detalle, un case-study de detalle) como tracer — no las ~19 rutas sitewide todavía.

</domain>

<decisions>
## Root Cause (investigado en vivo contra https://juan-tech.com, no teórico)

### Response time — 3 causas reales confirmadas

1. **`FeaturedPostsBlock` y `FeaturedCaseStudiesBlock` cada uno hace su propio `payload.findGlobal('featured-content')` independiente** (`src/blocks/FeaturedPostsBlock/Component.tsx:16`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx:15`) — mismo global, 2 round-trips a Postgres idénticos en el mismo render de Home.
2. **Cero capa de cache en absoluto**: grep confirmó `revalidatePath`/`revalidateTag`/`afterChange` con NINGUNA ocurrencia en `src/collections/` ni `src/globals/` — cada ruta es `force-dynamic` puro (necesario para que `next build` no toque Postgres en el container Docker sin red, ver comentario en cada `page.tsx`), y CERO de las queries de Payload está envuelta en cache — cada request re-ejecuta TODO desde cero contra Neon.
3. **El middleware pega a `/api/redirects-lookup` en cada request** (`src/middleware.ts`) — ese route handler hace su propia query Payload a la colección `redirects`, sin cache, en cada navegación (incluida cada carga de página, no solo Home).

### HTML size — 1 causa real confirmada

`featuredContent.featuredPosts`/`featuredCaseStudies` se leen con `depth: 1` y CERO `select` — arrastran el doc completo (richText del post/case-study, `results.metrics`, etc.) al RSC payload serializado inline (`self.__next_f.push(...)`, confirmado 201KB de los 283KB del HTML de Home son estos `<script>` tags), cuando `PostCard`/`CaseStudyCard` solo necesitan título/excerpt/slug/heroImage.

### Fix acordado

- **Cache**: envolver las queries de Payload (`getPayload().find`/`findGlobal`) en `unstable_cache` (Next 15 — cache de datos, no de ruta; la ruta sigue `force-dynamic`, esto NO reintroduce el problema de build sin DB porque `unstable_cache` solo ejecuta en request-time, nunca durante `next build`). TTL backstop: **60s**. Invalidación real vía `revalidateTag` en hooks `afterChange`/`afterDelete` de cada colección/global tocado (Pages, Posts, CaseStudies, FeaturedContent global, Redirects) — el TTL de 60s es solo red de seguridad para el caso raro de un cambio que no dispare el hook, no el mecanismo primario de frescura.
- **Dedup**: `FeaturedPostsBlock`/`FeaturedCaseStudiesBlock` deben dejar de hacer cada uno su propio fetch del global `featured-content` — una sola query (cacheada) reusada por ambos blocks (el planner decide el mecanismo: fetch en el page.tsx padre y pasar por props, o un helper compartido cacheado por `unstable_cache` que ambos llaman — cachear ya resuelve el N+1 real aunque no se comparta la promesa en memoria, porque la segunda llamada pega al cache, no a Postgres).
- **Select**: agregar `select` a las queries de `featured-content`/posts/case-studies usadas solo para cards (título, slug, excerpt, heroImage/media — no richText completo, no `results.metrics`).
- **Middleware**: la query de `redirects` en `/api/redirects-lookup` también se cachea (mismo patrón `unstable_cache` + `revalidateTag` en el hook `afterChange` de la colección `redirects`).

### Alcance de esta fase (tracer, no sitewide)

Solo: Home (`page.tsx`, incluye ambos Featured*Block), Servicios índice, Blog listing, 1 ruta de detalle de post, 1 ruta de detalle de case-study, y el middleware/redirects-lookup (afecta TODAS las rutas, entra por su impacto transversal). El resto de las ~19 rutas queda para una fase futura si esta prueba el patrón sin regresiones.

### Claude's Discretion

- Nombres exactos de cache tags (convención `${collection}-${slug}` o similar, el planner define un esquema consistente).
- Estructura exacta de dónde vive el helper de `unstable_cache` (p.ej. `src/lib/cache.ts` nuevo, o inline por archivo) — seguir la convención de módulos puros ya establecida (`src/lib/canonical.ts`, `src/lib/og-image.ts`).
- Si conviene un helper `getCachedFeaturedContent()` compartido en `src/lib/` en vez de duplicar la llamada `unstable_cache` en cada block — decisión de diseño del planner, cualquiera de las dos resuelve el N+1 real.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/services-data.ts`, `src/lib/canonical.ts`, `src/lib/og-image.ts` — convención ya establecida de módulos `src/lib/` puros/semi-puros para lógica compartida entre rutas.
- Todas las colecciones (`src/collections/*/index.ts`) y globals (`src/globals/*`) — ninguno tiene hooks `afterChange` hoy, se agregan desde cero en esta fase.

### Established Patterns

- Cada `page.tsx` público ya tiene el comentario estándar `force-dynamic` explicando la constraint de build sin DB — no tocar esa constraint, `unstable_cache` es compatible con ella.
- `src/app/api/redirects-lookup/route.ts` — Route Handler Node.js real (no Edge), mismo patrón que cualquier query cacheable.

### Integration Points

- `src/blocks/FeaturedPostsBlock/Component.tsx`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx` — dedup + select.
- `src/app/(frontend)/[locale]/page.tsx` (Home) — primer tracer.
- `src/middleware.ts` + `src/app/api/redirects-lookup/route.ts` — cache transversal.
- `src/collections/Pages/index.ts`, `Posts/index.ts`, `CaseStudies/index.ts`, `src/globals/FeaturedContent/index.ts` (slug confirmado: `featured-content`) — agregar `hooks.afterChange`/`afterDelete` con `revalidateTag`.
- **`redirects` NO es una colección custom** — la registra `redirectsPlugin` de `@payloadcms/plugin-redirects` (`payload.config.ts:113`) sobre `['pages','posts','case-studies','categories','authors']`. Agregar un hook ahí requiere el mecanismo de override del plugin (revisar sus opciones de config, p.ej. algún `overrides`/`hooks` que exponga), NO crear/editar un archivo `src/collections/Redirects/index.ts` que no existe. Si el plugin no expone forma limpia de hookear, alternativa aceptable: cachear la query en `/api/redirects-lookup/route.ts` con un TTL corto (60s) sin `revalidateTag` (el volumen de cambios a redirects es bajo, un backstop de 60s es aceptable ahí sin invalidación activa).

</code_context>

<specifics>
## Specific Ideas

Ninguna referencia visual — esto es 100% infraestructura de datos/cache, sin cambios de UI/contenido.

</specifics>

<deferred>
## Deferred Ideas

- Rollout sitewide a las ~19 rutas restantes — depende de que el tracer de esta fase pruebe el patrón sin regresiones.
- Streaming/Suspense para below-the-fold blocks (testimonials, FAQ) como técnica adicional de reducción de HTML — considerado, no incluido en esta fase (mayor esfuerzo, cambia UX de carga); el fix de `select`+dedup ya ataca la causa raíz confirmada del tamaño.

</deferred>
