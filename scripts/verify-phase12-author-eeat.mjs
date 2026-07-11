#!/usr/bin/env node
/**
 * Phase 12 close-out — real Chromium-headless verification of the author
 * page's 4 new E-E-A-T sections (Expertise/Educación y Certificaciones/
 * Experiencia/Eventos donde he sido ponente) and the enriched Person
 * JSON-LD, against the real content seeded by scripts/seed-author-eeat.ts
 * (12-03, extended mid-phase for speaking-events + aprendoclub experience).
 * Reuses the same Playwright pattern as
 * scripts/verify-phase11-real-content-mobile.mjs (real browser, not CSS
 * simulation) — no new dependency.
 *
 * Requires a dev server already running. Override with BASE_URL
 * (defaults to http://localhost:3000).
 *
 * Usage: node scripts/verify-phase12-author-eeat.mjs
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
  {
    path: '/es/authors/juan-carlos-angulo',
    label: 'Author page ES — Expertise/Educación/Experiencia/Eventos',
    expertiseText: 'SEO Técnico Avanzado',
    institutionText: 'Universidad Peruana de Ciencias Aplicadas',
    experienceText: 'AprendoSEO',
    aprendoclubText: 'aprendoclub',
    speakingEventText: 'Caracas SEO Fest',
    speakingEvent2Text: 'Taller SEO + IA en Lima',
  },
  {
    path: '/en/authors/juan-carlos-angulo',
    label: 'Author page EN — Expertise/Education/Experience/Speaking Events',
    expertiseText: 'Advanced Technical SEO',
    institutionText: 'Universidad Peruana de Ciencias Aplicadas',
    experienceText: 'AprendoSEO',
    aprendoclubText: 'aprendoclub',
    speakingEventText: 'Caracas SEO Fest',
    speakingEvent2Text: 'SEO + AI Workshop in Lima',
  },
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

  const bodyText = await page.evaluate(() => document.body.innerText)

  if (!bodyText.includes(route.expertiseText)) {
    failures.push(`Expertise badge text not found: "${route.expertiseText}"`)
  } else {
    notes.push(`Expertise badge text found: "${route.expertiseText}"`)
  }

  if (!bodyText.includes(route.institutionText)) {
    failures.push(`Education card institution text not found: "${route.institutionText}"`)
  } else {
    notes.push(`Education card institution text found: "${route.institutionText}"`)
  }

  if (!bodyText.includes(route.experienceText)) {
    failures.push(`Experience timeline text not found: "${route.experienceText}"`)
  } else {
    notes.push(`Experience timeline text found: "${route.experienceText}"`)
  }

  if (!bodyText.includes(route.aprendoclubText)) {
    failures.push(`Experience timeline aprendoclub item not found: "${route.aprendoclubText}"`)
  } else {
    notes.push(`Experience timeline aprendoclub item found: "${route.aprendoclubText}"`)
  }

  if (!bodyText.includes(route.speakingEventText)) {
    failures.push(`Speaking Events section — event 1 not found: "${route.speakingEventText}"`)
  } else {
    notes.push(`Speaking Events section — event 1 found: "${route.speakingEventText}"`)
  }

  if (!bodyText.includes(route.speakingEvent2Text)) {
    failures.push(`Speaking Events section — event 2 not found: "${route.speakingEvent2Text}"`)
  } else {
    notes.push(`Speaking Events section — event 2 found: "${route.speakingEvent2Text}"`)
  }

  const ldJsonBlocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  const personBlock = ldJsonBlocks.find((block) => block.includes('"@type":"Person"'))

  if (!personBlock) {
    failures.push('No <script type="application/ld+json"> with "@type":"Person" found')
  } else {
    for (const key of ['knowsAbout', 'hasCredential', 'sameAs']) {
      if (!personBlock.includes(`"${key}"`)) {
        failures.push(`Person JSON-LD missing "${key}"`)
      } else {
        notes.push(`Person JSON-LD contains "${key}"`)
      }
    }
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const safeName = route.path.replace(/\//g, '_')
  const screenshotPath = path.join(SCREENSHOT_DIR, `p12${safeName}-${viewport.name}.png`)
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
  console.log(
    '\n=== Phase 12 Author E-E-A-T Verification (Expertise/Education/Experience/Speaking Events + JSON-LD) ===\n',
  )
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
