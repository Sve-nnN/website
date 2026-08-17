/**
 * Dos arreglos de contenido que no se pueden hacer por código:
 *
 *   A. Posts publicados sin categoría. Caen al fallback `general` de
 *      `resolvePrimaryCategorySlug()`, o sea su URL canónica queda
 *      /blog/general/<slug> en vez de la categoría real. Confirmado en vivo:
 *      juan-tech.com/blog/general/tablas-hash
 *
 *   B. SEO-09 item 6 — títulos EN con el prefijo duplicado, tipo
 *      "Next Js Seo: Next.js SEO Best Practices for Optimal Visibility".
 *      El `headline` del JSON-LD sale de `doc.title`, así que esto es dato,
 *      no código.
 *
 * DRY-RUN POR DEFECTO.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/neon/02-fix-post-taxonomy.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/neon/02-fix-post-taxonomy.ts --apply
 *
 * El mapeo de abajo está VACÍO a propósito. No sé qué categoría le corresponde
 * a cada post huérfano ni cuál es el título EN correcto, y adivinarlo sería
 * inventar contenido. Corré 00-report.ts primero, mandame los bloques 4 y 5, y
 * te devuelvo este archivo con los valores puestos. Si corrés esto con los
 * mapeos vacíos, no hace nada y te lo dice.
 *
 * `draft: false` + auto-verificación sobre el doc publicado, por lo de d1855df.
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

/** slug del post -> slug de la categoría que debe quedar como primaria. */
const CATEGORIA_POR_POST: Record<string, string> = {
  // 'tablas-hash': 'cs-fundamentals',
}

/** slug del post -> título EN corregido (se escribe solo en locale `en`). */
const TITULO_EN_POR_POST: Record<string, string> = {
  // 'next-js-seo': 'Next.js SEO Best Practices for Optimal Visibility',
}

async function main() {
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  const nadaQueHacer =
    Object.keys(CATEGORIA_POR_POST).length === 0 && Object.keys(TITULO_EN_POR_POST).length === 0

  if (nadaQueHacer) {
    console.log(
      '\nLos dos mapeos están vacíos, así que no hay nada que hacer.\n' +
        'Corré 00-report.ts y mandá los bloques 4 y 5 para que se completen con datos reales.',
    )
    process.exit(0)
  }

  // ---- A. categorías ----
  for (const [postSlug, catSlug] of Object.entries(CATEGORIA_POR_POST)) {
    const { docs: cats } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: catSlug } },
      limit: 1,
    })
    const cat = cats[0]
    if (!cat) {
      console.error(`ABORT: no existe la categoría "${catSlug}"`)
      process.exit(1)
    }

    const { docs: posts } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: postSlug } },
      limit: 1,
      depth: 0,
    })
    const post = posts[0] as any
    if (!post) {
      console.error(`ABORT: no existe el post "${postSlug}"`)
      process.exit(1)
    }

    console.log(`\n  posts/${postSlug}`)
    console.log(`    categorías antes:  ${JSON.stringify(post.categories ?? [])}`)
    console.log(`    categorías después: [${cat.id}]  (${catSlug})`)
    console.log(`    URL antes:  /blog/general/${postSlug}`)
    console.log(`    URL después: /blog/${catSlug}/${postSlug}`)

    if (!APPLY) continue

    // `categories` no está localizado: un solo update, sin locale.
    await payload.update({
      collection: 'posts',
      id: post.id,
      draft: false,
      data: { categories: [cat.id] },
    })

    const { docs: after } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: postSlug } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    const slugs = ((after[0] as any)?.categories ?? []).map((c: any) => c?.slug ?? c)
    if (!slugs.includes(catSlug)) {
      console.error(`    VERIFY FAILED — el doc publicado quedó con ${JSON.stringify(slugs)}`)
      process.exit(1)
    }
    console.log(`    OK verificado sobre el doc publicado: ${JSON.stringify(slugs)}`)
  }

  // ---- B. títulos EN ----
  for (const [postSlug, titulo] of Object.entries(TITULO_EN_POR_POST)) {
    const { docs: posts } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: postSlug } },
      locale: 'en',
      limit: 1,
    })
    const post = posts[0] as any
    if (!post) {
      console.error(`ABORT: no existe el post "${postSlug}"`)
      process.exit(1)
    }

    console.log(`\n  posts/${postSlug} [en]`)
    console.log(`    título antes:  ${post.title}`)
    console.log(`    título después: ${titulo}`)

    if (!APPLY) continue

    await payload.update({
      collection: 'posts',
      id: post.id,
      locale: 'en',
      draft: false,
      data: { title: titulo },
    })

    const { docs: after } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: postSlug } },
      locale: 'en',
      limit: 1,
      overrideAccess: false,
    })
    if ((after[0] as any)?.title !== titulo) {
      console.error(`    VERIFY FAILED — quedó "${(after[0] as any)?.title}"`)
      process.exit(1)
    }
    console.log(`    OK verificado sobre el doc publicado`)
  }

  console.log(APPLY ? '\nListo.' : '\nDry-run terminado. Volvé a correr con --apply.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
