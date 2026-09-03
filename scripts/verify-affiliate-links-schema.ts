/**
 * Phase 46 Plan 01, Task 1 — round-trip verification for the `affiliate-links`
 * schema. SC-3 requires the collection to close this plan with COUNT(*) = 0:
 * this script creates exactly ONE test document, updates it in the other
 * locale, reads both locales back, deletes it, and confirms the count
 * returns to zero both before and after.
 *
 * Explicit process.exit() calls throughout (not just process.exitCode): the
 * postgres pool's keep-alive sockets otherwise leave the process hanging
 * indefinitely after main() resolves, same convention already used by
 * scripts/db/04-which-database.ts and scripts/humanize-legal-pages.ts.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-links-schema.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const countBefore = await payload.count({ collection: 'affiliate-links' })
  if (countBefore.totalDocs !== 0) {
    console.log(`FAIL: count antes de la prueba es ${countBefore.totalDocs}, esperado 0`)
    process.exit(1)
  }

  const created = await payload.create({
    collection: 'affiliate-links',
    locale: 'es',
    data: {
      name: '__verify-schema-46-01',
      slug: '__verify-schema-46-01',
      program: 'amazon',
      destinations: [
        { marketplace: 'us', url: 'https://amazon.com/dp/B0EXAMPLE?tag=juantech02-20' },
        { marketplace: 'default', url: 'https://example.com' },
      ],
      cookieWindowDays: 24,
      commissionNote: 'nota interna es',
      active: true,
      placement: 'stack-page',
      order: 1,
      tagline: 'tagline es',
      whyIUseIt: 'por qué lo uso es',
      disclosureOverride: 'disclosure es',
      ctaLabel: 'cta es',
    },
  })

  await payload.update({
    collection: 'affiliate-links',
    id: created.id,
    locale: 'en',
    data: {
      tagline: 'tagline en',
      whyIUseIt: 'why I use it en',
      disclosureOverride: 'disclosure en',
      ctaLabel: 'cta en',
    },
  })

  const es = await payload.findByID({ collection: 'affiliate-links', id: created.id, locale: 'es' })
  const en = await payload.findByID({ collection: 'affiliate-links', id: created.id, locale: 'en' })

  const nonLocalizedFields: (keyof typeof es)[] = [
    'name',
    'slug',
    'program',
    'cookieWindowDays',
    'commissionNote',
    'active',
    'placement',
    'order',
  ]

  for (const field of nonLocalizedFields) {
    if (JSON.stringify(es[field]) !== JSON.stringify(en[field])) {
      console.log(
        `FAIL: campo no localizado "${field}" difiere entre locales (es=${JSON.stringify(es[field])}, en=${JSON.stringify(en[field])})`,
      )
      await payload.delete({ collection: 'affiliate-links', id: created.id })
      process.exit(1)
    }
  }

  if (JSON.stringify(es.destinations) !== JSON.stringify(en.destinations)) {
    console.log('FAIL: destinations difiere entre locales (debería ser idéntico, no localizado)')
    await payload.delete({ collection: 'affiliate-links', id: created.id })
    process.exit(1)
  }

  const localizedFields: (keyof typeof es)[] = ['tagline', 'whyIUseIt', 'disclosureOverride', 'ctaLabel']

  for (const field of localizedFields) {
    if (es[field] === en[field]) {
      console.log(`FAIL: campo localizado "${field}" es idéntico en ambos locales (es=${es[field]})`)
      await payload.delete({ collection: 'affiliate-links', id: created.id })
      process.exit(1)
    }
    if (!String(es[field] ?? '').includes(' es') || !String(en[field] ?? '').includes(' en')) {
      console.log(`FAIL: campo localizado "${field}" no contiene el sufijo de idioma esperado`)
      await payload.delete({ collection: 'affiliate-links', id: created.id })
      process.exit(1)
    }
  }

  await payload.delete({ collection: 'affiliate-links', id: created.id })

  const countAfter = await payload.count({ collection: 'affiliate-links' })
  if (countAfter.totalDocs !== 0) {
    console.log(`FAIL: count después de la prueba es ${countAfter.totalDocs}, esperado 0`)
    process.exit(1)
  }

  console.log('PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
