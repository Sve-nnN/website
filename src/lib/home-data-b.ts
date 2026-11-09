// Segunda mitad de la home (fase 54, plan 54-14): Proceso, Casos, Sitios,
// Sobre mi, Testimonios, FAQ, Cierre y los tres bloques que el doc `home` de
// Pages ya sirve (errores reales, auditor y oferta de auditoria).
//
// `mapHomeGlobalB` y los mapeadores de lectura son funciones puras: la
// autoprueba (scripts/verify/54-home-b-ssr.ts) las alimenta con el copy
// sembrado como fixture. Los lectores son la unica parte que toca el CMS y
// cada uno falla por separado con `console.error('[home]', err)` y deja su
// seccion en null: la home nunca responde 500 por una lectura (T-54-60).
//
// Este modulo NO importa en tiempo de ejecucion de `./home-data` (que a su vez
// importa este): evita un ciclo. `home-data` solo recibe de aqui tipos y
// `getHomeSectionsB`.
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import { formatSector, splitHeroMetric } from '@/components/mui/split-hero-metric'
import { getCachedFeaturedContent, type Locale } from '@/lib/cache'
import { CACHE_TAGS, CACHE_TTL_SECONDS } from '@/lib/cache-tags'
import { SERVICE_ICON_NAMES } from '@/lib/shadow-icons'
import type { HomePage, Media } from '@/payload-types'

// ---------------------------------------------------------------------------
// Tipos de seccion
// ---------------------------------------------------------------------------

export type ProcessStep = {
  /** Nombre de icono validado contra SERVICE_ICON_NAMES, o null. */
  icon: string | null
  title: string
  body: string | null
}

export type HomeProcess = { title: string; steps: ProcessStep[] }

export type HomeCaseItem = {
  id: number | string
  href: string
  /** Sector ya pasado por formatSector (sin raya larga ni corta). null sin sector. */
  tag: string | null
  /** Cifra separada por splitHeroMetric ("+406 %"). */
  metric: string
  /** Etiqueta que venia en el dato. null cae a metricSuffix al ensamblar. */
  label: string | null
  title: string
}

export type HomeCasesText = {
  title: string
  lead: string | null
  note: string | null
  ctaLabel: string | null
  metricSuffix: string | null
}

export type HomeCases = Omit<HomeCasesText, 'metricSuffix'> & {
  items: HomeCaseItem[]
}

export type SiteScores = {
  performance: number | null
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
}

export type SiteImage = { url: string; width: number | null; height: number | null; alt: string | null }

export type HomeSiteItem = {
  id: number | string
  /** Pagina del sitio dentro de este dominio (/websites/<slug>). */
  href: string
  /** Dominio del sitio, tomado de la URL del cliente. null si no la hay. */
  domain: string | null
  name: string
  category: string | null
  image: SiteImage | null
  scores: SiteScores
  tech: string[]
  /** Fecha ISO de lighthouseCapturedAt. */
  capturedAt: string | null
}

export type HomeSites = {
  title: string
  ctaLabel: string | null
  items: HomeSiteItem[]
  /** La fecha de captura mas reciente de los sitios mostrados (ISO), o null. */
  capturedAt: string | null
}

export type AboutPhoto = {
  url: string
  width: number | null
  height: number | null
  /** Alt del Media. null deja la imagen como decorativa (alt vacio). */
  alt: string | null
  caption: string | null
}

export type HomeAbout = {
  title: string
  paragraphs: string[]
  chips: string[]
  seoLabel: string | null
  devLabel: string | null
  seoCount: number | null
  devCount: number | null
  photos: AboutPhoto[]
}

export type HomeTestimonialItem = {
  id: number | string
  quote: string
  name: string
  role: string | null
  company: string | null
}

export type HomeTestimonials = { title: string; items: HomeTestimonialItem[] }

export type HomeFaqItem = { question: string; answer: string }
export type HomeFaq = { title: string; items: HomeFaqItem[] }

export type HomeClientCounts = { seo: number | null; dev: number | null }

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

/** Cadena con contenido o null (vacio, solo espacios o un valor que no es texto). */
function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function validIcon(value: unknown): string | null {
  const icon = text(value)
  return icon && (SERVICE_ICON_NAMES as readonly string[]).includes(icon) ? icon : null
}

/** Maximo de casos destacados que muestra la home (rejilla de tres columnas). */
export const HOME_CASES_MAX = 3

// ---------------------------------------------------------------------------
// Mapeo del global home-page (segunda mitad)
// ---------------------------------------------------------------------------

export type HomeGlobalB = {
  process: HomeProcess | null
  casesText: HomeCasesText | null
  sitesText: { title: string; ctaLabel: string | null } | null
  /** Todo lo de Sobre mi que sale del global; los contadores se suman al ensamblar. */
  aboutText: Omit<HomeAbout, 'seoCount' | 'devCount'> | null
  testimonialsTitle: string | null
  faq: HomeFaq | null
}

function mapProcess(process: HomePage['process']): HomeProcess | null {
  if (!process) return null
  const title = text(process.title)
  const steps: ProcessStep[] = []
  for (const raw of process.steps ?? []) {
    const stepTitle = text(raw?.title)
    if (!stepTitle) continue
    steps.push({ icon: validIcon(raw?.icon), title: stepTitle, body: text(raw?.body) })
  }
  // Sin titulo la seccion quedaria sin encabezado ni nombre accesible; sin
  // pasos no hay nada que mostrar. En los dos casos se omite.
  if (!title || steps.length === 0) return null
  return { title, steps }
}

function mapCasesText(cases: HomePage['cases']): HomeCasesText | null {
  if (!cases) return null
  const title = text(cases.title)
  if (!title) return null
  return {
    title,
    lead: text(cases.lead),
    note: text(cases.note),
    ctaLabel: text(cases.ctaLabel),
    metricSuffix: text(cases.metricSuffix),
  }
}

function mapSitesText(sites: HomePage['sites']): HomeGlobalB['sitesText'] {
  if (!sites) return null
  const title = text(sites.title)
  // La nota de fecha NO sale del global: se arma con messages y la fecha real.
  return title ? { title, ctaLabel: text(sites.ctaLabel) } : null
}

/** Foto de about con la imagen poblada a depth 1. Sin url no hay foto. */
function mapAboutPhoto(raw: NonNullable<NonNullable<HomePage['about']>['photos']>[number] | undefined): AboutPhoto | null {
  const image = raw?.image
  if (!image || typeof image !== 'object') return null
  const media = image as Media
  const url = text(media.url)
  if (!url) return null
  return {
    url,
    width: typeof media.width === 'number' ? media.width : null,
    height: typeof media.height === 'number' ? media.height : null,
    alt: text(media.alt),
    caption: text(raw?.caption),
  }
}

function mapAboutText(about: HomePage['about']): HomeGlobalB['aboutText'] {
  if (!about) return null
  const title = text(about.title)
  if (!title) return null
  const photos: AboutPhoto[] = []
  for (const raw of about.photos ?? []) {
    const photo = mapAboutPhoto(raw)
    if (photo) photos.push(photo)
  }
  return {
    title,
    paragraphs: (about.paragraphs ?? []).map((p) => text(p?.text)).filter((p): p is string => p !== null),
    chips: (about.chips ?? []).map((c) => text(c?.label)).filter((c): c is string => c !== null),
    seoLabel: text(about.seoLabel),
    devLabel: text(about.devLabel),
    photos: photos.slice(0, 3),
  }
}

function mapFaq(faq: HomePage['faq']): HomeFaq | null {
  if (!faq) return null
  const title = text(faq.title)
  const items: HomeFaqItem[] = []
  for (const raw of faq.items ?? []) {
    const question = text(raw?.question)
    const answer = text(raw?.answer)
    if (question && answer) items.push({ question, answer })
  }
  return title && items.length > 0 ? { title, items } : null
}

/** Global home-page a props de la segunda mitad. Una seccion sin contenido da null. */
export function mapHomeGlobalB(global: Partial<HomePage> | null | undefined, _locale: Locale): HomeGlobalB {
  if (!global) {
    return { process: null, casesText: null, sitesText: null, aboutText: null, testimonialsTitle: null, faq: null }
  }
  return {
    process: mapProcess(global.process),
    casesText: mapCasesText(global.cases),
    sitesText: mapSitesText(global.sites),
    aboutText: mapAboutText(global.about),
    testimonialsTitle: text(global.testimonials?.title),
    faq: mapFaq(global.faq),
  }
}

// ---------------------------------------------------------------------------
// Casos destacados
// ---------------------------------------------------------------------------

type CaseLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  sector?: string | null
  heroMetric?: string | null
}

/**
 * Casos destacados del global `featured-content` a tarjetas. Mapeo puro: toma
 * solo los poblados (objetos), omite los que no traen slug, titulo o cifra y se
 * queda con los tres primeros. La cifra se separa de su etiqueta con
 * splitHeroMetric y el sector pasa por formatSector.
 */
export function mapFeaturedCases(featured: ReadonlyArray<unknown> | null | undefined): HomeCaseItem[] {
  const items: HomeCaseItem[] = []
  for (const entry of featured ?? []) {
    if (!entry || typeof entry !== 'object') continue
    const cs = entry as CaseLike
    const slug = text(cs.slug)
    const title = text(cs.title)
    if (!slug || !title) continue
    const { metric, label } = splitHeroMetric(cs.heroMetric)
    if (metric === '') continue
    const sector = formatSector(cs.sector)
    items.push({
      id: cs.id ?? slug,
      href: `/case-studies/${slug}`,
      tag: sector === '' ? null : sector,
      metric,
      label,
      title,
    })
    if (items.length >= HOME_CASES_MAX) break
  }
  return items
}

/**
 * Casos destacados por la capa cacheada de featured-content (no abre otra
 * consulta). Nunca lanza: un error de lectura se registra y deja la seccion en
 * null.
 */
export async function getHomeCases(locale: Locale): Promise<HomeCaseItem[] | null> {
  try {
    const featured = await getCachedFeaturedContent(locale)
    return mapFeaturedCases(featured.featuredCaseStudies)
  } catch (err) {
    console.error('[home]', err)
    return null
  }
}

/** Texto del global mas casos leidos. Sin casos o sin titulo no hay seccion. */
export function assembleCases(textBlock: HomeCasesText | null, items: HomeCaseItem[] | null): HomeCases | null {
  if (!textBlock || !items || items.length === 0) return null
  const { metricSuffix, ...rest } = textBlock
  return {
    ...rest,
    items: items.map((item) => ({ ...item, label: item.label ?? metricSuffix })),
  }
}

// ---------------------------------------------------------------------------
// Sitios destacados
// ---------------------------------------------------------------------------

type WebsiteLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  industry?: string | null
  stack?: ReadonlyArray<{ tag?: string | null } | null> | null
  screenshots?: ReadonlyArray<{ image?: unknown } | null> | null
  lighthouse?: Partial<Record<keyof SiteScores, unknown>> | null
  lighthouseCapturedAt?: string | null
  client?: unknown
}

function score(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Host de una URL de cliente, sin `www.`. null si la URL no se puede leer. */
export function hostnameOf(raw: string | null | undefined): string | null {
  const value = text(raw)
  if (!value) return null
  try {
    const url = new URL(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ? value : `https://${value}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.hostname.replace(/^www\./, '') || null
  } catch {
    return null
  }
}

function isoDate(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null
  return Number.isNaN(new Date(raw).getTime()) ? null : raw
}

/**
 * Documento de la coleccion `websites` a tarjeta. Los puntajes salen de
 * `lighthouse` tal cual vienen: un valor que no es numero queda en null y la
 * tarjeta omite ese anillo. Sin slug o sin titulo no hay tarjeta.
 */
export function mapWebsite(doc: WebsiteLike): HomeSiteItem | null {
  const slug = text(doc.slug)
  const name = text(doc.title)
  if (!slug || !name) return null

  let image: SiteImage | null = null
  const media = doc.screenshots?.[0]?.image
  if (media && typeof media === 'object') {
    const m = media as Partial<Media>
    const url = text(m.url)
    if (url) {
      image = {
        url,
        width: typeof m.width === 'number' ? m.width : null,
        height: typeof m.height === 'number' ? m.height : null,
        alt: text(m.alt),
      }
    }
  }

  const client = doc.client && typeof doc.client === 'object' ? (doc.client as { websiteUrl?: string | null }) : null
  return {
    id: doc.id ?? slug,
    href: `/websites/${slug}`,
    domain: hostnameOf(client?.websiteUrl),
    name,
    category: text(doc.industry),
    image,
    scores: {
      performance: score(doc.lighthouse?.performance),
      accessibility: score(doc.lighthouse?.accessibility),
      bestPractices: score(doc.lighthouse?.bestPractices),
      seo: score(doc.lighthouse?.seo),
    },
    tech: (doc.stack ?? []).map((s) => text(s?.tag)).filter((t): t is string => t !== null),
    capturedAt: isoDate(doc.lighthouseCapturedAt),
  }
}

/** Maximo de sitios en la home: tres de dos columnas y dos de tres. */
export const HOME_SITES_MAX = 5

const SITES_SELECT = {
  title: true,
  slug: true,
  industry: true,
  stack: true,
  screenshots: true,
  lighthouse: true,
  lighthouseCapturedAt: true,
  client: true,
} as const

/**
 * Sitios destacados: toma los ids de `featuredWebsites` (capa cacheada de
 * featured-content) y vuelve a leer esos websites con `overrideAccess: false`,
 * que descarta borradores, en el mismo orden. `select` minimo y `populate`
 * solo de los campos publicos de Media y del cliente (T-54-59).
 */
export async function getHomeSites(locale: Locale): Promise<HomeSiteItem[] | null> {
  try {
    return await readHomeSites(locale)
  } catch (err) {
    console.error('[home]', err)
    return null
  }
}

function readHomeSites(locale: Locale): Promise<HomeSiteItem[]> {
  return unstable_cache(
    async (): Promise<HomeSiteItem[]> => {
      const featured = await getCachedFeaturedContent(locale)
      const ids = (featured.featuredWebsites ?? [])
        .map((w) => (typeof w === 'object' && w ? w.id : w))
        .filter((id): id is number => typeof id === 'number')
        .slice(0, HOME_SITES_MAX)
      if (ids.length === 0) return []

      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'websites',
        where: { id: { in: ids } },
        locale,
        depth: 1,
        limit: ids.length,
        pagination: false,
        overrideAccess: false,
        select: SITES_SELECT,
        populate: {
          media: { url: true, width: true, height: true, alt: true },
          clientes: { websiteUrl: true },
        },
      })
      const items: HomeSiteItem[] = []
      for (const id of ids) {
        const doc = docs.find((d) => d.id === id)
        const item = doc ? mapWebsite(doc as WebsiteLike) : null
        if (item) items.push(item)
      }
      return items
    },
    ['home-sites', locale],
    { tags: [CACHE_TAGS.featuredContent()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/** Texto del global mas sitios leidos. Sin sitios o sin titulo no hay seccion. */
export function assembleSites(textBlock: HomeGlobalB['sitesText'], items: HomeSiteItem[] | null): HomeSites | null {
  if (!textBlock || !items || items.length === 0) return null
  let latest: string | null = null
  for (const item of items) {
    if (item.capturedAt && (!latest || new Date(item.capturedAt) > new Date(latest))) latest = item.capturedAt
  }
  return { title: textBlock.title, ctaLabel: textBlock.ctaLabel, items, capturedAt: latest }
}

// ---------------------------------------------------------------------------
// Sobre mi: contadores
// ---------------------------------------------------------------------------

const getCachedHomeClientCounts = unstable_cache(
  async (): Promise<HomeClientCounts> => {
    const payload = await getPayload({ config })
    const [seo, dev] = await Promise.all(
      (['seo', 'desarrollo'] as const).map((workType) =>
        payload.count({
          collection: 'clientes',
          where: { workType: { equals: workType } },
          overrideAccess: false,
        }),
      ),
    )
    return { seo: seo.totalDocs, dev: dev.totalDocs }
  },
  ['home-client-counts'],
  { revalidate: CACHE_TTL_SECONDS },
)

/** Conteo de clientes por workType (seo y desarrollo). Nunca lanza: null ante un error. */
export async function getHomeClientCounts(): Promise<HomeClientCounts | null> {
  try {
    return await getCachedHomeClientCounts()
  } catch (err) {
    console.error('[home]', err)
    return null
  }
}

/** Texto del global, conteos y fotos. Un contador sin valor o sin rotulo se omite. */
export function assembleAbout(aboutText: HomeGlobalB['aboutText'], counts: HomeClientCounts | null): HomeAbout | null {
  if (!aboutText) return null
  const count = (n: number | null | undefined) => (typeof n === 'number' && n > 0 ? n : null)
  return {
    ...aboutText,
    seoCount: count(counts?.seo),
    devCount: count(counts?.dev),
  }
}

// ---------------------------------------------------------------------------
// Testimonios
// ---------------------------------------------------------------------------

type TestimonialLike = {
  id?: number | string
  name?: string | null
  role?: string | null
  company?: string | null
  testimonial?: string | null
}

/** Testimonios de la coleccion a tarjetas. Sin cita o sin nombre se omiten; nunca ranuras de muestra. */
export function mapTestimonials(docs: ReadonlyArray<TestimonialLike> | null | undefined): HomeTestimonialItem[] {
  const items: HomeTestimonialItem[] = []
  for (const doc of docs ?? []) {
    const quote = text(doc.testimonial)
    const name = text(doc.name)
    if (!quote || !name) continue
    items.push({ id: doc.id ?? name, quote, name, role: text(doc.role), company: text(doc.company) })
  }
  return items
}

/** Solo los documentos de la coleccion (hoy uno). Nunca lanza: null ante un error. */
export function getHomeTestimonials(locale: Locale): Promise<HomeTestimonialItem[] | null> {
  return unstable_cache(
    async (): Promise<HomeTestimonialItem[] | null> => {
      try {
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'testimonials',
          locale,
          limit: 9,
          depth: 0,
          pagination: false,
          sort: 'createdAt',
          overrideAccess: false,
          select: { name: true, role: true, company: true, testimonial: true },
        })
        return mapTestimonials(docs)
      } catch (err) {
        console.error('[home]', err)
        return null
      }
    },
    ['home-testimonials', locale],
    { revalidate: CACHE_TTL_SECONDS },
  )()
}

export function assembleTestimonials(title: string | null, items: HomeTestimonialItem[] | null): HomeTestimonials | null {
  if (!title || !items || items.length === 0) return null
  return { title, items }
}
