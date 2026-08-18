/**
 * READ-ONLY. Identifica CONTRA QUÉ BASE está escribiendo tu `.env`, y compara
 * un puñado de valores testigo contra lo que sirve producción EN VIVO.
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
 *   - `/blog/general/tablas-hash` seguía devolviendo 200 y
 *     `/blog/cs-fundamentals/tablas-hash` redirigía, o sea producción seguía
 *     viendo ese post SIN categoría, después de que la escritura se verificó
 *
 * La hipótesis que quedaba era que este `.env` apuntaba a una base distinta
 * de la que usa el contenedor de producción. Se confirmó: era una Neon
 * abandonada.
 *
 * CORRECCIÓN (2026-08-18): la primera versión de este script imprimía "lo que
 * sirve producción" como texto fijo, congelado el día del incidente. Otra
 * sesión lo detectó — esas líneas describían el estado de esa fecha, no una
 * comprobación en vivo, y alguien podría haberlas leído como estado actual
 * sin volver a mirar el sitio real. Ahora hace el fetch de verdad contra
 * `VERIFY_BASE_URL` (default producción) cada vez que corre.
 *
 * Run:
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const LIVE_BASE = process.env.VERIFY_BASE_URL ?? 'https://juan-tech.com'

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
  const catSlug = cats[0] ?? 'general'
  console.log(`  posts/tablas-hash categorías (base): ${JSON.stringify(cats)}`)
  const liveRouteStatus = await fetch(`${LIVE_BASE}/blog/${catSlug}/tablas-hash`, {
    redirect: 'manual',
  }).then((r) => r.status)
  console.log(
    `    -> producción EN VIVO ahora mismo: /blog/${catSlug}/tablas-hash responde ${liveRouteStatus} ${liveRouteStatus === 200 ? 'OK' : '<-- no es 200'}`,
  )

  const ns = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'nextjs-seo' } },
    locale: 'en',
    limit: 1,
    overrideAccess: false,
  })
  const dbNsTitle = (ns.docs[0] as any)?.title
  console.log(`  posts/nextjs-seo [en] título (base): ${dbNsTitle}`)
  const liveNsHtml = await fetch(`${LIVE_BASE}/en/blog/tech-seo/nextjs-seo`).then((r) => r.text())
  const liveNsH1 = liveNsHtml.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1]?.replace(/<[^>]*>/g, '')
  console.log(
    `    -> producción EN VIVO ahora mismo, H1: "${liveNsH1 ?? '(no encontrado)'}" ${liveNsH1 === dbNsTitle ? 'OK' : '<-- no coincide con la base'}`,
  )

  const home = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale: 'es',
    limit: 1,
    overrideAccess: false,
  })
  const dbHomeTitle = (home.docs[0] as any)?.meta?.title
  console.log(`  pages/home [es] meta.title (base): ${dbHomeTitle}`)
  const liveHomeHtml = await fetch(`${LIVE_BASE}/`).then((r) => r.text())
  const liveHomeTitle = liveHomeHtml.match(/<title>([^<]*)<\/title>/)?.[1]
  console.log(
    `    -> producción EN VIVO ahora mismo, <title>: "${liveHomeTitle ?? '(no encontrado)'}" ${liveHomeTitle === dbHomeTitle ? 'OK' : '<-- no coincide con la base'}`,
  )

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
