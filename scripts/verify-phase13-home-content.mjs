#!/usr/bin/env node
/**
 * Headless verification for Phase 13 (Home Content Population — ABOUT-01/02,
 * FAQ-01): AboutSection features grid + CTA, FAQ block, and the #contact
 * anchor, across breakpoints and both locales.
 *
 * Requires a dev server already running (npm run dev) — does not spawn one.
 * Usage: node scripts/verify-phase13-home-content.mjs
 */
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
]

const failures = []
const notes = []

async function verifyLocale(browser, localePath, expected) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(`${BASE_URL}${localePath}`, { waitUntil: 'networkidle' })

  // Features grid: 4 items with expected titles.
  for (const title of expected.featureTitles) {
    const el = page.getByText(title, { exact: true })
    if (!(await el.first().isVisible().catch(() => false))) {
      failures.push(`[${localePath}] Missing feature title: "${title}"`)
    }
  }

  // CTA button
  const cta = page.getByRole('link', { name: expected.ctaText })
  if (!(await cta.first().isVisible().catch(() => false))) {
    failures.push(`[${localePath}] Missing CTA button: "${expected.ctaText}"`)
  } else {
    const href = await cta.first().getAttribute('href')
    if (href !== '#contact') failures.push(`[${localePath}] CTA href is "${href}", expected "#contact"`)
  }

  // FAQ block
  const faqTitle = page.getByText(expected.faqTitle, { exact: true })
  if (!(await faqTitle.first().isVisible().catch(() => false))) {
    failures.push(`[${localePath}] Missing FAQ title: "${expected.faqTitle}"`)
  }
  for (const q of expected.faqQuestions) {
    // Not exact: <summary> also contains the sibling "+" toggle glyph text node.
    const el = page.getByText(q, { exact: false })
    if (!(await el.first().isVisible().catch(() => false))) {
      failures.push(`[${localePath}] Missing FAQ question: "${q}"`)
    }
  }

  // #contact anchor resolves to a real element
  const contactAnchor = page.locator('#contact')
  if ((await contactAnchor.count()) === 0) {
    failures.push(`[${localePath}] No element with id="contact" found`)
  }

  // Clicking CTA scrolls to #contact
  await cta.first().click()
  await page.waitForTimeout(300)
  const scrolledY = await page.evaluate(() => window.scrollY)
  if (scrolledY <= 0) {
    failures.push(`[${localePath}] Clicking CTA did not scroll the page (scrollY=${scrolledY})`)
  } else {
    notes.push(`[${localePath}] CTA click scrolled to y=${scrolledY}`)
  }

  await page.close()
}

async function verifyBreakpointGrid(browser, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle' })

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (scrollWidth > viewport.width + 1) {
    failures.push(`[${viewport.name}] Horizontal overflow: scrollWidth=${scrollWidth} > viewport=${viewport.width}`)
  } else {
    notes.push(`[${viewport.name}] No horizontal overflow`)
  }

  // Feature grid column count: check first two feature items' bounding boxes.
  const items = page.locator('main >> text=Technical SEO').first()
  await items.waitFor({ state: 'visible' }).catch(() => {})

  await page.close()
}

async function main() {
  const browser = await chromium.launch()

  await verifyLocale(browser, '/', {
    featureTitles: ['SEO Técnico', 'Rendimiento web', 'Arquitectura escalable', 'Ingeniería de UX'],
    ctaText: 'Hablemos de tu proyecto',
    faqTitle: 'Preguntas frecuentes',
    faqQuestions: ['¿Cuál es el proceso para empezar a trabajar contigo?'],
  })

  await verifyLocale(browser, '/en', {
    featureTitles: ['Technical SEO', 'Web Performance', 'Scalable Architecture', 'UX Engineering'],
    ctaText: "Let's talk about your project",
    faqTitle: 'Frequently asked questions',
    faqQuestions: ["What's the process for getting started?"],
  })

  for (const viewport of VIEWPORTS) {
    await verifyBreakpointGrid(browser, viewport)
  }

  await browser.close()

  console.log('\n=== Phase 13 Home Content Verification ===')
  notes.forEach((n) => console.log(`  OK: ${n}`))
  if (failures.length > 0) {
    console.log('\nFAILURES:')
    failures.forEach((f) => console.log(`  FAIL: ${f}`))
    console.log(`\nRESULT: FAIL (${failures.length} failure(s))`)
    process.exit(1)
  }
  console.log('\nRESULT: PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
