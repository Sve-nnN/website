#!/usr/bin/env node
/**
 * Phase 11 Plan 02 — final ES layout route-level check for the page types
 * Phase 10 did NOT already cover (Phase 10 covered blog post cards/detail
 * specifically). Covers: home, authors list, author detail (real author),
 * case-studies list.
 *
 * Pattern-matched after scripts/verify-phase10-cards-eeat.mjs: zero-dependency,
 * fetch()-based, requires `npm run dev` (or a production server) already
 * running (reads SMOKE_BASE_URL/BASE_URL, defaults to http://localhost:3000).
 * Uses Payload's Local API to read the real longest ES content per page type
 * before asserting it renders verbatim server-side.
 *
 * Run: node --env-file=.env scripts/verify-es-layout-final.mjs
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

  // --- Case-studies list (/es/case-studies) — expected empty state ---
  console.log('[4] Case-studies list (/es/case-studies) — expected empty state (0 real docs)')
  const caseStudies = await payload.find({ collection: 'case-studies', locale: 'es', limit: 0 })
  {
    const { status, body } = await fetchRoute('/es/case-studies')
    const hasEmptyStateWrapper = body.includes('text-center py-16') || body.includes('py-16 text-center')
    record(
      'case-studies-list-es',
      status === 200 && !hasErrorMarker(body) && (caseStudies.totalDocs > 0 || hasEmptyStateWrapper),
      `HTTP ${status}, totalDocs=${caseStudies.totalDocs}, empty-state wrapper found: ${hasEmptyStateWrapper}`,
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
