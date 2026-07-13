#!/usr/bin/env node
/**
 * Phase 25 Plan 01 — regression baseline capture (and Phase 25 Plan 05 diff
 * source, re-run VERBATIM against the post-change site). Standalone Node
 * script (ESM, pure HTTP fetch + HTML parsing) — no Payload/DB import, no
 * new npm dependency. Fetches a fixed list of service-page URLs, extracts
 * every <h1> and every <script type="application/ld+json"> block, and
 * writes one JSON object keyed by URL path.
 *
 * Usage:
 *   node scripts/capture-service-page-snapshot.mjs --base-url http://localhost:3000 --out ./snapshot.json
 */
import { writeFile } from 'node:fs/promises'

const URLS = [
  '/servicios/seo-technical-audit',
  '/servicios/seo-consulting',
  '/servicios/fullstack-development',
  '/servicios/ai-seo-geo',
  '/en/services/seo-technical-audit',
  '/en/services/seo-consulting',
  '/en/services/fullstack-development',
  '/en/services/ai-seo-geo',
]

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', out: null, routes: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    // Comma-separated list support (e.g. --routes /en,/es), mirroring
    // lighthouse-mobile.mjs's --routes-only parsing exactly. A missing or
    // empty value falls back to `null` so `args.routes ?? URLS` downstream
    // uses the original hardcoded URLS list instead of crashing or
    // silently running zero routes — keeps Phase 25's own re-run
    // byte-for-byte identical when this flag is omitted.
    else if (argv[i] === '--routes') {
      const raw = argv[++i]
      args.routes = raw ? raw.split(',').map((r) => r.trim()).filter(Boolean) : null
    }
  }
  return args
}

// Tolerant of nested spans/classes inside the h1 tag content, and of
// attributes on the opening tag itself.
function extractH1s(html) {
  const matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
  const texts = matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim())
  return { count: texts.length, texts }
}

function extractJsonLd(html) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  return matches.map((m) => {
    const raw = JSON.parse(m[1])
    return { type: raw['@type'] ?? null, raw }
  })
}

async function captureUrl(baseUrl, path) {
  const url = `${baseUrl}${path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`GET ${url} returned ${res.status}`)
  }
  const html = await res.text()
  const h1 = extractH1s(html)
  const jsonLd = extractJsonLd(html)
  return { h1, jsonLd }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const snapshot = {}
  let hadFailure = false
  const targets = args.routes ?? URLS

  for (const path of targets) {
    try {
      const entry = await captureUrl(args.baseUrl, path)
      snapshot[path] = entry
      const jsonLdTypes = entry.jsonLd.map((j) => j.type)
      console.log(`${path}: h1Count=${entry.h1.count} jsonLdTypes=[${jsonLdTypes.join(', ')}]`)
      if (entry.h1.count === 0) {
        console.error(`  FAILED: ${path} has zero <h1> elements`)
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
    console.error('\nOne or more URLs failed to fetch or had zero H1 elements.')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('capture-service-page-snapshot.mjs crashed:', err)
  process.exit(1)
})
