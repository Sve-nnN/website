#!/usr/bin/env node
/**
 * Real Chromium-headless mobile viewport verification for the Hero block's
 * new 10.8 fields (UI-22 CTA `links`, UI-23 `breadcrumbs`), reusing
 * scripts/verify-mobile-viewport.mjs's Playwright pattern (real browser,
 * not CSS simulation).
 *
 * Checks at 375px:
 *   - Home page (/[locale]): Hero CTA button is visible, has no horizontal
 *     overflow, and its right edge stays within the viewport.
 *   - Blog index (/[locale]/blog): Hero breadcrumb nav is visible, has no
 *     horizontal overflow, and its right edge stays within the viewport.
 *
 * Requires a dev server already running. Override with BASE_URL
 * (defaults to http://localhost:3000).
 *
 * Usage:
 *   BASE_URL=http://localhost:3002 node scripts/verify-hero-mobile.mjs
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOT_DIR = path.join(__dirname, '.mobile-verify-screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const VIEWPORT = { width: 375, height: 812 }
const OVERFLOW_MARGIN_PX = 1

async function checkPage(browser, { urlPath, locator, label, screenshotName }) {
  const failures = []
  const notes = []

  const page = await browser.newPage({ viewport: VIEWPORT })
  await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'networkidle' })

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (scrollWidth > VIEWPORT.width + OVERFLOW_MARGIN_PX) {
    failures.push(`Horizontal overflow on ${urlPath}: document.scrollWidth=${scrollWidth}px > ${VIEWPORT.width}px`)
  } else {
    notes.push(`No document horizontal overflow (scrollWidth=${scrollWidth}px)`)
  }

  const target = page.locator(locator).first()
  const visible = await target.isVisible().catch(() => false)

  if (!visible) {
    failures.push(`${label} is not visible at ${urlPath} (locator: ${locator})`)
  } else {
    notes.push(`${label} is visible`)
    const box = await target.boundingBox()
    if (box) {
      const rightEdge = box.x + box.width
      notes.push(`${label} boundingBox: x=${Math.round(box.x)} width=${Math.round(box.width)} rightEdge=${Math.round(rightEdge)}`)
      if (rightEdge > VIEWPORT.width + OVERFLOW_MARGIN_PX) {
        failures.push(`${label} overflows viewport: rightEdge=${rightEdge}px > ${VIEWPORT.width}px`)
      }
    } else {
      failures.push(`${label} boundingBox is null`)
    }
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName)
  await page.screenshot({ path: screenshotPath, fullPage: false })
  notes.push(`Screenshot saved: ${screenshotPath}`)

  await page.close()
  return { urlPath, failures, notes }
}

async function main() {
  const browser = await chromium.launch()
  const results = []

  try {
    results.push(
      await checkPage(browser, {
        urlPath: '/es',
        locator: 'section a:has-text("Ver case studies")',
        label: 'Home Hero CTA (es)',
        screenshotName: 'hero-cta-mobile-es.png',
      }),
    )
    results.push(
      await checkPage(browser, {
        urlPath: '/en',
        locator: 'section a:has-text("View Case Studies")',
        label: 'Home Hero CTA (en)',
        screenshotName: 'hero-cta-mobile-en.png',
      }),
    )
    results.push(
      await checkPage(browser, {
        urlPath: '/es/blog',
        locator: 'nav[aria-label="Breadcrumb"]',
        label: 'Blog Hero breadcrumbs (es)',
        screenshotName: 'hero-breadcrumbs-mobile-es.png',
      }),
    )
    results.push(
      await checkPage(browser, {
        urlPath: '/en/blog',
        locator: 'nav[aria-label="Breadcrumb"]',
        label: 'Blog Hero breadcrumbs (en)',
        screenshotName: 'hero-breadcrumbs-mobile-en.png',
      }),
    )
  } finally {
    await browser.close()
  }

  let anyFailed = false
  console.log('\n=== Hero Mobile Viewport Verification (CTA + Breadcrumbs, 375px) ===\n')
  for (const result of results) {
    const status = result.failures.length === 0 ? 'OK' : 'FAIL'
    if (result.failures.length > 0) anyFailed = true
    console.log(`--- ${result.urlPath} : ${status} ---`)
    for (const note of result.notes) console.log(`  [note] ${note}`)
    for (const failure of result.failures) console.log(`  [FAIL] ${failure}`)
    console.log('')
  }

  console.log(anyFailed ? 'RESULT: FAIL (see failures above)' : 'RESULT: PASS (all checks OK)')
  process.exit(anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification script crashed:', err)
  process.exit(1)
})
