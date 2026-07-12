import { getPayload } from 'payload'

import config from '@payload-config'

/** Slug of the `pages` doc that lists all 4 service lines. */
export const SERVICES_INDEX_SLUG = 'services' as const

/**
 * Single source of truth for the 4 individual service-page slugs. Order
 * corresponds to:
 *   0. seo-technical-audit    -> Auditoría SEO Técnica
 *   1. seo-consulting         -> Consultoría SEO
 *   2. fullstack-development  -> Desarrollo Full-Stack con SEO integrado
 *   3. ai-seo-geo             -> SEO para IA/GEO
 *
 * Every other Phase 19 artifact (routes, seed content, sitemap) imports
 * these values instead of hand-typing the slug strings.
 */
export const SERVICE_SLUGS = [
  'seo-technical-audit',
  'seo-consulting',
  'fullstack-development',
  'ai-seo-geo',
] as const

export type ServiceSlug = (typeof SERVICE_SLUGS)[number]

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(slug)
}

export async function getServicesIndexPage(locale: 'es' | 'en') {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SERVICES_INDEX_SLUG } },
    locale,
    depth: 1,
    limit: 1,
  })
  return docs[0]
}

export async function getServicePage(locale: 'es' | 'en', slug: string) {
  // Allowlist check BEFORE any DB query — keeps /services/[slug] and
  // /servicios/[slug] from ever querying the `pages` collection with an
  // arbitrary attacker-supplied slug (T-19-01).
  if (!isServiceSlug(slug)) {
    return undefined
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    depth: 1,
    limit: 1,
  })
  return docs[0]
}
