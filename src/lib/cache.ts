// Cached data-fetch layer for Phase 43 (Performance: Response Time + HTML
// Size). Wraps Payload's Local API (`getPayload().find`/`findGlobal`) in
// Next 15's `unstable_cache` -- this is DATA caching, not ROUTE caching. All
// routes stay `force-dynamic` (self-hosted Dokploy build has no DB access
// during `next build`); `unstable_cache` only ever executes at request time,
// so it does not reintroduce that constraint.
//
// This module is consumed ONLY by page.tsx/component files, never by
// `collections/`/`globals/` (those import the config-free `./cache-tags`
// instead), so importing `@payload-config` here does not create the import
// cycle documented in cache-tags.ts.
//
// SECURITY (T-43-02): Payload's Local API defaults to `overrideAccess: true`,
// which bypasses each collection's `read: authenticatedOrPublished` access
// rule. Without an explicit `overrideAccess: false` on every fetcher below, a
// draft doc could get cached by `unstable_cache` and served to ANY anonymous
// visitor for up to 60s -- worse than the single-request leak already fixed
// in Phase 24 (WR-02), because a cache hit amplifies it across visitors.
// Every fetcher in this file passes `overrideAccess: false` explicitly, same
// pattern as `src/lib/services-data.ts`.

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Post, CaseStudy, Category, AffiliateLink, HomePage, AboutPage } from '@/payload-types'
import { CACHE_TAGS, CACHE_TTL_SECONDS } from './cache-tags'
import { resolvePrimaryCategorySlug } from './blog-paths'

export type Locale = 'es' | 'en'

export type PostCardData = Pick<
  Post,
  'id' | 'title' | 'slug' | 'excerpt' | 'heroImage' | 'categories' | 'publishedAt'
>
export type CaseStudyCardData = Pick<
  CaseStudy,
  'id' | 'title' | 'slug' | 'sector' | 'heroMetric' | 'client'
>

// --- Pages (Home in this plan; also used by other page.tsx routes) ---

export function getCachedPageBySlug(slug: string, locale: Locale, depth?: number) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        overrideAccess: false,
        ...(depth !== undefined ? { depth } : {}),
      })
      return docs[0]
    },
    ['page', slug, locale, String(depth ?? 'default')],
    { tags: [CACHE_TAGS.page(slug)], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Featured Content global (deduped: FeaturedPostsBlock +
// FeaturedCaseStudiesBlock both call this instead of each doing their own
// `payload.findGlobal` -- root cause #1 of 43-CONTEXT.md) ---

export function getCachedFeaturedContent(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({
        slug: 'featured-content',
        depth: 1,
        locale,
        // NOT overrideAccess:false here (unlike every other fetcher in this
        // file): `featured-content` has no `versions`/drafts (see
        // src/globals/FeaturedContent/index.ts), so there is no draft state
        // to leak — the security rationale in this file's header comment
        // doesn't apply to it. Its real `access` config (Payload's default
        // for globals without an explicit `access` block, confirmed via
        // `GET /api/globals/featured-content` -> 403 for ALL other globals
        // too, e.g. header/footer) denies unauthenticated reads outright, so
        // overrideAccess:false here throws instead of returning empty —
        // this broke Home in production (HTTP 500) until this fix.
        populate: {
          // `categories` rides along so featured post cards can build their
          // /blog/<category>/<slug> href. At depth 1 it arrives as bare ids,
          // which `FeaturedPostsBlock` resolves through
          // `getCachedPostCategoryMap`.
          posts: { title: true, slug: true, excerpt: true, heroImage: true, categories: true },
          'case-studies': { title: true, slug: true, sector: true, heroMetric: true, client: true },
        },
      })
    },
    ['featured-content', locale],
    {
      tags: [CACHE_TAGS.featuredContent(), CACHE_TAGS.posts(), CACHE_TAGS.caseStudies()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

// --- Blog Promo global (oferta inline + banda de cierre, leído por /blog,
// por cada categoría y por cada post) ---

export function getCachedBlogPromo(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({ slug: 'blog-promo', locale, overrideAccess: false })
    },
    ['blog-promo', locale],
    { tags: [CACHE_TAGS.blogPromo()], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Header y Footer globals (fase 53, D-10 y D-12: el shell los lee en cada
// render; los hooks de src/lib/cache-tags.ts los invalidan al publicar).
//
// NOT overrideAccess:false en estos dos, mismo criterio que
// getCachedFeaturedContent: no tienen versions/drafts, así que no hay borrador
// que filtrar, y su `access` por defecto (el de los globals sin bloque
// explícito) niega la lectura anónima -> `overrideAccess:false` lanzaría. Son
// navegación pública (T-53-21, aceptado). ---

export function getCachedHeader(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({ slug: 'header', depth: 1, locale })
    },
    ['header', locale],
    { tags: [CACHE_TAGS.header()], revalidate: CACHE_TTL_SECONDS },
  )()
}

export function getCachedFooter(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({ slug: 'footer', depth: 1, locale })
    },
    ['footer', locale],
    { tags: [CACHE_TAGS.footer()], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Home y Sobre mí (fase 54, contenido sombra). Globals privados sin
// versions ni drafts.
//
// NOT overrideAccess:false, misma excepción documentada que getCachedHeader:
// un global sin acceso de lectura lanza con esa opción, y aquí el acceso por
// defecto (solo usuarios autenticados) es justo lo que mantiene el copy sin
// aprobar fuera de la API pública. Se lee por Local API en el servidor y nunca
// se devuelve un borrador porque no existen.
//
// Respaldo de idioma: para EN se lee con fallbackLocale:false y, si el campo
// centinela viene vacío, se marca isFallback y se relee con el respaldo al
// español, para que la vista muestre TranslationNotice con lang es. ---

export type ShadowPageResult<T> = { data: T; isFallback: boolean }

export function getCachedHomePage(locale: Locale): Promise<ShadowPageResult<HomePage>> {
  return unstable_cache(
    async (): Promise<ShadowPageResult<HomePage>> => {
      const payload = await getPayload({ config })
      if (locale === 'es') {
        const data = await payload.findGlobal({ slug: 'home-page', depth: 1, locale })
        return { data, isFallback: false }
      }
      const strict = await payload.findGlobal({
        slug: 'home-page',
        depth: 1,
        locale,
        fallbackLocale: false,
      })
      if (strict.tagline && strict.tagline.trim() !== '') {
        return { data: strict, isFallback: false }
      }
      const data = await payload.findGlobal({ slug: 'home-page', depth: 1, locale })
      return { data, isFallback: true }
    },
    ['home-page', locale],
    { tags: [CACHE_TAGS.homePage()], revalidate: CACHE_TTL_SECONDS },
  )()
}

export function getCachedAboutPage(locale: Locale): Promise<ShadowPageResult<AboutPage>> {
  return unstable_cache(
    async (): Promise<ShadowPageResult<AboutPage>> => {
      const payload = await getPayload({ config })
      if (locale === 'es') {
        const data = await payload.findGlobal({ slug: 'about-page', depth: 1, locale })
        return { data, isFallback: false }
      }
      const strict = await payload.findGlobal({
        slug: 'about-page',
        depth: 1,
        locale,
        fallbackLocale: false,
      })
      if (strict.hero?.lead && strict.hero.lead.trim() !== '') {
        return { data: strict, isFallback: false }
      }
      const data = await payload.findGlobal({ slug: 'about-page', depth: 1, locale })
      return { data, isFallback: true }
    },
    ['about-page', locale],
    { tags: [CACHE_TAGS.aboutPage()], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Enlaces recientes del footer (fase 53, WR-08). Antes SiteFooter llamaba
// `payload.find` directo, fuera de la disciplina de este modulo: sin
// `overrideAccess:false`, sin cache y con la profundidad por defecto. ---

export type FooterPostLink = Pick<Post, 'id' | 'title' | 'slug' | 'categories'>
export type FooterCaseStudyLink = Pick<CaseStudy, 'id' | 'title' | 'slug'>

export function getCachedLatestPostLinks(locale: Locale, limit: number): Promise<FooterPostLink[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        limit,
        locale,
        sort: '-publishedAt',
        where: { _status: { equals: 'published' } },
        overrideAccess: false,
        select: { title: true, slug: true, categories: true },
        populate: { categories: { slug: true } },
      })
      return docs as FooterPostLink[]
    },
    ['footer-latest-posts', locale, String(limit)],
    { tags: [CACHE_TAGS.posts()], revalidate: CACHE_TTL_SECONDS },
  )()
}

export function getCachedLatestCaseStudyLinks(
  locale: Locale,
  limit: number,
): Promise<FooterCaseStudyLink[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'case-studies',
        limit,
        locale,
        sort: '-createdAt',
        where: { _status: { equals: 'published' } },
        overrideAccess: false,
        select: { title: true, slug: true },
      })
      return docs as FooterCaseStudyLink[]
    },
    ['footer-latest-case-studies', locale, String(limit)],
    { tags: [CACHE_TAGS.caseStudies()], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Categories (blog URL structure: /blog/<category>/<post>) ---

export type CategoryData = Pick<Category, 'id' | 'title' | 'slug' | 'description'>

/**
 * All categories for a locale. Small (5 docs) and read on every blog route —
 * the category listing resolves its slug against this instead of querying by
 * slug, so an unknown segment costs no extra round trip.
 */
export function getCachedCategories(locale: Locale): Promise<CategoryData[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'categories',
        locale,
        limit: 100,
        sort: 'title',
        overrideAccess: false,
        select: { title: true, slug: true, description: true },
      })
      return docs
    },
    ['categories', locale],
    { tags: [CACHE_TAGS.categories()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * Lista ligera de TODOS los posts publicados (fase 55, plan 55-10), mas
 * recientes primero. La usan el indice del blog (filas por categoria, entrada
 * destacada y busqueda en el cliente) y cada pagina de categoria, asi que una
 * sola lectura cacheada por idioma sirve a las cinco rutas.
 *
 * Ligera a proposito: `select` deja fuera `content` (58 cuerpos de Lexical no
 * viajan al listado) y `populate` reduce la categoria a slug y titulo y la
 * portada a lo que pinta la tarjeta. `filename` es obligatorio en el populate
 * de media (el `url` lo genera el adaptador de Cloudinary desde el filename).
 *
 * `overrideAccess: false` va DENTRO de la funcion cacheada: un borrador no debe
 * entrar a la cache ni a la lista que se serializa al cliente (T-55-36).
 * Si la lectura falla, la funcion lanza: `unstable_cache` no guarda una
 * excepcion, y la ruta la deja propagar (500) en vez de servir una lista vacia.
 */
export function getCachedBlogPostList(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        locale,
        sort: '-publishedAt',
        limit: 0,
        pagination: false,
        depth: 1,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          categories: true,
          publishedAt: true,
          heroImage: true,
        },
        populate: {
          categories: { slug: true, title: true },
          media: { url: true, filename: true, width: true, height: true, alt: true },
        },
      })
      return docs
    },
    ['blog-post-list', locale],
    { tags: [CACHE_TAGS.posts(), CACHE_TAGS.categories()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * Websites index (fase 55, plan 55-01). Todos los sitios publicados, mas
 * recientes primero: la coleccion no tiene `publishedAt`, asi que se ordena por
 * `-createdAt` (no sirve `getCachedArchive`, que ordena por un campo que no
 * existe aqui).
 *
 * `overrideAccess: false` va DENTRO de la funcion cacheada: un sitio que nunca
 * se publico no debe entrar a la cache (clase SEO-40). `select` y `populate`
 * limitan lo que viaja a los campos publicos de Media y del cliente.
 *
 * Si la lectura falla, la funcion lanza: `unstable_cache` no guarda una
 * excepcion, y la ruta tampoco la captura: Next conserva el ultimo HTML bueno
 * en lugar de fijar una lista vacia con 200.
 */
export function getCachedWebsitesIndex(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'websites',
        locale,
        sort: '-createdAt',
        limit: 100,
        pagination: false,
        depth: 1,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          role: true,
          industry: true,
          year: true,
          stack: true,
          screenshots: true,
          lighthouse: true,
          lighthouseCapturedAt: true,
          client: true,
        },
        populate: {
          // `filename` es obligatorio: el `url` de Media lo genera el adaptador
          // de Cloudinary a partir del filename en `afterRead`, y con un
          // `populate` que solo pide `url` llega como null (medido en el
          // preview, 2026-11-09: seis tarjetas sin captura).
          media: { url: true, filename: true, width: true, height: true, alt: true },
          clientes: { websiteUrl: true, name: true },
        },
      })
      return docs
    },
    ['websites-index', locale],
    { tags: [CACHE_TAGS.websites()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * Detalle de un sitio por slug (fase 55, plan 55-08). Mismas reglas que el
 * indice: `overrideAccess: false` dentro de la cache (un borrador no se cachea),
 * `select` con los campos que usa el detalle y `populate` solo de los campos
 * publicos de Media, del cliente y del caso relacionado.
 *
 * `filename` va junto a `url` en Media: el `url` lo genera el adaptador de
 * Cloudinary desde el filename, y sin el llega null (55-01). Eso incluye
 * `meta.image`, que alimenta la imagen Open Graph.
 *
 * Devuelve null si el slug no existe (la ruta responde notFound). Si la lectura
 * falla, lanza: `unstable_cache` no guarda una excepcion.
 */
export function getCachedWebsiteBySlug(slug: string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'websites',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        depth: 2,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          role: true,
          industry: true,
          year: true,
          highlights: true,
          challenges: true,
          stack: true,
          screenshots: true,
          lighthouse: true,
          lighthouseCapturedAt: true,
          client: true,
          relatedCaseStudy: true,
          meta: true,
        },
        populate: {
          media: { url: true, filename: true, width: true, height: true, alt: true },
          clientes: { websiteUrl: true, name: true },
          'case-studies': { title: true, slug: true },
        },
      })
      return docs[0] ?? null
    },
    ['website', slug, locale],
    { tags: [CACHE_TAGS.websites()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * `postSlug -> categorySlug` for every published post. Backs two things that
 * would otherwise need a per-item query: building `/blog/<category>/<slug>`
 * links from contexts that only know a post slug (search results, footer),
 * and 301ing legacy `/blog/<postSlug>` URLs to their new home.
 */
export function getCachedPostCategoryMap(locale: Locale): Promise<Record<string, string>> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        locale,
        limit: 0,
        pagination: false,
        overrideAccess: false,
        select: { slug: true, categories: true },
        populate: { categories: { slug: true } },
      })

      const map: Record<string, string> = {}
      for (const doc of docs) {
        if (doc.slug) map[doc.slug] = resolvePrimaryCategorySlug(doc.categories)
      }
      return map
    },
    ['post-category-map', locale],
    {
      tags: [CACHE_TAGS.posts(), CACHE_TAGS.categories()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

// --- Post / Case Study detail (not wired to any route in this plan --
// ready for 43-02/43-03 to consume without touching this file again) ---

export function getCachedPost(slug: string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        locale,
        // depth 2, not 1: at depth 1 `author` arrives populated but
        // `author.avatar` is still a bare id, so `AuthorByline` and
        // `AuthorCard` both fell through to their initials fallback and the
        // post pages showed an empty circle where the photo belongs. The
        // avatar lives one relationship deeper than the author, so the author
        // being populated is not enough.
        depth: 2,
        limit: 1,
        overrideAccess: false,
      })
      return docs[0]
    },
    ['post', slug, locale],
    {
      // depth 2 puebla autor (nombre, cargo, bio, avatar) y categorias: un cambio
      // en cualquiera de esas colecciones tiene que invalidar tambien el detalle.
      tags: [CACHE_TAGS.post(slug), CACHE_TAGS.authors(), CACHE_TAGS.categories()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

/**
 * Detalle de un caso de exito por slug (fase 55, plan 55-09). Reemplaza a la
 * lectura sin `select` de antes. Mismas reglas que el indice:
 * `overrideAccess: false` dentro de la cache (un borrador no se cachea,
 * T-55-31) y `select` con los campos que usan el detalle, `generateMetadata` y
 * el JSON-LD (incluidos `lessons`, `meta`, `createdAt` y `updatedAt`).
 *
 * `depth: 2` y `populate` limitado a los campos publicos: Media (con
 * `filename`, de donde el adaptador de Cloudinary genera el `url`; incluye
 * `heroImage` y `meta.image`), el cliente (solo el nombre) y el autor con su
 * avatar, que vive una relacion mas abajo (aside de E-E-A-T y JSON-LD).
 *
 * Devuelve undefined si el slug no existe (la ruta responde notFound). Si la
 * lectura falla, lanza: `unstable_cache` no guarda una excepcion.
 */
export function getCachedCaseStudyBySlug(slug: string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'case-studies',
        where: { slug: { equals: slug } },
        locale,
        depth: 2,
        limit: 1,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          heroMetric: true,
          heroSubtitle: true,
          client: true,
          sector: true,
          period: true,
          kpis: true,
          clientContext: true,
          challenge: true,
          solution: true,
          testimonialSection: true,
          results: true,
          lessons: true,
          conclusion: true,
          heroImage: true,
          author: true,
          meta: true,
          createdAt: true,
          updatedAt: true,
        },
        populate: {
          media: { url: true, filename: true, width: true, height: true, alt: true },
          clientes: { name: true },
          authors: { name: true, jobTitle: true, bio: true, slug: true, avatar: true },
        },
      })
      return docs[0]
    },
    ['case-study', slug, locale],
    {
      // `populate.authors` trae nombre, cargo, bio y avatar del autor: el tag de
      // autores invalida el detalle cuando cambia el perfil.
      tags: [CACHE_TAGS.caseStudies(), CACHE_TAGS.caseStudy(slug), CACHE_TAGS.authors()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

/**
 * Indice de casos de exito (fase 55, plan 55-09). Todos los casos publicados,
 * mas recientes primero: la coleccion no tiene `publishedAt`, asi que se ordena
 * por `-createdAt` (Pitfall 11; no sirve `getCachedArchive`).
 *
 * `overrideAccess: false` va DENTRO de la funcion cacheada: un caso que nunca
 * se publico no debe entrar a la cache (T-55-31). `select` trae solo lo que usan
 * las tarjetas y la comparacion de clics (`results`).
 *
 * Si la lectura falla, lanza: `unstable_cache` no guarda una excepcion, y la
 * ruta tampoco la captura: Next conserva el ultimo HTML bueno.
 */
export function getCachedCaseStudiesIndex(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'case-studies',
        locale,
        sort: '-createdAt',
        limit: 100,
        pagination: false,
        depth: 1,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          sector: true,
          heroMetric: true,
          heroSubtitle: true,
          period: true,
          results: true,
          // Plan 55-12: el perfil de autor filtra los casos por autor sobre esta
          // misma lista. `populate` deja solo el id (siempre viaja) y el nombre,
          // asi que la lista no arrastra el perfil entero de cada autor.
          author: true,
        },
        populate: {
          authors: { name: true },
        },
      })
      return docs
    },
    ['case-studies-index', locale],
    {
      // `populate.authors` trae el nombre del autor de cada tarjeta.
      tags: [CACHE_TAGS.caseStudies(), CACHE_TAGS.authors()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

/**
 * Indice de autores (fase 55, plan 55-12). Todos los autores, con lo que pinta
 * la tarjeta: nombre, slug, cargo, bio, avatar y anos de experiencia.
 *
 * `overrideAccess: false` va DENTRO de la funcion cacheada (la coleccion tiene
 * `read` abierto, pero la regla del repo es la misma en toda lectura) y `select`
 * deja fuera credenciales, educacion, experiencia y enlaces: el indice no los
 * pinta y no deben viajar al cliente (T-55-44). `filename` va junto a `url` en
 * Media: el `url` lo genera el adaptador de Cloudinary desde el filename y sin
 * el llega null (55-01).
 *
 * Si la lectura falla, lanza: `unstable_cache` no guarda una excepcion, y la
 * ruta tampoco la captura: Next conserva el ultimo HTML bueno.
 */
export function getCachedAuthorsIndex(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'authors',
        locale,
        limit: 100,
        pagination: false,
        depth: 1,
        overrideAccess: false,
        select: {
          name: true,
          slug: true,
          jobTitle: true,
          bio: true,
          avatar: true,
          yearsExperience: true,
        },
        populate: {
          media: { url: true, filename: true, width: true, height: true, alt: true },
        },
      })
      return docs
    },
    ['authors-index', locale],
    { tags: [CACHE_TAGS.authors()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * Perfil de un autor por slug (fase 55, plan 55-12). `select` explicito con
 * solo los campos del perfil publico (T-55-44): nombre, cargo, bio, avatar,
 * credenciales, expertise, educacion (con logo), experiencia, anos, enlaces
 * sociales y `meta` (title, description e imagen Open Graph). Nada mas del
 * documento viaja a la cache.
 *
 * Devuelve null si el slug no existe (la ruta responde notFound). Si la lectura
 * falla, lanza: `unstable_cache` no guarda una excepcion.
 */
export function getCachedAuthorBySlug(slug: string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'authors',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        depth: 1,
        overrideAccess: false,
        select: {
          name: true,
          slug: true,
          jobTitle: true,
          bio: true,
          avatar: true,
          credentials: true,
          expertise: true,
          education: true,
          experience: true,
          yearsExperience: true,
          socialLinks: true,
          meta: true,
        },
        populate: {
          media: { url: true, filename: true, width: true, height: true, alt: true },
        },
      })
      return docs[0] ?? null
    },
    ['author', slug, locale],
    { tags: [CACHE_TAGS.authors()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * TODOS los posts publicados de un autor, mas recientes primero (fase 55, plan
 * 55-12). Sin limite: produccion enlazaba solo 50 de los 58 posts desde el
 * perfil (con un tope de 50) y los 8 restantes no tenian enlace desde ahi (SEO-03).
 * `limit: 0` con `pagination: false` trae todos.
 *
 * `overrideAccess: false` dentro de la cache: un borrador no se cachea (SEO-40).
 * `select` ligero (sin `content`) y `populate` igual al del indice del blog:
 * categoria reducida a slug y titulo, portada con `filename` (el `url` sale del
 * adaptador de Cloudinary).
 */
export function getCachedAuthorPosts(authorId: number | string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        where: { author: { equals: authorId } },
        locale,
        sort: '-publishedAt',
        limit: 0,
        pagination: false,
        depth: 1,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          categories: true,
          publishedAt: true,
          heroImage: true,
        },
        populate: {
          categories: { slug: true, title: true },
          media: { url: true, filename: true, width: true, height: true, alt: true },
        },
      })
      return docs
    },
    ['author-posts', String(authorId), locale],
    { tags: [CACHE_TAGS.posts()], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Archive listing (ArchiveBlock, used by Servicios/Blog listing routes
// in 43-02) -- not wired to any component in this plan yet. Branches by
// `relationTo` with 3 literal `payload.find` calls (one per collection)
// instead of a single call with a dynamic `collection: relationTo`, because
// Payload's generic `select` type doesn't correlate well against a union
// `collection` type. `websites` doesn't get a `select` this phase -- not a
// confirmed root cause per 43-CONTEXT.md. ---

export type ArchiveRelationTo = 'posts' | 'case-studies' | 'websites'

export function getCachedArchive({
  relationTo,
  limit,
  locale,
  categoryId,
}: {
  relationTo: ArchiveRelationTo
  limit: number
  locale: Locale
  // 43-02: Category.id is a numeric Payload id (see payload-types.ts), not a
  // string -- typed as `number` to match the real caller (ArchiveBlock's
  // `categoryFilter`) instead of silently mismatching the `where` equality
  // check against the DB's integer column.
  categoryId?: number
}) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })

      if (relationTo === 'posts') {
        return payload.find({
          collection: 'posts',
          where: categoryId ? { categories: { in: [categoryId] } } : undefined,
          sort: '-publishedAt',
          locale,
          limit,
          overrideAccess: false,
          // `categories` is selected (and shaped down by `populate`) because
          // every post card links to /blog/<category>/<slug> — without it the
          // card cannot build its own href. `populate` keeps the RSC payload
          // small: only the related category's id+slug+title ship, not its
          // whole document. `title` rides along for the card's metadata row,
          // which names the category instead of only linking to it.
          //
          // `publishedAt` is selected for that same row. `content` is NOT:
          // the reading-time estimate needs the whole Lexical tree, and
          // shipping 66 post bodies into a listing's RSC payload is exactly
          // what this select exists to prevent (see src/lib/reading-time.ts).
          select: {
            title: true,
            slug: true,
            excerpt: true,
            heroImage: true,
            categories: true,
            publishedAt: true,
          },
          populate: { categories: { slug: true, title: true } },
        })
      }

      if (relationTo === 'case-studies') {
        return payload.find({
          collection: 'case-studies',
          sort: '-publishedAt',
          locale,
          limit,
          overrideAccess: false,
          select: { title: true, slug: true, sector: true, heroMetric: true, client: true },
        })
      }

      return payload.find({
        collection: 'websites',
        sort: '-publishedAt',
        locale,
        limit,
        overrideAccess: false,
      })
    },
    [
      'archive',
      relationTo,
      locale,
      String(limit),
      String(categoryId ?? 'none'),
    ],
    {
      tags: [
        relationTo === 'posts'
          ? CACHE_TAGS.posts()
          : relationTo === 'case-studies'
            ? CACHE_TAGS.caseStudies()
            : CACHE_TAGS.websites(),
      ],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

// --- Affiliate Links (Phase 46) — única lectura pública de la colección.
// `overrideAccess: false` explícito (T-46-01): sin usuario, el `FieldAccess`
// de `cookieWindowDays`/`commissionNote` los redacta, pero el resto de los
// campos igual pasa por el `read: authenticatedOrActive` de la colección. ---

export function getCachedAffiliateLinks(locale: Locale): Promise<AffiliateLink[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'affiliate-links',
        locale,
        limit: 100,
        overrideAccess: false,
      })
      return docs
    },
    ['affiliate-links', locale],
    { tags: [CACHE_TAGS.affiliateLinks()], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Redirects lookup (transversal, runs on every request via middleware —
// used by src/app/api/redirects-lookup/route.ts) ---

const REDIRECT_COLLECTION_BASE_PATH: Record<string, string> = {
  pages: '',
  posts: 'blog',
  'case-studies': 'case-studies',
  authors: 'authors',
  categories: 'categories',
}

export function getCachedRedirectTarget(from: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'redirects',
        where: { from: { equals: from } },
        limit: 1,
        overrideAccess: false,
      })

      const redirectDoc = docs[0]
      let target: string | null = null

      if (redirectDoc) {
        // SECURITY (T-02-01, open-redirect mitigation): the redirect target is
        // resolved EXCLUSIVELY from the admin-authored `redirects` collection
        // doc (doc.to.url or a resolved refDoc.slug) — never from
        // request-controlled input. `from` above is only ever used as an
        // equality lookup key against admin-authored data, never echoed back
        // as (or used to build) the redirect target itself.
        if (redirectDoc.to?.type === 'custom') {
          target = redirectDoc.to.url ?? null
        } else if (redirectDoc.to?.type === 'reference' && redirectDoc.to.reference) {
          const { relationTo, value } = redirectDoc.to.reference
          const id = typeof value === 'object' && value !== null ? value.id : value
          const refDoc = await payload.findByID({
            collection: relationTo as 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories',
            id,
            // SECURITY (43-REVIEW WR-01): missing overrideAccess:false here
            // let a redirect pointing at a draft doc leak that doc's slug
            // through the resolved redirect target, same class of leak the
            // rest of this file's fetchers already guard against.
            overrideAccess: false,
          })
          const base = REDIRECT_COLLECTION_BASE_PATH[relationTo] ?? ''
          const refSlug = (refDoc as { slug?: string })?.slug

          if (refSlug) {
            target =
              base === '' && refSlug === 'home' ? '/' : `/${[base, refSlug].filter(Boolean).join('/')}`
          }
        }
      }

      return target
    },
    ['redirect', from],
    { tags: [CACHE_TAGS.redirects()], revalidate: CACHE_TTL_SECONDS },
  )()
}
