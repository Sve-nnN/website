/**
 * Idempotent backfill: sets `author` on every CaseStudies doc missing it to
 * the single real Author doc (Phase 4 confirms exactly 1 author exists).
 * Real Postgres has 0 case studies today (04-VERIFICATION.md) — this script
 * is a no-op until Juan authors real case studies, at which point it (or the
 * admin UI directly) ensures the byline always has an author.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/backfill-case-study-author.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const { docs: authors } = await payload.find({ collection: 'authors', limit: 1 })
  const author = authors[0]

  if (!author) {
    console.log('No Author doc found — nothing to backfill against. Aborting.')
    process.exit(1)
  }

  const { docs: caseStudies } = await payload.find({
    collection: 'case-studies',
    limit: 200,
    depth: 0,
  })

  let updated = 0

  for (const cs of caseStudies) {
    if (cs.author) continue

    await payload.update({
      collection: 'case-studies',
      id: cs.id,
      data: { author: author.id },
    })
    updated += 1
    console.log(`Backfilled author on case-studies.id=${cs.id}`)
  }

  console.log(`Done. ${caseStudies.length} case studies checked, ${updated} backfilled.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
