import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Mic, ExternalLink } from 'lucide-react'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { AuthorCard } from '@/components/AuthorCard'
import { PostCard } from '@/components/PostCard'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

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

  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const start = formatter.format(new Date(startDate))
  const end = endDate ? formatter.format(new Date(endDate)) : presentLabel

  return `${start} – ${end}`
}

/** Formats a single date (day/month/year), e.g. "12 nov 2025". Empty string if missing. */
function formatEventDate(date: string | null | undefined, locale: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
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

  return {
    title: doc.name,
    description: doc.jobTitle ?? '',
  }
}

const copy = {
  es: {
    posts: 'Artículos',
    caseStudies: 'Casos de éxito',
    home: 'Inicio',
    authors: 'Autores',
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
    home: 'Home',
    authors: 'Authors',
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

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: t.authors, item: `${SITE_URL}/authors` },
      { '@type': 'ListItem', position: 3, name: doc.name, item: `${SITE_URL}/authors/${doc.slug}` },
    ],
  }

  return (
    <main>
      <Container className="py-16">
        <AuthorCard author={doc} />

        {doc.expertise && doc.expertise.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-heading mb-6">{t.expertise}</h2>
            <div className="flex flex-wrap gap-2">
              {doc.expertise.map((item, i) => (
                <Badge key={i} variant="secondary">
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
                  <Card key={i} className="flex gap-4 p-6">
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
                    <li key={i} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-8 top-1 size-3.5 rounded-full border-2 border-background bg-primary"
                      />
                      {dateRange && (
                        <p className="text-label text-muted-foreground">{dateRange}</p>
                      )}
                      <h3 className="font-heading text-body font-semibold">{item.role}</h3>
                      <p className="text-body text-muted-foreground">{item.company}</p>
                      {item.description && (
                        <p className="mt-2 text-body text-muted-foreground">{item.description}</p>
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
                          className="mt-3 inline-flex items-center gap-1 text-label text-primary hover:underline"
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
      <JsonLd data={breadcrumbData} />
    </main>
  )
}
