import { getLocale, getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import type { RelatedCaseStudyBlockBlock as RelatedCaseStudyBlockBlockProps, CaseStudy } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { CaseStudyCard } from '@/components/CaseStudyCard'

export async function RelatedCaseStudyBlockComponent(props: RelatedCaseStudyBlockBlockProps) {
  const { title, framingText, caseStudy } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  let resolved: CaseStudy | null = null

  // 25-REVIEW critical finding: the parent page's own query resolves
  // `caseStudy` at whatever depth IT was fetched with (depth:1 in the
  // Servicios page.tsx calls), which is enough to turn the relationship
  // into an object but NOT enough to populate that object's own nested
  // `client` relationship. Re-deriving the id and always re-fetching here
  // at depth:2 guarantees `client` is populated regardless of what depth
  // the caller used.
  const caseStudyId = typeof caseStudy === 'object' && caseStudy !== null ? caseStudy.id : caseStudy

  if (caseStudyId) {
    // SECURITY (mirrors 24-REVIEW WR-02 / services-data.ts precedent): Local
    // API bypasses `read: authenticatedOrPublished` by default — an
    // unpublished draft must never leak here.
    resolved = await payload.findByID({
      collection: 'case-studies',
      id: caseStudyId,
      depth: 2,
      locale,
      overrideAccess: false,
    })
  }

  if (!resolved) {
    const result = await payload.find({
      collection: 'case-studies',
      limit: 1,
      sort: '-createdAt',
      depth: 2,
      locale,
      overrideAccess: false,
    })
    resolved = result.docs[0] ?? null
  }

  // Same empty-state contract as ClientLogosBlockComponent — no visible
  // empty-state copy, this is editor-configured content.
  if (!resolved) return null

  const t = await getTranslations('relatedCaseStudyBlock')

  return (
    <Container className="py-12">
      <h2 className="font-heading text-heading">{title ?? t('title')}</h2>
      {framingText && (
        <p className="mt-2 text-body text-muted-foreground italic max-w-2xl">{framingText}</p>
      )}
      <div className="mt-6 max-w-md">
        <CaseStudyCard caseStudy={resolved} />
      </div>
    </Container>
  )
}
