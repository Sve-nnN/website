// Cache tag scheme + invalidation hooks for Phase 43 (Performance: Response
// Time + HTML Size). Pure module: NO import of `payload`/`@payload-config`
// here, on purpose -- collections/globals (Pages, Posts, CaseStudies,
// FeaturedContent) import this file to wire their `hooks`, and those same
// collections are imported BY payload.config.ts. Importing `@payload-config`
// from this file would create a cycle:
//   payload.config.ts -> collections/* -> lib/cache-tags.ts -> @payload-config
// `src/lib/cache.ts` (the module that DOES need `getPayload`/`@payload-config`
// for the actual cached fetchers) is consumed only by page.tsx/component
// files, never by collections/globals, so it never re-introduces this cycle.
//
// TTL is a 60s safety net only -- the primary freshness mechanism is the
// `revalidateTag` calls below, wired into each collection/global's
// `afterChange`/`afterDelete` hooks in Task 1/2.

import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import type {
  Page,
  Post,
  CaseStudy,
  Category,
  AffiliateLink,
  Website,
  Author,
  SpeakingEvent,
} from '@/payload-types'

export const CACHE_TTL_SECONDS = 60

/**
 * `revalidateTag` only works inside a Next request/render context. A standalone
 * script (`tsx scripts/...`) writing through the Local API runs the same
 * `afterChange` hooks, and there Next throws:
 *
 *   Invariant: static generation store missing in revalidateTag pages:home
 *
 * That threw AFTER the row was already written, so the script died mid-run
 * reporting failure on a write that had actually landed — the worst of both.
 * Confirmed 2026-08-17 running scripts/neon/01-apply-phase14-keywords.ts.
 *
 * Outside a request there is no Next cache to invalidate, so skipping is the
 * correct behaviour, not a workaround. The server process keeps invalidating
 * normally; a script write falls back to the 60s TTL above.
 */
function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag)
  } catch {
    // No request context (standalone script / CLI). Nothing to invalidate.
  }
}

/**
 * Invalida la cache de RUTA, que es distinta de la de datos.
 *
 * Desde SEO-06 las paginas publicas son ISR (`revalidate = 60` con
 * `generateStaticParams` vacio): Next guarda el HTML renderizado y lo sirve sin
 * volver a ejecutar el componente. `revalidateTag` limpia los fetchers de
 * src/lib/cache.ts, pero NO ese HTML — sin esto, publicar en el admin no se
 * veria hasta que venciera el TTL de 60 s.
 *
 * Es a proposito un martillo: `'/'` con `'layout'` alcanza TODAS las rutas bajo
 * el layout raiz. Mapear cada doc a su URL exacta significaria repetir aca la
 * logica de blog-paths, los slugs traducidos de servicios y los dos idiomas, y
 * cada vez que un mapeo quedara mal la pagina se serviria vieja sin que nadie
 * lo note. El costo real de pasarse de invalidacion es un render de ~1 s en la
 * primera visita despues de publicar, en un sitio con el trafico de este.
 */
function safeRevalidateAllPaths(): void {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // Igual que arriba: sin contexto de request no hay nada que invalidar.
  }
}

export const CACHE_TAGS = {
  page: (slug: string) => `pages:${slug}`,
  posts: () => 'posts:all',
  post: (slug: string) => `posts:${slug}`,
  caseStudies: () => 'case-studies:all',
  caseStudy: (slug: string) => `case-studies:${slug}`,
  categories: () => 'categories:all',
  websites: () => 'websites:all',
  authors: () => 'authors:all',
  speakingEvents: () => 'speaking-events:all',
  featuredContent: () => 'featured-content',
  blogPromo: () => 'blog-promo',
  header: () => 'header',
  footer: () => 'footer',
  homePage: () => 'home-page',
  aboutPage: () => 'about-page',
  redirects: () => 'redirects',
  affiliateLinks: () => 'affiliate-links:all',
}

// --- Pages ---

export const revalidatePagesCache: CollectionAfterChangeHook<Page> = ({ doc }) => {
  if (doc.slug) safeRevalidateTag(CACHE_TAGS.page(doc.slug))
  safeRevalidateAllPaths()
  return doc
}

export const revalidatePagesCacheOnDelete: CollectionAfterDeleteHook<Page> = ({ doc }) => {
  if (doc.slug) safeRevalidateTag(CACHE_TAGS.page(doc.slug))
  safeRevalidateAllPaths()
  return doc
}

// --- Posts ---

export const revalidatePostsCache: CollectionAfterChangeHook<Post> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.posts())
  if (doc.slug) safeRevalidateTag(CACHE_TAGS.post(doc.slug))
  safeRevalidateAllPaths()
  return doc
}

export const revalidatePostsCacheOnDelete: CollectionAfterDeleteHook<Post> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.posts())
  if (doc.slug) safeRevalidateTag(CACHE_TAGS.post(doc.slug))
  safeRevalidateAllPaths()
  return doc
}

// --- Case Studies ---

export const revalidateCaseStudiesCache: CollectionAfterChangeHook<CaseStudy> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.caseStudies())
  if (doc.slug) safeRevalidateTag(CACHE_TAGS.caseStudy(doc.slug))
  safeRevalidateAllPaths()
  return doc
}

export const revalidateCaseStudiesCacheOnDelete: CollectionAfterDeleteHook<CaseStudy> = ({
  doc,
}) => {
  safeRevalidateTag(CACHE_TAGS.caseStudies())
  if (doc.slug) safeRevalidateTag(CACHE_TAGS.caseStudy(doc.slug))
  safeRevalidateAllPaths()
  return doc
}

// --- Websites (fase 55). La colección es pública; el índice y el detalle leen
// por la capa cacheada con `CACHE_TAGS.websites()`. No hay tag por slug: la
// lectura del detalle comparte el tag de colección, así que basta con este.
//
// LÍMITE (T-55-15): un hook corre en el proceso que ejecuta el admin, que es
// producción (master). El preview (dev.juan-tech.com) es otro proceso y no
// recibe este `revalidateTag`: ahí un cambio llega por el TTL de 60 s de
// `unstable_cache` más la ventana ISR de 60 s de la ruta. La revalidación en
// vivo se comprueba en la compuerta humana de la fase 57, no en un script. ---

export const revalidateWebsitesCache: CollectionAfterChangeHook<Website> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.websites())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateWebsitesCacheOnDelete: CollectionAfterDeleteHook<Website> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.websites())
  safeRevalidateAllPaths()
  return doc
}

// --- Authors (fase 55). La firma de autor aparece en el detalle del post y en
// los casos. Esas lecturas (`getCachedPost`, `getCachedCaseStudyBySlug` y
// `getCachedCaseStudiesIndex`) llevan `CACHE_TAGS.authors()` en sus tags, así
// que invalidar el tag de autores las alcanza. El tag de posts se conserva para
// las lecturas de listado de posts. Mismo límite de proceso que Websites (ver
// arriba). ---

export const revalidateAuthorsCache: CollectionAfterChangeHook<Author> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.authors())
  safeRevalidateTag(CACHE_TAGS.posts())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateAuthorsCacheOnDelete: CollectionAfterDeleteHook<Author> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.authors())
  safeRevalidateTag(CACHE_TAGS.posts())
  safeRevalidateAllPaths()
  return doc
}

// --- Speaking Events (fase 55). Las ponencias salen en Sobre mí y en el perfil
// de autor. Mismo límite de proceso que Websites (ver arriba). ---

export const revalidateSpeakingEventsCache: CollectionAfterChangeHook<SpeakingEvent> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.speakingEvents())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateSpeakingEventsCacheOnDelete: CollectionAfterDeleteHook<SpeakingEvent> = ({
  doc,
}) => {
  safeRevalidateTag(CACHE_TAGS.speakingEvents())
  safeRevalidateAllPaths()
  return doc
}

// --- Categories (a category's slug is a URL segment now — /blog/<category>/
// <post> — so renaming one must invalidate the post caches too, otherwise
// links keep pointing at the old segment until the 60s TTL lapses). El detalle
// del post lleva `CACHE_TAGS.categories()` en sus tags porque puebla la
// categoría, así que este hook sí lo alcanza. ---

export const revalidateCategoriesCache: CollectionAfterChangeHook<Category> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.categories())
  safeRevalidateTag(CACHE_TAGS.posts())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateCategoriesCacheOnDelete: CollectionAfterDeleteHook<Category> = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.categories())
  safeRevalidateTag(CACHE_TAGS.posts())
  safeRevalidateAllPaths()
  return doc
}

// --- Featured Content (global — no afterDelete for globals) ---

export const revalidateFeaturedContentCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.featuredContent())
  safeRevalidateAllPaths()
  return doc
}

// --- Blog Promo (global — la oferta inline y la banda de cierre del blog
// aparecen en /blog, en cada categoría y en cada post, así que un cambio acá
// tiene que invalidar también los caches de posts y categorías) ---

export const revalidateBlogPromoCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.blogPromo())
  safeRevalidateAllPaths()
  return doc
}

// --- Header y Footer (fase 53, D-12 — globals del shell. Aparecen en TODAS las
// rutas, así que además de su tag invalidan el HTML ISR de todas las rutas, igual
// que BlogPromo. En el preview no llega este `revalidateTag` (el admin de
// producción es otro proceso): ahí un cambio se refleja por el TTL de 60 s de
// `unstable_cache` más el de 60 s del ISR de cada página, entre 60 y 120 s) ---

export const revalidateHeaderCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.header())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateFooterCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.footer())
  safeRevalidateAllPaths()
  return doc
}

// --- Home (contenido nuevo, fase 54). Global privado que lee la home del
// rediseño y Contacto; mismo patrón que Header y Footer. ---

export const revalidateHomePageCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.homePage())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateAboutPageCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.aboutPage())
  safeRevalidateAllPaths()
  return doc
}

// --- Affiliate Links (Phase 46 — hand-authored collection, hooks wired
// DIRECTLY in AffiliateLinks/index.ts, NOT via `overrides.hooks`: that shape
// is specific to wrapping a plugin's own collection config, per
// 46-RESEARCH.md Pitfall 3) ---

export const revalidateAffiliateLinksCache: CollectionAfterChangeHook<AffiliateLink> = ({
  doc,
}) => {
  safeRevalidateTag(CACHE_TAGS.affiliateLinks())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateAffiliateLinksCacheOnDelete: CollectionAfterDeleteHook<AffiliateLink> = ({
  doc,
}) => {
  safeRevalidateTag(CACHE_TAGS.affiliateLinks())
  safeRevalidateAllPaths()
  return doc
}

// --- Redirects (registered by @payloadcms/plugin-redirects, wired via
// `overrides.hooks` in payload.config.ts — Task 2) ---

export const revalidateRedirectsCache: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.redirects())
  safeRevalidateAllPaths()
  return doc
}

export const revalidateRedirectsCacheOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.redirects())
  safeRevalidateAllPaths()
  return doc
}
