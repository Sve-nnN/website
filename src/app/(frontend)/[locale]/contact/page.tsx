import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { sendContactMessage } from '@/app/actions/contact'

async function getContactPage(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    locale: locale as 'es' | 'en',
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getContactPage(locale)
  const meta = doc?.meta

  return {
    title: meta?.title ?? doc?.title ?? (locale === 'es' ? 'Contacto' : 'Contact'),
    description: meta?.description ?? '',
  }
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ sent?: string }>
}) {
  const { locale } = await params
  const { sent } = await searchParams
  const doc = await getContactPage(locale)

  if (!doc) {
    notFound()
  }

  const hasHeroTitle = doc.content?.layout?.some(
    (block) => block.blockType === 'hero' && 'title' in block && block.title,
  )

  return (
    <main>
      {!hasHeroTitle && (
        <h1 className="sr-only">
          {doc.meta?.title ?? doc.title ?? (locale === 'es' ? 'Contacto' : 'Contact')}
        </h1>
      )}
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{
          contactFormBlock: {
            onSubmit: sendContactMessage,
            locale,
            sent,
            contactEmail: process.env.CONTACT_TO_EMAIL,
          },
        }}
      />
    </main>
  )
}
