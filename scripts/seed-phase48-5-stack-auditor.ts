/**
 * Phase 48.5 Plan 03, Task 3 — cierra la fase Auditor Destacado.
 *
 * Agrega el campo `auditorHighlight.narrative` al bloque `toolStack` YA
 * EXISTENTE del doc `pages` slug `stack` (Phase 48), SIN tocar ninguno de sus
 * campos actuales: `intro`, `categoryGroups` (9 tools), `gearIntro`,
 * `gearItems` (13 items), `elegiriaHoy`, `noCommissionPick` viajan
 * exactamente como llegaron del fetch `depth:0` (incluyendo relaciones como
 * IDs crudos) — no se remapean.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-5-stack-auditor.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

// Copy humanizada calibrada contra research/voice-sample-juan.md: primera
// persona, sin em dash, español neutro (sin voceo — CLAUDE.md global de
// Juan), tono directo ya establecido por seed-phase48-stack-content.ts en
// esta misma página. Menciona los 4 datos verificables (29, 5, 500, CWV) y
// el límite honesto del plan gratuito.
const AUDITOR_NARRATIVE: Record<Locale, string> = {
  es: 'Además de recomendar herramientas de terceros, construí la mía: un auditor SEO que corre 29 checks técnicos en 5 categorías, hasta 500 URLs por auditoría, con Core Web Vitals vía PageSpeed Insights. Es la misma herramienta que uso en mis propios proyectos y en los de mis clientes, no una demo aparte. El plan gratuito tiene un límite honesto: 1 auditoría por semana, por email verificado.',
  en: "Besides recommending other people's tools, I built my own: an SEO auditor that runs 29 technical checks across 5 categories, up to 500 URLs per audit, with Core Web Vitals via PageSpeed Insights. It's the same tool I use on my own projects and my clients', not a separate demo. The free tier has an honest limit: 1 audit per week, per verified email.",
}

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'stack' } },
    limit: 1,
  })

  if (docs.length === 0) {
    throw new Error(
      'pages doc slug=stack no existe — correr scripts/seed-phase48-stack-content.ts (Phase 48) primero',
    )
  }
  const docId = docs[0].id

  for (const locale of LOCALES) {
    const fetched = await payload.findByID({
      collection: 'pages',
      id: docId,
      locale,
      depth: 0,
    })

    const layout = (fetched.content?.layout ?? []) as Record<string, unknown>[]
    const toolStackIndex = layout.findIndex((block) => block.blockType === 'toolStack')

    if (toolStackIndex === -1) {
      throw new Error(
        `pages/stack (locale=${locale}): no se encontró ningún bloque blockType==='toolStack' en content.layout`,
      )
    }

    // Copia del bloque EXACTAMENTE como llegó de depth:0 (incluyendo su
    // propio id, categoryGroups, gearItems, elegiriaHoy, noCommissionPick
    // como IDs crudos) más el campo nuevo auditorHighlight.
    const existingToolStackBlock = layout[toolStackIndex]
    const updatedToolStackBlock = {
      ...existingToolStackBlock,
      auditorHighlight: { narrative: AUDITOR_NARRATIVE[locale] },
    }

    const updatedLayout = layout.map((block, i) => (i === toolStackIndex ? updatedToolStackBlock : block))

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        _status: 'published',
        content: { layout: updatedLayout as never },
      },
    })
    console.log(`pages/stack actualizado con auditorHighlight (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
