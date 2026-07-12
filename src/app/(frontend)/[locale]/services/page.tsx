import { notFound } from 'next/navigation'

import { getServicesIndexPage } from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'

async function getPage(locale: string) {
  return getServicesIndexPage(locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)

  return {
    title: doc?.meta?.title ?? doc?.title ?? (locale === 'es' ? 'Servicios' : 'Services'),
    description: doc?.meta?.description ?? '',
  }
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const doc = await getPage(locale)

  if (!doc) {
    notFound()
  }

  return (
    <main>
      <RenderBlocks blocks={doc.content?.layout ?? []} />
    </main>
  )
}
