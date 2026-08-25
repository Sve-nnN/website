/**
 * Crea los redirects que faltan para URLs que Google tiene indexadas y que hoy
 * devuelven 404. Aditivo: solo hace `create`, nunca borra ni actualiza.
 *
 * Run (con el túnel abierto, ver scripts/db/tunnel.sh):
 *   export DATABASE_URI='postgresql://juantech_user:<clave>@127.0.0.1:15432/juantech?sslmode=disable'
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/17-redirects-404-indexadas.ts
 *
 * Para ver qué haría sin escribir:
 *   DRY_RUN=1 node --env-file=.env node_modules/.bin/tsx scripts/db/17-redirects-404-indexadas.ts
 *
 * ── Por qué estas URLs y no otras ────────────────────────────────────────────
 *
 * Los slugs planos del blog (`/blog/tablas-hash`, `/blog/pilas-y-colas`, ...) ya
 * responden 308 sin necesidad de una fila acá: la ruta resuelve el post por slug
 * y redirige sola a su ruta con categoría. Por eso la colección tiene solo 16
 * filas y aun así casi todo el legacy funciona.
 *
 * Las que están acá son las que NO tienen post con ese slug, así que nada las
 * resuelve y caen en 404 duro:
 *
 *   - `content-pillar`     -> el post se llama `pillar-page-seo`
 *   - `seo-content-strategy` -> el post se llama `estrategia-de-contenidos`
 *   - `seo-copywriting`    -> el post se llama `redaccion-seo`
 *   - `payloadcms-seo`     -> el post se llama `payload-cms-guide`
 *   - `nextjs-portfolio`   -> no existe equivalente, va a la ficha del sitio
 *
 * ── Grupo 1: 404 con tráfico medido (issue #37) ──────────────────────────────
 *
 * Search Console, 28 días al 2026-08-23. Las ocho devuelven 404 y Google las
 * sigue mostrando. `/blog/content-pillar` aparece como "Enviada e indexada"
 * contra un 404, y `/blog/nextjs-portfolio` se llevó 2 clics reales que
 * aterrizaron en un error.
 *
 * ── Grupo 2: enlaces internos rotos (issue #40) ──────────────────────────────
 *
 * Dos URLs con 16 enlaces internos entrantes cada una y sin redirect. Sus
 * equivalentes en español sí lo tienen (filas 14 y 8 de la colección).
 *
 * ── Grupo 3: gemelos EN que faltaban (encontrado al hacer los otros dos) ─────
 *
 * Al listar las 16 filas existentes salió el patrón: casi todos los redirects
 * de la migración de slugs se crearon solo para español. Seis quedaron sin su
 * versión `/en/`. No tienen tráfico medido todavía, pero son exactamente el
 * mismo defecto que el grupo 2 y crearlos cuesta lo mismo que dejarlos.
 *
 * ── Seguridad ────────────────────────────────────────────────────────────────
 *
 * Antes de escribir nada, el script verifica EN VIVO que cada destino responda
 * 200. Un redirect a una URL muerta es peor que el 404 que reemplaza.
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const LIVE_BASE = process.env.VERIFY_BASE_URL ?? 'https://juan-tech.com'
const DRY_RUN = process.env.DRY_RUN === '1'

type Entry = { from: string; to: string; grupo: 1 | 2 | 3; nota: string }

const ENTRIES: Entry[] = [
  // Grupo 1 — 404 con impresiones y clics (#37)
  { from: '/blog/content-pillar', to: '/blog/seo/pillar-page-seo', grupo: 1, nota: '117 impresiones' },
  { from: '/en/blog/content-pillar', to: '/en/blog/seo/pillar-page-seo', grupo: 1, nota: '29 impresiones' },
  { from: '/blog/nextjs-portfolio', to: '/websites/juan-tech-com', grupo: 1, nota: '17 impresiones, 2 clics' },
  { from: '/en/blog/nextjs-portfolio', to: '/en/websites/juan-tech-com', grupo: 1, nota: '40 impresiones' },
  { from: '/en/blog/seo-copywriting-guide', to: '/en/blog/seo/redaccion-seo', grupo: 1, nota: '4 impresiones' },
  { from: '/en/blog/seo-copywriting', to: '/en/blog/seo/redaccion-seo', grupo: 1, nota: '3 impresiones' },
  { from: '/blog/seo-content-strategy', to: '/blog/seo/estrategia-de-contenidos', grupo: 1, nota: '3 impresiones' },
  { from: '/blog/payloadcms-seo', to: '/blog/development/payload-cms-guide', grupo: 1, nota: '1 impresion' },

  // Grupo 2 — enlaces internos a 404 (#40)
  { from: '/en/blog/seo/estrategia-topic-clusters', to: '/en/blog/seo/topic-clusters-seo', grupo: 2, nota: '16 enlaces internos' },
  { from: '/en/blog/tech-seo/tech-seo-guide', to: '/en/blog/tech-seo/technical-seo-guide', grupo: 2, nota: '16 enlaces internos' },

  // Grupo 3 — gemelos EN de redirects que solo existian en ES
  { from: '/en/blog/seo/content-pillar', to: '/en/blog/seo/pillar-page-seo', grupo: 3, nota: 'gemelo de la fila ES' },
  { from: '/en/blog/seo/seo-content-strategy', to: '/en/blog/seo/estrategia-de-contenidos', grupo: 3, nota: 'gemelo de la fila ES' },
  { from: '/en/blog/seo/seo-copywriting', to: '/en/blog/seo/redaccion-seo', grupo: 3, nota: 'gemelo de la fila ES' },
  { from: '/en/blog/seo/seo-copywriting-guide', to: '/en/blog/seo/redaccion-seo', grupo: 3, nota: 'gemelo de la fila ES' },
  { from: '/en/blog/seo/keyword-research-guide', to: '/en/blog/seo/guia-keyword-research', grupo: 3, nota: 'gemelo de la fila ES' },
  { from: '/en/blog/tech-seo/nextjs-seo-optimization', to: '/en/blog/tech-seo/nextjs-seo', grupo: 3, nota: 'gemelo de la fila ES' },
]

function safeTarget(uri: string | undefined): string {
  if (!uri) return '(DATABASE_URI no definida)'
  try {
    const u = new URL(uri)
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`
  } catch {
    return '(no parseable como URL)'
  }
}

async function statusOf(path: string): Promise<number> {
  try {
    const res = await fetch(`${LIVE_BASE}${path}`, { redirect: 'manual' })
    return res.status
  } catch {
    return 0
  }
}

async function main() {
  console.log(`=== Base ===\n  ${safeTarget(process.env.DATABASE_URI)}`)
  console.log(`=== Verificando destinos contra ${LIVE_BASE} ===`)

  const rotos: Entry[] = []
  for (const e of ENTRIES) {
    const code = await statusOf(e.to)
    const ok = code === 200
    if (!ok) rotos.push(e)
    console.log(`  ${ok ? 'OK ' : 'MAL'} ${String(code).padEnd(3)} ${e.to}`)
  }

  if (rotos.length > 0) {
    console.error(`\nABORTADO: ${rotos.length} destino(s) no responden 200.`)
    console.error('Un redirect a una URL muerta es peor que el 404 que reemplaza.')
    for (const e of rotos) console.error(`  ${e.from} -> ${e.to}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'redirects',
    limit: 500,
    pagination: false,
    depth: 0,
  })
  const yaEstan = new Set(existing.docs.map((d) => (d as { from: string }).from))

  console.log(`\n=== Colección redirects: ${existing.totalDocs} filas antes ===`)
  console.log(DRY_RUN ? '=== DRY_RUN: no se escribe nada ===\n' : '=== Creando ===\n')

  let creados = 0
  let salteados = 0

  for (const e of ENTRIES) {
    if (yaEstan.has(e.from)) {
      console.log(`  saltea  (ya existe)  ${e.from}`)
      salteados++
      continue
    }

    if (DRY_RUN) {
      console.log(`  crearia  g${e.grupo}  ${e.from} -> ${e.to}   (${e.nota})`)
      creados++
      continue
    }

    await payload.create({
      collection: 'redirects',
      data: { from: e.from, to: { type: 'custom', url: e.to } },
    })
    console.log(`  creado   g${e.grupo}  ${e.from} -> ${e.to}   (${e.nota})`)
    creados++
  }

  console.log(`\n=== Resultado: ${creados} ${DRY_RUN ? 'a crear' : 'creados'}, ${salteados} ya existian ===`)

  if (!DRY_RUN) {
    const despues = await payload.find({
      collection: 'redirects',
      limit: 500,
      pagination: false,
      depth: 0,
    })
    console.log(`=== Colección redirects: ${despues.totalDocs} filas después ===`)
    console.log('\nEl deploy tiene que estar en producción para que sirvan: la')
    console.log('lectura pasa por unstable_cache y el hook afterChange invalida')
    console.log('el tag, pero el 404 solo desaparece cuando el contenedor lee')
    console.log('estas filas. Verificá con:')
    console.log('\n  for u in ' + ENTRIES.map((e) => e.from).join(' ') + '; do')
    console.log('    printf "%-45s " "$u"; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\\n" "https://juan-tech.com$u"')
    console.log('  done')
  }

  process.exit(0)
}

main()
