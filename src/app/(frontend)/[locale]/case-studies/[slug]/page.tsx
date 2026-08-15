import Image from 'next/image'
// Deliberately the PLAIN link, not the locale-aware `Link` from
// `@/i18n/navigation`: both link sites here are already locale-correct — one
// breadcrumb url (prefixed by `src/lib/breadcrumbs.ts`) plus two CTAs that
// build their own prefix from the `localePrefix` constant below.
import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { Author } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { AuthorCard } from '@/components/AuthorCard'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { SITE_URL } from '@/lib/sitemap-data'
import { CaseStudyResultsChart } from '@/components/CaseStudyResultsChart'
import { Button } from '@/components/ui/button'
import { getCachedCaseStudy } from '@/lib/cache'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

function getCaseStudy(locale: string, slug: string) {
  return getCachedCaseStudy(slug, locale as 'es' | 'en')
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
  const title = meta?.title ?? doc.title
  const description = meta?.description ?? doc.heroSubtitle ?? ''

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en/case-studies/${slug}` : `/case-studies/${slug}`,
      locale: locale as 'es' | 'en',
      slug,
      metaImage: meta?.image,
      heroImage: doc.heroImage,
    }),
    alternates: buildAlternates(
      locale as 'es' | 'en',
      `/case-studies/${slug}`,
      `/en/case-studies/${slug}`,
    ),
  }
}

const copy = {
  es: {
    client: 'El cliente',
    challenge: 'El reto',
    solution: 'La solución',
    results: 'Resultados',
    before: 'Antes',
    after: 'Después',
    ctaHeading: '¿Quieres resultados como estos?',
    ctaPrimary: 'Hablemos de tu proyecto',
    ctaSecondary: 'Ver más casos de éxito',
  },
  en: {
    client: 'The Client',
    challenge: 'The Challenge',
    solution: 'The Solution',
    results: 'Results',
    before: 'Before',
    after: 'After',
    ctaHeading: 'Want results like these?',
    ctaPrimary: "Let's talk about your project",
    ctaSecondary: 'See more case studies',
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
  const trail = buildCaseStudiesTrail(locale as 'es' | 'en', {
    slug: doc.slug ?? slug,
    title: doc.title,
  })

  const localePrefix = locale === 'es' ? '' : '/en'

  // SEO-09 items 4 and 5. `about` was a bare string where schema.org expects a
  // Thing. `image`, `url` and `datePublished` were missing outright. Empty
  // values are omitted rather than emitted as "" or null.
  const caseStudyUrl = `${SITE_URL}${localePrefix}/case-studies/${doc.slug ?? slug}`
  const caseStudyImage = heroImageUrl.startsWith('http')
    ? heroImageUrl
    : `${SITE_URL}${heroImageUrl}`

  const creativeWorkData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: doc.title,
    url: caseStudyUrl,
    image: caseStudyImage,
    ...(doc.heroSubtitle
      ? {
          about: { '@type': 'Thing', name: doc.heroSubtitle },
          description: doc.heroSubtitle,
        }
      : {}),
    ...(author ? { author: { '@type': 'Person', name: author.name } } : {}),
    // The issue asks for `datePublished`, but the CaseStudies collection has no
    // `publishedAt` field — verified, it does not exist. The only dates that
    // exist are the CMS row timestamps below, and passing `createdAt` off as an
    // editorial publication date would assert something the CMS never recorded.
    // So the key is omitted. That part of the issue needs a schema field first.
    dateCreated: doc.createdAt,
    dateModified: doc.updatedAt,
    ...(client?.name ? { creator: { '@type': 'Organization', name: client.name } } : {}),
    ...(doc.kpis && doc.kpis.length > 0
      ? {
          additionalProperty: doc.kpis.map((kpi) => ({
            '@type': 'PropertyValue',
            name: kpi.label,
            value: kpi.value,
          })),
        }
      : {}),
  }

  return (
    <main>
      {/* POLISH: the hero used to be a 21/9 image band stacked ABOVE the text,
          which measured 617px tall on a 1440x812 viewport and pushed the h1 to
          y=782 — at the very bottom edge of the fold, and below it on any
          shorter laptop. A case study has to lead with its headline and metric,
          not with a decorative gradient. The image is now the hero's
          background with the copy on top, which is the treatment the shared
          Hero block's own `case-study-header` variant already uses; this page
          was a one-off that drifted from it. */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground border-t-8 border-primary">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={heroImageUrl}
            alt=""
            fill
            className="object-cover opacity-45"
            priority
            sizes="100vw"
          />
          {/* Scrim: the hero images are wide-gamut abstract gradients, so a
              flat tint alone left light passages under the copy. The vertical
              ramp keeps the lower half — where the title, metric and
              breadcrumb sit — reliably dark. */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/75 to-secondary/40" />
        </div>
        <Container className="relative z-10 py-14 md:py-20">
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
          {/* POLISH: these ran as bare spans separated only by a gap, so
              "E-commerce" and "2025" read as two loose words rather than one
              metadata line. Interpuncts are rendered from the array so no
              separator is orphaned when a field is missing (the client name is
              absent on every anonymised case study). */}
          {[client?.name, doc.sector, doc.period].filter(Boolean).length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label opacity-80">
              {[client?.name, doc.sector, doc.period]
                .filter((v): v is string => Boolean(v))
                .map((value, i) => (
                  <span key={value} className="flex items-center gap-x-2">
                    {i > 0 && <span aria-hidden="true">·</span>}
                    {value}
                  </span>
                ))}
            </div>
          )}
          <h1 className="font-display text-display mt-3 tracking-tight text-balance">{doc.title}</h1>
          {doc.heroSubtitle && (
            <p className="mt-4 text-body max-w-[65ch] text-secondary-foreground/85">
              {doc.heroSubtitle}
            </p>
          )}
          {/* POLISH: the metric was also `text-display`, so two 56px elements
              competed for the same moment and neither won. The headline is the
              title; the metric is its proof, so it steps down one level and
              keeps the ember, which reads at 4.9:1 on navy. */}
          {doc.heroMetric && (
            <p className="mt-6 font-heading text-heading font-semibold text-primary tracking-tight tabular-nums">
              {doc.heroMetric}
            </p>
          )}
        </Container>
      </section>

      {doc.kpis && doc.kpis.length > 0 && (
        <Container className="py-12">
          {/* POLISH: the grid was hard-coded to 4 columns, so a case study with
              3 KPIs (the common count) left a dead cell on the right. The
              column count now follows the actual number of KPIs. */}
          <div
            className={`grid grid-cols-2 gap-6 ${
              doc.kpis.length === 3
                ? 'md:grid-cols-3'
                : doc.kpis.length <= 2
                  ? 'md:grid-cols-2'
                  : 'md:grid-cols-4'
            }`}
          >
            {doc.kpis.map((kpi, i) => (
              <div
                key={kpi.id ?? i}
                className="rounded-2xl bg-secondary text-secondary-foreground p-6 text-center"
              >
                {/* Array is the h1 voice, not a stat voice — these are labels
                    with numbers, so they take Khand like every other non-title
                    heading. It also drops the faux-bold synthesis, since Khand
                    ships a real 600. */}
                <p className="font-heading text-display font-semibold text-primary tracking-tight tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-2 text-label uppercase tracking-wide opacity-70">{kpi.label}</p>
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
            <ul className="list-disc pl-6 space-y-2 text-body max-w-[70ch]">
              {doc.challenge.map((item, i) => (
                <li key={item.id ?? i}>{item.text}</li>
              ))}
            </ul>
          </section>
        )}

        {doc.solution && doc.solution.length > 0 && (
          <section>
            <h2 className="font-heading text-heading mt-10 mb-4">{t.solution}</h2>
            <ol className="space-y-4">
              {doc.solution.map((step, i) => (
                // POLISH: the step number sat as a bare glyph in `text-primary`
                // (3.15:1 on the light surface — it clears the 3:1 large-text
                // floor at 28px, but only just). `text-primary-text` takes it
                // to 4.61:1, and the tabular ring gives the sequence a shape
                // instead of a floating digit hanging off the text block.
                <li key={step.id ?? i} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-heading text-label font-semibold text-primary-text tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-body">{step.title}</p>
                    <p className="mt-1 text-body text-muted-foreground max-w-[70ch]">
                      {step.description}
                    </p>
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
            {/* The metric cards that used to sit under the chart are gone: the
                rewritten chart carries the label, both values and the delta as
                real text, so the cards repeated the same three facts in a
                second layout. Nothing was dropped — the struck-through "before"
                value they used to show is now a labelled bar. */}
            <CaseStudyResultsChart
              metrics={doc.results.metrics}
              copy={{ before: t.before, after: t.after }}
            />
          </section>
        )}

        {doc.conclusion && (
          <section>
            <RichTextRenderer data={doc.conclusion} />
          </section>
        )}

        <section className="text-center mt-10">
          <h2 className="font-heading text-heading mb-4">{t.ctaHeading}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="default">
              <Link href={`${localePrefix}/contact`}>{t.ctaPrimary}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`${localePrefix}/case-studies`}>{t.ctaSecondary}</Link>
            </Button>
          </div>
        </section>

        {author && (
          <section>
            <AuthorCard author={author} />
          </section>
        )}
      </Container>

      <JsonLd data={creativeWorkData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
