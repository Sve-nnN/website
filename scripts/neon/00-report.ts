/**
 * READ-ONLY. No escribe nada. Corrélo primero y mandame la salida entera.
 *
 * Existe porque Neon es inalcanzable desde la máquina donde se desarrolla
 * (`read ECONNRESET` sostenido, mientras producción conecta sin problema), así
 * que el estado real del contenido no se puede inspeccionar desde acá. Los
 * scripts de escritura que siguen a este se escriben CONTRA esta salida, no
 * contra suposiciones.
 *
 * Run:
 *   node --env-file=.env node_modules/.bin/tsx scripts/neon/00-report.ts
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

function line(label: string, value: unknown) {
  const str = value === undefined || value === null ? '(vacío)' : String(value)
  const len = typeof value === 'string' ? ` [${value.length} chars]` : ''
  console.log(`    ${label.padEnd(16)} ${str}${len}`)
}

async function main() {
  const payload = await getPayload({ config })

  console.log('='.repeat(72))
  console.log('BLOQUE 1 — Páginas: meta.title / meta.description / targetKeyword')
  console.log('='.repeat(72))

  // La corrida del 2026-08-17 buscó 'servicios' y 'blog' y no los encontró:
  // esos slugs no existen en la colección. En vez de adivinar, se listan TODOS
  // los slugs reales primero y después se detallan uno por uno.
  const { docs: allPages } = await payload.find({
    collection: 'pages',
    limit: 200,
    overrideAccess: false,
  })
  const PAGE_SLUGS = (allPages as any[]).map((d) => d.slug).filter(Boolean)
  console.log(`\n  Slugs reales en \`pages\` (${PAGE_SLUGS.length}): ${PAGE_SLUGS.join(', ')}`)

  for (const slug of PAGE_SLUGS) {
    for (const locale of LOCALES) {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        // Sin draft y con overrideAccess:false = exactamente lo que lee el
        // frontend público. Si acá aparece vacío pero en el admin se ve lleno,
        // el dato está en un draft sin publicar (fue el bug de d1855df).
        overrideAccess: false,
      })
      const d = docs[0] as any
      console.log(`\n  pages/${slug} [${locale}] ${d ? '' : '  <-- NO ENCONTRADO / NO PUBLICADO'}`)
      if (!d) continue
      line('id', d.id)
      line('_status', d._status)
      line('title', d.title)
      line('meta.title', d.meta?.title)
      line('meta.description', d.meta?.description)
      line('targetKeyword', JSON.stringify(d.targetKeyword ?? null))
    }
  }

  console.log('\n' + '='.repeat(72))
  console.log('BLOQUE 2 — Estructura del bloque Hero de Home (para ubicar el H1)')
  console.log('='.repeat(72))

  for (const locale of LOCALES) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      locale,
      limit: 1,
      overrideAccess: false,
    })
    const layout = (docs[0] as any)?.content?.layout ?? []
    console.log(`\n  home [${locale}] — ${layout.length} bloque(s)`)
    layout.forEach((b: any, i: number) => {
      const extra = b.blockType === 'hero' ? `  variant=${b.variant}  title="${b.title}"` : ''
      console.log(`    [${i}] blockType=${b.blockType}  id=${b.id}${extra}`)
    })
  }

  console.log('\n' + '='.repeat(72))
  console.log('BLOQUE 3 — Autor: meta y campos de rol')
  console.log('='.repeat(72))

  for (const locale of LOCALES) {
    const { docs } = await payload.find({
      collection: 'authors',
      where: { slug: { equals: 'juan-carlos-angulo' } },
      locale,
      limit: 1,
      overrideAccess: false,
    })
    const d = docs[0] as any
    console.log(`\n  authors/juan-carlos-angulo [${locale}] ${d ? '' : '  <-- NO ENCONTRADO'}`)
    if (!d) continue
    line('id', d.id)
    line('name', d.name)
    line('jobTitle', d.jobTitle)
    line('meta.title', d.meta?.title)
    line('meta.description', d.meta?.description)
    line('targetKeyword', JSON.stringify(d.targetKeyword ?? null))
  }

  console.log('\n' + '='.repeat(72))
  console.log('BLOQUE 4 — Posts sin categoría (rompen la URL a /blog/general/...)')
  console.log('='.repeat(72))

  const posts = await payload.find({
    collection: 'posts',
    limit: 200,
    depth: 1,
    where: { _status: { equals: 'published' } },
    overrideAccess: false,
  })
  const sinCat = (posts.docs as any[]).filter((d) => !(d.categories ?? []).length)
  console.log(`\n  ${posts.totalDocs} posts publicados, ${sinCat.length} sin categoría`)
  sinCat.forEach((d) => console.log(`    - ${d.slug}  (id=${d.id})  "${d.title}"`))

  const cats = await payload.find({ collection: 'categories', limit: 50, overrideAccess: false })
  console.log(`\n  Categorías disponibles:`)
  ;(cats.docs as any[]).forEach((c) => console.log(`    - ${c.slug}  (id=${c.id})  "${c.title}"`))

  console.log('\n' + '='.repeat(72))
  console.log('BLOQUE 5 — Títulos EN sospechosos de prefijo duplicado (SEO-09 item 6)')
  console.log('='.repeat(72))

  const postsEn = await payload.find({
    collection: 'posts',
    locale: 'en',
    limit: 200,
    where: { _status: { equals: 'published' } },
    overrideAccess: false,
  })
  console.log()
  ;(postsEn.docs as any[]).forEach((d) => {
    // Heurística: "Algo: Algo ..." donde el prefijo antes de los dos puntos se
    // repite (normalizado) dentro de la parte de la derecha.
    const m = String(d.title ?? '').match(/^(.+?):\s*(.+)$/)
    if (!m) return
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (norm(m[2]).includes(norm(m[1]))) {
      console.log(`    SOSPECHOSO  ${d.slug}  (id=${d.id})`)
      console.log(`                "${d.title}"`)
    }
  })

  console.log('\n' + '='.repeat(72))
  console.log('BLOQUE 6 — Rutas sin meta.description (issue #8)')
  console.log('='.repeat(72))

  for (const collection of ['pages', 'posts', 'case-studies', 'authors', 'websites'] as const) {
    for (const locale of LOCALES) {
      const { docs, totalDocs } = await payload.find({
        collection,
        locale,
        limit: 200,
        overrideAccess: false,
      })
      const faltan = (docs as any[]).filter((d) => !d.meta?.description)
      const cortas = (docs as any[]).filter(
        (d) => d.meta?.description && d.meta.description.length < 110,
      )
      console.log(
        `\n  ${collection} [${locale}]: ${totalDocs} docs, ${faltan.length} sin description, ${cortas.length} con <110 chars`,
      )
      faltan.forEach((d) => console.log(`    FALTA   ${d.slug ?? d.id}`))
      cortas.forEach((d) =>
        console.log(`    CORTA   ${d.slug ?? d.id}  [${d.meta.description.length}]`),
      )
    }
  }

  console.log('\n' + '='.repeat(72))
  console.log('FIN DEL REPORTE — mandale esta salida completa a Claude')
  console.log('='.repeat(72))
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
