/**
 * Phase 34 — read-only inspection of the current `seo-tecnico-madrid` /
 * `seo-tecnico-lima` pages' layout (both locales) before editing them.
 * Not part of the apply step; safe to leave or delete after use.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/phase34-inspect-pages.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  for (const slug of ['seo-tecnico-madrid', 'seo-tecnico-lima']) {
    for (const locale of ['es', 'en'] as const) {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        depth: 0,
      })
      const layout = (docs[0]?.content?.layout ?? []) as Record<string, unknown>[]
      console.log(`\n=== ${slug} [${locale}] id=${docs[0]?.id} block types: ${layout.map((b) => b.blockType).join(', ')} ===`)
      console.log('--- block[0] ---')
      console.log(JSON.stringify(layout[0], null, 2))
    }
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
