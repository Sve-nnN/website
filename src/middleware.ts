import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'

import { routing } from './i18n/routing'

// DEVIATION from plan (documented in 02-03-SUMMARY.md, Rule 3 blocking-issue
// fix): the plan called for `export const runtime = 'nodejs'` here so this
// file could call Payload's Local API (`getPayload`) directly for the
// `redirects` collection lookup. That requires Next's `experimental.
// nodeMiddleware` flag, which throws `CanaryOnlyError` on any non-canary
// Next release — and this project is pinned to the stable 15.4.11 line
// because @payloadcms/next@3.85.2's peerDependencies exclude 15.5.x+.
// Upgrading to canary Next to unlock nodejs-runtime middleware was rejected
// (Rule 4 architectural risk: canary is further from Payload's tested range
// than the already-excluded 15.5.x line).
//
// Fix: this middleware stays on the default Edge runtime (next-intl's
// createIntlMiddleware is Edge-safe) and delegates the `redirects`
// collection lookup to a Node.js Route Handler
// (src/app/api/redirects-lookup/route.ts) via a same-origin fetch. Route
// Handlers always run on the Node.js runtime, so Payload's Local API /
// db-postgres driver work there without restriction. All threat
// mitigations (T-02-01: redirect target read only from admin-authored data)
// are preserved — see the route handler for the actual resolution logic.
const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const lookupUrl = new URL('/api/redirects-lookup', request.url)
  lookupUrl.searchParams.set('from', pathname)

  const lookupResponse = await fetch(lookupUrl)

  if (lookupResponse.ok) {
    const { target } = (await lookupResponse.json()) as { target: string | null }
    if (target) {
      return NextResponse.redirect(new URL(target, request.url), 308)
    }
  }

  return intlMiddleware(request)
}

export const config = { matcher: ['/', '/((?!api|admin|_next|_vercel|.*\\..*).*)'] }
