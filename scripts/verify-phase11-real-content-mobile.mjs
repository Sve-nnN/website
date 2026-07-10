#!/usr/bin/env node
/**
 * Phase 11 Plan 02 close-out — real Chromium-headless mobile/tablet/desktop
 * verification for the surfaces that only gained real content after Phase
 * 10.7/10.8 (AboutSection on home, TestimonialSection + real case-study
 * detail, case-studies list with a real doc). Reuses the same Playwright
 * pattern as scripts/verify-mobile-viewport.mjs / verify-hero-mobile.mjs
 * (real browser, not CSS simulation) — no new dependency.
 *
 * Requires a dev server already running. Override with BASE_URL
 * (defaults to http://localhost:3000).
 *
 * Usage: node scripts/verify-phase11-real-content-mobile.mjs
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOT_DIR = path.join(__dirname, '.mobile-verify-screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const OVERFLOW_MARGIN_PX = 1

const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
]

const ROUTES = [
  { path: '/es', label: 'Home (AboutSection, es)' },
  { path: '/en', label: 'Home (AboutSection, en)' },
  { path: '/es/case-studies', label: 'Case-studies list (es, real doc)' },
  { path: '/es/case-studies/migracion-ecommerce-nextjs-seo-tecnico', label: 'Case-study detail (es, TestimonialSection)' },
  { path: '/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico', label: 'Case-study detail (en, TestimonialSection)' },
]

async function checkRoute(browser, route, viewport) {
  const failures = []
  const notes = []
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })

  const res = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' })
  if (!res || res.status() >= 400) {
    failures.push(`HTTP ${res ? res.status() : 'no response'} for ${route.path}`)
  }

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (scrollWidth > viewport.width + OVERFLOW_MARGIN_PX) {
    failures.push(`Horizontal overflow: scrollWidth=${scrollWidth}px > viewport=${viewport.width}px`)
  } else {
    notes.push(`No horizontal overflow (scrollWidth=${scrollWidth}px)`)
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const safeName = route.path.replace(/\//g, '_')
  const screenshotPath = path.join(SCREENSHOT_DIR, `p11${safeName}-${viewport.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  notes.push(`Screenshot saved: ${screenshotPath}`)

  await page.close()
  return { route, viewport, failures, notes }
}

async function main() {
  const browser = await chromium.launch()
  const results = []
  try {
    for (const route of ROUTES) {
      for (const viewport of VIEWPORTS) {
        results.push(await checkRoute(browser, route, viewport))
      }
    }
  } finally {
    await browser.close()
  }

  let anyFailed = false
  console.log('\n=== Phase 11 Real-Content Mobile Verification (AboutSection/TestimonialSection/Case-Studies) ===\n')
  for (const r of results) {
    const status = r.failures.length === 0 ? 'OK' : 'FAIL'
    if (r.failures.length > 0) anyFailed = true
    console.log(`--- ${r.route.label} @ ${r.viewport.name} (${r.viewport.width}px) : ${status} ---`)
    for (const n of r.notes) console.log(`  [note] ${n}`)
    for (const f of r.failures) console.log(`  [FAIL] ${f}`)
  }
  console.log('')
  console.log(anyFailed ? 'RESULT: FAIL (see failures above)' : 'RESULT: PASS (all routes/breakpoints OK)')
  process.exit(anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification script crashed:', err)
  process.exit(1)
})
