import { notFound } from 'next/navigation'

import { getServicePage } from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildServiceAlternates } from '@/lib/canonical'
import { buildOpenGraph } from '@/lib/og-image'
import { JsonLd } from '@/components/JsonLd'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

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

  const title = doc.meta?.title ?? doc.title
  const description = doc.meta?.description ?? ''

  return {
    title,
    description,
    alternates: buildServiceAlternates(locale as 'es' | 'en', { slug: doc.slug ?? slug }),
    openGraph: buildOpenGraph({
      title,
      description,
      url:
        locale === 'es' ? `/servicios/${doc.slug ?? slug}` : `/en/services/${doc.slug ?? slug}`,
      locale: locale as 'es' | 'en',
      slug: doc.slug ?? slug,
      metaImage: doc.meta?.image,
    }),
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
