import { notFound } from 'next/navigation'

import { getServicePage } from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'

async function getPage(locale: string, slug: string) {
  return getServicePage(locale as 'es' | 'en', slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPage(locale, slug)

  if (!doc) {
    return {}
  }

  return {
    title: doc.meta?.title ?? doc.title,
    description: doc.meta?.description ?? '',
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPage(locale, slug)

  if (!doc) {
    notFound()
  }

  return (
    <main>
      <RenderBlocks blocks={doc.content?.layout ?? []} />
    </main>
  )
}
