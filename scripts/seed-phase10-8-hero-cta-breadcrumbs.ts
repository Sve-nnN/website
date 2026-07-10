/**
 * Populates the two new Hero block fields added in 10.8 (UI-22 CTA `links`,
 * UI-23 `breadcrumbs`) with real content:
 *
 * 1. Home page Hero (`variant: 'home'`) gets a real CTA link pointing at the
 *    case studies listing.
 * 2. Blog index Hero (`variant: 'listing'`) gets a real breadcrumb trail
 *    (Home / Inicio -> Blog).
 *
 * Unlike scripts/seed-phase10-7-gap-fill.ts (which fetches the layout ONCE
 * at the default locale and re-supplies that same snapshot under every
 * locale — silently overwriting other locales' localized subfields with the
 * default locale's text unless each block is explicitly re-patched per
 * locale), this script fetches the full `content.layout` separately FOR
 * EACH locale and only mutates the Hero block within that locale's own
 * snapshot before writing it back under that same locale. Every other
 * block's localized fields round-trip untouched, so there is no
 * cross-locale corruption risk to work around.
 *
 * Idempotent: re-running replaces the Hero block's `links`/`breadcrumbs`
 * with the same content (upsert-by-slug, never delete-then-recreate).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase10-8-hero-cta-breadcrumbs.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const homeCtaCopy: Record<Locale, { label: string; url: string }> = {
  es: { label: 'Ver case studies', url: '/case-studies' },
  en: { label: 'View Case Studies', url: '/case-studies' },
}

// Canonical home Hero title/subtitle per locale, verbatim from
// scripts/seed-home-page.ts (05-06) — used below to repair a second
// pre-existing 10.7 data bug (see repairAboutSectionEsText's docstring for
// the general mechanism): 10.7's seed script fetched the home layout ONCE
// at the default locale and re-supplied that same (Spanish) snapshot under
// the `en` update for every block it didn't explicitly patch, silently
// overwriting the home Hero's `en` title/subtitle with Spanish text.
// Discovered here because patchHeroBlock's per-locale fetch surfaced it.
const homeHeroTitleCopy: Record<Locale, { title: string; subtitle: string }> = {
  es: {
    title: 'Juan Carlos Angulo: Ingeniero de Software y Experto SEO',
    subtitle: 'Arquitecturas de alto rendimiento y estrategias de crecimiento orgánico',
  },
  en: {
    title: 'Juan Carlos Angulo: Software Engineer & SEO Expert',
    subtitle: 'High-performance architectures and organic growth strategies',
  },
}

const blogBreadcrumbCopy: Record<Locale, Array<{ label: string; url: string }>> = {
  es: [
    { label: 'Inicio', url: '/' },
    { label: 'Blog', url: '/blog' },
  ],
  en: [
    { label: 'Home', url: '/' },
    { label: 'Blog', url: '/blog' },
  ],
}

/**
 * @param arrayFieldName the Hero sub-array being patched (`links` or
 *   `breadcrumbs`) — its rows carry a localized subfield (`link.label` /
 *   `label`), so row ids MUST be reused across the es/en passes below,
 *   otherwise the second locale's write fully replaces the array (Payload
 *   array fields are always replace-all, never merged) with fresh rows that
 *   have no id, deleting the first locale's rows — and with them, the first
 *   locale's already-written localized label (05-06/10.7 precedent bug).
 */
async function patchHeroBlock(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  arrayFieldName: 'links' | 'breadcrumbs',
  buildPatch: (locale: Locale) => Record<string, unknown>,
) {
  let savedRowIds: (string | undefined)[] | undefined

  for (const locale of LOCALES) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      locale,
      depth: 0,
      limit: 1,
    })

    const doc = docs[0]

    if (!doc) {
      console.log(`No Pages doc found for slug="${slug}" (locale=${locale}) — skipping.`)
      continue
    }

    const layout = (doc.content?.layout ?? []) as Array<Record<string, unknown>>
    const heroIndex = layout.findIndex((block) => block.blockType === 'hero')

    if (heroIndex < 0) {
      console.log(`Pages doc slug="${slug}" (locale=${locale}) has no hero block — skipping.`)
      continue
    }

    const patch = buildPatch(locale)
    const newRows = patch[arrayFieldName] as Array<Record<string, unknown>>

    if (savedRowIds) {
      newRows.forEach((row, i) => {
        if (savedRowIds![i]) row.id = savedRowIds![i]
      })
    }

    layout[heroIndex] = {
      ...layout[heroIndex],
      ...patch,
    }

    await payload.update({
      collection: 'pages',
      id: doc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layout as any,
        },
      },
    })

    if (!savedRowIds) {
      const refetched = await payload.findByID({ collection: 'pages', id: doc.id, depth: 0 })
      const refetchedLayout = (refetched.content?.layout ?? []) as Array<Record<string, unknown>>
      const refetchedHero = refetchedLayout.find((block) => block.blockType === 'hero')
      const refetchedRows = refetchedHero?.[arrayFieldName] as Array<{ id?: string }> | undefined
      savedRowIds = refetchedRows?.map((row) => row.id)
    }

    console.log(`Updated "${slug}" Hero block (locale=${locale})`)
  }
}

/**
 * Pre-existing data bug found while touching the `home` Pages doc's layout
 * (unrelated to 10.8, discovered because resubmitting the layout array
 * requires every block — including AboutSection — to pass validation): the
 * 10.7 seed (`scripts/seed-phase10-7-gap-fill.ts`) never reused
 * `paragraphs[].id` across its es/en update loop for AboutSection, so the
 * `es`-locale write's `paragraphs[].text` was silently discarded by the
 * following `en`-locale write (same array-replace mechanics documented on
 * `patchHeroBlock` above) — `es` currently has BOTH paragraph rows with an
 * empty `text` (required field), which fails validation on any further
 * layout write. Repairs it here with the real es copy (author bio for
 * paragraph 1, the original seed's fixed sentence for paragraph 2) before
 * this script's own Hero CTA patch touches the same layout.
 */
async function repairAboutSectionEsText(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale: 'es',
    depth: 0,
    limit: 1,
  })

  const doc = docs[0]
  if (!doc) return

  const layout = (doc.content?.layout ?? []) as Array<Record<string, unknown>>
  const aboutIndex = layout.findIndex((block) => block.blockType === 'aboutSection')
  if (aboutIndex < 0) return

  const paragraphs = (layout[aboutIndex].paragraphs ?? []) as Array<{ id?: string; text?: string }>
  const needsRepair = paragraphs.some((p) => !p.text)
  if (!needsRepair) {
    console.log('AboutSection es paragraph text already populated — no repair needed.')
    return
  }

  const { docs: authorDocs } = await payload.find({ collection: 'authors', locale: 'es', limit: 1 })
  const bio = authorDocs[0]?.bio

  const esTexts = [
    bio ??
      'Ingeniero de software especializado en arquitecturas de alto rendimiento y estrategias de crecimiento orgánico.',
    'Trabajo con equipos técnicos y de marketing para construir sitios que cargan rápido, se indexan sin fricción y convierten — sin sacrificar mantenibilidad ni escalabilidad del lado del desarrollo.',
  ]

  layout[aboutIndex].paragraphs = paragraphs.map((p, i) => ({
    id: p.id,
    text: p.text || esTexts[i] || esTexts[esTexts.length - 1],
  }))

  await payload.update({
    collection: 'pages',
    id: doc.id,
    locale: 'es',
    data: {
      content: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        layout: layout as any,
      },
    },
  })

  console.log('Repaired AboutSection es paragraph text (pre-existing 10.7 data bug).')
}

async function seedHomeHeroCta(payload: Awaited<ReturnType<typeof getPayload>>) {
  await patchHeroBlock(payload, 'home', 'links', (locale) => ({
    title: homeHeroTitleCopy[locale].title,
    subtitle: homeHeroTitleCopy[locale].subtitle,
    links: [
      {
        link: {
          type: 'custom',
          url: homeCtaCopy[locale].url,
          label: homeCtaCopy[locale].label,
          appearance: 'default',
        },
      },
    ],
  }))
}

async function seedBlogHeroBreadcrumbs(payload: Awaited<ReturnType<typeof getPayload>>) {
  await patchHeroBlock(payload, 'blog', 'breadcrumbs', (locale) => ({
    breadcrumbs: blogBreadcrumbCopy[locale].map(({ label, url }) => ({ label, url })),
  }))
}

async function main() {
  const payload = await getPayload({ config })

  await repairAboutSectionEsText(payload)
  await seedHomeHeroCta(payload)
  await seedBlogHeroBreadcrumbs(payload)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
