import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

import { CACHE_TAGS } from '@/lib/cache-tags'

// Import from service-slugs.ts directly (pure module, zero imports), NOT
// from services-data.ts — that module now imports canonical.ts, which
// imports SITE_URL from THIS file, so importing services-data.ts here would
// close a circular-import loop (sitemap-data -> services-data -> canonical
// -> sitemap-data) that broke production's webpack build with a TDZ
// ReferenceError ("Cannot access 'k' before initialization") on /sitemap.xml.
import { SERVICES_INDEX_SLUG, SERVICE_SLUGS } from '@/lib/service-slugs'
import {
  blogCategoryPath,
  blogPostPath,
  resolvePrimaryCategorySlug,
  type CategoryRef,
} from '@/lib/blog-paths'

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
  collection: 'pages' | 'posts' | 'case-studies' | 'authors' | 'websites'
  prefix: string
  hasDrafts: boolean
  group: SitemapEntry['group']
}

// `categories` is deliberately NOT listed here: there is no `/categories`
// section (every URL it used to emit was a hard 404 advertised to Google from
// our own sitemap). Categories are part of the blog now and are emitted as
// `/blog/<category>` by `getCategorySitemapEntries()` below, while
// `next.config.mjs` 301-redirects the legacy `/categories/<slug>` URLs there.
//
// `posts` stays in this table for the doc fetch, but its URL is NOT built by
// the generic `prefix/slug` branch — posts live at `/blog/<category>/<slug>`,
// so the loop special-cases them the same way service pages are special-cased.
const SITEMAP_COLLECTIONS: SitemapCollection[] = [
  { collection: 'pages', prefix: '', hasDrafts: true, group: 'pages' },
  { collection: 'posts', prefix: 'blog', hasDrafts: true, group: 'blog' },
  { collection: 'case-studies', prefix: 'case-studies', hasDrafts: true, group: 'case-studies' },
  { collection: 'authors', prefix: 'authors', hasDrafts: false, group: 'authors' },
  { collection: 'websites', prefix: 'websites', hasDrafts: true, group: 'websites' },
]

export type SitemapLocale = 'es' | 'en'

export type SitemapEntry = {
  url: string
  locale: SitemapLocale
  lastModified: string | Date
  group: 'pages' | 'blog' | 'case-studies' | 'authors' | 'websites'
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
  websites: 'Websites',
}

// Cached at the module level rather than through src/lib/cache.ts's fetchers
// on purpose: this file already imports `@payload-config` directly (see the
// header comment on the circular-import break this file exists to avoid), and
// `cache.ts` is the module that owns that dependency for page/component code.
// Wrapping here keeps this file's import graph exactly as it already was.
//
// `getSitemapEntries` used to run its 5 collection queries in `Promise.all`
// PLUS a 6th sequential one for categories -- up to 6 simultaneous find()
// calls against `DATABASE_URI`, which is the direct (unpooled) connection
// string (required so `payload migrate` gets real prepared statements; see
// payload.config.ts). Measured against production on 2026-08-15:
// `/sitemap.xml` and `/sitemap.html` were both serving 500s with an empty
// urlset, the fallback the route already had wired for exactly this failure
// mode. Sequencing the collection queries and caching the whole result cuts
// both the peak connection count and how often this path runs at all.
const getCachedSitemapEntries = unstable_cache(
  fetchSitemapEntries,
  ['sitemap-entries'],
  {
    // Only `posts`, `case-studies` and `categories` have a collection-wide tag
    // that anything actually calls `revalidateTag` on (see cache-tags.ts).
    // `Pages` only revalidates per-slug (`pages:<slug>`), and Authors/Websites
    // have no cache-tag hooks at all — including `CACHE_TAGS.page('*')` or an
    // invented `authors:all`/`websites:all` here would look like real
    // invalidation coverage while doing nothing, since Next's cache tags are
    // exact-string matches, not globs. Freshness for a new Page/Author/Website
    // showing up in the sitemap rests entirely on the `revalidate` below.
    tags: [CACHE_TAGS.posts(), CACHE_TAGS.caseStudies(), CACHE_TAGS.categories()],
    // Longer than the 60s TTL the rest of the cache layer uses: the sitemap is
    // read by crawlers on their own schedule, not by a visitor waiting on a
    // page load, so a slightly stale listing costs nothing while a failed
    // request under DB pressure costs the whole file. A new Page/Author/
    // Website is live on its own URL immediately either way — this only
    // delays how soon the sitemap ADVERTISES it, by at most 15 minutes.
    revalidate: 900,
  },
)

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  return getCachedSitemapEntries()
}

async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getPayload({ config })

  const entriesByCollection: SitemapEntry[][] = []
  for (const { collection, prefix, hasDrafts, group } of SITEMAP_COLLECTIONS) {
    const result = await payload.find({
      collection,
      limit: 0,
      locale: 'all',
      ...(hasDrafts ? { where: { _status: { equals: 'published' } } } : {}),
    })

    entriesByCollection.push(
      result.docs.flatMap((doc) => {
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
        } else if (collection === 'posts') {
          // Posts are nested under their category: /blog/<category>/<slug>
          // (see src/lib/blog-paths.ts). Category slugs are NOT localized, so
          // both locales share the same segment.
          const path = blogPostPath(
            resolvePrimaryCategorySlug((doc as { categories?: CategoryRef[] }).categories),
            doc.slug as string,
          )

          esUrl = `${SITE_URL}${path}`
          enUrl = `${SITE_URL}/en${path}`
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
      }),
    )
  }

  const categoryEntries = await getCategorySitemapEntries(payload)
  const collectionEntries = entriesByCollection.flat()

  return [
    ...collectionEntries,
    ...categoryEntries,
    ...getWebsitesHubEntries(collectionEntries),
  ]
}

/**
 * SEO-11.1: `/websites` responde 200 y esta indexada, pero nunca estuvo en el
 * sitemap. No es un doc de `pages` como `/blog` o `/servicios` — es una ruta
 * escrita a mano que lista la coleccion `websites`, asi que ninguna query de
 * `SITEMAP_COLLECTIONS` la podia emitir. El sitemap listaba las 6 hijas y se
 * saltaba el hub.
 *
 * `lastModified` sale del hijo modificado mas recientemente, que es lo que de
 * verdad cambia el contenido del hub. Si no hay ninguno publicado, el hub
 * queda fuera del sitemap: una pagina de indice vacia no merece que la
 * anunciemos.
 */
function getWebsitesHubEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const children = entries.filter((entry) => entry.group === 'websites')
  if (children.length === 0) return []

  const lastModified = children
    .map((entry) => new Date(entry.lastModified).getTime())
    .reduce((newest, current) => (current > newest ? current : newest), 0)

  const alternates = { es: `${SITE_URL}/websites`, en: `${SITE_URL}/en/websites` }

  return [
    { url: alternates.es, locale: 'es', lastModified: new Date(lastModified), group: 'websites', alternates },
    { url: alternates.en, locale: 'en', lastModified: new Date(lastModified), group: 'websites', alternates },
  ]
}

/**
 * Category listings (`/blog/<category>`). They are real, indexable pages with
 * their own title and description, so they belong in the sitemap — but under
 * the `blog` group, not a `categories` section, because `/categories` does not
 * exist (see the note on SITEMAP_COLLECTIONS).
 *
 * Categories have no draft state, and their `slug` is not localized, so both
 * locale variants share one segment.
 */
async function getCategorySitemapEntries(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<SitemapEntry[]> {
  const { docs } = await payload.find({
    collection: 'categories',
    limit: 0,
    locale: 'all',
  })

  return docs.flatMap((doc) => {
    if (!doc.slug) return []

    const path = blogCategoryPath(doc.slug)
    const esUrl = `${SITE_URL}${path}`
    const enUrl = `${SITE_URL}/en${path}`
    const alternates = { es: esUrl, en: enUrl }

    return (
      [
        { locale: 'es', url: esUrl },
        { locale: 'en', url: enUrl },
      ] satisfies Array<{ locale: SitemapLocale; url: string }>
    ).map(
      ({ locale, url }) =>
        ({
          url,
          locale,
          lastModified: doc.updatedAt,
          group: 'blog',
          alternates,
        }) satisfies SitemapEntry,
    )
  })
}
