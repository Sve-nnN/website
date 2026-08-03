/**
 * Fix for the Blog listing 404 in production (both locales).
 *
 * Root cause: the original `scripts/seed-blog-page.ts` calls
 * `payload.update()` without an explicit `draft: false` — same class of bug
 * already hit and fixed in `seed-phase-og-home-description.ts` (Pages has
 * `versions.drafts` enabled, so an update() without `draft:false` can land
 * on a draft version instead of the published one the frontend/REST API
 * reads). Before Phase 43, this was invisible because every frontend query
 * used Payload's default `overrideAccess: true` (bypasses publish status
 * entirely). Phase 43 correctly switched to `overrideAccess: false`
 * (published-only) via `src/lib/cache.ts`'s `getCachedPageBySlug` -- which
 * surfaced that the "blog" Pages doc was never actually published.
 *
 * This script does NOT touch content — it reads the doc's current content
 * (overrideAccess:true, sees it regardless of status) per locale and
 * re-saves the SAME data with `draft: false`, which publishes it. Posts
 * themselves are untouched (Juan confirmed those are already published;
 * this is specifically the Pages doc for the /blog listing shell).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/publish-blog-page.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
    overrideAccess: true,
  })

  const blogDoc = docs[0]

  if (!blogDoc) {
    console.error('No `blog` Pages doc found at all (not even as draft). Aborting — needs seed-blog-page.ts instead.')
    process.exit(1)
  }

  console.log(`Found blog Pages doc id=${blogDoc.id}, current _status=${blogDoc._status}`)

  for (const locale of LOCALES) {
    const localized = await payload.findByID({
      collection: 'pages',
      id: blogDoc.id,
      locale,
      overrideAccess: true,
    })

    await payload.update({
      collection: 'pages',
      id: blogDoc.id,
      locale,
      draft: false,
      data: {
        title: localized.title,
        content: localized.content,
      },
    })
    console.log(`[${locale}] published (title="${localized.title}")`)
  }

  // Self-verify against exactly what the unauthenticated REST/frontend read
  // path sees, same pattern as seed-phase-og-home-description.ts's fix.
  for (const locale of LOCALES) {
    const { docs: verifyDocs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'blog' } },
      locale,
      limit: 1,
      overrideAccess: false,
    })
    if (!verifyDocs[0]) {
      console.error(`[${locale}] VERIFY FAILED — still not visible via published-only read.`)
      process.exit(1)
    }
    console.log(`[${locale}] verified on published doc: title="${verifyDocs[0].title}", _status=${verifyDocs[0]._status}`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
