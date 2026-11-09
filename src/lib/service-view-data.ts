// Datos de vista de la landing de servicio (servidor). Cada lector protege su
// lectura con try y catch: un fallo de Payload en un bloque secundario omite
// ese bloque y se registra, nunca convierte la pagina en un 500 (T-54-38).
//
// `toMarqueeLogos` y `toTestimonialItems` son mapeadores puros: no generan
// ranuras de muestra, omiten lo que no tiene logo con url o cita.
import { getPayload } from 'payload'

import config from '@payload-config'
import type { MarqueeLogo } from '@/components/mui/LogoMarquee'
import type { TestimonialItem } from '@/components/mui/TestimonialCards'
import type { Cliente, Media, Testimonial } from '@/payload-types'
import { SERVICE_SLUGS, buildServiceHref, type ServiceSlug } from '@/lib/service-slugs'
import { getServicePage } from '@/lib/services-data'
import type { ServiceIconName } from '@/lib/shadow-icons'

type Locale = 'es' | 'en'

/** Icono de cada servicio. Los nombres salen de SERVICE_ICON_NAMES (se valida en compilacion). */
export const SERVICE_ICON_BY_SLUG = {
  'seo-technical-audit': 'search',
  'seo-consulting': 'list',
  'fullstack-development': 'code',
  'ai-seo-geo': 'sparkles',
} as const satisfies Record<ServiceSlug, ServiceIconName>

export type OtherService = {
  slug: ServiceSlug
  title: string
  /** Timeline del serviceScopeCard del doc, o null si no lo trae. */
  duration: string | null
  icon: ServiceIconName
  href: string
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/**
 * Los demas servicios: SERVICE_SLUGS menos el actual, con titulo y duracion
 * leidos de sus docs. Un doc que falla o no existe se omite y se registra.
 */
export async function getOtherServices(locale: Locale, currentSlug: string): Promise<OtherService[]> {
  const others = SERVICE_SLUGS.filter((s) => s !== currentSlug)
  const results = await Promise.all(
    others.map(async (slug): Promise<OtherService | null> => {
      try {
        const doc = await getServicePage(locale, slug)
        if (!doc) return null
        const layout = doc.content?.layout ?? []
        const hero = layout.find((b) => b.blockType === 'hero')
        const scope = layout.find((b) => b.blockType === 'serviceScopeCard')
        return {
          slug,
          title: str(hero?.blockType === 'hero' ? hero.title : null) ?? doc.title,
          duration: scope?.blockType === 'serviceScopeCard' ? str(scope.timeline) : null,
          icon: SERVICE_ICON_BY_SLUG[slug],
          href: buildServiceHref(locale, slug),
        }
      } catch (err) {
        console.error('[services]', err)
        return null
      }
    }),
  )
  return results.filter((r): r is OtherService => r !== null)
}

/** Clientes poblados del bloque o de la coleccion a props de LogoMarquee. Omite los que no traen logo con url. */
export function toMarqueeLogos(clients: Array<number | Cliente> | null | undefined): MarqueeLogo[] {
  const logos: MarqueeLogo[] = []
  for (const client of clients ?? []) {
    if (typeof client !== 'object' || client === null) continue
    const logo: Media | null = typeof client.logo === 'object' ? client.logo : null
    if (!logo?.url) continue
    logos.push({
      id: client.id,
      src: logo.url,
      alt: str(logo.alt) ?? client.name,
      width: logo.width ?? null,
      height: logo.height ?? null,
      onDark: client.onDark ?? false,
    })
  }
  return logos
}

/** Testimonios a props de TestimonialCards. Omite los que no traen cita. */
export function toTestimonialItems(testimonials: Testimonial[] | null | undefined): TestimonialItem[] {
  const items: TestimonialItem[] = []
  for (const t of testimonials ?? []) {
    const quote = str(t.testimonial)
    if (!quote) continue
    const role = [str(t.role), str(t.company)].filter(Boolean).join(' · ')
    items.push({ id: t.id, quote, name: t.name, role: role === '' ? null : role })
  }
  return items
}

/**
 * Logos del bloque clientLogosBlock. Con lista explicita (poblada a depth 1)
 * usa esa; sin ella, todos los clientes, igual que el componente anterior.
 */
export async function getServiceLogos(
  explicit: Array<number | Cliente> | null | undefined,
): Promise<MarqueeLogo[]> {
  const populated = toMarqueeLogos(explicit)
  if (populated.length > 0 || (explicit && explicit.length > 0)) return populated
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'clientes',
      limit: 50,
      depth: 1,
      pagination: false,
      overrideAccess: false,
      select: { name: true, logo: true, onDark: true },
    })
    return toMarqueeLogos(docs as Cliente[])
  } catch (err) {
    console.error('[services]', err)
    return []
  }
}

/** Testimonios para el bloque testimonialsCarousel (`limit` del bloque, 8 por defecto). */
export async function getServiceTestimonials(limit: number | null | undefined): Promise<TestimonialItem[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'testimonials',
      limit: limit ?? 8,
      depth: 0,
      overrideAccess: false,
    })
    return toTestimonialItems(docs)
  } catch (err) {
    console.error('[services]', err)
    return []
  }
}

export type CaseProof = {
  slug: string
  title: string
  heroMetric: string | null
  sector: string | null
}

/**
 * Caso del bloque relatedCaseStudyBlock. Sin caso elegido (o con uno que no se
 * pueda leer) cae al mas reciente, como el componente anterior. Nunca expone
 * borradores: `overrideAccess: false`.
 */
export async function getCaseProof(
  locale: Locale,
  caseStudy: number | { id: number } | null | undefined,
): Promise<CaseProof | null> {
  try {
    const payload = await getPayload({ config })
    const id = typeof caseStudy === 'object' && caseStudy !== null ? caseStudy.id : caseStudy
    let doc = null
    if (id) {
      try {
        doc = await payload.findByID({ collection: 'case-studies', id, depth: 0, locale, overrideAccess: false })
      } catch {
        doc = null
      }
    }
    if (!doc) {
      const result = await payload.find({
        collection: 'case-studies',
        limit: 1,
        sort: '-createdAt',
        depth: 0,
        locale,
        overrideAccess: false,
      })
      doc = result.docs[0] ?? null
    }
    if (!doc?.slug) return null
    return { slug: doc.slug, title: doc.title, heroMetric: str(doc.heroMetric), sector: str(doc.sector) }
  } catch (err) {
    console.error('[services]', err)
    return null
  }
}
