import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { getCachedPageBySlug } from '@/lib/cache'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

async function getBlogPage(locale: string) {
  // 43-02: delegates to the shared 43-01 cache fetcher — no explicit depth,
  // preserving the original query's (no-depth) behavior.
  return getCachedPageBySlug('blog', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getBlogPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? 'Blog'
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/blog' : '/blog'

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'blog',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/blog', '/en/blog'),
  }
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const [{ locale }, { category }] = await Promise.all([params, searchParams])
  const doc = await getBlogPage(locale)

  if (!doc) {
    notFound()
  }

  return (
    <main>
      <RenderBlocks blocks={doc.content?.layout ?? []} sharedProps={{ activeCategory: category }} />
    </main>
  )
}
