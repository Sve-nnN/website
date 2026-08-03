import { getLocale } from 'next-intl/server'

import type { FeaturedCaseStudiesBlock as FeaturedCaseStudiesBlockProps, CaseStudy } from '@/payload-types'

import { Container } from '@/components/Container'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { getCachedFeaturedContent } from '@/lib/cache'

export async function FeaturedCaseStudiesBlockComponent(props: FeaturedCaseStudiesBlockProps) {
  const { title, limit } = props
  const locale = (await getLocale()) as 'en' | 'es'

  // Phase 43 (43-01): deduped + cached — see FeaturedPostsBlock's comment,
  // same fetcher, same cache entry (both blocks read the same global).
  const featuredContent = await getCachedFeaturedContent(locale)

  // Runtime data is scoped down by `populate` in getCachedFeaturedContent
  // (title/slug/sector/heroMetric/client only) — `CaseStudy` here only
  // satisfies the filter's type predicate against FeaturedContent's static
  // field type; `CaseStudyCard` narrows further via `CaseStudyCardData`.
  const caseStudies = (featuredContent.featuredCaseStudies ?? [])
    .filter((cs): cs is CaseStudy => typeof cs === 'object')
    .slice(0, limit ?? 3)

  if (caseStudies.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((cs) => (
          <CaseStudyCard key={cs.id} caseStudy={cs} />
        ))}
      </div>
    </Container>
  )
}
