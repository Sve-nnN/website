/**
 * Phase 48.5 Plan 02, Task 3 Paso 1 — puebla el bloque `auditorCallout` en la
 * landing "Auditoría SEO Técnica" (slug `seo-technical-audit`, es+en),
 * insertado inmediatamente despues de `serviceScopeCard` y antes de
 * `clientLogosBlock` (per 48.5-UI-SPEC.md "Service Landing Block:
 * AuditorCallout").
 *
 * Mismo patron que scripts/seed-phase48-5-home-auditor.ts:
 *   - `getPayload({ config })`, LOCALES = ['es', 'en'] as const.
 *   - Cada locale se trae fresco via `findByID({ locale, depth: 0 })` antes de
 *     mutar (sin resolver relaciones) — el resto de los bloques del array
 *     viajan intactos, con su `id` original, sin tocar sus campos.
 *   - `_status: 'published'` explicito en cada write (bug recurrente
 *     documentado en memoria del proyecto, 2026-08-17).
 *
 * id-reuse discipline (mismo principio que 48.5-01): el bloque `auditorCallout`
 * es una fila NO localizada — una vez insertado en el write de `es`, esa fila
 * YA aparece en el layout devuelto por `findByID({ locale: 'en' })` tambien
 * (con sus campos localizados en blanco para `en` todavia). Por eso la
 * segunda iteracion actualiza la fila existente por indice en vez de
 * insertar una segunda.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-5-landing-auditor.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Block = Record<string, unknown>

// ---------------------------------------------------------------------------
// Copy, calibrada contra research/voice-sample-juan.md (frases largas
// encadenadas por comas, primera persona, sin voceo -- neutral Spanish per
// CLAUDE.md --, sin em dash, vocabulario tecnico sin inflar). Los 4 datos
// verificables (29 checks/5 categorias/500 URLs/CWV via PageSpeed Insights)
// van tejidos en la oracion, este bloque no tiene fila de stats separada.
// ---------------------------------------------------------------------------
const copy: Record<Locale, { heading: string; narrative: string }> = {
  es: {
    heading: 'También tengo un auditor automatizado, gratis',
    narrative:
      'Antes de encargar la auditoría completa, mi auditor automatizado corre 29 checks técnicos en 5 categorías, hasta 500 URLs por corrida, con Core Web Vitals vía PageSpeed Insights, y da un primer diagnóstico gratis. El límite es honesto: 1 auditoría por semana por email verificado.',
  },
  en: {
    heading: 'I also built a free automated auditor',
    narrative:
      "Before hiring the full audit, my automated auditor runs 29 technical checks across 5 categories, up to 500 URLs per run, with Core Web Vitals via PageSpeed Insights, and gives you a free first read. The limit is honest: 1 audit per week per verified email.",
  },
}

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'seo-technical-audit' } },
    limit: 1,
  })

  const pageDoc = docs[0]

  if (!pageDoc) {
    console.error(
      'No se encontro un Pages doc con slug "seo-technical-audit" — cannot seed. Aborting.',
    )
    process.exit(1)
  }

  // Capturado tras el primer write (es) + refetch, reusado en el write de en.
  let newBlockId: string | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({
      collection: 'pages',
      id: pageDoc.id,
      locale,
      depth: 0,
    })

    const currentLayout = [...((doc.content?.layout ?? []) as Block[])]

    const clientLogosIndex = currentLayout.findIndex(
      (block) => block.blockType === 'clientLogosBlock',
    )
    if (clientLogosIndex === -1) {
      console.error(
        `locale=${locale}: no se encontro un bloque clientLogosBlock en el layout de seo-technical-audit — abortando (esperado por 48.5-UI-SPEC.md: auditorCallout debe ir justo antes de clientLogosBlock).`,
      )
      process.exit(1)
    }

    // IMPORTANTE: el bloque auditorCallout es una fila NO localizada — una
    // vez insertado en el write de `es`, esa fila YA aparece en el layout
    // devuelto por findByID({ locale: 'en' }) tambien (con sus campos
    // localizados en blanco para `en` todavia). Por eso NO hay que saltar la
    // segunda iteracion cuando el bloque "ya existe": hay que actualizar SU
    // MISMO id con la copy de este locale, o el `en` nunca se escribe.
    const existingIndex = currentLayout.findIndex((block) => block.blockType === 'auditorCallout')

    const localizedFields = {
      blockType: 'auditorCallout',
      heading: copy[locale].heading,
      narrative: copy[locale].narrative,
    }

    let newLayout: Block[]

    if (existingIndex !== -1) {
      newLayout = currentLayout.map((block, i) =>
        i === existingIndex ? { ...block, ...localizedFields } : block,
      )
      if (!newBlockId && currentLayout[existingIndex]?.id) {
        newBlockId = currentLayout[existingIndex].id as string
      }
    } else {
      const newBlock: Block = {
        ...(newBlockId ? { id: newBlockId } : {}),
        ...localizedFields,
      }
      newLayout = [
        ...currentLayout.slice(0, clientLogosIndex),
        newBlock,
        ...currentLayout.slice(clientLogosIndex),
      ]
    }

    await payload.update({
      collection: 'pages',
      id: pageDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: newLayout as any,
        },
        _status: 'published',
      },
    })

    if (!newBlockId) {
      const refetched = await payload.findByID({ collection: 'pages', id: pageDoc.id, depth: 0 })
      const refetchedLayout = (refetched.content?.layout ?? []) as Block[]
      const inserted = refetchedLayout.find((block) => block.blockType === 'auditorCallout')
      if (!inserted?.id) {
        console.error('No se pudo capturar el id del bloque auditorCallout recien insertado.')
        process.exit(1)
      }
      newBlockId = inserted.id as string
    }

    console.log(`seo-technical-audit: auditorCallout insertado (locale=${locale}, id=${newBlockId})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
