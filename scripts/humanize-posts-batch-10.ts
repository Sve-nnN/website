/**
 * Phase 31 Plan 11 — Humanize Posts batch 10 (ids 55,56,57,58,59,60).
 *
 * Rewrites the `content` (richText) field of 6 specific Posts documents in
 * Juan's calibrated voice, both `es` and `en` locales, via the Local API
 * against the real production Neon Postgres. Idempotent and checkpointed:
 * safe to re-run, skips any id already marked 'done' in the progress file.
 *
 * IMPORTANT (confirmed live during this plan's execution): ids 56, 57, 58
 * (tablas-hash, que-es-css, mejores-cursos-seo-espanol) have NO `en` content
 * at all in production (pre-existing gap, confirmed against the phase 31
 * pre-sweep snapshot taken before this batch ran — not something this batch
 * introduced). Only `es` is rewritten for those 3 ids. This is documented as
 * a deviation/blocker in 31-11-SUMMARY.md, not silently patched by
 * inventing a new EN translation (that would be a much larger authoring
 * task outside this plan's voice-rewrite scope).
 *
 * Rewrite pattern: walk each locale's Lexical tree, replacing ONLY the
 * `text` value of nodes whose direct parent is `heading`, `paragraph`, or
 * `listitem` — using an ordered replacement array (REWRITES) aligned to
 * the exact traversal order produced by `collectEligible()` below. Never
 * touches `block` nodes (code samples), `table` nodes (structure/data), or
 * `text` nodes whose direct parent is `link` (anchor labels).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-10.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import {
  POST_55_ES,
  POST_55_EN,
  POST_56_ES,
  POST_57_ES,
  POST_58_ES,
  POST_59_ES,
  POST_59_EN,
  POST_60_ES,
  POST_60_EN,
} from './humanize-posts-batch-10-data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const IDS = [55, 56, 57, 58, 59, 60] as const
const LOCALES = ['es', 'en'] as const

type LexicalNode = {
  type: string
  text?: string
  format?: number
  fields?: Record<string, unknown>
  children?: LexicalNode[]
  [key: string]: unknown
}

const REWRITES: Record<number, Partial<Record<'es' | 'en', string[]>>> = {
  55: { es: POST_55_ES, en: POST_55_EN },
  56: { es: POST_56_ES },
  57: { es: POST_57_ES },
  58: { es: POST_58_ES },
  59: { es: POST_59_ES, en: POST_59_EN },
  60: { es: POST_60_ES, en: POST_60_EN },
}

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-10.json',
)

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

/**
 * Walks the tree collecting refs to eligible text nodes (direct parent is
 * heading/paragraph/listitem, never inside block/table, never a link
 * child) in deterministic depth-first order. Returns node refs (not copies)
 * so callers can mutate `.text` in place.
 */
function collectEligible(node: LexicalNode, parentType: string | null, out: LexicalNode[]) {
  if (node.type === 'block' || node.type === 'table') return
  if (node.type === 'text' && typeof node.text === 'string') {
    if (parentType === 'heading' || parentType === 'paragraph' || parentType === 'listitem') {
      out.push(node)
    }
    return
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectEligible(child, node.type, out)
  }
}

/** Collects all block/table nodes (for the pre/post byte-identical diff). */
function collectFrozen(node: LexicalNode, out: LexicalNode[]) {
  if (node.type === 'block' || node.type === 'table') {
    out.push(node)
    return
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectFrozen(child, out)
  }
}

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
  /\b(vos|ten[eé]s|pod[eé]s|quer[eé]s|sab[eé]s|us[aá]s|necesit[aá]s|trabaj[aá]s|sospech[aá]s|prefer[ií]s|mir[aá])\b/i

async function main() {
  const payload = await getPayload({ config })
  const progress = loadProgress()

  // Confirm each id exists live before processing anything.
  for (const id of IDS) {
    const doc = await payload.findByID({ collection: 'posts', id, depth: 0 }).catch(() => null)
    if (!doc) {
      console.error(`FATAL: post id ${id} not found live. Aborting — do not silently skip.`)
      process.exit(1)
    }
  }

  for (const id of IDS) {
    if (progress[String(id)] === 'done') {
      console.log(`Post ${id}: already done, skipping.`)
      continue
    }

    console.log(`\nPost ${id}: processing...`)
    const before = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const beforeContent = before.content as Record<string, { root: LexicalNode } | undefined>

    const frozenBefore: Record<string, LexicalNode[]> = {}
    for (const locale of LOCALES) {
      const tree = beforeContent[locale]
      if (!tree) continue
      const frozen: LexicalNode[] = []
      collectFrozen(tree.root, frozen)
      frozenBefore[locale] = frozen
    }

    for (const locale of LOCALES) {
      const rewriteArr = REWRITES[id]?.[locale]
      const tree = beforeContent[locale]

      if (!rewriteArr) {
        if (!tree) {
          console.log(
            `  locale ${locale}: no content live and no rewrite planned (confirmed pre-existing gap) — skipping.`,
          )
        } else {
          console.log(`  locale ${locale}: WARNING — content exists live but no rewrite data provided, skipping.`)
        }
        continue
      }
      if (!tree) {
        console.error(
          `FATAL: post ${id} locale ${locale} has rewrite data but no live content tree. Aborting.`,
        )
        process.exit(1)
      }

      const eligible: LexicalNode[] = []
      collectEligible(tree.root, null, eligible)

      if (eligible.length !== rewriteArr.length) {
        console.error(
          `FATAL: post ${id} locale ${locale} — eligible node count (${eligible.length}) does not match rewrite array length (${rewriteArr.length}). Aborting without writing.`,
        )
        process.exit(1)
      }

      for (let i = 0; i < eligible.length; i++) {
        eligible[i].text = rewriteArr[i]
      }

      await payload.update({
        collection: 'posts',
        id,
        locale,
        data: { content: tree as unknown as Record<string, unknown> },
      })
      console.log(`  locale ${locale}: written (${eligible.length} nodes rewritten).`)
    }

    // Read back and self-check before marking done.
    const after = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const afterContent = after.content as Record<string, { root: LexicalNode } | undefined>

    let ok = true
    for (const locale of LOCALES) {
      if (!REWRITES[id]?.[locale]) continue
      const tree = afterContent[locale]
      if (!tree) {
        console.error(`  SELF-CHECK FAIL: post ${id} locale ${locale} missing after write.`)
        ok = false
        continue
      }
      const plain = extractText(tree.root)
      if (plain.includes('—')) {
        console.error(`  SELF-CHECK FAIL: post ${id} locale ${locale} contains an em dash.`)
        ok = false
      }
      if (locale === 'es' && VOCEO_RE.test(plain)) {
        console.error(`  SELF-CHECK FAIL: post ${id} locale es contains a voceo marker.`)
        ok = false
      }
      // Byte-identical block/table check.
      const frozenAfter: LexicalNode[] = []
      collectFrozen(tree.root, frozenAfter)
      const before = frozenBefore[locale] ?? []
      if (JSON.stringify(before) !== JSON.stringify(frozenAfter)) {
        console.error(
          `  SELF-CHECK FAIL: post ${id} locale ${locale} block/table nodes changed (expected byte-identical).`,
        )
        ok = false
      }
    }

    if (!ok) {
      console.error(`Post ${id}: self-check FAILED — NOT marking done. Fix and re-run.`)
      process.exit(1)
    }

    progress[String(id)] = 'done'
    saveProgress(progress)
    console.log(`Post ${id}: self-check passed, marked done.`)
  }

  // Final full re-verification pass across all 6 (matches <verify> section).
  console.log('\n=== Final verification pass ===')
  let allOk = true
  for (const id of IDS) {
    if (progress[String(id)] !== 'done') {
      console.error(`Post ${id}: NOT done.`)
      allOk = false
      continue
    }
    const doc = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const content = doc.content as Record<string, { root: LexicalNode } | undefined>
    for (const locale of LOCALES) {
      const tree = content[locale]
      if (!tree) continue
      const plain = extractText(tree.root)
      const emDash = plain.includes('—')
      const voceo = locale === 'es' && VOCEO_RE.test(plain)
      if (emDash || voceo) {
        console.error(`Post ${id} locale ${locale}: FAIL (emDash=${emDash}, voceo=${voceo})`)
        allOk = false
      }
    }
    console.log(`Post ${id}: OK (${doc.slug})`)
  }

  console.log(allOk ? '\n6/6 posts done, all checks passed.' : '\nFAILURES found — see above.')
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
