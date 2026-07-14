/**
 * Full-text content snapshot for the humanization safety net (VOICE-04).
 *
 * Unlike scripts/content-freeze-snapshot.ts (which stays metadata-only —
 * count + id/slug/updatedAt — for its own deploy-cutover drift-detection use
 * case, Phase 06), this script captures the REAL field values of every
 * public-facing editorial collection and global, in both locales, so Phase
 * 31's post-humanization-sweep diff has something beyond Neon's
 * point-in-time restore to fall back on if a rewrite goes wrong.
 *
 * Do NOT modify or delete scripts/content-freeze-snapshot.ts — it remains
 * the metadata-only tool for the deploy-cutover freeze check.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/content-humanization-snapshot.ts --tag pre-sweep
 *
 * Output: .planning/phases/29-content-humanization-safety-net/content-snapshots/<tag>-<ISO timestamp>.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Editorial-copy collections only. `redirects` (URLs) and `media` (binary
// assets, though `alt` text lives on the doc) are dropped — not the kind of
// free-form editorial prose Phase 30/31 will humanize. Per 29-FIELD-AUDIT.md
// / 29-PATTERNS.md raw findings.
const COLLECTIONS = [
  'pages',
  'posts',
  'authors',
  'case-studies',
  'categories',
  'testimonials',
  'clientes',
  'speaking-events',
  'websites',
] as const

// The 3 globals carrying editorial text (per 29-PATTERNS.md globals audit).
const GLOBALS = ['footer', 'header', 'llms'] as const

function getTagArg(): string {
  const args = process.argv.slice(2)
  const idx = args.indexOf('--tag')
  if (idx === -1 || !args[idx + 1]) {
    console.error('Usage: content-humanization-snapshot.ts --tag <name>')
    process.exit(1)
  }
  return args[idx + 1]
}

async function main() {
  const tag = getTagArg()
  const payload = await getPayload({ config })

  const takenAt = new Date().toISOString()
  const collections: Record<string, { count: number; docs: Array<Record<string, unknown>> }> = {}

  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({
      collection,
      limit: 0,
      locale: 'all',
      depth: 0,
    })

    // Keep the FULL document (both locale variants, since locale: 'all'
    // returns an { es, en } shape per localized field) rather than just
    // { id, slug, updatedAt } — this is the whole point of this script vs.
    // content-freeze-snapshot.ts. Still guarantee `id`/`updatedAt` are
    // present at the top level so verify-content-freeze.ts-style id-matching
    // logic keeps working unmodified if reused/extended.
    const normalized = (docs as Array<Record<string, unknown>>)
      .map((d) => ({ ...d, id: d.id, updatedAt: d.updatedAt }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))

    collections[collection] = { count: docs.length, docs: normalized }
    console.log(`  ${collection}: ${docs.length} docs`)
  }

  const globals: Record<string, object> = {}
  for (const slug of GLOBALS) {
    const doc = await payload.findGlobal({ slug, locale: 'all' })
    globals[slug] = doc
    console.log(`  global/${slug}: captured`)
  }

  const outDir = path.resolve(
    dirname,
    '../.planning/phases/29-content-humanization-safety-net/content-snapshots',
  )
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, `${tag}-${takenAt}.json`)
  fs.writeFileSync(outPath, JSON.stringify({ tag, takenAt, collections, globals }, null, 2))

  console.log(`\nSnapshot written to ${outPath}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
