#!/usr/bin/env node
/**
 * Phase 10 Plan 02 — boundary-condition verification for the card-grid
 * consistency and E-E-A-T prominence styling built in 10-01.
 *
 * Pattern-matched after scripts/smoke-check-phase8.mjs: zero-dependency,
 * fetch()-based, requires `npm run dev` already running (reads
 * SMOKE_BASE_URL/BASE_URL, defaults to http://localhost:3000). Also uses
 * Payload's Local API (same pattern as the seed script) both to read
 * scripts/.phase10-fixture-state.json and to temporarily toggle/restore
 * real page field values inline, with a defensive double-restore pass
 * at the end regardless of outcome.
 *
 * Run: node --env-file=.env scripts/verify-phase10-cards-eeat.mjs
 * Requires: `npm run dev` already running on http://localhost:3000
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import config from '../src/payload.config.ts'

const BASE_URL = process.env.SMOKE_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000'
const STATE_FILE = path.resolve(process.cwd(), 'scripts/.phase10-fixture-state.json')

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

// Counts real rendered DOM anchors only (`<a class="group block" href="...">`
// literal HTML), not occurrences inside the embedded Next.js RSC hydration
// payload (a serialized JSON blob appended later in the same document that
// also contains every className string verbatim — naive substring/regex
// counts against raw class fragments like `aspect-[16/10]` overcount by
// matching that duplicate payload, discovered during this plan's execution).
function countCardAnchors(body, hrefPrefix) {
  const re = new RegExp(`<a class="group block" href="${hrefPrefix}/[^"]*"`, 'g')
  return (body.match(re) ?? []).length
}

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`  ${ok === true ? 'PASS' : ok === 'skip' ? 'SKIP' : 'FAIL'}: ${name} — ${detail}`)
}

// Surgical single-column update: `limit` on pages_blocks_featured_*_block is
// a plain (non-localized) numeric column keyed by _parent_id = pages.id.
// Writing it directly via raw SQL avoids round-tripping the entire localized
// `content.layout` blocks array through the Local API (which requires every
// localized sub-field of every sibling block — Hero, CallToAction, etc. — to
// be re-supplied in exact write format; a single mismatch there risks
// corrupting unrelated real production content this plan must never touch).
const BLOCK_TABLE = {
  featuredPostsBlock: 'pages_blocks_featured_posts_block',
  featuredCaseStudiesBlock: 'pages_blocks_featured_case_studies_block',
}

async function getBlockLimit(payload, pageId, blockType) {
  const table = BLOCK_TABLE[blockType]
  const res = await payload.db.drizzle.execute(
    sql.raw(`SELECT "limit" FROM "${table}" WHERE "_parent_id" = ${pageId} LIMIT 1`),
  )
  const row = res.rows?.[0] ?? res[0]
  return row ? Number(row.limit) : null
}

async function setBlockLimit(payload, pageId, blockType, newLimit) {
  const table = BLOCK_TABLE[blockType]
  await payload.db.drizzle.execute(
    sql.raw(`UPDATE "${table}" SET "limit" = ${newLimit} WHERE "_parent_id" = ${pageId}`),
  )
}

async function main() {
  if (!fs.existsSync(STATE_FILE)) {
    console.error(`FATAL: state file not found at ${STATE_FILE} — run seed-phase10-eeat-fixtures.ts first.`)
    process.exit(1)
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const payload = await getPayload({ config })

  console.log('\nPhase 10 Plan 02 — boundary/E-E-A-T verification\n')

  // --- Check 1: posts-grid min boundary (real data, home FeaturedPostsBlock) ---
  console.log('[1] Posts-grid min boundary (FeaturedPostsBlock limit=1)')
  const originalFeaturedPostsLimit = await getBlockLimit(payload, state.homePageId, 'featuredPostsBlock')
  await setBlockLimit(payload, state.homePageId, 'featuredPostsBlock', 1)
  try {
    const { status, body } = await fetchRoute('/en')
    const cardCount = countCardAnchors(body, '/blog')
    record(
      'posts-min-boundary',
      status === 200 && !hasErrorMarker(body) && cardCount === 1,
      `HTTP ${status}, real PostCard DOM anchors found: ${cardCount} (expected 1)`,
    )
  } finally {
    await setBlockLimit(payload, state.homePageId, 'featuredPostsBlock', originalFeaturedPostsLimit ?? 3)
  }

  // --- Check 2: posts-grid real max boundary (ArchiveBlock limit=12, on the
  // blog page — pages.id=2, confirmed by direct read of
  // pages_blocks_archive_block at execution time; the plan's own "real
  // content facts" note misattributed this block to the home page) ---
  console.log('[2] Posts-grid real max boundary (blog page ArchiveBlock limit=12, untouched)')
  {
    const { status, body } = await fetchRoute('/en/blog')
    const cardCount = countCardAnchors(body, '/blog')
    // FeaturedPostsBlock also lives on the blog page (fixed limit=3) and
    // shares the same href prefix, so the true ArchiveBlock ceiling is
    // upper-bounded, not exact — assert no corruption (a sane count, not a
    // runaway/duplicated grid) rather than an exact 12.
    record(
      'posts-max-boundary-grid-integrity',
      status === 200 && !hasErrorMarker(body) && cardCount >= 1 && cardCount <= 15,
      `HTTP ${status}, real PostCard DOM anchors on /en/blog: ${cardCount} (ArchiveBlock max 12 + FeaturedPostsBlock's own 3 = <=15, no runaway/duplicated grid)`,
    )
  }

  // --- Check 3: category-filter min boundary (real 0-post category) ---
  console.log('[3] Category-filter min boundary (empty-state copy)')
  {
    const categories = await payload.find({ collection: 'categories', limit: 100, locale: 'en' })
    let emptyCategorySlug = null
    for (const c of categories.docs) {
      const posts = await payload.find({ collection: 'posts', where: { categories: { in: [c.id] } }, limit: 0 })
      if (posts.totalDocs === 0) {
        emptyCategorySlug = c.slug
        break
      }
    }
    if (!emptyCategorySlug) {
      record('category-empty-state', 'skip', 'no 0-post category found at execution time — cannot verify')
    } else {
      const { status, body } = await fetchRoute(`/en/blog?category=${emptyCategorySlug}`)
      // The blog page also renders FeaturedPostsBlock (fixed 3 posts,
      // unaffected by the category filter) alongside ArchiveBlock, so total
      // page-wide card count can't be asserted as 0. Instead assert
      // ArchiveBlock's own empty-state markup is present — its emptyState
      // branch renders a `py-16 text-center` wrapper the non-empty grid
      // branch never does.
      const hasEmptyStateWrapper = body.includes('text-center py-16') || body.includes('py-16 text-center')
      record(
        'category-empty-state',
        status === 200 && !hasErrorMarker(body) && hasEmptyStateWrapper,
        `HTTP ${status}, category=${emptyCategorySlug} (0 real posts), ArchiveBlock empty-state wrapper found: ${hasEmptyStateWrapper}`,
      )
    }
  }

  // --- Check 4: case-study grid min+max boundary (seeded fixtures) ---
  console.log('[4] Case-study grid min+max boundary (seeded fixtures)')
  await setBlockLimit(payload, state.homePageId, 'featuredCaseStudiesBlock', 1)
  {
    const { status, body } = await fetchRoute('/en')
    const hasOne = body.includes('Test Case Study Phase 10 Boundary 1')
    record(
      'case-study-min-boundary',
      status === 200 && !hasErrorMarker(body) && hasOne,
      `HTTP ${status}, limit=1, seeded title 1 found: ${hasOne}`,
    )
  }
  await setBlockLimit(payload, state.homePageId, 'featuredCaseStudiesBlock', 6)
  try {
    const { status, body } = await fetchRoute('/en')
    const allSix = [1, 2, 3, 4, 5, 6].every((n) => body.includes(`Test Case Study Phase 10 Boundary ${n}`))
    record(
      'case-study-max-boundary',
      status === 200 && !hasErrorMarker(body) && allSix,
      `HTTP ${status}, limit=6, all 6 seeded titles found: ${allSix}`,
    )
  } finally {
    await setBlockLimit(
      payload,
      state.homePageId,
      'featuredCaseStudiesBlock',
      state.originalFeaturedCaseStudiesBlockLimit,
    )
  }

  // --- Check 5: AuthorCard/AuthorByline E-E-A-T prominence (seeded fixture, both locales) ---
  console.log('[5] AuthorCard E-E-A-T prominence (seeded fixture author, en + es)')
  {
    const author = await payload.findByID({ collection: 'authors', id: state.authorId, depth: 0 })
    const credentialLabels = (author.credentials ?? []).map((c) => c.label)
    const socialUrls = (author.socialLinks ?? []).map((s) => s.url)

    const { status: statusEn, body: bodyEn } = await fetchRoute('/en/authors/test-author-phase10-eeat')
    const enChecks = {
      bio: bodyEn.includes('Seeded bio for Phase 10 E-E-A-T verification.'),
      credentials: credentialLabels.every((label) => bodyEn.includes(label)),
      yearsLabel: bodyEn.includes('12+ years of experience'),
      socialUrls: socialUrls.every((url) => bodyEn.includes(url)),
    }
    const enOk = statusEn === 200 && !hasErrorMarker(bodyEn) && Object.values(enChecks).every(Boolean)
    record(
      'author-card-en',
      enOk,
      `HTTP ${statusEn}, bio=${enChecks.bio} credentials=${enChecks.credentials} yearsLabel=${enChecks.yearsLabel} socialUrls=${enChecks.socialUrls}`,
    )

    const { status: statusEs, body: bodyEs } = await fetchRoute('/es/authors/test-author-phase10-eeat')
    const esChecks = {
      yearsLabel: bodyEs.includes('12+ años de experiencia'),
    }
    const esOk = statusEs === 200 && !hasErrorMarker(bodyEs) && esChecks.yearsLabel
    record('author-card-es', esOk, `HTTP ${statusEs}, yearsLabel(es)=${esChecks.yearsLabel}`)
  }

  // --- Check 6: ES longest-title rendering (real posts, ids 53 and 66) ---
  console.log('[6] ES longest-title rendering (posts id=53, id=66)')
  {
    for (const id of [53, 66]) {
      const post = await payload.findByID({ collection: 'posts', id, depth: 0, locale: 'es' })
      const { status, body } = await fetchRoute(`/es/blog/${post.slug}`)
      const titleFound = body.includes(post.title)
      record(
        `es-longest-title-${id}`,
        status === 200 && !hasErrorMarker(body) && titleFound,
        `HTTP ${status}, slug=${post.slug}, full title (${String(post.title).length} chars) found verbatim: ${titleFound}. Residual risk: pixel-level wrap/overflow cannot be verified without a headless browser (no new dependency authorized) — recommend a human eyeball-check of this route.`,
      )
    }
  }

  // --- Defensive double-restore ---
  console.log('\n[Defensive restore] Confirming all toggled fields are back to original values...')
  const fcsLimitFinal = await getBlockLimit(payload, state.homePageId, 'featuredCaseStudiesBlock')
  const fpLimitFinal = await getBlockLimit(payload, state.homePageId, 'featuredPostsBlock')
  if (fcsLimitFinal !== state.originalFeaturedCaseStudiesBlockLimit) {
    await setBlockLimit(
      payload,
      state.homePageId,
      'featuredCaseStudiesBlock',
      state.originalFeaturedCaseStudiesBlockLimit,
    )
    console.log('  Restored FeaturedCaseStudiesBlock.limit (was left toggled)')
  } else {
    console.log('  FeaturedCaseStudiesBlock.limit already restored')
  }
  if (fpLimitFinal !== (originalFeaturedPostsLimit ?? 3)) {
    await setBlockLimit(payload, state.homePageId, 'featuredPostsBlock', originalFeaturedPostsLimit ?? 3)
    console.log('  Restored FeaturedPostsBlock.limit (was left toggled)')
  } else {
    console.log('  FeaturedPostsBlock.limit already restored')
  }

  // --- Report ---
  console.log('\nPhase 10 Plan 02 — verification result table\n')
  console.log('Check'.padEnd(30), 'Result'.padEnd(6), 'Detail')
  console.log('-'.repeat(100))
  for (const r of results) {
    const label = r.ok === true ? 'PASS' : r.ok === 'skip' ? 'SKIP' : 'FAIL'
    console.log(r.name.padEnd(30), label.padEnd(6), r.detail)
  }
  console.log('-'.repeat(100))

  const hardFail = results.some((r) => r.ok === false)
  console.log(hardFail ? 'VERIFICATION FAILED' : 'ALL CHECKS PASSED')

  process.exit(hardFail ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
