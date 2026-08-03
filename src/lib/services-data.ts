import { getPayload } from 'payload'

import config from '@payload-config'
import { buildServiceAlternates } from '@/lib/canonical'
import { buildOpenGraph } from '@/lib/og-image'
import { getCachedPageBySlug } from '@/lib/cache'

// Pure slug/URL logic (safe for Client Components) lives in service-slugs.ts
// — re-exported here so existing importers of this module are unaffected.
export {
  SERVICES_INDEX_SLUG,
  SERVICE_SLUGS,
  isServiceSlug,
  normalizeServiceHref,
  type ServiceSlug,
} from '@/lib/service-slugs'
import { SERVICES_INDEX_SLUG, isServiceSlug } from '@/lib/service-slugs'

export async function getServicesIndexPage(locale: 'es' | 'en') {
  // 43-02: delegates to the shared cache fetcher built in 43-01
  // (`getCachedPageBySlug`) — preserves the exact `depth:1`/
  // `overrideAccess:false` this query already had (Phase 24 WR-02).
  return getCachedPageBySlug(SERVICES_INDEX_SLUG, locale, 1)
}

// Shared generateMetadata body for the Servicios index — called identically
// from both physical route twins (/services + /servicios) so the OG-wiring
// added in Phase 41 (41-REVIEW WR-03) can never drift between them.
export async function getServicesIndexMetadata(locale: 'es' | 'en') {
  const doc = await getServicesIndexPage(locale)

  const title = doc?.meta?.title ?? doc?.title ?? (locale === 'es' ? 'Servicios' : 'Services')
  const description = doc?.meta?.description ?? ''

  return {
    title,
    description,
    alternates: buildServiceAlternates(locale),
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'es' ? '/servicios' : '/en/services',
      locale,
      slug: 'servicios',
      metaImage: doc?.meta?.image,
    }),
  }
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
    // SECURITY (24-REVIEW WR-02): see getServicesIndexPage — without this,
    // a draft page would still leak publicly (this fn backs both the
    // /servicios/[slug] route and, since Phase 24, Home's ServicesShowcase cards).
    overrideAccess: false,
  })
  return docs[0]
}

// Shared generateMetadata body for a single service landing — called
// identically from both physical route twins (/services/[slug] +
// /servicios/[slug]) so the OG-wiring added in Phase 41 (41-REVIEW WR-03)
// can never drift between them. Returns `{}` (empty metadata) when the doc
// doesn't resolve, matching each route's existing not-found behavior.
export async function getServiceMetadata(locale: 'es' | 'en', slug: string) {
  const doc = await getServicePage(locale, slug)

  if (!doc) {
    return {}
  }

  const title = doc.meta?.title ?? doc.title
  const description = doc.meta?.description ?? ''
  const resolvedSlug = doc.slug ?? slug

  return {
    title,
    description,
    alternates: buildServiceAlternates(locale, { slug: resolvedSlug }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'es' ? `/servicios/${resolvedSlug}` : `/en/services/${resolvedSlug}`,
      locale,
      slug: resolvedSlug,
      metaImage: doc.meta?.image,
    }),
  }
}
