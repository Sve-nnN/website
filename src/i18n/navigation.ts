import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/**
 * Locale-aware navigation APIs for the public site.
 *
 * WHY THIS MODULE EXISTS — the actual mechanism, not the folklore:
 * `routing.ts` uses `localePrefix: 'as-needed'` with `defaultLocale: 'es'`, so
 * an unprefixed path IS the Spanish URL. The next-intl middleware only rewrites
 * INCOMING requests; nothing rewrites an OUTGOING href. A plain
 * `<Link href="/blog/x">` rendered on an `/en` page therefore navigates the
 * reader straight into Spanish content — verified against production: with
 * `Cookie: NEXT_LOCALE=en`, `/blog/development/react-19` returns 200 and
 * `<html lang="es">`. There is no fallback path; the prefix has to be added at
 * render time.
 *
 * That is what this module does. `Link` below reads the active locale (supplied
 * by the `NextIntlClientProvider` that wraps the whole frontend tree in
 * `src/app/(frontend)/[locale]/layout.tsx`) and prefixes internal hrefs
 * accordingly — `/en/...` on English pages, unprefixed on the default Spanish
 * locale. It is the only correct import for an internal `<Link>`.
 *
 * It consumes the SAME `routing` object the middleware consumes — never
 * re-declare locales or `localePrefix` here, or the two will drift.
 *
 * Do NOT use it for hrefs that already carry a locale segment (breadcrumb trail
 * urls from `src/lib/breadcrumbs.ts` are already prefixed) or for external URLs
 * — see `isPrefixableHref` below for the guard used on admin-authored values.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)

/**
 * True only when `href` is an app-internal path that next-intl should prefix.
 *
 * Returns false for: absolute URLs (`https://…`), protocol-relative URLs
 * (`//evil.com`), scheme links (`mailto:`, `tel:`), bare fragments (`#contact`),
 * relative paths, and paths an editor already prefixed by hand (`/en/contact`).
 *
 * This exists because next-intl's own internal localizable-href check is an
 * implementation detail, while the hrefs flowing through `CMSLink` and the
 * Header global come from the admin panel, where any of those shapes is
 * possible. Because it only ever rewrites hrefs starting with a single slash,
 * it can never turn an external URL into a same-origin one (or the reverse).
 */
export function isPrefixableHref(href: string): boolean {
  if (typeof href !== 'string') return false

  // Must be a root-relative path, and not protocol-relative (`//host`).
  if (!href.startsWith('/')) return false
  if (href.startsWith('//')) return false

  // Already locale-prefixed by hand? Match the WHOLE segment, so a slug that
  // merely starts with those two letters (`/entrevistas`) is not mistaken for
  // the `/en` prefix.
  const firstSegment = href.slice(1).split(/[/?#]/)[0]
  if ((routing.locales as readonly string[]).includes(firstSegment)) return false

  return true
}
