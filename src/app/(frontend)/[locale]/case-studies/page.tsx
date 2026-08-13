import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { FeaturedEntry } from '@/components/FeaturedEntry'
import { JsonLd } from '@/components/JsonLd'
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

async function getCaseStudies(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
    locale: locale as 'es' | 'en',
    // POLISH: no sort meant Payload's default order, which on production put
    // the most recent case study ("Migración a Next.js…") last, behind six
    // older ones. A portfolio listing leads with the newest work.
    sort: '-createdAt',
    limit: 50,
  })
  return docs
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = locale === 'es' ? 'Casos de éxito' : 'Case Studies'
  return {
    title,
    openGraph: buildOpenGraph({
      title,
      url: locale === 'en' ? '/en/case-studies' : '/case-studies',
      locale: locale as 'es' | 'en',
      slug: 'case-studies',
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/case-studies', '/en/case-studies'),
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
  const [featured, ...rest] = caseStudies

  return (
    <main>
      <Container className="py-16">
        {/* POLISH: this trail was hand-rolled inline (with `text-sm` instead of
            the `text-label` token, and no focus styles on its links) while the
            author profile grew its own copy. Both now render through the shared
            Breadcrumbs component over the same trail array. */}
        <Breadcrumbs trail={trail} className="mb-4" />
        <h1 className="font-display text-display tracking-tight">
          {locale === 'es' ? 'Casos de éxito' : 'Case Studies'}
        </h1>
        <p className="mt-4 max-w-[65ch] text-body text-muted-foreground">
          {locale === 'es'
            ? 'Cada caso muestra qué estaba fallando, qué corregí en el código y qué cambió después. Los números salen de Search Console, los clientes van anonimizados.'
            : 'Every case shows what was failing, what I fixed in the code and what changed afterwards. The numbers come from Search Console, the clients stay anonymous.'}
        </p>

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
          <>
            {/* The newest case leads; the rest fall into the grid below. The
                list is already sorted by -createdAt, so [0] is the lead. */}
            <FeaturedEntry
              kind="case-study"
              locale={locale as 'es' | 'en'}
              className="mt-12"
              title={featured.title}
              slug={featured.slug ?? String(featured.id)}
              heroImage={featured.heroImage}
              heroSubtitle={featured.heroSubtitle}
              heroMetric={featured.heroMetric}
              sector={featured.sector}
            />

            {rest.length > 0 && (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((cs) => (
                  <CaseStudyCard key={cs.id} caseStudy={cs} />
                ))}
              </div>
            )}
          </>
        )}
      </Container>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
