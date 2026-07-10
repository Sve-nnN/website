/**
 * Migrate Authors and Categories: simple taxonomy/profile collections, no
 * richText, prerequisite for Posts (author, categories).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/02-authors-categories.ts
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

interface SourceAuthorDoc {
  id: string
  name: string
  jobTitle?: LocalizedString
  bio?: LocalizedString
  avatar?: string | { id: string }
  slug: string
}

interface SourceCategoryDoc {
  id: string
  title: LocalizedString
  description?: LocalizedString
  slug: string
}

function toIdString(rel: unknown): string | undefined {
  if (rel === null || rel === undefined) return undefined
  if (typeof rel === 'object' && rel !== null && 'id' in (rel as Record<string, unknown>)) {
    return String((rel as Record<string, unknown>).id)
  }
  return String(rel)
}

async function migrateAuthors(payload: any, table: any) {
  const authors = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'authors.json'), 'utf-8'),
  ) as SourceAuthorDoc[]

  for (const doc of authors) {
    if (getMapping(table, 'authors', doc.id) !== undefined) continue

    let avatarId: string | number | undefined
    const oldAvatarId = toIdString(doc.avatar)
    if (oldAvatarId) {
      avatarId = getMapping(table, 'media', oldAvatarId)
      if (avatarId === undefined) {
        console.warn(`Author ${doc.id} (${doc.name}): avatar ${oldAvatarId} not in media remap, skipping avatar`)
      }
    }

    // Slug collision guard: Phase 2's seed-phase2.ts created a placeholder
    // test author with slug 'juan-carlos-angulo' (same as the real author's
    // slug in the source dump) to validate the i18n/SEO pipeline end to end.
    // Upsert-by-slug instead of blind create so the real migration overwrites
    // that placeholder with real data under the SAME id, rather than
    // colliding on the unique slug constraint.
    const existing = await payload.find({
      collection: 'authors',
      where: { slug: { equals: doc.slug } },
      limit: 1,
    })

    let createdId: string | number
    if (existing.docs.length > 0) {
      createdId = existing.docs[0].id
      await payload.update({
        collection: 'authors',
        id: createdId,
        locale: 'es',
        data: {
          name: doc.name,
          jobTitle: doc.jobTitle?.es,
          bio: doc.bio?.es,
          ...(avatarId !== undefined ? { avatar: avatarId } : {}),
        },
      })
      console.log(`Author slug collision resolved (upsert): ${doc.slug} -> existing id ${createdId}`)
    } else {
      const created = await payload.create({
        collection: 'authors',
        locale: 'es',
        data: {
          name: doc.name,
          slug: doc.slug,
          jobTitle: doc.jobTitle?.es,
          bio: doc.bio?.es,
          ...(avatarId !== undefined ? { avatar: avatarId } : {}),
        },
      })
      createdId = created.id
    }

    await payload.update({
      collection: 'authors',
      id: createdId,
      locale: 'en',
      data: {
        jobTitle: doc.jobTitle?.en,
        bio: doc.bio?.en,
      },
    })

    setMapping(table, 'authors', doc.id, createdId)
    console.log(`Author migrated: ${doc.slug} -> ${createdId}`)
  }
}

async function migrateCategories(payload: any, table: any) {
  const categories = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'categories.json'), 'utf-8'),
  ) as SourceCategoryDoc[]

  for (const doc of categories) {
    if (getMapping(table, 'categories', doc.id) !== undefined) continue

    // Same slug-collision guard as authors — seed-phase2.ts created a
    // placeholder category with slug 'seo', which also exists in the real
    // source dump (tech-seo is different, but plain 'seo' collides).
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: doc.slug } },
      limit: 1,
    })

    let createdId: string | number
    if (existing.docs.length > 0) {
      createdId = existing.docs[0].id
      await payload.update({
        collection: 'categories',
        id: createdId,
        locale: 'es',
        data: {
          title: doc.title?.es ?? doc.title?.en ?? doc.slug,
          description: doc.description?.es,
        },
      })
      console.log(`Category slug collision resolved (upsert): ${doc.slug} -> existing id ${createdId}`)
    } else {
      const created = await payload.create({
        collection: 'categories',
        locale: 'es',
        data: {
          title: doc.title?.es ?? doc.title?.en ?? doc.slug,
          slug: doc.slug,
          description: doc.description?.es,
        },
      })
      createdId = created.id
    }

    // Only touch the 'en' locale if the source actually had English content.
    // Several categories in the real dump only ever had an 'es' title (never
    // localized on the old site) -- explicitly writing `title: undefined` to
    // a required+localized field trips Payload's required-field validation
    // for that locale instead of being treated as a no-op.
    const enData: Record<string, unknown> = {}
    if (doc.title?.en) enData.title = doc.title.en
    if (doc.description?.en) enData.description = doc.description.en
    if (Object.keys(enData).length > 0) {
      await payload.update({
        collection: 'categories',
        id: createdId,
        locale: 'en',
        data: enData,
      })
    }

    setMapping(table, 'categories', doc.id, createdId)
    console.log(`Category migrated: ${doc.slug} -> ${createdId}`)
  }
}

async function main() {
  const payload = await getPayload({ config })
  const table = loadRemapTable()

  await migrateAuthors(payload, table)
  await migrateCategories(payload, table)

  saveRemapTable(table)

  // Sanity check: at least one known author (Juan Carlos Angulo) exists with
  // the verbatim slug from the source dump.
  const authorsSrc = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'authors.json'), 'utf-8'),
  ) as SourceAuthorDoc[]
  if (authorsSrc.length > 0) {
    const knownSlug = authorsSrc[0].slug
    const found = await payload.find({
      collection: 'authors',
      where: { slug: { equals: knownSlug } },
      limit: 1,
    })
    console.log(
      `Verification: author with slug "${knownSlug}" ${found.docs.length > 0 ? 'FOUND' : 'NOT FOUND'}`,
    )
  }

  console.log('\nAuthors + Categories migration complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Authors/Categories migration failed:', err)
  process.exit(1)
})
