/**
 * Diffs two content-humanization-snapshot.ts JSON outputs against each
 * other, reporting per-collection/per-doc text deltas for every localized
 * ({ es, en }-shaped) field, plus the same walk over the 3 editorial
 * globals (header/footer/llms). Standalone tool (Phase 31 Plan 16,
 * VOICE-07 close-out) — does NOT modify content-humanization-snapshot.ts.
 *
 * Reuses the exact `isLocalizedPair`/`extractText` recursive-walk shape
 * already proven in scripts/verify-locale-parity.ts (replicated locally,
 * not imported, per this plan's <read_first> instruction).
 *
 * Usage:
 *   node --env-file=.env node_modules/.bin/tsx scripts/diff-humanization-snapshots.ts \
 *     --before <path-to-before.json> --after <path-to-after.json> [--out <path>]
 *
 * Exits 0 always (this is a reporting tool, not a pass/fail gate) unless a
 * document COUNT mismatch is found in any collection — that is always
 * treated as an error (surfaced loudly, non-zero exit), since this phase
 * must never create/delete documents.
 */
import fs from 'fs'

type LocalizedPair = { es: unknown; en: unknown }

// A localized field's raw shape from `locale: 'all'` is NOT always a clean
// { es, en } pair — when a doc was authored/migrated with ONE locale never
// populated at all, Payload omits that locale's key entirely (not `null`),
// e.g. `{ es: "..." }` with no `en` key whatsoever. The original (pre-fix)
// version of this check required exactly 2 keys, which silently treated
// those single-key nodes as "not a localized field" and never walked them
// — meaning a doc missing an entire locale's content would show as having
// ZERO changed fields, masking a real edit. Fixed to accept any object
// whose keys are a non-empty subset of {es, en} (1 or 2 keys), treating a
// missing key the same as an empty string via extractText(undefined) below.
function isLocalizedPair(node: unknown): node is LocalizedPair {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return false
  const keys = Object.keys(node as Record<string, unknown>)
  if (keys.length === 0 || keys.length > 2) return false
  return keys.every((k) => k === 'es' || k === 'en')
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

type FieldTextMap = Record<string, { es: string; en: string }>

// Walks a doc/global object and collects every localized-field leaf's
// extracted plain text, keyed by its dotted/bracketed path. Recursion
// stops at a localized-pair leaf (does not descend further once found).
function collectLocalizedFields(node: unknown, path: string, out: FieldTextMap): void {
  if (node === null || node === undefined) return

  if (isLocalizedPair(node)) {
    out[path] = { es: extractText(node.es), en: extractText(node.en) }
    return
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => collectLocalizedFields(item, `${path}[${i}]`, out))
    return
  }

  if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      collectLocalizedFields(value, path ? `${path}.${key}` : key, out)
    }
  }
}

function docIdentifier(doc: Record<string, unknown>): string {
  const slug = doc.slug
  return typeof slug === 'string' ? slug : String(doc.id)
}

type FieldDelta = {
  path: string
  locale: 'es' | 'en'
  changed: boolean
  charsBefore: number
  charsAfter: number
  charDelta: number
  sampleBefore?: string
  sampleAfter?: string
}

type DocDiff = {
  id: string
  changedFields: FieldDelta[]
}

type CollectionDiff = {
  collection: string
  docCountBefore: number
  docCountAfter: number
  docCountMismatch: boolean
  docsChanged: number
  totalDocsCompared: number
  changedDocs: DocDiff[]
  docsOnlyInBefore: string[]
  docsOnlyInAfter: string[]
}

type GlobalDiff = {
  global: string
  changedFields: FieldDelta[]
}

function sample(text: string, n = 90): string {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > n ? t.slice(0, n) + '…' : t
}

function diffFieldMaps(before: FieldTextMap, after: FieldTextMap): FieldDelta[] {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)])
  const deltas: FieldDelta[] = []
  for (const path of paths) {
    const b = before[path] ?? { es: '', en: '' }
    const a = after[path] ?? { es: '', en: '' }
    for (const locale of ['es', 'en'] as const) {
      const bt = b[locale]
      const at = a[locale]
      if (bt !== at) {
        deltas.push({
          path,
          locale,
          changed: true,
          charsBefore: bt.length,
          charsAfter: at.length,
          charDelta: at.length - bt.length,
          sampleBefore: sample(bt),
          sampleAfter: sample(at),
        })
      }
    }
  }
  return deltas
}

function diffCollection(
  collectionName: string,
  before: { count: number; docs: Array<Record<string, unknown>> } | undefined,
  after: { count: number; docs: Array<Record<string, unknown>> } | undefined,
): CollectionDiff | null {
  if (!before || !after) return null

  const beforeById = new Map(before.docs.map((d) => [docIdentifier(d), d]))
  const afterById = new Map(after.docs.map((d) => [docIdentifier(d), d]))

  const docsOnlyInBefore = [...beforeById.keys()].filter((id) => !afterById.has(id))
  const docsOnlyInAfter = [...afterById.keys()].filter((id) => !beforeById.has(id))

  const commonIds = [...beforeById.keys()].filter((id) => afterById.has(id))
  const changedDocs: DocDiff[] = []

  for (const id of commonIds) {
    const beforeMap: FieldTextMap = {}
    const afterMap: FieldTextMap = {}
    collectLocalizedFields(beforeById.get(id), '', beforeMap)
    collectLocalizedFields(afterById.get(id), '', afterMap)
    const changedFields = diffFieldMaps(beforeMap, afterMap)
    if (changedFields.length > 0) {
      changedDocs.push({ id, changedFields })
    }
  }

  return {
    collection: collectionName,
    docCountBefore: before.count,
    docCountAfter: after.count,
    docCountMismatch: before.count !== after.count,
    docsChanged: changedDocs.length,
    totalDocsCompared: commonIds.length,
    changedDocs,
    docsOnlyInBefore,
    docsOnlyInAfter,
  }
}

function diffGlobal(
  globalName: string,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): GlobalDiff | null {
  if (!before || !after) return null
  const beforeMap: FieldTextMap = {}
  const afterMap: FieldTextMap = {}
  collectLocalizedFields(before, '', beforeMap)
  collectLocalizedFields(after, '', afterMap)
  return { global: globalName, changedFields: diffFieldMaps(beforeMap, afterMap) }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const beforeIdx = args.indexOf('--before')
  const afterIdx = args.indexOf('--after')
  const outIdx = args.indexOf('--out')
  if (beforeIdx === -1 || afterIdx === -1) {
    console.error(
      'Usage: diff-humanization-snapshots.ts --before <path> --after <path> [--out <path>]',
    )
    process.exit(1)
  }
  return {
    before: args[beforeIdx + 1],
    after: args[afterIdx + 1],
    out: outIdx !== -1 ? args[outIdx + 1] : null,
  }
}

function main() {
  const { before: beforePath, after: afterPath, out } = parseArgs()

  const beforeSnap = JSON.parse(fs.readFileSync(beforePath, 'utf-8'))
  const afterSnap = JSON.parse(fs.readFileSync(afterPath, 'utf-8'))

  const collectionNames = new Set([
    ...Object.keys(beforeSnap.collections ?? {}),
    ...Object.keys(afterSnap.collections ?? {}),
  ])

  const collections: CollectionDiff[] = []
  for (const name of collectionNames) {
    const diff = diffCollection(
      name,
      beforeSnap.collections?.[name],
      afterSnap.collections?.[name],
    )
    if (diff) collections.push(diff)
  }

  const globalNames = new Set([
    ...Object.keys(beforeSnap.globals ?? {}),
    ...Object.keys(afterSnap.globals ?? {}),
  ])
  const globals: GlobalDiff[] = []
  for (const name of globalNames) {
    const diff = diffGlobal(name, beforeSnap.globals?.[name], afterSnap.globals?.[name])
    if (diff) globals.push(diff)
  }

  const report = {
    before: { tag: beforeSnap.tag, takenAt: beforeSnap.takenAt, path: beforePath },
    after: { tag: afterSnap.tag, takenAt: afterSnap.takenAt, path: afterPath },
    collections,
    globals,
  }

  console.log(`\nDiff: ${beforeSnap.tag} (${beforeSnap.takenAt}) -> ${afterSnap.tag} (${afterSnap.takenAt})\n`)

  let anyCountMismatch = false
  for (const c of collections) {
    const mismatchFlag = c.docCountMismatch ? '  *** DOC COUNT MISMATCH ***' : ''
    if (c.docCountMismatch) anyCountMismatch = true
    console.log(
      `  ${c.collection}: ${c.docCountBefore} -> ${c.docCountAfter} docs, ${c.docsChanged}/${c.totalDocsCompared} docs changed${mismatchFlag}`,
    )
    if (c.docsOnlyInBefore.length > 0) {
      console.log(`    only in before: ${c.docsOnlyInBefore.join(', ')}`)
      anyCountMismatch = true
    }
    if (c.docsOnlyInAfter.length > 0) {
      console.log(`    only in after: ${c.docsOnlyInAfter.join(', ')}`)
      anyCountMismatch = true
    }
  }

  console.log('\n  Globals:')
  for (const g of globals) {
    console.log(`  ${g.global}: ${g.changedFields.length} field(s) changed`)
  }

  if (out) {
    fs.writeFileSync(out, JSON.stringify(report, null, 2))
    console.log(`\nFull report written to ${out}`)
  }

  if (anyCountMismatch) {
    console.error(
      '\nERROR: document count mismatch or doc set mismatch detected in at least one collection — this phase must never create/delete documents.',
    )
    process.exit(1)
  }

  console.log('\nRESULT: OK (no document count/set mismatches)')
  process.exit(0)
}

main()
