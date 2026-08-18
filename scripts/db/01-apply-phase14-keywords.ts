/**
 * Aplica las keywords de Phase 14 a los meta de Home y Autor.
 *
 * Copy: research/keyword-research/ON-PAGE-APPLICATION.md
 * Keywords: research/keyword-research/KEYWORD-RESEARCH.md (2026-07-11)
 *
 * DRY-RUN POR DEFECTO. No escribe nada hasta que le pases `--apply`.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/01-apply-phase14-keywords.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/01-apply-phase14-keywords.ts --apply
 *
 * Dos precauciones aprendidas de d1855df, donde una corrida "exitosa" aterrizó
 * en un draft y producción nunca cambió:
 *   1. `draft: false` explícito en cada update — pages y authors tienen
 *      versions.drafts activo.
 *   2. Auto-verificación leyendo con `overrideAccess: false` y sin draft, que es
 *      exactamente el camino de lectura del frontend público. Si lo que quedó
 *      escrito no coincide, sale con código 1.
 *
 * NO toca el H1 del Hero. Ese vive dentro de `content.layout` y su forma real
 * hay que leerla primero con 00-report.ts; escribirlo a ciegas puede pisar el
 * bloque entero.
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

type Locale = 'es' | 'en'

const HOME: Record<Locale, { title: string; description: string }> = {
  es: {
    title: 'SEO técnico e ingeniería de software | Juan Carlos Angulo',
    description:
      'Soy ingeniero de software y consultor de SEO técnico: auditorías, rendimiento web y arquitectura Next.js/Payload para posicionar tu sitio en Google.',
  },
  en: {
    title: 'Technical SEO Consultant | Juan Carlos Angulo',
    description:
      "I'm a software engineer and technical SEO consultant: audits, performance, and Next.js/Payload architecture to get your site ranking on Google.",
  },
}

const AUTHOR: Record<Locale, { title: string; description: string }> = {
  es: {
    title: 'Auditoría SEO técnico | Juan Carlos Angulo',
    description:
      'Hago auditorías de SEO técnico sobre el código: rastreo, indexación, Core Web Vitals y arquitectura. Ingeniero de software, no consultor de diapositivas.',
  },
  en: {
    title: 'Technical SEO Specialist | Juan Carlos Angulo',
    description:
      'I work as a technical SEO specialist and software engineer: crawling, indexing, Core Web Vitals and site architecture, fixed directly in the code.',
  },
}

async function applyMeta(
  payload: any,
  collection: 'pages' | 'authors',
  slug: string,
  copy: Record<Locale, { title: string; description: string }>,
) {
  const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  const doc = docs[0]
  if (!doc) {
    console.error(`ABORT: no existe ${collection}/${slug}`)
    process.exit(1)
  }

  for (const locale of ['es', 'en'] as Locale[]) {
    const { docs: before } = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      locale,
      limit: 1,
      overrideAccess: false,
    })
    const b = before[0] as any

    console.log(`\n  ${collection}/${slug} [${locale}]`)
    console.log(`    title  antes:  ${b?.meta?.title ?? '(vacío)'}`)
    console.log(`    title  después: ${copy[locale].title}`)
    console.log(`    desc   antes:  ${b?.meta?.description ?? '(vacío)'}`)
    console.log(`    desc   después: ${copy[locale].description}`)

    if (!APPLY) continue

    await payload.update({
      collection,
      id: doc.id,
      locale,
      draft: false,
      data: { meta: { title: copy[locale].title, description: copy[locale].description } },
    })

    const { docs: after } = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      locale,
      limit: 1,
      overrideAccess: false,
    })
    const a = after[0] as any
    if (a?.meta?.title !== copy[locale].title || a?.meta?.description !== copy[locale].description) {
      console.error(`    VERIFY FAILED — el doc publicado no quedó con la copy esperada.`)
      console.error(`      title leído: ${a?.meta?.title}`)
      console.error(`      desc  leído: ${a?.meta?.description}`)
      process.exit(1)
    }
    console.log(`    OK verificado sobre el doc publicado`)
  }
}

async function main() {
  const payload = await getPayload({ config })

  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  await applyMeta(payload, 'pages', 'home', HOME)
  await applyMeta(payload, 'authors', 'juan-carlos-angulo', AUTHOR)

  console.log(
    APPLY
      ? '\nListo. Verificá en vivo tras el deploy con el bloque de curl de ON-PAGE-APPLICATION.md'
      : '\nDry-run terminado. Volvé a correr con --apply para escribir.',
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
