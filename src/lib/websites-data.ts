// Funciones puras de la superficie Websites (fase 55, plan 55-01). Sin acceso
// al CMS: la lectura vive en `getCachedWebsitesIndex` (src/lib/cache.ts) y este
// modulo solo convierte los documentos en props serializables para la vista.
//
// Todo enlace externo se arma desde un hostname validado (`hostnameOf` solo
// acepta http y https), nunca desde texto crudo del admin (T-55-03).
import { hostnameOf, type SiteImage, type SiteScores } from '@/lib/home-data-b'

export type WebsiteKind = 'nextjs' | 'wordpress' | 'other'

export type WebsiteIndexItem = {
  slug: string
  title: string
  /** `role` del documento: lo que Juan hizo en el sitio. */
  tagline: string | null
  industry: string | null
  year: number | null
  kind: WebsiteKind
  /** Hostname validado, sin `www.`. null si no hay uno seguro. */
  domain: string | null
  image: SiteImage | null
  scores: SiteScores
  /** Fecha ISO de `lighthouseCapturedAt`, o null. */
  scoresDate: string | null
  stack: string[]
}

/** Forma minima que la funcion lee del documento (sirve para docs de Payload y fixtures). */
export type WebsiteDocLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  role?: string | null
  industry?: string | null
  year?: number | null
  stack?: ReadonlyArray<{ tag?: string | null } | null> | null
  screenshots?: ReadonlyArray<{ image?: unknown } | null> | null
  lighthouse?: Partial<Record<keyof SiteScores, unknown>> | null
  lighthouseCapturedAt?: string | null
  client?: unknown
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function score(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isoDate(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null
  return Number.isNaN(new Date(raw).getTime()) ? null : raw
}

// Un slug de sitio propio tiene la forma `<nombre>-com`: letras, digitos y
// guiones, terminado en `-com`. Cualquier otra forma no se interpreta.
const COM_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-com$/

/**
 * Dominio de un sitio. Sale del `websiteUrl` del cliente. Si el sitio no tiene
 * cliente (el propio sitio de Juan, `juan-tech-com`) y el slug termina en
 * `-com`, se deriva del slug (A6 de 55-RESEARCH). Devuelve null si no hay un
 * hostname seguro: sin dominio no hay enlace externo.
 */
export function domainFor(slug: string | null | undefined, client: unknown): string | null {
  if (client && typeof client === 'object') {
    return hostnameOf((client as { websiteUrl?: string | null }).websiteUrl)
  }
  const value = text(slug)
  if (!value || !COM_SLUG.test(value)) return null
  return hostnameOf(`https://${value.slice(0, -'-com'.length)}.com`)
}

/** Tipo de sitio derivado de las etiquetas del stack (D-14), sin campo nuevo. */
export function siteKind(stack: ReadonlyArray<{ tag?: string | null } | null> | null | undefined): WebsiteKind {
  const tags = (stack ?? []).map((s) => text(s?.tag)?.toLowerCase() ?? '')
  if (tags.some((t) => /^next(\.?js)?$/.test(t))) return 'nextjs'
  if (tags.some((t) => t === 'wordpress')) return 'wordpress'
  return 'other'
}

function imageOf(doc: WebsiteDocLike): SiteImage | null {
  const media = doc.screenshots?.[0]?.image
  if (!media || typeof media !== 'object') return null
  const m = media as { url?: unknown; width?: unknown; height?: unknown; alt?: unknown }
  const url = text(m.url)
  if (!url) return null
  return {
    url,
    width: typeof m.width === 'number' && m.width > 0 ? m.width : null,
    height: typeof m.height === 'number' && m.height > 0 ? m.height : null,
    alt: text(m.alt),
  }
}

/**
 * Documentos de `websites` a props por tarjeta, en el orden recibido. Sin slug o
 * sin titulo no hay tarjeta. `_locale` queda en la firma para que la ruta y el
 * detalle (55-08) llamen igual; el formato de fecha lo resuelve la vista con el
 * idioma de la pagina.
 */
export function toWebsiteIndexProps(
  docs: ReadonlyArray<WebsiteDocLike>,
  _locale: 'es' | 'en',
): WebsiteIndexItem[] {
  const items: WebsiteIndexItem[] = []
  for (const doc of docs) {
    const slug = text(doc.slug)
    const title = text(doc.title)
    if (!slug || !title) continue
    items.push({
      slug,
      title,
      tagline: text(doc.role),
      industry: text(doc.industry),
      year: typeof doc.year === 'number' && Number.isFinite(doc.year) ? doc.year : null,
      kind: siteKind(doc.stack),
      domain: domainFor(slug, doc.client),
      image: imageOf(doc),
      scores: {
        performance: score(doc.lighthouse?.performance),
        accessibility: score(doc.lighthouse?.accessibility),
        bestPractices: score(doc.lighthouse?.bestPractices),
        seo: score(doc.lighthouse?.seo),
      },
      scoresDate: isoDate(doc.lighthouseCapturedAt),
      stack: (doc.stack ?? []).map((s) => text(s?.tag)).filter((t): t is string => t !== null),
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Detalle (plan 55-08)
// ---------------------------------------------------------------------------

/** Forma minima que el detalle lee del documento (docs de Payload y fixtures). */
export type WebsiteDetailDocLike = WebsiteDocLike & {
  highlights?: ReadonlyArray<{ text?: string | null } | null> | null
  challenges?: ReadonlyArray<{ text?: string | null } | null> | null
  relatedCaseStudy?: unknown
}

export type WebsiteDetailProps = {
  slug: string
  title: string
  tagline: string | null
  industry: string | null
  year: number | null
  kind: WebsiteKind
  /** Hostname validado, sin `www.`. null si no hay uno seguro: sin dominio no hay enlace. */
  domain: string | null
  /** Nombre del cliente cuando el documento lo trae poblado. */
  clientName: string | null
  /** Una sola captura de escritorio (D-14). */
  image: SiteImage | null
  highlights: string[]
  challenges: string[]
  stack: string[]
  scores: SiteScores
  /** Fecha ISO de `lighthouseCapturedAt`, o null. */
  scoresDate: string | null
  /** Caso relacionado con la ruta sin prefijo de idioma, o null. */
  relatedCase: { title: string; href: string } | null
}

function listOf(items: ReadonlyArray<{ text?: string | null } | null> | null | undefined): string[] {
  return (items ?? []).map((i) => text(i?.text)).filter((t): t is string => t !== null)
}

/**
 * Caso relacionado a `{ title, href }`. Solo cuando llega poblado (objeto) con
 * slug y titulo: un id suelto no produce enlace.
 */
function relatedCaseOf(value: unknown): { title: string; href: string } | null {
  if (!value || typeof value !== 'object') return null
  const rel = value as { slug?: unknown; title?: unknown }
  const slug = text(rel.slug)
  const title = text(rel.title)
  if (!slug || !title) return null
  return { title, href: `/case-studies/${slug}` }
}

/**
 * Documento de `websites` a props serializables del detalle. Sin slug o sin
 * titulo devuelve null (la ruta responde notFound). El dominio sale solo de
 * `domainFor`, que valida el hostname.
 */
export function toWebsiteDetailProps(
  doc: WebsiteDetailDocLike,
  _locale: 'es' | 'en',
): WebsiteDetailProps | null {
  const [base] = toWebsiteIndexProps([doc], _locale)
  if (!base) return null
  const client = doc.client && typeof doc.client === 'object' ? (doc.client as { name?: unknown }) : null
  return {
    slug: base.slug,
    title: base.title,
    tagline: base.tagline,
    industry: base.industry,
    year: base.year,
    kind: base.kind,
    domain: base.domain,
    clientName: text(client?.name),
    image: base.image,
    highlights: listOf(doc.highlights),
    challenges: listOf(doc.challenges),
    stack: base.stack,
    scores: base.scores,
    scoresDate: base.scoresDate,
    relatedCase: relatedCaseOf(doc.relatedCaseStudy),
  }
}

/**
 * JSON-LD `CreativeWork` del detalle. Es el mismo objeto que la ruta construia
 * en linea antes de la fase 55 (D-04): no cambia ningun campo.
 */
export function buildWebsiteJsonLd(doc: {
  title?: string | null
  role?: string | null
  industry?: string | null
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: doc.title,
    about: doc.role ?? doc.industry,
  }
}
