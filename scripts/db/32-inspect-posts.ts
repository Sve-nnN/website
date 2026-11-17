/**
 * READ-ONLY. Vuelca a research/seo-plan-2026-11/data/ los posts que tocan el
 * cluster GEO y el rescate de fusiones, más categorías, autores y media, para
 * escribir el script 33 sin adivinar formatos.
 *
 *   ./scripts/db/run-tunneled.sh scripts/db/32-inspect-posts.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const OUT = 'research/seo-plan-2026-11/data'

async function main() {
  mkdirSync(OUT, { recursive: true })
  const payload = await getPayload({ config })
  const slugs = [
    'dynamic-programming',
    'data-structures',
    'complejidad-algoritmica',
    'technical-seo-guide',
    'geo-seo-guia',
    'llms-txt-guia',
    'citabilidad-contenido-ia',
    'medir-citas-ia',
  ]
  for (const slug of slugs) {
    for (const locale of ['es', 'en'] as const) {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        locale,
        fallbackLocale: false,
        draft: true,
      })
      const doc = docs[0]
      console.log(`posts/${slug} [${locale}]: ${doc ? `id=${doc.id} estado=${doc._status} cats=${JSON.stringify(doc.categories)}` : 'NO EXISTE'}`)
      if (doc) writeFileSync(`${OUT}/dump-posts-${slug}-${locale}.json`, JSON.stringify(doc, null, 2))
    }
  }
  const authors = await payload.find({ collection: 'authors', limit: 0, pagination: false, depth: 0 })
  console.log('autores:', authors.docs.map((a) => `${a.id}=${(a as { name?: string }).name}`).join(', '))
  const media = await payload.find({ collection: 'media', limit: 0, pagination: false, depth: 0, locale: 'es' })
  writeFileSync(
    `${OUT}/dump-media.json`,
    JSON.stringify(media.docs.map((m) => ({ id: m.id, filename: (m as { filename?: string }).filename, alt: (m as { alt?: string }).alt })), null, 2),
  )
  console.log(`media: ${media.docs.length}`)
  const tech = await payload.find({
    collection: 'posts',
    limit: 0,
    pagination: false,
    depth: 0,
    locale: 'es',
    draft: false,
    where: { _status: { equals: 'published' } },
  })
  writeFileSync(
    `${OUT}/dump-posts-index.json`,
    JSON.stringify(tech.docs.map((p) => ({ id: p.id, slug: p.slug, title: p.title, cats: p.categories, hero: p.heroImage, meta: p.meta })), null, 2),
  )
  console.log(`posts publicados: ${tech.docs.length}`)
  process.exit(0)
}
main()
