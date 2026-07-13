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

type Section = 'services' | 'case-studies'

const SECTION_LABELS: Record<Section, Record<Locale, string>> = {
  services: { es: 'Servicios', en: 'Services' },
  'case-studies': { es: 'Casos de éxito', en: 'Case Studies' },
}

// Case Studies routes are NOT locale-prefixed in their segment (confirmed:
// src/app/(frontend)/[locale]/case-studies/page.tsx serves both /case-studies
// and /en/case-studies under the same folder name) — unlike Services, which
// has a genuinely different Spanish segment ('servicios' vs 'services').
const SECTION_SEGMENTS: Record<Section, Record<Locale, string>> = {
  services: { es: 'servicios', en: 'services' },
  'case-studies': { es: 'case-studies', en: 'case-studies' },
}

function sectionIndexHref(locale: Locale, section: Section): string {
  const home = homeHref(locale)
  return `${home === '/' ? '' : home}/${SECTION_SEGMENTS[section][locale]}`
}

function buildSectionTrail(
  locale: Locale,
  section: Section,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [
    { label: LABELS[locale].home, url: homeHref(locale) },
    { label: SECTION_LABELS[section][locale], url: sectionIndexHref(locale, section) },
  ]

  if (current) {
    trail.push({
      label: current.title,
      url: `${sectionIndexHref(locale, section)}/${current.slug}`,
    })
  }

  return trail
}

/**
 * Builds the breadcrumb trail for the Servicios index page (2 levels) or one
 * of its 4 individual landings (3 levels, when `current` is provided).
 *
 * `current.title` must be the already-locale-fetched Payload `title` field
 * the caller passes in — this function performs no Payload query of its own.
 *
 * Thin wrapper around `buildSectionTrail()` — kept byte-for-byte compatible
 * (same exported signature/behavior) so the 4 existing Services call sites
 * require zero changes.
 */
export function buildTrail(
  locale: Locale,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  return buildSectionTrail(locale, 'services', current)
}

/**
 * Builds the breadcrumb trail for the Case Studies index page (2 levels) or
 * one of its individual detail pages (3 levels, when `current` is provided).
 * Sibling to `buildTrail()`, sharing the same internal `buildSectionTrail()`
 * so URL/locale logic is never duplicated across sections (UIPOL-09).
 */
export function buildCaseStudiesTrail(
  locale: Locale,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  return buildSectionTrail(locale, 'case-studies', current)
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
