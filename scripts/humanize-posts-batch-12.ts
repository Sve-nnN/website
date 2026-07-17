/**
 * Phase 31 Plan 13 — Humanize Posts batch 12 (ids 66, 67, 68).
 *
 * Rewrites the `content` (richText) field of 3 specific Posts documents —
 * normalizacion-bases-datos (66), diseno-bases-datos (67), arboles-binarios
 * (68) — in Juan's calibrated voice, both `es` and `en` locales, via a
 * resumable/checkpointed Local API script against the real production Neon
 * Postgres. Idempotent and safe to re-run.
 *
 * Rewrite strategy (documented in full in 31-13-SUMMARY.md):
 *  1. Manual voice overrides (scripts/humanize-posts-batch-12-overrides.ts)
 *     for the highest-visibility prose: opening paragraphs, closing
 *     paragraphs, the duplicate "TL;DR" summary paragraphs, and the exact
 *     sentences carrying literal em dashes.
 *  2. A mechanical pass, applied to every heading in the `es` locale, that
 *     converts English-style Title Case headings to correct Spanish sentence
 *     case (a real, confirmed-live AI-writing tell in this content) while
 *     preserving acronyms/technical tokens (BCNF, 1FN, AVL, NoSQL, etc.).
 *  3. A mechanical `"See Also"` -> `"Ver también"` fix for the one instance
 *     where the `es` locale carries an untranslated English heading (post 66).
 *  4. A generic em-dash-removal safety net applied to ALL prose text in both
 *     locales (belt-and-suspenders on top of the 3 known manual fixes).
 *
 * `content` is a flat top-level richText field (not blocks/arrays), so a
 * full-tree replace on `update` cannot orphan sibling rows — no id-reuse
 * discipline needed here, unlike Phase 30's page-block rewrites.
 *
 * Never touches: `block` nodes (code-sample embeds — `fields.code` stays
 * byte-identical), `table`/`tablerow`/`tablecell` nodes (schema-comparison
 * tables in this batch), or `text` nodes whose direct parent is `link`
 * (anchor labels, mostly internal SEO links to other posts — proper nouns).
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-12.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { OVERRIDES } from './humanize-posts-batch-12-overrides'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const POST_IDS = [66, 67, 68] as const
const LOCALES = ['es', 'en'] as const

const PROGRESS_PATH = path.resolve(
  dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-12.json',
)

type LNode = {
  type: string
  text?: string
  children?: LNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Progress checkpoint
// ---------------------------------------------------------------------------

type Progress = Record<string, 'done'>

function loadProgress(): Progress {
  if (!fs.existsSync(PROGRESS_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8')) as Progress
  } catch {
    return {}
  }
}

function saveProgress(progress: Progress): void {
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true })
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2) + '\n', 'utf8')
}

// ---------------------------------------------------------------------------
// Mechanical transforms
// ---------------------------------------------------------------------------

/** Tokens that must keep their original casing even when not the first word
 * (acronyms, normal-form names, product/technology names with mixed case). */
function isAcronymish(core: string): boolean {
  if (core.length === 0) return false
  if (/\d/.test(core)) return true // 1FN, 2FN, O(log N), etc.
  if (core === core.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(core)) return true // BCNF, SQL, IA, DNS...
  // Mixed-case product/tech names that must not be lowercased.
  const KNOWN = new Set([
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'NoSQL',
    'DbSchema',
    'DBaaS',
    'Redis',
    'Neo4j',
    'Cassandra',
    'HBase',
    'DynamoDB',
    'Pinecone',
    'Weaviate',
    'Milvus',
    'Couchbase',
    'GitHub',
    'JavaScript',
    'TypeScript',
  ])
  if (KNOWN.has(core)) return true
  return false
}

/** Converts an English-Title-Case Spanish heading to correct Spanish
 * sentence case, preserving acronyms/technical tokens and punctuation. */
function esSentenceCaseHeading(text: string): string {
  const words = text.split(' ')
  return words
    .map((word, i) => {
      const match = word.match(/^([([{"']*)(.*?)([)\]}"'.,:;]*)$/)
      if (!match) return i === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
      const [, pre, core, post] = match
      if (core.length === 0) return word
      let newCore: string
      if (isAcronymish(core)) {
        newCore = core
      } else if (i === 0) {
        newCore = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase()
      } else {
        newCore = core.toLowerCase()
      }
      return pre + newCore + post
    })
    .join(' ')
}

/** Generic safety-net em-dash remover — converts "X—Y" asides into a comma
 * form. Applied to ALL prose text in both locales, on top of the manual
 * overrides that already fixed the 3 known em-dash sentences by hand. */
function stripEmDash(text: string): string {
  if (!text.includes('—')) return text
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\.(?=\s|$)/g, '.')
}

// ---------------------------------------------------------------------------
// Tree walk — extraction (read-only, used for the self-check text scan and
// for locating block/table nodes to diff pre/post write)
// ---------------------------------------------------------------------------

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

/** Collects a byte-identity signature (ordered array of stringified nodes)
 * for every `block`/`table` node found in document order. */
function collectStructuralSignature(node: unknown, out: string[]): void {
  if (node === null || node === undefined || typeof node !== 'object') return
  const n = node as LNode
  if (n.type === 'block' || n.type === 'table') {
    out.push(JSON.stringify(n))
    return // do not recurse into block/table internals separately — already captured whole
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children) collectStructuralSignature(child, out)
  }
}

// ---------------------------------------------------------------------------
// Tree walk — rewrite
// ---------------------------------------------------------------------------

type WalkCtx = { postId: number; locale: 'es' | 'en'; counter: { n: number } }

function rewriteNode(node: LNode, parentType: string | null, ctx: WalkCtx): LNode {
  // Never touch code-block embeds or table structure/data.
  if (node.type === 'block' || node.type === 'table') return node

  if (node.type === 'text' && typeof node.text === 'string') {
    if (parentType === 'heading' || parentType === 'paragraph' || parentType === 'listitem') {
      const idx = ctx.counter.n++
      const key = `${ctx.postId}:${ctx.locale}:${idx}`
      let newText = Object.prototype.hasOwnProperty.call(OVERRIDES, key) ? OVERRIDES[key] : node.text

      if (parentType === 'heading' && ctx.locale === 'es') {
        newText = newText === 'See Also' ? 'Ver también' : esSentenceCaseHeading(newText)
      }

      newText = stripEmDash(newText)

      return { ...node, text: newText }
    }
    // e.g. parentType === 'link' — anchor label stays as-is (proper noun/tool name)
    return node
  }

  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((child) => rewriteNode(child, node.type, ctx)) }
  }

  return node
}

// ---------------------------------------------------------------------------
// Self-check
// ---------------------------------------------------------------------------

// NOTE: matches ONLY the accented voseo-specific conjugations (tenés, podés,
// querés, sabés, usás, necesitás, trabajás, sospechás, preferís, mirá) plus
// the bare pronoun "vos". Deliberately does NOT use a character class like
// `us[aá]s` that would also match the CORRECT tuteo form ("usas", "necesitas")
// as a false positive — voseo is distinguished from tuteo by the accent.
const VOCEO_RE = /\b(vos|tenés|podés|querés|sabés|usás|necesitás|trabajás|sospechás|preferís|mirá)\b/i

function selfCheckPost(
  postId: number,
  before: { es: string[]; en: string[] },
  after: { esText: string; enText: string; esStruct: string[]; enStruct: string[] },
): string[] {
  const problems: string[] = []

  if (after.esText.includes('—')) problems.push(`es content still contains an em dash`)
  if (after.enText.includes('—')) problems.push(`en content still contains an em dash`)
  if (VOCEO_RE.test(after.esText)) problems.push(`es content still contains a voceo marker`)

  if (JSON.stringify(before.es) !== JSON.stringify(after.esStruct)) {
    problems.push(`es block/table structural signature changed (pre vs post write)`)
  }
  if (JSON.stringify(before.en) !== JSON.stringify(after.enStruct)) {
    problems.push(`en block/table structural signature changed (pre vs post write)`)
  }

  return problems.map((p) => `post ${postId}: ${p}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const payload = await getPayload({ config })
  const progress = loadProgress()

  // Confirm each id exists live before doing anything.
  for (const id of POST_IDS) {
    try {
      await payload.findByID({ collection: 'posts', id, depth: 0 })
    } catch (err) {
      console.error(`FATAL: post id ${id} does not exist live — aborting. (${(err as Error).message})`)
      process.exit(1)
    }
  }

  let allDone = true
  const failures: string[] = []

  for (const id of POST_IDS) {
    if (progress[String(id)] === 'done') {
      console.log(`Post ${id}: already done, skipping.`)
      continue
    }
    allDone = false

    const doc = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const slug = doc.slug as string
    console.log(`\nPost ${id} (${slug}): rewriting...`)

    const contentAll = doc.content as { es?: { root: LNode }; en?: { root: LNode } }

    const beforeStruct: { es: string[]; en: string[] } = { es: [], en: [] }
    const newContentByLocale: Record<'es' | 'en', { root: LNode }> = {} as never

    for (const locale of LOCALES) {
      const localeContent = contentAll[locale]
      if (!localeContent) {
        console.error(`FATAL: post ${id} has no ${locale} content — aborting.`)
        process.exit(1)
      }
      collectStructuralSignature(localeContent.root, beforeStruct[locale])

      const counter = { n: 0 }
      const newRoot = rewriteNode(localeContent.root, null, { postId: id, locale, counter })
      newContentByLocale[locale] = { root: newRoot }
    }

    for (const locale of LOCALES) {
      await payload.update({
        collection: 'posts',
        id,
        locale,
        data: { content: newContentByLocale[locale] },
      })
      console.log(`  wrote locale=${locale}`)
    }

    // Read back to confirm the write persisted, and to run the self-check
    // against what is actually live (not just the in-memory tree).
    const readBack = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const readBackContent = readBack.content as { es?: { root: LNode }; en?: { root: LNode } }
    const esRoot = readBackContent.es?.root
    const enRoot = readBackContent.en?.root
    if (!esRoot || !enRoot) {
      console.error(`FATAL: post ${id} read-back missing content in one locale — aborting.`)
      process.exit(1)
    }

    const esStructAfter: string[] = []
    const enStructAfter: string[] = []
    collectStructuralSignature(esRoot, esStructAfter)
    collectStructuralSignature(enRoot, enStructAfter)

    const problems = selfCheckPost(
      id,
      beforeStruct,
      {
        esText: extractText(esRoot),
        enText: extractText(enRoot),
        esStruct: esStructAfter,
        enStruct: enStructAfter,
      },
    )

    if (problems.length > 0) {
      console.error(`  SELF-CHECK FAILED for post ${id}:`)
      for (const p of problems) console.error(`    - ${p}`)
      failures.push(...problems)
      continue // do not mark done
    }

    console.log(`  self-check passed (zero em dash, zero voceo, block/table byte-identical)`)
    progress[String(id)] = 'done'
    saveProgress(progress)
    console.log(`  marked done.`)
  }

  if (failures.length > 0) {
    console.error(`\nRESULT: FAIL — ${failures.length} issue(s) found. See above.`)
    process.exit(1)
  }

  const doneCount = POST_IDS.filter((id) => progress[String(id)] === 'done').length
  console.log(`\nRESULT: PASS — ${doneCount}/${POST_IDS.length} posts done.`)
  if (allDone) {
    console.log('(all posts were already done on this run — idempotent no-op confirmed)')
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
