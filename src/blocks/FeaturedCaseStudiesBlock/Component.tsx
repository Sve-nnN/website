import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { FeaturedCaseStudiesBlock as FeaturedCaseStudiesBlockProps, CaseStudy } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { CaseStudyCard } from '@/components/CaseStudyCard'

export async function FeaturedCaseStudiesBlockComponent(props: FeaturedCaseStudiesBlockProps) {
  const { title, limit } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  const featuredContent = await payload.findGlobal({
    slug: 'featured-content',
    depth: 1,
    locale,
  })

  const caseStudies = (featuredContent.featuredCaseStudies ?? [])
    .filter((cs): cs is CaseStudy => typeof cs === 'object')
    .slice(0, limit ?? 3)

  if (caseStudies.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-display text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((cs) => (
          <CaseStudyCard key={cs.id} caseStudy={cs} />
        ))}
      </div>
    </Container>
  )
}
