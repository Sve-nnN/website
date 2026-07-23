import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

// Maps a redirects-collection relationTo slug to the public URL base segment
// used to reconstruct a path from a referenced document's slug.
const COLLECTION_BASE_PATH: Record<string, string> = {
  pages: '',
  posts: 'blog',
  'case-studies': 'case-studies',
  authors: 'authors',
  categories: 'categories',
}

// Node.js Route Handler used by src/middleware.ts to resolve the
// `redirects` collection lookup. This lookup is delegated out of middleware
// (see src/middleware.ts comment) because Next's `nodejs` runtime middleware
// is canary-only and unavailable on this project's pinned stable Next line.
// Route Handlers always run on the Node.js runtime by default, so Payload's
// Local API / db-postgres driver work here without restriction.
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from')

  if (!from) {
    return NextResponse.json({ target: null })
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'redirects',
    where: { from: { equals: from } },
    limit: 1,
  })

  const redirectDoc = docs[0]
  let target: string | null = null

  if (redirectDoc) {
    // SECURITY (T-02-01, open-redirect mitigation): the redirect target is
    // resolved EXCLUSIVELY from the admin-authored `redirects` collection doc
    // (doc.to.url or a resolved refDoc.slug) — never from request-controlled
    // input. `from` above is only ever used as an equality lookup key against
    // admin-authored data, never echoed back as (or used to build) the
    // redirect target itself.
    if (redirectDoc.to?.type === 'custom') {
      target = redirectDoc.to.url ?? null
    } else if (redirectDoc.to?.type === 'reference' && redirectDoc.to.reference) {
      const { relationTo, value } = redirectDoc.to.reference
      const id = typeof value === 'object' && value !== null ? value.id : value
      const refDoc = await payload.findByID({
        collection: relationTo as 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories',
        id,
      })
      const base = COLLECTION_BASE_PATH[relationTo] ?? ''
      const refSlug = (refDoc as { slug?: string })?.slug

      if (refSlug) {
        target =
          base === '' && refSlug === 'home' ? '/' : `/${[base, refSlug].filter(Boolean).join('/')}`
      }
    }
  }

  return NextResponse.json({ target })
}
