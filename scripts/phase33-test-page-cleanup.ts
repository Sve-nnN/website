/**
 * Phase 33 (LOCAL-01/LOCAL-02) — deletes the throwaway test page created by
 * scripts/phase33-test-page-create.ts. Guarded on an exact slug match
 * (following scripts/cleanup-phase10-eeat-fixtures.ts's pattern) so this
 * never deletes anything but the known fixture.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/phase33-test-page-cleanup.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'phase33-local-landing-test' } },
    limit: 10,
  })

  if (docs.length === 0) {
    console.log('No phase33-local-landing-test page found — nothing to clean up.')
    return
  }

  for (const doc of docs) {
    await payload.delete({ collection: 'pages', id: doc.id })
    console.log(`DELETED: pages.id=${doc.id} (slug="${doc.slug}")`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
