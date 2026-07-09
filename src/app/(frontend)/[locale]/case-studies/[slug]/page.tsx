import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

async function getCaseStudy(locale: string, slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
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
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'es' ? 'Inicio' : 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'es' ? 'Casos de éxito' : 'Case Studies',
        item: `${SITE_URL}/case-studies`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: doc.title,
        item: `${SITE_URL}/case-studies/${doc.slug}`,
      },
    ],
  }

  return (
    <main>
      <h1>{doc.title}</h1>
      {doc.heroMetric ? <p>{doc.heroMetric}</p> : null}
      {doc.heroSubtitle ? <p>{doc.heroSubtitle}</p> : null}
      <JsonLd data={creativeWorkData} />
      <JsonLd data={breadcrumbData} />
    </main>
  )
}
