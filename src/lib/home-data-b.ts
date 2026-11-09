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
import { formatSector, splitHeroMetric } from '@/components/mui/split-hero-metric'
import { getCachedFeaturedContent, type Locale } from '@/lib/cache'
import { SERVICE_ICON_NAMES } from '@/lib/shadow-icons'
import type { HomePage } from '@/payload-types'

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

/** Global home-page a props de la segunda mitad. Una seccion sin contenido da null. */
export function mapHomeGlobalB(global: Partial<HomePage> | null | undefined, _locale: Locale): HomeGlobalB {
  if (!global) return { process: null, casesText: null }
  return {
    process: mapProcess(global.process),
    casesText: mapCasesText(global.cases),
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
