---
phase: 55-casos-websites-blog-y-autores
reviewed: 2026-11-10T00:00:00Z
depth: standard
files_reviewed: 92
files_reviewed_list:
  - scripts/db/24-phase55-verify-schema.ts
  - scripts/db/data/55-schema-lib.ts
  - scripts/verify/54-richtext-toc.ts
  - scripts/verify/55-authors-ssr.ts
  - scripts/verify/55-blog-search.mjs
  - scripts/verify/55-blog-ssr.ts
  - scripts/verify/55-cache-tags.ts
  - scripts/verify/55-cases-ssr.ts
  - scripts/verify/55-content-parity.mjs
  - scripts/verify/55-home-fallback-ssr.ts
  - scripts/verify/55-messages-parity.mjs
  - scripts/verify/55-migration-additive.mjs
  - scripts/verify/55-no-sandbox-data.mjs
  - scripts/verify/55-page-contract.mjs
  - scripts/verify/55-post-contract.mjs
  - scripts/verify/55-post-ssr.ts
  - scripts/verify/55-pre-migrate-check.mjs
  - scripts/verify/55-richtext-blocks-ssr.ts
  - scripts/verify/55-richtext-ssr.ts
  - scripts/verify/55-run-all.mjs
  - scripts/verify/55-schema-selftest.ts
  - scripts/verify/55-seo-parity.mjs
  - scripts/verify/55-stub-next-intl-server.cjs
  - scripts/verify/55-tracer-live.mjs
  - scripts/verify/55-websites-ssr.ts
  - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
  - src/app/(frontend)/[locale]/authors/page.tsx
  - src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx
  - src/app/(frontend)/[locale]/blog/[category]/page.tsx
  - src/app/(frontend)/[locale]/blog/page.tsx
  - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
  - src/app/(frontend)/[locale]/case-studies/page.tsx
  - src/app/(frontend)/[locale]/websites/[slug]/page.tsx
  - src/app/(frontend)/[locale]/websites/page.tsx
  - src/collections/Authors/index.ts
  - src/collections/CaseStudies/index.ts
  - src/collections/SpeakingEvents/index.ts
  - src/collections/Websites/index.ts
  - src/components/home/About.tsx
  - src/components/home/AuditorHighlightCard.tsx
  - src/components/home/Services.tsx
  - src/components/mui/BeforeAfter.tsx
  - src/components/mui/CaseMetricCard.tsx
  - src/components/mui/Frames.tsx
  - src/components/mui/PostCard.tsx
  - src/components/mui/ProjectCard.tsx
  - src/components/mui/ReadingProgress.tsx
  - src/components/mui/ScrollRegion.tsx
  - src/components/mui/Section.tsx
  - src/components/mui/format-date.ts
  - src/components/mui/lists.tsx
  - src/components/mui/rich-text/CopyCodeButton.tsx
  - src/components/mui/rich-text/MuiRichText.tsx
  - src/components/mui/rich-text/Toc.tsx
  - src/components/mui/rich-text/blocks.tsx
  - src/components/mui/rich-text/lexical-toc.ts
  - src/components/pages/ServiceDetailPage.tsx
  - src/components/pages/authors/AuthorProfileView.tsx
  - src/components/pages/authors/AuthorTimeline.tsx
  - src/components/pages/authors/AuthorsIndexView.tsx
  - src/components/pages/blog/BlogClosingMui.tsx
  - src/components/pages/blog/BlogIndexView.tsx
  - src/components/pages/blog/BlogNewsletter.tsx
  - src/components/pages/blog/BlogSearch.tsx
  - src/components/pages/blog/CategoryNav.tsx
  - src/components/pages/blog/CategoryPageView.tsx
  - src/components/pages/blog/InlineOfferMui.tsx
  - src/components/pages/blog/PostAuthorAside.tsx
  - src/components/pages/blog/PostByline.tsx
  - src/components/pages/blog/PostPrevNext.tsx
  - src/components/pages/blog/PostRelated.tsx
  - src/components/pages/blog/PostView.tsx
  - src/components/pages/blog/RailOfferMui.tsx
  - src/components/pages/cases/CaseCard.tsx
  - src/components/pages/cases/CaseCompareTable.tsx
  - src/components/pages/cases/CaseDetailView.tsx
  - src/components/pages/cases/CaseStudiesIndexView.tsx
  - src/components/pages/websites/WebsiteDetailView.tsx
  - src/components/pages/websites/WebsitesIndexView.tsx
  - src/lib/about-data.ts
  - src/lib/authors-data.ts
  - src/lib/blog-data.ts
  - src/lib/cache-tags.ts
  - src/lib/cache.ts
  - src/lib/case-study-data.ts
  - src/lib/cta-data.ts
  - src/lib/home-data-b.ts
  - src/lib/person.ts
  - src/lib/service-view-data.ts
  - src/lib/websites-data.ts
  - src/migrations/20261109_044123_phase55_case_lessons.ts
  - src/migrations/index.ts
findings:
  critical: 0
  warning: 5
  info: 8
  total: 13
status: issues_found
---

# Phase 55: Code Review Report

**Reviewed:** 2026-11-10T00:00:00Z
**Depth:** standard (profundo en cache, límites RSC, formularios, JSON-LD y enlaces externos)
**Files Reviewed:** 92
**Status:** issues_found

## Summary

Se revisaron las superficies de casos, websites, blog y autores, la capa `cache.ts` y `cache-tags.ts`, el renderizador de rich text, la migración `phase55_case_lessons` y los verificadores de la fase. Se corrieron `tsc --noEmit` (limpio), `55-messages-parity.mjs`, `55-migration-additive.mjs` y `55-no-sandbox-data.mjs` (los tres en PASS).

Lo que se comprobó y está bien:

- **Límites RSC:** ningún Server Component pasa funciones a un Client Component. `linkFor` se llama siempre dentro de un cliente y su resultado se usa como `component` en ese mismo cliente. Los `ReactNode` que baja la ruta (`clientContent`, `conclusionContent`, respuestas del FAQ) son serializables. El `Map` de `headingIds` solo viaja entre Server Components (`PostView` a `MuiRichText`).
- **Seguridad:** `AFFILIATE_REL` es la única fuente del `rel` de afiliados (no hay otro literal en `src/`). `JsonLd` escapa `<`, `>` y `&`. El enlace externo de Websites sale de `domainFor`/`hostnameOf` (solo hostname, esquema fijo `https://`). Los enlaces sociales del perfil pasan por `safeExternalUrl`. La acción `subscribeToLeadMagnetAction` valida `postPath` y descarta el honeypot.
- **Local API:** todas las lecturas nuevas llevan `overrideAccess: false` dentro de la función cacheada, `select` explícito y `filename: true` en el `populate` de Media. Las excepciones se lanzan dentro de `unstable_cache` y no se guardan.
- **D-26:** el respaldo de la home solo lee. **Migración:** `up` solo crea tablas, índices y llaves foráneas; `down` solo contiene `DROP TABLE`.
- **DANGLING_ANCHOR_ALLOWLIST:** acotada por ruta exacta y por ancla. Otra ruta, o una ancla de más en la misma ruta, sigue dando FAIL. No enmascara otros defectos.

Hay cero hallazgos críticos. Los cinco avisos son de robustez de caché, un cálculo numérico, un callejón sin salida de UX/A11Y y una inconsistencia de saneo de URLs.

## Warnings

### WR-01: Los tres índices tragan el error de lectura y ISR fija una lista vacía con 200

**File:** `src/app/(frontend)/[locale]/case-studies/page.tsx:58-63`, `src/app/(frontend)/[locale]/websites/page.tsx:67-72`, `src/app/(frontend)/[locale]/authors/page.tsx:54-59`
**Issue:** Los comentarios dicen que se captura fuera de `unstable_cache` "para no fijar un fallo transitorio". Eso es cierto para la capa de datos, pero estas rutas son ISR (`revalidate = 60`). Ante un fallo transitorio de Postgres, la ruta renderiza el estado vacío (`emptyTitle`) con HTTP 200 y Next guarda ese HTML hasta la siguiente regeneración. Es el mismo patrón que WR-05 de la fase 54: el fallo se convierte en una página válida y indexable. El resto de la fase (blog índice, categoría, post, perfil de autor) hace lo contrario y deja propagar el error, que es el comportamiento correcto: si una regeneración ISR lanza, Next conserva el último HTML bueno.
**Fix:** No capturar. Dejar que `getCachedCaseStudiesIndex`, `getCachedWebsitesIndex` y `getCachedAuthorsIndex` lancen, igual que en `blog/page.tsx`:
```tsx
const docs = await getCachedCaseStudiesIndex(loc)
const items = toCaseIndexProps(docs, loc)
```
Los detalles (`case-studies/[slug]`, `websites/[slug]`) sí pueden conservar el `try/catch` porque solo pierden secciones secundarias.

### WR-02: Un cambio de autor, categoría o cliente no invalida el detalle del post ni los casos

**File:** `src/lib/cache.ts:503-504` (y `:564-565`), `src/lib/cache-tags.ts:177-189`
**Issue:** `revalidateAuthorsCache` y `revalidateCategoriesCache` llaman `revalidateTag(CACHE_TAGS.posts())` con el comentario "la firma de autor aparece en los posts". Pero `getCachedPost` solo lleva el tag `posts:${slug}` (línea 504), nunca `posts:all`. Ese `revalidateTag(posts)` no toca el detalle del post, que es justo donde se muestran nombre, cargo, bio y avatar del autor (depth 2) y el título de la categoría. Pasa lo mismo con `getCachedCaseStudyBySlug` y `getCachedCaseStudiesIndex`: pueblan `authors` (nombre, bio, avatar) pero solo llevan tags de casos, y el hook de Authors no invalida `case-studies:all`. Resultado: tras editar un autor en el admin, post y caso siguen sirviendo el dato viejo hasta que vence el TTL de 60 s, y además `revalidatePath('/', 'layout')` fuerza un re-render ISR inmediato que vuelve a leer el dato cacheado viejo y lo fija otra ventana de 60 s. El hook promete una invalidación que no ocurre.
**Fix:** Agregar el tag de colección a las lecturas que dependen de otras colecciones:
```ts
// getCachedPost
{ tags: [CACHE_TAGS.post(slug), CACHE_TAGS.posts()], revalidate: CACHE_TTL_SECONDS }
// getCachedCaseStudyBySlug y getCachedCaseStudiesIndex
{ tags: [CACHE_TAGS.caseStudies(), CACHE_TAGS.caseStudy(slug), CACHE_TAGS.authors()], ... }
```
y en `revalidateAuthorsCache` sumar `safeRevalidateTag(CACHE_TAGS.caseStudies())`. Considerar lo mismo para `websites` con el caso relacionado (`relatedCaseStudy`) y el cliente (`clientes`), que hoy no tienen hook.

### WR-03: `parseMetricNumber` convierte cualquier unidad que empiece con "m" en millones

**File:** `src/lib/case-study-data.ts:97-106`
**Issue:** La expresión `^(-?\d+(?:\.\d+)?)\s*([KM])?` es insensible a mayúsculas y no exige un límite después del sufijo. Verificado en node: `"850ms"` da 850 000 000, `"45 min"` da 45 000 000 y `"3 meses"` da 3 000 000, mientras `"2.1s"` da 2.1. Con una métrica de tiempo antes/después como `850ms` a `2.1s` (o `45 min` a `12 min`), el cálculo de `changeRatio`, `beforeShare`/`afterShare` y las barras de `BeforeAfter` sale invertido o absurdo (por ejemplo un -100 % donde hubo una mejora). La comparación de clics no se ve afectada porque su sufijo real es `K`/`M`, pero `resultRows` aplica la función a todas las métricas del caso.
**Fix:** Exigir que el sufijo no continúe con una letra:
```ts
.match(/^(-?\d+(?:\.\d+)?)\s*([KM])?(?![A-Za-z])/i)
```
Con eso `850ms` se interpreta como 850 (sin factor) y `533K clics` sigue dando 533 000. Agregar `850ms`, `45 min` y `3 meses` al selftest de `55-cases-ssr.ts`.

### WR-04: En el estado de error de la captura de email el formulario desaparece y no hay forma de reintentar

**File:** `src/components/mui/rich-text/blocks.tsx:446-503`
**Issue:** Con `?subscribed=error` (correo inválido, límite de frecuencia, fallo de Resend) el bloque muestra solo el texto de error y oculta el formulario (`{!state && <form>}`). La persona no puede corregir el correo ni reintentar sin editar la URL a mano. Además, como la acción responde con `redirect()` a una carga completa, el mensaje de error aparece en el HTML inicial sin `role="alert"` ni gestión de foco, así que un lector de pantalla no anuncia el resultado (A11Y.md, errores de formulario). El defecto viene del componente anterior (`EmailCaptureBlock/Component.tsx`), pero la fase 55 lo reescribió y lo conservó.
**Fix:** Mostrar el formulario también en `error`, y dar al mensaje de error `role="alert"`:
```tsx
{state === 'error' && (
  <Typography role="alert" variant="body1" component="p" sx={{ mt: 2, color: 'error.main' }}>
    {t('errorBody')}
  </Typography>
)}
{(!state || state === 'error') && (<Box component="form" ...>...</Box>)}
```

### WR-05: Las URLs del global `blog-promo` llegan al `href` sin pasar por `sanitizeHref`

**File:** `src/lib/blog-data.ts:235-239` (función `cta`), `src/components/pages/blog/BlogClosingMui.tsx:88-99`, `src/components/pages/blog/InlineOfferMui.tsx:61-62`, `src/components/pages/blog/RailOfferMui.tsx:52-53`
**Issue:** `linkUrl`, `primaryUrl` y `secondaryUrl` los escribe un editor en el admin y se renderizan tal cual en `Link`/`Button`. Todo el resto de la fase (enlaces del cuerpo, redes sociales, ponencias, header y footer) los pasa por `sanitizeHref` (T-53-20, ASVS V5) y rechaza `javascript:`, `//host`, caracteres de control y esquemas fuera de la lista. Aquí no. React 19 bloquea `javascript:` en `href`, así que hoy no es explotable, pero es defensa en profundidad que depende de la versión del framework. Además, `sanitizeHref` aplica `normalizeServiceHref(locale)`, que traduce `/servicios` a `/services` en inglés; una URL escrita a mano en el global no recibe esa normalización y en `/en` puede apuntar a la ruta española.
**Fix:** Resolver el href en `toClosingProps`/`toInlineOffer`/`toRailOffer` (que ya reciben el locale por la ruta) y descartar el CTA si devuelve `null`:
```ts
function cta(label: unknown, url: unknown, locale: 'es' | 'en') {
  const l = text(label)
  const u = sanitizeHref(text(url), locale)
  return l && u ? { label: l, url: u } : null
}
```

## Info

### IN-01: Claves de lista duplicables en perfil de autor y banda de cierre

**File:** `src/components/pages/authors/AuthorProfileView.tsx:70` y `:311`, `src/components/pages/blog/BlogClosingMui.tsx:68`
**Issue:** `key={link.platform}` falla si el admin carga dos enlaces de la misma plataforma (dos `website` es plausible). `key={`${event.title}-${event.by ?? ''}`}` falla con una charla repetida en dos fechas. `key={item}` en los puntos del cierre falla con dos puntos iguales. React avisa y puede duplicar u omitir nodos al reordenar.
**Fix:** Incluir el índice: `key={`${i}-${link.platform}`}` (las demás vistas de la fase ya usan `${i}-${text}`).

### IN-02: El rol del testimonio puede venir de otra fila que su cita

**File:** `src/lib/case-study-data.ts:289-290`
**Issue:** `testimonial` toma la primera fila completa (`pairs(...)[0]`), pero `testimonialRole` lee siempre la fila 0 cruda. Con `maxRows: 1` hoy no pasa, pero si la fila 0 viene incompleta y existe otra, la cita se mostraría con el cargo equivocado.
**Fix:** Construir ambos desde la misma fila (por ejemplo `pairs` devolviendo `authorRole` opcional).

### IN-03: El nodo Person de otros autores emite URLs sin validar

**File:** `src/lib/authors-data.ts:416`, `:418-430`
**Issue:** `sameAs: doc.socialLinks.map((s) => s.url)` emite las URLs del admin tal cual (`mailto:`, `javascript:` o vacías pasarían al JSON-LD, que el validador de rich results marcaría), mientras la vista sí usa `safeExternalUrl`. Además `hasCredential` sale como arreglo vacío cuando ninguna formación tiene `endDate` pasado, y `url` sale como `/authors/undefined` si falta el slug. Se extrajo "sin cambiar un campo" (D-04), por eso no es regresión, pero queda por corregir.
**Fix:** Filtrar `sameAs` con `safeExternalUrl`, omitir `hasCredential` si queda vacío y exigir `doc.slug`.

### IN-04: `SITE_URL` duplicado con otra regla en `authors-data.ts`

**File:** `src/lib/authors-data.ts:30`
**Issue:** `process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'` reimplementa la constante de `sitemap-data.ts` sin normalizar la barra final (la otra sí la quita). Una variable con `/` produciría `https://x.com//authors/slug`. El módulo ya importa `person.ts`, que importa `sitemap-data`, así que no hay motivo para duplicarla.
**Fix:** `import { SITE_URL } from '@/lib/sitemap-data'`.

### IN-05: El perfil de cualquier autor muestra todas las ponencias

**File:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx:93`, `src/lib/authors-data.ts:376`
**Issue:** `getCachedSpeakingEvents(loc)` trae todas las ponencias y `mapEvents` no filtra por autor (la colección no tiene relación con `authors`). Es paridad con el sitio anterior y hoy hay un solo autor, pero un segundo autor heredaría las charlas de Juan en su perfil.
**Fix:** Decisión de producto: o se documenta, o se muestra el bloque solo cuando `isSitePerson`.

### IN-06: Los enlaces externos usan `rel` distintos según la vista

**File:** `src/components/pages/websites/WebsiteDetailView.tsx:132`, `src/components/pages/authors/AuthorProfileView.tsx:50`, `src/components/mui/rich-text/MuiRichText.tsx:128`
**Issue:** Websites y autores usan `rel="noopener"`; el cuerpo de los posts usa `noopener noreferrer`. Si la intención es enviar el `Referer` al sitio del cliente, está bien, pero no hay una constante única como `AFFILIATE_REL` y la diferencia es silenciosa.
**Fix:** Definir `EXTERNAL_REL` junto a `AFFILIATE_REL` y usarla en las tres, o dejar un comentario con la razón.

### IN-07: Colores fijos en `BlogClosingMui`

**File:** `src/components/pages/blog/BlogClosingMui.tsx:~36-44` y `:88-110`
**Issue:** `#12141C`, `#FAFAF7` y `rgba(250,250,247,...)` quedan fuera del tema. Si cambian los tokens `band.*`, esta banda no los sigue. El resto de las vistas de la fase usa `band.bg`, `band.text` y `band.muted`.
**Fix:** Usar los tokens `band` del tema.

### IN-08: Categorías sin entradas responden 200 e indexables

**File:** `src/app/(frontend)/[locale]/blog/[category]/page.tsx:117-131`
**Issue:** La ruta de una categoría existente pero vacía (documentado para `general`) devuelve 200 con estado vacío y sin `robots: noindex`. Es una página delgada indexable si el sitemap o un enlace la expone.
**Fix:** Añadir `robots: { index: false, follow: true }` en `generateMetadata` cuando la categoría no tiene posts, o devolver `notFound()` si está vacía.

---

_Reviewed: 2026-11-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
