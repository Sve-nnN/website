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
