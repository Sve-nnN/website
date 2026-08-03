/**
 * Read-only diagnostic (no writes): checks the real status of the `pages`
 * doc with slug="blog" — production's public REST API returns 0 docs for
 * this slug (both locales), causing /blog and /en/blog to 404 after Phase 43
 * correctly started enforcing overrideAccess:false (published-only) where
 * the pre-Phase-43 code used the default overrideAccess:true (bypassed
 * publish status silently). This script reads with overrideAccess:true so
 * it can see the doc REGARDLESS of publish status, to confirm what's
 * actually going on (draft vs missing vs something else).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/check-blog-page-status.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  for (const locale of ['es', 'en'] as const) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'blog' } },
      locale,
      limit: 5,
      overrideAccess: true,
    })

    if (docs.length === 0) {
      console.log(`[${locale}] NO doc found with slug="blog" at all (not even as draft).`)
      continue
    }

    for (const doc of docs) {
      console.log(
        `[${locale}] id=${doc.id} slug=${doc.slug} _status=${doc._status} title=${doc.title} updatedAt=${doc.updatedAt}`,
      )
    }
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
