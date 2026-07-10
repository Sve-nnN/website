/**
 * @payloadcms/plugin-search only syncs documents going forward via its
 * afterChange hook — it does not backfill existing docs retroactively. This
 * one-off script re-saves every existing posts/case-studies/authors doc
 * (no-op `payload.update` with the doc's own id) to trigger that hook for
 * all real migrated content. Safe/idempotent to re-run.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/reindex-search.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const COLLECTIONS = ['posts', 'case-studies', 'authors'] as const

async function main() {
  const payload = await getPayload({ config })

  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({ collection, limit: 500, depth: 0 })

    for (const doc of docs) {
      await payload.update({
        collection,
        id: doc.id,
        data: {},
      })
    }

    console.log(`Reindexed ${docs.length} ${collection} docs.`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
