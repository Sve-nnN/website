/**
 * Recategorización de posts mal clasificados + los 301 que eso obliga.
 *
 * El slug de la categoría primaria manda la URL canónica del post
 * (`blogPostPath` en src/lib/blog-paths.ts), así que mover un post de
 * categoría le cambia la URL a un documento ya indexado. Por eso este script
 * hace las dos cosas juntas: el update de taxonomía y el redirect, nunca una
 * sin la otra.
 *
 * Regla de taxonomía que decide cada movimiento (acordada 2026-08-19):
 *
 *   cs-fundamentals -> teoría independiente del stack: algoritmos, estructuras,
 *                      complejidad, modelado de datos.
 *   development     -> construir con un stack concreto: frameworks, CMS, CSS,
 *                      UX de producto, elección de motor de base de datos.
 *   tech-seo        -> diagnóstico y corrección en el código o la infra.
 *   seo             -> contenido, keywords, autoridad, estrategia.
 *   general         -> solo fallback de `resolvePrimaryCategorySlug`. Vacía.
 *
 * DRY-RUN POR DEFECTO:
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/05-recategorize-posts.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/05-recategorize-posts.ts --apply
 *
 * Contra producción hace falta el túnel (scripts/db/tunnel.sh) y exportar
 * DATABASE_URI apuntando a localhost:15432 ANTES de correrlo.
 *
 * `draft: false` en todo update: sin eso, un update sobre una colección con
 * versiones/drafts deja el cambio en borrador y el sitio sigue sirviendo lo
 * viejo mientras el script se autoverifica en verde (bug d1855df).
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

type Move = {
  post: string
  from: string
  to: string
  why: string
}

/**
 * Solo los posts cuya categoría actual contradice la regla de arriba. Todo lo
 * demás se queda donde está: esto no es una reasignación masiva.
 */
const MOVES: Move[] = [
  {
    post: 'que-es-css',
    from: 'cs-fundamentals',
    to: 'development',
    why: 'CSS es construcción web con un stack, no teoría de computación',
  },
  {
    post: 'experiencia-de-usuario',
    from: 'cs-fundamentals',
    to: 'development',
    why: 'UX de producto, cero algoritmos',
  },
  {
    post: 'sql-vs-nosql',
    from: 'cs-fundamentals',
    to: 'development',
    why: 'elegir motor es decisión de stack; el modelado teórico sí se queda en cs',
  },
  {
    post: 'guia-google-search-console',
    from: 'seo',
    to: 'tech-seo',
    why: 'herramienta de diagnóstico técnico: cobertura, indexación, rastreo',
  },
]

/**
 * Los redirects se crean con `to.type = 'custom'` y la URL completa, NO con
 * `type: 'reference'`. El resolver de referencias arma el destino como
 * `/blog/<slug>` (REDIRECT_COLLECTION_BASE_PATH en src/lib/cache.ts), que es
 * la forma vieja de la URL de un post — hoy viven en /blog/<categoría>/<slug>.
 * Una referencia mandaría el 301 a una URL que ya no existe.
 *
 * Dos docs por post: el middleware busca por pathname crudo, con el prefijo
 * `/en` incluido, así que la versión inglesa necesita su propia entrada.
 */
function redirectPairs(move: Move) {
  const oldPath = `/blog/${move.from}/${move.post}`
  const newPath = `/blog/${move.to}/${move.post}`
  return [
    { from: oldPath, to: newPath },
    { from: `/en${oldPath}`, to: `/en${newPath}` },
  ]
}

async function main() {
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  // Resolver todas las categorías una vez: el mapeo slug -> id se usa en cada
  // movimiento y no cambia entre iteraciones.
  const { docs: cats } = await payload.find({ collection: 'categories', limit: 100 })
  const catId = new Map(cats.map((c) => [c.slug ?? '', c.id]))

  for (const move of MOVES) {
    const target = catId.get(move.to)
    if (!target) {
      console.error(`ABORT: no existe la categoría "${move.to}"`)
      process.exit(1)
    }

    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: move.post } },
      limit: 1,
      depth: 1,
    })
    const post = docs[0] as
      | { id: number; categories?: ({ id: number; slug?: string | null } | number)[] | null }
      | undefined

    if (!post) {
      console.error(`ABORT: no existe el post "${move.post}"`)
      process.exit(1)
    }

    const currentSlugs = (post.categories ?? []).map((c) =>
      typeof c === 'object' && c !== null ? (c.slug ?? String(c.id)) : String(c),
    )

    console.log(`\n  posts/${move.post}`)
    console.log(`    razón:   ${move.why}`)
    console.log(`    antes:   [${currentSlugs.join(', ')}]  ->  /blog/${move.from}/${move.post}`)
    console.log(`    después: [${move.to}]  ->  /blog/${move.to}/${move.post}`)

    // Si la categoría ya es la correcta, el update es ruido pero el redirect
    // puede seguir faltando, así que solo se saltea el update.
    const yaEstaBien = currentSlugs.length === 1 && currentSlugs[0] === move.to

    if (APPLY && !yaEstaBien) {
      // `categories` no está localizado: un solo update sirve para ambos idiomas.
      await payload.update({
        collection: 'posts',
        id: post.id,
        draft: false,
        data: { categories: [target] },
      })
    } else if (yaEstaBien) {
      console.log('    (la categoría ya estaba bien, solo se revisa el redirect)')
    }

    for (const pair of redirectPairs(move)) {
      const { docs: existing } = await payload.find({
        collection: 'redirects',
        where: { from: { equals: pair.from } },
        limit: 1,
      })

      if (existing.length > 0) {
        console.log(`    redirect ya existe: ${pair.from}`)
        continue
      }

      console.log(`    redirect 301: ${pair.from}  ->  ${pair.to}`)

      if (!APPLY) continue

      await payload.create({
        collection: 'redirects',
        data: { from: pair.from, to: { type: 'custom', url: pair.to } },
      })
    }
  }

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correr con --apply para escribir.')
    process.exit(0)
  }

  // --- verificación sobre el estado publicado, no sobre lo que devolvió el update ---
  console.log('\n=== VERIFICACIÓN ===')
  let fallos = 0

  for (const move of MOVES) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: move.post } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    const post = docs[0] as { categories?: ({ slug?: string | null } | number)[] | null } | undefined
    const slugs = (post?.categories ?? []).map((c) =>
      typeof c === 'object' && c !== null ? c.slug : c,
    )
    const ok = slugs.length === 1 && slugs[0] === move.to
    if (!ok) fallos++
    console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${move.post}: [${slugs.join(', ')}]`)

    for (const pair of redirectPairs(move)) {
      const { docs: r } = await payload.find({
        collection: 'redirects',
        where: { from: { equals: pair.from } },
        limit: 1,
      })
      const target = (r[0] as { to?: { url?: string | null } } | undefined)?.to?.url
      const rOk = target === pair.to
      if (!rOk) fallos++
      console.log(`  ${rOk ? 'OK  ' : 'FALLA'} ${pair.from} -> ${target ?? 'nada'}`)
    }
  }

  console.log(
    fallos === 0
      ? '\nTodo verificado contra el estado publicado.'
      : `\n${fallos} verificaciones fallaron. Revisá antes de dar esto por hecho.`,
  )
  process.exit(fallos === 0 ? 0 : 1)
}

main()
