/**
 * Phase 20 (SEO Local Geo-pages — SEO-LOCAL-01/02):
 *
 * Creates/updates 2 `pages` docs ("SEO técnico en Lima", "SEO técnico en
 * Madrid / España") from the bilingual copy authored in
 * scripts/seed-phase20-data/copy.ts, assembling Hero/Content/FAQ/
 * CallToAction blocks per locale.
 *
 * Structurally identical to scripts/seed-phase19-service-pages.ts (same
 * lexical helpers, same reapplyIds/upsertPage id-reuse discipline), but
 * simpler: only 2 fixed slugs, no dynamic-route allowlist needed.
 *
 * CallToAction.richText is already `localized: true` as of Phase 19's fix
 * (migration 20260712_202954_phase19_calltoaction_localized) — this script
 * writes distinct per-locale CTA text and relies on that fix; no new
 * migration is introduced here.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase20-geo-pages.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { limaPageCopy, madridPageCopy } from './seed-phase20-data/copy'
import type { GeoPageCopy } from './seed-phase20-data/types'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

function lexicalWithHeading(heading: string, paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h3',
          version: 1,
          children: [{ type: 'text', version: 1, text: heading }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
        },
        ...paragraphs.map((text) => ({
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        })),
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

const FAQ_TITLE: Record<Locale, string> = {
  es: 'Preguntas frecuentes',
  en: 'Frequently asked questions',
}

function buildGeoPageLayout(copy: GeoPageCopy, locale: Locale): Record<string, unknown>[] {
  return [
    {
      blockType: 'hero',
      variant: 'listing',
      title: copy.hero.title,
      subtitle: copy.hero.subtitle,
    },
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: lexicalWithHeading(copy.includes.title, copy.includes.paragraphs),
        },
        {
          size: 'full',
          richText: lexicalWithHeading(copy.process.title, copy.process.paragraphs),
        },
      ],
    },
    {
      blockType: 'faq',
      title: FAQ_TITLE[locale],
      faqs: copy.faqs.map((f) => ({
        question: f.question,
        answer: lexicalParagraph(f.answer),
      })),
    },
    {
      blockType: 'callToAction',
      richText: lexicalParagraph(copy.ctaText),
      links: [{ link: { type: 'custom', url: '/contact', label: copy.ctaLinkLabel, appearance: 'default' } }],
    },
  ]
}

/** Same id-reuse discipline as scripts/seed-phase19-service-pages.ts (T-19-07). */
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

    if (block.blockType === 'content' && Array.isArray(block.columns)) {
      const refColumns = (refBlock.columns as Record<string, unknown>[] | undefined) ?? []
      withId.columns = (block.columns as Record<string, unknown>[]).map((col, ci) =>
        refColumns[ci] ? { ...col, id: refColumns[ci].id } : col,
      )
    }

    if (block.blockType === 'faq' && Array.isArray(block.faqs)) {
      const refFaqs = (refBlock.faqs as Record<string, unknown>[] | undefined) ?? []
      withId.faqs = (block.faqs as Record<string, unknown>[]).map((f, fi) =>
        refFaqs[fi] ? { ...f, id: refFaqs[fi].id } : f,
      )
    }

    if (block.blockType === 'callToAction' && Array.isArray(block.links)) {
      const refLinks = (refBlock.links as Record<string, unknown>[] | undefined) ?? []
      withId.links = (block.links as Record<string, unknown>[]).map((l, li) =>
        refLinks[li] ? { ...l, id: refLinks[li].id } : l,
      )
    }

    return withId
  })
}

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  {
    slug,
    titleByLocale,
    buildLayout,
  }: {
    slug: string
    titleByLocale: Record<Locale, string>
    buildLayout: (locale: Locale) => Record<string, unknown>[]
  },
) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  let docId: number | string

  if (docs.length === 0) {
    const created = await payload.create({
      collection: 'pages',
      locale: 'es',
      data: {
        title: titleByLocale.es,
        slug,
        _status: 'published',
        content: { layout: buildLayout('es') as never },
      },
    })
    docId = created.id
    console.log(`Created pages doc slug=${slug} (id=${docId})`)
  } else {
    docId = docs[0].id
    console.log(`Pages doc slug=${slug} already exists (id=${docId}) — updating both locales`)
  }

  const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
  const referenceLayout = refetched.content?.layout as Record<string, unknown>[] | undefined

  for (const locale of LOCALES) {
    const freshLayout = buildLayout(locale)
    const layoutWithIds = reapplyIds(freshLayout, referenceLayout)

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: titleByLocale[locale],
        content: { layout: layoutWithIds as never },
      },
    })
  }
}

async function main() {
  const payload = await getPayload({ config })

  await upsertPage(payload, {
    slug: 'seo-tecnico-lima',
    titleByLocale: { es: limaPageCopy.es.hero.title, en: limaPageCopy.en.hero.title },
    buildLayout: (locale) => buildGeoPageLayout(limaPageCopy[locale], locale),
  })

  await upsertPage(payload, {
    slug: 'seo-tecnico-madrid',
    titleByLocale: { es: madridPageCopy.es.hero.title, en: madridPageCopy.en.hero.title },
    buildLayout: (locale) => buildGeoPageLayout(madridPageCopy[locale], locale),
  })

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
