import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'

import type { Author, Category, Post } from '@/payload-types'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { Badge } from '@/components/ui/badge'
import { AuthorByline } from '@/components/AuthorByline'
import { AuthorCard } from '@/components/AuthorCard'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { RelatedPostsComponent } from '@/blocks/RelatedPosts/Component'
import { TableOfContentsBlockComponent } from '@/blocks/TableOfContentsBlock/Component'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { SITE_URL } from '@/lib/sitemap-data'
import { getCachedPost } from '@/lib/cache'
import { blogCategoryPath, blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

const WORDS_PER_MINUTE = 200

function getPost(locale: string, slug: string) {
  return getCachedPost(slug, locale as 'es' | 'en')
}

// Rough word-count-over-lexical-JSON estimate — no new dependency needed for
// a plain-text extraction; recursively sums `text` node content.
function extractPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  let text = n.text ?? ''
  if (Array.isArray(n.children)) {
    text += n.children.map(extractPlainText).join(' ')
  }
  return text
}

function estimateReadingTime(content: Post['content']): number {
  const plainText = extractPlainText(content?.root)
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPost(locale, slug)

  if (!doc) {
    return {}
  }

  // Metadata always describes the CANONICAL path, never the requested one —
  // a request on a non-primary category segment is about to be redirected
  // anyway (see the guard in the page component below).
  const path = blogPostPath(resolvePrimaryCategorySlug(doc.categories), slug)

  const meta = doc.meta
  const title = meta?.title ?? doc.title
  const description = meta?.description ?? doc.excerpt ?? ''

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en${path}` : path,
      locale: locale as 'es' | 'en',
      slug,
      metaImage: meta?.image,
      heroImage: doc.heroImage,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', path, `/en${path}`),
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale, category, slug } = await params
  const doc = await getPost(locale, slug)

  if (!doc) {
    notFound()
  }

  const primaryCategorySlug = resolvePrimaryCategorySlug(doc.categories)

  // One post, one indexable URL. A post reached through any other category
  // segment (a stale link, a multi-category post, or a hand-typed path)
  // 308s to the canonical one instead of rendering duplicate content.
  if (category !== primaryCategorySlug) {
    permanentRedirect(
      locale === 'en'
        ? `/en${blogPostPath(primaryCategorySlug, slug)}`
        : blogPostPath(primaryCategorySlug, slug),
    )
  }

  const author = typeof doc.author === 'object' ? (doc.author as Author) : undefined
  const categories = (doc.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )

  const heroImage = typeof doc.heroImage === 'object' ? doc.heroImage : null
  const heroImageUrl = heroImage?.url ?? getFallbackHeroImage(doc.slug ?? String(doc.id))

  const readingTimeMinutes = estimateReadingTime(doc.content)

  const primaryCategory = categories[0]
  const trail = buildBlogTrail(
    locale as 'es' | 'en',
    { slug: primaryCategorySlug, title: primaryCategory?.title ?? primaryCategorySlug },
    { slug: doc.slug ?? slug, title: doc.title },
  )

  // SEO-09. Every key below names a real Payload source. Anything without one is
  // omitted rather than filled in — fabricated structured data is a Google
  // Structured Data Guidelines violation, not a cosmetic gap. That is why there
  // is no `publisher.logo` here: the repo has no real logo asset to point at.
  //
  // `mainEntityOfPage` and `image` must be absolute, so they go through
  // SITE_URL. `heroImageUrl` can already be absolute (Cloudinary) or a root
  // path (local/fallback), hence the conditional.
  const articleUrl = `${SITE_URL}${
    locale === 'en'
      ? `/en${blogPostPath(primaryCategorySlug, doc.slug ?? slug)}`
      : blogPostPath(primaryCategorySlug, doc.slug ?? slug)
  }`
  const articleImage = heroImageUrl.startsWith('http')
    ? heroImageUrl
    : `${SITE_URL}${heroImageUrl}`

  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    // Previously emitted `""` on ES and `null` on EN. Omit instead.
    ...(doc.excerpt ? { description: doc.excerpt } : {}),
    datePublished: doc.publishedAt,
    // Real Payload timestamp — deliberately NOT a copy of datePublished, which
    // would assert a modification date the CMS never recorded.
    ...(doc.updatedAt ? { dateModified: doc.updatedAt } : {}),
    ...(author?.name ? { author: { '@type': 'Person', name: author.name } } : {}),
    // Personal portfolio, not an organisation: the publisher IS the person.
    publisher: { '@type': 'Person', name: 'Juan Carlos Angulo', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    image: articleImage,
    articleSection: primaryCategory?.title ?? primaryCategorySlug,
  }

  return (
    <main>
      <section className="relative">
        <div className="relative aspect-[21/9] w-full">
          <Image
            src={heroImageUrl}
            alt={heroImage?.alt ?? doc.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <Container className="py-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={blogCategoryPath(cat.slug ?? primaryCategorySlug)}>
                <Badge variant="secondary">{cat.title}</Badge>
              </Link>
            ))}
          </div>
          <h1 className="font-display text-display tracking-tight">{doc.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {author && <AuthorByline author={author} />}
            <div className="text-label text-muted-foreground">
              {doc.publishedAt && (
                <time dateTime={doc.publishedAt}>
                  {new Date(doc.publishedAt).toLocaleDateString(locale)}
                </time>
              )}
              {' · '}
              {readingTimeMinutes} {locale === 'es' ? 'min de lectura' : 'min read'}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_16rem] gap-12">
        <article>
          <RichTextRenderer data={doc.content} />
        </article>
        <TableOfContentsBlockComponent
          blockType="tableOfContentsBlock"
          title={locale === 'es' ? 'Tabla de contenidos' : 'Table of contents'}
          position="right"
          sticky
          minHeadingLevel="2"
        />
      </Container>

      {author && (
        <Container className="py-8">
          <AuthorCard author={author} />
        </Container>
      )}

      <RelatedPostsComponent
        blockType="relatedPosts"
        title={locale === 'es' ? 'Artículos relacionados' : 'Related Posts'}
        autoSelect
        limit={3}
        currentPostId={doc.id}
        currentCategoryIds={categories.map((c) => c.id)}
      />

      <JsonLd data={articleData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
