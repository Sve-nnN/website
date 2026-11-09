// Datos de vista del índice de servicios (servidor). Las tarjetas y las filas de
// la tabla comparativa salen de los docs reales de `pages`: nada se escribe a
// mano en la vista.
//
// `buildIndexCards` y `buildCompareRows` son mapeadores PUROS. La descripción de
// cada tarjeta se toma por POSICIÓN de columna del primer `content` del índice
// (cuatro columnas, cada una con un encabezado y un párrafo, en el orden de
// SERVICE_SLUGS) y, si esa forma no coincide, cae al subtítulo del hero del
// servicio. Nunca se busca por texto: el texto es contenido del editor.
//
// `getServicesIndexData` protege cada lectura: un fallo de Payload omite el
// servicio y se registra, nunca convierte la página en un 500 (T-54-65).
import { headingText, type LexicalNodeLike } from '@/components/mui/rich-text/lexical-toc'
import { SERVICE_SLUGS, buildServiceHref, type ServiceSlug } from '@/lib/service-slugs'
import { SERVICE_ICON_BY_SLUG } from '@/lib/service-view-data'
import { getServicePage, getServicesIndexPage } from '@/lib/services-data'
import type { ServiceIconName } from '@/lib/shadow-icons'
import type { Page } from '@/payload-types'

type Locale = 'es' | 'en'
type LayoutBlock = Page['content']['layout'][number]

export type IndexCard = {
  slug: ServiceSlug
  title: string
  description: string | null
  timeline: string | null
  icon: ServiceIconName
  href: string
}

export type CompareRow = {
  slug: ServiceSlug
  title: string
  href: string
  fitsIf: string | null
  achieves: string | null
  time: string | null
}

/** Forma mínima de un doc de servicio: la usan las funciones puras y el script de verificación. */
export type ServiceDocLike = {
  title: string
  slug?: string | null
  content?: { layout?: LayoutBlock[] | null } | null
}

/** Forma mínima del doc del índice. */
export type IndexDocLike = {
  title?: string | null
  content?: { layout?: LayoutBlock[] | null } | null
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function nodesOf(richText: unknown): LexicalNodeLike[] {
  return (richText as { root?: { children?: LexicalNodeLike[] } } | null | undefined)?.root?.children ?? []
}

function layoutOf(doc: { content?: { layout?: LayoutBlock[] | null } | null } | null | undefined): LayoutBlock[] {
  return doc?.content?.layout ?? []
}

/**
 * Descripciones por posición. Solo vale si el primer `content` del índice trae
 * exactamente cuatro columnas y cada una tiene un encabezado y un párrafo con
 * texto. Con cualquier otra forma devuelve null y las tarjetas caen al hero.
 */
function descriptionsByColumn(indexDoc: IndexDocLike | null | undefined): Array<string | null> | null {
  const content = layoutOf(indexDoc).find((b) => b.blockType === 'content')
  if (!content || content.blockType !== 'content') return null
  const columns = content.columns ?? []
  if (columns.length !== SERVICE_SLUGS.length) return null

  const out: Array<string | null> = []
  for (const col of columns) {
    const nodes = nodesOf(col.richText)
    const hasHeading = nodes.some((n) => n.type === 'heading' && headingText(n).trim() !== '')
    const paragraph = nodes.find((n) => n.type === 'paragraph' && headingText(n).trim() !== '')
    if (!hasHeading || !paragraph) return null
    out.push(headingText(paragraph).trim())
  }
  return out
}

function scopeOf(doc: ServiceDocLike): { outcome: string | null; timeline: string | null } {
  const scope = layoutOf(doc).find((b) => b.blockType === 'serviceScopeCard')
  if (!scope || scope.blockType !== 'serviceScopeCard') return { outcome: null, timeline: null }
  return { outcome: str(scope.outcome), timeline: str(scope.timeline) }
}

function heroSubtitle(doc: ServiceDocLike): string | null {
  const hero = layoutOf(doc).find((b) => b.blockType === 'hero')
  return hero && hero.blockType === 'hero' ? str(hero.subtitle) : null
}

/**
 * Cuatro tarjetas (una por servicio que resuelve). `servicePages` va en el orden
 * de SERVICE_SLUGS y puede traer null/undefined; ese servicio se omite.
 */
export function buildIndexCards(
  indexDoc: IndexDocLike | null | undefined,
  servicePages: Array<ServiceDocLike | null | undefined>,
  locale: Locale,
): IndexCard[] {
  const byColumn = descriptionsByColumn(indexDoc)
  const cards: IndexCard[] = []
  servicePages.forEach((doc, i) => {
    const slug = SERVICE_SLUGS[i]
    if (!doc || !slug) return
    cards.push({
      slug,
      title: doc.title,
      description: byColumn?.[i] ?? heroSubtitle(doc),
      timeline: scopeOf(doc).timeline,
      icon: SERVICE_ICON_BY_SLUG[slug],
      href: buildServiceHref(locale, slug),
    })
  })
  return cards
}

/** Filas de la tabla comparativa: primer encabezado del primer `content`, outcome y timeline del scope. */
export function buildCompareRows(
  servicePages: Array<ServiceDocLike | null | undefined>,
  locale: Locale,
): CompareRow[] {
  const rows: CompareRow[] = []
  servicePages.forEach((doc, i) => {
    const slug = SERVICE_SLUGS[i]
    if (!doc || !slug) return
    const content = layoutOf(doc).find((b) => b.blockType === 'content')
    let fitsIf: string | null = null
    if (content && content.blockType === 'content') {
      const first = nodesOf(content.columns?.[0]?.richText).find((n) => n.type === 'heading')
      fitsIf = first ? str(headingText(first)) : null
    }
    const { outcome, timeline } = scopeOf(doc)
    rows.push({
      slug,
      title: doc.title,
      href: buildServiceHref(locale, slug),
      fitsIf,
      achieves: outcome,
      time: timeline,
    })
  })
  return rows
}

export type ServicesIndexData = {
  doc: NonNullable<Awaited<ReturnType<typeof getServicesIndexPage>>>
  heroTitle: string
  heroLead: string | null
  cards: IndexCard[]
  rows: CompareRow[]
  /** Pares slug y título de los servicios que resuelven, para el JSON-LD ItemList. */
  services: Array<{ slug: string; title: string }>
}

/** Lector del índice. Devuelve null si falta el doc del índice. */
export async function getServicesIndexData(locale: Locale): Promise<ServicesIndexData | null> {
  const doc = await getServicesIndexPage(locale)
  if (!doc) return null

  const servicePages = await Promise.all(
    SERVICE_SLUGS.map(async (slug) => {
      try {
        return (await getServicePage(locale, slug)) ?? null
      } catch (err) {
        console.error('[services]', err)
        return null
      }
    }),
  )

  const hero = layoutOf(doc).find((b) => b.blockType === 'hero')
  const heroTitle = (hero && hero.blockType === 'hero' ? str(hero.title) : null) ?? doc.title
  const heroLead = hero && hero.blockType === 'hero' ? str(hero.subtitle) : null

  return {
    doc,
    heroTitle,
    heroLead,
    cards: buildIndexCards(doc, servicePages, locale),
    rows: buildCompareRows(servicePages, locale),
    services: servicePages.flatMap((page, i) => (page ? [{ slug: SERVICE_SLUGS[i], title: page.title }] : [])),
  }
}
