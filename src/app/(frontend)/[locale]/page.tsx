import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { sendContactMessage } from '@/app/actions/contact'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { getCachedPageBySlug } from '@/lib/cache'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

// Phase 43 (43-01): wrapped in unstable_cache (src/lib/cache.ts) — same
// query/signature as before, so generateMetadata + HomePage (which each call
// this once per request) now share a request-scoped Data Cache entry instead
// of both hitting Postgres directly.
async function getHomePage(locale: string) {
  return getCachedPageBySlug('home', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getHomePage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? 'Juan Carlos Angulo'
  const description = meta?.description ?? ''

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? '/en' : '/',
      locale: locale as 'es' | 'en',
      slug: 'home',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/', '/en'),
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
