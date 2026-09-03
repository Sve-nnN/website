#!/usr/bin/env node
/**
 * Phase 45 Plan 01 — canonical + hreflang capture for the Phase 45 regression
 * baseline (BASE-01). Standalone Node script (ESM, pure `fetch`, no
 * Payload/DB import) — same CLI shape as scripts/capture-service-page-snapshot.mjs
 * (sibling, that file is not modified): `--base-url`, `--out`, `--routes`.
 *
 * Why a sibling and not an extension of capture-service-page-snapshot.mjs:
 * that script is the anchor of the Phase 32 -> 36 -> 45 -> 50 comparable
 * series (H1 + JSON-LD, condensed shape). Adding fields to its output would
 * change the shape every downstream diff depends on. scripts/verify-live-jsonld-meta.mjs
 * already established this precedent for the same reason (see its header).
 *
 * Usage:
 *   node scripts/capture-head-links-snapshot.mjs --base-url https://juan-tech.com --routes "/,/en" --out ./headlinks.json
 */
import { writeFile } from 'node:fs/promises'

// The 14 critical routes from Phase 45's criterion 1 (Home, 4 service
// landings x 2 locales, 2 geo pages x 2 locales). Curl-verified 200 direct
// against https://juan-tech.com on 2026-08-30 (see 45-RESEARCH.md "Lista
// final de rutas"). Hardcoded here so the script is runnable with no flags.
const ROUTES = [
  '/',
  '/en',
  '/servicios/seo-technical-audit',
  '/servicios/seo-consulting',
  '/servicios/fullstack-development',
  '/servicios/ai-seo-geo',
  '/en/services/seo-technical-audit',
  '/en/services/seo-consulting',
  '/en/services/fullstack-development',
  '/en/services/ai-seo-geo',
  '/seo-tecnico-madrid',
  '/seo-tecnico-lima',
  '/en/seo-tecnico-madrid',
  '/en/seo-tecnico-lima',
]

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', out: null, routes: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    // Comma-separated list, mirroring capture-service-page-snapshot.mjs's
    // --routes parsing exactly. A missing or empty value falls back to
    // `null` so `args.routes ?? ROUTES` downstream uses the hardcoded list.
    else if (argv[i] === '--routes') {
      const raw = argv[++i]
      args.routes = raw ? raw.split(',').map((r) => r.trim()).filter(Boolean) : null
    }
  }
  return args
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]*\brel="canonical"[^>]*\bhref="([^"]*)"[^>]*>/i)
  return m ? m[1] : null
}

// OJO: production emits the attribute as `hrefLang` in camelCase (React's
// DOM prop casing leaking into the rendered HTML). HTML attribute names are
// case-insensitive so Google reads it fine, but a regex without the `i`
// flag matches literal lowercase `hreflang=` and silently returns zero
// results across all 14 routes. Verified against curl output 2026-08-30.
function extractHreflang(html) {
  const matches = [...html.matchAll(/<link[^>]*\brel="alternate"[^>]*\bhreflang="([^"]*)"[^>]*\bhref="([^"]*)"[^>]*>/gi)]
  return matches.map(([, lang, href]) => ({ lang, href }))
}

async function captureUrl(baseUrl, path) {
  const url = `${baseUrl}${path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`GET ${url} returned ${res.status}`)
  }
  const html = await res.text()
  return {
    canonical: extractCanonical(html),
    hreflang: extractHreflang(html),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const snapshot = {}
  let hadFailure = false
  const targets = args.routes ?? ROUTES

  for (const path of targets) {
    try {
      const entry = await captureUrl(args.baseUrl, path)
      snapshot[path] = entry
      console.log(`${path}: canonical=${entry.canonical} hreflang=${entry.hreflang.length}`)
      if (entry.canonical === null) {
        console.error(`  FAILED: ${path} has no <link rel="canonical"> tag`)
        hadFailure = true
      }
    } catch (err) {
      console.error(`  FAILED for ${path}:`, err.message)
      snapshot[path] = { error: err.message }
      hadFailure = true
    }
  }

  if (args.out) {
    await writeFile(args.out, JSON.stringify(snapshot, null, 2))
    console.log(`\nSnapshot written to ${args.out}`)
  } else {
    console.log(JSON.stringify(snapshot, null, 2))
  }

  if (hadFailure) {
    console.error('\nOne or more URLs failed to fetch or had no canonical link.')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('capture-head-links-snapshot.mjs crashed:', err)
  process.exit(1)
})
