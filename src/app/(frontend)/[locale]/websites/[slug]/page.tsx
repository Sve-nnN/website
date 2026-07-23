import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Website } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { Badge } from '@/components/ui/badge'
import { buildWebsitesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

async function getWebsite(locale: string, slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'websites',
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
  const doc = await getWebsite(locale, slug)

  if (!doc) {
    return {}
  }

  const meta = doc.meta

  return {
    title: meta?.title ?? doc.title,
    description: meta?.description ?? doc.role ?? doc.industry ?? '',
  }
}

const copy = {
  es: {
    lighthouse: 'Puntuaciones de Lighthouse',
    highlights: 'Destacados',
    challenges: 'Retos',
    stack: 'Stack Tecnológico',
    screenshots: 'Capturas de pantalla',
    relatedCaseStudy: 'Ver caso de estudio relacionado',
    performance: 'Rendimiento',
    accessibility: 'Accesibilidad',
    bestPractices: 'Buenas Prácticas',
    seo: 'SEO',
  },
  en: {
    lighthouse: 'Lighthouse Scores',
    highlights: 'Highlights',
    challenges: 'Challenges',
    stack: 'Tech Stack',
    screenshots: 'Screenshots',
    relatedCaseStudy: 'View related case study',
    performance: 'Performance',
    accessibility: 'Accessibility',
    bestPractices: 'Best Practices',
    seo: 'SEO',
  },
}

export default async function WebsitePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getWebsite(locale, slug)

  if (!doc) {
    notFound()
  }

  const t = copy[locale as 'es' | 'en'] ?? copy.es
  const client = typeof doc.client === 'object' ? doc.client : null
  const relatedCaseStudy = typeof doc.relatedCaseStudy === 'object' ? doc.relatedCaseStudy : null
  const trail = buildWebsitesTrail(locale as 'es' | 'en', {
    slug: doc.slug ?? slug,
    title: doc.title,
  })

  const creativeWorkData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: doc.title,
    about: doc.role ?? doc.industry,
  }

  return (
    <main>
      <section className="relative bg-secondary text-secondary-foreground">
        <Container className="py-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-foreground/70">
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
                        className="hover:text-secondary-foreground underline-offset-2 hover:underline"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
          <div className="flex flex-wrap gap-4 text-label opacity-80">
            {client?.name && <span>{client.name}</span>}
            {doc.industry && <span>{doc.industry}</span>}
            {doc.year && <span>{doc.year}</span>}
          </div>
          <h1 className="font-display text-display mt-2">{doc.title}</h1>
          {doc.role && <p className="mt-2 text-body max-w-2xl">{doc.role}</p>}
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="rounded-lg bg-secondary text-secondary-foreground p-6 text-center">
            <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
              {doc.lighthouse?.performance ?? '—'}
            </p>
            <p className="mt-1 text-label uppercase tracking-wide opacity-70">{t.performance}</p>
          </div>
          <div className="rounded-lg bg-secondary text-secondary-foreground p-6 text-center">
            <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
              {doc.lighthouse?.accessibility ?? '—'}
            </p>
            <p className="mt-1 text-label uppercase tracking-wide opacity-70">{t.accessibility}</p>
          </div>
          <div className="rounded-lg bg-secondary text-secondary-foreground p-6 text-center">
            <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
              {doc.lighthouse?.bestPractices ?? '—'}
            </p>
            <p className="mt-1 text-label uppercase tracking-wide opacity-70">{t.bestPractices}</p>
          </div>
          <div className="rounded-lg bg-secondary text-secondary-foreground p-6 text-center">
            <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
              {doc.lighthouse?.seo ?? '—'}
            </p>
            <p className="mt-1 text-label uppercase tracking-wide opacity-70">{t.seo}</p>
          </div>
        </div>
      </Container>

      <Container className="py-8 space-y-12">
        {doc.highlights && doc.highlights.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.highlights}</h2>
            <ul className="list-disc pl-6 space-y-2 text-body">
              {doc.highlights.map((item, i) => (
                <li key={item.id ?? i}>{item.text}</li>
              ))}
            </ul>
          </section>
        )}

        {doc.challenges && doc.challenges.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.challenges}</h2>
            <ul className="list-disc pl-6 space-y-2 text-body">
              {doc.challenges.map((item, i) => (
                <li key={item.id ?? i}>{item.text}</li>
              ))}
            </ul>
          </section>
        )}

        {doc.stack && doc.stack.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.stack}</h2>
            <div className="flex flex-wrap gap-2">
              {doc.stack.map((s, i) => (
                <Badge key={s.id ?? i}>{s.tag}</Badge>
              ))}
            </div>
          </section>
        )}

        {doc.screenshots && doc.screenshots.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.screenshots}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doc.screenshots.map((s, i) => {
                const img = typeof s.image === 'object' ? s.image : null
                return img ? (
                  <div key={s.id ?? i} className="relative aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={img.url ?? ''}
                      alt={img.alt ?? doc.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                ) : null
              })}
            </div>
          </section>
        )}

        {relatedCaseStudy && (
          <section>
            <Link
              href={`/case-studies/${relatedCaseStudy.slug}`}
              className="text-primary-text underline underline-offset-2"
            >
              {t.relatedCaseStudy}
            </Link>
          </section>
        )}
      </Container>

      <JsonLd data={creativeWorkData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
