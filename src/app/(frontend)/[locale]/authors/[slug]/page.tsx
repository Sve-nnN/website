import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { AuthorCard } from '@/components/AuthorCard'
import { PostCard } from '@/components/PostCard'
import { CaseStudyCard } from '@/components/CaseStudyCard'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

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
  es: { posts: 'Artículos', caseStudies: 'Casos de éxito', home: 'Inicio', authors: 'Autores' },
  en: { posts: 'Posts', caseStudies: 'Case Studies', home: 'Home', authors: 'Authors' },
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
