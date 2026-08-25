/**
 * Reescribe los enlaces internos que apuntan a slugs viejos (issue #40).
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/18-enlaces-internos-legacy.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/18-enlaces-internos-legacy.ts --apply
 *
 * ── Qué arregla ─────────────────────────────────────────────────────────────
 *
 * 231 enlaces en el cuerpo de 32 posts apuntan a rutas que hoy responden 308.
 * Las redirecciones funcionan, así que nada se ve roto, y por eso el problema
 * sobrevivió a dos pasadas anteriores. Pero cada enlace interno a la URL vieja
 * le confirma a Google que esa URL sigue viva, que es exactamente lo que
 * bloquea la consolidación del issue #38.
 *
 * ── Por qué el script 16 no los agarró ──────────────────────────────────────
 *
 * `16-consolidar-canibalizacion.ts` ya reescribía enlaces, pero se le
 * escaparon estos por dos motivos independientes:
 *
 * 1. Su `payload.find({ collection: 'posts' })` no pasaba `locale`, así que
 *    solo veía el español. Los 98 enlaces guardados en la fila `en` quedaron
 *    intactos.
 * 2. Su `urlPointsTo()` exigía coincidencia exacta del path, así que ignoraba
 *    las formas absolutas (`https://juan-tech.com/blog/...`) y las
 *    prefijadas con locale (`/en/blog/...`).
 *
 * Este script normaliza antes de comparar: le saca el origen y el prefijo
 * `/en`, compara contra el path canónico, y al reescribir vuelve a armar la
 * URL con la MISMA forma que tenía. Una URL absoluta sigue absoluta, una
 * relativa sigue relativa. El objetivo es cambiar el destino, no normalizar el
 * estilo de enlazado de paso.
 *
 * ── Alcance medido (2026-08-25) ─────────────────────────────────────────────
 *
 *   231 ocurrencias, 32 posts, en `posts.content` y en ningún otro campo.
 *   Todos los nodos son `linkType: "custom"` con `url` plana, o sea que no hay
 *   referencias relacionales que haya que resolver aparte.
 *   Por locale: es=133, en=98.
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')
const ORIGIN = 'https://juan-tech.com'
const LOCALES = ['es', 'en'] as const

/** path viejo (sin origen ni prefijo de locale) -> path nuevo */
const MAP: Record<string, string> = {
  '/blog/general/web-performance-guide': '/blog/tech-seo/web-performance-guide',
  '/blog/general/schema-markup-guide': '/blog/tech-seo/schema-markup-guide',
  '/blog/general/robots-txt-best-practices': '/blog/tech-seo/robots-txt-best-practices',
  '/blog/general/xml-sitemap-automation': '/blog/tech-seo/xml-sitemap-automation',
  '/blog/general/core-web-vitals-guide': '/blog/tech-seo/core-web-vitals-guide',
  '/blog/seo/estrategia-topic-clusters': '/blog/seo/topic-clusters-seo',
  '/blog/seo/guia-google-search-console': '/blog/tech-seo/guia-google-search-console',
  '/blog/tech-seo/nextjs-seo-optimization': '/blog/tech-seo/nextjs-seo',
  '/blog/tech-seo/tech-seo-guide': '/blog/tech-seo/technical-seo-guide',
}

type Parsed = { origin: string; localePrefix: string; path: string; suffix: string }

/** Parte una URL guardada en sus piezas, o null si no es interna. */
function parseInternal(url: string): Parsed | null {
  let rest = url
  let origin = ''

  if (rest.startsWith(ORIGIN)) {
    origin = ORIGIN
    rest = rest.slice(ORIGIN.length)
  } else if (/^https?:\/\//.test(rest)) {
    return null // externa
  }

  if (!rest.startsWith('/')) return null

  // query y hash se conservan tal cual
  const cut = rest.search(/[?#]/)
  const suffix = cut === -1 ? '' : rest.slice(cut)
  let path = cut === -1 ? rest : rest.slice(0, cut)

  let localePrefix = ''
  if (path === '/en' || path.startsWith('/en/')) {
    localePrefix = '/en'
    path = path.slice(3) || '/'
  }

  return { origin, localePrefix, path, suffix }
}

function rewriteUrl(url: string): string | null {
  const parsed = parseInternal(url)
  if (!parsed) return null

  const target = MAP[parsed.path]
  if (!target) return null

  return `${parsed.origin}${parsed.localePrefix}${target}${parsed.suffix}`
}

type Change = { from: string; to: string }

function rewriteNode<T>(node: T, changes: Change[]): T {
  if (Array.isArray(node)) {
    return node.map((child) => rewriteNode(child, changes)) as unknown as T
  }
  if (!node || typeof node !== 'object') return node

  const copy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'url' && typeof value === 'string') {
      const next = rewriteUrl(value)
      if (next && next !== value) {
        changes.push({ from: value, to: next })
        copy[key] = next
        continue
      }
      copy[key] = value
    } else if (value && typeof value === 'object') {
      copy[key] = rewriteNode(value, changes)
    } else {
      copy[key] = value
    }
  }
  return copy as T
}

async function statusOf(path: string): Promise<number> {
  try {
    return (await fetch(`${ORIGIN}${path}`, { redirect: 'manual' })).status
  } catch {
    return 0
  }
}

async function main() {
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} ===\n`)

  // Un enlace interno hacia una URL que no responde 200 es peor que el 308 que
  // reemplaza: el 308 al menos llega. Se verifica en vivo antes de tocar nada.
  console.log('=== verificando los 9 destinos en vivo ===')
  const broken: string[] = []
  for (const target of new Set(Object.values(MAP))) {
    for (const prefix of ['', '/en']) {
      const code = await statusOf(`${prefix}${target}`)
      if (code !== 200) broken.push(`${prefix}${target} -> ${code}`)
      console.log(`  ${code === 200 ? 'OK ' : 'MAL'} ${code}  ${prefix}${target}`)
    }
  }
  if (broken.length > 0) {
    console.error('\nABORTADO: hay destinos que no responden 200:')
    for (const b of broken) console.error(`  ${b}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  let totalChanges = 0
  const touchedDocs = new Set<string>()

  for (const locale of LOCALES) {
    console.log(`\n=== locale ${locale} ===`)
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 0,
      pagination: false,
      depth: 0,
      locale,
    })

    for (const post of docs) {
      const changes: Change[] = []
      const content = rewriteNode((post as { content: unknown }).content, changes)
      if (changes.length === 0) continue

      touchedDocs.add(String(post.slug))
      totalChanges += changes.length

      console.log(`  ${post.slug} (${post._status}) — ${changes.length} enlace(s)`)
      for (const c of changes.slice(0, 3)) console.log(`      ${c.from}\n        -> ${c.to}`)
      if (changes.length > 3) console.log(`      ... y ${changes.length - 3} mas`)

      if (APPLY) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          locale,
          // Sin `draft: false` un update sobre una coleccion con borradores
          // despublica el doc publicado. Ya paso antes, ver
          // scripts/db/05-recategorize-posts.ts.
          draft: post._status === 'published' ? false : undefined,
          data: { content } as never,
        })
      }
    }
  }

  console.log(
    `\n=== ${totalChanges} enlace(s) ${APPLY ? 'reescritos' : 'a reescribir'} en ${touchedDocs.size} post(s) ===`,
  )

  if (!APPLY) {
    console.log('\nCorré con --apply para escribir.')
  } else {
    console.log('\nVerificá que no quede ninguno crawleando el sitio:')
    console.log('  los 9 paths viejos no deben aparecer en ningun href de juan-tech.com')
  }

  process.exit(0)
}

main()
