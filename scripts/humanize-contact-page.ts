/**
 * Phase 30 Plan 02, Task 2 — Humanize Contact page (VOICE-06).
 *
 * Light polish of the standalone `contact` Pages doc's `contactFormBlock`
 * text fields, both locales — the live copy already carries the calibrated
 * collaborative CTA tone ("Hablemos"/"Let's talk" pattern), confirmed via a
 * fresh `payload.findByID` read at execution time rather than trusting a
 * hardcoded literal. Does NOT touch `contactInfo[].href` (non-localized
 * mailto URL) or any `meta.*`/`targetKeyword` field.
 *
 * Uses the same block/id-reuse discipline as scripts/seed-contact-page.ts
 * (T-30-04): the full layout is fetched fresh per locale via
 * `findByID({ locale })`, and the block/nested `contactInfo[]` ids captured
 * after the first locale's write-then-refetch are echoed back on the
 * second locale's write.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-contact-page.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Block = Record<string, unknown>

// Same calibrated copy as Home's own contactFormBlock instance (Task 1) —
// consistent voice across both surfaces sharing this block type.
const contactCopy: Record<
  Locale,
  {
    eyebrow: string
    title: string
    description: string
    submitLabel: string
    sidebarTitle: string
    sidebarDescription: string
    socialProofText: string
    contactInfo: { title: string; value: string }[]
  }
> = {
  es: {
    eyebrow: 'Contacto',
    title: 'Hablemos',
    description: '¿Tienes un proyecto en mente? Cuéntame de qué se trata.',
    submitLabel: 'Enviar mensaje',
    sidebarTitle: 'Charlemos sobre tu próximo proyecto',
    sidebarDescription: 'Disponible para consultoría en ingeniería de software y SEO técnico.',
    socialProofText: 'Suelo responder en menos de 48 horas.',
    contactInfo: [{ title: 'Email', value: 'hello@juan-tech.com' }],
  },
  en: {
    eyebrow: 'Contact',
    title: "Let's Talk",
    description: 'Got a project in mind? Tell me about it.',
    submitLabel: 'Send message',
    sidebarTitle: "Let's talk about your next project",
    sidebarDescription: 'Available for software engineering and technical SEO consulting.',
    socialProofText: 'I usually reply within 48 hours.',
    contactInfo: [{ title: 'Email', value: 'hello@juan-tech.com' }],
  },
}

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    limit: 1,
  })

  const contactDoc = docs[0]

  if (!contactDoc) {
    console.error('No `contact` Pages doc found by slug — cannot humanize. Aborting.')
    process.exit(1)
  }

  // Confirm live values before overwriting, per plan instruction (don't
  // trust the seed script's hardcoded literal blindly).
  const liveEs = await payload.findByID({ collection: 'pages', id: contactDoc.id, locale: 'es', depth: 0 })
  const liveBlock = ((liveEs.content?.layout ?? []) as Block[]).find((b) => b.blockType === 'contactFormBlock')
  console.log('Live contactFormBlock (es) before rewrite:', JSON.stringify(liveBlock, null, 2))

  // Captured after the first locale's write-then-refetch, echoed back on
  // the second locale's write (T-30-04 discipline).
  let referenceContactInfoIds: (string | undefined)[] | undefined
  let blockId: string | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({
      collection: 'pages',
      id: contactDoc.id,
      locale,
      depth: 0,
    })

    const layout = [...((doc.content?.layout ?? []) as Block[])]
    const blockIndex = layout.findIndex((b) => b.blockType === 'contactFormBlock')

    if (blockIndex === -1) {
      console.error(`No contactFormBlock found in contact page layout (locale=${locale}) — aborting.`)
      process.exit(1)
    }

    const copy = contactCopy[locale]
    const existingBlock = layout[blockIndex] as Block
    const existingContactInfo = (existingBlock.contactInfo as Block[] | undefined) ?? []

    const updatedBlock: Block = {
      ...existingBlock,
      ...(blockId ? { id: blockId } : {}),
      eyebrow: copy.eyebrow,
      title: copy.title,
      description: copy.description,
      submitLabel: copy.submitLabel,
      sidebarTitle: copy.sidebarTitle,
      sidebarDescription: copy.sidebarDescription,
      socialProofText: copy.socialProofText,
      contactInfo: existingContactInfo.map((c, i) => ({
        ...c,
        ...(referenceContactInfoIds?.[i] ? { id: referenceContactInfoIds[i] } : {}),
        title: copy.contactInfo[i]?.title ?? c.title,
        value: copy.contactInfo[i]?.value ?? c.value,
        // href intentionally untouched — non-localized mailto/tel URL.
      })),
    }

    layout[blockIndex] = updatedBlock

    await payload.update({
      collection: 'pages',
      id: contactDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layout as any,
        },
      },
    })

    if (!blockId || !referenceContactInfoIds) {
      const refetched = await payload.findByID({ collection: 'pages', id: contactDoc.id, depth: 0 })
      const refetchedBlock = ((refetched.content?.layout ?? []) as Block[]).find(
        (b) => b.blockType === 'contactFormBlock',
      )
      if (!blockId) blockId = refetchedBlock?.id as string | undefined
      if (!referenceContactInfoIds) {
        referenceContactInfoIds = ((refetchedBlock?.contactInfo as Block[] | undefined) ?? []).map(
          (c) => c.id as string | undefined,
        )
      }
    }

    console.log(`Contact page humanized (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
