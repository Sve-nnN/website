#!/usr/bin/env node
/**
 * Real Chromium-headless verification for the home Hero's GrainGradient
 * WebGL shader background (Phase 16-03, HERO-ANIM-01/02/03/04).
 *
 * Requires a dev server already running (npm run dev) before this script is
 * executed — it does NOT spawn its own server. Override the target with
 * BASE_URL (defaults to http://localhost:3000).
 *
 * Usage:
 *   npm run dev &            # in a separate terminal / background process
 *   node scripts/verify-hero-grain-gradient.mjs
 *
 * Checks (per locale, at 1280x800 unless noted):
 *   1. [data-testid="hero-grain-gradient"] present, data-motion="live" by default
 *   2. <canvas> inside that wrapper with non-zero bounding box (shader actually painted)
 *   3. Coarse color sanity check (average RGB in the dark-navy family) — WARN only, not FAIL
 *   4. No horizontal overflow at 375/768/1280px
 *   5. Title/subtitle/CTA text present and unchanged (HERO-ANIM-03)
 *   6. prefers-reduced-motion: reduce emulation -> data-motion="reduced"
 *   7. Screenshots captured for the written report + Juan's final visual pass
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOT_DIR = path.join(__dirname, '.mobile-verify-screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const OVERFLOW_MARGIN_PX = 1

// Coarse dark-navy-family sanity threshold — the shader's dominant/mid stops
// are all #12141C/#23283A/#3A4159-family dark navy; the ember stop is only a
// minority weighting. Average R/G/B should stay well below a bright/white
// value. This is NOT a pixel-perfect hex match (animated noise + the "wave"
// shape's undulation make exact assertions unreliable).
const COLOR_WARN_THRESHOLD = 90

const HERO_WRAPPER_SELECTOR = '[data-testid="hero-grain-gradient"]'

const LOCALES = [
  { path: '/es', ctaText: 'Ver case studies', label: 'es' },
  { path: '/en', ctaText: 'View Case Studies', label: 'en' },
]

const VIEWPORTS = [375, 768, 1280]

const results = {
  failures: [],
  warnings: [],
  notes: [],
  screenshots: [],
}

function fail(msg) {
  results.failures.push(msg)
  console.log(`  [FAIL] ${msg}`)
}
function warn(msg) {
  results.warnings.push(msg)
  console.log(`  [WARN] ${msg}`)
}
function note(msg) {
  results.notes.push(msg)
  console.log(`  [note] ${msg}`)
}

async function averageColorOfBoundingBox(page, box) {
  const buffer = await page.screenshot({ clip: box })
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels
  let r = 0
  let g = 0
  let b = 0
  const pixelCount = data.length / channels
  for (let i = 0; i < data.length; i += channels) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  return { r: r / pixelCount, g: g / pixelCount, b: b / pixelCount }
}

async function checkLocale(browser, locale) {
  console.log(`\n--- Locale: ${locale.label} (${locale.path}) at 1280x800 ---`)
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`${BASE_URL}${locale.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500) // let the shader paint at least one frame

  // 1. Wrapper present, data-motion=live by default (no reduced-motion emulation here)
  const wrapper = page.locator(HERO_WRAPPER_SELECTOR)
  const wrapperCount = await wrapper.count()
  if (wrapperCount === 0) {
    fail(`[${locale.label}] ${HERO_WRAPPER_SELECTOR} not found on the page`)
  } else {
    note(`[${locale.label}] hero-grain-gradient wrapper present`)
    const motion = await wrapper.getAttribute('data-motion')
    if (motion !== 'live') {
      fail(`[${locale.label}] Expected data-motion="live" by default, got "${motion}"`)
    } else {
      note(`[${locale.label}] data-motion="live" as expected (no reduced-motion emulation)`)
    }
  }

  // 2. Canvas present with non-zero bounding box
  let heroBox = null
  if (wrapperCount > 0) {
    const canvas = wrapper.locator('canvas')
    const canvasCount = await canvas.count()
    if (canvasCount === 0) {
      fail(`[${locale.label}] No <canvas> element found inside the shader wrapper`)
    } else {
      const box = await canvas.first().boundingBox()
      if (!box || box.width === 0 || box.height === 0) {
        fail(`[${locale.label}] Canvas boundingBox is missing or zero-size: ${JSON.stringify(box)}`)
      } else {
        note(`[${locale.label}] Canvas painted with boundingBox ${Math.round(box.width)}x${Math.round(box.height)}`)
        heroBox = await wrapper.boundingBox()
      }
    }
  }

  // 3. Coarse color sanity check (WARN only)
  if (heroBox) {
    try {
      const avg = await averageColorOfBoundingBox(page, heroBox)
      const inRange = avg.r < COLOR_WARN_THRESHOLD && avg.g < COLOR_WARN_THRESHOLD && avg.b < COLOR_WARN_THRESHOLD
      const avgStr = `R=${avg.r.toFixed(1)} G=${avg.g.toFixed(1)} B=${avg.b.toFixed(1)}`
      if (inRange) {
        note(`[${locale.label}] Coarse color check: average ${avgStr} — within dark-navy-family range (< ${COLOR_WARN_THRESHOLD})`)
      } else {
        warn(
          `[${locale.label}] Coarse color check: average ${avgStr} — outside expected dark-navy-family range (< ${COLOR_WARN_THRESHOLD}). This is a rough approximation (animated noise, ember minority stop); not proof of a color defect — see report for a human visual judgment call.`,
        )
      }
    } catch (err) {
      warn(`[${locale.label}] Coarse color check failed to run: ${err.message}`)
    }
  }

  // 5. Content-unchanged check
  const title = page.locator('section h1').first()
  const titleText = await title.textContent().catch(() => null)
  if (!titleText || !titleText.trim()) {
    fail(`[${locale.label}] Hero title (section h1) has no text`)
  } else {
    note(`[${locale.label}] Title present: "${titleText.trim()}"`)
  }

  const subtitle = page.locator('section p').first()
  const subtitleCount = await subtitle.count()
  if (subtitleCount > 0) {
    const subtitleText = await subtitle.textContent().catch(() => null)
    if (!subtitleText || !subtitleText.trim()) {
      fail(`[${locale.label}] Hero subtitle (section p) present in DOM but has no text`)
    } else {
      note(`[${locale.label}] Subtitle present: "${subtitleText.trim()}"`)
    }
  } else {
    note(`[${locale.label}] No subtitle element found (not necessarily a failure)`)
  }

  const cta = page.locator(`section a:has-text("${locale.ctaText}")`).first()
  const ctaVisible = await cta.isVisible().catch(() => false)
  if (!ctaVisible) {
    fail(`[${locale.label}] CTA link with text "${locale.ctaText}" not visible`)
  } else {
    note(`[${locale.label}] CTA "${locale.ctaText}" is visible`)
  }

  // 7. Screenshot
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const screenshotPath = path.join(SCREENSHOT_DIR, `home-${locale.label}-1280.png`)
  await page.screenshot({ path: screenshotPath })
  results.screenshots.push(screenshotPath)
  note(`[${locale.label}] Screenshot saved: ${screenshotPath}`)

  await page.close()
}

async function checkOverflow(browser) {
  console.log(`\n--- Overflow check (locale: es) ---`)
  for (const width of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height: 800 } })
    await page.goto(`${BASE_URL}/es`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    if (scrollWidth > width + OVERFLOW_MARGIN_PX) {
      fail(`Horizontal overflow at ${width}px: document.scrollWidth=${scrollWidth}px`)
    } else {
      note(`No horizontal overflow at ${width}px (scrollWidth=${scrollWidth}px)`)
    }

    if (width === 375 || width === 768) {
      await mkdir(SCREENSHOT_DIR, { recursive: true })
      const screenshotPath = path.join(SCREENSHOT_DIR, `home-es-${width}.png`)
      await page.screenshot({ path: screenshotPath })
      results.screenshots.push(screenshotPath)
      note(`Screenshot saved: ${screenshotPath}`)
    }

    await page.close()
  }
}

async function checkReducedMotion(browser) {
  console.log(`\n--- Reduced-motion emulation check (locale: es) ---`)
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  })
  await page.goto(`${BASE_URL}/es`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  const wrapper = page.locator(HERO_WRAPPER_SELECTOR)
  const motion = await wrapper.getAttribute('data-motion').catch(() => null)
  if (motion !== 'reduced') {
    fail(`Expected data-motion="reduced" with prefers-reduced-motion: reduce emulated, got "${motion}"`)
  } else {
    note(`data-motion="reduced" correctly reflects prefers-reduced-motion: reduce emulation`)
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const screenshotPath = path.join(SCREENSHOT_DIR, 'home-es-reduced-motion.png')
  await page.screenshot({ path: screenshotPath })
  results.screenshots.push(screenshotPath)
  note(`Screenshot saved: ${screenshotPath}`)

  await page.close()
}

async function main() {
  const browser = await chromium.launch()

  try {
    for (const locale of LOCALES) {
      await checkLocale(browser, locale)
    }
    await checkOverflow(browser)
    await checkReducedMotion(browser)
  } finally {
    await browser.close()
  }

  console.log('\n=== Hero GrainGradient Verification Summary ===')
  console.log(`Notes: ${results.notes.length}`)
  console.log(`Warnings (non-blocking): ${results.warnings.length}`)
  console.log(`Failures (blocking): ${results.failures.length}`)
  console.log(`Screenshots: ${results.screenshots.length}`)
  for (const s of results.screenshots) console.log(`  - ${s}`)

  console.log(`\nURL tested: ${BASE_URL}`)
  console.log(results.failures.length > 0 ? 'RESULT: FAIL (see failures above)' : 'RESULT: PASS (all hard assertions OK)')

  process.exit(results.failures.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification script crashed:', err)
  process.exit(1)
})
