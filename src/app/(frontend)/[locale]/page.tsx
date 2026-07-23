import { getPayload } from 'payload'
import { notFound } from 'next/navigation'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { sendContactMessage } from '@/app/actions/contact'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

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

  if (!doc) {
    notFound()
  }

  const personData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Juan Carlos Angulo',
    jobTitle: locale === 'es' ? 'Ingeniero de Software y Experto SEO' : 'Software Engineer & SEO Expert',
    url: process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com',
  }

  return (
    <main>
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{
          contactFormBlock: {
            onSubmit: sendContactMessage,
            locale,
            contactEmail: process.env.CONTACT_TO_EMAIL,
          },
        }}
      />
      <JsonLd data={personData} />
    </main>
  )
}
