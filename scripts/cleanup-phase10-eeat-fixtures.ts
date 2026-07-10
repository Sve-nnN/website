/**
 * Phase 10 Plan 02 — guarded cleanup of the fixtures created by
 * scripts/seed-phase10-eeat-fixtures.ts, following
 * scripts/cleanup-phase1-fixtures.ts's exact guard pattern: every delete is
 * gated on an exact field-value match (name/title), never a blanket
 * DELETE WHERE or ID-range delete. Also restores FeaturedContent and the
 * home page's FeaturedCaseStudiesBlock limit to their pre-plan values.
 *
 * Idempotent: running this twice deletes 0 documents the second time, since
 * the guarded lookup will simply not find the fixture anymore.
 *
 * Run with: npx tsx scripts/cleanup-phase10-eeat-fixtures.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import config from '../src/payload.config'

const STATE_FILE = path.resolve(process.cwd(), 'scripts/.phase10-fixture-state.json')

async function main() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log(`No state file found at ${STATE_FILE} — nothing to clean up (already run, or seed never ran).`)
    process.exit(0)
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const payload = await getPayload({ config })

  let deleted = 0
  let skipped = 0

  // --- Delete the 6 test CaseStudies (exact title match guard) ---
  for (let i = 0; i < state.caseStudyIds.length; i++) {
    const id = state.caseStudyIds[i]
    const expectedTitle = `Test Case Study Phase 10 Boundary ${i + 1}`
    try {
      const doc = await payload.findByID({ collection: 'case-studies', id, depth: 0 })
      if (!doc || doc.title !== expectedTitle) {
        console.log(
          `SKIP: case-studies.id=${id} does not match expected title="${expectedTitle}" (found: ${String(doc?.title)}) — not deleting.`,
        )
        skipped += 1
        continue
      }
      await payload.delete({ collection: 'case-studies', id })
      console.log(`DELETED: case-studies.id=${id} (title="${expectedTitle}")`)
      deleted += 1
    } catch (err) {
      console.log(`SKIP: case-studies.id=${id} not found or already removed (${(err as Error).message})`)
      skipped += 1
    }
  }

  // --- Delete the 1 test Author (exact name match guard) ---
  {
    const expectedName = 'Test Author E-E-A-T Fixture (Phase 10)'
    try {
      const doc = await payload.findByID({ collection: 'authors', id: state.authorId, depth: 0 })
      if (!doc || doc.name !== expectedName) {
        console.log(
          `SKIP: authors.id=${state.authorId} does not match expected name="${expectedName}" (found: ${String(doc?.name)}) — not deleting.`,
        )
        skipped += 1
      } else {
        await payload.delete({ collection: 'authors', id: state.authorId })
        console.log(`DELETED: authors.id=${state.authorId} (name="${expectedName}")`)
        deleted += 1
      }
    } catch (err) {
      console.log(`SKIP: authors.id=${state.authorId} not found or already removed (${(err as Error).message})`)
      skipped += 1
    }
  }

  // --- Restore FeaturedContent.featuredCaseStudies ---
  const current = await payload.findGlobal({ slug: 'featured-content', depth: 0 })
  const currentIds = (current.featuredCaseStudies ?? []) as number[]
  const stillPointsAtFixtures = currentIds.some((id) => state.caseStudyIds.includes(id))
  if (stillPointsAtFixtures) {
    await payload.updateGlobal({
      slug: 'featured-content',
      data: { featuredCaseStudies: state.originalFeaturedCaseStudies },
    })
    console.log('RESTORED: FeaturedContent.featuredCaseStudies to its pre-plan value')
  } else {
    console.log('FeaturedContent.featuredCaseStudies already restored (no fixture ids present)')
  }

  // --- Confirm / restore the home page's FeaturedCaseStudiesBlock limit ---
  // Surgical single-column update (see verify script for rationale): avoids
  // round-tripping the entire localized content.layout blocks array through
  // the Local API, which risks corrupting unrelated real page content.
  const res = await payload.db.drizzle.execute(
    sql.raw(
      `SELECT "limit" FROM "pages_blocks_featured_case_studies_block" WHERE "_parent_id" = ${state.homePageId} LIMIT 1`,
    ),
  )
  const row = (res as { rows?: Array<{ limit: string }> }).rows?.[0] ?? (res as unknown as Array<{ limit: string }>)[0]
  const currentLimit = row ? Number(row.limit) : null

  if (currentLimit !== state.originalFeaturedCaseStudiesBlockLimit) {
    await payload.db.drizzle.execute(
      sql.raw(
        `UPDATE "pages_blocks_featured_case_studies_block" SET "limit" = ${state.originalFeaturedCaseStudiesBlockLimit} WHERE "_parent_id" = ${state.homePageId}`,
      ),
    )
    console.log(
      `RESTORED: home page FeaturedCaseStudiesBlock.limit ${currentLimit} -> ${state.originalFeaturedCaseStudiesBlockLimit}`,
    )
  } else {
    console.log(
      `FeaturedCaseStudiesBlock.limit already at original value (${state.originalFeaturedCaseStudiesBlockLimit}) — no-op`,
    )
  }

  // --- Remove the state file itself ---
  fs.unlinkSync(STATE_FILE)
  console.log(`Removed state file: ${STATE_FILE}`)

  console.log(`\nDone. Deleted: ${deleted}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
