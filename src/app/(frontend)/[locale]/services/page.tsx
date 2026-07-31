import { notFound } from 'next/navigation'

import { getServicesIndexPage } from '@/lib/services-data'
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

async function getPage(locale: string) {
  return getServicesIndexPage(locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)

  const title = doc?.meta?.title ?? doc?.title ?? (locale === 'es' ? 'Servicios' : 'Services')
  const description = doc?.meta?.description ?? ''

  return {
    title,
    description,
    alternates: buildServiceAlternates(locale as 'es' | 'en'),
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'es' ? '/servicios' : '/en/services',
      locale: locale as 'es' | 'en',
      slug: 'servicios',
      metaImage: doc?.meta?.image,
    }),
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

  const trail = buildTrail(locale as 'es' | 'en')

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
