/**
 * One-off, guarded cleanup of the 4 known Phase 1/2 test fixtures documented
 * in 04-VERIFICATION.md, which would otherwise appear alongside real migrated
 * content in Phase 5's public listings:
 *
 *   - authors.id=3      name  === 'Test Author X'
 *   - posts.id=1        title === 'test-post' (or slug === 'test-post')
 *   - case_studies.id=1 title === 'test-case-study' (or slug === 'test-case-study')
 *   - redirects.id=1    from  === '/legacy-test-url'
 *
 * Safety guard (T-05-02-01): each delete is gated on id AND an exact
 * title/slug/from match — never a blanket `DELETE WHERE id IN (...)`. If the
 * looked-up document doesn't match the expected fixture identity (e.g. the id
 * was reused for real content), it is skipped and logged, not deleted.
 *
 * Idempotent: running this twice deletes 0 documents the second time, since
 * the guarded lookup will simply not find the fixture anymore.
 *
 * Run with: npx tsx scripts/cleanup-phase1-fixtures.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

type FixtureTarget = {
  collection: 'authors' | 'posts' | 'case-studies' | 'redirects'
  id: number
  matchField: string
  matchValue: string
}

const FIXTURES: FixtureTarget[] = [
  { collection: 'authors', id: 3, matchField: 'name', matchValue: 'Test Author X' },
  { collection: 'posts', id: 1, matchField: 'slug', matchValue: 'test-post' },
  { collection: 'case-studies', id: 1, matchField: 'slug', matchValue: 'test-case-study' },
  { collection: 'redirects', id: 1, matchField: 'from', matchValue: '/legacy-test-url' },
]

async function main() {
  const payload = await getPayload({ config })

  let deleted = 0
  let skipped = 0

  for (const fixture of FIXTURES) {
    try {
      const doc = await payload.findByID({
        collection: fixture.collection,
        id: fixture.id,
        depth: 0,
      })

      const actualValue = (doc as Record<string, unknown>)?.[fixture.matchField]

      if (!doc || actualValue !== fixture.matchValue) {
        console.log(
          `SKIP: ${fixture.collection}.id=${fixture.id} does not match expected ${fixture.matchField}="${fixture.matchValue}" (found: ${String(actualValue)}) — not deleting.`,
        )
        skipped += 1
        continue
      }

      await payload.delete({
        collection: fixture.collection,
        id: fixture.id,
      })

      console.log(
        `DELETED: ${fixture.collection}.id=${fixture.id} (${fixture.matchField}="${fixture.matchValue}")`,
      )
      deleted += 1
    } catch (err) {
      console.log(
        `SKIP: ${fixture.collection}.id=${fixture.id} not found or already removed (${(err as Error).message})`,
      )
      skipped += 1
    }
  }

  console.log(`\nDone. Deleted: ${deleted}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
