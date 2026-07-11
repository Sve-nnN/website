/**
 * One-off data-quality fix: the "Tablas hash" post (id 56, slug tablas-hash)
 * was migrated verbatim from JuanPortfolio (Phase 4) with an unfilled
 * AI-generation template as its excerpt/meta.description ("Resumen ejecutivo
 * de 40-60 palabras optimizado para AI Overviews (SGE)."), instead of real
 * content. Confirmed via API: the only post (of 66) with this placeholder.
 *
 * Writes a real excerpt matching the site's established excerpt style
 * (2-3 sentences, technical, direct — cross-checked against sibling posts).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/fix-tablas-hash-excerpt.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const EXCERPT_ES =
  'Las tablas hash son estructuras de datos que almacenan pares clave-valor y permiten búsqueda, inserción y eliminación en tiempo casi constante mediante una función hash. Esta guía cubre su funcionamiento, la gestión de colisiones y ejemplos prácticos de aplicación en sistemas informáticos reales.'

const EXCERPT_EN =
  'Hash tables are data structures that store key-value pairs and enable near-constant-time search, insertion, and deletion via a hash function. This guide covers how they work, collision handling, and practical examples in real-world systems.'

async function run() {
  const payload = await getPayload({ config })

  for (const [locale, excerpt] of [
    ['es', EXCERPT_ES],
    ['en', EXCERPT_EN],
  ] as const) {
    await payload.update({
      collection: 'posts',
      id: 56,
      locale,
      data: {
        excerpt,
        meta: { description: excerpt },
      },
    })
    console.log(`Updated locale=${locale}`)
  }

  const verify = await payload.findByID({ collection: 'posts', id: 56, locale: 'es' })
  console.log('Verify ES excerpt:', verify.excerpt)
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
