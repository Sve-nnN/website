import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { JsonLd } from '@/components/JsonLd'
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'

async function getCaseStudies(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
    locale: locale as 'es' | 'en',
    limit: 50,
  })
  return docs
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Casos de éxito' : 'Case Studies',
  }
}

export default async function CaseStudiesListPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const caseStudies = await getCaseStudies(locale)
  const trail = buildCaseStudiesTrail(locale as 'es' | 'en')

  return (
    <main>
      <Container className="py-16">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {trail.map((crumb, i) => {
              const isLast = i === trail.length - 1
              return (
                <li key={crumb.url} className="flex items-center gap-x-2">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {isLast ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.url}
                      className="hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
        <h1 className="font-display text-display">
          {locale === 'es' ? 'Casos de éxito' : 'Case Studies'}
        </h1>

        {caseStudies.length === 0 ? (
          <div className="mt-12 text-center py-16">
            <p className="font-heading text-heading">
              {locale === 'es' ? 'Próximamente' : 'Coming soon'}
            </p>
            <p className="mt-2 text-body text-muted-foreground">
              {locale === 'es'
                ? 'Estamos preparando nuevos casos de éxito. Vuelve pronto.'
                : "We're preparing new case studies. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map((cs) => (
              <CaseStudyCard key={cs.id} caseStudy={cs} />
            ))}
          </div>
        )}
      </Container>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
