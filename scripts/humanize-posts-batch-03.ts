/**
 * Phase 31 Plan 04 (VOICE-06) — humanize Posts ids [15, 16, 17, 18, 19, 20]
 * (slugs: seo-content-strategy, keyword-research-guide, payload-cms-guide,
 * nextjs-cms, headless-cms-comparison, astro-vs-nextjs), both locales.
 *
 * Idempotent / resumable: writes a checkpoint entry
 * (posts-progress-batch-03.json) per id only after both locales are written
 * AND read back + self-checked successfully. Re-running the script skips
 * any id already marked 'done'.
 *
 * Rewrite strategy: an in-place Lexical tree walk (see rewriteProse below)
 * that only ever replaces the `text` value of nodes whose direct parent is
 * `heading`, `paragraph`, or `listitem`. Every `block` (code-sample embeds)
 * and `table` node is returned completely untouched (never even descended
 * into), and any `text` node whose direct parent is `link` is left as-is
 * (anchor labels are proper nouns / tool names, not prose to humanize).
 *
 * Humanization approach: this content was authored with heavy, repeated
 * AI-vocabulary tells confirmed via a live read-only scan before writing
 * this script (see 31-04 execution notes) — e.g. "crucial" (30+ EN
 * occurrences), "leverage"/"leveraging" (20+), "robust" (25+), "seamless"
 * (20+), "es fundamental/esencial/crucial/vital" (60+ ES occurrences), 16
 * "no solo X, sino (que) también Y" negative-parallelism constructions, one
 * literal em dash, and one ES heading left untranslated in English
 * ("Payload Cms: complete practical guide for 2026"). Given the volume
 * (this batch alone is ~23,500 words es+en) a mechanical, rule-based
 * humanizer pass is applied to every qualifying text node: exact-string
 * manual overrides run first (for the em dash, the "cannot be overstated"
 * cliche, and the untranslated heading), then a locale-specific pipeline of
 * word/phrase substitutions targeting the exact anti-AI patterns from the
 * humanizer skill (AI vocabulary words, negative parallelism, promotional
 * copula avoidance) — with word choice ROTATED across several natural
 * synonyms (not a 1:1 static swap) so the same flagged word isn't replaced
 * identically every time, avoiding a new uniform "tell". All ES adjective
 * substitutes are gender-invariant (clave/importante/indispensable/
 * determinante/relevante) so number agreement (singular vs plural via
 * separate regexes) is the only grammatical concern, and it's handled
 * exactly. No fact, number, tool name, or code reference is touched — only
 * the wording/rhythm of existing prose changes.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-03.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IDS = [15, 16, 17, 18, 19, 20] as const
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-03.json',
)

type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

// ---------------------------------------------------------------------
// Manual exact-string overrides — run before the generic pipeline, for
// the handful of sentences that need a bespoke fix rather than a
// mechanical word swap.
// ---------------------------------------------------------------------
const manualOverrides: Record<Locale, Array<[string, string]>> = {
  es: [
    // Post 17's h1 was left completely untranslated in the es locale.
    [
      'Payload Cms: complete practical guide for 2026',
      'Payload CMS: guía práctica completa para 2026',
    ],
  ],
  en: [
    // Post 16 — the one literal em dash found in this batch (byte-checked
    // during planning), replaced with plain commas per the voice sample's
    // "cero em dash" rule.
    [
      'Not distinguishing between different match types—such as exact, phrase, and broad matches—can lead to ineffective keyword usage and wasted resources.',
      'Not distinguishing between different match types, such as exact, phrase, and broad matches, can lead to ineffective keyword usage and wasted resources.',
    ],
    // Post 16 — "cannot be overstated" is a stock AI hedge/cliche, replaced
    // with a direct factual claim (no new claim added, same meaning).
    [
      'The impact of keyword research on SEO performance cannot be overstated.',
      'Keyword research has a direct, measurable impact on SEO performance.',
    ],
  ],
}

function matchCase(sample: string, word: string): string {
  if (sample.length > 0 && sample[0] === sample[0].toUpperCase() && sample[0] !== sample[0].toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }
  return word
}

function makeRotator(variants: string[]) {
  let i = 0
  return () => variants[i++ % variants.length]
}

// ES rotators — all substitute adjectives are gender-invariant (do not
// change between masculine/feminine), so a blind word swap stays
// grammatically correct regardless of the subject's gender. Singular and
// plural are handled as separate regexes/rotators.
const esFundamentalSing = makeRotator(['clave', 'importante', 'indispensable'])
const esFundamentalPlur = makeRotator(['claves', 'importantes', 'indispensables'])
const esEsencialSing = makeRotator(['clave', 'determinante', 'indispensable'])
const esEsencialPlur = makeRotator(['claves', 'determinantes', 'indispensables'])
const esCrucialSing = makeRotator(['determinante', 'clave', 'relevante'])
const esCrucialPlur = makeRotator(['determinantes', 'claves', 'relevantes'])
const esVitalSing = makeRotator(['indispensable', 'determinante', 'clave'])
const esVitalPlur = makeRotator(['indispensables', 'determinantes', 'claves'])

function humanizeEs(input: string): string {
  let text = input

  // Negative parallelism ("no solo X, sino (que) (también) Y") —
  // humanizer skill pattern #9. Converts to a plain additive clause, same
  // facts. Comma before "sino" and the word "también" are both optional in
  // the live content (some instances have neither), so both are handled.
  text = text.replace(
    /no solo\s+([^.]+?),?\s*sino(?:\s+que)?\s+(también\s+)?/gi,
    (_m, a: string, tb: string | undefined) => `${a}, y ${tb || ''}`,
  )

  // AI-vocabulary adjective overuse ("es fundamental/esencial/crucial/
  // vital" appears 60+ times across this batch's es content) — rotate
  // through gender-invariant synonyms instead of one static replacement.
  text = text.replace(/\bfundamentales\b/gi, (m) => matchCase(m, esFundamentalPlur()))
  text = text.replace(/\bfundamental\b/gi, (m) => matchCase(m, esFundamentalSing()))
  text = text.replace(/\besenciales\b/gi, (m) => matchCase(m, esEsencialPlur()))
  text = text.replace(/\besencial\b/gi, (m) => matchCase(m, esEsencialSing()))
  text = text.replace(/\bcruciales\b/gi, (m) => matchCase(m, esCrucialPlur()))
  text = text.replace(/\bcrucial\b/gi, (m) => matchCase(m, esCrucialSing()))
  text = text.replace(/\bvitales\b/gi, (m) => matchCase(m, esVitalPlur()))
  text = text.replace(/\bvital\b/gi, (m) => matchCase(m, esVitalSing()))

  return text
}

// EN rotators
const enCrucial = makeRotator(['central', 'important', 'a major factor', 'necessary', 'key'])
const enEssential = makeRotator(['essential', 'important', 'necessary', 'key'])
const enLandscape = makeRotator(['space', 'market', 'field', 'world'])

function humanizeEn(input: string): string {
  let text = input

  // Negative parallelism ("not only X but (also) Y")
  text = text.replace(/not only\s+([^,]+?),?\s*but(?:\s+also)?\s+/gi, (_m, a: string) => `${a}, and also `)

  // Copula avoidance / promotional language
  text = text.replace(/\bboasts a\b/gi, (m) => matchCase(m, 'has a'))
  text = text.replace(/\bboasts\b/gi, (m) => matchCase(m, 'has'))

  // AI vocabulary words (humanizer skill #7) — direct, non-flagged synonyms
  text = text.replace(/\bleveraging\b/gi, (m) => matchCase(m, 'using'))
  text = text.replace(/\bleveraged\b/gi, (m) => matchCase(m, 'used'))
  text = text.replace(/\bleverages\b/gi, (m) => matchCase(m, 'uses'))
  text = text.replace(/\bleverage\b/gi, (m) => matchCase(m, 'use'))
  text = text.replace(/\bseamlessly\b/gi, (m) => matchCase(m, 'smoothly'))
  text = text.replace(/\bseamless\b/gi, (m) => matchCase(m, 'smooth'))
  text = text.replace(/\bstreamlining\b/gi, (m) => matchCase(m, 'simplifying'))
  text = text.replace(/\bstreamlined\b/gi, (m) => matchCase(m, 'simplified'))
  text = text.replace(/\bstreamlines\b/gi, (m) => matchCase(m, 'simplifies'))
  text = text.replace(/\bstreamline\b/gi, (m) => matchCase(m, 'simplify'))
  text = text.replace(/\brobust\b/gi, (m) => matchCase(m, 'solid'))
  text = text.replace(/\bparamount\b/gi, (m) => matchCase(m, 'critical'))
  text = text.replace(/\bcornerstone\b/gi, (m) => matchCase(m, 'foundation'))
  text = text.replace(/\bbackbone\b/gi, (m) => matchCase(m, 'foundation'))
  text = text.replace(/\bfostering\b/gi, (m) => matchCase(m, 'supporting'))
  text = text.replace(/\bfosters\b/gi, (m) => matchCase(m, 'supports'))
  text = text.replace(/\bfoster\b/gi, (m) => matchCase(m, 'support'))
  text = text.replace(/\baligns with\b/gi, (m) => matchCase(m, 'matches'))
  text = text.replace(/\baligned with\b/gi, (m) => matchCase(m, 'in line with'))
  text = text.replace(/\balign with\b/gi, (m) => matchCase(m, 'fits with'))
  text = text.replace(/\bdelve into\b/gi, (m) => matchCase(m, 'look at'))
  text = text.replace(/\bdelve\b/gi, (m) => matchCase(m, 'dig in'))
  text = text.replace(/\bpivotal\b/gi, (m) => matchCase(m, 'key'))
  text = text.replace(/\bvibrant\b/gi, (m) => matchCase(m, 'active'))
  text = text.replace(/\blandscape\b/gi, (m) => matchCase(m, enLandscape()))
  text = text.replace(/\bcrucial\b/gi, (m) => matchCase(m, enCrucial()))
  text = text.replace(/\bessential\b/gi, (m) => matchCase(m, enEssential()))

  return text
}

function rewriteText(original: string, locale: Locale): string {
  let text = original
  for (const [search, replace] of manualOverrides[locale]) {
    if (text.includes(search)) text = text.split(search).join(replace)
  }
  text = locale === 'es' ? humanizeEs(text) : humanizeEn(text)
  return text
}

// Safe in-place rewrite pattern — never touches block/table nodes or
// text whose direct parent is `link`.
function rewriteProse(node: LexicalNode, parentType: string | null, locale: Locale): LexicalNode {
  if (node.type === 'block' || node.type === 'table') return node
  if (node.type === 'text' && typeof node.text === 'string') {
    if (parentType === 'heading' || parentType === 'paragraph' || parentType === 'listitem') {
      return { ...node, text: rewriteText(node.text, locale) }
    }
    return node // e.g. parentType === 'link' — anchor label stays as-is
  }
  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((child) => rewriteProse(child, node.type, locale)) }
  }
  return node
}

// ---------------------------------------------------------------------
// Self-check helpers (replicated locally from
// scripts/verify-locale-parity.ts's extractText shape, per plan
// instructions — not imported across files).
// ---------------------------------------------------------------------
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
      out += Object.values(obj).map(extractText).join('')
    }
    return out
  }
  return ''
}

const VOCEO_RE =
  /\b(vos|ten[eé]s|pod[eé]s|quer[eé]s|sab[eé]s|us[aá]s|necesit[aá]s|trabaj[aá]s|sospech[aá]s|prefer[ií]s|mir[aá])\b/gi

// Collects every `block`/`table` node (stringified, in document order) so
// pre-write and post-write trees can be diffed byte-for-byte for exactly
// those node types (per T-31-04 mitigation).
function collectStructuralNodes(node: unknown, out: string[]): void {
  if (node === null || typeof node !== 'object') return
  const n = node as LexicalNode
  if (n.type === 'block' || n.type === 'table') {
    out.push(JSON.stringify(n))
    return // do not descend — table internals are part of the frozen snapshot
  }
  if (Array.isArray(n.children)) {
    n.children.forEach((child) => collectStructuralNodes(child, out))
  }
}

function loadProgress(): Record<string, 'done'> {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  }
  return {}
}

function saveProgress(progress: Record<string, 'done'>): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

async function main() {
  const payload = await getPayload({ config })
  const progress = loadProgress()

  // Confirm each id exists live before processing any of them.
  for (const id of IDS) {
    try {
      await payload.findByID({ collection: 'posts', id, depth: 0 })
    } catch (err) {
      console.error(`FATAL: Post id=${id} does not exist live. Aborting batch. (${String(err)})`)
      process.exit(1)
    }
  }

  let processedThisRun = 0

  for (const id of IDS) {
    if (progress[String(id)] === 'done') {
      console.log(`Post ${id}: already done, skipping.`)
      continue
    }

    const before = await payload.findByID({
      collection: 'posts',
      id,
      locale: 'all',
      depth: 0,
    })

    const preStructural: Record<Locale, string[]> = { es: [], en: [] }
    for (const locale of LOCALES) {
      const root = (before.content as unknown as Record<Locale, { root: LexicalNode }>)?.[locale]?.root
      if (root) collectStructuralNodes(root, preStructural[locale])
    }

    for (const locale of LOCALES) {
      const contentAll = before.content as unknown as Record<Locale, { root: LexicalNode } | undefined>
      const localeDoc = contentAll?.[locale]
      if (!localeDoc?.root) {
        console.log(`Post ${id} [${locale}]: no content for this locale, skipping locale.`)
        continue
      }
      const rewrittenRoot = rewriteProse(localeDoc.root, null, locale)
      await payload.update({
        collection: 'posts',
        id,
        locale,
        data: { content: { root: rewrittenRoot } as unknown as Record<string, unknown> },
      })
      console.log(`Post ${id} [${locale}]: content rewritten and saved.`)
    }

    // Read back once to confirm the write persisted, and self-check.
    const after = await payload.findByID({
      collection: 'posts',
      id,
      locale: 'all',
      depth: 0,
    })

    let postFailed = false

    for (const locale of LOCALES) {
      const root = (after.content as unknown as Record<Locale, { root: LexicalNode }>)?.[locale]?.root
      if (!root) continue

      const plain = extractText(root)
      const emDashCount = (plain.match(/—/g) || []).length
      if (emDashCount > 0) {
        console.error(`FAIL post ${id} [${locale}]: ${emDashCount} em dash character(s) remain.`)
        postFailed = true
      }
      if (locale === 'es') {
        const voceoMatches = plain.match(VOCEO_RE)
        if (voceoMatches && voceoMatches.length > 0) {
          console.error(`FAIL post ${id} [es]: voceo markers found: ${voceoMatches.join(', ')}`)
          postFailed = true
        }
      }

      const postStructural: string[] = []
      collectStructuralNodes(root, postStructural)
      const pre = preStructural[locale]
      if (pre.length !== postStructural.length) {
        console.error(
          `FAIL post ${id} [${locale}]: structural node count changed (${pre.length} -> ${postStructural.length}).`,
        )
        postFailed = true
      } else {
        for (let i = 0; i < pre.length; i++) {
          if (pre[i] !== postStructural[i]) {
            console.error(`FAIL post ${id} [${locale}]: structural node #${i} is not byte-identical pre/post write.`)
            postFailed = true
          }
        }
      }
    }

    if (postFailed) {
      console.error(`Post ${id}: self-check FAILED — not marking done. Aborting batch.`)
      process.exit(1)
    }

    progress[String(id)] = 'done'
    saveProgress(progress)
    processedThisRun += 1
    console.log(`Post ${id}: self-check passed, marked done.`)
  }

  const doneCount = IDS.filter((id) => progress[String(id)] === 'done').length
  console.log(`\nDone. ${doneCount}/${IDS.length} posts marked done (${processedThisRun} processed this run).`)
  process.exit(doneCount === IDS.length ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
