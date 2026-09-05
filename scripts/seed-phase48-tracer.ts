/**
 * Phase 48 Plan 01, Task 1 (tracer) — STACK-01:
 *
 * Crea/actualiza el doc `affiliate-links` de DinoRANK y el doc `pages`
 * slug='stack' con UN `toolStack` block (categoryGroups[0].tools[0] =
 * DinoRANK). Prueba la arquitectura completa de punta a punta antes de que
 * 48-02 agregue las 6 herramientas restantes.
 *
 * Contenido real (no fabricado) tomado de 48-CONTEXT.md — narrative/pro/con
 * son breves en esta tarea; 48-02 los expande/humaniza a >=100 palabras.
 *
 * Mismo patrón `reapplyIds` que scripts/seed-phase20-geo-pages.ts
 * (T-19-07): nunca dejar que Payload regenere ids de array/block en el
 * segundo write de locale — causa raíz documentada de colapso de contenido
 * bilingüe en este proyecto.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-tracer.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const DINORANK_TAGLINE: Record<Locale, string> = {
  es: 'Mi suite de SEO todo-en-uno',
  en: 'My all-in-one SEO suite',
}

const DINORANK_CTA_LABEL: Record<Locale, string> = {
  es: 'Probar DinoRANK',
  en: 'Try DinoRANK',
}

const DINORANK_NARRATIVE: Record<Locale, string> = {
  es: 'Uso DinoRANK para investigación de keywords y para escribir contenido con su redactor. Es más barato que otras suites de SEO y cubro casi todo el trabajo diario con una sola herramienta. También cruzo sus datos de keywords con otras fuentes antes de decidir una estrategia.',
  en: "I use DinoRANK for keyword research and to draft content with its writer tool. It's cheaper than other SEO suites and covers most of my daily work in one place. I also cross-check its keyword data against other sources before committing to a strategy.",
}

const DINORANK_PRO: Record<Locale, string> = {
  es: 'Precio y funcionalidad, además del redactor de contenido.',
  en: 'Price versus features, plus the content writer.',
}

const DINORANK_CON: Record<Locale, string> = {
  es: 'La IA de investigación de keywords no siempre arroja resultados, y el mapa de SEO local tarda bastante en generarse.',
  en: "The keyword-research AI doesn't always return results, and the local SEO map takes a long time to generate.",
}

const CATEGORY_HEADING: Record<Locale, string> = {
  es: 'Investigación y contenido SEO',
  en: 'SEO research & content',
}

const STACK_PAGE_TITLE: Record<Locale, string> = {
  es: 'Mi stack',
  en: 'My stack',
}

async function upsertDinorankAffiliateLink(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs } = await payload.find({
    collection: 'affiliate-links',
    where: { slug: { equals: 'dinorank' } },
    limit: 1,
  })

  const baseData = {
    name: 'DinoRANK',
    slug: 'dinorank',
    program: 'dinorank' as const,
    active: true,
    placement: 'both' as const,
    destinations: [
      { marketplace: 'default', url: 'https://dinorank.com/?afid=MTE2NQ==' },
      { marketplace: 'registro', url: 'https://dinorank.com/registro/?afid=MTE2NQ==' },
    ],
    commissionNote: 'Comisión por referido (afid).',
  }

  let docId: number | string

  if (docs.length === 0) {
    const created = await payload.create({
      collection: 'affiliate-links',
      locale: 'es',
      data: {
        ...baseData,
        tagline: DINORANK_TAGLINE.es,
        ctaLabel: DINORANK_CTA_LABEL.es,
      },
    })
    docId = created.id
    console.log(`Created affiliate-links doc slug=dinorank (id=${docId})`)
  } else {
    docId = docs[0].id
    console.log(`affiliate-links doc slug=dinorank ya existe (id=${docId}) — actualizando`)
    await payload.update({
      collection: 'affiliate-links',
      id: docId,
      locale: 'es',
      data: { ...baseData, tagline: DINORANK_TAGLINE.es, ctaLabel: DINORANK_CTA_LABEL.es },
    })
  }

  await payload.update({
    collection: 'affiliate-links',
    id: docId,
    locale: 'en',
    data: { tagline: DINORANK_TAGLINE.en, ctaLabel: DINORANK_CTA_LABEL.en },
  })

  return docId
}

/** Mismo patrón que scripts/seed-phase20-geo-pages.ts (T-19-07). */
function reapplyIds(
  freshLayout: Record<string, unknown>[],
  referenceLayout: Record<string, unknown>[] | undefined,
): Record<string, unknown>[] {
  if (!referenceLayout) return freshLayout

  return freshLayout.map((block, i) => {
    const refBlock = referenceLayout[i] as Record<string, unknown> | undefined
    if (!refBlock || refBlock.blockType !== block.blockType) {
      if (refBlock) {
        console.warn(
          `reapplyIds: blockType mismatch at index ${i} (fresh=${block.blockType}, ref=${refBlock.blockType}) — skipping id reuse for this block`,
        )
      }
      return block
    }

    const withId: Record<string, unknown> = { ...block, id: refBlock.id }

    if (block.blockType === 'toolStack') {
      const refGroups = (refBlock.categoryGroups as Record<string, unknown>[] | undefined) ?? []
      withId.categoryGroups = ((block.categoryGroups as Record<string, unknown>[]) ?? []).map(
        (group, gi) => {
          const refGroup = refGroups[gi]
          if (!refGroup) return group

          const refTools = (refGroup.tools as Record<string, unknown>[] | undefined) ?? []
          return {
            ...group,
            id: refGroup.id,
            tools: ((group.tools as Record<string, unknown>[]) ?? []).map((tool, ti) =>
              refTools[ti] ? { ...tool, id: refTools[ti].id } : tool,
            ),
          }
        },
      )
    }

    return withId
  })
}

function buildStackLayout(locale: Locale, dinorankId: number | string): Record<string, unknown>[] {
  return [
    {
      blockType: 'toolStack',
      categoryGroups: [
        {
          heading: CATEGORY_HEADING[locale],
          tools: [
            {
              name: 'DinoRANK',
              affiliateLink: dinorankId,
              narrative: DINORANK_NARRATIVE[locale],
              pro: DINORANK_PRO[locale],
              con: DINORANK_CON[locale],
              referenceLink: { type: 'custom', url: '/case-studies' },
            },
          ],
        },
      ],
      elegiriaHoy: DINORANK_NARRATIVE[locale],
    },
  ]
}

async function upsertStackPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  dinorankId: number | string,
) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'stack' } },
    limit: 1,
  })

  let docId: number | string

  if (docs.length === 0) {
    const created = await payload.create({
      collection: 'pages',
      locale: 'es',
      data: {
        title: STACK_PAGE_TITLE.es,
        slug: 'stack',
        _status: 'published',
        content: { layout: buildStackLayout('es', dinorankId) as never },
      },
    })
    docId = created.id
    console.log(`Created pages doc slug=stack (id=${docId})`)
  } else {
    docId = docs[0].id
    console.log(`pages doc slug=stack ya existe (id=${docId}) — actualizando ambos locales`)
  }

  const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
  const referenceLayout = refetched.content?.layout as Record<string, unknown>[] | undefined

  for (const locale of LOCALES) {
    const freshLayout = buildStackLayout(locale, dinorankId)
    const layoutWithIds = reapplyIds(freshLayout, referenceLayout)

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: STACK_PAGE_TITLE[locale],
        _status: 'published',
        content: { layout: layoutWithIds as never },
      },
    })
  }
}

async function main() {
  const payload = await getPayload({ config })

  const dinorankId = await upsertDinorankAffiliateLink(payload)
  await upsertStackPage(payload, dinorankId)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
