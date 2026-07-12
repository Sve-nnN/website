/**
 * One-off data-quality fix: the Header global's `navItems[].link.label`
 * is empty in the ES locale (confirmed live on the ES homepage — nav
 * renders with no text). Same bilingual-array-clobbering pattern already
 * fixed in Phases 5/13/14/15 (Footer). The EN write that happened after
 * scripts/seed-header-footer-content.ts's original ES write orphaned the
 * ES labels because Payload full-replaces localized arrays on update.
 *
 * Restores the exact ES labels already written in
 * scripts/seed-header-footer-content.ts (not invented), preserving each
 * item's existing `id` so the array isn't re-orphaned.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/fix-header-navitems-es-labels.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

// Kept as a superset-compatible copy of the label map in
// scripts/seed-phase15-sitemap-footer-link.ts's LINK_LABEL_ES (WR-08) — the
// footer script additionally covers `/search`, which this header script
// intentionally omits because `/search` is not (yet) a header nav item.
// Any nav item whose URL isn't found here now logs a warning instead of
// silently leaving a blank ES label (WR-08).
const ES_LABELS_BY_URL: Record<string, string> = {
  '/blog': 'Blog',
  '/case-studies': 'Casos de éxito',
  '/authors': 'Autores',
  '/contact': 'Contacto',
  '/search': 'Buscar',
}

async function run() {
  const payload = await getPayload({ config })

  const header = await payload.findGlobal({ slug: 'header', locale: 'es' })
  const navItems = header.navItems ?? []

  console.log(
    'Current ES navItems:',
    navItems.map((item) => ({ url: item.link?.url, label: item.link?.label })),
  )

  const fixed = navItems.map((item) => {
    // Only `type: 'custom'` link items populate `url` — internal
    // `type: 'reference'` items (the field's default) do not, and matching
    // on `url` alone would silently no-op for those without warning (WR-06).
    if (item.link?.type !== 'custom') {
      console.warn(
        `Skipping nav item with link.type=${String(item.link?.type)} (not 'custom') — cannot match by URL:`,
        { label: item.link?.label },
      )
      return item
    }

    const url = item.link?.url
    const expectedLabel = url ? ES_LABELS_BY_URL[url] : undefined

    if (!expectedLabel) {
      if (!item.link?.label) {
        console.warn(`No ES label mapping found for nav item URL "${url}" — leaving label as-is.`)
      }
      return item
    }

    if (item.link?.label) return item

    return {
      ...item,
      link: { ...item.link, label: expectedLabel },
    }
  })

  await payload.updateGlobal({
    slug: 'header',
    locale: 'es',
    data: { navItems: fixed },
  })

  const verify = await payload.findGlobal({ slug: 'header', locale: 'es' })
  console.log(
    'Verify ES navItems:',
    verify.navItems?.map((item) => ({ url: item.link?.url, label: item.link?.label })),
  )
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
