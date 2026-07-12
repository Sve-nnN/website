#!/usr/bin/env node
/**
 * Phase 11 Plan 03 — reusable mobile Lighthouse runner against a LOCAL
 * PRODUCTION BUILD (never `next dev` — dev-mode scores are not
 * representative). This script is a pure "given a running base URL, run
 * Lighthouse and write scores" utility; it does NOT start/stop the Next.js
 * server itself — that's the caller's job.
 *
 * Locates (or downloads once, cached) a Chrome-for-Testing binary via
 * @puppeteer/browsers, launches it via chrome-launcher, and runs the
 * `lighthouse` Node API with the mobile form-factor preset against a fixed
 * route list.
 *
 * Usage:
 *   node scripts/lighthouse-mobile.mjs --base-url http://localhost:3000 --out ./lh-current.json
 *   node scripts/lighthouse-mobile.mjs --base-url http://localhost:3000 --out /tmp/x.json --routes-only /en
 */
import { install, computeExecutablePath, resolveBuildId, detectBrowserPlatform, Browser } from '@puppeteer/browsers'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHROME_CACHE_DIR = path.join(path.dirname(__dirname), '.lighthouse-chrome')

const ROUTES = [
  '/en',
  '/es',
  '/en/blog',
  // 75-char longest-ES-title precedent from Phase 10 (post id 53) — real
  // migrated content, not a placeholder slug.
  '/en/blog/tech-seo-guide',
  '/en/case-studies',
  '/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico',
]

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', out: null, routesOnly: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    // Comma-separated list support (e.g. --routes-only /en,/es); a single
    // route with no comma still yields a 1-element array, so downstream
    // consumers no longer need the `? [x] : ROUTES` ternary.
    else if (argv[i] === '--routes-only') args.routesOnly = argv[++i].split(',').map((r) => r.trim()).filter(Boolean)
  }
  return args
}

async function getChromePath() {
  const platform = detectBrowserPlatform()
  const buildId = await resolveBuildId(Browser.CHROME, platform, 'stable')
  const existing = computeExecutablePath({ browser: Browser.CHROME, buildId, cacheDir: CHROME_CACHE_DIR, platform })
  try {
    await import('node:fs/promises').then((fs) => fs.access(existing))
    return existing
  } catch {
    const result = await install({ browser: Browser.CHROME, buildId, cacheDir: CHROME_CACHE_DIR })
    return result.executablePath
  }
}

// Lighthouse audits can come back without a computed numericValue (e.g. on a
// cold-started server that hasn't served a few warm requests yet, or when the
// audit itself errors out). Guard against that instead of letting a raw
// `Cannot read properties of undefined (reading 'toFixed')` propagate.
function safeNumeric(audits, id, decimals = 0) {
  const value = audits[id]?.numericValue
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Audit "${id}" did not return a numeric value (scoreDisplayMode: ${audits[id]?.scoreDisplayMode ?? 'missing'})`)
  }
  return decimals ? Number(value.toFixed(decimals)) : Math.round(value)
}

async function runLighthouse(url, chromePath) {
  const chrome = await launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] })
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      { extends: 'lighthouse:default', settings: { formFactor: 'mobile', screenEmulation: { mobile: true, width: 375, height: 812, deviceScaleFactor: 2, disabled: false } } },
    )
    const categories = result.lhr.categories
    const audits = result.lhr.audits
    return {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      'best-practices': Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
      lcpMs: safeNumeric(audits, 'largest-contentful-paint'),
      cls: safeNumeric(audits, 'cumulative-layout-shift', 3),
      // Total Blocking Time (ms) is Lighthouse's lab-metric proxy for INP —
      // true INP requires real-user field data (Chrome UX Report), which a
      // pre-production local build cannot produce.
      tbtMs: safeNumeric(audits, 'total-blocking-time'),
    }
  } finally {
    await chrome.kill()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const routes = args.routesOnly ?? ROUTES

  const chromePath = await getChromePath()
  console.log(`Using Chrome at: ${chromePath}`)

  const scores = {}
  for (const route of routes) {
    const url = `${args.baseUrl}${route}`
    console.log(`Running Lighthouse (mobile) against ${url} ...`)
    try {
      scores[route] = await runLighthouse(url, chromePath)
      console.log(`  ${route}:`, scores[route])
    } catch (err) {
      console.error(`  FAILED for ${route}:`, err.message)
      scores[route] = { error: err.message }
    }
  }

  if (args.out) {
    await writeFile(args.out, JSON.stringify(scores, null, 2))
    console.log(`\nScores written to ${args.out}`)
  } else {
    console.log(JSON.stringify(scores, null, 2))
  }
}

main().catch((err) => {
  console.error('lighthouse-mobile.mjs crashed:', err)
  process.exit(1)
})
