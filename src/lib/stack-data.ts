// Mapeador puro de /stack (fase 54, plan 54-12). Convierte el bloque `toolStack`
// ya poblado (depth 2) en props tipadas y serializables para StackView.
//
// Modulo puro a proposito: sin imports de Payload ni de la base. Recibe el
// bloque y no lee nada, asi la autoprueba (scripts/verify/54-stack-ssr.ts) lo
// alimenta con el doc real de la API publica y con fixtures.
//
// El ORDEN de categorias y herramientas es el del array del CMS: nunca se
// reordena por afiliado ni por comision (ver el comentario de config.ts).
import { resolveAffiliateCta } from '@/lib/affiliate-cta'
import { sanitizeHref, type NavLocale } from '@/lib/nav-links'
import { slugify } from '@/components/mui/rich-text/lexical-toc'
import type { AffiliateLink, Media, ToolStackBlock } from '@/payload-types'

export type StackCta =
  /** Enlace /go/<slug>. `label` null: la tarjeta usa el rotulo por defecto con el nombre de la herramienta. */
  | { kind: 'active'; href: string; label: string | null }
  | { kind: 'pending' }
  | { kind: 'none' }

export type StackReference = { label: string; href: string }

export type StackTool = {
  name: string
  /** URL del logo, solo si `logo` es un Media poblado con url. Sin logo, null: no hay tile. */
  logoUrl: string | null
  narrative: string
  pro: string
  /** null cuando el contra esta vacio: la tarjeta muestra `stackPage.rowConEmpty`. */
  con: string | null
  /** null sin referenceLink o sin destino valido: no se dibuja la linea Donde lo use. */
  reference: StackReference | null
  cta: StackCta
}

export type StackCategory = {
  id: string
  heading: string
  /** Ancla de la seccion, sacada del encabezado con slugify (la misma funcion del indice legal). */
  anchor: string
  tools: StackTool[]
}

export type StackGearItem = { name: string; href: string }

export type StackViewData = {
  intro: string | null
  categories: StackCategory[]
  gearIntro: string | null
  gear: StackGearItem[]
  elegiriaHoy: string | null
  /** whyIUseIt de la recomendacion sin comision, y el enlace solo si es Google Search Console. */
  noCommissionPick: { narrative: string; href: string | null } | null
  auditorNarrative: string | null
}

type ToolRow = NonNullable<NonNullable<ToolStackBlock['categoryGroups']>[number]['tools']>[number]

export const GSC_URL = 'https://search.google.com/search-console'

/** Cadena con contenido o null. */
function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** URL de logo aceptada: absoluta http(s) o ruta absoluta del sitio. Todo lo demas, null. */
function logoUrlOf(logo: ToolRow['logo']): string | null {
  if (typeof logo !== 'object' || logo === null) return null
  const url = text((logo as Media).url)
  if (!url) return null
  return /^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//')) ? url : null
}

function referenceOf(ref: ToolRow['referenceLink'], locale: NavLocale): StackReference | null {
  if (!ref) return null
  if (ref.type === 'caseStudy') {
    const cs = ref.caseStudy
    // Sin caso poblado (relacion vacia o id crudo sin permiso) no hay destino: nunca /case-studies/undefined.
    if (typeof cs !== 'object' || cs === null) return null
    const slug = text(cs.slug)
    if (!slug) return null
    const href = `/case-studies/${slug}`
    return { label: text(cs.title) ?? href, href }
  }
  // T-54-51: la url libre la teclea un editor. sanitizeHref rechaza javascript:, //host y esquemas raros.
  const href = sanitizeHref(ref.url, locale)
  return href ? { label: href, href } : null
}

function toolOf(row: ToolRow, locale: NavLocale): StackTool | null {
  const name = text(row.name)
  if (!name) return null
  // El primer argumento es el contrato de 48-RESEARCH: nunca leer subcampos sin comprobar el objeto poblado.
  const affiliate = row.affiliateLink as AffiliateLink | number | null | undefined
  const cta = resolveAffiliateCta(affiliate, name, '')
  return {
    name,
    logoUrl: logoUrlOf(row.logo),
    narrative: text(row.narrative) ?? '',
    pro: text(row.pro) ?? '',
    con: text(row.con),
    reference: referenceOf(row.referenceLink, locale),
    cta: cta.kind === 'active' ? { kind: 'active', href: cta.href, label: cta.label || null } : { kind: cta.kind },
  }
}

/** Ancla unica por seccion: slugify del encabezado y, si se repite, sufijo numerico. */
function uniqueAnchor(heading: string, index: number, used: Set<string>): string {
  const base = slugify(heading) || `categoria-${index + 1}`
  let anchor = base
  for (let n = 2; used.has(anchor); n += 1) anchor = `${base}-${n}`
  used.add(anchor)
  return anchor
}

/** Solo URLs absolutas http(s): los enlaces del equipo salen a Amazon y nunca pasan por /go. */
function gearHrefOf(raw: string, locale: NavLocale): string | null {
  const href = sanitizeHref(raw, locale)
  return href && /^https?:\/\//i.test(href) ? href : null
}

export function buildStackViewData(block: ToolStackBlock, locale: NavLocale): StackViewData {
  const used = new Set<string>()
  const categories: StackCategory[] = []
  for (const [i, group] of (block.categoryGroups ?? []).entries()) {
    const heading = text(group.heading)
    if (!heading) continue
    const tools = (group.tools ?? [])
      .map((row) => toolOf(row, locale))
      .filter((tool): tool is StackTool => tool !== null)
    // Una categoria sin herramientas no deja encabezado huerfano.
    if (tools.length === 0) continue
    categories.push({
      id: group.id ?? `${i}-${heading}`,
      heading,
      anchor: uniqueAnchor(heading, i, used),
      tools,
    })
  }

  const gear: StackGearItem[] = []
  for (const item of block.gearItems ?? []) {
    const name = text(item.name)
    const href = gearHrefOf(item.href, locale)
    if (name && href) gear.push({ name, href })
  }

  const pick = typeof block.noCommissionPick === 'object' && block.noCommissionPick !== null ? block.noCommissionPick : null
  const pickNarrative = text(pick?.whyIUseIt)

  return {
    intro: text(block.intro),
    categories,
    gearIntro: text(block.gearIntro),
    gear,
    elegiriaHoy: text(block.elegiriaHoy),
    noCommissionPick: pick && pickNarrative
      ? { narrative: pickNarrative, href: pick.program === 'google-search-console' ? GSC_URL : null }
      : null,
    auditorNarrative: text(block.auditorHighlight?.narrative),
  }
}
