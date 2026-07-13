#!/usr/bin/env node
/**
 * Phase 28 Plan 04 — headless reduced-motion consistency pass.
 *
 * Same shape as scripts/verify-hero-grain-gradient.mjs's checkReducedMotion()
 * (browser.newPage({ reducedMotion: 'reduce' }), navigate, assert, screenshot)
 * but generalized across the 6 representative routes touched by Phase 28
 * (Hero variants from 28-02, blog-grid/ScrollReveal from 28-03), and adds:
 *   1. Zero hydration-mismatch console/page errors per route.
 *   2. Every [data-testid="scroll-reveal"] element present on the route
 *      settles at computed opacity:1 under prefers-reduced-motion: reduce
 *      (ScrollReveal collapses its transition to duration:0 under reduced
 *      motion, but the whileInView IntersectionObserver gate is unchanged —
 *      so this script scrolls each element into view before asserting, to
 *      exercise the real reveal path rather than only checking elements that
 *      happen to already be in the initial viewport).
 *
 * Requires a dev server already running (npm run dev) before this script is
 * executed — it does NOT spawn its own server.
 *
 * Usage:
 *   node scripts/verify-reduced-motion-phase28.mjs --base-url http://localhost:3000 --out ./28-reduced-motion-check.json
 */
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const ROUTES = ['/en', '/es', '/en/blog', '/servicios', '/en/services', '/en/seo-tecnico-lima']

const SCROLL_REVEAL_SELECTOR = '[data-testid="scroll-reveal"]'

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', out: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
  }
  return args
}

const results = {
  failures: [],
  warnings: [],
  notes: [],
  routes: {},
}

function fail(msg) {
  results.failures.push(msg)
  console.log(`  [FAIL] ${msg}`)
}
function note(msg) {
  results.notes.push(msg)
  console.log(`  [note] ${msg}`)
}

function isHydrationMessage(text) {
  return /hydrat/i.test(text) || text.includes('Warning: Text content does not match')
}

async function checkRoute(browser, baseUrl, route) {
  console.log(`\n--- Route: ${route} (reducedMotion: 'reduce') ---`)
  const page = await browser.newPage({ reducedMotion: 'reduce' })

  const consoleErrors = []
  const pageErrors = []

  // Attach listeners BEFORE navigating so nothing emitted during initial
  // load/hydration is missed.
  page.on('console', (msg) => {
    const text = msg.text()
    if (isHydrationMessage(text)) {
      consoleErrors.push({ type: msg.type(), text })
    }
  })
  page.on('pageerror', (err) => {
    if (isHydrationMessage(err.message)) {
      pageErrors.push(err.message)
    }
  })

  const routeResult = {
    route,
    hydrationConsoleErrors: [],
    hydrationPageErrors: [],
    scrollRevealCount: 0,
    scrollRevealOpacities: [],
    hydrationCheck: 'PASS',
    scrollRevealCheck: 'PASS',
  }

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)

    // 1. Hydration-mismatch console/page error check
    routeResult.hydrationConsoleErrors = consoleErrors
    routeResult.hydrationPageErrors = pageErrors
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      routeResult.hydrationCheck = 'FAIL'
      fail(`[${route}] ${consoleErrors.length} hydration console message(s), ${pageErrors.length} hydration page error(s)`)
      for (const e of consoleErrors) fail(`[${route}]   console(${e.type}): ${e.text}`)
      for (const e of pageErrors) fail(`[${route}]   pageerror: ${e}`)
    } else {
      note(`[${route}] zero hydration-mismatch console/page errors`)
    }

    // 2. ScrollReveal opacity check (scroll each into view, then assert)
    const scrollRevealLocator = page.locator(SCROLL_REVEAL_SELECTOR)
    const count = await scrollRevealLocator.count()
    routeResult.scrollRevealCount = count

    if (count === 0) {
      note(`[${route}] no [data-testid="scroll-reveal"] elements present (not necessarily a failure — Hero-only routes may not have any)`)
    } else {
      note(`[${route}] ${count} scroll-reveal element(s) found`)
      // Only assert the first element per the plan's must-have wording, but
      // scroll every element into view and record opacity for full evidence.
      const maxCheck = count
      for (let i = 0; i < maxCheck; i++) {
        const el = scrollRevealLocator.nth(i)
        await el.scrollIntoViewIfNeeded()
        await page.waitForTimeout(200) // let whileInView's observer fire + duration:0 transition settle
        const opacity = await el.evaluate((node) => getComputedStyle(node).opacity)
        routeResult.scrollRevealOpacities.push({ index: i, opacity })
        if (opacity !== '1') {
          routeResult.scrollRevealCheck = 'FAIL'
          fail(`[${route}] scroll-reveal element #${i} computed opacity is "${opacity}", expected "1" under reduced-motion emulation`)
        }
      }
      if (routeResult.scrollRevealCheck === 'PASS') {
        note(`[${route}] all ${count} scroll-reveal element(s) at opacity:1 under reduced-motion emulation`)
      }
    }
  } catch (err) {
    routeResult.hydrationCheck = 'FAIL'
    fail(`[${route}] navigation/check crashed: ${err.message}`)
  }

  results.routes[route] = routeResult
  await page.close()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const browser = await chromium.launch()

  try {
    for (const route of ROUTES) {
      await checkRoute(browser, args.baseUrl, route)
    }
  } finally {
    await browser.close()
  }

  console.log('\n=== Phase 28 Reduced-Motion Verification Summary ===')
  console.log(`Notes: ${results.notes.length}`)
  console.log(`Warnings: ${results.warnings.length}`)
  console.log(`Failures: ${results.failures.length}`)
  console.log(`URL tested: ${args.baseUrl}`)

  if (args.out) {
    await writeFile(args.out, JSON.stringify(results, null, 2))
    console.log(`\nResults written to ${args.out}`)
  }

  console.log(results.failures.length > 0 ? 'RESULT: FAIL (see failures above)' : 'RESULT: PASS (all hard assertions OK)')
  process.exit(results.failures.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('verify-reduced-motion-phase28.mjs crashed:', err)
  process.exit(1)
})
