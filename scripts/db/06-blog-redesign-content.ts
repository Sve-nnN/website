/**
 * Contenido del rediseño del blog:
 *
 *   A. Global `blog-promo` (ES + EN): la oferta que aparece dentro del artículo
 *      y la banda que cierra índice, categoría y post. Los datos de la oferta
 *      (600 USD acreditables, 10 días hábiles, qué incluye) se copian del
 *      AuditOfferBlock de la home, que es la fuente real. No se inventa nada.
 *
 *   B. Layout de la página `blog`: el `archiveBlock` de 12 posts planos sale y
 *      entra `blogCategoryRows`, con 3 artículos por categoría y el orden por
 *      peso comercial. También sale `featuredPostsBlock`: con la entrada
 *      destacada arriba (último post) más las filas por categoría, esa grilla
 *      curada era un tercer listado en la misma página.
 *
 * Los bloques con campos localizados comparten `id` entre idiomas. Por eso se
 * escribe primero ES, se leen los ids que Payload generó y se escribe EN con
 * esos mismos ids: sin eso, Payload trata el bloque EN como uno nuevo y el
 * documento queda con dos layouts distintos según el idioma.
 *
 * DRY-RUN POR DEFECTO:
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/06-blog-redesign-content.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/06-blog-redesign-content.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

/** Orden de las filas del índice: peso comercial, no alfabético. */
const CATEGORY_ORDER = ['tech-seo', 'seo', 'development', 'cs-fundamentals']

const PROMO = {
  es: {
    inline: {
      text: 'Si algo parecido está pasando en tu sitio, eso es lo que reviso en una auditoría técnica: sobre tu código, no sobre lo que dice un reporte automático.',
      linkLabel: 'Escríbeme y lo vemos',
      linkUrl: '/contact',
    },
    closing: {
      heading: 'Averigüemos qué está frenando tu sitio',
      body: 'Reviso rastreo, indexación, renderizado, Core Web Vitals y datos estructurados sobre tu código. Te entrego los problemas ordenados por impacto y, al lado de cada uno, la corrección concreta.',
      points: [
        'Auditoría SEO técnica completa por 600 USD',
        'Si después me contratas la implementación, esos 600 se descuentan',
        'Entrega en 10 días hábiles',
      ],
      primaryLabel: 'Pedir la auditoría',
      primaryUrl: '/contact',
      secondaryLabel: 'Seguir leyendo el blog',
      secondaryUrl: '/blog',
    },
  },
  en: {
    inline: {
      text: 'If something like this is happening on your site, that is what I go through in a technical audit: against your code, not against whatever an automated report says.',
      linkLabel: 'Write to me and we look at it',
      linkUrl: '/contact',
    },
    closing: {
      heading: "Let's find out what is holding your site back",
      body: 'I go through crawling, indexing, rendering, Core Web Vitals and structured data against your code. You get the problems ranked by impact, each one with the concrete fix next to it.',
      points: [
        'Full technical SEO audit for 600 USD',
        'If you hire me for the implementation, that 600 comes off the work',
        'Delivered in 10 business days',
      ],
      primaryLabel: 'Request the audit',
      primaryUrl: '/contact',
      secondaryLabel: 'Keep reading the blog',
      secondaryUrl: '/blog',
    },
  },
} as const

const VIEW_ALL = { es: 'Ver más', en: 'View more' }

async function main() {
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  // ---- A. global blog-promo ----
  console.log('\n[A] global blog-promo')
  for (const locale of ['es', 'en'] as const) {
    const data = PROMO[locale]
    console.log(`  ${locale}: cierre "${data.closing.heading}"`)
    if (!APPLY) continue

    await payload.updateGlobal({
      slug: 'blog-promo',
      locale,
      data: {
        inline: { ...data.inline },
        closing: {
          ...data.closing,
          points: data.closing.points.map((item) => ({ item })),
        },
      },
    })
  }

  // ---- B. layout de /blog ----
  console.log('\n[B] layout de la página blog')

  const { docs: cats } = await payload.find({ collection: 'categories', limit: 100 })
  const catId = new Map(cats.map((c) => [c.slug ?? '', c.id]))
  const missing = CATEGORY_ORDER.filter((slug) => !catId.has(slug))
  if (missing.length > 0) {
    console.error(`ABORT: categorías inexistentes: ${missing.join(', ')}`)
    process.exit(1)
  }

  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
    locale: 'es',
    depth: 0,
  })
  const page = pages[0] as { id: number; content?: { layout?: Record<string, unknown>[] } } | undefined

  if (!page) {
    console.error('ABORT: no existe la página con slug "blog"')
    process.exit(1)
  }

  const currentLayout = page.content?.layout ?? []
  const hero = currentLayout.find((b) => b.blockType === 'hero')

  if (!hero) {
    console.error('ABORT: la página blog no tiene bloque hero; no se toca el layout')
    process.exit(1)
  }

  console.log(`  antes:   ${currentLayout.map((b) => b.blockType).join(' -> ')}`)
  console.log('  después: hero -> blogCategoryRows')

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correr con --apply para escribir.')
    process.exit(0)
  }

  const buildLayout = (locale: 'es' | 'en', rowsId?: string) => [
    hero,
    {
      ...(rowsId ? { id: rowsId } : {}),
      blockType: 'blogCategoryRows',
      postsPerCategory: 3,
      viewAllLabel: VIEW_ALL[locale],
      categoryOrder: CATEGORY_ORDER.map((slug) => ({ category: catId.get(slug) })),
    },
  ]

  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'es',
    draft: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { content: { layout: buildLayout('es') } } as any,
  })

  // Se releen los ids que Payload acaba de generar para escribir EN sobre los
  // MISMOS bloques en vez de crear un layout paralelo.
  const { docs: afterEs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
    locale: 'es',
    depth: 0,
  })
  const rowsBlock = (afterEs[0] as { content?: { layout?: { id?: string; blockType: string }[] } })
    ?.content?.layout?.find((b) => b.blockType === 'blogCategoryRows')

  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'en',
    draft: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { content: { layout: buildLayout('en', rowsBlock?.id) } } as any,
  })

  // ---- verificación sobre el estado publicado ----
  console.log('\n=== VERIFICACIÓN ===')
  let fallos = 0

  for (const locale of ['es', 'en'] as const) {
    const promo = (await payload.findGlobal({ slug: 'blog-promo', locale })) as {
      inline?: { text?: string | null }
      closing?: { heading?: string | null; points?: unknown[] }
    }
    const okPromo =
      promo.inline?.text === PROMO[locale].inline.text &&
      promo.closing?.heading === PROMO[locale].closing.heading &&
      (promo.closing?.points ?? []).length === PROMO[locale].closing.points.length
    if (!okPromo) fallos++
    console.log(`  ${okPromo ? 'OK  ' : 'FALLA'} blog-promo [${locale}]`)

    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'blog' } },
      limit: 1,
      locale,
      depth: 0,
      overrideAccess: false,
    })
    const layout = (docs[0] as { content?: { layout?: { blockType: string; viewAllLabel?: string }[] } })
      ?.content?.layout ?? []
    const rows = layout.find((b) => b.blockType === 'blogCategoryRows')
    const okLayout =
      layout.length === 2 &&
      layout[0].blockType === 'hero' &&
      Boolean(rows) &&
      rows?.viewAllLabel === VIEW_ALL[locale]
    if (!okLayout) fallos++
    console.log(
      `  ${okLayout ? 'OK  ' : 'FALLA'} layout blog [${locale}]: ${layout.map((b) => b.blockType).join(' -> ')}`,
    )
  }

  console.log(
    fallos === 0
      ? '\nTodo verificado contra el estado publicado.'
      : `\n${fallos} verificaciones fallaron.`,
  )
  process.exit(fallos === 0 ? 0 : 1)
}

main()
