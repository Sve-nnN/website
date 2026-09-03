/**
 * Phase 46 Plan 01, Task 2 — verifies the query behind getCachedAffiliateLinks()
 * redacts internal fields for anonymous reads and pickDestination() resolves
 * correctly (with fallback). Creates exactly ONE test document and deletes
 * it at the end (in a `finally`, so it's cleaned up on ANY failure path too),
 * confirming COUNT(*) = 0 again — same SC-3 discipline as Task 1's schema
 * verify script.
 *
 * DEVIATION (Rule 3, discovered during execution): getCachedAffiliateLinks()
 * wraps its query in Next's `unstable_cache`, which throws
 * `Invariant: incrementalCache missing` when called outside a real Next
 * request context (a Route Handler / Server Component render) — the same
 * class of "needs Next's runtime" limitation 46-RESEARCH.md's Open Question 1
 * already documented for `getTranslations`/next-intl in Plan 46-02. A plain
 * `tsx` process has no such context. This script therefore calls
 * `payload.find({ collection: 'affiliate-links', locale, limit: 100,
 * overrideAccess: false })` directly — the EXACT query
 * getCachedAffiliateLinks() runs internally, `unstable_cache` is only a
 * memoization wrapper around it — so the field-access redaction behavior
 * under test (T-46-01) is verified faithfully. The wrapper itself can only be
 * exercised end-to-end from inside the running Next app (e.g. a real page
 * consuming it in Phase 48), not from a standalone script.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-links-cache.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { pickDestination } from '../src/lib/affiliate'

async function main() {
  const payload = await getPayload({ config })
  const failures: string[] = []
  let createdId: number | undefined

  try {
    const created = await payload.create({
      collection: 'affiliate-links',
      locale: 'es',
      data: {
        name: '__verify-cache-46-01',
        slug: '__verify-cache-46-01',
        program: 'amazon',
        active: true,
        cookieWindowDays: 30,
        commissionNote: 'test interno',
        destinations: [
          { marketplace: 'us', url: 'https://amazon.com/dp/B0EXAMPLE?tag=juantech02-20' },
          { marketplace: 'default', url: 'https://example.com' },
        ],
      },
    })
    createdId = created.id

    const { docs } = await payload.find({
      collection: 'affiliate-links',
      locale: 'es',
      limit: 100,
      overrideAccess: false,
    })
    const doc = docs.find((d) => d.id === created.id)

    if (!doc) {
      failures.push('el doc de prueba no aparece en la lectura pública (overrideAccess: false)')
    } else {
      if (doc.cookieWindowDays !== undefined && doc.cookieWindowDays !== null) {
        failures.push(`cookieWindowDays visible sin usuario autenticado (valor: ${doc.cookieWindowDays})`)
      }
      if (doc.commissionNote !== undefined && doc.commissionNote !== null) {
        failures.push(`commissionNote visible sin usuario autenticado (valor: ${doc.commissionNote})`)
      }

      const destinations = doc.destinations ?? []
      const resolvedUs = pickDestination(destinations, 'us')
      if (resolvedUs?.url !== 'https://amazon.com/dp/B0EXAMPLE?tag=juantech02-20') {
        failures.push(`pickDestination('us') no devolvió la URL de Amazon esperada (${resolvedUs?.url})`)
      }

      const resolvedFallback = pickDestination(destinations, 'inexistente')
      if (resolvedFallback?.marketplace !== 'us') {
        failures.push(
          `pickDestination() con marketplace inexistente no cayó al primer elemento (${resolvedFallback?.marketplace})`,
        )
      }
    }
  } finally {
    if (createdId !== undefined) {
      await payload.delete({ collection: 'affiliate-links', id: createdId })
    }
  }

  const countAfter = await payload.count({ collection: 'affiliate-links' })
  if (countAfter.totalDocs !== 0) {
    failures.push(`count después de la prueba es ${countAfter.totalDocs}, esperado 0`)
  }

  if (failures.length > 0) {
    console.log(`FAIL: ${failures.join(' | ')}`)
    process.exit(1)
  }

  console.log('PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
