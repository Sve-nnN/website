#!/usr/bin/env node
/**
 * Asserts that internal hrefs rendered on `/en` pages carry the locale prefix,
 * and that Spanish pages still render the unprefixed hrefs they always did.
 *
 * This exists because `routing.ts` uses `localePrefix: 'as-needed'` with
 * `defaultLocale: 'es'`, so an unprefixed path IS the Spanish URL. The
 * middleware only rewrites INCOMING requests — nothing rewrites an outgoing
 * href — so a plain `<Link href="/blog/x">` on an /en page silently drops the
 * reader into Spanish. The fix (the locale-aware `Link` in
 * `src/i18n/navigation.ts`) happens at render time, which is why this script
 * asserts against real rendered HTML from a live server rather than reading
 * source.
 *
 * Usage:
 *   npm run dev                       # in another terminal
 *   node scripts/verify-locale-links.mjs
 *   VERIFY_BASE_URL=https://… node scripts/verify-locale-links.mjs
 *
 * Zero dependencies. Exit 0 = every assertion passed, exit 1 = at least one
 * failed (each failure prints the URL and the offending match).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// ---------------------------------------------------------------------------
// Locale list — read from routing.ts so this script and the middleware can
// never drift. Parsed with a regex rather than imported, because this is a
// plain .mjs script and routing.ts is TypeScript.
// ---------------------------------------------------------------------------
const here = dirname(fileURLToPath(import.meta.url))
const routingSource = readFileSync(join(here, '..', 'src', 'i18n', 'routing.ts'), 'utf8')

const localesMatch = routingSource.match(/locales:\s*\[([^\]]*)\]/)
if (!localesMatch) {
  console.error('FATAL: could not read `locales` out of src/i18n/routing.ts')
  process.exit(1)
}
const LOCALES = [...localesMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])

const defaultMatch = routingSource.match(/defaultLocale:\s*['"]([^'"]+)['"]/)
if (!defaultMatch) {
  console.error('FATAL: could not read `defaultLocale` out of src/i18n/routing.ts')
  process.exit(1)
}
const DEFAULT_LOCALE = defaultMatch[1]
const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE)

// The site's top-level content sections. An href hitting one of these without a
// locale segment is, by definition, the Spanish URL.
const SECTION_ROOTS = ['blog', 'case-studies', 'authors', 'websites']

const localeAlt = LOCALES.join('|')
const sectionAlt = SECTION_ROOTS.join('|')

/** `href="/en/es/…"` — a second locale segment stacked on the first. */
const DOUBLE_PREFIX = new RegExp(`href="/(?:${localeAlt})/(?:${localeAlt})(?=[/"?#])`, 'g')
/** `href="/blog/…"`, `href="/authors"`, … with no locale segment in front. */
const UNPREFIXED_SECTION = new RegExp(`href="/(?:${sectionAlt})(?=[/"?#])`, 'g')
/** Any href that starts with a non-default locale segment. */
const ANY_PREFIXED = new RegExp(
  `href="/(?:${PREFIXED_LOCALES.join('|')})(?=[/"?#])`,
  'g',
)

// ---------------------------------------------------------------------------
// Scoping helpers
// ---------------------------------------------------------------------------

/**
 * Everything up to the LAST closing main tag: keeps the header (in scope — it
 * links through CMSLink, which is fixed) and the page's own main content, and
 * drops the footer, which is deferred work and still renders unprefixed hrefs.
 */
function sliceBeforeFooter(html) {
  const end = html.lastIndexOf('</main>')
  return end === -1 ? html : html.slice(0, end)
}

/** Everything before the page's own main element — i.e. the site header. */
function headerSlice(html) {
  const start = html.indexOf('<main')
  return start === -1 ? html : html.slice(0, start)
}

/**
 * Removes the locale switcher's own anchors. They are cross-locale by design:
 * on an /en page the switcher points at the unprefixed Spanish URL, and on a
 * Spanish page it points at /en — both correct, both would otherwise trip the
 * negative assertions. next-intl-independent marker: the switcher is the only
 * anchor in the tree that carries an explicit `hreflang` naming a site locale.
 */
function stripLocaleSwitcher(html) {
  const anchors = new RegExp(`<a\\b[^>]*hreflang="(?:${localeAlt})"[^>]*>.*?</a>`, 'gis')
  return html.replace(anchors, '')
}

// ---------------------------------------------------------------------------
// Assertion plumbing
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function pass(label) {
  passed++
  console.log(`PASS  ${label}`)
}

function fail(label, detail) {
  failed++
  console.error(`FAIL  ${label}`)
  if (detail) console.error(`      ${detail}`)
}

function assertNone(label, html, pattern, url) {
  const hits = [...html.matchAll(pattern)].map((m) => m[0])
  if (hits.length === 0) pass(`${label} — ${url}`)
  else fail(`${label} — ${url}`, `${hits.length} offending href(s): ${[...new Set(hits)].join(', ')}`)
}

function assertSome(label, html, pattern, url) {
  const hits = [...html.matchAll(pattern)].map((m) => m[0])
  if (hits.length > 0) pass(`${label} — ${url} (${hits.length} match(es))`)
  else fail(`${label} — ${url}`, 'expected at least one match, found none')
}

async function fetchPage(path) {
  const url = `${BASE}${path}`
  let res
  try {
    res = await fetch(url, { redirect: 'follow' })
  } catch (err) {
    fail(`fetch ${url}`, err.message)
    return null
  }
  // A silent 404/500 must never read as a pass — every negative assertion below
  // would trivially hold on an error page.
  if (res.status !== 200) {
    fail(`fetch ${url}`, `expected 200, got ${res.status}`)
    return null
  }
  return { url, html: await res.text() }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const EN = PREFIXED_LOCALES[0] // 'en'

const EN_PAGES = [`/${EN}`, `/${EN}/blog`, `/${EN}/case-studies`, `/${EN}/websites`, `/${EN}/authors`]
const ES_CONTROLS = ['/blog', '/case-studies', '/websites']

console.log(`Verifying locale-prefixed hrefs against ${BASE}`)
console.log(`locales=[${LOCALES.join(', ')}] default=${DEFAULT_LOCALE}\n`)

const pages = new Map()
for (const path of [...EN_PAGES, ...ES_CONTROLS]) {
  const page = await fetchPage(path)
  if (page) pages.set(path, page)
}

// 1. Double-prefix guard — on the FULL document of every page, footer included.
//    The single most important regression check: it catches any file where a
//    locale-aware Link was pointed at an href that was already prefixed.
for (const [path, { url, html }] of pages) {
  assertNone('no stacked double locale segment', html, DOUBLE_PREFIX, url)
  void path
}

// 2. Unprefixed-internal guard on each /en section page.
//    `/en` (home) is excluded on purpose: it renders the deferred
//    ServicesShowcase block, which still emits unprefixed hrefs until the
//    follow-up lands.
for (const path of EN_PAGES.filter((p) => p !== `/${EN}`)) {
  const page = pages.get(path)
  if (!page) continue
  const scoped = stripLocaleSwitcher(sliceBeforeFooter(page.html))
  assertNone('no unprefixed section href', scoped, UNPREFIXED_SECTION, page.url)
}

// 3. Positive proof — absence alone must not be able to pass this suite.
const blogPage = pages.get(`/${EN}/blog`)
if (blogPage) {
  assertSome(
    'at least one prefixed blog href',
    sliceBeforeFooter(blogPage.html),
    new RegExp(`href="/${EN}/blog/`, 'g'),
    blogPage.url,
  )
}
const casePage = pages.get(`/${EN}/case-studies`)
if (casePage) {
  assertSome(
    'at least one prefixed case-study href',
    sliceBeforeFooter(casePage.html),
    new RegExp(`href="/${EN}/case-studies/`, 'g'),
    casePage.url,
  )
}

// 4. Header proof on /en — nav items and the CTA come from the Header global
//    through CMSLink, so this is where an admin-authored href would leak.
const enHome = pages.get(`/${EN}`)
if (enHome) {
  const header = stripLocaleSwitcher(headerSlice(enHome.html))
  assertSome('header has a locale-prefixed href', header, ANY_PREFIXED, `${enHome.url} (header)`)
  assertNone('header has no unprefixed section href', header, UNPREFIXED_SECTION, `${enHome.url} (header)`)
}

// 5. Spanish no-regression — the default locale must render exactly what it
//    rendered before: unprefixed internal hrefs, and no /en leaking in.
for (const path of ES_CONTROLS) {
  const page = pages.get(path)
  if (!page) continue
  const scoped = stripLocaleSwitcher(sliceBeforeFooter(page.html))
  assertNone('no locale prefix leaked into Spanish', scoped, ANY_PREFIXED, page.url)
  assertSome('Spanish section hrefs still unprefixed', scoped, UNPREFIXED_SECTION, page.url)
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
