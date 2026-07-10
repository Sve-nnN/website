#!/usr/bin/env node
/**
 * Phase 11 Plan 02 — final ES layout route-level check for the page types
 * Phase 10 did NOT already cover (Phase 10 covered blog post cards/detail
 * specifically). Covers: home, authors list, author detail (real author),
 * case-studies list + detail, blog listing (breadcrumbs, Phase 10.8).
 *
 * Re-run at Phase 11 close-out (post 10.6-10.8): Phase 10.7 seeded a real
 * case study (`migracion-ecommerce-nextjs-seo-tecnico`) with an embedded
 * TestimonialSection, so checks [4]/[5] below now verify real content
 * instead of only the empty-state path this script originally targeted.
 *
 * Pattern-matched after scripts/verify-phase10-cards-eeat.mjs: zero-dependency,
 * fetch()-based, requires `npm run dev` (or a production server) already
 * running (reads SMOKE_BASE_URL/BASE_URL, defaults to http://localhost:3000).
 * Uses Payload's Local API to read the real longest ES content per page type
 * before asserting it renders verbatim server-side.
 *
 * Run: node --env-file=.env --import tsx scripts/verify-es-layout-final.mjs
 * Requires: `npm run dev` (or equivalent) already running
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'

const BASE_URL = process.env.SMOKE_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000'

const ERROR_MARKERS = [
  'Application error: a client-side exception has occurred',
  '"digest":"NEXT_',
  'A server error has occurred',
  'Internal Server Error',
]

/** @type {{ name: string, ok: boolean | 'skip', detail: string }[]} */
const results = []

async function fetchRoute(pathname) {
  const url = `${BASE_URL}${pathname}`
  const res = await fetch(url)
  const body = await res.text()
  return { url, status: res.status, body }
}

function hasErrorMarker(body) {
  return ERROR_MARKERS.find((m) => body.includes(m))
}

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`  ${ok === true ? 'PASS' : ok === 'skip' ? 'SKIP' : 'FAIL'}: ${name} — ${detail}`)
}

async function main() {
  const payload = await getPayload({ config })

  console.log('\nPhase 11 Plan 02 — ES layout final verification\n')

  // --- Home page (/es) ---
  console.log('[1] Home page (/es) — hero title/subtitle + content-block text')
  const homeRes = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale: 'es',
    depth: 0,
    limit: 1,
  })
  const homePage = homeRes.docs[0]
  const heroBlock = homePage?.content?.layout?.find((b) => b.blockType === 'hero')
  const heroTitle = heroBlock?.title ?? ''
  const heroSubtitle = heroBlock?.subtitle ?? ''
  {
    const { status, body } = await fetchRoute('/es')
    const titleFound = heroTitle.length > 0 && body.includes(heroTitle)
    const subtitleFound = heroSubtitle.length > 0 && body.includes(heroSubtitle)
    record(
      'home-es',
      status === 200 && !hasErrorMarker(body) && titleFound && subtitleFound,
      `HTTP ${status}, hero title (${heroTitle.length} chars) found: ${titleFound}, subtitle (${heroSubtitle.length} chars) found: ${subtitleFound}`,
    )
  }

  // --- Authors list (/es/authors) ---
  console.log('[2] Authors list (/es/authors)')
  const authors = await payload.find({ collection: 'authors', locale: 'es', depth: 0, limit: 50 })
  {
    const { status, body } = await fetchRoute('/es/authors')
    const namesFound = authors.docs.every((a) => body.includes(a.name))
    record(
      'authors-list-es',
      status === 200 && !hasErrorMarker(body) && namesFound,
      `HTTP ${status}, totalDocs=${authors.totalDocs}, all real author names found: ${namesFound}`,
    )
  }

  // --- Author detail (/es/authors/{real-slug}) — the one real author (id=1) ---
  console.log('[3] Author detail (/es/authors/{real-slug}) — real bio content')
  const realAuthor = authors.docs[0]
  if (!realAuthor) {
    record('author-detail-es', 'skip', 'no real author found — cannot verify')
  } else {
    const { status, body } = await fetchRoute(`/es/authors/${realAuthor.slug}`)
    const bio = realAuthor.bio ?? ''
    const bioFound = bio.length > 0 && body.includes(bio)
    const hasCredentials = (realAuthor.credentials ?? []).length > 0
    const hasYears = realAuthor.yearsExperience != null
    const hasSocial = (realAuthor.socialLinks ?? []).length > 0
    record(
      'author-detail-es',
      status === 200 && !hasErrorMarker(body) && bioFound,
      `HTTP ${status}, bio (${bio.length} chars) found verbatim: ${bioFound}. Content-gap note: credentials populated=${hasCredentials}, yearsExperience populated=${hasYears}, socialLinks populated=${hasSocial} (known accepted gap from Phase 5/10 — author E-E-A-T fields not yet filled in via /admin).`,
    )
  }

  // --- Case-studies list (/es/case-studies) — real content since Phase 10.7 ---
  console.log('[4] Case-studies list (/es/case-studies)')
  const caseStudies = await payload.find({ collection: 'case-studies', locale: 'es', limit: 10 })
  {
    const { status, body } = await fetchRoute('/es/case-studies')
    const hasEmptyStateWrapper = body.includes('text-center py-16') || body.includes('py-16 text-center')
    const titlesFound =
      caseStudies.totalDocs > 0 ? caseStudies.docs.every((d) => body.includes(d.title)) : true
    record(
      'case-studies-list-es',
      status === 200 &&
        !hasErrorMarker(body) &&
        (caseStudies.totalDocs > 0 ? titlesFound : hasEmptyStateWrapper),
      `HTTP ${status}, totalDocs=${caseStudies.totalDocs}, ${
        caseStudies.totalDocs > 0
          ? `real case-study titles found verbatim: ${titlesFound}`
          : `empty-state wrapper found: ${hasEmptyStateWrapper}`
      }`,
    )
  }

  // --- Case-study detail (/es/case-studies/{real-slug}) — real content, incl. TestimonialSection ---
  console.log('[5] Case-study detail (/es/case-studies/{real-slug}) — KPIs + embedded testimonial')
  const realCaseStudy = caseStudies.docs[0]
  if (!realCaseStudy) {
    record('case-study-detail-es', 'skip', 'no real case study found — cannot verify')
  } else {
    const { status, body } = await fetchRoute(`/es/case-studies/${realCaseStudy.slug}`)
    const titleFound = body.includes(realCaseStudy.title)
    const testimonial = (realCaseStudy.testimonialSection ?? [])[0]
    const quoteFound = testimonial ? body.includes(testimonial.quote) : true
    const authorFound = testimonial ? body.includes(testimonial.authorName) : true
    record(
      'case-study-detail-es',
      status === 200 && !hasErrorMarker(body) && titleFound && quoteFound && authorFound,
      `HTTP ${status}, title found: ${titleFound}${
        testimonial
          ? `, testimonial quote (${testimonial.quote.length} chars) found: ${quoteFound}, author "${testimonial.authorName}" found: ${authorFound}`
          : ' (no testimonialSection on this doc)'
      }`,
    )
  }

  // --- Blog listing (/es/blog) — Hero breadcrumbs (Phase 10.8) ---
  console.log('[6] Blog listing (/es/blog) — Hero breadcrumb nav renders in ES')
  {
    const { status, body } = await fetchRoute('/es/blog')
    const hasBreadcrumbNav = body.includes('aria-label="Breadcrumb"')
    record(
      'blog-listing-breadcrumbs-es',
      status === 200 && !hasErrorMarker(body) && hasBreadcrumbNav,
      `HTTP ${status}, breadcrumb nav present: ${hasBreadcrumbNav}`,
    )
  }

  // --- Report ---
  console.log('\nPhase 11 Plan 02 — verification result table\n')
  console.log('Check'.padEnd(20), 'Result'.padEnd(6), 'Detail')
  console.log('-'.repeat(120))
  for (const r of results) {
    const label = r.ok === true ? 'PASS' : r.ok === 'skip' ? 'SKIP' : 'FAIL'
    console.log(r.name.padEnd(20), label.padEnd(6), r.detail)
  }
  console.log('-'.repeat(120))

  const hardFail = results.some((r) => r.ok === false)
  console.log(hardFail ? 'VERIFICATION FAILED' : 'ALL CHECKS PASSED')

  process.exit(hardFail ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
