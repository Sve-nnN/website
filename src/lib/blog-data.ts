// Funciones puras de las superficies del blog (fase 55, plan 55-10): indice y
// categorias. Sin acceso al CMS: las lecturas viven en `getCachedBlogPostList`
// y compania (src/lib/cache.ts) y este modulo solo convierte documentos en
// props serializables para las vistas.
//
// Las vistas cliente importan funciones de aqui (`filterPosts`,
// `normalizeQuery`), asi que este modulo no puede importar payload, cache.ts ni
// nada del servidor. Ningun import de designs/ ni de datos del sandbox (D-02).
import { extractHeadings, type HeadingEntry, type LexicalRootLike } from '@/components/mui/rich-text/lexical-toc'
import { blogCategoryPath, blogPostPath, FALLBACK_CATEGORY_SLUG, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { estimateReadingTime } from '@/lib/reading-time'
import { isEnTranslationIncomplete } from '@/lib/translation-gaps'

/** Entradas por categoria en el indice (D-18). El valor del bloque del CMS (3) no manda. */
export const POSTS_PER_CATEGORY = 6

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// ---------------------------------------------------------------------------
// Formas de entrada (documentos de Payload y fixtures)
// ---------------------------------------------------------------------------

/** Categoria tal como llega de `getCachedCategories`. */
export type BlogCategoryLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  description?: string | null
}

type PostCategoryRef = number | { id?: number | string; slug?: string | null; title?: string | null } | null | undefined

type PostImageLike = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

/** Forma minima que el blog lee de un post de `getCachedBlogPostList`. */
export type BlogPostDocLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  categories?: ReadonlyArray<PostCategoryRef> | null
  heroImage?: number | PostImageLike | null
}

// ---------------------------------------------------------------------------
// Salidas
// ---------------------------------------------------------------------------

export type BlogPostImage = {
  url: string
  alt: string | null
  width: number | null
  height: number | null
}

export type BlogPostItem = {
  slug: string
  title: string
  /** Ruta del post sin prefijo de idioma (`blogPostPath` con la categoria primaria). */
  href: string
  excerpt: string | null
  categorySlug: string
  /** Nombre de la categoria primaria en el idioma de la pagina, o null. */
  categoryLabel: string | null
  dateISO: string | null
  image: BlogPostImage | null
}

export type BlogNavItem = {
  slug: string
  title: string
  /** Ruta sin prefijo de idioma. */
  href: string
}

/** Categoria con el nombre y la descripcion de Payload (D-22). */
export type BlogCategoryInfo = {
  slug: string
  title: string
  description: string | null
}

export type CategoryPageProps = {
  category: BlogCategoryInfo
  /** TODAS las entradas de la categoria, mas recientes primero. Sin recorte. */
  items: BlogPostItem[]
  nav: BlogNavItem[]
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

function primaryCategory(doc: BlogPostDocLike): { slug: string; title: string | null } {
  const first = doc.categories?.find(
    (c): c is Exclude<PostCategoryRef, number | null | undefined> => typeof c === 'object' && c !== null,
  )
  return {
    slug: resolvePrimaryCategorySlug(doc.categories ? [...doc.categories] : null),
    title: text(first?.title),
  }
}

function toImage(doc: BlogPostDocLike, slug: string): BlogPostImage {
  const hero = doc.heroImage && typeof doc.heroImage === 'object' ? doc.heroImage : null
  const url = text(hero?.url)
  if (hero && url) {
    return {
      url,
      alt: text(hero.alt),
      width: typeof hero.width === 'number' ? hero.width : null,
      height: typeof hero.height === 'number' ? hero.height : null,
    }
  }
  // Ningun post publicado tiene portada (heroImage.ts): el sitio calcula una
  // imagen estable por slug, igual que la tarjeta anterior.
  return { url: getFallbackHeroImage(slug), alt: null, width: null, height: null }
}

/** Documento de post a tarjeta. Sin slug o sin titulo no hay tarjeta (null). */
export function toPostItem(doc: BlogPostDocLike): BlogPostItem | null {
  const slug = text(doc.slug)
  const title = text(doc.title)
  if (!slug || !title) return null
  const category = primaryCategory(doc)
  return {
    slug,
    title,
    href: blogPostPath(category.slug, slug),
    excerpt: text(doc.excerpt),
    categorySlug: category.slug,
    categoryLabel: category.title,
    dateISO: text(doc.publishedAt),
    image: toImage(doc, slug),
  }
}

/** Todos los posts validos, en el orden recibido. */
export function toPostItems(docs: ReadonlyArray<BlogPostDocLike>): BlogPostItem[] {
  const items: BlogPostItem[] = []
  for (const doc of docs) {
    const item = toPostItem(doc)
    if (item) items.push(item)
  }
  return items
}

/** True si el post pertenece a la categoria `slug` (cualquiera de sus categorias). */
function belongsTo(doc: BlogPostDocLike, slug: string): boolean {
  return (
    doc.categories?.some((c) => typeof c === 'object' && c !== null && c.slug === slug) ?? false
  )
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

/**
 * Categorias que se ofrecen en pestañas y listados: sin la de reserva `general`
 * (FALLBACK_CATEGORY_SLUG), que existe para posts sin categoria y no es un tema.
 * Una categoria sin slug ni titulo tampoco se ofrece.
 */
export function listableCategories<T extends BlogCategoryLike>(categories: ReadonlyArray<T>): T[] {
  return categories.filter((c) => text(c.slug) && text(c.title) && c.slug !== FALLBACK_CATEGORY_SLUG)
}

/** Navegacion de categorias: nombres y rutas de Payload, sin `general`. */
export function toNavItems(categories: ReadonlyArray<BlogCategoryLike>): BlogNavItem[] {
  return listableCategories(categories).map((c) => ({
    slug: c.slug as string,
    title: c.title as string,
    href: blogCategoryPath(c.slug as string),
  }))
}

/**
 * Props de la pagina de categoria. Lista TODAS las entradas de la categoria
 * (Pitfall 5: ninguna se recorta ni se revela en el cliente) con el orden que
 * trae la lectura. `general` devuelve una lista vacia cuando no tiene posts, y
 * la ruta responde 200 con el estado vacio.
 */
export function toCategoryProps(
  categoryDoc: BlogCategoryLike,
  posts: ReadonlyArray<BlogPostDocLike>,
  categories: ReadonlyArray<BlogCategoryLike>,
  _locale: 'es' | 'en',
): CategoryPageProps {
  const slug = text(categoryDoc.slug) ?? String(categoryDoc.id ?? '')
  const own = posts.filter((p) => belongsTo(p, slug))
  return {
    category: {
      slug,
      title: text(categoryDoc.title) ?? slug,
      description: text(categoryDoc.description),
    },
    items: toPostItems(own),
    nav: toNavItems(categories),
  }
}

// ---------------------------------------------------------------------------
// Cierre del blog (promo global)
// ---------------------------------------------------------------------------

type ClosingLike = {
  heading?: string | null
  body?: string | null
  points?: ReadonlyArray<{ item?: string | null } | null> | null
  primaryLabel?: string | null
  primaryUrl?: string | null
  secondaryLabel?: string | null
  secondaryUrl?: string | null
}

export type BlogClosingData = {
  heading: string
  body: string | null
  points: string[]
  primary: { label: string; url: string } | null
  secondary: { label: string; url: string } | null
}

function cta(label: unknown, url: unknown): { label: string; url: string } | null {
  const l = text(label)
  const u = text(url)
  return l && u ? { label: l, url: u } : null
}

/**
 * Cierre resuelto (`resolveBlogPromo`) a datos serializables. Sin titulo no hay
 * cierre (null), igual que la banda anterior.
 */
export function toClosingProps(closing: ClosingLike | null | undefined): BlogClosingData | null {
  const heading = text(closing?.heading)
  if (!closing || !heading) return null
  const points: string[] = []
  for (const row of closing.points ?? []) {
    const item = text(row?.item)
    if (item) points.push(item)
  }
  return {
    heading,
    body: text(closing.body),
    points,
    primary: cta(closing.primaryLabel, closing.primaryUrl),
    secondary: cta(closing.secondaryLabel, closing.secondaryUrl),
  }
}

// ---------------------------------------------------------------------------
// Indice del blog (tarea 2)
// ---------------------------------------------------------------------------

/** Documento Pages `blog`: solo lo que el indice lee (h1, subtitulo, filas y newsletter). */
export type BlogPageDocLike = {
  title?: string | null
  content?: { layout?: ReadonlyArray<{ blockType: string }> | null } | null
}

type HeroBlockLike = { title?: string | null; subtitle?: string | null }
type CategoryRowsBlockLike = {
  categoryOrder?: ReadonlyArray<{ category?: number | { id?: number | string } | null } | null> | null
  viewAllLabel?: string | null
}
type NewsletterBlockLike = {
  title?: string | null
  description?: string | null
  emailLabel?: string | null
  submitLabel?: string | null
  consentText?: string | null
}

export type BlogSectionProps = {
  slug: string
  title: string
  description: string | null
  /** Ruta de la categoria sin prefijo de idioma: destino real de "Ver mas" (D-18). */
  href: string
  /** Cuantas entradas tiene la categoria en total. */
  total: number
  /** Las primeras POSTS_PER_CATEGORY, sin la entrada destacada. */
  items: BlogPostItem[]
  /** Hay entradas fuera de las mostradas (sin contar la destacada): se ofrece "Ver mas". */
  hasMore: boolean
}

/** Elemento ligero de la busqueda: sin imagen, para no cargar el cliente con 58 portadas. */
export type BlogSearchItem = Omit<BlogPostItem, 'image'>

export type BlogNewsletterData = {
  title: string
  description: string | null
  emailLabel: string | null
  submitLabel: string | null
  consentText: string | null
}

export type BlogIndexProps = {
  /** h1 del documento Pages blog, no el del sandbox (pregunta abierta 6). */
  title: string
  lead: string | null
  /** La entrada mas reciente, destacada arriba. */
  latest: BlogPostItem | null
  sections: BlogSectionProps[]
  nav: BlogNavItem[]
  searchList: BlogSearchItem[]
  /** Texto del enlace "Ver mas" del bloque del CMS, o null para usar el de messages. */
  viewAllLabel: string | null
  newsletter: BlogNewsletterData | null
}

function findBlock<T>(page: BlogPageDocLike | null | undefined, blockType: string): T | undefined {
  return page?.content?.layout?.find((b) => b.blockType === blockType) as T | undefined
}

function refId(ref: number | { id?: number | string } | null | undefined): number | string | null {
  if (typeof ref === 'number') return ref
  if (ref && typeof ref === 'object' && ref.id !== undefined) return ref.id
  return null
}

/**
 * Props del indice. El h1 y el subtitulo salen del bloque `hero` del documento
 * Pages `blog`. Las filas siguen el orden `categoryOrder` del bloque
 * `blogCategoryRows` (sin orden: alfabetico, como llega `getCachedCategories`),
 * sin `general`, con las primeras 6 entradas y el enlace real a /blog/<slug>. El
 * bloque `newsletterBlock` aporta los textos del alta.
 *
 * La entrada destacada no se repite dentro de la fila de su categoria: ya ocupa
 * su propia pantalla arriba. Una categoria sin entradas no tiene fila.
 */
export function toBlogIndexProps(
  pageDoc: BlogPageDocLike | null | undefined,
  categories: ReadonlyArray<BlogCategoryLike>,
  posts: ReadonlyArray<BlogPostDocLike>,
  _locale: 'es' | 'en',
): BlogIndexProps {
  const hero = findBlock<HeroBlockLike>(pageDoc, 'hero')
  const rows = findBlock<CategoryRowsBlockLike>(pageDoc, 'blogCategoryRows')
  const newsletterBlock = findBlock<NewsletterBlockLike>(pageDoc, 'newsletterBlock')

  const pairs = posts.flatMap((doc) => {
    const item = toPostItem(doc)
    return item ? [{ doc, item }] : []
  })
  const items = pairs.map((p) => p.item)
  const latest = items[0] ?? null

  const listable = listableCategories(categories)
  const ordered = rows?.categoryOrder?.length
    ? rows.categoryOrder
        .map((row) => {
          const id = refId(row?.category)
          return id === null ? undefined : listable.find((c) => c.id === id)
        })
        .filter((c): c is (typeof listable)[number] => Boolean(c))
    : listable

  const sections: BlogSectionProps[] = []
  for (const category of ordered) {
    const slug = category.slug as string
    const own = pairs.filter((p) => belongsTo(p.doc, slug)).map((p) => p.item)
    if (own.length === 0) continue
    const rest = own.filter((p) => p.slug !== latest?.slug)
    const shown = rest.slice(0, POSTS_PER_CATEGORY)
    sections.push({
      slug,
      title: category.title as string,
      description: text(category.description),
      href: blogCategoryPath(slug),
      total: own.length,
      items: shown,
      hasMore: rest.length > shown.length,
    })
  }

  const newsletterTitle = text(newsletterBlock?.title)

  return {
    title: text(hero?.title) ?? text(pageDoc?.title) ?? 'Blog',
    lead: text(hero?.subtitle),
    latest,
    sections,
    nav: toNavItems(categories),
    searchList: items.map(({ image: _image, ...rest }) => rest),
    viewAllLabel: text(rows?.viewAllLabel),
    newsletter: newsletterBlock && newsletterTitle
      ? {
          title: newsletterTitle,
          description: text(newsletterBlock.description),
          emailLabel: text(newsletterBlock.emailLabel),
          submitLabel: text(newsletterBlock.submitLabel),
          consentText: text(newsletterBlock.consentText),
        }
      : null,
  }
}

/** Estados de `?newsletter=` a los que vuelven los enlaces del correo de doble opt-in. */
export type NewsletterNotice = 'confirmed' | 'unsubscribed' | 'invalid'

/**
 * `?newsletter=` a un estado conocido. Cualquier otro valor (incluidos arreglos
 * de una query repetida) se descarta: el valor nunca se interpola en el HTML.
 */
export function parseNewsletterNotice(value: string | string[] | undefined): NewsletterNotice | null {
  return value === 'confirmed' || value === 'unsubscribed' || value === 'invalid' ? value : null
}

// ---------------------------------------------------------------------------
// Busqueda del indice (tarea 3)
// ---------------------------------------------------------------------------

/**
 * Texto de busqueda normalizado: minusculas, sin diacriticos (NFD) y sin espacios
 * sobrantes. "Optimización" y "optimizacion" quedan iguales. Nunca produce HTML:
 * es solo una cadena para comparar.
 */
export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Filtra la lista ligera por `title` y `excerpt`. Cada palabra de la consulta debe
 * aparecer en alguno de los dos (el orden no importa). Una consulta vacia no
 * filtra: devuelve una lista vacia, porque sin consulta el indice muestra sus
 * secciones y no una lista de resultados.
 */
export function filterPosts<T extends { title: string; excerpt: string | null }>(
  list: ReadonlyArray<T>,
  query: string,
): T[] {
  const terms = normalizeQuery(query).split(' ').filter(Boolean)
  if (terms.length === 0) return []
  return list.filter((post) => {
    const haystack = normalizeQuery(`${post.title} ${post.excerpt ?? ''}`)
    return terms.every((term) => haystack.includes(term))
  })
}

// ---------------------------------------------------------------------------
// Post (fase 55, plan 55-11)
// ---------------------------------------------------------------------------
//
// Todo lo de abajo es puro: sin acceso al CMS, sin `payload` ni `sitemap-data`
// (este modulo lo importan vistas cliente). Lo que necesita del servidor (la URL
// del sitio, el nodo Person y el nodo WebSite) llega por argumento.

/** Autor del post tal como llega de `getCachedPost` (depth 2: el avatar viene poblado). */
type AuthorDocLike = {
  name?: string | null
  slug?: string | null
  jobTitle?: string | null
  bio?: string | null
  yearsExperience?: number | null
  avatar?: number | PostImageLike | null
  credentials?: ReadonlyArray<{ label?: string | null } | null> | null
}

/** Forma minima que la pagina del post lee de un documento de `getCachedPost`. */
export type PostPageDocLike = BlogPostDocLike & {
  content?: { root?: unknown } | null
  updatedAt?: string | null
  author?: number | AuthorDocLike | null
}

export type PostAuthorProps = {
  name: string
  jobTitle: string | null
  bio: string | null
  /** Ruta del perfil sin prefijo de idioma. */
  href: string
  avatar: { url: string; alt: string | null } | null
  credentials: string[]
  yearsExperience: number | null
}

export type PostCategoryChip = { slug: string; title: string; href: string }

export type PostViewProps = {
  title: string
  slug: string
  dateISO: string | null
  readingMinutes: number
  image: BlogPostImage
  categorySlug: string
  /** Categorias del post como enlaces (la primaria primero). */
  categories: PostCategoryChip[]
  author: PostAuthorProps | null
  /** h1 (como nivel 2), h2 y h3 del cuerpo COMPLETO, con los mismos ids que renderiza el cuerpo. */
  headings: HeadingEntry[]
  /** Solo en EN y solo para los posts de EN_TRANSLATION_INCOMPLETE: ruta ES canonica sin prefijo. */
  translationNotice: { esHref: string } | null
}

function authorOf(value: PostPageDocLike['author']): PostAuthorProps | null {
  if (!value || typeof value !== 'object') return null
  const name = text(value.name)
  if (!name) return null
  const slug = text(value.slug)
  const avatarDoc = value.avatar && typeof value.avatar === 'object' ? value.avatar : null
  const avatarUrl = text(avatarDoc?.url)
  const credentials: string[] = []
  for (const row of value.credentials ?? []) {
    const label = text(row?.label)
    if (label) credentials.push(label)
  }
  return {
    name,
    jobTitle: text(value.jobTitle),
    bio: text(value.bio),
    href: slug ? `/authors/${slug}` : '/authors',
    avatar: avatarUrl ? { url: avatarUrl, alt: text(avatarDoc?.alt) } : null,
    credentials,
    yearsExperience: typeof value.yearsExperience === 'number' ? value.yearsExperience : null,
  }
}

/**
 * Props de la cabecera y los datos del post. `headings` sale de la MISMA funcion
 * que el mapa de ids del cuerpo (`buildHeadingIdMap` en la ruta), sobre el
 * contenido completo: cada href del indice resuelve a un id del cuerpo (D-19,
 * Pitfall 2). El tiempo de lectura cuenta el cuerpo completo, no las mitades.
 */
export function toPostViewProps(
  doc: PostPageDocLike,
  ctx: { locale: 'es' | 'en'; routeSlug: string },
): PostViewProps {
  const slug = text(doc.slug) ?? ctx.routeSlug
  const primary = primaryCategory(doc)
  const chips: PostCategoryChip[] = []
  for (const c of doc.categories ?? []) {
    if (!c || typeof c !== 'object') continue
    const cSlug = text(c.slug)
    if (!cSlug) continue
    chips.push({ slug: cSlug, title: text(c.title) ?? cSlug, href: blogCategoryPath(cSlug) })
  }
  return {
    title: text(doc.title) ?? slug,
    slug,
    dateISO: text(doc.publishedAt),
    readingMinutes: estimateReadingTime(doc.content),
    image: toImage(doc, slug),
    categorySlug: primary.slug,
    categories: chips,
    author: authorOf(doc.author),
    headings: extractHeadings(doc.content?.root as LexicalRootLike | undefined),
    translationNotice: isEnTranslationIncomplete(ctx.locale, slug)
      ? { esHref: blogPostPath(primary.slug, slug) }
      : null,
  }
}

/**
 * Entrada anterior y siguiente dentro de una lista ordenada del mas reciente al
 * mas antiguo (la de la categoria). `previous` es la publicada antes (la
 * siguiente de la lista) y `next` la publicada despues. Un slug que no esta en
 * la lista, o un extremo, devuelve null en ese lado.
 */
export function pickPrevNext<T extends { slug: string }>(
  list: ReadonlyArray<T>,
  currentSlug: string,
): { previous: T | null; next: T | null } {
  const index = list.findIndex((item) => item.slug === currentSlug)
  if (index === -1) return { previous: null, next: null }
  return { previous: list[index + 1] ?? null, next: index > 0 ? (list[index - 1] ?? null) : null }
}

/**
 * Posts relacionados: de las mismas categorias que el actual, sin el actual y
 * hasta `limit`, en el orden de la lista. Sale de la lista ligera cacheada
 * (`getCachedBlogPostList`, leida con `overrideAccess: false`), asi que un
 * borrador nunca entra (T-55-42).
 */
export function pickRelated(
  posts: ReadonlyArray<BlogPostDocLike>,
  current: { slug: string; categorySlugs: ReadonlyArray<string> },
  limit = 3,
): BlogPostItem[] {
  if (current.categorySlugs.length === 0) return []
  const related: BlogPostItem[] = []
  for (const doc of posts) {
    if (related.length >= limit) break
    if (text(doc.slug) === current.slug) continue
    if (!current.categorySlugs.some((slug) => belongsTo(doc, slug))) continue
    const item = toPostItem(doc)
    if (item) related.push(item)
  }
  return related
}

/** Entradas de una categoria (cualquiera de las del post) para anterior y siguiente. */
export function categoryItems(posts: ReadonlyArray<BlogPostDocLike>, categorySlug: string): BlogPostItem[] {
  return toPostItems(posts.filter((doc) => belongsTo(doc, categorySlug)))
}

// ---------------------------------------------------------------------------
// Ofertas del post (global blog-promo)
// ---------------------------------------------------------------------------

type InlineLike = { title?: string | null; text?: string | null; linkLabel?: string | null; linkUrl?: string | null }
type RailLike = { title?: string | null; body?: string | null; linkLabel?: string | null; linkUrl?: string | null }

export type PostInlineOffer = { title: string | null; text: string; link: { label: string; url: string } | null }
export type PostRailOffer = { title: string; body: string | null; link: { label: string; url: string } | null }

/** Oferta inline resuelta (`resolveBlogPromo`). Sin texto no hay oferta (null), igual que la anterior. */
export function toInlineOffer(inline: InlineLike | null | undefined): PostInlineOffer | null {
  const body = text(inline?.text)
  if (!body) return null
  return { title: text(inline?.title), text: body, link: cta(inline?.linkLabel, inline?.linkUrl) }
}

/** Tarjeta de riel resuelta. Sin titulo no hay tarjeta (null), igual que la anterior. */
export function toRailOffer(rail: RailLike | null | undefined): PostRailOffer | null {
  const title = text(rail?.title)
  if (!title) return null
  return { title, body: text(rail?.body), link: cta(rail?.linkLabel, rail?.linkUrl) }
}

/** Datos que la ruta aporta del servidor y que este modulo puro no puede importar. */
export type PostJsonLdRefs = {
  /** SITE_URL de sitemap-data. */
  siteUrl: string
  /** SITE_PERSON_SLUG de person.ts. */
  sitePersonSlug: string
  /** personRef de person.ts: el nodo `@id` canonico de Juan. */
  personRef: Record<string, unknown>
  /** websiteRef de site-schema.ts. */
  websiteRef: Record<string, unknown>
}

type ArticleDoc = {
  id?: number | string
  title: string
  slug?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  heroImage?: number | PostImageLike | null
  author?: number | AuthorDocLike | null
}

/**
 * JSON-LD `Article` del post. Es el mismo objeto que la ruta construia en linea
 * antes de la fase 55 (D-04, T-55-39): ningun campo cambia, ningun valor se
 * inventa (SEO-09) y lo que no tiene fuente en Payload se omite.
 *
 * `localizedPostPath` es la ruta del post con prefijo de idioma
 * (`localizeBlogPath`), de donde salen `mainEntityOfPage` y la URL absoluta.
 */
export function buildArticleJsonLd(
  doc: ArticleDoc,
  args: {
    locale: 'es' | 'en'
    routeSlug: string
    localizedPostPath: string
    categoryTitle: string
    refs: PostJsonLdRefs
  },
): Record<string, unknown> {
  const { refs } = args
  const author = doc.author && typeof doc.author === 'object' ? doc.author : undefined
  const hero = doc.heroImage && typeof doc.heroImage === 'object' ? doc.heroImage : null
  const heroImageUrl = hero?.url ?? getFallbackHeroImage(doc.slug ?? String(doc.id))
  const articleUrl = `${refs.siteUrl}${args.localizedPostPath}`
  const articleImage = heroImageUrl.startsWith('http') ? heroImageUrl : `${refs.siteUrl}${heroImageUrl}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    // Antes emitia "" en ES y null en EN. Se omite.
    ...(doc.excerpt ? { description: doc.excerpt } : {}),
    datePublished: doc.publishedAt,
    // Marca de tiempo real de Payload: no se copia datePublished.
    ...(doc.updatedAt ? { dateModified: doc.updatedAt } : {}),
    // SEO-03.3: cuando el autor es el dueno del sitio, el Article referencia el
    // `@id` canonico en vez de repetir un Person suelto.
    ...(author?.name
      ? {
          author: {
            '@type': 'Person',
            name: author.name,
            ...(author.slug === refs.sitePersonSlug ? refs.personRef : {}),
          },
        }
      : {}),
    // Portfolio personal: el publisher ES la persona.
    publisher: { '@type': 'Person', name: 'Juan Carlos Angulo', url: refs.siteUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    image: articleImage,
    articleSection: args.categoryTitle,
    // SEO-48: idioma del articulo.
    inLanguage: args.locale === 'en' ? 'en' : 'es',
    isPartOf: refs.websiteRef,
  }
}
