/**
 * Copy nueva del global `blog-promo`: título de la oferta inline (que pasó de
 * ser una frase suelta a un panel con el shader granulado) y la tarjeta del
 * riel lateral que va debajo de la tabla de contenidos.
 *
 * El resto de los campos del global ya los cargó 06-blog-redesign-content.ts y
 * este script no los toca: `updateGlobal` hace merge por campo, así que enviar
 * solo `inline` y `rail` deja `closing` como está.
 *
 * DRY-RUN POR DEFECTO:
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/07-blog-promo-inline-rail.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/07-blog-promo-inline-rail.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

const COPY = {
  es: {
    inline: {
      title: 'Esto es lo que reviso en una auditoría',
      text: 'Si algo parecido está pasando en tu sitio, lo reviso sobre tu código: rastreo, indexación, renderizado y Core Web Vitals medidos en campo, no lo que dice un reporte automático.',
      linkLabel: 'Escríbeme y lo vemos',
      linkUrl: '/contact',
    },
    rail: {
      title: '¿Te está pasando esto?',
      body: 'Reviso tu sitio sobre el código y te digo qué lo está frenando, ordenado por impacto.',
      linkLabel: 'Ver la auditoría',
      linkUrl: '/contact',
    },
  },
  en: {
    inline: {
      title: 'This is what I go through in an audit',
      text: 'If something like this is happening on your site, I check it against your code: crawling, indexing, rendering and Core Web Vitals measured in the field, not whatever an automated report says.',
      linkLabel: 'Write to me and we look at it',
      linkUrl: '/contact',
    },
    rail: {
      title: 'Running into this?',
      body: 'I go through your site against the code and tell you what is slowing it down, ranked by impact.',
      linkLabel: 'See the audit',
      linkUrl: '/contact',
    },
  },
} as const

async function main() {
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  for (const locale of ['es', 'en'] as const) {
    const data = COPY[locale]
    console.log(`\n  ${locale}`)
    console.log(`    inline.title: ${data.inline.title}`)
    console.log(`    rail.title:   ${data.rail.title}`)

    if (!APPLY) continue

    await payload.updateGlobal({
      slug: 'blog-promo',
      locale,
      data: { inline: { ...data.inline }, rail: { ...data.rail } },
    })
  }

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correr con --apply para escribir.')
    process.exit(0)
  }

  console.log('\n=== VERIFICACIÓN ===')
  let fallos = 0

  for (const locale of ['es', 'en'] as const) {
    const promo = (await payload.findGlobal({ slug: 'blog-promo', locale })) as {
      inline?: { title?: string | null; text?: string | null }
      rail?: { title?: string | null; linkLabel?: string | null }
      closing?: { heading?: string | null }
    }

    const ok =
      promo.inline?.title === COPY[locale].inline.title &&
      promo.inline?.text === COPY[locale].inline.text &&
      promo.rail?.title === COPY[locale].rail.title &&
      promo.rail?.linkLabel === COPY[locale].rail.linkLabel &&
      // El cierre tiene que seguir intacto: si el merge lo borró, el bug es
      // silencioso y se ve recién en producción.
      Boolean(promo.closing?.heading)

    if (!ok) fallos++
    console.log(`  ${ok ? 'OK  ' : 'FALLA'} blog-promo [${locale}] (cierre: "${promo.closing?.heading ?? 'VACÍO'}")`)
  }

  console.log(fallos === 0 ? '\nVerificado.' : `\n${fallos} verificaciones fallaron.`)
  process.exit(fallos === 0 ? 0 : 1)
}

main()
