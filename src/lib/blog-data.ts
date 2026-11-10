// Funciones puras de las superficies del blog (fase 55, plan 55-10): indice y
// categorias. Sin acceso al CMS: las lecturas viven en `getCachedBlogPostList`
// y compania (src/lib/cache.ts) y este modulo solo convierte documentos en
// props serializables para las vistas.
//
// Las vistas cliente importan funciones de aqui (`filterPosts`,
// `normalizeQuery`), asi que este modulo no puede importar payload, cache.ts ni
// nada del servidor. Ningun import de designs/ ni de datos del sandbox (D-02).
import { blogCategoryPath, blogPostPath, FALLBACK_CATEGORY_SLUG, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'

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
