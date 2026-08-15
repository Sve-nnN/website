// SEO-09: single source of truth for the `Service` structured data on the
// services templates. Pure module: no Payload/DB access, no side effects —
// same contract as `src/lib/breadcrumbs.ts` and `src/lib/blog-paths.ts`.
//
// Why a shared builder rather than four inline objects: the service landings
// exist as two route folders (`servicios/` for ES, `services/` for EN) times
// index + detail. Inlining the schema would mean four copies drifting apart,
// which is exactly how `/blog` ended up with no structured data at all.

import { SITE_URL } from '@/lib/sitemap-data'
import { buildServiceHref, buildServicesIndexHref } from '@/lib/service-slugs'

export type Locale = 'es' | 'en'

/**
 * The provider is a person, not an organisation — this is a personal
 * portfolio. Emitting an `Organization` here would assert a company that does
 * not exist.
 *
 * No `areaServed`: the site states plainly that the work is remote and run
 * from Lima, and `/seo-tecnico-madrid` explicitly says there is no Madrid
 * office. Claiming a service area would contradict the site's own copy.
 */
const PROVIDER = { '@type': 'Person', name: 'Juan Carlos Angulo', url: SITE_URL } as const

/**
 * `Service` for a single service landing.
 *
 * `description` is omitted when the page has no meta description, rather than
 * emitted as an empty string — the audit found `""`/`null` values across the
 * templates and they are worse than an absent key.
 */
export function buildServiceJsonLd(
  locale: Locale,
  slug: string,
  title: string,
  description?: string | null,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    ...(description ? { description } : {}),
    url: `${SITE_URL}${buildServiceHref(locale, slug)}`,
    provider: PROVIDER,
    serviceType: title,
  }
}

/**
 * The services index lists several offerings, so a single `Service` would
 * misdescribe the page — it is not itself one service. `ItemList` is the
 * accurate shape, with each entry pointing at the landing that does carry the
 * `Service`. This is a deliberate deviation from the issue's wording ("Service
 * en /servicios") in favour of what the page actually is.
 */
export function buildServicesIndexJsonLd(
  locale: Locale,
  services: { slug: string; title: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: `${SITE_URL}${buildServicesIndexHref(locale)}`,
    itemListElement: services.map((service, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: service.title,
      url: `${SITE_URL}${buildServiceHref(locale, service.slug)}`,
    })),
  }
}
