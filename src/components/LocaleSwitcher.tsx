'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { routing } from '@/i18n/routing'
import { normalizeServiceHref } from '@/lib/service-slugs'

/**
 * Preserves the current path when switching locale, consistent with
 * routing.ts's `localePrefix: 'as-needed'` (es is unprefixed, en is
 * prefixed `/en`). Small client component since `usePathname` requires the
 * client boundary — SiteHeader itself stays an async server component.
 *
 * Imports normalizeServiceHref from the pure `service-slugs.ts` module (not
 * `services-data.ts`, which imports the Payload server SDK at module scope
 * and would break this client bundle).
 */
export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname()
  const otherLocale = currentLocale === routing.defaultLocale ? routing.locales.find((l) => l !== currentLocale) : routing.defaultLocale

  if (!otherLocale) return null

  // Strip any existing locale prefix, then rebuild for the target locale.
  const stripped = routing.locales.reduce(
    (path, locale) => (path.startsWith(`/${locale}`) ? path.slice(`/${locale}`.length) || '/' : path),
    pathname,
  )
  const rawTarget = otherLocale === routing.defaultLocale ? stripped : `/${otherLocale}${stripped === '/' ? '' : stripped}`
  // FIX (live bug reported by Juan, 2026-07-13): a naive prefix swap turns
  // `/servicios` into `/en/servicios` (the non-canonical combo) instead of
  // `/en/services`. Correct known Services dual-segment paths; no-op otherwise.
  const target = normalizeServiceHref(rawTarget, otherLocale as 'es' | 'en')

  // POLISH: measured 19x20px on production — under WCAG 2.2 AA's 24x24
  // minimum target size (2.5.8), and it is an isolated control, so the inline
  // exception does not apply. The accessible name was also just the raw code
  // ("en"), which a screen reader announces as a two-letter word with no hint
  // that it switches language.
  const label = otherLocale === 'en' ? 'English' : 'Español'
  const switchTo = currentLocale === 'en' ? `Switch to ${label}` : `Cambiar a ${label}`

  return (
    <Link
      href={target || '/'}
      hrefLang={otherLocale}
      aria-label={switchTo}
      title={switchTo}
      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 text-label uppercase transition-colors duration-fast ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
    >
      {otherLocale}
    </Link>
  )
}
