import { getPayload } from 'payload'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'

async function getHomePage(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale: locale as 'es' | 'en',
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getHomePage(locale)
  const meta = doc?.meta

  return {
    title: meta?.title ?? doc?.title ?? 'Juan Carlos Angulo',
    description: meta?.description ?? '',
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getHomePage(locale)

  const personData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Juan Carlos Angulo',
    jobTitle: locale === 'es' ? 'Ingeniero de Software y Experto SEO' : 'Software Engineer & SEO Expert',
    url: process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com',
  }

  return (
    <main>
      <h1>
        {doc?.title ??
          (locale === 'es'
            ? 'Bienvenido — contenido de prueba Fase 2'
            : 'Welcome — Phase 2 test content')}
      </h1>
      <JsonLd data={personData} />
    </main>
  )
}
