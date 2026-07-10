/**
 * Migrate Testimonials and Clientes. The new schema is stricter than the old
 * one on required fields: Testimonials now requires name/role/company (old
 * only required author+testimonial); Clientes requires logo (already
 * required on the old schema too).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/03-testimonials-clientes.ts
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

interface LocalizedString {
  es?: string
  en?: string
}

interface SourceTestimonialDoc {
  id: string
  author: string
  company?: LocalizedString | string
  role?: LocalizedString | string
  testimonial: LocalizedString | string
  avatar?: string | { id: string }
  rating?: number
}

interface SourceClienteDoc {
  id: string
  name: string
  logo?: string | { id: string }
  url?: string
}

interface NeedsReview {
  collection: string
  oldId: string
  reason: string
}

function toIdString(rel: unknown): string | undefined {
  if (rel === null || rel === undefined) return undefined
  if (typeof rel === 'object' && rel !== null && 'id' in (rel as Record<string, unknown>)) {
    return String((rel as Record<string, unknown>).id)
  }
  return String(rel)
}

function localizedOrPlain(v: LocalizedString | string | undefined, locale: 'es' | 'en'): string | undefined {
  if (v === undefined) return undefined
  if (typeof v === 'string') return v
  return v[locale]
}

const PLACEHOLDER = '(sin especificar)'

async function migrateTestimonials(payload: any, table: any, needsReview: NeedsReview[]) {
  const testimonials = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'testimonials.json'), 'utf-8'),
  ) as SourceTestimonialDoc[]

  for (const doc of testimonials) {
    if (getMapping(table, 'testimonials', doc.id) !== undefined) continue

    let avatarId: string | number | undefined
    const oldAvatarId = toIdString(doc.avatar)
    if (oldAvatarId) {
      avatarId = getMapping(table, 'media', oldAvatarId)
    }

    const roleEs = localizedOrPlain(doc.role, 'es')
    const roleEn = localizedOrPlain(doc.role, 'en')
    // company is NOT localized in the new schema -- use `es` value as source
    // of truth if the old value differed per locale.
    const company = localizedOrPlain(doc.company, 'es') ?? localizedOrPlain(doc.company, 'en')
    // Old data was found to be stored as plain (unlocalized) strings for
    // several testimonials rather than the expected {es,en} shape -- handle
    // both via the same helper used for role/company.
    const testimonialEs = localizedOrPlain(doc.testimonial, 'es')
    const testimonialEn = localizedOrPlain(doc.testimonial, 'en')

    if (!roleEs) {
      needsReview.push({ collection: 'testimonials', oldId: doc.id, reason: 'role missing in source' })
    }
    if (!company) {
      needsReview.push({ collection: 'testimonials', oldId: doc.id, reason: 'company missing in source' })
    }
    if (!testimonialEs) {
      needsReview.push({
        collection: 'testimonials',
        oldId: doc.id,
        reason: 'testimonial text missing in source — cannot create without required field',
      })
      console.warn(`Skipping testimonial ${doc.id} (${doc.author}): no testimonial text in source`)
      continue
    }

    const created = await payload.create({
      collection: 'testimonials',
      locale: 'es',
      data: {
        name: doc.author,
        role: roleEs || PLACEHOLDER,
        company: company || PLACEHOLDER,
        testimonial: testimonialEs,
        ...(avatarId !== undefined ? { avatar: avatarId } : {}),
      },
    })

    const enData: Record<string, unknown> = {}
    if (roleEn) enData.role = roleEn
    if (testimonialEn) enData.testimonial = testimonialEn
    if (Object.keys(enData).length > 0) {
      await payload.update({
        collection: 'testimonials',
        id: created.id,
        locale: 'en',
        data: enData,
      })
    }

    setMapping(table, 'testimonials', doc.id, created.id)
    console.log(`Testimonial migrated: ${doc.author} -> ${created.id}`)
  }
}

async function migrateClientes(payload: any, table: any, needsReview: NeedsReview[]) {
  const clientes = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'clientes.json'), 'utf-8'),
  ) as SourceClienteDoc[]

  for (const doc of clientes) {
    if (getMapping(table, 'clientes', doc.id) !== undefined) continue

    const oldLogoId = toIdString(doc.logo)
    const logoId = oldLogoId ? getMapping(table, 'media', oldLogoId) : undefined

    if (logoId === undefined) {
      needsReview.push({
        collection: 'clientes',
        oldId: doc.id,
        reason: `logo not migrated (old media id ${oldLogoId ?? 'missing'})`,
      })
      console.warn(`Skipping cliente ${doc.name}: logo not migrated`)
      continue
    }

    const created = await payload.create({
      collection: 'clientes',
      data: {
        name: doc.name,
        logo: logoId,
        websiteUrl: doc.url,
      },
    })

    setMapping(table, 'clientes', doc.id, created.id)
    console.log(`Cliente migrated: ${doc.name} -> ${created.id}`)
  }
}

async function main() {
  const payload = await getPayload({ config })
  const table = loadRemapTable()
  const needsReview: NeedsReview[] = []

  await migrateTestimonials(payload, table, needsReview)
  await migrateClientes(payload, table, needsReview)

  saveRemapTable(table)

  console.log('\nneedsReview (testimonials/clientes requiring editorial follow-up):')
  if (needsReview.length === 0) {
    console.log('  none')
  } else {
    for (const item of needsReview) {
      console.log(`  - [${item.collection}] oldId=${item.oldId}: ${item.reason}`)
    }
  }

  console.log('\nTestimonials + Clientes migration complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Testimonials/Clientes migration failed:', err)
  process.exit(1)
})
