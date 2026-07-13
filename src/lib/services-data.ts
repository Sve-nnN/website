import { getPayload } from 'payload'

import config from '@payload-config'

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
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SERVICES_INDEX_SLUG } },
    locale,
    depth: 1,
    limit: 1,
    // SECURITY (24-REVIEW WR-02): Local API bypasses collection `access`
    // rules by default. Without this, an unpublished draft would still be
    // returned and rendered publicly (both on its own route and, since
    // Phase 24, as a clickable card on Home) despite `read: authenticatedOrPublished`.
    overrideAccess: false,
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
    // SECURITY (24-REVIEW WR-02): see getServicesIndexPage — without this,
    // a draft page would still leak publicly (this fn backs both the
    // /servicios/[slug] route and, since Phase 24, Home's ServicesShowcase cards).
    overrideAccess: false,
  })
  return docs[0]
}
