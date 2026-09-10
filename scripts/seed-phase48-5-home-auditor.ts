/**
 * Phase 48.5 Plan 01, Task 1 Paso 7 — puebla el bloque `AuditorHighlight` en
 * Home (es+en), insertado entre `servicesShowcase` y `aboutSection`, NUNCA
 * adyacente a `auditOfferBlock` (per 48.5-UI-SPEC.md).
 *
 * Sigue el patron de scripts/humanize-home-page.ts:
 *   - `getPayload({ config })`, LOCALES = ['es', 'en'] as const.
 *   - Cada locale se trae fresco via `findByID({ locale, depth: 0 })` antes de
 *     mutar (sin resolver relaciones) — el resto de los bloques del array
 *     viajan intactos, con su `id` original, sin tocar sus campos.
 *   - `_status: 'published'` explicito en cada write (bug recurrente
 *     documentado en memoria del proyecto, 2026-08-17: escrituras que quedan
 *     en draft se auto-verifican OK mientras produccion sigue sirviendo lo
 *     viejo).
 *
 * id-reuse discipline (mismo principio que T-30-04 en humanize-home-page.ts):
 * en la escritura de `es` el bloque nuevo no tiene id previo que reusar
 * (Payload se lo asigna al insertar). Se refetchea con depth:0 tras esa
 * escritura para capturar el id asignado, y se reusa ese mismo id en la
 * escritura de `en` — de lo contrario Payload, al no encontrar coincidencia
 * de id para el bloque nuevo en el segundo write, insertaria una SEGUNDA fila
 * en vez de actualizar la primera, dejando dos AuditorHighlight duplicados
 * (uno en es, otro en en) en vez de un solo bloque bilingue.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-5-home-auditor.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Block = Record<string, unknown>

// ---------------------------------------------------------------------------
// Copy, humanizada contra research/voice-sample-juan.md (frases largas
// encadenadas por comas, primera persona, sin em dash, vocabulario tecnico
// sin inflar, cero frases de cierre motivacionales genericas). Los 4 datos
// verificables (29 checks/5 categorias/500 URLs/CWV) NO son parte de esta
// copy editorial — viven como constantes en src/lib/auditor.ts y se resuelven
// en el Component, no en el CMS.
// ---------------------------------------------------------------------------
const copy: Record<Locale, { title: string; description: string; freeTierNote: string }> = {
  es: {
    title: 'Construí mi propio auditor SEO',
    description:
      'Es la misma herramienta que uso en mis propios proyectos y en los de mis clientes, no la vendo como servicio, es software que construí y que mantengo en producción.',
    freeTierNote: 'Plan gratuito: 1 auditoría por semana, por email verificado.',
  },
  en: {
    title: 'I built my own SEO auditor',
    description:
      "It's the same tool I use on my own projects and my clients', I don't sell it as a service, it's software I built and I keep running in production.",
    freeTierNote: 'Free tier: 1 audit per week, per verified email.',
  },
}

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = docs[0]

  if (!homeDoc) {
    console.error('No `home` Pages doc found by slug — cannot seed. Aborting.')
    process.exit(1)
  }

  // Capturado tras el primer write (es) + refetch, reusado en el write de en.
  let newBlockId: string | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      depth: 0,
    })

    const currentLayout = [...((doc.content?.layout ?? []) as Block[])]

    const aboutSectionIndex = currentLayout.findIndex(
      (block) => block.blockType === 'aboutSection',
    )
    if (aboutSectionIndex === -1) {
      console.error(
        `locale=${locale}: no se encontro un bloque aboutSection en el layout de Home — abortando (esperado por 48.5-UI-SPEC.md: AuditorHighlight debe ir justo antes de aboutSection).`,
      )
      process.exit(1)
    }

    // IMPORTANTE: el bloque auditorHighlight es una fila NO localizada — una
    // vez insertado en el write de `es`, esa fila YA aparece en el layout
    // devuelto por findByID({ locale: 'en' }) tambien (con sus campos
    // localizados en blanco para `en` todavia). Por eso NO hay que saltar la
    // segunda iteracion cuando el bloque "ya existe": hay que actualizar SU
    // MISMO id con la copy de este locale, o el `en` nunca se escribe.
    const existingIndex = currentLayout.findIndex(
      (block) => block.blockType === 'auditorHighlight',
    )

    const localizedFields = {
      blockType: 'auditorHighlight',
      title: copy[locale].title,
      description: copy[locale].description,
      // ctaLabel queda vacio a proposito — usa el fallback i18n auditorHighlight.cta.
      freeTierNote: copy[locale].freeTierNote,
    }

    let newLayout: Block[]

    if (existingIndex !== -1) {
      // Ya existe la fila (insertada en un locale anterior de esta misma
      // corrida, o en una corrida previa) — actualizar sus campos
      // localizados para ESTE locale, conservando su id y su posicion.
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
        ...currentLayout.slice(0, aboutSectionIndex),
        newBlock,
        ...currentLayout.slice(aboutSectionIndex),
      ]
    }

    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
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
      const refetched = await payload.findByID({ collection: 'pages', id: homeDoc.id, depth: 0 })
      const refetchedLayout = (refetched.content?.layout ?? []) as Block[]
      const inserted = refetchedLayout.find((block) => block.blockType === 'auditorHighlight')
      if (!inserted?.id) {
        console.error('No se pudo capturar el id del bloque auditorHighlight recien insertado.')
        process.exit(1)
      }
      newBlockId = inserted.id as string
    }

    console.log(`Home page: auditorHighlight insertado (locale=${locale}, id=${newBlockId})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
