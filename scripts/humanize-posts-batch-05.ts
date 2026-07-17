/**
 * Phase 31 Plan 06 -- Humanize Posts batch 5 (VOICE-06).
 *
 * Rewrites the `content` (richText) field of 5 Posts documents -- ids [28, 29, 30, 31, 32]
 * (slugs: graph-algorithms, dynamic-programming, binary-search-tree, data-structures,
 * seo-copywriting-guide) -- in Juan's calibrated voice, both `es` and `en` locales, via a
 * resumable/checkpointed Local API script against the real production Neon Postgres.
 *
 * Safe in-place rewrite: only `text` values whose direct parent is `heading`, `paragraph`, or
 * `listitem` get replaced. Every `block` (code-sample embed) and `table` node is left completely
 * untouched -- the walk skips into those subtrees entirely. Any `text` node whose direct parent
 * is `link` is also left untouched (anchor labels are proper nouns / tool names) -- inline links
 * are preserved verbatim and repositioned via a `⟦L⟧` marker token in the authored replacement
 * string (see scripts/_pf-data-2{8,9}.ts, _pf-data-3{0,1,2}.ts for the per-block content).
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-05.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { post28 } from './_pf-data-28'
import { post29 } from './_pf-data-29'
import { post30 } from './_pf-data-30'
import { post31 } from './_pf-data-31'
import { post32 } from './_pf-data-32'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BATCH_IDS = [28, 29, 30, 31, 32] as const
const LOCALES = ['es', 'en'] as const
const MARKER = '⟦L⟧'

const CONTENT: Record<number, Record<'es' | 'en', Record<number, string>>> = {
  28: post28,
  29: post29,
  30: post30,
  31: post31,
  32: post32,
}

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-05.json',
)

type LNode = {
  type: string
  text?: string
  children?: LNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

function loadProgress(): Record<string, 'done'> {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  }
  return {}
}

function saveProgress(progress: Record<string, 'done'>) {
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true })
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

// Rebuilds a heading/paragraph/listitem block's children from an authored replacement string.
// The replacement may contain ⟦L⟧ markers, one per original `link` child, in order -- those
// link nodes are spliced back in verbatim (unchanged) at the marker positions. Any other
// non-text/link child type is a structure this simple rebuild does not handle -- fail loudly
// rather than silently mishandling it.
function rebuildChildren(originalChildren: LNode[], replacement: string): LNode[] {
  const linkChildren = originalChildren.filter((c) => c.type === 'link')
  const unexpected = originalChildren.filter((c) => c.type !== 'link' && c.type !== 'text')
  if (unexpected.length > 0) {
    throw new Error(
      `rebuildChildren: unexpected child type(s) [${unexpected.map((c) => c.type).join(', ')}] -- ` +
        'this block has structure the simple text/link rebuild does not handle.',
    )
  }
  const segments = replacement.split(MARKER)
  if (segments.length - 1 !== linkChildren.length) {
    throw new Error(
      `rebuildChildren: replacement has ${segments.length - 1} ${MARKER} marker(s) but block has ` +
        `${linkChildren.length} link node(s). Replacement: ${JSON.stringify(replacement).slice(0, 120)}`,
    )
  }
  const templateText = originalChildren.find((c) => c.type === 'text') as
    | (LNode & { mode?: string; style?: string; detail?: number; format?: number; version?: number })
    | undefined
  const makeText = (t: string): LNode => ({
    mode: templateText?.mode ?? 'normal',
    text: t,
    type: 'text',
    style: templateText?.style ?? '',
    detail: templateText?.detail ?? 0,
    format: templateText?.format ?? 0,
    version: templateText?.version ?? 1,
  })

  const result: LNode[] = []
  segments.forEach((seg, i) => {
    if (seg.length > 0) result.push(makeText(seg))
    if (i < linkChildren.length) result.push(linkChildren[i])
  })
  if (result.length === 0) {
    // Empty replacement with no links -- keep a single empty text node so children stays valid.
    result.push(makeText(''))
  }
  return result
}

// Walks the tree in the exact same order used during content-mapping (planning pass): skip
// `block`/`table` subtrees entirely, and for every heading/paragraph/listitem node encountered
// (document order), assign the next counter index and apply the authored replacement for that
// index if one exists. Blocks with no authored replacement are left completely unchanged, but
// still recursed into (safe -- text/link children never contain nested blocks; a nested `list`
// inside a `listitem`, if present, would be recursed into and its own listitems counted/rewritten
// in turn).
function rewriteTree(
  node: LNode,
  content: Record<number, string>,
  counter: { i: number },
): LNode {
  if (node.type === 'block' || node.type === 'table') return node

  if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'listitem') {
    const idx = counter.i
    counter.i += 1
    const replacement = content[idx]
    if (replacement !== undefined) {
      return { ...node, children: rebuildChildren(node.children ?? [], replacement) }
    }
    // No authored replacement for this index -- fall through to recurse (handles nested lists).
  }

  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((c) => rewriteTree(c, content, counter)) }
  }
  return node
}

function rewriteLocale(root: LNode, content: Record<number, string>): { tree: LNode; blocksVisited: number } {
  const counter = { i: 0 }
  const tree = rewriteTree(root, content, counter)
  return { tree, blocksVisited: counter.i }
}

// Collects every `block`/`table` node in document order, without descending into them, for the
// pre/post byte-identical structural check.
function collectProtectedNodes(node: LNode, acc: LNode[] = []): LNode[] {
  if (node.type === 'block' || node.type === 'table') {
    acc.push(node)
    return acc
  }
  if (Array.isArray(node.children)) {
    node.children.forEach((c) => collectProtectedNodes(c, acc))
  }
  return acc
}

// Reused from scripts/verify-locale-parity.ts (lines 63-81) -- collects all Lexical `text` leaf
// values, or the string/number/boolean itself, or joins array/object member text. Replicated
// locally per plan instructions rather than imported across files.
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

// Voceo forms only differ from correct tuteo forms by a written accent on otherwise identical
// letters (sabés vs sabes, usás vs usas, necesitás vs necesitas, trabajás vs trabajas,
// sospechás vs sospechas, mirá vs mira). Matching a character class like [aá]/[eé] would
// incorrectly flag the CORRECT tuteo form too (e.g. "necesitas" contains an 'a' where [aá]
// matches). Require the literal accented voceo spelling exactly -- no vowel-class ambiguity.
const VOCEO_RE = /\b(vos|tenés|podés|querés|sabés|usás|necesitás|trabajás|sospechás|preferís|mirá)\b/i

function findVoceo(text: string): string[] {
  const matches = text.match(new RegExp(VOCEO_RE, 'gi'))
  return matches ? Array.from(new Set(matches.map((m) => m.toLowerCase()))) : []
}

function findEmDash(text: string): number {
  return (text.match(/—/g) ?? []).length
}

async function main() {
  const payload = await getPayload({ config })

  console.log(`Confirming all ${BATCH_IDS.length} ids exist live...`)
  for (const id of BATCH_IDS) {
    const doc = await payload.findByID({ collection: 'posts', id, depth: 0 }).catch(() => null)
    if (!doc) {
      console.error(`FATAL: posts id=${id} not found. Aborting -- will not silently skip.`)
      process.exit(1)
    }
  }
  console.log('All 5 ids confirmed present.\n')

  const progress = loadProgress()

  for (const id of BATCH_IDS) {
    if (progress[String(id)] === 'done') {
      console.log(`id=${id}: already done, skipping.`)
      continue
    }

    console.log(`\n--- Processing id=${id} ---`)
    const before: any = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })

    const preSnapshots: Record<string, LNode[]> = {}
    const newContentByLocale: Record<string, LNode> = {}

    for (const locale of LOCALES) {
      const root: LNode = before.content?.[locale]?.root
      if (!root) {
        console.error(`FATAL: id=${id} locale=${locale} has no content.${locale}.root -- aborting this post.`)
        process.exit(1)
      }
      preSnapshots[locale] = collectProtectedNodes(root)

      const contentMap = CONTENT[id]?.[locale] ?? {}
      const { tree, blocksVisited } = rewriteLocale(root, contentMap)
      const maxAuthoredIndex = Math.max(-1, ...Object.keys(contentMap).map(Number))
      if (maxAuthoredIndex >= blocksVisited) {
        console.error(
          `FATAL: id=${id} locale=${locale} authored index ${maxAuthoredIndex} is out of range ` +
            `(only ${blocksVisited} heading/paragraph/listitem blocks found in the live tree).`,
        )
        process.exit(1)
      }
      console.log(
        `  locale=${locale}: ${blocksVisited} blocks visited, ${Object.keys(contentMap).length} rewritten.`,
      )
      newContentByLocale[locale] = tree
    }

    for (const locale of LOCALES) {
      await payload.update({
        collection: 'posts',
        id,
        locale: locale as 'es' | 'en',
        data: { content: { root: newContentByLocale[locale] } as any },
      })
      console.log(`  locale=${locale}: written.`)
    }

    // Read back once to confirm the write persisted.
    const after: any = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })

    let selfCheckFailed = false
    for (const locale of LOCALES) {
      const root: LNode = after.content?.[locale]?.root
      const postSnapshot = collectProtectedNodes(root)
      const preSnapshot = preSnapshots[locale]

      if (JSON.stringify(postSnapshot) !== JSON.stringify(preSnapshot)) {
        console.error(
          `SELF-CHECK FAIL: id=${id} locale=${locale} -- block/table nodes changed pre/post write.`,
        )
        selfCheckFailed = true
      }

      const text = extractText(root)
      const emDashCount = findEmDash(text)
      if (emDashCount > 0) {
        console.error(`SELF-CHECK FAIL: id=${id} locale=${locale} -- ${emDashCount} em dash char(s) found.`)
        selfCheckFailed = true
      }
      if (locale === 'es') {
        const voceo = findVoceo(text)
        if (voceo.length > 0) {
          console.error(`SELF-CHECK FAIL: id=${id} locale=es -- voceo marker(s) found: ${voceo.join(', ')}`)
          selfCheckFailed = true
        }
      }
    }

    if (selfCheckFailed) {
      console.error(`id=${id}: self-check FAILED -- not marking done. Fix and re-run.`)
      process.exit(1)
    }

    progress[String(id)] = 'done'
    saveProgress(progress)
    console.log(`id=${id}: self-check passed, marked done.`)
  }

  // Final full self-verification pass over all 5 ids (per plan <action>: re-run confirms 5/5
  // done with zero em-dash/voceo findings and byte-identical code-block/table structures).
  console.log('\n--- Final verification pass over all 5 ids ---')
  let anyFail = false
  for (const id of BATCH_IDS) {
    const doc: any = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    for (const locale of LOCALES) {
      const root: LNode = doc.content?.[locale]?.root
      const text = extractText(root)
      const emDashCount = findEmDash(text)
      const voceo = locale === 'es' ? findVoceo(text) : []
      if (emDashCount > 0 || voceo.length > 0) {
        console.error(
          `FINAL CHECK FAIL: id=${id} locale=${locale} -- emDash=${emDashCount} voceo=${voceo.join(',')}`,
        )
        anyFail = true
      }
    }
  }

  const doneCount = BATCH_IDS.filter((id) => progress[String(id)] === 'done').length
  console.log(`\nProgress: ${doneCount}/${BATCH_IDS.length} ids done.`)

  if (anyFail) {
    console.error('RESULT: FAIL')
    process.exit(1)
  }
  console.log('RESULT: PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
