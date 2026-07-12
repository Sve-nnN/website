/**
 * Phase 19 (Service Pages — SEO-SVC-01/02/03):
 *
 * Creates/updates 5 `pages` docs (services index + 4 individual service
 * landings) from the bilingual copy authored in
 * scripts/seed-phase19-data/{group-a,group-b}.ts, assembling Hero/Content/
 * FAQ/CallToAction blocks per locale.
 *
 * Idempotent: re-running finds the existing doc by slug and updates both
 * locales in place instead of creating duplicates. Sub-array ids (columns[],
 * faqs[], links[]) are reused across locale writes — Payload full-replaces
 * array/blocks fields on `update`, so writing a locale's layout without
 * reusing the ids the OTHER locale's write already got would orphan that
 * locale's saved data (documented bug pattern, see STATE.md Phases
 * 05-12/05-13/13-02/15-02, and scripts/seed-phase10-8-hero-cta-breadcrumbs.ts).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase19-service-pages.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { SERVICES_INDEX_SLUG, SERVICE_SLUGS } from '../src/lib/services-data'
import {
  indexPageCopy,
  auditServiceCopy,
  consultingServiceCopy,
} from './seed-phase19-data/group-a'
import { fullstackServiceCopy, geoServiceCopy } from './seed-phase19-data/group-b'
import type { IndexPageCopy, ServiceCopy } from './seed-phase19-data/types'

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

function buildServiceLayout(copy: ServiceCopy, locale: Locale): Record<string, unknown>[] {
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
        ...(copy.proofLinks ?? []).map((pl) => ({
          size: 'full',
          richText: lexicalParagraph(pl.description),
          enableLink: true,
          link: { type: 'custom', url: pl.url, label: pl.label, appearance: 'default' },
        })),
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

function buildIndexLayout(copy: IndexPageCopy, locale: Locale): Record<string, unknown>[] {
  return [
    {
      blockType: 'hero',
      variant: 'listing',
      title: copy.hero.title,
      subtitle: copy.hero.subtitle,
    },
    {
      blockType: 'content',
      columns: copy.services.map((s) => ({
        size: 'half',
        richText: lexicalWithHeading(s.name, [s.description]),
        enableLink: true,
        link: {
          type: 'custom',
          url: `/services/${s.slug}`,
          label: locale === 'es' ? 'Ver más' : 'Learn more',
          appearance: 'default',
        },
      })),
    },
    {
      blockType: 'callToAction',
      richText: lexicalParagraph(copy.ctaText),
      links: [{ link: { type: 'custom', url: '/contact', label: copy.ctaLinkLabel, appearance: 'default' } }],
    },
  ]
}

/**
 * Walks `freshLayout` by index and, for each block, copies over the `id`
 * (and nested sub-array ids: columns[]/faqs[]/links[]) from the same-index
 * block in `referenceLayout` — but ONLY when both blocks share the same
 * `blockType`. If shapes ever drift (should not happen — both locales are
 * built from the same copy shape), the mismatched block is left untouched
 * and a warning is logged, rather than silently attaching a wrong id to
 * unrelated content (T-19-07).
 */
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
    slug: SERVICES_INDEX_SLUG,
    titleByLocale: { es: 'Servicios', en: 'Services' },
    buildLayout: (locale) => buildIndexLayout(indexPageCopy[locale], locale),
  })

  await upsertPage(payload, {
    slug: SERVICE_SLUGS[0], // seo-technical-audit
    titleByLocale: {
      es: auditServiceCopy.es.hero.title,
      en: auditServiceCopy.en.hero.title,
    },
    buildLayout: (locale) => buildServiceLayout(auditServiceCopy[locale], locale),
  })

  await upsertPage(payload, {
    slug: SERVICE_SLUGS[1], // seo-consulting
    titleByLocale: {
      es: consultingServiceCopy.es.hero.title,
      en: consultingServiceCopy.en.hero.title,
    },
    buildLayout: (locale) => buildServiceLayout(consultingServiceCopy[locale], locale),
  })

  await upsertPage(payload, {
    slug: SERVICE_SLUGS[2], // fullstack-development
    titleByLocale: {
      es: fullstackServiceCopy.es.hero.title,
      en: fullstackServiceCopy.en.hero.title,
    },
    buildLayout: (locale) => buildServiceLayout(fullstackServiceCopy[locale], locale),
  })

  await upsertPage(payload, {
    slug: SERVICE_SLUGS[3], // ai-seo-geo
    titleByLocale: {
      es: geoServiceCopy.es.hero.title,
      en: geoServiceCopy.en.hero.title,
    },
    buildLayout: (locale) => buildServiceLayout(geoServiceCopy[locale], locale),
  })

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
