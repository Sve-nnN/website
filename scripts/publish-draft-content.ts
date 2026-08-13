/**
 * Publishes the docs that are stuck in `_status: 'draft'` in production and
 * are therefore invisible to the public site since Phase 43 started reading
 * with `overrideAccess: false` (published-only).
 *
 * Symptoms this fixes:
 *   - /blog and /en/blog -> 404 (the `blog` Pages doc is a draft)
 *   - 6 of the 7 case studies linked from /case-studies -> 404
 *   - /contact, /privacy, /terms missing from sitemap.xml (their routes still
 *     render because they read with the default overrideAccess:true, but the
 *     sitemap filters on `_status = 'published'`)
 *
 * Root cause of the draft state: seed/humanize scripts called
 * `payload.update()` without an explicit `draft: false`, so the write landed
 * on a draft version instead of publishing. Generalises
 * `scripts/publish-blog-page.ts` (which only covered the `blog` page).
 *
 * NOT destructive: it never writes new content. Per locale it reads the doc
 * with overrideAccess:true (sees it regardless of status) and re-saves the
 * SAME title/content with `draft: false`, which promotes it to published.
 * Docs already published are skipped.
 *
 * Draft POSTS are intentionally left alone — they are leftover seed fixtures
 * (nextjs-portfolio, nextjs-server-components, payloadcms-seo,
 * payloadcms-tutorial, payloadcms-vs-strapi, typescript-best-practices), not
 * linked from anywhere and not in the sitemap. Pass `--include-posts` to
 * publish them too.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/publish-draft-content.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

type TargetCollection = 'pages' | 'case-studies' | 'posts'

const INCLUDE_POSTS = process.argv.includes('--include-posts')

const TARGETS: TargetCollection[] = INCLUDE_POSTS
  ? ['pages', 'case-studies', 'posts']
  : ['pages', 'case-studies']

async function publishCollection(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: TargetCollection,
) {
  const { docs } = await payload.find({
    collection,
    where: { _status: { not_equals: 'published' } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  if (docs.length === 0) {
    console.log(`[${collection}] nothing to publish.`)
    return
  }

  console.log(`[${collection}] ${docs.length} draft doc(s): ${docs.map((d) => d.slug).join(', ')}`)

  for (const doc of docs) {
    for (const locale of LOCALES) {
      const localized = await payload.findByID({
        collection,
        id: doc.id,
        locale,
        depth: 0,
        overrideAccess: true,
      })

      // Re-save the exact same content with draft:false. Only `title` is
      // passed on purpose: Payload merges into the existing doc, so sending
      // the full (depth:0, id-shaped) document back would risk mangling
      // relationship/upload fields. The publish itself is what matters.
      await payload.update({
        collection,
        id: doc.id,
        locale,
        draft: false,
        data: { title: localized.title } as never,
      })

      console.log(`  [${collection}/${doc.slug}][${locale}] published`)
    }
  }

  // Self-verify through exactly what the public read path sees.
  for (const doc of docs) {
    for (const locale of LOCALES) {
      const { docs: check } = await payload.find({
        collection,
        where: { slug: { equals: doc.slug } },
        locale,
        limit: 1,
        depth: 0,
        overrideAccess: false,
      })
      if (!check[0]) {
        console.error(`  VERIFY FAILED: ${collection}/${doc.slug} [${locale}] still not public.`)
        process.exitCode = 1
      }
    }
  }
}

async function main() {
  const payload = await getPayload({ config })

  for (const collection of TARGETS) {
    await publishCollection(payload, collection)
  }

  console.log(process.exitCode === 1 ? 'Done WITH FAILURES (see above).' : 'Done.')
  process.exit(process.exitCode ?? 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
