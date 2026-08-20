import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Category } from '@/payload-types'
import { Container } from '@/components/Container'
import { FeaturedEntry } from '@/components/FeaturedEntry'
import { BlogClosing } from '@/components/BlogClosing'
import { estimateReadingTime, readingTimeLabel } from '@/lib/reading-time'
import { blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
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

/**
 * Newest published post, for the lead entry above the listing grid.
 * Returns null rather than throwing when the collection is empty, so an empty
 * blog still renders its page.
 */
async function getLatestPost(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    locale: locale as 'es' | 'en',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 1,
  })
  return docs[0] ?? null
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; newsletter?: string }>
}) {
  const [{ locale }, { category, newsletter }] = await Promise.all([params, searchParams])
  const doc = await getBlogPage(locale)

  if (!doc) {
    notFound()
  }

  const layout = doc.content?.layout ?? []

  // The lead belongs directly above the grid, and the grid is a CMS block, so
  // the layout is split at the archive block rather than rendered in one pass.
  // Looking the block up by type (instead of assuming it is last) keeps this
  // correct if the page gains another block in the admin.
  const gridIndex = layout.findIndex(
    (block) => block.blockType === 'archiveBlock' || block.blockType === 'blogCategoryRows',
  )
  const hasGrid = gridIndex !== -1

  // With a category filter active, a global "latest post" would sit above a
  // filtered list it may not even belong to, so the lead only shows on the
  // unfiltered view.
  const latest = category || !hasGrid ? null : await getLatestPost(locale)

  const before = hasGrid ? layout.slice(0, gridIndex) : layout
  const after = hasGrid ? layout.slice(gridIndex) : []

  // El destacado ya ocupa su propia pantalla arriba; repetirlo dentro de la
  // fila de su categoría sería el mismo artículo dos veces en un scroll.
  const sharedProps = {
    activeCategory: category,
    excludePostIds: latest ? [latest.id] : [],
    // Los enlaces de confirmación y de baja del correo vuelven acá con
    // `?newsletter=`; el bloque de alta lo lee para mostrar el acuse en vez
    // del formulario.
    newsletterState: newsletter,
  }

  return (
    <main>
      <RenderBlocks blocks={before} sharedProps={sharedProps} />

      {latest && (
        <Container className="pt-12">
          <FeaturedEntry
            kind="post"
            locale={locale as 'es' | 'en'}
            title={latest.title}
            slug={latest.slug ?? String(latest.id)}
            href={blogPostPath(resolvePrimaryCategorySlug(latest.categories), latest.slug ?? '')}
            heroImage={latest.heroImage}
            excerpt={latest.excerpt}
            publishedAt={latest.publishedAt}
            readingTime={readingTimeLabel(
              estimateReadingTime(latest.content),
              locale as 'es' | 'en',
            )}
            category={
              latest.categories?.find(
                (c): c is Category => typeof c === 'object' && c !== null,
              )?.title
            }
          />
        </Container>
      )}

      <RenderBlocks blocks={after} sharedProps={sharedProps} />

      <BlogClosing locale={locale as 'es' | 'en'} />
    </main>
  )
}
