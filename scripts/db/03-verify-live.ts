/**
 * READ-ONLY. Compara lo que hay en la base contra lo que sirve producción.
 *
 * Existe por una discrepancia real: el reporte del 2026-08-17 mostró la
 * `meta.description` del Home ya correcta en la base (148 chars publicados),
 * mientras que `curl` a juan-tech.com ese mismo día devolvía la vieja de 36.
 * O sea la base y el HTML servido pueden desincronizarse — probablemente
 * porque `revalidateTag` nunca llegó a correr desde los scripts (ver el
 * `safeRevalidateTag` de src/lib/cache-tags.ts).
 *
 * Este script deja de lado la teoría y muestra las dos cosas lado a lado.
 *
 * Run:
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/03-verify-live.ts
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const BASE = process.env.VERIFY_BASE_URL ?? 'https://juan-tech.com'

type Target = { label: string; url: string; collection: 'pages' | 'authors'; slug: string; locale: 'es' | 'en' }

const TARGETS: Target[] = [
  { label: 'Home ES', url: '/', collection: 'pages', slug: 'home', locale: 'es' },
  { label: 'Home EN', url: '/en', collection: 'pages', slug: 'home', locale: 'en' },
  {
    label: 'Autor ES',
    url: '/authors/juan-carlos-angulo',
    collection: 'authors',
    slug: 'juan-carlos-angulo',
    locale: 'es',
  },
  {
    label: 'Autor EN',
    url: '/en/authors/juan-carlos-angulo',
    collection: 'authors',
    slug: 'juan-carlos-angulo',
    locale: 'en',
  },
]

function pick(html: string, re: RegExp): string {
  const m = html.match(re)
  return m ? m[1] : '(no encontrado)'
}

async function main() {
  const payload = await getPayload({ config })
  let mismatches = 0

  for (const t of TARGETS) {
    const { docs } = await payload.find({
      collection: t.collection,
      where: { slug: { equals: t.slug } },
      locale: t.locale,
      limit: 1,
      overrideAccess: false,
    })
    const d = docs[0] as any

    const html = await fetch(`${BASE}${t.url}`).then((r) => r.text())
    const liveTitle = pick(html, /<title>([^<]*)<\/title>/)
    const liveDesc = pick(html, /<meta name="description" content="([^"]*)"/)

    // El <title> del documento puede llevar sufijo de plantilla, así que se
    // compara por inclusión y no por igualdad estricta.
    const dbTitle = d?.meta?.title ?? '(vacío)'
    const dbDesc = d?.meta?.description ?? '(vacío)'
    const titleOk = dbTitle !== '(vacío)' && liveTitle.includes(dbTitle)
    const descOk = dbDesc !== '(vacío)' && liveDesc === dbDesc

    console.log(`\n=== ${t.label}  (${BASE}${t.url})`)
    console.log(`  title  base: ${dbTitle}`)
    console.log(`  title  live: ${liveTitle}   ${titleOk ? 'OK' : '<-- DESINCRONIZADO'}`)
    console.log(`  desc   base: ${dbDesc}`)
    console.log(`  desc   live: ${liveDesc}   ${descOk ? 'OK' : '<-- DESINCRONIZADO'}`)

    if (!titleOk || !descOk) mismatches++
  }

  console.log(
    mismatches === 0
      ? '\nTodo sincronizado entre base y producción.'
      : `\n${mismatches} página(s) desincronizadas. Si la base está bien y producción no, es caché: ` +
          'esperá el TTL de 60s de CACHE_TTL_SECONDS, o forzá un redeploy.',
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
