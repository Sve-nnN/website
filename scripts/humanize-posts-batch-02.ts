/**
 * Phase 31 Plan 03 (VOICE-06) — Humanize Posts.content for batch 2:
 * ids [10, 11, 12, 13, 14] (technical-seo-checklist, structured-data-seo,
 * seo-on-page-guia, nextjs-seo, auditoria-seo), both es and en locales,
 * calibrated against research/voice-sample-juan.md and
 * .planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md.
 *
 * Structural safety: `content` is walked and only the plain-text prose
 * inside `heading`/`paragraph`/`listitem` nodes is replaced. Every
 * `block` (code-sample embed) and `table` node is passed through
 * completely untouched (same object reference, not even re-serialized
 * field-by-field). Link nodes are also reused byte-identical — the
 * rewritten text is authored with a `¤LINK¤` placeholder token standing
 * in for each embedded link in that block, consumed in original order
 * when rebuilding the block's children, so the link node itself (url,
 * fields, anchor text) never changes, only the surrounding prose does.
 *
 * Locale-parity gap found live during this batch (not anticipated by the
 * plan, which assumed both locales existed for all 5 posts): ids 12
 * (seo-on-page-guia) and 14 (auditoria-seo) had NO `en` content at all —
 * `content` only held an `es` key. Per Rule 2 (auto-fix missing critical
 * functionality — the same locale-parity bug class already fixed for
 * Categories/Testimonials in scripts/humanize-lean-collections.ts), this
 * script also authors a brand-new `en` tree for those two ids, built by
 * writing genuine English prose (not a literal translation) that mirrors
 * the humanized `es` tree's structure and preserves every fact, matching
 * 29-VOICE-PROFILE.md's explicit rule that EN must get the same rhythm/
 * voice discipline as ES, not a more "polished" register.
 *
 * Known pre-existing structural note (NOT altered by this script): post 10
 * and 11's `en` content covers different subtopics/section order than their
 * `es` content (a pre-Phase-31 authoring divergence between locales, not a
 * Lexical-tree bug) — each locale's own existing structure is preserved and
 * rewritten in place independently; this script does not attempt to make
 * es/en structurally match each other where they already differ pre-existing.
 *
 * Note on inline formatting: a small number of text runs across these posts
 * carry Lexical `format` flags (bold/italic emphasis, ~11-32 occurrences per
 * post). Because in-place rewriting flattens a block's inline text+link runs
 * into plain rewritten prose (to safely reposition prose around preserved
 * link nodes), those specific inline emphasis flags are not preserved
 * 1:1 post-rewrite. This is a documented, bounded deviation — it does not
 * affect any code-block, table, link target, or fact, and matches the
 * precedent set by scripts/humanize-legal-pages.ts and
 * scripts/humanize-lean-collections.ts (full prose replace, no inline
 * formatting-span preservation).
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-02.ts
 */
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LNode = {
  type: string
  text?: string
  children?: LNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

type Locale = 'es' | 'en'
const LOCALES: Locale[] = ['es', 'en']

const BATCH_IDS = [10, 11, 12, 13, 14] as const

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-02.json',
)

type Progress = Record<string, 'done'>

function loadProgress(): Progress {
  return fs.existsSync(PROGRESS_PATH) ? JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8')) : {}
}
function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(p, null, 2))
}

// ---------------------------------------------------------------------------
// Tree walk / rewrite engine
// ---------------------------------------------------------------------------

/** Collects, in traversal order, the plain-text (link-placeholder'd) content
 * of every heading/paragraph/listitem block. Never enters `block`/`table`
 * subtrees. Used both for self-verification (extractText-style) and to
 * confirm block counts line up with an authored rewrite array. */
function collectBlocks(node: LNode, out: { type: string; text: string }[]): void {
  if (node.type === 'block' || node.type === 'table') return
  if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'listitem') {
    const inline = (node.children ?? []).filter((c) => c.type === 'text' || c.type === 'link')
    const nested = (node.children ?? []).filter((c) => c.type !== 'text' && c.type !== 'link')
    const text = inline
      .map((c) => (c.type === 'link' ? '¤LINK¤' : (c.text ?? '')))
      .join('')
    if (text.trim().length > 0) out.push({ type: node.type, text })
    nested.forEach((c) => collectBlocks(c, out))
    return
  }
  ;(node.children ?? []).forEach((c) => collectBlocks(c, out))
}

/** Applies an authored `texts[]` array (one entry per collected block, same
 * traversal order as collectBlocks) onto a cloned tree. Rebuilds each
 * touched block's children by splitting the authored text on the `¤LINK¤`
 * placeholder and re-inserting the ORIGINAL link nodes (byte-identical,
 * same object) in their original relative order. `block`/`table` nodes are
 * returned as the exact same object reference (never cloned/touched). */
function applyRewrites(node: LNode, texts: string[], cursor: { i: number }): LNode {
  if (node.type === 'block' || node.type === 'table') return node
  if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'listitem') {
    const inline = (node.children ?? []).filter((c) => c.type === 'text' || c.type === 'link')
    const nested = (node.children ?? []).filter((c) => c.type !== 'text' && c.type !== 'link')
    const originalText = inline.map((c) => (c.type === 'link' ? '¤LINK¤' : (c.text ?? ''))).join('')
    let newInline: LNode[]
    if (originalText.trim().length > 0) {
      const rewritten = texts[cursor.i]
      cursor.i += 1
      if (typeof rewritten !== 'string') {
        throw new Error(`Missing rewrite for block index ${cursor.i - 1} (type ${node.type})`)
      }
      const linkNodes = inline.filter((c) => c.type === 'link')
      const parts = rewritten.split('¤LINK¤')
      if (parts.length - 1 !== linkNodes.length) {
        throw new Error(
          `Link-count mismatch at block index ${cursor.i - 1}: authored text has ${parts.length - 1} ¤LINK¤ tokens, original block has ${linkNodes.length} link(s). Text: "${rewritten}"`,
        )
      }
      newInline = []
      parts.forEach((part, idx) => {
        if (part.length > 0) {
          newInline.push({
            type: 'text',
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: part,
          })
        }
        if (idx < parts.length - 1) newInline.push(linkNodes[idx])
      })
    } else {
      newInline = inline
    }
    const rebuiltNested = nested.map((c) => applyRewrites(c, texts, cursor))
    return { ...node, children: [...newInline, ...rebuiltNested] }
  }
  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((c) => applyRewrites(c, texts, cursor)) }
  }
  return node
}

function extractText(node: LNode): string {
  if (node === null || node === undefined) return ''
  if (typeof node.text === 'string') {
    let out = node.text
    if (Array.isArray(node.children)) out += node.children.map(extractText).join('')
    return out
  }
  if (Array.isArray(node.children)) return node.children.map(extractText).join('')
  return ''
}

const EM_DASH = /—/
// NOTE: matches only the ACCENTED voseo conjugation (e.g. "usás"), never the
// bare unaccented form. Several of these voseo forms are spelled identically
// to their correct tuteo present-tense counterpart minus the accent mark
// (usás/usas, necesitás/necesitas, trabajás/trabajas, sospechás/sospechas,
// mirá/mira) — a character-class regex like `us[áa]s` would false-positive
// on completely correct tuteo text such as "si usas WordPress" or "mira
// esto". Requiring the literal accent is both the standard voseo spelling
// and the only way to distinguish it from tuteo here (Rule 1 bug fix, found
// during this batch's self-check).
const VOCEO_RE =
  /\b(vos|tenés|podés|querés|sabés|usás|necesitás|trabajás|sospechás|preferís|mirá)\b/i

function assertClean(locale: Locale, text: string, label: string) {
  if (EM_DASH.test(text)) {
    throw new Error(`Em dash found in ${label} (${locale}) after rewrite`)
  }
  if (locale === 'es' && VOCEO_RE.test(text)) {
    const match = text.match(VOCEO_RE)
    throw new Error(`Voceo marker "${match?.[0]}" found in ${label} (es) after rewrite`)
  }
}

/** Deep-diffs the set of `block`/`table` nodes between two trees, in
 * traversal order, asserting byte-identical JSON at each matching position. */
function collectStructuralNodes(node: LNode, out: LNode[]): void {
  if (node.type === 'block' || node.type === 'table') {
    out.push(node)
    return
  }
  ;(node.children ?? []).forEach((c) => collectStructuralNodes(c, out))
}

function assertStructuralNodesUnchanged(before: LNode, after: LNode, label: string) {
  const beforeNodes: LNode[] = []
  const afterNodes: LNode[] = []
  collectStructuralNodes(before, beforeNodes)
  collectStructuralNodes(after, afterNodes)
  if (beforeNodes.length !== afterNodes.length) {
    throw new Error(
      `${label}: block/table node count changed (${beforeNodes.length} -> ${afterNodes.length})`,
    )
  }
  for (let i = 0; i < beforeNodes.length; i++) {
    const b = JSON.stringify(beforeNodes[i])
    const a = JSON.stringify(afterNodes[i])
    if (b !== a) {
      throw new Error(`${label}: block/table node at position ${i} changed`)
    }
  }
}

// ---------------------------------------------------------------------------
// Authored rewrites — one array of strings per post per locale, in the exact
// traversal order collectBlocks() produces for that (post, locale). Each
// entry corresponds to one heading/paragraph/listitem block; ¤LINK¤ stands
// in for an embedded link (must appear exactly once per original link in
// that block, order preserved).
// ---------------------------------------------------------------------------

import { REWRITES } from './humanize-posts-batch-02-content'

// ---------------------------------------------------------------------------
// Missing-locale gap found live during this batch (Rule 2 — auto-fix missing
// critical functionality, same class as the missing `content.en` fix above):
// ids 12 and 14 have NO `en` document at all, not just missing `content` —
// `title` (required, localized) is also undefined for `en`. Payload validates
// the WHOLE document's required fields for the locale being written on
// `update`, so writing `content` alone for locale 'en' on these two ids fails
// with "title: This field is required." unless `title` is included in the
// same write. These English titles are the same strings already authored as
// each post's English H1 in REWRITES (REWRITES[12].en[0] /
// REWRITES[14].en[0]), reused here as the literal title text.
// ---------------------------------------------------------------------------
const EN_TITLES: Record<number, string> = {
  12: 'On-Page SEO: A Complete Guide and Practical Strategy',
  14: 'SEO Audit: A Complete Guide and Practical Strategy',
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const payload = await getPayload({ config })
  const progress = loadProgress()

  for (const id of BATCH_IDS) {
    const key = String(id)
    if (progress[key] === 'done') {
      console.log(`id ${id}: already done, skipping`)
      continue
    }

    const existing = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    if (!existing) {
      console.error(`FATAL: post id ${id} not found live. Aborting batch.`)
      process.exit(1)
    }

    const postRewrites = REWRITES[id]
    if (!postRewrites) {
      console.error(`FATAL: no authored rewrite entry for id ${id}. Aborting.`)
      process.exit(1)
    }

    for (const locale of LOCALES) {
      const texts = postRewrites[locale]
      if (!texts) {
        console.log(`id ${id} (${locale}): no rewrite authored (unexpected), skipping locale`)
        continue
      }

      // `content` field values are always shaped `{ root: <LNode tree> }` —
      // collectBlocks/applyRewrites/assertStructuralNodesUnchanged all
      // operate on the inner root LNode, never the `{root}` wrapper itself.
      const existingWrapper = (
        existing.content as unknown as Record<Locale, { root: LNode } | undefined>
      )[locale]

      let baseRoot: LNode
      if (existingWrapper) {
        baseRoot = existingWrapper.root
      } else if (locale === 'en') {
        // Missing-locale case (ids 12, 14): clone the es tree's structure as
        // the base to rebuild from (block/table pass-through is moot here
        // since these two posts carry none), same traversal shape.
        const esWrapper = (existing.content as unknown as Record<Locale, { root: LNode }>).es
        baseRoot = JSON.parse(JSON.stringify(esWrapper.root))
      } else {
        console.error(`FATAL: post id ${id} missing es content entirely. Aborting.`)
        process.exit(1)
      }

      const before: { type: string; text: string }[] = []
      collectBlocks(baseRoot, before)
      if (before.length !== texts.length) {
        console.error(
          `FATAL: id ${id} (${locale}) block count mismatch — tree has ${before.length} blocks, authored rewrite has ${texts.length}. Aborting this id.`,
        )
        process.exit(1)
      }

      const rewrittenRoot = applyRewrites(JSON.parse(JSON.stringify(baseRoot)), texts, { i: 0 })

      assertStructuralNodesUnchanged(baseRoot, rewrittenRoot, `id ${id} (${locale})`)
      const plain = extractText(rewrittenRoot)
      assertClean(locale, plain, `post ${id} content`)

      const updateData: Record<string, unknown> = {
        content: { root: rewrittenRoot },
      }
      // `title` is required + localized. Ids 12/14 have no `en` title at all
      // (not just missing `en` content) — Payload validates the whole
      // document's required fields for the locale being written, so writing
      // `content` alone for locale 'en' on these two ids would fail with
      // "title: This field is required." Include the authored English title
      // in the same write when it's missing (see EN_TITLES above).
      const existingTitle = (existing.title as unknown as Record<Locale, string | undefined>)[
        locale
      ]
      if (!existingTitle && locale === 'en' && EN_TITLES[id]) {
        updateData.title = EN_TITLES[id]
      }

      await payload.update({
        collection: 'posts',
        id,
        locale,
        data: updateData,
      })
      console.log(`id ${id} (${locale}): written (${texts.length} blocks rewritten)`)
    }

    // Read back both locales to confirm persistence + re-run self-check.
    const readBack = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    for (const locale of LOCALES) {
      const wrapper = (readBack.content as unknown as Record<Locale, { root: LNode } | undefined>)[
        locale
      ]
      if (!wrapper) {
        console.error(`FATAL: id ${id} (${locale}) missing content after write-back. Aborting.`)
        process.exit(1)
      }
      const plain = extractText(wrapper.root)
      assertClean(locale, plain, `post ${id} content (post-write readback)`)
    }

    progress[key] = 'done'
    saveProgress(progress)
    console.log(`id ${id}: DONE (checkpoint saved)`)
  }

  // Final full self-verification pass across all 5 ids.
  console.log('\nFinal self-verification pass:')
  let allDone = true
  for (const id of BATCH_IDS) {
    if (progress[String(id)] !== 'done') {
      allDone = false
      console.log(`  id ${id}: NOT done`)
      continue
    }
    const doc = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    for (const locale of LOCALES) {
      const wrapper = (doc.content as unknown as Record<Locale, { root: LNode } | undefined>)[locale]
      if (!wrapper) {
        console.log(`  id ${id} (${locale}): MISSING content`)
        allDone = false
        continue
      }
      const plain = extractText(wrapper.root)
      const hasEmDash = EM_DASH.test(plain)
      const hasVoceo = locale === 'es' && VOCEO_RE.test(plain)
      console.log(
        `  id ${id} (${locale}): em-dash=${hasEmDash ? 'FOUND' : 'none'} voceo=${hasVoceo ? 'FOUND' : 'none'}`,
      )
      if (hasEmDash || hasVoceo) allDone = false
    }
  }

  console.log(allDone ? '\n5/5 done, all checks passed.' : '\nFAILED — see above.')
  process.exit(allDone ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
