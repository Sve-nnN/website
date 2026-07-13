/**
 * Migrate Posts: the largest, most-related content collection (author,
 * categories, richText with embedded blocks, post-to-post internal links).
 * Two passes: pass 1 creates every post with media refs resolved; pass 2
 * resolves internal post-to-post links now that every post has an ID.
 *
 * IMPORTANT — old schema shape: Posts/CaseStudies both have a Payload tab
 * named `content` (`{ type: 'tabs', tabs: [{ name: 'content', fields: [...] }] }`),
 * which nests data under `doc.content.{heroImage,tldr,content}` rather than
 * top-level `doc.heroImage`/`doc.content`/`doc.tldr`. Confirmed against the
 * real dump in 04-01 (see 04-01-SUMMARY.md "Notable Findings").
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/04-posts.ts
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

interface SourcePostDoc {
  id: string
  title?: { es?: string; en?: string }
  content?: {
    heroImage?: string | { id: string }
    tldr?: { es?: string; en?: string }
    content?: { es?: unknown; en?: unknown }
  }
  categories?: (string | { id: string; slug?: string })[]
  publishedAt?: string
  authors?: string[]
  postAuthors?: string[]
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

function loadPosts(): SourcePostDoc[] {
  return JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'posts.json'), 'utf-8'))
}

async function migratePostsPass1(payload: any, table: any, needsReview: string[]) {
  const posts = loadPosts()

  for (const doc of posts) {
    if (getMapping(table, 'posts', doc.id) !== undefined) continue

    // Orphan/garbage docs with no title/slug/content at all -- not real
    // content, nothing to preserve (no URL, no body). Confirmed against the
    // real dump: exactly 1 such doc exists in production (id 6a1ef48008395a3ec09ee624).
    if (!doc.slug || !doc.title?.es) {
      needsReview.push(
        `SKIPPED post oldId=${doc.id}: no slug/title in source (empty/orphan draft, nothing to migrate)`,
      )
      console.warn(`Skipping post ${doc.id}: no slug/title (orphan draft)`)
      continue
    }

    // heroImage
    const oldHeroId = toIdString(doc.content?.heroImage)
    const heroImageId = oldHeroId ? getMapping(table, 'media', oldHeroId) : undefined
    if (oldHeroId && heroImageId === undefined) {
      needsReview.push(`Post ${doc.slug}: heroImage ${oldHeroId} not in media remap, omitted`)
    }

    // author: prefer postAuthors[0], fallback to authors[0] (old Users
    // relation, not migrated) -> fall back to the first migrated Author.
    let authorId: string | number | undefined
    const oldAuthorId = doc.postAuthors?.[0]
    if (oldAuthorId) {
      authorId = getMapping(table, 'authors', oldAuthorId)
    }
    if (authorId === undefined) {
      const authorsTable = table.authors || {}
      const firstMappedAuthor = Object.values(authorsTable)[0]
      if (firstMappedAuthor !== undefined) {
        authorId = firstMappedAuthor as string | number
        needsReview.push(
          `Post ${doc.slug}: no postAuthors match, fell back to first migrated Author (id ${authorId})`,
        )
      }
    }
    if (authorId === undefined) {
      needsReview.push(`Post ${doc.slug}: NO AUTHOR RESOLVED (author is required) -- skipping`)
      console.warn(`Skipping post ${doc.slug}: no author could be resolved`)
      continue
    }

    // categories
    const oldCategoryIds = (doc.categories || []).map(toIdString).filter(Boolean) as string[]
    const categoryIds: (string | number)[] = []
    for (const oldCatId of oldCategoryIds) {
      const newCatId = getMapping(table, 'categories', oldCatId)
      if (newCatId !== undefined) {
        categoryIds.push(newCatId)
      } else {
        needsReview.push(`Post ${doc.slug}: category ${oldCatId} not in remap, omitted`)
      }
    }

    // richText content, media refs only in pass 1 (internal links resolved
    // in pass 2 once every post exists)
    const mediaRemap = table.media || {}
    const contentEs = doc.content?.content?.es
      ? remapRichTextMediaRefs(doc.content.content.es, mediaRemap)
      : undefined
    const contentEn = doc.content?.content?.en
      ? remapRichTextMediaRefs(doc.content.content.en, mediaRemap)
      : undefined

    if (!contentEs) {
      needsReview.push(`Post ${doc.slug}: no ES content body found, skipping (content is required)`)
      console.warn(`Skipping post ${doc.slug}: no ES richText content`)
      continue
    }

    const status = doc.publishedAt && doc._status === 'published' ? 'published' : 'draft'

    const created = await payload.create({
      collection: 'posts',
      locale: 'es',
      data: {
        title: doc.title.es,
        slug: doc.slug,
        excerpt: doc.content?.tldr?.es,
        content: contentEs,
        author: authorId,
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        publishedAt: doc.publishedAt,
        _status: status,
        ...(heroImageId !== undefined ? { heroImage: heroImageId } : {}),
      },
    })

    const enData: Record<string, unknown> = {}
    if (doc.title?.en) enData.title = doc.title.en
    if (doc.content?.tldr?.en) enData.excerpt = doc.content.tldr.en
    if (contentEn) enData.content = contentEn
    if (Object.keys(enData).length > 0) {
      await payload.update({
        collection: 'posts',
        id: created.id,
        locale: 'en',
        data: enData,
      })
    }

    setMapping(table, 'posts', doc.id, created.id)
    console.log(`Post migrated: ${doc.slug} -> ${created.id}`)
  }
}

async function remapInternalLinksPass2(payload: any, table: any, needsReview: string[]) {
  const posts = loadPosts()
  const mediaRemap = table.media || {}

  for (const doc of posts) {
    const newId = getMapping(table, 'posts', doc.id)
    if (newId === undefined) continue // not migrated (orphan/skip case)

    let changed = false
    const updateData: Record<string, { es?: unknown; en?: unknown }> = {}

    for (const locale of ['es', 'en'] as const) {
      const original = doc.content?.content?.[locale]
      if (!original) continue

      // Re-run the media remap (idempotent) AND resolve internal post links
      // in the same pass.
      const cloned = structuredClone(original)
      const root = (cloned as Record<string, unknown>)?.root

      function walkLinks(node: unknown) {
        if (!node || typeof node !== 'object') return
        const n = node as Record<string, unknown>
        if (n.type === 'link') {
          const fields = n.fields as Record<string, unknown> | undefined
          const linkDoc = fields?.doc as Record<string, unknown> | undefined
          if (linkDoc?.relationTo === 'posts') {
            const oldTargetId = toIdString(linkDoc.value)
            if (oldTargetId) {
              const newTargetId = getMapping(table, 'posts', oldTargetId)
              if (newTargetId !== undefined) {
                linkDoc.value = newTargetId
                changed = true
              } else {
                needsReview.push(
                  `Post ${doc.slug} (${locale}): internal link to post ${oldTargetId} could not be resolved (target not migrated)`,
                )
              }
            }
          }
          // links to 'pages' are intentionally left intact -- pages aren't
          // migrated in this phase (Phase 5 builds them by hand)
        }
        if (Array.isArray(n.children)) {
          for (const child of n.children as unknown[]) walkLinks(child)
        }
      }

      if (root) walkLinks(root)

      const remappedAgain = remapRichTextMediaRefs(cloned, mediaRemap)
      const originalStr = JSON.stringify(await getStoredContent(payload, newId, locale))
      const newStr = JSON.stringify(remappedAgain)
      if (originalStr !== newStr) {
        updateData[locale] = { content: remappedAgain } as any
      }
    }

    for (const locale of Object.keys(updateData) as ('es' | 'en')[]) {
      await payload.update({
        collection: 'posts',
        id: newId,
        locale,
        data: { content: (updateData[locale] as any).content },
      })
      console.log(`Post ${doc.slug} (${locale}): internal links pass applied`)
    }
  }
}

async function getStoredContent(payload: any, id: string | number, locale: 'es' | 'en') {
  const stored = await payload.findByID({ collection: 'posts', id, locale })
  return stored?.content ?? null
}

async function main() {
  const payload = await getPayload({ config })
  const table = loadRemapTable()
  const needsReview: string[] = []

  await migratePostsPass1(payload, table, needsReview)
  saveRemapTable(table)

  await remapInternalLinksPass2(payload, table, needsReview)
  saveRemapTable(table)

  console.log('\nneedsReview (posts requiring editorial follow-up or with resolution fallbacks):')
  if (needsReview.length === 0) {
    console.log('  none')
  } else {
    for (const item of needsReview) console.log(`  - ${item}`)
  }

  console.log('\nPosts migration complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Posts migration failed:', err)
  process.exit(1)
})
