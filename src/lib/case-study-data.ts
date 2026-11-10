// Funciones puras de la superficie Casos de exito (fase 55, plan 55-09). Sin
// acceso al CMS: las lecturas viven en `getCachedCaseStudiesIndex` y
// `getCachedCaseStudyBySlug` (src/lib/cache.ts) y este modulo solo convierte los
// documentos en props serializables para las vistas.
//
// Ningun import de designs/ ni de datos del sandbox (D-02).
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { formatSector, splitHeroMetric } from '@/components/mui/split-hero-metric'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { personRef, SITE_PERSON_SLUG } from '@/lib/person'
import { SITE_URL } from '@/lib/sitemap-data'

/** Fila de resultados tal como llega de Payload (docs y fixtures). */
export type CaseMetricDocLike = {
  label?: string | null
  before?: string | null
  after?: string | null
}

/** Forma minima que el indice y la comparacion leen del documento. */
export type CaseDocLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  heroMetric?: string | null
  heroSubtitle?: string | null
  sector?: string | null
  period?: string | null
  results?: {
    periodBefore?: string | null
    periodAfter?: string | null
    metrics?: ReadonlyArray<CaseMetricDocLike | null> | null
  } | null
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// ---------------------------------------------------------------------------
// Indice (tarea 1)
// ---------------------------------------------------------------------------

export type CaseIndexItem = {
  slug: string
  title: string
  /** Cifra de cabeza ya separada por `splitHeroMetric` ("+406 %"). Vacia si el caso no tiene `heroMetric`. */
  metric: string
  /** Etiqueta bajo la cifra ("clics interanuales"), o null si el texto no calza. */
  metricLabel: string | null
  /** Sector sin raya larga ni corta (`formatSector`), o null. */
  sector: string | null
  subtitle: string | null
  period: string | null
}

/**
 * Documentos de `case-studies` a props por tarjeta, en el orden recibido. Sin
 * slug o sin titulo no hay tarjeta. `_locale` queda en la firma para que la
 * ruta y el detalle llamen igual.
 */
export function toCaseIndexProps(
  docs: ReadonlyArray<CaseDocLike>,
  _locale: 'es' | 'en',
): CaseIndexItem[] {
  const items: CaseIndexItem[] = []
  for (const doc of docs) {
    const slug = text(doc.slug)
    const title = text(doc.title)
    if (!slug || !title) continue
    const { metric, label } = splitHeroMetric(doc.heroMetric)
    items.push({
      slug,
      title,
      metric,
      metricLabel: label,
      sector: text(formatSector(doc.sector)),
      subtitle: text(doc.heroSubtitle),
      period: text(doc.period),
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Numeros de las metricas (tarea 2; la comparacion de la tarea 3 los reutiliza)
// ---------------------------------------------------------------------------

/**
 * Interpreta el valor de una metrica: "47,108" da 47108, "533K" da 533000,
 * "1.25M" da 1250000, "4.2s" da 4.2 y "36.3" da 36.3. Un guion, un texto o una
 * cadena vacia dan NaN (la fila de posicion de un caso que partio sin dato).
 */
export function parseMetricNumber(value: string | null | undefined): number {
  const m = (value ?? '')
    .trim()
    .replace(/,/g, '')
    .match(/^(-?\d+(?:\.\d+)?)\s*([KM])?/i)
  if (!m) return Number.NaN
  const suffix = m[2]?.toUpperCase()
  const factor = suffix === 'K' ? 1e3 : suffix === 'M' ? 1e6 : 1
  return parseFloat(m[1]!) * factor
}

/**
 * Cambio relativo entre dos valores ya interpretados, como razon (0.68 es
 * +68 %). null si algun valor no es un numero finito o si `before` es 0 o
 * menor: no hay base sobre la que calcularlo (Pitfall 9, T-55-34).
 */
export function changeRatio(before: number, after: number): number | null {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0) return null
  return (after - before) / before
}

// ---------------------------------------------------------------------------
// Detalle (tarea 2)
// ---------------------------------------------------------------------------

type ListItemLike<K extends string> = { [P in K]?: string | null } | null

/** Forma minima que el detalle lee del documento (docs de Payload y fixtures). */
export type CaseDetailDocLike = CaseDocLike & {
  client?: unknown
  kpis?: ReadonlyArray<ListItemLike<'label' | 'value'>> | null
  clientContext?: unknown
  challenge?: ReadonlyArray<ListItemLike<'text'>> | null
  solution?: ReadonlyArray<ListItemLike<'title' | 'description'>> | null
  testimonialSection?: ReadonlyArray<ListItemLike<'quote' | 'authorName' | 'authorRole'>> | null
  lessons?: ReadonlyArray<ListItemLike<'title' | 'body'>> | null
  conclusion?: unknown
  heroImage?: unknown
  author?: unknown
  createdAt?: string | null
  updatedAt?: string | null
}

export type CaseResultRow = {
  /** Etiqueta tal como llega de Payload (verbatim, pregunta abierta 7 de 55-RESEARCH). */
  label: string
  before: string
  after: string
  /** Cambio como razon, o null si no hay base numerica. */
  pct: number | null
  /** Largo de cada barra entre 0 y 1, o null si algun valor no es numerico. */
  beforeShare: number | null
  afterShare: number | null
}

export type CaseAuthorProps = {
  name: string
  jobTitle: string | null
  bio: string | null
  /** Ruta sin prefijo de idioma. */
  href: string
  avatar: { url: string; width: number | null; height: number | null; alt: string | null } | null
}

export type CaseDetailProps = {
  slug: string
  title: string
  clientName: string | null
  sector: string | null
  period: string | null
  metric: string
  metricLabel: string | null
  deck: string | null
  kpis: Array<{ label: string; value: string }>
  periodBefore: string | null
  periodAfter: string | null
  /** Lexical con texto, o null: la vista no emite encabezado para una seccion vacia. */
  clientContext: SerializedEditorState | null
  challenge: string[]
  solution: Array<{ title: string; body: string }>
  testimonial: { quote: string; authorName: string; authorRole: string | null } | null
  results: CaseResultRow[]
  /** Lecciones, o null si no hay ninguna (undefined y arreglo vacio dan null, D-10). */
  lessons: Array<{ title: string; body: string }> | null
  conclusion: SerializedEditorState | null
  author: CaseAuthorProps | null
}

type LexicalNodeShape = { text?: unknown; children?: unknown }

function nodeHasText(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as LexicalNodeShape
  if (typeof n.text === 'string' && n.text.trim() !== '') return true
  return Array.isArray(n.children) && n.children.some(nodeHasText)
}

/**
 * El estado Lexical solo cuenta si tiene texto: un parrafo vacio (lo que el
 * editor guarda al borrar el contenido) no debe abrir una seccion con encabezado
 * y sin cuerpo.
 */
export function lexicalOrNull(value: unknown): SerializedEditorState | null {
  if (!value || typeof value !== 'object') return null
  const root = (value as { root?: unknown }).root
  return nodeHasText(root) ? (value as SerializedEditorState) : null
}

function mediaOf(value: unknown): CaseAuthorProps['avatar'] {
  if (!value || typeof value !== 'object') return null
  const m = value as { url?: unknown; width?: unknown; height?: unknown; alt?: unknown }
  const url = text(m.url)
  if (!url) return null
  return {
    url,
    width: typeof m.width === 'number' && m.width > 0 ? m.width : null,
    height: typeof m.height === 'number' && m.height > 0 ? m.height : null,
    alt: text(m.alt),
  }
}

function authorOf(value: unknown): CaseAuthorProps | null {
  if (!value || typeof value !== 'object') return null
  const a = value as { name?: unknown; slug?: unknown; jobTitle?: unknown; bio?: unknown; avatar?: unknown }
  const name = text(a.name)
  const slug = text(a.slug)
  if (!name || !slug) return null
  return {
    name,
    jobTitle: text(a.jobTitle),
    bio: text(a.bio),
    href: `/authors/${slug}`,
    avatar: mediaOf(a.avatar),
  }
}

function resultRows(doc: CaseDocLike): CaseResultRow[] {
  const rows: CaseResultRow[] = []
  for (const m of doc.results?.metrics ?? []) {
    const label = text(m?.label)
    const before = text(m?.before)
    const after = text(m?.after)
    if (!label || !before || !after) continue
    const b = parseMetricNumber(before)
    const a = parseMetricNumber(after)
    const max = Math.max(b, a)
    const bars = Number.isFinite(b) && Number.isFinite(a) && max > 0
    rows.push({
      label,
      before,
      after,
      pct: changeRatio(b, a),
      beforeShare: bars ? Math.max(0, b) / max : null,
      afterShare: bars ? Math.max(0, a) / max : null,
    })
  }
  return rows
}

function pairs<K extends string>(
  items: ReadonlyArray<ListItemLike<K>> | null | undefined,
  keys: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = []
  for (const item of items ?? []) {
    const row = {} as Record<K, string>
    let complete = true
    for (const k of keys) {
      const v = text(item?.[k])
      if (v === null) {
        complete = false
        break
      }
      row[k] = v
    }
    if (complete) out.push(row)
  }
  return out
}

/**
 * Documento de `case-studies` a props serializables del detalle. Sin slug o sin
 * titulo devuelve null (la ruta responde notFound). Toda seccion sin datos sale
 * vacia (arreglo vacio o null) para que la vista no emita su encabezado (D-08).
 * No escribe nada y no copia texto de ninguna fuente externa (D-10, T-55-32).
 */
export function toCaseDetailProps(doc: CaseDetailDocLike, _locale: 'es' | 'en'): CaseDetailProps | null {
  const slug = text(doc.slug)
  const title = text(doc.title)
  if (!slug || !title) return null
  const { metric, label } = splitHeroMetric(doc.heroMetric)
  const client = doc.client && typeof doc.client === 'object' ? (doc.client as { name?: unknown }) : null
  const testimonial = pairs(doc.testimonialSection, ['quote', 'authorName'] as const)[0]
  const testimonialRole = text(doc.testimonialSection?.[0]?.authorRole)
  const lessons = pairs(doc.lessons, ['title', 'body'] as const)
  return {
    slug,
    title,
    clientName: text(client?.name),
    sector: text(formatSector(doc.sector)),
    period: text(doc.period),
    metric,
    metricLabel: label,
    deck: text(doc.heroSubtitle),
    kpis: pairs(doc.kpis, ['label', 'value'] as const),
    periodBefore: text(doc.results?.periodBefore),
    periodAfter: text(doc.results?.periodAfter),
    clientContext: lexicalOrNull(doc.clientContext),
    challenge: pairs(doc.challenge, ['text'] as const).map((c) => c.text),
    solution: pairs(doc.solution, ['title', 'description'] as const).map((s) => ({
      title: s.title,
      body: s.description,
    })),
    testimonial: testimonial
      ? { quote: testimonial.quote, authorName: testimonial.authorName, authorRole: testimonialRole }
      : null,
    results: resultRows(doc),
    lessons: lessons.length > 0 ? lessons : null,
    conclusion: lexicalOrNull(doc.conclusion),
    author: authorOf(doc.author),
  }
}

const RELATED_MAX = 3

/** Hasta tres casos para "Mas casos de exito", en el orden del indice y sin el actual. */
export function pickRelatedCases(items: ReadonlyArray<CaseIndexItem>, currentSlug: string): CaseIndexItem[] {
  return items.filter((i) => i.slug !== currentSlug).slice(0, RELATED_MAX)
}

// ---------------------------------------------------------------------------
// Comparacion de clics organicos entre casos (tarea 3, D-09, Pitfall 9)
// ---------------------------------------------------------------------------

// La fila de clics se reconoce por su etiqueta, que cambia con el idioma de la
// fila (ES `Clics organicos anuales`, EN `Annual organic clicks`). El caso de
// migracion mide trafico mensual y no tiene esa fila: queda fuera.
const CLICKS_LABEL = /^(clics org[aá]nicos anuales|annual organic clicks)/i

export type CompareRow = {
  slug: string
  title: string
  /** Primer tramo del sector (antes de la coma o de la barra), o null. */
  sector: string | null
  /** Valores tal como llegan de Payload ("47,108", "533K"). */
  before: string
  after: string
  /** Cambio como razon, o null si `before` es 0 o menor. */
  pct: number | null
  /** Largo de la barra entre 0 y 1: clics finales sobre el mayor de todos. */
  share: number
  current: boolean
}

export type CaseComparison = {
  rows: CompareRow[]
  /** Lugar del caso actual por crecimiento porcentual, o null si partio de cero. */
  rankPct: number | null
  /** Casos con porcentaje (los que tienen base mayor que cero). */
  totalPct: number
  /** Lugar del caso actual por clics absolutos. */
  rankAbs: number
  totalAbs: number
  /** Casos que no miden clics anuales y quedaron fuera de la comparacion. */
  excluded: number
}

type ClicksRow = { before: string; after: string; beforeNum: number; afterNum: number; pct: number | null }

function clicksOf(doc: CaseDocLike): ClicksRow | null {
  const metric = (doc.results?.metrics ?? []).find((m) => CLICKS_LABEL.test((m?.label ?? '').trim()))
  const before = text(metric?.before)
  const after = text(metric?.after)
  if (!before || !after) return null
  const beforeNum = parseMetricNumber(before)
  const afterNum = parseMetricNumber(after)
  if (!Number.isFinite(beforeNum) || !Number.isFinite(afterNum)) return null
  return { before, after, beforeNum, afterNum, pct: changeRatio(beforeNum, afterNum) }
}

function firstSector(value: string | null | undefined): string | null {
  const sector = text(formatSector(value))
  return sector ? text(sector.split(', ')[0]?.split(' / ')[0]) : null
}

/**
 * Compara los clics organicos anuales del caso actual con los de los demas. Pura
 * y sin escritura: sale de `results.metrics` que ya existen (D-09).
 *
 * `others` puede incluir al caso actual (es el indice completo): se reemplaza
 * por `current` en su lugar; si no esta, entra primero. Un caso sin fila de
 * clics, o con un valor que no es numero (un guion, un texto), no entra. El
 * ranking por porcentaje excluye los casos sin base (before 0). Devuelve null si
 * el caso actual no mide clics: la vista no renderiza la seccion ni su nota.
 */
export function buildCaseComparison(
  current: CaseDocLike,
  others: ReadonlyArray<CaseDocLike>,
): CaseComparison | null {
  const currentSlug = text(current.slug)
  if (!currentSlug) return null
  const all = others.some((o) => text(o.slug) === currentSlug)
    ? others.map((o) => (text(o.slug) === currentSlug ? current : o))
    : [current, ...others]

  const rows: Array<CompareRow & { afterNum: number }> = []
  let measurable = 0
  for (const doc of all) {
    const slug = text(doc.slug)
    const title = text(doc.title)
    if (!slug || !title) continue
    measurable += 1
    const clicks = clicksOf(doc)
    if (!clicks) continue
    rows.push({
      slug,
      title,
      sector: firstSector(doc.sector),
      before: clicks.before,
      after: clicks.after,
      pct: clicks.pct,
      afterNum: clicks.afterNum,
      share: 0,
      current: slug === currentSlug,
    })
  }

  const me = rows.find((r) => r.current)
  if (!me) return null

  const maxAfter = Math.max(...rows.map((r) => r.afterNum))
  for (const r of rows) r.share = maxAfter > 0 ? Math.max(0, r.afterNum) / maxAfter : 0

  const byPct = rows.filter((r) => r.pct !== null).sort((a, b) => (b.pct as number) - (a.pct as number))
  const byAbs = [...rows].sort((a, b) => b.afterNum - a.afterNum)

  return {
    rows: rows.map(({ afterNum: _after, ...row }) => row),
    rankPct: me.pct !== null ? byPct.findIndex((r) => r.slug === currentSlug) + 1 : null,
    totalPct: byPct.length,
    rankAbs: byAbs.findIndex((r) => r.slug === currentSlug) + 1,
    totalAbs: rows.length,
    excluded: measurable - rows.length,
  }
}

// ---------------------------------------------------------------------------
// JSON-LD (extraido de la ruta [slug] sin cambios, D-04 y T-55-33)
// ---------------------------------------------------------------------------

type JsonLdDoc = {
  title: string
  slug?: string | null
  heroSubtitle?: string | null
  kpis?: ReadonlyArray<{ label?: string | null; value?: string | null } | null> | null
  createdAt?: string | null
  updatedAt?: string | null
  heroImage?: unknown
  author?: unknown
  client?: unknown
}

/**
 * JSON-LD `CreativeWork` del caso. Es el mismo objeto que la ruta construia en
 * linea antes de la fase 55 (D-04): ningun campo cambia. SEO-09: `about` es un
 * Thing, `image`, `url` y `dateCreated` van siempre que existan y los valores
 * vacios se omiten. No lleva `datePublished`: la coleccion no tiene
 * `publishedAt` y `createdAt` no se hace pasar por fecha editorial.
 */
export function buildCaseStudyJsonLd(
  doc: JsonLdDoc,
  locale: 'es' | 'en',
  routeSlug: string,
): Record<string, unknown> {
  const author =
    doc.author && typeof doc.author === 'object'
      ? (doc.author as { name?: string; slug?: string | null })
      : undefined
  const client = doc.client && typeof doc.client === 'object' ? (doc.client as { name?: string | null }) : null
  const heroImage =
    doc.heroImage && typeof doc.heroImage === 'object' ? (doc.heroImage as { url?: string | null }) : null
  const heroImageUrl = heroImage?.url ?? getFallbackHeroImage(doc.slug ?? routeSlug)
  const localePrefix = locale === 'es' ? '' : '/en'
  const caseStudyUrl = `${SITE_URL}${localePrefix}/case-studies/${doc.slug ?? routeSlug}`
  const caseStudyImage = heroImageUrl.startsWith('http') ? heroImageUrl : `${SITE_URL}${heroImageUrl}`

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: doc.title,
    url: caseStudyUrl,
    image: caseStudyImage,
    ...(doc.heroSubtitle
      ? {
          about: { '@type': 'Thing', name: doc.heroSubtitle },
          description: doc.heroSubtitle,
        }
      : {}),
    ...(author
      ? {
          author: {
            '@type': 'Person',
            name: author.name,
            ...(author.slug === SITE_PERSON_SLUG ? personRef : {}),
          },
        }
      : {}),
    dateCreated: doc.createdAt,
    dateModified: doc.updatedAt,
    ...(client?.name ? { creator: { '@type': 'Organization', name: client.name } } : {}),
    ...(doc.kpis && doc.kpis.length > 0
      ? {
          additionalProperty: doc.kpis.map((kpi) => ({
            '@type': 'PropertyValue',
            name: kpi?.label,
            value: kpi?.value,
          })),
        }
      : {}),
  }
}
