import { notFound } from 'next/navigation'

import { getServicePage } from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { JsonLd } from '@/components/JsonLd'

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

  const trail = buildTrail(locale as 'es' | 'en', { slug: doc.slug ?? slug, title: doc.title })

  return (
    <main>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{ hero: { breadcrumbs: trail } }}
      />
    </main>
  )
}
