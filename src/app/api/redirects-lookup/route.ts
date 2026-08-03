import { NextResponse, type NextRequest } from 'next/server'

import { getCachedRedirectTarget } from '@/lib/cache'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

// Node.js Route Handler used by src/middleware.ts to resolve the
// `redirects` collection lookup. This lookup is delegated out of middleware
// (see src/middleware.ts comment) because Next's `nodejs` runtime middleware
// is canary-only and unavailable on this project's pinned stable Next line.
// Route Handlers always run on the Node.js runtime by default, so Payload's
// Local API / db-postgres driver work here without restriction.
//
// Phase 43 (43-01 Task 2): the actual query + resolution logic now lives in
// getCachedRedirectTarget (src/lib/cache.ts), wrapped in unstable_cache —
// this route middleware call runs on EVERY public request, so caching it
// closes root cause #3 of 43-CONTEXT.md.
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from')

  if (!from) {
    return NextResponse.json({ target: null })
  }

  const target = await getCachedRedirectTarget(from)

  return NextResponse.json({ target })
}
