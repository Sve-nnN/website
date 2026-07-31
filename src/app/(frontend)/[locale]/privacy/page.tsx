import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Container } from '@/components/Container'
import { buildOpenGraph } from '@/lib/og-image'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

async function getPage(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'privacy' } },
    locale: locale as 'es' | 'en',
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? (locale === 'es' ? 'Política de Privacidad' : 'Privacy Policy')
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/privacy' : '/privacy'

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'privacy',
      metaImage: meta?.image,
    }),
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
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
