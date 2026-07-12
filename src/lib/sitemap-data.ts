import { getPayload } from 'payload'
import config from '@payload-config'

import { SERVICES_INDEX_SLUG, SERVICE_SLUGS } from '@/lib/services-data'

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL

  if (envUrl) return envUrl

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SERVER_URL must be set in production — refusing to fall back to a hardcoded domain for the sitemap.',
    )
  }

  console.warn(
    '[sitemap-data] NEXT_PUBLIC_SERVER_URL is not set — falling back to https://juancarlosangulo.com. ' +
      'This fallback is intended for local development only; set the env var before deploying.',
  )

  return 'https://juancarlosangulo.com'
}

export const SITE_URL = resolveSiteUrl()

type SitemapCollection = {
  collection: 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories'
  prefix: string
  hasDrafts: boolean
  group: SitemapEntry['group']
}

const SITEMAP_COLLECTIONS: SitemapCollection[] = [
  { collection: 'pages', prefix: '', hasDrafts: true, group: 'pages' },
  { collection: 'posts', prefix: 'blog', hasDrafts: true, group: 'blog' },
  { collection: 'case-studies', prefix: 'case-studies', hasDrafts: true, group: 'case-studies' },
  { collection: 'authors', prefix: 'authors', hasDrafts: false, group: 'authors' },
  { collection: 'categories', prefix: 'categories', hasDrafts: false, group: 'categories' },
]

export type SitemapLocale = 'es' | 'en'

export type SitemapEntry = {
  url: string
  locale: SitemapLocale
  lastModified: string | Date
  group: 'pages' | 'blog' | 'case-studies' | 'authors' | 'categories'
  alternates: { es: string; en: string }
}

export type SitemapGroup = SitemapEntry['group']

// Shared escaping helper for both the XML (sitemap.xml) and HTML
// (sitemap.html) route handlers — the five characters that need escaping
// are identical in both formats, and `&#39;` (numeric entity) is valid in
// both XML and HTML, avoiding drift between two copy-pasted implementations
// (WR-09).
export function escapeMarkupText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const SITEMAP_GROUP_LABELS: Record<SitemapGroup, string> = {
  pages: 'Pages',
  blog: 'Blog',
  'case-studies': 'Case Studies',
  authors: 'Authors',
  categories: 'Categories',
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getPayload({ config })

  const entriesByCollection = await Promise.all(
    SITEMAP_COLLECTIONS.map(async ({ collection, prefix, hasDrafts, group }) => {
      const result = await payload.find({
        collection,
        limit: 0,
        locale: 'all',
        ...(hasDrafts ? { where: { _status: { equals: 'published' } } } : {}),
      })

      return result.docs.flatMap((doc) => {
        // Service pages (index + 4 individual landings) live under
        // /servicios(/slug) (es) and /en/services(/slug) (en) — distinct
        // URL segments per locale, not the generic same-segment path this
        // branch otherwise produces for every other `pages` doc.
        const isServicesIndex = collection === 'pages' && doc.slug === SERVICES_INDEX_SLUG
        const isServiceLanding =
          collection === 'pages' &&
          (SERVICE_SLUGS as readonly string[]).includes(doc.slug as string)

        let esUrl: string
        let enUrl: string

        if (isServicesIndex) {
          esUrl = `${SITE_URL}/servicios`
          enUrl = `${SITE_URL}/en/services`
        } else if (isServiceLanding) {
          esUrl = `${SITE_URL}/servicios/${doc.slug}`
          enUrl = `${SITE_URL}/en/services/${doc.slug}`
        } else {
          const path =
            prefix === '' ? (doc.slug !== 'home' ? doc.slug : '') : `${prefix}/${doc.slug}`

          esUrl = path ? `${SITE_URL}/${path}` : SITE_URL
          enUrl = path ? `${SITE_URL}/en/${path}` : `${SITE_URL}/en`
        }

        const alternates = { es: esUrl, en: enUrl }

        // Emit one <url> entry per locale (not one per doc) so each language
        // variant is independently indexable, per Google's hreflang sitemap
        // guidance — each entry carries the full reciprocal set of alternates.
        const locales: Array<{ locale: SitemapLocale; url: string }> = [
          { locale: 'es', url: esUrl },
          { locale: 'en', url: enUrl },
        ]

        return locales.map(
          ({ locale, url }) =>
            ({
              url,
              locale,
              lastModified: doc.updatedAt,
              group,
              alternates,
            }) satisfies SitemapEntry,
        )
      })
    }),
  )

  return entriesByCollection.flat()
}
