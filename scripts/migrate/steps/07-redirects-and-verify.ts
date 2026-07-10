/**
 * Diff the frozen URL-INVENTORY.json against the real backend after
 * migration, create a 301 redirect for any URL that no longer resolves
 * verbatim, and compute a remap-table coverage summary per collection.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/07-redirects-and-verify.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../../../src/payload.config'
import { loadRemapTable } from '../lib/remap-table'

const filename_ = fileURLToPath(import.meta.url)
const dirname_ = path.dirname(filename_)
const EXPORT_DIR = path.resolve(dirname_, '../data/export')
const PHASE_DIR = path.resolve(dirname_, '../../../.planning/phases/04-migraci-n-mongo-postgres')
const URL_INVENTORY_PATH = path.join(PHASE_DIR, 'URL-INVENTORY.json')

interface UrlInventoryEntry {
  path: string
  locale: 'es' | 'en'
  source: string
  collection?: 'posts' | 'categories' | 'authors' | 'case-studies'
  slug?: string
}

async function main() {
  const payload = await getPayload({ config })
  const table = loadRemapTable()

  const inventory = JSON.parse(fs.readFileSync(URL_INVENTORY_PATH, 'utf-8')) as {
    entries: UrlInventoryEntry[]
  }

  const deltas: { from: string; to: string; reason: string }[] = []

  for (const entry of inventory.entries) {
    if (!entry.collection || !entry.slug) continue // static pages, out of scope

    const oldIds = Object.keys(table[entry.collection] || {})
    // Find the old ID whose mapped new doc has this slug currently -- we
    // don't have a direct old-slug->old-id index here, so look up by
    // querying the new collection for a doc with this exact slug instead.
    const found = await payload.find({
      collection: entry.collection as any,
      where: { slug: { equals: entry.slug } },
      limit: 1,
    })

    if (found.docs.length === 0) {
      deltas.push({
        from: entry.path,
        to: '/',
        reason: `no migrated document with slug "${entry.slug}" in collection "${entry.collection}"`,
      })
      continue
    }

    const actualSlug = found.docs[0].slug
    if (actualSlug !== entry.slug) {
      // Should never happen (verbatim-slug pipeline), kept as a safety net.
      let newPath: string
      if (entry.collection === 'posts') {
        newPath = entry.path.replace(entry.slug, actualSlug)
      } else {
        newPath = entry.path.replace(entry.slug, actualSlug)
      }
      deltas.push({
        from: entry.path,
        to: newPath,
        reason: `slug changed: "${entry.slug}" -> "${actualSlug}"`,
      })
    }
  }

  // Idempotent redirect creation
  for (const delta of deltas) {
    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: delta.from } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      console.log(`Redirect already exists for ${delta.from}, skipping`)
      continue
    }
    await payload.create({
      collection: 'redirects',
      data: {
        from: delta.from,
        to: { type: 'custom', url: delta.to },
      },
    })
    console.log(`Redirect created: ${delta.from} -> ${delta.to} (${delta.reason})`)
  }

  // Remap-table coverage summary
  const collections = [
    'media',
    'authors',
    'categories',
    'posts',
    'case-studies',
    'testimonials',
    'clientes',
  ] as const

  const coverage: Record<string, { source: number; migrated: number; percent: number }> = {}
  for (const collection of collections) {
    const sourcePath = path.join(EXPORT_DIR, `${collection}.json`)
    const sourceDocs = fs.existsSync(sourcePath)
      ? JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))
      : []
    const migratedCount = Object.keys(table[collection] || {}).length
    coverage[collection] = {
      source: sourceDocs.length,
      migrated: migratedCount,
      percent: sourceDocs.length > 0 ? Math.round((migratedCount / sourceDocs.length) * 100) : 100,
    }
  }

  console.log('\nRemap-table coverage by collection:')
  for (const [collection, stats] of Object.entries(coverage)) {
    console.log(`  ${collection}: ${stats.migrated}/${stats.source} (${stats.percent}%)`)
  }

  console.log(`\nURL deltas found: ${deltas.length}`)
  if (deltas.length === 0) {
    console.log('  none -- every collection-backed URL in the frozen inventory resolves verbatim')
  }

  // Persist a machine-readable summary for 04-VERIFICATION.md to consume
  fs.writeFileSync(
    path.join(dirname_, '../data/verification-summary.json'),
    JSON.stringify({ coverage, deltas }, null, 2),
  )

  process.exit(0)
}

main().catch((err) => {
  console.error('Redirects/verify failed:', err)
  process.exit(1)
})
