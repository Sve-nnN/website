import { notFound } from 'next/navigation'

import {
  getServicesIndexPage,
  getServicesIndexMetadata,
  getServicePage,
  SERVICE_SLUGS,
} from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildServicesIndexJsonLd } from '@/lib/service-schema'
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
  return getServicesIndexMetadata(locale as 'es' | 'en')
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

  // SEO-09: the index lists several offerings, so it is not itself a `Service`.
  // Titles come from the real service pages — a landing that does not resolve
  // is dropped rather than listed from a hardcoded label.
  const servicePages = await Promise.all(
    SERVICE_SLUGS.map((slug) => getServicePage(locale as 'es' | 'en', slug)),
  )
  const services = servicePages.flatMap((page, i) =>
    page ? [{ slug: SERVICE_SLUGS[i], title: page.title }] : [],
  )

  return (
    <main>
      {services.length > 0 && (
        <JsonLd data={buildServicesIndexJsonLd(locale as 'es' | 'en', services)} />
      )}
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{ hero: { breadcrumbs: trail } }}
      />
    </main>
  )
}
