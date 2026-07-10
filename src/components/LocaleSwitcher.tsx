'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { routing } from '@/i18n/routing'

/**
 * Preserves the current path when switching locale, consistent with
 * routing.ts's `localePrefix: 'as-needed'` (es is unprefixed, en is
 * prefixed `/en`). Small client component since `usePathname` requires the
 * client boundary — SiteHeader itself stays an async server component.
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
  const target = otherLocale === routing.defaultLocale ? stripped : `/${otherLocale}${stripped === '/' ? '' : stripped}`

  return (
    <Link href={target || '/'} className="text-label uppercase" hrefLang={otherLocale}>
      {otherLocale}
    </Link>
  )
}
