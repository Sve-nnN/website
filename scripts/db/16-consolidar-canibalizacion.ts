/**
 * Consolida los 7 grupos de posts canibalizados (issue #5).
 *
 * Las ganadoras salen de Search Console, 6 meses de datos (2026-02-22 a
 * 2026-08-22), no de la longitud ni de los enlaces internos. En tres grupos
 * los datos contradicen a la intuición: gana la URL con impresiones aunque
 * tenga MENOS enlaces internos que la otra. Por eso el issue exigía mirar GSC
 * antes de tocar nada.
 *
 * Qué hace, por cada perdedora:
 *
 * 1. **Guarda su contenido** en `research/canibalizacion/<slug>.json` antes de
 *    tocarla. La fusión editorial viene después y a mano; despublicar sin
 *    tener el texto a la vista sería perderlo detrás de un `_status`.
 * 2. **Crea el redirect 301** en la colección `redirects`, que es de donde el
 *    middleware los resuelve.
 * 3. **Despublica** el post. No lo borra: el doc queda en borrador, así que
 *    revertir es cambiar un campo.
 * 4. **Reescribe los enlaces internos** que apuntaban a ella. Un 301 que deja
 *    los enlaces viejos apuntando al redirect es trabajo a medias: cada salto
 *    diluye y encima el usuario paga la latencia.
 *
 * Reversible: los redirects se borran desde el admin, los posts se vuelven a
 * publicar y los enlaces quedan guardados en el JSON del paso 1.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/16-consolidar-canibalizacion.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/16-consolidar-canibalizacion.ts --apply
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')
const BACKUP_DIR = 'research/canibalizacion'

type Consolidation = {
  group: string
  /** slug ganador */
  winner: string
  /** ruta publica del ganador, sin prefijo de idioma */
  winnerPath: string
  /** slugs que se consolidan, con su ruta publica actual */
  losers: { slug: string; path: string }[]
  /** por que gana, con el dato que lo respalda */
  reason: string
}

const PLAN: Consolidation[] = [
  {
    group: 'topic clusters',
    winner: 'topic-clusters-seo',
    winnerPath: '/blog/seo/topic-clusters-seo',
    losers: [{ slug: 'estrategia-topic-clusters', path: '/blog/seo/estrategia-topic-clusters' }],
    reason: '320 impresiones contra 0. La perdedora tiene 17 enlaces internos y la ganadora 2: se reescriben.',
  },
  {
    group: 'pillar page',
    winner: 'pillar-page-seo',
    winnerPath: '/blog/seo/pillar-page-seo',
    losers: [{ slug: 'content-pillar', path: '/blog/seo/content-pillar' }],
    reason: '305 impresiones contra 0.',
  },
  {
    group: 'next.js SEO',
    winner: 'nextjs-seo',
    winnerPath: '/blog/tech-seo/nextjs-seo',
    losers: [{ slug: 'nextjs-seo-optimization', path: '/blog/tech-seo/nextjs-seo-optimization' }],
    reason: '131 impresiones y 1 clic contra 37 y 0. La perdedora tiene 18 enlaces internos: se reescriben.',
  },
  {
    group: 'keyword research',
    winner: 'guia-keyword-research',
    winnerPath: '/blog/seo/guia-keyword-research',
    losers: [{ slug: 'keyword-research-guide', path: '/blog/seo/keyword-research-guide' }],
    reason:
      'Posicion 19,9 contra 41,2 y 24 enlaces internos contra 1. La perdedora tiene mas impresiones (112 contra 11) pero en la pagina 4, donde no las ve nadie. La decision mas discutible de las siete.',
  },
  {
    group: 'guia SEO tecnico',
    winner: 'technical-seo-guide',
    winnerPath: '/blog/tech-seo/technical-seo-guide',
    losers: [{ slug: 'tech-seo-guide', path: '/blog/tech-seo/tech-seo-guide' }],
    reason:
      'Sin señal clara en ninguna (21 impresiones contra 7): decide el contenido, 3644 palabras contra 1459. La perdedora tiene 18 enlaces internos: se reescriben.',
  },
  {
    group: 'copywriting SEO',
    winner: 'redaccion-seo',
    winnerPath: '/blog/seo/redaccion-seo',
    losers: [
      { slug: 'seo-copywriting', path: '/blog/seo/seo-copywriting' },
      { slug: 'seo-copywriting-guide', path: '/blog/seo/seo-copywriting-guide' },
    ],
    reason: 'Ninguna de las tres tiene señal: decide el contenido, 3958 palabras contra 2747 y 2868.',
  },
  {
    group: 'estrategia de contenidos',
    winner: 'estrategia-de-contenidos',
    winnerPath: '/blog/seo/estrategia-de-contenidos',
    losers: [{ slug: 'seo-content-strategy', path: '/blog/seo/seo-content-strategy' }],
    reason: 'Ninguna tiene señal: decide el contenido, 3711 palabras contra 2269.',
  },
]

/** Reemplaza en un arbol lexical toda URL que apunte a `from` por `to`. */
function rewriteLinks<T>(node: T, from: string, to: string, counter: { n: number }): T {
  if (Array.isArray(node)) {
    return node.map((child) => rewriteLinks(child, from, to, counter)) as unknown as T
  }
  if (!node || typeof node !== 'object') return node

  const copy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'url' && typeof value === 'string' && urlPointsTo(value, from)) {
      copy[key] = value.replace(from, to)
      counter.n += 1
    } else if (value && typeof value === 'object') {
      copy[key] = rewriteLinks(value, from, to, counter)
    } else {
      copy[key] = value
    }
  }
  return copy as T
}

/** `/blog/seo/x` no debe matchear `/blog/seo/x-guide`. */
function urlPointsTo(url: string, path: string): boolean {
  return url === path || url.startsWith(`${path}?`) || url.startsWith(`${path}#`)
}

async function main() {
  const payload = await getPayload({ config })
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} ===`)

  if (APPLY) mkdirSync(BACKUP_DIR, { recursive: true })

  for (const item of PLAN) {
    console.log(`\n=== ${item.group} -> ${item.winnerPath}`)
    console.log(`    ${item.reason}`)

    const { docs: winnerDocs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: item.winner } },
      limit: 1,
    })
    if (!winnerDocs[0]) {
      console.error(`    LA GANADORA NO EXISTE (${item.winner}), se saltea el grupo`)
      process.exitCode = 1
      continue
    }

    for (const loser of item.losers) {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: loser.slug } },
        limit: 1,
      })
      const doc = docs[0]

      if (!doc) {
        console.log(`    ${loser.slug}: no existe, nada que consolidar`)
        continue
      }

      console.log(`    ${loser.slug}  (estado: ${doc._status})`)

      // 1. copia de seguridad antes de tocar nada
      if (APPLY) {
        writeFileSync(`${BACKUP_DIR}/${loser.slug}.json`, JSON.stringify(doc, null, 2))
        console.log(`      guardado en ${BACKUP_DIR}/${loser.slug}.json`)
      }

      // 2. redirect
      const { docs: existing } = await payload.find({
        collection: 'redirects',
        where: { from: { equals: loser.path } },
        limit: 1,
      })

      if (existing[0]) {
        console.log(`      ya hay redirect para ${loser.path}`)
      } else if (APPLY) {
        await payload.create({
          collection: 'redirects',
          data: { from: loser.path, to: { type: 'custom', url: item.winnerPath } },
        })
        console.log(`      redirect ${loser.path} -> ${item.winnerPath}`)
      } else {
        console.log(`      crearia redirect ${loser.path} -> ${item.winnerPath}`)
      }

      // 3. despublicar
      if (APPLY) {
        await payload.update({
          collection: 'posts',
          id: doc.id,
          data: { _status: 'draft' },
        })
        console.log('      despublicado')
      } else {
        console.log('      despublicaria el post')
      }

      // 4. reescribir enlaces internos
      const { docs: allPosts } = await payload.find({
        collection: 'posts',
        limit: 0,
        depth: 0,
      })

      let touched = 0
      for (const post of allPosts) {
        const counter = { n: 0 }
        const content = rewriteLinks(post.content, loser.path, item.winnerPath, counter)
        if (counter.n === 0) continue

        touched += 1
        if (APPLY) {
          await payload.update({
            collection: 'posts',
            id: post.id,
            // `draft: false` para no despublicar un post publicado al editarlo.
            draft: post._status === 'published' ? false : undefined,
            data: { content },
          })
        }
        console.log(`      ${APPLY ? 'reescrito' : 'reescribiria'} ${counter.n} enlace(s) en ${post.slug}`)
      }
      if (touched === 0) console.log('      sin enlaces internos en el cuerpo de otros posts')
    }
  }

  if (!APPLY) {
    console.log('\nCorré con --apply para escribir.')
    return
  }

  console.log('\n--- verificacion ---')
  for (const item of PLAN) {
    for (const loser of item.losers) {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: loser.slug } },
        limit: 1,
      })
      const { docs: redirects } = await payload.find({
        collection: 'redirects',
        where: { from: { equals: loser.path } },
        limit: 1,
      })
      const state = docs[0]?._status ?? 'no existe'
      const ok = state === 'draft' && !!redirects[0]
      console.log(`  ${ok ? 'OK  ' : 'MAL '} ${loser.path}  estado=${state}  redirect=${!!redirects[0]}`)
      if (!ok) process.exitCode = 1
    }
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
