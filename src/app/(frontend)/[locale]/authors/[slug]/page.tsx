import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import Image from 'next/image'
import { GraduationCap } from 'lucide-react'

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

  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
  const start = formatter.format(new Date(startDate))
  const end = endDate ? formatter.format(new Date(endDate)) : presentLabel

  return `${start} – ${end}`
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
    expertise: 'Expertise',
    education: 'Educación y Certificaciones',
    experience: 'Experiencia',
    present: 'Presente',
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

  const [{ docs: posts }, { docs: caseStudies }] = await Promise.all([
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
  ])

  const personData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: doc.name,
    jobTitle: doc.jobTitle,
    url: `${SITE_URL}/authors/${doc.slug}`,
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
                      <p className="mt-1 text-label text-muted-foreground">{dateRange}</p>
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
                      <p className="text-label text-muted-foreground">{dateRange}</p>
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
