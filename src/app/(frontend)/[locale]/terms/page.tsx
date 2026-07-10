import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Container } from '@/components/Container'

async function getPage(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'terms' } },
    locale: locale as 'es' | 'en',
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)
  const meta = doc?.meta

  return {
    title: meta?.title ?? doc?.title ?? (locale === 'es' ? 'Términos de Servicio' : 'Terms of Service'),
    description: meta?.description ?? '',
  }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)

  if (!doc) {
    notFound()
  }

  return (
    <main>
      <Container className="py-16 max-w-3xl">
        <h1 className="font-display text-display mb-8">{doc.title}</h1>
        <RenderBlocks blocks={doc.content?.layout ?? []} />
      </Container>
    </main>
  )
}
