import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Author } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { AuthorByline } from '@/components/AuthorByline'
import { AuthorCard } from '@/components/AuthorCard'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { RenderBlocks } from '@/blocks/RenderBlocks'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

async function getCaseStudy(locale: string, slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: slug } },
    locale: locale as 'es' | 'en',
    depth: 1,
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getCaseStudy(locale, slug)

  if (!doc) {
    return {}
  }

  const meta = doc.meta

  return {
    title: meta?.title ?? doc.title,
    description: meta?.description ?? doc.heroSubtitle ?? '',
  }
}

const copy = {
  es: {
    client: 'El cliente',
    challenge: 'El reto',
    solution: 'La solución',
    results: 'Resultados',
    home: 'Inicio',
    caseStudies: 'Casos de éxito',
  },
  en: {
    client: 'The Client',
    challenge: 'The Challenge',
    solution: 'The Solution',
    results: 'Results',
    home: 'Home',
    caseStudies: 'Case Studies',
  },
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getCaseStudy(locale, slug)

  if (!doc) {
    notFound()
  }

  const t = copy[locale as 'es' | 'en'] ?? copy.es
  const author = typeof doc.author === 'object' ? (doc.author as Author) : undefined
  const client = typeof doc.client === 'object' ? doc.client : null
  const heroImage = typeof doc.heroImage === 'object' ? doc.heroImage : null
  const heroImageUrl = heroImage?.url ?? getFallbackHeroImage(doc.slug ?? String(doc.id))

  const creativeWorkData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: doc.title,
    about: doc.heroSubtitle,
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: t.caseStudies, item: `${SITE_URL}/case-studies` },
      { '@type': 'ListItem', position: 3, name: doc.title, item: `${SITE_URL}/case-studies/${doc.slug}` },
    ],
  }

  return (
    <main>
      <section className="relative bg-secondary text-secondary-foreground">
        <div className="relative aspect-[21/9] w-full opacity-40">
          <Image src={heroImageUrl} alt={heroImage?.alt ?? doc.title} fill className="object-cover" priority />
        </div>
        <Container className="py-8">
          <div className="flex flex-wrap gap-4 text-label opacity-80">
            {client?.name && <span>{client.name}</span>}
            {doc.sector && <span>{doc.sector}</span>}
            {doc.period && <span>{doc.period}</span>}
          </div>
          <h1 className="font-display text-display mt-2">{doc.title}</h1>
          {doc.heroSubtitle && <p className="mt-2 text-body max-w-2xl">{doc.heroSubtitle}</p>}
          {doc.heroMetric && (
            <p className="mt-4 text-display font-display font-semibold text-primary tracking-tight tabular-nums">
              {doc.heroMetric}
            </p>
          )}
        </Container>
      </section>

      {doc.kpis && doc.kpis.length > 0 && (
        <Container className="py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {doc.kpis.map((kpi, i) => (
              <div key={i} className="rounded-lg bg-secondary text-secondary-foreground p-6 text-center">
                <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-1 text-label uppercase tracking-wide opacity-70">{kpi.label}</p>
              </div>
            ))}
          </div>
        </Container>
      )}

      <Container className="py-8 space-y-12">
        {doc.clientContext && (
          <section>
            <h2 className="font-heading text-heading mb-4">{t.client}</h2>
            {/* First section heading in the page — no mt-10 here since space-y-12
                on the parent Container already provides top spacing; adding mt-10
                would double the gap after the KPI container's py-12. */}
            <RichTextRenderer data={doc.clientContext} />
          </section>
        )}

        {doc.challenge && doc.challenge.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.challenge}</h2>
            <ul className="list-disc pl-6 space-y-2 text-body">
              {doc.challenge.map((item, i) => (
                <li key={i}>{item.text}</li>
              ))}
            </ul>
          </section>
        )}

        {doc.solution && doc.solution.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.solution}</h2>
            <ol className="space-y-4">
              {doc.solution.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-heading text-heading text-primary">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-body">{step.title}</p>
                    <p className="text-body text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {doc.testimonialSection && doc.testimonialSection.length > 0 && (
          <RenderBlocks blocks={doc.testimonialSection as never} />
        )}

        {doc.results?.metrics && doc.results.metrics.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.results}</h2>
            {(doc.results.periodBefore || doc.results.periodAfter) && (
              <p className="text-label text-muted-foreground mb-4">
                {doc.results.periodBefore} → {doc.results.periodAfter}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doc.results.metrics.map((metric, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <p className="text-label text-muted-foreground uppercase tracking-wide">
                    {metric.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-body line-through opacity-60">{metric.before}</span>
                    <span className="font-heading text-heading font-semibold text-primary tracking-tight tabular-nums">
                      {metric.after}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {doc.conclusion && (
          <section>
            <RichTextRenderer data={doc.conclusion} />
          </section>
        )}

        {author && (
          <section>
            <AuthorByline author={author} />
            <div className="mt-6">
              <AuthorCard author={author} />
            </div>
          </section>
        )}
      </Container>

      <JsonLd data={creativeWorkData} />
      <JsonLd data={breadcrumbData} />
    </main>
  )
}
