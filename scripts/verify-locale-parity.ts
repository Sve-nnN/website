/**
 * Locale-parity verification (Phase 30 Plan 04, VOICE-07 close-out).
 *
 * Reads every collection/global this phase (30-01/02/03) actually rewrote,
 * using the SAME `locale: 'all'` traversal shape as
 * scripts/content-humanization-snapshot.ts (do not modify that script, this
 * is a sibling verification tool). With `locale: 'all'`, Payload returns
 * ONLY genuinely-localized fields as `{ es, en }` objects — non-localized
 * fields (URLs, proper nouns, ids) come back as plain scalars. That means a
 * generic walk that treats any `{ es, en }`-shaped object as "one localized
 * field" naturally reproduces the 29-FIELD-AUDIT.md allowlist without having
 * to hand-enumerate every block type's field paths: fields NOT in the audit
 * table (non-localized) simply never take this shape, so they can never be
 * flagged here.
 *
 * A field FAILS parity only when it is asymmetric — one locale has content
 * and the other is empty/null. Fields that are legitimately unset in BOTH
 * locales (e.g. Hero.cityName/inlineStat outside the local-landing variant,
 * Authors.education[].description when not filled in) are not a locale
 * collapse and are not flagged.
 *
 * Two named regression checks (the two known bugs fixed in Plan 30-01) are
 * asserted explicitly in addition to the generic walk:
 *   - Header.ctaButton.label.es must no longer be the collapsed English
 *     default "Get in Touch"
 *   - Footer.legalLinks[2].label.en (the /sitemap.html entry) must be
 *     non-empty
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-locale-parity.ts
 *
 * Exits 0 only if every localized field across every touched
 * collection/global has parity AND both named regression checks pass.
 * Exits 1 otherwise (real gate, not just a printout).
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const COLLECTIONS = [
  'pages',
  'authors',
  'testimonials',
  'speaking-events',
  'categories',
  'posts',
  'case-studies',
] as const
const GLOBALS = ['header', 'footer'] as const

type LocalizedPair = { es: unknown; en: unknown }

type Issue = {
  location: string
  path: string
  detail: string
}

const issues: Issue[] = []
let passCount = 0
let bothEmptyCount = 0

// A localized field's raw shape from `locale: 'all'` is NOT always a clean
// { es, en } pair — when a doc was authored/migrated with ONE locale never
// populated at all, Payload omits that locale's key entirely (not `null`),
// e.g. `{ es: "..." }` with no `en` key whatsoever. The original check here
// required exactly 2 keys, which silently treated single-key nodes as "not
// a localized field" and skipped them in walk() — meaning a doc entirely
// missing one locale (e.g. Posts ids 9, 35-38, 56-58, confirmed during
// Plan 31-16's diff pass) would NEVER be flagged as an asymmetric parity
// failure, exactly the class of bug this script exists to catch. Fixed
// (Plan 31-16, Rule 1) to accept any object whose keys are a non-empty
// subset of { es, en } (1 or 2 keys) — a missing key is then correctly
// treated as empty by isEmpty()/extractText(undefined) below, which
// surfaces the real asymmetry.
function isLocalizedPair(node: unknown): node is LocalizedPair {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return false
  const keys = Object.keys(node as Record<string, unknown>)
  if (keys.length === 0 || keys.length > 2) return false
  return keys.every((k) => k === 'es' || k === 'en')
}

// Collects all Lexical `text` leaf values (handles richText trees), or the
// string/number/boolean itself, or joins array/object member text.
function extractText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(extractText).join('')
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    let out = ''
    if (typeof obj.text === 'string') out += obj.text
    if (Array.isArray(obj.children)) out += extractText(obj.children)
    if (!('text' in obj) && !('children' in obj)) {
      // Generic object (not a recognized Lexical node shape) — walk all
      // values defensively so no nested text is missed.
      out += Object.values(obj).map(extractText).join('')
    }
    return out
  }
  return ''
}

function isEmpty(value: unknown): boolean {
  return extractText(value).trim().length === 0
}

function walk(node: unknown, location: string, path: string): void {
  if (node === null || node === undefined) return

  if (isLocalizedPair(node)) {
    const { es, en } = node
    const esEmpty = isEmpty(es)
    const enEmpty = isEmpty(en)
    if (esEmpty !== enEmpty) {
      issues.push({
        location,
        path,
        detail: `asymmetric — es=${esEmpty ? 'EMPTY' : 'ok'} en=${enEmpty ? 'EMPTY' : 'ok'}`,
      })
    } else if (esEmpty && enEmpty) {
      bothEmptyCount += 1
    } else {
      passCount += 1
    }
    return
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, location, `${path}[${i}]`))
    return
  }

  if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      walk(value, location, path ? `${path}.${key}` : key)
    }
  }
}

function docLocation(collection: string, doc: Record<string, unknown>): string {
  const slug = doc.slug
  const identifier = typeof slug === 'string' ? slug : JSON.stringify(doc.id)
  return `${collection}/${identifier}`
}

async function main() {
  const payload = await getPayload({ config })

  console.log('Walking collections:', COLLECTIONS.join(', '))
  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({
      collection,
      limit: 0,
      locale: 'all',
      depth: 0,
    })
    for (const doc of docs as Array<Record<string, unknown>>) {
      const location = docLocation(collection, doc)
      walk(doc, location, '')
    }
    console.log(`  ${collection}: ${docs.length} docs walked`)
  }

  console.log('\nWalking globals:', GLOBALS.join(', '))
  const globalDocs: Record<string, Record<string, unknown>> = {}
  for (const slug of GLOBALS) {
    const doc = await payload.findGlobal({ slug, locale: 'all' })
    globalDocs[slug] = doc as unknown as Record<string, unknown>
    walk(doc, `global/${slug}`, '')
    console.log(`  global/${slug}: walked`)
  }

  console.log(`\nFields with parity: ${passCount}`)
  console.log(`Fields legitimately empty in both locales (not a regression): ${bothEmptyCount}`)
  console.log(`Asymmetric parity failures: ${issues.length}`)

  if (issues.length > 0) {
    console.log('\nFAILURES:')
    for (const issue of issues) {
      console.log(`  [${issue.location}] ${issue.path}: ${issue.detail}`)
    }
  }

  // --- Named regression checks (Plan 30-01 known bugs) ---
  console.log('\nNamed regression checks:')
  let namedFailed = false

  const ctaLabel = (globalDocs.header?.ctaButton as { label?: { es?: unknown } } | undefined)
    ?.label
  const ctaEs = ctaLabel?.es
  if (typeof ctaEs !== 'string' || ctaEs === 'Get in Touch') {
    console.log(
      `  FAIL: Header.ctaButton.label.es is still the collapsed English default ("${String(ctaEs)}")`,
    )
    namedFailed = true
  } else {
    console.log(`  PASS: Header.ctaButton.label.es = "${ctaEs}" (no longer collapsed)`)
  }

  const legalLinks = (globalDocs.footer?.legalLinks as
    | Array<{ label?: { en?: unknown } }>
    | undefined) ?? []
  const thirdLegalLink = legalLinks[2]
  const legalLinkEn = thirdLegalLink?.label?.en
  if (!thirdLegalLink) {
    console.log('  FAIL: Footer.legalLinks[2] does not exist (expected the /sitemap.html entry)')
    namedFailed = true
  } else if (typeof legalLinkEn !== 'string' || legalLinkEn.trim().length === 0) {
    console.log(
      `  FAIL: Footer.legalLinks[2].label.en is empty/missing ("${String(legalLinkEn)}")`,
    )
    namedFailed = true
  } else {
    console.log(`  PASS: Footer.legalLinks[2].label.en = "${legalLinkEn}" (no longer missing)`)
  }

  const failed = issues.length > 0 || namedFailed
  console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS')
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
