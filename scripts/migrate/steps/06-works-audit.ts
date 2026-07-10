/**
 * Audit the old Works collection (retired -- no 1:1 equivalent in the new
 * schema) and, for each doc with genuine project content, fold it into a
 * new CaseStudy ONLY after explicit human approval (checkpoint:decision).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/06-works-audit.ts --report-only
 * Then (after approval): node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/06-works-audit.ts --approved=<comma-separated-oldIds|all|none>
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../../../src/payload.config'
import { loadRemapTable, saveRemapTable, setMapping, getMapping } from '../lib/remap-table'

const filename_ = fileURLToPath(import.meta.url)
const dirname_ = path.dirname(filename_)
const EXPORT_DIR = path.resolve(dirname_, '../data/export')
const AUDIT_REPORT_PATH = path.resolve(dirname_, '../data/works-audit-report.json')

interface LocalizedString {
  es?: string
  en?: string
}

interface SourceWorkDoc {
  id: string
  title?: LocalizedString
  excerpt?: LocalizedString
  cover?: string | { id: string }
  tags?: { label?: LocalizedString }[]
  caseStudyUrl?: string
}

interface SourceCaseStudyDoc {
  id: string
  slug?: string
}

interface AuditEntry {
  oldId: string
  title?: string
  excerpt?: string
  tags: string[]
  caseStudyUrl?: string
  likelyDuplicateOfSlug: string | null
  recommendation: 'fold-in-as-new-case-study' | 'skip-likely-duplicate'
  status?: 'created' | 'skipped'
}

function toIdString(rel: unknown): string | undefined {
  if (rel === null || rel === undefined) return undefined
  if (typeof rel === 'object' && rel !== null && 'id' in (rel as Record<string, unknown>)) {
    return String((rel as Record<string, unknown>).id)
  }
  return String(rel)
}

function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

function generateAuditReport(): AuditEntry[] {
  const works = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'works.json'), 'utf-8')) as SourceWorkDoc[]
  const caseStudies = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'case-studies.json'), 'utf-8'),
  ) as SourceCaseStudyDoc[]

  const entries: AuditEntry[] = works.map((doc) => {
    let likelyDuplicateOfSlug: string | null = null
    if (doc.caseStudyUrl) {
      const lastSegment = doc.caseStudyUrl.replace(/\/$/, '').split('/').pop()
      const match = caseStudies.find((cs) => cs.slug === lastSegment)
      if (match?.slug) likelyDuplicateOfSlug = match.slug
    }

    return {
      oldId: doc.id,
      title: doc.title?.es ?? doc.title?.en,
      excerpt: doc.excerpt?.es ?? doc.excerpt?.en,
      tags: (doc.tags || []).map((t) => t.label?.es ?? t.label?.en ?? '').filter(Boolean),
      caseStudyUrl: doc.caseStudyUrl,
      likelyDuplicateOfSlug,
      recommendation: likelyDuplicateOfSlug ? 'skip-likely-duplicate' : 'fold-in-as-new-case-study',
    }
  })

  fs.writeFileSync(AUDIT_REPORT_PATH, JSON.stringify(entries, null, 2))
  return entries
}

async function foldApprovedWorks(approvedOldIds: string[]) {
  const payload = await getPayload({ config })
  const table = loadRemapTable()

  const works = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'works.json'), 'utf-8')) as SourceWorkDoc[]
  const report = JSON.parse(fs.readFileSync(AUDIT_REPORT_PATH, 'utf-8')) as AuditEntry[]

  const needsStructuredContent: string[] = []

  for (const entry of report) {
    const doc = works.find((w) => w.id === entry.oldId)
    if (!doc) {
      entry.status = 'skipped'
      continue
    }

    if (!approvedOldIds.includes(entry.oldId)) {
      entry.status = 'skipped'
      continue
    }

    const title = doc.title?.es ?? doc.title?.en ?? 'Untitled'
    // Works never had their own public URL -- this is the ONE case in the
    // whole phase where deriving a slug from the title is correct (there is
    // no original URL to preserve, unlike every other migrated collection).
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const oldCoverId = toIdString(doc.cover)
    const heroImageId = oldCoverId ? getMapping(table, 'media', oldCoverId) : undefined

    const created = await payload.create({
      collection: 'case-studies',
      locale: 'es',
      data: {
        title,
        slug,
        _status: 'draft',
        kpis: [{ label: 'Resumen', value: 'Ver caso completo' }],
        clientContext: lexicalParagraph(doc.excerpt?.es ?? doc.excerpt?.en ?? ''),
        ...(heroImageId !== undefined ? { heroImage: heroImageId } : {}),
      },
    })

    if (doc.title?.en || doc.excerpt?.en) {
      await payload.update({
        collection: 'case-studies',
        id: created.id,
        locale: 'en',
        data: {
          ...(doc.title?.en ? { title: doc.title.en } : {}),
          ...(doc.excerpt?.en ? { clientContext: lexicalParagraph(doc.excerpt.en) } : {}),
        },
      })
    }

    setMapping(table, 'works-folded-case-studies', entry.oldId, created.id)
    needsStructuredContent.push(slug)
    entry.status = 'created'
    console.log(`Work folded into CaseStudy: ${title} -> ${created.id} (slug: ${slug})`)
  }

  fs.writeFileSync(AUDIT_REPORT_PATH, JSON.stringify(report, null, 2))
  saveRemapTable(table)

  console.log('\nWorks fold-in needsStructuredContent (same editorial gap as wave 6):')
  if (needsStructuredContent.length === 0) {
    console.log('  none')
  } else {
    for (const slug of needsStructuredContent) console.log(`  - ${slug}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const reportOnly = args.includes('--report-only')
  const approvedArg = args.find((a) => a.startsWith('--approved='))

  if (reportOnly || !approvedArg) {
    const report = generateAuditReport()
    console.log(`Audit report written to ${AUDIT_REPORT_PATH} (${report.length} Works audited):\n`)
    console.log(JSON.stringify(report, null, 2))
    if (report.length === 0) {
      console.log(
        '\nNo Works exist in the real source database (0 docs, confirmed via direct Local API query in 04-01) -- nothing to audit or fold in.',
      )
    }
    process.exit(0)
  }

  const approvedValue = approvedArg.split('=')[1]
  let approvedOldIds: string[] = []
  if (approvedValue === 'all') {
    const report = JSON.parse(fs.readFileSync(AUDIT_REPORT_PATH, 'utf-8')) as AuditEntry[]
    approvedOldIds = report
      .filter((e) => e.recommendation === 'fold-in-as-new-case-study')
      .map((e) => e.oldId)
  } else if (approvedValue === 'none') {
    approvedOldIds = []
  } else {
    approvedOldIds = approvedValue.split(',').filter(Boolean)
  }

  await foldApprovedWorks(approvedOldIds)
  process.exit(0)
}

main().catch((err) => {
  console.error('Works audit failed:', err)
  process.exit(1)
})
