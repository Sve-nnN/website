#!/usr/bin/env node
/**
 * Phase 8 close-out smoke check.
 *
 * Curls a representative route per block type against a running `next dev`
 * server and asserts each returns HTTP 200 with no Next.js error-boundary
 * marker in the body. Covers all 16 blocks:
 *   Hero, FeaturedCaseStudiesBlock, ClientLogosBlock, FeaturedPostsBlock,
 *   TestimonialsCarousel, CallToAction, Section (via `/`)
 *   ArchiveBlock (via `/blog`)
 *   Content, RelatedPosts, TableOfContentsBlock, Code, FAQ, MediaBlock (via a discovered blog post)
 *   ResultsSection (via a discovered case study)
 *   ContactFormBlock (via `/contact`)
 *   Content/Section legal pages (via `/privacy`)
 *
 * Run: node scripts/smoke-check-phase8.mjs
 * Requires: `npm run dev` already running on http://localhost:3000
 */

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

// NOTE: "This page could not be found" is intentionally NOT included here —
// Next.js's App Router serializes a reference to the default not-found
// boundary into every route's RSC flight payload (framework internals, not
// an indicator that the requested route itself 404'd). A real 404 response
// is caught by the `status === 200` check below, independent of body text.
const ERROR_MARKERS = [
  'Application error: a client-side exception has occurred',
  '"digest":"NEXT_',
  'A server error has occurred',
  'Internal Server Error',
]

/** @type {{ route: string, blocks: string[] }[]} */
const results = []

async function fetchRoute(path) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url)
  const body = await res.text()
  return { url, status: res.status, body }
}

async function checkRoute(path, blocks) {
  try {
    const { url, status, body } = await fetchRoute(path)
    const foundMarker = ERROR_MARKERS.find((marker) => body.includes(marker))
    const ok = status === 200 && !foundMarker
    results.push({
      route: path,
      url,
      blocks,
      status,
      ok,
      failReason: !ok
        ? status !== 200
          ? `HTTP ${status}`
          : `error marker found: "${foundMarker}"`
        : null,
    })
    return { ok, body }
  } catch (err) {
    results.push({
      route: path,
      url: `${BASE_URL}${path}`,
      blocks,
      status: null,
      ok: false,
      failReason: `fetch failed: ${err.message}`,
    })
    return { ok: false, body: '' }
  }
}

/** Extract the first internal link matching a prefix from an HTML body. */
function discoverFirstLink(body, prefix) {
  const re = new RegExp(`href="(${prefix}/[^"?#]+)"`, 'i')
  const match = body.match(re)
  return match ? match[1] : null
}

async function main() {
  // Home — Hero, FeaturedCaseStudiesBlock, ClientLogosBlock, FeaturedPostsBlock,
  // TestimonialsCarousel, CallToAction, Section
  await checkRoute('/', [
    'Hero',
    'FeaturedCaseStudiesBlock',
    'ClientLogosBlock',
    'FeaturedPostsBlock',
    'TestimonialsCarousel',
    'CallToAction',
    'Section',
  ])

  // Blog index — ArchiveBlock
  const { body: blogBody } = await checkRoute('/blog', ['ArchiveBlock'])

  // Blog post detail — Content, RelatedPosts, TableOfContentsBlock, Code, FAQ, MediaBlock
  const postLink = discoverFirstLink(blogBody, '/blog')
  if (postLink) {
    await checkRoute(postLink, [
      'Content',
      'RelatedPosts',
      'TableOfContentsBlock',
      'Code',
      'FAQ',
      'MediaBlock',
    ])
  } else {
    results.push({
      route: '/blog/{discovered}',
      url: null,
      blocks: ['Content', 'RelatedPosts', 'TableOfContentsBlock', 'Code', 'FAQ', 'MediaBlock'],
      status: null,
      ok: false,
      failReason: 'no post link discovered on /blog — is scripts/seed-blog-page.ts seeded?',
    })
  }

  // Case study index -> detail — ResultsSection
  // NOTE: as of Phase 4's migration, the real production DB has 0 CaseStudies
  // (confirmed by Juan, see .planning/STATE.md decisions log) — this is a
  // known, accepted content-population gap, not a code defect introduced by
  // this phase. If the index itself 200s but no detail link exists, this is
  // reported as SKIP (unverifiable pending real content) rather than FAIL.
  const { body: caseStudiesBody, ok: indexOk } = await checkRoute('/case-studies', [])
  const caseStudyLink = discoverFirstLink(caseStudiesBody, '/case-studies')
  if (caseStudyLink) {
    await checkRoute(caseStudyLink, ['ResultsSection'])
  } else if (indexOk) {
    results.push({
      route: '/case-studies/{discovered}',
      url: null,
      blocks: ['ResultsSection'],
      status: null,
      ok: 'skip',
      failReason:
        'SKIP: no case-study documents exist in the DB (known Phase 4 content gap, index route itself renders fine)',
    })
  } else {
    results.push({
      route: '/case-studies/{discovered}',
      url: null,
      blocks: ['ResultsSection'],
      status: null,
      ok: false,
      failReason: 'case-studies index route itself failed to render',
    })
  }

  // Contact — ContactFormBlock
  await checkRoute('/contact', ['ContactFormBlock'])

  // Legal — Content/Section
  await checkRoute('/privacy', ['Content', 'Section (legal)'])

  // --- Report ---
  const relevant = results.filter((r) => r.route !== '/case-studies')
  const hardFail = relevant.some((r) => r.ok === false)
  const skipped = relevant.filter((r) => r.ok === 'skip')

  console.log('\nPhase 8 smoke check — block render pass table\n')
  console.log('Route'.padEnd(28), 'Status'.padEnd(8), 'Result'.padEnd(6), 'Blocks')
  console.log('-'.repeat(90))
  for (const r of relevant) {
    const label = r.ok === true ? 'PASS' : r.ok === 'skip' ? 'SKIP' : 'FAIL'
    console.log(
      r.route.padEnd(28),
      String(r.status ?? '-').padEnd(8),
      label.padEnd(6),
      r.blocks.join(', ') || '(index page)'
    )
    if (r.ok !== true) console.log('  -> ', r.failReason)
  }
  console.log('-'.repeat(90))
  console.log(
    hardFail
      ? 'SMOKE CHECK FAILED'
      : `ALL VERIFIABLE CHECKS PASSED${skipped.length ? ` (${skipped.length} block skipped — known content gap, see reason above)` : ' (16 blocks covered)'}`
  )

  process.exit(hardFail ? 1 : 0)
}

main()
