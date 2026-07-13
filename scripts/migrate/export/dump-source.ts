/**
 * Standalone, read-only dump of the 8 relevant source collections from the
 * REAL JuanPortfolio (Mongo Atlas) production database, via Payload's Local
 * API. Never imported by Next — run manually with tsx.
 *
 * This is the ONLY script in the entire Phase 4 migration that touches the
 * old Mongo config/database. Every subsequent step reads exclusively from the
 * JSON dumps written here.
 *
 * IMPORTANT — this file must NEVER call payload.update / payload.delete /
 * payload.create against the JuanPortfolio config. Read-only, `payload.find`
 * only (T-04-01).
 *
 * Run with (from juan-payload/):
 *   TSX_TSCONFIG_PATH=/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/tsconfig.json \
 *     npx tsx scripts/migrate/export/dump-source.ts
 *
 * Fallback if TSX_TSCONFIG_PATH isn't respected by the installed tsx version:
 *   (cd /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio && \
 *     npx tsx /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/scripts/migrate/export/dump-source.ts)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

// Relative import of the REAL JuanPortfolio config — Node resolves relative
// imports by file location, not cwd, so this always works regardless of
// which tsconfig-resolution technique is active.
import sourceConfig from '../../../../JuanPortfolio/src/payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const OUTPUT_DIR = path.resolve(dirname, '../data/export')

const COLLECTIONS = [
  'media',
  'authors',
  'categories',
  'posts',
  'case-studies',
  'testimonials',
  'clientes',
  'works',
] as const

async function dump() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // JuanPortfolio's payload.config.ts was sanitized at build time by its OWN
  // (older, 3.61.1) `payload` package, which pre-dates the `kv` config option
  // introduced later in the payload 3.x line. Our locally-installed `payload`
  // (3.85, used to run this script) expects `config.kv` to always be present
  // after sanitization and crashes on `this.config.kv.init` otherwise. Patch
  // in a throwaway in-memory KV adapter — this script is read-only and
  // short-lived, so KV persistence is irrelevant; this never touches the
  // real JuanPortfolio project files, only our in-process copy of its config.
  const config = await sourceConfig
  if (!config.kv) {
    // Minimal throwaway in-memory KV adapter — matches the shape payload
    // 3.85's `BasePayload.init` expects (`config.kv.init({ payload })` must
    // return an object with get/set/delete/has/keys/clear). Not exported as
    // a public subpath by the `payload` package, so inlined here rather than
    // reaching into `payload/dist/*` internals.
    config.kv = {
      init: () => {
        const store = new Map<string, unknown>()
        return {
          clear: async () => store.clear(),
          delete: async (key: string) => store.delete(key),
          get: async (key: string) => (store.has(key) ? store.get(key) : null),
          has: async (key: string) => store.has(key),
          keys: async () => Array.from(store.keys()),
          set: async (key: string, value: unknown) => store.set(key, value),
        }
      },
    } as any
  }

  const payload = await getPayload({ config })

  for (const collection of COLLECTIONS) {
    const result = await payload.find({
      collection: collection as any,
      locale: 'all',
      limit: 0,
      depth: 0,
      draft: true,
    })

    const docs = structuredClone(result.docs)
    const outPath = path.join(OUTPUT_DIR, `${collection}.json`)
    fs.writeFileSync(outPath, JSON.stringify(docs, null, 2))
    console.log(`${collection}: ${docs.length} docs -> ${outPath}`)
  }

  console.log('\nDump complete.')
  process.exit(0)
}

dump().catch((err) => {
  console.error('Dump failed:', err)
  process.exit(1)
})
