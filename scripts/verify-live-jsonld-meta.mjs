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
]

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
  const targets = args.routes
    ? args.routes.map((path) => ROUTES.find((r) => r.path === path) ?? { path, expectedJsonLd: [] })
    : ROUTES

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
