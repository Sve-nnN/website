/**
 * One-off data-quality fix: scripts/seed-phase21-home-optimization.ts's
 * addServicesNavLink had a bug — when building the `en`-locale write, it
 * fetched the header's navItems (which already included the row created by
 * the `es` write, since `navItems` itself is a shared, non-localized array)
 * WITHOUT filtering that row out before re-appending its own corrected
 * version. The result was two objects sharing the same `id` in one write;
 * Payload kept the fallback-locale label ("Servicios") instead of the
 * explicit `en` label ("Services") passed in the appended entry.
 *
 * This script corrects ONLY that one item's `en`-locale label, preserving
 * every other item's id/label/url untouched (same non-destructive,
 * id-preserving pattern as scripts/fix-header-navitems-es-labels.ts).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/fix-phase21-services-nav-label-en.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })

  const header = await payload.findGlobal({ slug: 'header', locale: 'en' })
  const navItems = header.navItems ?? []

  console.log(
    'Current EN navItems:',
    navItems.map((item) => ({ id: item.id, url: item.link?.url, label: item.link?.label })),
  )

  let changed = false
  const fixed = navItems.map((item) => {
    if (item.link?.url === '/services' && item.link?.label !== 'Services') {
      changed = true
      return { ...item, link: { ...item.link, label: 'Services' } }
    }
    return item
  })

  if (!changed) {
    console.log('No fix needed — /services nav item already has the correct EN label.')
    process.exit(0)
  }

  await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    data: { navItems: fixed },
  })

  const verify = await payload.findGlobal({ slug: 'header', locale: 'en' })
  console.log(
    'Verify EN navItems:',
    verify.navItems?.map((item) => ({ id: item.id, url: item.link?.url, label: item.link?.label })),
  )
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
