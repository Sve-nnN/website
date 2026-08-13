/**
 * Read-only diagnostic (no writes). Reports, per collection, how many docs are
 * visible with overrideAccess:true (admin view) vs overrideAccess:false
 * (anonymous/public view, i.e. published-only) — the exact difference that
 * causes the post-Phase-43 404s on /blog, /case-studies/*, /blog/*.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/diagnose-publish-status.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const COLLECTIONS = ['pages', 'posts', 'case-studies', 'websites', 'authors', 'categories'] as const

async function main() {
  const payload = await getPayload({ config })

  for (const collection of COLLECTIONS) {
    for (const locale of ['es', 'en'] as const) {
      const all = await payload.find({
        collection,
        locale,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        depth: 0,
      })
      const pub = await payload.find({
        collection,
        locale,
        limit: 0,
        pagination: false,
        overrideAccess: false,
        depth: 0,
      })

      const statusCount: Record<string, number> = {}
      const hidden: string[] = []
      const publishedSlugs = new Set(
        (pub.docs as { slug?: string }[]).map((d) => d.slug ?? '').filter(Boolean),
      )

      for (const doc of all.docs as { slug?: string; _status?: string }[]) {
        const s = String(doc._status)
        statusCount[s] = (statusCount[s] ?? 0) + 1
        if (doc.slug && !publishedSlugs.has(doc.slug)) hidden.push(`${doc.slug}(${s})`)
      }

      console.log(
        `[${collection}][${locale}] total=${all.docs.length} public=${pub.docs.length} statuses=${JSON.stringify(statusCount)}`,
      )
      if (hidden.length) console.log(`   hidden-from-public: ${hidden.join(', ')}`)
    }
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
