/**
 * Migrate Media: download each original binary and re-upload it for real to
 * Cloudinary through the already-validated Phase 3 adapter, via the NEW
 * (Postgres) config's Local API.
 *
 * Standalone script — run outside Next's build/runtime. Uses a normal
 * relative import of the new config (no sibling-project tsconfig tricks
 * needed, this lives inside juan-payload itself).
 *
 * Run with: npx tsx scripts/migrate/steps/01-media.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../../../src/payload.config'
import { loadRemapTable, saveRemapTable, setMapping, getMapping } from '../lib/remap-table'

const filename_ = fileURLToPath(import.meta.url)
const dirname_ = path.dirname(filename_)
const MEDIA_EXPORT_PATH = path.resolve(dirname_, '../data/export/media.json')

const OLD_SITE_ORIGIN = 'https://juan-tech.com'

interface SourceMediaDoc {
  id: string
  alt?: string
  filename: string
  url?: string
  cloudinaryUrl?: string
  mimeType?: string
  filesize?: number
}

function resolveDownloadUrl(doc: SourceMediaDoc): string {
  if (doc.cloudinaryUrl) return doc.cloudinaryUrl
  if (doc.url && doc.url.startsWith('http')) return doc.url
  if (doc.url) return `${OLD_SITE_ORIGIN}${doc.url}`
  throw new Error(`Media doc ${doc.id} (${doc.filename}) has no url or cloudinaryUrl`)
}

async function migrateMedia() {
  const mediaDocs = JSON.parse(fs.readFileSync(MEDIA_EXPORT_PATH, 'utf-8')) as SourceMediaDoc[]

  const payload = await getPayload({ config })
  const table = loadRemapTable()

  const failed: { id: string; filename: string; reason: string }[] = []
  let created = 0
  let skipped = 0

  for (let i = 0; i < mediaDocs.length; i++) {
    const doc = mediaDocs[i]

    if (getMapping(table, 'media', doc.id) !== undefined) {
      skipped++
      continue
    }

    try {
      const downloadUrl = resolveDownloadUrl(doc)
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`fetch ${downloadUrl} -> HTTP ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const createdDoc = await payload.create({
        collection: 'media',
        locale: 'es',
        data: {
          alt: doc.alt && doc.alt.trim().length > 0 ? doc.alt : doc.filename,
        },
        file: {
          data: buffer,
          mimetype: doc.mimeType || 'application/octet-stream',
          name: doc.filename,
          size: doc.filesize ?? buffer.length,
        },
      })

      setMapping(table, 'media', doc.id, createdDoc.id)
      created++
    } catch (err) {
      failed.push({
        id: doc.id,
        filename: doc.filename,
        reason: err instanceof Error ? err.message : String(err),
      })
      console.error(`FAILED media ${doc.id} (${doc.filename}):`, err)
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${mediaDocs.length}`)
    }
  }

  saveRemapTable(table)

  console.log(
    `\nMedia migration complete. created=${created} skipped(existing)=${skipped} failed=${failed.length} total=${mediaDocs.length}`,
  )
  if (failed.length > 0) {
    console.log('\nFailed media (require manual follow-up):')
    for (const f of failed) {
      console.log(`  - ${f.id} (${f.filename}): ${f.reason}`)
    }
  }

  process.exit(0)
}

migrateMedia().catch((err) => {
  console.error('Media migration failed:', err)
  process.exit(1)
})
