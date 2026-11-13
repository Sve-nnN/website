/**
 * READ-ONLY. Vuelca a research/seo-plan-2026-11/data/ la estructura real de
 * las páginas que se van a reescribir (servicios, índice de servicios, hubs) y
 * del pie, para poder escribir los cambios sin adivinar el formato de bloques.
 *
 *   ./scripts/db/run-tunneled.sh scripts/db/30-inspect-pages.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const OUT = 'research/seo-plan-2026-11/data'

async function main() {
  mkdirSync(OUT, { recursive: true })
  const payload = await getPayload({ config })
  const slugs = ['servicios', 'seo-consulting', 'seo-technical-audit', 'ai-seo-geo', 'fullstack-development']
  for (const slug of slugs) {
    for (const locale of ['es', 'en'] as const) {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        locale,
        fallbackLocale: false,
        draft: false,
      })
      const doc = docs[0]
      console.log(`pages/${slug} [${locale}]: ${doc ? `id=${doc.id} estado=${doc._status} bloques=${(doc.content as { layout?: unknown[] } | undefined)?.layout?.length ?? 0}` : 'NO EXISTE'}`)
      if (doc) writeFileSync(`${OUT}/dump-pages-${slug}-${locale}.json`, JSON.stringify(doc, null, 2))
    }
  }
  for (const locale of ['es', 'en'] as const) {
    const footer = await payload.findGlobal({ slug: 'footer', depth: 0, locale, fallbackLocale: false })
    writeFileSync(`${OUT}/dump-footer-${locale}.json`, JSON.stringify(footer, null, 2))
    console.log(`footer [${locale}] volcado`)
  }
  const cats = await payload.find({ collection: 'categories', limit: 0, pagination: false, depth: 0, locale: 'es', fallbackLocale: false })
  writeFileSync(`${OUT}/dump-categories-es.json`, JSON.stringify(cats.docs, null, 2))
  console.log(`categorías: ${cats.docs.map((c) => c.slug).join(', ')}`)
  process.exit(0)
}
main()
