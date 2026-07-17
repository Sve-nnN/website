/**
 * Phase 31 Plan 05 — Humanize Posts batch 4 (VOICE-06).
 *
 * Rewrites the `content` (richText) field of 7 Posts documents — ids
 * [21, 22, 23, 24, 25, 26, 27] (slugs: tree-traversal, time-complexity,
 * space-complexity, quicksort-python, queue-data-structure,
 * merge-sort-python, heap-data-structure) — in both `es` and `en`
 * locales, calibrated against research/voice-sample-juan.md and
 * 29-VOICE-PROFILE.md.
 *
 * This batch is computer-science/algorithms content with heavy inline
 * code-block embeds (`type: 'block'`, blockType 'code-block') and, in a
 * few posts, plain-paragraph "fake tables" (short one-word/value cells
 * used to fake a table with paragraph nodes instead of a real Lexical
 * `table`). Both are treated as inviolable, exactly like real `table`
 * nodes and code-block embeds.
 *
 * DEVIATION FROM THE NAIVE "text under heading/paragraph/listitem is
 * always safe to rewrite" RULE (documented in 31-05-SUMMARY.md):
 *
 *   1. Any `text` leaf with non-zero Lexical `format` (bold, italic,
 *      code, etc — bit 16 in particular marks literal inline code, e.g.
 *      `heapq`, `merge_sort`, `nodo.izquierdo`) is left byte-identical.
 *      These are technical identifiers/labels, not prose, and rewriting
 *      them risks corrupting a real API/property name or a Big-O value.
 *   2. Post 25 (queue-data-structure) EN has ~10 blocks where actual
 *      Python/C/Java source code was authored directly as plain
 *      `paragraph` nodes (not `code-block` embeds) by whatever tool
 *      originally produced this content. Those blocks are hardcoded to
 *      "keep as-is" in the content data file, identically to how a real
 *      `block`/`table` node is skipped.
 *   3. A handful of blocks in posts 22/24/27 (ES) contain fragments of
 *      mangled inline math notation (`( n `, `( O(f(n)) )`, etc) split
 *      across several adjacent plain-text nodes from a botched
 *      markdown/LaTeX import. These are also hardcoded to "keep as-is"
 *      to avoid corrupting the notation.
 *   4. Some blocks contain MULTIPLE adjacent plain-text (format 0)
 *      leaves with no anchor/keep node between them (an artifact of
 *      the original content's chunking, not of any list/table
 *      structure). The rewrite for such a block is a single authored
 *      string; on write-back the full string goes into the FIRST such
 *      leaf in each unbroken run, and any subsequent leaf in that same
 *      run is set to `''`. Rendered output is unaffected (adjacent
 *      same-format text nodes render as one continuous run); node count
 *      and every non-text node stay identical.
 *
 * Content data lives in scripts/data/humanize-posts-batch-04-content.json
 * — one array of replacement strings per (post id, locale), in the exact
 * traversal order `walkBlocks()` below visits heading/paragraph/listitem
 * nodes. Each entry is either the sentinel `"__KEEP_ORIGINAL__"` (block
 * left completely untouched) or an authored string with `⟦L⟧`/`⟦K⟧`
 * placeholders standing in for, respectively, link-anchor text and
 * "keep" (non-zero format) text — both placeholder kinds are filled back
 * in from the ORIGINAL node in traversal order and are functionally
 * interchangeable at apply time.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-04.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const POST_IDS = [21, 22, 23, 24, 25, 26, 27] as const
const LOCALES = ['es', 'en'] as const
const SAME = '__KEEP_ORIGINAL__'

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-04.json',
)
const CONTENT_PATH = path.resolve(__dirname, 'data/humanize-posts-batch-04-content.json')

type LexicalNode = {
  type: string
  text?: string
  format?: number
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

type ContentData = Record<string, Record<string, string[]>>

function loadJSON<T>(p: string, fallback: T): T {
  if (!fs.existsSync(p)) return fallback
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T
}

function saveProgress(progress: Record<string, 'done'>) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2) + '\n')
}

// NOTE: "mirá" (accented, vos imperative) is a voceo marker; plain "mira"
// (tuteo tú-imperative / 3rd-person present, unaccented) is NOT — matching
// both would false-positive on completely standard tuteo/neutral Spanish
// prose (e.g. "la complejidad temporal mira el tiempo..."). Only the
// accented form is flagged.
const VOCEO_RE = /\b(vos|ten[eé]s|pod[eé]s|quer[eé]s|sab[eé]s|us[aá]s|necesit[aá]s|trabaj[aá]s|sospech[aá]s|prefer[ií]s|mirá)\b/i
const EMDASH_RE = /[—–]/

// Same shape as scripts/verify-locale-parity.ts's extractText (lines 63-81),
// replicated locally per the plan's interface spec (do not import cross-file).
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

// Collects every `block`/`table` node's subtree (verbatim) for byte-identical
// pre/post comparison, keyed by a stable path string.
function collectInviolate(node: unknown, pathStr: string, out: Record<string, unknown>) {
  if (!node || typeof node !== 'object') return
  const n = node as LexicalNode
  if (n.type === 'block' || n.type === 'table') {
    out[pathStr] = n
    return
  }
  if (Array.isArray(n.children)) {
    n.children.forEach((child, i) => collectInviolate(child, `${pathStr}.${i}`, out))
  }
}

type Cursor = { i: number }

/**
 * Walks the tree in the exact same order used to build the content data
 * file (see scratch extraction during planning): a pre-order DFS where
 * every heading/paragraph/listitem node is one "block" consuming exactly
 * one entry from `entries`, and nested lists inside a listitem are visited
 * immediately after that listitem as further blocks (own entries).
 */
function rewriteTree(node: LexicalNode, cursor: Cursor, entries: string[]): LexicalNode {
  if (!node || typeof node !== 'object') return node
  if (node.type === 'block' || node.type === 'table') return node // never touch

  if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'listitem') {
    const entry = entries[cursor.i]
    cursor.i += 1
    if (entry === undefined) {
      throw new Error(`Ran out of content entries at block index ${cursor.i - 1}`)
    }

    let newDirectChildren: LexicalNode[]
    if (entry === SAME) {
      newDirectChildren = node.children ?? []
    } else {
      const segments = entry.split(/⟦[LK]⟧/)
      let segPtr = 0
      let inRun = false
      newDirectChildren = (node.children ?? []).map((child) => {
        if (child.type === 'text' && (child.format ?? 0) === 0) {
          if (!inRun) {
            const seg = segments[segPtr]
            segPtr += 1
            inRun = true
            if (seg === undefined) {
              throw new Error(`Segment overrun on block index ${cursor.i - 1}`)
            }
            return { ...child, text: seg }
          }
          return { ...child, text: '' }
        }
        // link (anchor) or formatted (keep) text, or anything else: untouched,
        // and it resets the "run" so the next plain-text sibling starts fresh.
        inRun = false
        return child
      })
      if (segPtr !== segments.length) {
        throw new Error(
          `Segment count mismatch on block index ${cursor.i - 1}: expected ${segments.length}, consumed ${segPtr}`,
        )
      }
    }

    // Nested lists inside a listitem are separate blocks in traversal order,
    // regardless of whether this listitem itself was SAME or rewritten.
    const finalChildren = newDirectChildren.map((child) =>
      child.type === 'list' ? rewriteTree(child, cursor, entries) : child,
    )
    return { ...node, children: finalChildren }
  }

  // Generic containers (root, list): recurse into children unchanged otherwise.
  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((child) => rewriteTree(child, cursor, entries)) }
  }
  return node
}

async function main() {
  const payload = await getPayload({ config })

  const progress = loadJSON<Record<string, 'done'>>(PROGRESS_PATH, {})
  const contentData = loadJSON<ContentData>(CONTENT_PATH, {})

  // Confirm every id exists live before doing any work.
  for (const id of POST_IDS) {
    try {
      await payload.findByID({ collection: 'posts', id, depth: 0 })
    } catch {
      console.error(`FATAL: posts id=${id} not found live. Aborting — do not silently skip.`)
      process.exit(1)
    }
  }

  const remaining = POST_IDS.filter((id) => progress[String(id)] !== 'done')
  if (remaining.length === 0) {
    console.log('7/7 already done. Running self-verification pass over all 7...')
  } else {
    for (const id of remaining) {
      const idStr = String(id)
      const entriesByLocale = contentData[idStr]
      if (!entriesByLocale) {
        console.error(`FATAL: no content data for post id=${id}. Aborting.`)
        process.exit(1)
      }

      const before = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
      const beforeContent = before.content as unknown as Record<string, LexicalNode>

      const preInviolate: Record<string, Record<string, unknown>> = {}
      for (const locale of LOCALES) {
        const root = (beforeContent as any)[locale]?.root as LexicalNode
        const bucket: Record<string, unknown> = {}
        collectInviolate(root, 'root', bucket)
        preInviolate[locale] = bucket
      }

      for (const locale of LOCALES) {
        const root = (beforeContent as any)[locale]?.root as LexicalNode
        const entries = entriesByLocale[locale]
        if (!entries) {
          console.error(`FATAL: no content data for post id=${id} locale=${locale}. Aborting.`)
          process.exit(1)
        }
        const cursor: Cursor = { i: 0 }
        const newRoot = rewriteTree(root, cursor, entries)
        if (cursor.i !== entries.length) {
          throw new Error(
            `Block count mismatch for post ${id} locale ${locale}: tree has ${cursor.i}, data has ${entries.length}`,
          )
        }

        await payload.update({
          collection: 'posts',
          id,
          locale,
          data: { content: { root: newRoot } as any },
        })
        console.log(`Wrote posts.id=${id} locale=${locale}`)
      }

      // Read back and self-check before marking done.
      const after = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
      const afterContent = after.content as unknown as Record<string, LexicalNode>

      let ok = true
      for (const locale of LOCALES) {
        const root = (afterContent as any)[locale]?.root as LexicalNode
        const postInviolate: Record<string, unknown> = {}
        collectInviolate(root, 'root', postInviolate)
        const preKeys = Object.keys(preInviolate[locale])
        const postKeys = Object.keys(postInviolate)
        if (preKeys.length !== postKeys.length) {
          console.error(
            `FAIL post ${id} locale ${locale}: block/table node count changed (${preKeys.length} -> ${postKeys.length})`,
          )
          ok = false
        }
        for (const k of preKeys) {
          if (JSON.stringify(preInviolate[locale][k]) !== JSON.stringify(postInviolate[k])) {
            console.error(`FAIL post ${id} locale ${locale}: block/table node at ${k} changed`)
            ok = false
          }
        }

        const text = extractText(root)
        if (locale === 'es') {
          if (EMDASH_RE.test(text)) {
            console.error(`FAIL post ${id} locale es: em dash found`)
            ok = false
          }
          if (VOCEO_RE.test(text)) {
            console.error(`FAIL post ${id} locale es: voceo found`)
            ok = false
          }
        }
      }

      if (!ok) {
        console.error(`Self-check failed for post ${id} — NOT marking done.`)
        process.exit(1)
      }

      progress[idStr] = 'done'
      saveProgress(progress)
      console.log(`post ${id}: done (self-check passed)`)
    }
  }

  // Final self-verification pass over all 7, per <verify> in the plan.
  let allOk = true
  for (const id of POST_IDS) {
    const doc = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const content = doc.content as unknown as Record<string, LexicalNode>
    for (const locale of LOCALES) {
      const root = (content as any)[locale]?.root as LexicalNode
      const text = extractText(root)
      if (locale === 'es') {
        if (EMDASH_RE.test(text)) {
          console.error(`VERIFY FAIL post ${id} locale es: em dash found`)
          allOk = false
        }
        if (VOCEO_RE.test(text)) {
          console.error(`VERIFY FAIL post ${id} locale es: voceo found`)
          allOk = false
        }
      }
    }
  }

  if (!allOk) {
    console.error('Final verification failed.')
    process.exit(1)
  }

  console.log(`Verification passed: ${POST_IDS.length}/${POST_IDS.length} posts done, 0 em dash, 0 voceo.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
