import { getPayload } from 'payload'

import config from '@/payload.config'
import { SiteHeaderChrome } from '@/components/SiteHeaderChrome'
import { normalizeServiceHref } from '@/lib/service-slugs'

export async function SiteHeader({ locale }: { locale: string }) {
  const payload = await getPayload({ config })

  const header = await payload.findGlobal({
    slug: 'header',
    depth: 1,
    locale: locale as 'en' | 'es',
  })

  const logo = typeof header.logo === 'object' ? header.logo : null

  // FIX (live bug reported by Juan, 2026-07-13): Header.navItems is a
  // non-localized array field — a stored url like `/services` renders
  // identically on both locales instead of `/servicios` on es. Correct it
  // here at render time rather than the stored data, same rationale as
  // canonical.ts/breadcrumbs.ts (locale-derived, not folder/content-derived).
  const navItems = (header.navItems ?? []).map((item) => ({
    ...item,
    link: item.link?.url
      ? { ...item.link, url: normalizeServiceHref(item.link.url, locale as 'es' | 'en') }
      : item.link,
  }))

  return (
    <SiteHeaderChrome
      navItems={navItems}
      ctaButton={header.ctaButton ?? null}
      logo={logo}
      locale={locale}
    />
  )
}
