// Single source of truth for BREAD-01/02: both the visible breadcrumb trail
// (fed into the Hero block's `breadcrumbs` prop via RenderBlocks' blockProps
// override) and the matching `BreadcrumbList` JSON-LD (fed into <JsonLd>)
// must always call through here — never re-derive labels/URLs inline in a
// page. Pure module: no Payload/DB access, no side effects.

import { SITE_URL } from '@/lib/sitemap-data'

export type Locale = 'es' | 'en'

export type BreadcrumbItem = {
  label: string
  url: string
}

const LABELS: Record<Locale, { home: string; services: string }> = {
  es: { home: 'Inicio', services: 'Servicios' },
  en: { home: 'Home', services: 'Services' },
}

function homeHref(locale: Locale): string {
  return locale === 'es' ? '/' : '/en'
}

function servicesSegment(locale: Locale): string {
  return locale === 'es' ? 'servicios' : 'services'
}

function servicesIndexHref(locale: Locale): string {
  const home = homeHref(locale)
  return `${home === '/' ? '' : home}/${servicesSegment(locale)}`
}

/**
 * Builds the breadcrumb trail for the Servicios index page (2 levels) or one
 * of its 4 individual landings (3 levels, when `current` is provided).
 *
 * `current.title` must be the already-locale-fetched Payload `title` field
 * the caller passes in — this function performs no Payload query of its own.
 */
export function buildTrail(
  locale: Locale,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [
    { label: LABELS[locale].home, url: homeHref(locale) },
    { label: LABELS[locale].services, url: servicesIndexHref(locale) },
  ]

  if (current) {
    trail.push({
      label: current.title,
      url: `${servicesIndexHref(locale)}/${current.slug}`,
    })
  }

  return trail
}

/**
 * Converts a trail produced by `buildTrail()` into a `BreadcrumbList`
 * JSON-LD object. All entries (including the last) carry an absolute `item`
 * URL, per CONTEXT.md's explicit decision — no truncation of the last entry.
 */
export function buildBreadcrumbJsonLd(trail: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: crumb.url === '/' ? SITE_URL : `${SITE_URL}${crumb.url}`,
    })),
  }
}
