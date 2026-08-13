// Pure module: zero Payload/DB imports, safe to import from Client
// Components (e.g. LocaleSwitcher) as well as Server Components. Split out
// of services-data.ts (24-REVIEW WR-01 risk made concrete): services-data.ts
// imports `getPayload`/`@payload-config` at module scope, so anything that
// needs only the slug/URL logic below must import from here instead, or it
// would pull the Payload server SDK into a client bundle.

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

/**
 * Locale-correct href for a single service landing. Services are the one
 * section whose URL segment genuinely differs by locale (`/servicios/<slug>`
 * vs `/en/services/<slug>`), so this cannot be left to a generic locale
 * prefix — the segment itself changes, not just the prefix.
 *
 * Lifted out of ServicesShowcase so the footer's Services column and the
 * home page block build the same URL from one definition.
 */
export function buildServiceHref(locale: 'es' | 'en', slug: string): string {
  return locale === 'es' ? `/servicios/${slug}` : `/en/services/${slug}`
}

/** Locale-correct href for the services index itself. */
export function buildServicesIndexHref(locale: 'es' | 'en'): string {
  return locale === 'es' ? '/servicios' : '/en/services'
}

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(slug)
}

/**
 * Corrects a Services URL to the locale-correct dual-segment path
 * (`/servicios` for es, `/en/services` for en), same locale-not-folder
 * rule as buildServiceAlternates() in src/lib/canonical.ts. Content stored
 * in Payload (Header.navItems.url, page card links) is not locale-aware —
 * some of those fields are non-localized, so a single stored URL like
 * `/services` renders on both locales verbatim unless corrected here.
 * Non-service hrefs pass through unchanged.
 */
export function normalizeServiceHref(href: string, locale: 'es' | 'en'): string {
  // Index page — with or without a stray `/en` prefix (e.g. LocaleSwitcher's
  // naive prefix-swap turning `/servicios` into `/en/servicios`).
  if (href === '/services' || href === '/servicios' || href === '/en/services' || href === '/en/servicios') {
    return locale === 'es' ? '/servicios' : '/en/services'
  }
  const match = href.match(/^\/(en\/)?(servicios|services)\/([^/?#]+)(.*)$/)
  if (match) {
    const slug = match[3]
    const rest = match[4] ?? ''
    if (isServiceSlug(slug)) {
      return locale === 'es' ? `/servicios/${slug}${rest}` : `/en/services/${slug}${rest}`
    }
  }
  return href
}
