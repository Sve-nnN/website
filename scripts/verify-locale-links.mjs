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

const BASE = (process.env.VERIFY_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')

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
/**
 * `href="/"` — a link to the bare site root, which IS the Spanish home URL.
 * Deliberately its own constant: `UNPREFIXED_SECTION` above only matches the
 * named content sections, so a root href matched nothing at all. That gap is
 * exactly how the `/en` breadcrumb "Home" link kept pointing at the Spanish
 * home page through a whole sitewide sweep.
 */
const BARE_ROOT_HREF = /href="\/"/g
/** `href="/services…"` — the English services segment with no locale in front. */
const UNPREFIXED_EN_SERVICES = /href="\/services(?=[/"?#])/g
/** `href="/servicios…"` — the Spanish services segment, unprefixed. */
const UNPREFIXED_ES_SERVICES = /href="\/servicios(?=[/"?#])/g

// ---------------------------------------------------------------------------
// Scoping helpers
// ---------------------------------------------------------------------------

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

/**
 * Concatenation of every breadcrumb `<nav>` on the page. Scoping is required,
 * not cosmetic: the header logo legitimately renders a root href on Spanish
 * pages and the locale switcher does the same on English ones, so asserting
 * root-href absence document-wide would false-fail on both.
 *
 * `aria-label="Breadcrumb"` is the marker because BOTH renderers emit it —
 * `src/blocks/Hero/Component.tsx` (CMS-authored crumb urls, the leaky one) and
 * `src/components/Breadcrumbs.tsx` plus the inline trails in the websites and
 * case-study routes (helper-built urls from `src/lib/breadcrumbs.ts`). One
 * helper therefore covers both sources. `<nav>` never nests, so a non-greedy
 * match to the first `</nav>` is exact.
 */
function breadcrumbSlice(html) {
  const navs = [...html.matchAll(/<nav\b[^>]*aria-label="Breadcrumb"[^>]*>.*?<\/nav>/gis)]
  return navs.map((m) => m[0]).join('\n')
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

// 2. Unprefixed-internal guard on every /en page, WHOLE DOCUMENT — header,
//    main and footer. The footer used to be sliced off here (it was deferred
//    work held by another session) and `/en` was skipped entirely because the
//    home page renders the ServicesShowcase block. Both are in scope now, so
//    both are asserted.
for (const path of EN_PAGES) {
  const page = pages.get(path)
  if (!page) continue
  const scoped = stripLocaleSwitcher(page.html)
  assertNone('no unprefixed section href', scoped, UNPREFIXED_SECTION, page.url)
}

// 3. Positive proof — absence alone must not be able to pass this suite.
const blogPage = pages.get(`/${EN}/blog`)
if (blogPage) {
  assertSome(
    'at least one prefixed blog href',
    blogPage.html,
    new RegExp(`href="/${EN}/blog/`, 'g'),
    blogPage.url,
  )
}
const casePage = pages.get(`/${EN}/case-studies`)
if (casePage) {
  assertSome(
    'at least one prefixed case-study href',
    casePage.html,
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
  // Whole document, footer included — it is in scope now.
  const scoped = stripLocaleSwitcher(page.html)
  assertNone('no locale prefix leaked into Spanish', scoped, ANY_PREFIXED, page.url)
  assertSome('Spanish section hrefs still unprefixed', scoped, UNPREFIXED_SECTION, page.url)
}

// 6. Breadcrumb trails, scoped to their own <nav>. The trail is the one place
//    where a link to the BARE SITE ROOT is meaningful, and the root href is the
//    shape assertion 2 structurally cannot see (it only knows the named content
//    sections). `Hero.breadcrumbs` is a CMS array whose `label` is localized
//    and whose `url` is not, so one url value is shared by both locales — an
//    English reader clicking "Home" landed on the Spanish home page.
let breadcrumbPagesSeen = 0

for (const path of EN_PAGES) {
  const page = pages.get(path)
  if (!page) continue
  const crumbs = breadcrumbSlice(page.html)
  if (!crumbs) continue
  breadcrumbPagesSeen++
  const label = `${page.url} (breadcrumb)`
  assertNone('breadcrumb has no link to the bare site root', crumbs, BARE_ROOT_HREF, label)
  assertNone('breadcrumb has no unprefixed section href', crumbs, UNPREFIXED_SECTION, label)
  // Positive half: absence must never be able to pass on its own.
  assertSome('breadcrumb has a locale-prefixed href', crumbs, ANY_PREFIXED, label)
}

for (const path of ES_CONTROLS) {
  const page = pages.get(path)
  if (!page) continue
  const crumbs = breadcrumbSlice(page.html)
  if (!crumbs) continue
  breadcrumbPagesSeen++
  const label = `${page.url} (breadcrumb)`
  // No-regression half — the Spanish trail must keep pointing at the root.
  assertSome('Spanish breadcrumb still links the bare site root', crumbs, BARE_ROOT_HREF, label)
  assertNone('no locale prefix leaked into Spanish breadcrumb', crumbs, ANY_PREFIXED, label)
}

// Coverage guard: an assertion that silently matches nothing is worse than no
// assertion at all — this suite already fails a non-200 fetch for the same
// reason.
if (breadcrumbPagesSeen === 0) {
  fail('breadcrumb coverage', 'no fetched page rendered a <nav aria-label="Breadcrumb">')
} else {
  pass(`breadcrumb coverage — ${breadcrumbPagesSeen} page(s) inspected`)
}

// 7. Services-segment latch. The services URL segment is itself translated
//    (`/servicios` vs `/services`), so an unprefixed English segment or a
//    Spanish segment surfacing on an /en page both mean the reader was handed
//    the wrong locale. Both hold on production today — this locks the good
//    state rather than fixing a live defect.
for (const [path, page] of pages) {
  const scoped = stripLocaleSwitcher(page.html)
  assertNone('no unprefixed English services href', scoped, UNPREFIXED_EN_SERVICES, page.url)
  if (EN_PAGES.includes(path)) {
    assertNone('no Spanish services href on an /en page', scoped, UNPREFIXED_ES_SERVICES, page.url)
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
