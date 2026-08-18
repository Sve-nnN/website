/**
 * READ-ONLY. Identifica CONTRA QUÉ BASE está escribiendo tu `.env`.
 *
 * No imprime usuario ni contraseña, solo host, puerto y nombre de base, más
 * unos pocos valores testigo. Es seguro pegar la salida en el chat.
 *
 * Por qué existe (2026-08-17): 01 y 02 escribieron y se auto-verificaron OK
 * leyendo por el mismo camino que usa el frontend público, y aun así producción
 * siguió sirviendo los valores viejos. Se descartó caché:
 *
 *   - `curl -I https://juan-tech.com/` devuelve `cache-control: no-store`
 *   - un cache-buster (`/?cb=<random>`) sigue devolviendo lo viejo
 *   - las páginas son `force-dynamic` y el `unstable_cache` tiene TTL de 60s,
 *     y pasaron minutos
 *   - `/blog/general/tablas-hash` sigue devolviendo 200 y
 *     `/blog/cs-fundamentals/tablas-hash` redirige, o sea producción sigue
 *     viendo ese post SIN categoría, después de que la escritura se verificó
 *
 * La hipótesis que queda es que este `.env` apunta a una base distinta de la
 * que usa el contenedor de producción. Este script imprime lo necesario para
 * confirmarlo o descartarlo comparando contra la variable DATABASE_URI que
 * tiene configurada la app en Dokploy.
 *
 * Run:
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

function safeTarget(uri: string | undefined): string {
  if (!uri) return '(DATABASE_URI no definida)'
  try {
    const u = new URL(uri)
    // Solo host/puerto/base. Nunca usuario ni contraseña.
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`
  } catch {
    return '(no parseable como URL)'
  }
}

async function main() {
  console.log('=== A dónde apunta este .env ===')
  console.log(`  host/base: ${safeTarget(process.env.DATABASE_URI)}`)

  const payload = await getPayload({ config })

  console.log('\n=== Valores testigo tal como los ve ESTA base ===')

  const th = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'tablas-hash' } },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  const cats = ((th.docs[0] as any)?.categories ?? []).map((c: any) => c?.slug ?? c)
  console.log(`  posts/tablas-hash categorías: ${JSON.stringify(cats)}`)
  console.log(`    -> producción se comporta como si fuera []  (sirve /blog/general/tablas-hash)`)

  const ns = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'nextjs-seo' } },
    locale: 'en',
    limit: 1,
    overrideAccess: false,
  })
  console.log(`  posts/nextjs-seo [en] título: ${(ns.docs[0] as any)?.title}`)
  console.log(`    -> producción sirve: "Next Js Seo: Next.js SEO Best Practices for Optimal Visibility"`)

  const home = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale: 'es',
    limit: 1,
    overrideAccess: false,
  })
  console.log(`  pages/home [es] meta.title: ${(home.docs[0] as any)?.meta?.title}`)
  console.log(`    -> producción sirve: "Juan Carlos Angulo — Inicio"`)

  const counts: Record<string, number> = {}
  for (const c of ['pages', 'posts', 'case-studies', 'authors', 'websites', 'categories'] as const) {
    const r = await payload.find({ collection: c, limit: 0, overrideAccess: false })
    counts[c] = r.totalDocs
  }
  console.log(`\n  Conteos: ${JSON.stringify(counts)}`)

  console.log('\n=== Qué comparar ===')
  console.log('  1. Abrí Dokploy -> la app juan-tech -> Environment.')
  console.log('  2. Mirá el host y el nombre de base de su DATABASE_URI.')
  console.log('  3. Comparalos con el host/base de arriba. Si difieren, todas las')
  console.log('     escrituras de contenido de hoy fueron a la base equivocada.')
  console.log('  4. Si coinciden, no es la base: el siguiente sospechoso es que el')
  console.log('     contenedor corre un build viejo o quedó con un pool apuntando')
  console.log('     a otro sitio, y toca redeploy.')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
