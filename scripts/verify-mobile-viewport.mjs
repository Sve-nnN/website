#!/usr/bin/env node
/**
 * Real Chromium-headless mobile/tablet/desktop viewport verification for
 * SiteHeader + SiteFooter (Phase 10.6-03, UI-19).
 *
 * Requires a dev server already running (npm run dev) before this script is
 * executed — it does NOT spawn its own server. Override the target with
 * BASE_URL (defaults to http://localhost:3000).
 *
 * Usage:
 *   npm run dev &            # in a separate terminal / background process
 *   node scripts/verify-mobile-viewport.mjs
 *
 * Reusable for Phases 10.7/10.8/11 mobile verification needs.
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOT_DIR = path.join(__dirname, '.mobile-verify-screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const PATH_TO_VISIT = process.env.VERIFY_PATH ?? '/en'

const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
]

const OVERFLOW_MARGIN_PX = 1

async function verifyViewport(browser, viewport) {
  const failures = []
  const notes = []

  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  })

  const url = `${BASE_URL}${PATH_TO_VISIT}`
  await page.goto(url, { waitUntil: 'networkidle' })

  // --- 1. Horizontal overflow check (whole document) ---
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (scrollWidth > viewport.width + OVERFLOW_MARGIN_PX) {
    failures.push(
      `Horizontal overflow: document.scrollWidth=${scrollWidth}px exceeds viewport width=${viewport.width}px`,
    )
  } else {
    notes.push(`No horizontal overflow (scrollWidth=${scrollWidth}px, viewport=${viewport.width}px)`)
  }

  // --- 2. Header nav mode: mobile trigger vs desktop NavigationMenu ---
  const sheetTrigger = page.getByRole('button', { name: 'Menu' })
  const desktopNav = page.locator('header nav.hidden.md\\:flex')

  const sheetTriggerVisible = await sheetTrigger.isVisible().catch(() => false)
  const desktopNavVisible = await desktopNav.isVisible().catch(() => false)

  if (viewport.width < 768) {
    if (!sheetTriggerVisible) {
      failures.push('Expected mobile SheetTrigger (hamburger button) to be visible at this width, but it is not')
    } else {
      notes.push('Mobile SheetTrigger is visible as expected')
    }
    if (desktopNavVisible) {
      failures.push('Expected desktop NavigationMenu to be hidden at this width, but it is visible')
    } else {
      notes.push('Desktop NavigationMenu correctly hidden')
    }
  } else if (viewport.width >= 1280) {
    if (!desktopNavVisible) {
      failures.push('Expected desktop NavigationMenu to be visible at this width, but it is not')
    } else {
      notes.push('Desktop NavigationMenu is visible as expected')
    }
    if (sheetTriggerVisible) {
      failures.push('Expected mobile SheetTrigger to be hidden at this width, but it is visible')
    } else {
      notes.push('Mobile SheetTrigger correctly hidden')
    }
  } else {
    // tablet (768px): informational only, no hard assertion per plan spec
    // (plan only specifies hard nav exclusivity checks at 375 and 1280).
    notes.push(
      `Tablet nav state — SheetTrigger visible=${sheetTriggerVisible}, desktopNav visible=${desktopNavVisible} (informational, matches md: breakpoint at 768px)`,
    )
  }

  // --- 3. Footer visibility + overflow + dynamic columns ---
  const footer = page.locator('footer')
  await footer.scrollIntoViewIfNeeded().catch(() => {})
  const footerBox = await footer.boundingBox().catch(() => null)

  if (!footerBox) {
    failures.push('Footer boundingBox is null — footer not visible/rendered')
  } else {
    notes.push(`Footer visible with boundingBox width=${Math.round(footerBox.width)}px height=${Math.round(footerBox.height)}px`)
    if (footerBox.width > viewport.width + OVERFLOW_MARGIN_PX) {
      failures.push(`Footer overflows viewport: boundingBox.width=${footerBox.width}px > viewport width=${viewport.width}px`)
    }
  }

  const footerScrollWidth = await page.evaluate(() => {
    const el = document.querySelector('footer')
    return el ? el.scrollWidth : null
  })
  if (footerScrollWidth !== null && footerScrollWidth > viewport.width + OVERFLOW_MARGIN_PX) {
    failures.push(`Footer scrollWidth=${footerScrollWidth}px exceeds viewport width=${viewport.width}px`)
  }

  const dynamicColumnItems = footer.locator('.grid > div h3')
  const dynamicColumnCount = await dynamicColumnItems.count().catch(() => 0)
  if (dynamicColumnCount > 0) {
    const firstVisible = await dynamicColumnItems.first().isVisible().catch(() => false)
    if (!firstVisible) {
      failures.push('Footer has column headings present in DOM but the first one is not visible')
    } else {
      notes.push(`Footer has ${dynamicColumnCount} column heading(s) visible (manual + dynamicColumns combined)`)
    }
  } else {
    notes.push('No footer column headings found (no manual columns or published dynamicColumns content yet) — not a failure')
  }

  // --- 4. Screenshot evidence ---
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const screenshotPath = path.join(SCREENSHOT_DIR, `${viewport.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  notes.push(`Screenshot saved: ${screenshotPath}`)

  await page.close()

  return { viewport, failures, notes, screenshotPath }
}

async function main() {
  const browser = await chromium.launch()
  const results = []

  try {
    for (const viewport of VIEWPORTS) {
      const result = await verifyViewport(browser, viewport)
      results.push(result)
    }
  } finally {
    await browser.close()
  }

  let anyFailed = false
  console.log('\n=== Mobile Viewport Verification (SiteHeader + SiteFooter) ===\n')
  for (const result of results) {
    const status = result.failures.length === 0 ? 'OK' : 'FAIL'
    if (result.failures.length > 0) anyFailed = true
    console.log(`--- ${result.viewport.name} (${result.viewport.width}x${result.viewport.height}) : ${status} ---`)
    for (const note of result.notes) console.log(`  [note] ${note}`)
    for (const failure of result.failures) console.log(`  [FAIL] ${failure}`)
    console.log('')
  }

  console.log(`URL tested: ${BASE_URL}${PATH_TO_VISIT}`)
  console.log(anyFailed ? 'RESULT: FAIL (see failures above)' : 'RESULT: PASS (all breakpoints OK)')

  process.exit(anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification script crashed:', err)
  process.exit(1)
})
