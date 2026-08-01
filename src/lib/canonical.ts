// Single source of truth for SEOTECH-01/02: canonical + reciprocal hreflang
// alternates for the Servicios pages. Pure module: no Payload/DB access, no
// side effects — mirrors the precedent set by src/lib/breadcrumbs.ts.
//
// The canonical target is computed purely from the `locale` argument, NOT
// from which physical route folder called it. This is the exact mechanism
// that collapses the 4 physical URL combinations (es/en x servicios/services)
// into 2 canonical targets: the "wrong" combos (`/services` unprefixed,
// `/en/servicios`) canonicalize to the locale-correct segment instead of
// self-referencing duplicate content.

import type { Metadata } from 'next'

import { SITE_URL } from '@/lib/sitemap-data'

export type Locale = 'es' | 'en'

function esPathFor(current?: { slug: string }): string {
  return current ? `/servicios/${current.slug}` : '/servicios'
}

function enPathFor(current?: { slug: string }): string {
  return current ? `/en/services/${current.slug}` : '/en/services'
}

/**
 * Builds `alternates.canonical` + `alternates.languages` for a Servicios
 * index page (when `current` is omitted) or one of its 4 individual landings
 * (when `current.slug` is provided). `x-default` points at the `es` URL
 * because `routing.ts` sets `defaultLocale: 'es'`.
 */
export function buildServiceAlternates(
  locale: Locale,
  current?: { slug: string },
): Metadata['alternates'] {
  const esPath = esPathFor(current)
  const enPath = enPathFor(current)
  const targetPath = locale === 'es' ? esPath : enPath

  return {
    canonical: `${SITE_URL}${targetPath}`,
    languages: {
      es: `${SITE_URL}${esPath}`,
      en: `${SITE_URL}${enPath}`,
      'x-default': `${SITE_URL}${esPath}`,
    },
  }
}

/**
 * Generic sitewide `alternates.canonical` + `alternates.languages` builder
 * for routes with a plain 1:1 es/en path pair (unlike Servicios' 4-to-2
 * collapsing handled by `buildServiceAlternates` above). `x-default` points
 * at the `es` URL because `routing.ts` sets `defaultLocale: 'es'`.
 */
export function buildAlternates(
  locale: Locale,
  esPath: string,
  enPath: string,
): Metadata['alternates'] {
  const targetPath = locale === 'es' ? esPath : enPath

  return {
    canonical: `${SITE_URL}${targetPath}`,
    languages: {
      es: `${SITE_URL}${esPath}`,
      en: `${SITE_URL}${enPath}`,
      'x-default': `${SITE_URL}${esPath}`,
    },
  }
}
