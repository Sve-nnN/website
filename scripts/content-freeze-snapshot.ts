/**
 * Takes a verifiable snapshot of the real content in Postgres: count + ids +
 * updatedAt for each of the 9 essential publishable collections. Used to
 * prove (not just claim) that nothing was published/edited between the
 * content freeze declaration and go-live (Plan 06-04).
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/content-freeze-snapshot.ts --tag freeze
 *   node --env-file=.env node_modules/.bin/tsx scripts/content-freeze-snapshot.ts --tag pre-golive
 *
 * Output: .planning/phases/06-deploy-cutover/freeze-snapshots/<tag>-<ISO timestamp>.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const COLLECTIONS = [
  'pages',
  'posts',
  'authors',
  'case-studies',
  'categories',
  'testimonials',
  'clientes',
  'media',
  'redirects',
] as const

function getTagArg(): string {
  const args = process.argv.slice(2)
  const idx = args.indexOf('--tag')
  if (idx === -1 || !args[idx + 1]) {
    console.error('Usage: content-freeze-snapshot.ts --tag <name>')
    process.exit(1)
  }
  return args[idx + 1]
}

async function main() {
  const tag = getTagArg()
  const payload = await getPayload({ config })

  const takenAt = new Date().toISOString()
  const collections: Record<string, { count: number; docs: Array<{ id: unknown; slug: unknown; updatedAt: unknown }> }> = {}

  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({
      collection,
      limit: 0,
      locale: 'all',
      depth: 0,
    })

    const normalized = docs
      .map((d: Record<string, unknown>) => ({
        id: d.id,
        slug: (d.slug as unknown) ?? (d.from as unknown) ?? null,
        updatedAt: d.updatedAt as unknown,
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))

    collections[collection] = { count: docs.length, docs: normalized }
    console.log(`  ${collection}: ${docs.length} docs`)
  }

  const outDir = path.resolve(dirname, '../.planning/phases/06-deploy-cutover/freeze-snapshots')
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, `${tag}-${takenAt}.json`)
  fs.writeFileSync(outPath, JSON.stringify({ tag, takenAt, collections }, null, 2))

  console.log(`\nSnapshot written to ${outPath}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
