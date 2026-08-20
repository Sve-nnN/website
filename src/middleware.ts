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

  // SEO-11.5: con `localePrefix: 'as-needed'`, next-intl saca el prefijo del
  // locale por defecto con un 307. La regla no es temporal — `/es/...` no va a
  // volver a existir mientras el espanol sea el idioma sin prefijo — y un 307
  // le dice a Google justamente lo contrario. Se responde 308 antes de que el
  // middleware de next-intl vea la request.
  if (pathname === '/es' || pathname.startsWith('/es/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice('/es'.length) || '/'
    return NextResponse.redirect(url, 308)
  }

  // Same-process loopback, NOT `request.url`: behind Traefik (TLS-terminated
  // reverse proxy), Next can reconstruct `request.url` as an `https://`
  // origin pointing at the container's own internal address, and this fetch
  // then tries a TLS handshake against a port that only ever speaks plain
  // HTTP internally -- confirmed at runtime with
  // `ERR_SSL_PACKET_LENGTH_TOO_LONG`. This is a same-origin call to this
  // exact running instance regardless of the public-facing scheme/host, so
  // loopback is both correct and avoids the proxy-header ambiguity entirely.
  const lookupUrl = new URL('/api/redirects-lookup', `http://localhost:${process.env.PORT ?? 3000}`)
  lookupUrl.searchParams.set('from', pathname)

  const lookupResponse = await fetch(lookupUrl)

  if (lookupResponse.ok) {
    const { target } = (await lookupResponse.json()) as { target: string | null }
    if (target) {
      return NextResponse.redirect(new URL(target, request.url), 308)
    }
  }

  return stripIntlAlternateLinks(intlMiddleware(request))
}

// next-intl's middleware advertises hreflang alternates in an HTTP `Link`
// header, derived purely from `routing.localePrefix` — it prefixes the current
// pathname with `/en` and calls that the English URL. That guess is right for
// every template whose slug is identical in both languages (blog, case-studies,
// websites, authors, the local landings) and WRONG for the only template with a
// translated slug: `/servicios` <-> `/en/services`.
//
// On `/servicios` it advertised `hreflang="en" -> /en/servicios`. That URL does
// resolve (both route folders exist under `[locale]`), but its canonical points
// at `/en/services`. So the header sent Google to a page that declares itself
// non-canonical, contradicting the `<head>` annotation on the very same
// response.
//
// The `<head>` is already the complete and correct source: every route builds
// its alternates through `buildAlternates`/`buildServiceAlternates` in
// src/lib/canonical.ts, verified emitting all three `hrefLang` links across 12
// templates in production. Teaching next-intl the slug map (`routing.pathnames`)
// would also work, but it would add a second source of truth for the same fact
// and put the localized-slug table in two places. Deleting the header leaves one
// annotation, which is what Google reads anyway.
//
// Scoped to `Link` entries carrying `rel="alternate"`: any other `Link` value
// (preload hints, for instance) is preserved.
function stripIntlAlternateLinks(response: NextResponse): NextResponse {
  const link = response.headers.get('link')
  if (!link) return response

  const kept = link
    .split(/,\s*(?=<)/)
    .filter((entry) => !/rel="?alternate"?/i.test(entry))
    .join(', ')

  if (kept) {
    response.headers.set('link', kept)
  } else {
    response.headers.delete('link')
  }

  return response
}

export const config = { matcher: ['/', '/((?!api|admin|_next|_vercel|.*\\..*).*)'] }
