/**
 * Phase 25 Plan 03 (Service-page visual polish, SVCPOL-01/02/05/06):
 *
 * Restructures each of the 4 existing service-page docs (created in Phase
 * 19, `scripts/seed-phase19-service-pages.ts`) from the old 4-block anatomy
 * (Hero -> Content -> FAQ -> CallToAction) into the new 10-block anatomy
 * defined in `25-UI-SPEC.md`:
 *
 *   Hero -> Content(pain) -> ServiceScopeCard -> CallToAction(top) ->
 *   Content(includes+process+proofLinks) -> ClientLogosBlock ->
 *   TestimonialsCarousel -> RelatedCaseStudyBlock -> FAQ ->
 *   CallToAction(bottom)
 *
 * Reuses the existing per-service copy from Phase 19
 * (`scripts/seed-phase19-data/{group-a,group-b}.ts`) for hero/includes/
 * process/faqs/proofLinks/ctaText/ctaLinkLabel (unchanged fields, only their
 * position in the layout moves), and the new humanized copy from
 * `scripts/seed-phase25-data.ts` for pain/scopeCard/caseStudyFraming.
 *
 * CRITICAL DEVIATION FROM THE PHASE 19/20 upsertPage PATTERN (documented in
 * 25-03-PLAN.md's Interfaces section): in Phase 19/20, `referenceLayout` is
 * fetched ONCE before the locale loop, which is safe there because the
 * layout shape doesn't change across locales in the same run. Here the
 * existing 8 docs are being restructured from the OLD 4-block shape to the
 * NEW 10-block shape on the FIRST run, so the OLD saved layout will NOT
 * block-type-match the NEW layout at most indices. If `referenceLayout` were
 * fetched only once before the loop, the 'es' and 'en' writes in this same
 * run would each independently generate fresh ids for the mismatched
 * blocks, breaking cross-locale id consistency for this run (the exact bug
 * class behind the 05-12/13-02/15-02 pattern and Phase 19's CR-01 incident).
 * Fix: for each service doc, write 'es' first, then `findByID` to fetch the
 * just-written 'es' layout as the reference, THEN build and write 'en'
 * against that fresh reference (refetch INSIDE the per-locale loop, not once
 * before it). On idempotent re-runs the same refetch-per-locale approach
 * still works correctly since each write refreshes the reference for the
 * next one.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase25-service-landings.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { SERVICE_SLUGS } from '../src/lib/services-data'
import {
  auditServiceCopy,
  consultingServiceCopy,
} from './seed-phase19-data/group-a'
import { fullstackServiceCopy, geoServiceCopy } from './seed-phase19-data/group-b'
import type { BilingualServiceCopy, ServiceCopy } from './seed-phase19-data/types'
import { serviceLandingCopy } from './seed-phase25-data'
import type { ServiceLandingCopy } from './seed-phase25-data'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const CASE_STUDY_SLUG = 'migracion-ecommerce-nextjs-seo-tecnico'

const SERVICE_COPY_MAP: Record<(typeof SERVICE_SLUGS)[number], BilingualServiceCopy> = {
  'seo-technical-audit': auditServiceCopy,
  'seo-consulting': consultingServiceCopy,
  'fullstack-development': fullstackServiceCopy,
  'ai-seo-geo': geoServiceCopy,
}

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
          // Phase 25 gap-closure: was 'h3', which sits directly after the
          // page's single <h1> (Hero title) with no <h2> in between on every
          // service landing — a WCAG 1.3.1/2.4.6 "skipped heading level"
          // violation flagged by Lighthouse's axe-core heading-order audit
          // (98 -> 94 accessibility regression, uniform across all 8 URLs).
          // 'h2' restores h1 -> h2 -> h2(ServiceScopeCard) -> h2 -> h2(...)
          // sequential order; CaseStudyCard's <h3> nested under
          // RelatedCaseStudyBlock's <h2> is unaffected and already correct.
          tag: 'h2',
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

const CLIENT_LOGOS_TITLE: Record<Locale, string> = {
  es: 'Clientes',
  en: 'Clients',
}

/**
 * Builds the full 10-block anatomy for one service landing, one locale.
 * Order per 25-UI-SPEC.md "Block Anatomy & Order":
 *   1. Hero (unchanged)
 *   2. Content (pain)
 *   3. ServiceScopeCard
 *   4. CallToAction (top)
 *   5. Content (includes + process + proofLinks, unchanged field usage)
 *   6. ClientLogosBlock
 *   7. TestimonialsCarousel
 *   8. RelatedCaseStudyBlock
 *   9. FAQ
 *   10. CallToAction (bottom)
 */
function buildLayout(
  copy: ServiceCopy,
  landingCopy: ServiceLandingCopy,
  locale: Locale,
  caseStudyId: number | string,
): Record<string, unknown>[] {
  const ctaBlock = {
    blockType: 'callToAction',
    richText: lexicalParagraph(copy.ctaText),
    links: [{ link: { type: 'custom', url: '/contact', label: copy.ctaLinkLabel, appearance: 'default' } }],
  }

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
          richText: lexicalWithHeading(landingCopy.pain.title, landingCopy.pain.paragraphs),
        },
      ],
    },
    {
      blockType: 'serviceScopeCard',
      title: landingCopy.scopeCard.title,
      scope: landingCopy.scopeCard.scope,
      outcome: landingCopy.scopeCard.outcome,
      timeline: landingCopy.scopeCard.timeline,
    },
    ctaBlock,
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
      blockType: 'clientLogosBlock',
      title: CLIENT_LOGOS_TITLE[locale],
    },
    {
      // FIX (25-REVIEW critical finding): `title` explicitly set to null,
      // not omitted — Payload's per-locale `update()` leaves non-localized
      // fields untouched when they're absent from the submitted data (it
      // does NOT clear them), so omitting the key left the stale English
      // value from the original (pre-fix) seed run in place regardless of
      // locale. An explicit `null` clears it on both locale writes. The
      // component falls back to a real per-locale translation whenever
      // `title` is null/undefined.
      blockType: 'testimonialsCarousel',
      title: null,
      showRating: true,
      limit: 3,
    },
    {
      blockType: 'relatedCaseStudyBlock',
      title: landingCopy.caseStudyFraming.title,
      framingText: landingCopy.caseStudyFraming.framingText,
      caseStudy: caseStudyId,
    },
    {
      blockType: 'faq',
      title: FAQ_TITLE[locale],
      faqs: copy.faqs.map((f) => ({
        question: f.question,
        answer: lexicalParagraph(f.answer),
      })),
    },
    { ...ctaBlock },
  ]
}

/**
 * Walks `freshLayout` by index and, for each block, copies over the `id`
 * (and nested sub-array ids: columns[]/faqs[]/links[]) from the same-index
 * block in `referenceLayout`, ONLY when both blocks share the same
 * `blockType`. Mismatches are logged and left with a fresh id rather than
 * silently attaching a wrong id to unrelated content (T-25-06, same
 * discipline as scripts/seed-phase19-service-pages.ts / seed-phase20-geo-pages.ts).
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

async function restructureServicePage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  {
    slug,
    copy,
    landingCopy,
    caseStudyId,
  }: {
    slug: string
    copy: BilingualServiceCopy
    landingCopy: Record<Locale, ServiceLandingCopy>
    caseStudyId: number | string
  },
) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
  })

  if (docs.length === 0) {
    // Per Task 3 spec: all 4 slugs already exist from Phase 19. Do not
    // silently create — log loudly and skip so a real gap is visible.
    console.error(`ERROR: expected existing pages doc for slug="${slug}" but none was found. Skipping.`)
    return
  }

  const docId = docs[0].id
  console.log(`Restructuring pages doc slug=${slug} (id=${docId})`)

  // Refetch INSIDE the per-locale loop (the plan's documented fix, T-25-06):
  // 'es' is written first, then its just-written layout is fetched fresh as
  // the reference for 'en', instead of a single pre-loop snapshot.
  for (const locale of LOCALES) {
    const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
    const referenceLayout = refetched.content?.layout as Record<string, unknown>[] | undefined

    const freshLayout = buildLayout(copy[locale], landingCopy[locale], locale, caseStudyId)
    const layoutWithIds = reapplyIds(freshLayout, referenceLayout)

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: copy[locale].hero.title,
        content: { layout: layoutWithIds as never },
      },
    })
    console.log(`  wrote locale=${locale}`)
  }
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: caseStudyDocs } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: CASE_STUDY_SLUG } },
    limit: 1,
    overrideAccess: false,
  })

  if (caseStudyDocs.length === 0) {
    throw new Error(
      `Real published case study slug="${CASE_STUDY_SLUG}" not found. Refusing to seed a broken relationship.`,
    )
  }
  const caseStudyId = caseStudyDocs[0].id
  console.log(`Resolved case study "${CASE_STUDY_SLUG}" -> id=${caseStudyId}`)

  for (const slug of SERVICE_SLUGS) {
    await restructureServicePage(payload, {
      slug,
      copy: SERVICE_COPY_MAP[slug],
      landingCopy: serviceLandingCopy[slug],
      caseStudyId,
    })
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
