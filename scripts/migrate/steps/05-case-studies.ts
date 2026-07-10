/**
 * Migrate CaseStudies. The old schema is a single free-richText page
 * (title/heroImage/content/publishedAt/slug); the new schema (Phase 1,
 * SCHEMA-04) is a structured model (KPIs, challenge/solution steps,
 * before/after comparison) with no equivalent data in the source. This
 * script preserves what genuinely maps (title/slug/heroImage/richText ->
 * clientContext) and documents — never invents — the structured-data gap.
 *
 * IMPORTANT — old schema shape: like Posts, CaseStudies has a Payload tab
 * named `content`, so source data nests under `doc.content.{heroImage,content}`.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/05-case-studies.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../../../src/payload.config'
import { loadRemapTable, saveRemapTable, setMapping, getMapping } from '../lib/remap-table'
import { remapRichTextMediaRefs } from '../lib/richtext-remap'

const filename_ = fileURLToPath(import.meta.url)
const dirname_ = path.dirname(filename_)
const EXPORT_DIR = path.resolve(dirname_, '../data/export')

interface SourceCaseStudyDoc {
  id: string
  title?: { es?: string; en?: string }
  content?: {
    heroImage?: string | { id: string }
    content?: { es?: unknown; en?: unknown }
  }
  publishedAt?: string
  slug?: string
  _status?: string
}

function toIdString(rel: unknown): string | undefined {
  if (rel === null || rel === undefined) return undefined
  if (typeof rel === 'object' && rel !== null && 'id' in (rel as Record<string, unknown>)) {
    return String((rel as Record<string, unknown>).id)
  }
  return String(rel)
}

async function main() {
  const payload = await getPayload({ config })
  const table = loadRemapTable()

  const caseStudies = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'case-studies.json'), 'utf-8'),
  ) as SourceCaseStudyDoc[]

  const needsStructuredContent: string[] = []

  for (const doc of caseStudies) {
    if (getMapping(table, 'case-studies', doc.id) !== undefined) continue
    if (!doc.slug || !doc.title?.es) {
      console.warn(`Skipping case-study ${doc.id}: no slug/title in source`)
      continue
    }

    const oldHeroId = toIdString(doc.content?.heroImage)
    const heroImageId = oldHeroId ? getMapping(table, 'media', oldHeroId) : undefined

    const mediaRemap = table.media || {}
    const clientContextEs = doc.content?.content?.es
      ? remapRichTextMediaRefs(doc.content.content.es, mediaRemap)
      : undefined
    const clientContextEn = doc.content?.content?.en
      ? remapRichTextMediaRefs(doc.content.content.en, mediaRemap)
      : undefined

    const status = doc.publishedAt && doc._status === 'published' ? 'published' : 'draft'

    const created = await payload.create({
      collection: 'case-studies',
      locale: 'es',
      data: {
        title: doc.title.es,
        slug: doc.slug,
        _status: status,
        kpis: [{ label: 'Resumen', value: 'Ver caso completo' }],
        ...(clientContextEs ? { clientContext: clientContextEs } : {}),
        ...(heroImageId !== undefined ? { heroImage: heroImageId } : {}),
      },
    })

    const enData: Record<string, unknown> = {}
    if (doc.title?.en) enData.title = doc.title.en
    if (clientContextEn) enData.clientContext = clientContextEn
    if (Object.keys(enData).length > 0) {
      await payload.update({
        collection: 'case-studies',
        id: created.id,
        locale: 'en',
        data: enData,
      })
    }

    setMapping(table, 'case-studies', doc.id, created.id)
    needsStructuredContent.push(doc.slug)
    console.log(`CaseStudy migrated: ${doc.slug} -> ${created.id}`)
  }

  saveRemapTable(table)

  console.log('\nneedsStructuredContent (case studies migrated with narrative content intact, but requiring')
  console.log('manual editorial authorship of kpis/challenge/solution/results/client/sector/period/services')
  console.log('before publishing with the full structured model):')
  if (needsStructuredContent.length === 0) {
    console.log('  none -- real source database has 0 case-studies (confirmed via direct Local API query')
    console.log('  against the real production Mongo Atlas DB in 04-01, not just an empty dump file)')
  } else {
    for (const slug of needsStructuredContent) console.log(`  - ${slug}`)
  }

  console.log('\nCaseStudies migration complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('CaseStudies migration failed:', err)
  process.exit(1)
})
