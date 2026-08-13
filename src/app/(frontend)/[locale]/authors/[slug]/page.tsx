import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Mic, ExternalLink } from 'lucide-react'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { Container } from '@/components/Container'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { buildAuthorsTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { AuthorCard } from '@/components/AuthorCard'
import { PostCard } from '@/components/PostCard'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

// PERF (js-hoist-intl): `locale` is a runtime parameter, not a module
// constant, so a single top-level formatter can't be hoisted. Memoize per
// locale instead -- this codebase only ever uses 'es'/'en', so each cache
// stays at most 2 entries.
const dateRangeFormatters = new Map<string, Intl.DateTimeFormat>()
const eventDateFormatters = new Map<string, Intl.DateTimeFormat>()

function getDateRangeFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = dateRangeFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
    dateRangeFormatters.set(locale, formatter)
  }
  return formatter
}

function getEventDateFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = eventDateFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    eventDateFormatters.set(locale, formatter)
  }
  return formatter
}

/**
 * Formats a date range for education/experience items, e.g. "May 2022 – Aug 2028".
 * Falls back to `presentLabel` when `endDate` is missing (ongoing item).
 * Degrades gracefully (empty string) if `startDate` is missing.
 */
function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  locale: string,
  presentLabel: string,
) {
  if (!startDate) return ''

  const formatter = getDateRangeFormatter(locale)
  const start = formatter.format(new Date(startDate))
  const end = endDate ? formatter.format(new Date(endDate)) : presentLabel

  return `${start} – ${end}`
}

/** Formats a single date (day/month/year), e.g. "12 nov 2025". Empty string if missing. */
function formatEventDate(date: string | null | undefined, locale: string) {
  if (!date) return ''
  return getEventDateFormatter(locale).format(new Date(date))
}

async function getAuthor(locale: string, slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'authors',
    where: { slug: { equals: slug } },
    locale: locale as 'es' | 'en',
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
  const doc = await getAuthor(locale, slug)

  if (!doc) return {}

  const title = doc.meta?.title ?? doc.name
  const description = doc.meta?.description ?? doc.jobTitle ?? ''

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en/authors/${slug}` : `/authors/${slug}`,
      locale: locale as 'es' | 'en',
      slug: doc.slug ?? slug,
      metaImage: doc.meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', `/authors/${slug}`, `/en/authors/${slug}`),
  }
}

const copy = {
  es: {
    posts: 'Artículos',
    caseStudies: 'Casos de éxito',
    // `home`/`authors` used to live here purely to label the hand-rolled
    // breadcrumb JSON-LD. Those labels now come from lib/breadcrumbs.ts, and
    // keeping a second copy here would be an invitation to let the two drift.
    expertise: 'Áreas de especialización',
    education: 'Educación y Certificaciones',
    experience: 'Experiencia',
    present: 'Presente',
    speakingEvents: 'Eventos donde he sido ponente',
    coSpeakersLabel: 'Con',
    attendeesLabel: 'asistentes',
    watchLink: 'Ver más',
  },
  en: {
    posts: 'Posts',
    caseStudies: 'Case Studies',
    expertise: 'Expertise',
    education: 'Education & Certifications',
    experience: 'Experience',
    present: 'Present',
    speakingEvents: 'Speaking Events',
    coSpeakersLabel: 'With',
    attendeesLabel: 'attendees',
    watchLink: 'Learn more',
  },
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getAuthor(locale, slug)

  if (!doc) {
    notFound()
  }

  const t = copy[locale as 'es' | 'en'] ?? copy.es
  const payload = await getPayload({ config })

  const [{ docs: posts }, { docs: caseStudies }, { docs: speakingEvents }] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { author: { equals: doc.id } },
      locale: locale as 'es' | 'en',
      limit: 50,
    }),
    payload.find({
      collection: 'case-studies',
      where: { author: { equals: doc.id } },
      locale: locale as 'es' | 'en',
      limit: 50,
    }),
    payload.find({
      collection: 'speaking-events',
      locale: locale as 'es' | 'en',
      sort: '-date',
      limit: 50,
    }),
  ])

  const personData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: doc.name,
    jobTitle: doc.jobTitle,
    url: `${SITE_URL}/authors/${doc.slug}`,
    ...(doc.socialLinks?.length ? { sameAs: doc.socialLinks.map((s) => s.url) } : {}),
    ...(doc.expertise?.length ? { knowsAbout: doc.expertise.map((e) => e.topic) } : {}),
    ...(doc.education?.length
      ? {
          hasCredential: doc.education.map((ed) => ({
            '@type': 'EducationalOccupationalCredential',
            name: ed.degree,
            recognizedBy: { '@type': 'Organization', name: ed.institution },
            ...(ed.endDate ? { datePublished: ed.endDate } : {}),
          })),
        }
      : {}),
  }

  // POLISH: this used to be a hand-rolled BreadcrumbList with hardcoded
  // labels and URLs — and, more importantly, no visible counterpart anywhere
  // on the page. Now both the markup and the rendered trail come from the same
  // array, through the same helper every other section already uses.
  const trail = buildAuthorsTrail(locale as 'es' | 'en', {
    slug: doc.slug ?? slug,
    title: doc.name,
  })

  return (
    <main>
      <Container className="py-16">
        <Breadcrumbs trail={trail} className="mb-8" />
        <AuthorCard author={doc} asPageHeading />

        {doc.expertise && doc.expertise.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.expertise}</h2>
            <div className="flex flex-wrap gap-2">
              {doc.expertise.map((item, i) => (
                <Badge key={item.id ?? i} variant="secondary">
                  {item.topic}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {doc.education && doc.education.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.education}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doc.education.map((item, i) => {
                const logo = typeof item.logo === 'object' ? item.logo : null
                const dateRange = formatDateRange(item.startDate, item.endDate, locale, t.present)

                return (
                  <Card key={item.id ?? i} className="flex gap-4 p-6">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      {logo?.url ? (
                        <Image
                          src={logo.url}
                          alt={logo.alt ?? item.institution}
                          width={48}
                          height={48}
                          className="rounded-md object-contain"
                        />
                      ) : (
                        <GraduationCap className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-heading text-body font-semibold">{item.degree}</p>
                      <p className="text-body text-muted-foreground">{item.institution}</p>
                      {dateRange && (
                        <p className="mt-1 text-label text-muted-foreground">{dateRange}</p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {doc.experience && doc.experience.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.experience}</h2>
            <div className="relative pl-8">
              <div aria-hidden className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
              <ol className="space-y-8">
                {doc.experience.map((item, i) => {
                  const dateRange = formatDateRange(item.startDate, item.endDate, locale, t.present)

                  return (
                    // POLISH: the date line only rendered when a date existed,
                    // so on an entry without one the dot lined up with the role
                    // instead of the date — measured on production, entry 1's
                    // dot sat beside an <h3> while entries 2 and 3 sat beside a
                    // <p>, and the reading order flipped between items. The
                    // slot is now always present; when there is no date it is
                    // simply empty, and every dot lines up with the same thing.
                    <li key={item.id ?? i} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-8 top-1 size-3.5 rounded-full border-2 border-background bg-primary"
                      />
                      <p className="min-h-5 text-label text-muted-foreground">
                        {dateRange || ' '}
                      </p>
                      <h3 className="font-heading text-body font-semibold">{item.role}</h3>
                      <p className="text-body text-muted-foreground">{item.company}</p>
                      {item.description && (
                        <p className="mt-2 text-body text-muted-foreground max-w-[70ch]">
                          {item.description}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>
        )}

        {speakingEvents.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.speakingEvents}</h2>
            <div className="grid grid-cols-1 gap-6">
              {speakingEvents.map((event) => {
                const flyer = typeof event.flyer === 'object' ? event.flyer : null
                const eventDate = formatEventDate(event.date, locale)
                const metaParts = [
                  eventDate,
                  event.location ?? undefined,
                  event.attendeeCount ? `${event.attendeeCount} ${t.attendeesLabel}` : undefined,
                ].filter(Boolean)

                return (
                  <Card key={event.id} className="flex gap-4 p-6">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      {flyer?.url ? (
                        <Image
                          src={flyer.url}
                          alt={flyer.alt ?? event.title}
                          width={48}
                          height={48}
                          className="rounded-md object-contain"
                        />
                      ) : (
                        <Mic className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-heading text-body font-semibold">{event.title}</p>
                        {event.role && <Badge variant="secondary">{event.role}</Badge>}
                      </div>
                      {metaParts.length > 0 && (
                        <p className="mt-1 text-label text-muted-foreground">{metaParts.join(' · ')}</p>
                      )}
                      {event.description && (
                        <p className="mt-2 text-body text-muted-foreground">{event.description}</p>
                      )}
                      {event.coSpeakers && event.coSpeakers.length > 0 && (
                        <p className="mt-2 text-label text-muted-foreground">
                          {t.coSpeakersLabel} {event.coSpeakers.map((cs) => cs.name).join(', ')}
                        </p>
                      )}
                      {event.link && (
                        <Link
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          // POLISH: `text-primary` is 3.15:1 on the light card
                          // at 14px — below AA. `text-primary-text` is 4.61:1.
                          className="mt-3 inline-flex min-h-6 items-center gap-1 rounded-sm text-label text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                        >
                          {t.watchLink}
                          <ExternalLink className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.posts}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {caseStudies.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.caseStudies}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudies.map((cs) => (
                <CaseStudyCard key={cs.id} caseStudy={cs} />
              ))}
            </div>
          </section>
        )}
      </Container>

      <JsonLd data={personData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
