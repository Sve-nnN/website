/**
 * Fires N concurrent payload.find() queries (N = POOL_TEST_CONCURRENCY, default
 * 10) spread across 4 real collections, against the real Neon DB, using the
 * pool config currently set in src/payload.config.ts. Reports how many
 * resolved OK vs how many failed with a connection error.
 *
 * Used both as a baseline (default pool, no explicit max) and, after Plan
 * 06-02 Task 3 sets pool.max explicitly, as the re-verification run with
 * POOL_TEST_CONCURRENCY set equal to that max.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-db-pool.ts
 *   POOL_TEST_CONCURRENCY=5 node --env-file=.env node_modules/.bin/tsx scripts/verify-db-pool.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const CONCURRENCY = Number(process.env.POOL_TEST_CONCURRENCY ?? 10)
const COLLECTIONS = ['pages', 'posts', 'authors', 'case-studies'] as const

async function main() {
  const payload = await getPayload({ config })

  console.log(`Firing ${CONCURRENCY} concurrent queries across [${COLLECTIONS.join(', ')}]...`)

  const jobs = Array.from({ length: CONCURRENCY }, (_, i) => {
    const collection = COLLECTIONS[i % COLLECTIONS.length]
    return payload
      .find({ collection, limit: 1, depth: 0 })
      .then(() => ({ i, collection, ok: true as const }))
      .catch((err) => ({ i, collection, ok: false as const, error: String(err?.message ?? err) }))
  })

  const results = await Promise.allSettled(jobs)

  let succeeded = 0
  let failed = 0

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.ok) {
      succeeded += 1
    } else {
      failed += 1
      const detail =
        result.status === 'fulfilled'
          ? `[${result.value.collection}] ${('error' in result.value && result.value.error) || 'unknown error'}`
          : String(result.reason)
      console.error(`  FAILED job: ${detail}`)
    }
  }

  console.log(`\n${succeeded}/${CONCURRENCY} queries succeeded (concurrency=${CONCURRENCY})`)

  if (failed > 0) {
    console.error(`${failed} queries failed — see details above.`)
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
