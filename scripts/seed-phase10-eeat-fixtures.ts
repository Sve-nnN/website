/**
 * Phase 10 Plan 02 — guarded fixture seeding for boundary-condition
 * verification of the card-grid/E-E-A-T styling built in 10-01.
 *
 * Creates, in the real production Postgres (no separate test DB exists for
 * this project):
 *   - 1 test Author: "Test Author E-E-A-T Fixture (Phase 10)" with full
 *     credentials/yearsExperience/socialLinks, to verify AuthorCard's
 *     E-E-A-T prominence styling against fully-populated data (the one real
 *     Author, id=1, still has these fields empty).
 *   - 6 test CaseStudies ("Test Case Study Phase 10 Boundary 1".."6"), to
 *     verify FeaturedCaseStudiesBlock/CaseStudyCard at the schema-declared
 *     repeater min (1) and max (6) boundaries (0 real CaseStudies exist).
 *
 * Also temporarily points FeaturedContent.featuredCaseStudies at the 6 new
 * fixtures (that global is FeaturedCaseStudiesBlock's only data source) and
 * records the home page's original FeaturedCaseStudiesBlock limit — both
 * restored by scripts/cleanup-phase10-eeat-fixtures.ts.
 *
 * All created documents follow an unambiguous "Test ... Phase 10" naming
 * scheme so cleanup can guard every delete on an exact field match, same
 * precedent as scripts/cleanup-phase1-fixtures.ts.
 *
 * Run with: npx tsx scripts/seed-phase10-eeat-fixtures.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const STATE_FILE = path.resolve(process.cwd(), 'scripts/.phase10-fixture-state.json')

async function main() {
  const payload = await getPayload({ config })

  console.log('Creating test Author with full E-E-A-T fields...')
  const author = await payload.create({
    collection: 'authors',
    data: {
      name: 'Test Author E-E-A-T Fixture (Phase 10)',
      slug: 'test-author-phase10-eeat',
      jobTitle: 'Test Role',
      bio: 'Seeded bio for Phase 10 E-E-A-T verification.',
      yearsExperience: 12,
      credentials: [
        { label: 'Certificación Google Analytics' },
        { label: '10+ años en SEO técnico' },
        { label: 'Speaker en conferencias tech' },
      ],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/test-phase10' },
        { platform: 'github', url: 'https://github.com/test-phase10' },
        { platform: 'x', url: 'https://x.com/test_phase10' },
      ],
    },
  })
  console.log(`  Created authors.id=${author.id}`)

  console.log('Creating 6 test CaseStudies (repeater min/max boundary fixtures)...')
  const caseStudyIds: number[] = []
  for (let n = 1; n <= 6; n++) {
    const cs = await payload.create({
      collection: 'case-studies',
      data: {
        title: `Test Case Study Phase 10 Boundary ${n}`,
        slug: `test-case-study-phase10-boundary-${n}`,
        heroMetric: '+42% test metric',
        // Leave client/sector unset on at least 2 of 6 to exercise
        // CaseStudyCard's omitted-field conditional guards.
        ...(n > 4 ? {} : { sector: 'Test Sector' }),
        _status: 'published',
      },
    })
    caseStudyIds.push(cs.id)
    console.log(`  Created case-studies.id=${cs.id} (Boundary ${n})`)
  }

  console.log('Reading current FeaturedContent global...')
  const featuredContent = await payload.findGlobal({ slug: 'featured-content' })
  const originalFeaturedCaseStudies = featuredContent.featuredCaseStudies ?? null

  console.log('Pointing FeaturedContent.featuredCaseStudies at the 6 test fixtures...')
  await payload.updateGlobal({
    slug: 'featured-content',
    data: {
      featuredCaseStudies: caseStudyIds,
    },
  })

  console.log('Reading home page (id=1) FeaturedCaseStudiesBlock original limit...')
  const homePage = await payload.findByID({ collection: 'pages', id: 1 })
  const layout = (homePage.content?.layout ?? []) as Array<Record<string, unknown>>
  const fcsBlock = layout.find((b) => b.blockType === 'featuredCaseStudiesBlock')
  if (!fcsBlock) {
    throw new Error('Home page (id=1) has no featuredCaseStudiesBlock in its layout — cannot proceed.')
  }
  const originalFeaturedCaseStudiesBlockLimit = (fcsBlock.limit as number) ?? 3

  const state = {
    authorId: author.id,
    caseStudyIds,
    originalFeaturedCaseStudies,
    homePageId: 1,
    originalFeaturedCaseStudiesBlockLimit,
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  console.log(`\nState written to ${STATE_FILE}`)
  console.log(JSON.stringify(state, null, 2))

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
