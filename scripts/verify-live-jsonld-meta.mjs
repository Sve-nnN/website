#!/usr/bin/env node
/**
 * Phase 30 Plan 04 — live curl-based verification of JSON-LD validity and
 * meta.title/meta.description integrity across every route touched by
 * Plans 30-01/02/03 (Header/Footer-driven pages, Home, Contact, Privacy,
 * Terms, Services index + 4 landings, 2 geo-pages), both locales.
 *
 * Standalone Node script (ESM, pure `fetch`, no Payload/DB import) — same
 * CLI shape as scripts/capture-service-page-snapshot.mjs (extended, that
 * file is not modified): `--base-url`, `--out`, `--routes`.
 *
 * Usage:
 *   node scripts/verify-live-jsonld-meta.mjs --base-url http://localhost:3000
 */
import { writeFile } from 'node:fs/promises'

// Every route touched across Plans 30-01/02/03, both locale variants.
// `expectedJsonLd` documents what this phase's authors confirmed live
// (via curl, see 30-04-SUMMARY.md) BEFORE this script existed — an empty
// array means "no JSON-LD is rendered on this route by design" (contact,
// privacy, terms, and the 2 geo-pages render no <JsonLd> component at all;
// this is pre-existing app behavior, not a Phase 30 regression).
const ROUTES = [
  { path: '/', expectedJsonLd: ['Person'] },
  { path: '/en', expectedJsonLd: ['Person'] },
  { path: '/contact', expectedJsonLd: [] },
  { path: '/en/contact', expectedJsonLd: [] },
  { path: '/privacy', expectedJsonLd: [] },
  { path: '/en/privacy', expectedJsonLd: [] },
  { path: '/terms', expectedJsonLd: [] },
  { path: '/en/terms', expectedJsonLd: [] },
  { path: '/servicios', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/en/services', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/servicios/seo-technical-audit', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/en/services/seo-technical-audit', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/servicios/seo-consulting', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/en/services/seo-consulting', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/servicios/fullstack-development', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/en/services/fullstack-development', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/servicios/ai-seo-geo', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/en/services/ai-seo-geo', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/seo-tecnico-madrid', expectedJsonLd: [] },
  { path: '/en/seo-tecnico-madrid', expectedJsonLd: [] },
  { path: '/seo-tecnico-lima', expectedJsonLd: [] },
  { path: '/en/seo-tecnico-lima', expectedJsonLd: [] },
  // Phase 31's 4 blog/case-studies INDEX routes — these are static listing
  // pages, not doc-backed, so they never appear in /sitemap.xml (which only
  // emits one <url> per Posts/CaseStudies document). Must be hardcoded here
  // rather than relying on getDynamicBlogCaseStudyRoutes' sitemap parse.
  { path: '/blog', expectedJsonLd: [] },
  { path: '/en/blog', expectedJsonLd: [] },
  { path: '/case-studies', expectedJsonLd: ['BreadcrumbList'] },
  { path: '/en/case-studies', expectedJsonLd: ['BreadcrumbList'] },
]

// Fetches the live /sitemap.xml and parses every <url> block's two
// <xhtml:link hreflang="es|en"> alternates, filtering to blog/case-studies
// routes (Phase 31's ~162 new routes: 72 posts + 7 case-studies, x2 locales,
// plus the 4 index routes). expectedJsonLd assigned per the confirmed-live
// table (see this script's header + 31-16-PLAN.md <interfaces>) — index
// paths render no JsonLd, detail paths render exactly what each page.tsx
// confirmed via source read during planning.
function classifyBlogCaseStudyPath(path) {
  const isBlogIndex = path === '/blog' || path === '/en/blog'
  const isCaseStudiesIndex = path === '/case-studies' || path === '/en/case-studies'
  const isBlogDetail = /^(\/en)?\/blog\/[^/]+$/.test(path) && !isBlogIndex
  const isCaseStudiesDetail = /^(\/en)?\/case-studies\/[^/]+$/.test(path) && !isCaseStudiesIndex

  if (isBlogIndex) return []
  if (isCaseStudiesIndex) return ['BreadcrumbList']
  if (isBlogDetail) return ['Article']
  if (isCaseStudiesDetail) return ['CreativeWork', 'BreadcrumbList']
  return null // not a blog/case-studies route
}

async function getDynamicBlogCaseStudyRoutes(baseUrl) {
  const res = await fetch(`${baseUrl}/sitemap.xml`)
  if (!res.ok) {
    throw new Error(`GET ${baseUrl}/sitemap.xml returned ${res.status}`)
  }
  const xml = await res.text()

  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1])
  const routes = []
  const seen = new Set()

  for (const block of urlBlocks) {
    const hreflangMatches = [
      ...block.matchAll(/<xhtml:link\s+rel="alternate"\s+hreflang="(es|en)"\s+href="([^"]+)"/g),
    ]
    for (const [, , href] of hreflangMatches) {
      let path
      try {
        path = new URL(href).pathname
      } catch {
        continue
      }
      const expectedJsonLd = classifyBlogCaseStudyPath(path)
      if (expectedJsonLd === null) continue
      if (seen.has(path)) continue
      seen.add(path)
      routes.push({ path, expectedJsonLd })
    }
  }

  return routes
}

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', out: null, routes: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    else if (argv[i] === '--routes') {
      const raw = argv[++i]
      args.routes = raw ? raw.split(',').map((r) => r.trim()).filter(Boolean) : null
    }
  }
  return args
}

// Same shape as capture-service-page-snapshot.mjs's extractJsonLd, extended
// to catch-per-block parse failures individually rather than letting one
// bad block crash the whole run.
function extractJsonLd(html) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  return matches.map((m) => {
    try {
      const raw = JSON.parse(m[1])
      return { type: raw['@type'] ?? null, raw, error: null }
    } catch (err) {
      return { type: null, raw: null, error: err.message }
    }
  })
}

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i)
  return m ? m[1].trim() : null
}

function extractMetaDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
  return m ? m[1].trim() : null
}

async function verifyUrl(baseUrl, route) {
  const url = `${baseUrl}${route.path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`GET ${url} returned ${res.status}`)
  }
  const html = await res.text()
  const jsonLd = extractJsonLd(html)
  const title = extractTitle(html)
  const metaDescription = extractMetaDescription(html)

  const problems = []

  // JSON-LD: any parse failure is always a problem.
  const parseFailures = jsonLd.filter((j) => j.error)
  if (parseFailures.length > 0) {
    problems.push(`${parseFailures.length} JSON-LD block(s) failed JSON.parse`)
  }

  // JSON-LD: expected @type(s) must all be present among found types.
  const foundTypes = jsonLd.map((j) => j.type).filter(Boolean)
  for (const expectedType of route.expectedJsonLd) {
    if (!foundTypes.includes(expectedType)) {
      problems.push(`expected JSON-LD @type "${expectedType}" not found (found: [${foundTypes.join(', ') || 'none'}])`)
    }
  }
  // If we expected zero JSON-LD, finding an unexpected type is not itself a
  // failure (extra structured data is not a regression) — only missing
  // expected types and parse failures gate the run.

  if (!title || title.length === 0) {
    problems.push('empty or missing <title>')
  }
  if (!metaDescription || metaDescription.length === 0) {
    problems.push('empty or missing meta description')
  }

  return {
    path: route.path,
    ok: problems.length === 0,
    problems,
    title,
    metaDescription,
    jsonLdTypes: foundTypes,
    jsonLdParseErrors: parseFailures.map((f) => f.error),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  let targets
  if (args.routes) {
    targets = args.routes.map((path) => ROUTES.find((r) => r.path === path) ?? { path, expectedJsonLd: [] })
  } else {
    // Default full run: Phase 30's 22 hardcoded routes + Phase 31's ~162
    // dynamically-discovered blog/case-studies routes (fetched live from
    // /sitemap.xml, not hardcoded — see getDynamicBlogCaseStudyRoutes).
    const dynamicRoutes = await getDynamicBlogCaseStudyRoutes(args.baseUrl)
    console.log(`Discovered ${dynamicRoutes.length} blog/case-studies routes from ${args.baseUrl}/sitemap.xml`)
    targets = [...ROUTES, ...dynamicRoutes]
  }

  const results = []
  let hadFailure = false

  for (const route of targets) {
    try {
      const result = await verifyUrl(args.baseUrl, route)
      results.push(result)
      const status = result.ok ? 'PASS' : 'FAIL'
      console.log(
        `${status} ${result.path}: jsonLd=[${result.jsonLdTypes.join(', ') || 'none'}] title="${result.title ?? ''}" metaDescription="${(result.metaDescription ?? '').slice(0, 60)}${(result.metaDescription ?? '').length > 60 ? '…' : ''}"`,
      )
      if (!result.ok) {
        hadFailure = true
        for (const problem of result.problems) {
          console.error(`  PROBLEM: ${problem}`)
        }
      }
    } catch (err) {
      hadFailure = true
      results.push({ path: route.path, ok: false, problems: [err.message] })
      console.error(`FAIL ${route.path}: ${err.message}`)
    }
  }

  if (args.out) {
    await writeFile(args.out, JSON.stringify(results, null, 2))
    console.log(`\nResults written to ${args.out}`)
  }

  console.log(
    hadFailure
      ? '\nRESULT: FAIL — one or more routes have JSON-LD/meta problems, see PROBLEM lines above.'
      : '\nRESULT: PASS — all routes have valid JSON-LD (where expected) and non-empty title/meta description.',
  )
  process.exitCode = hadFailure ? 1 : 0
}

main().catch((err) => {
  console.error('verify-live-jsonld-meta.mjs crashed:', err)
  process.exit(1)
})
