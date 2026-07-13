/**
 * Phase 24 (ServicesShowcase en Home — SVCHOME-01/02/03):
 *
 * Appends (or updates in place, on re-run) one `servicesShowcase` block
 * instance to Home's `content.layout`, in both locales. Card content itself
 * (title/excerpt/href/icon) is entirely derived at render time from the 4
 * `SERVICE_SLUGS` pages — this seed only sets the block's one editorial
 * field, the section `title`.
 *
 * Idempotent + id-reuse-across-locale-writes discipline, same pattern as
 * scripts/seed-phase13-home-content.ts: each locale's full layout is fetched
 * fresh via `findByID({ locale })` so sibling blocks' already-correct
 * localized content is never clobbered by this write, and the block's
 * server-assigned `id` (captured after the first locale's write) is reused
 * on the second locale's write so it updates the same row instead of
 * creating a duplicate.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase24-services-showcase.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

// Grounded, non-generic section title copy (24-UI-SPEC.md Copywriting
// Contract — a real sentence, not a bare "Servicios"/"Services" label),
// matching the voice of the existing AboutSection/Hero copy on Home.
const titleCopy: Record<Locale, string> = {
  es: 'Cómo puedo ayudarte',
  en: 'How I can help',
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = homeDocs[0]

  if (!homeDoc) {
    console.log('No `home` Pages doc found by slug — cannot seed Phase 24 content. Aborting.')
    process.exit(1)
  }

  // Reused across locale writes so the second locale's write updates the
  // same block row instead of creating a duplicate (id-reuse pattern).
  let blockId: string | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      depth: 0,
    })

    const layout = [...((doc.content?.layout ?? []) as Array<Record<string, unknown>>)]

    const existingIndex = layout.findIndex((b) => b.blockType === 'servicesShowcase')
    const block: Record<string, unknown> = {
      blockType: 'servicesShowcase',
      title: titleCopy[locale],
    }
    if (blockId) block.id = blockId

    if (existingIndex === -1) {
      layout.push(block)
    } else {
      if (!blockId && layout[existingIndex]?.id) block.id = layout[existingIndex].id as string
      layout[existingIndex] = block
    }

    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layout as any,
        },
      },
    })

    if (!blockId) {
      const refetched = await payload.findByID({ collection: 'pages', id: homeDoc.id, locale, depth: 0 })
      const refetchedLayout = (refetched.content?.layout ?? []) as Array<Record<string, unknown>>
      blockId = refetchedLayout.find((b) => b.blockType === 'servicesShowcase')?.id as string | undefined
    }

    console.log(`Phase 24 services showcase: updated home Pages doc (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
