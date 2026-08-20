import { notFound, permanentRedirect } from 'next/navigation'

import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import { PostCard } from '@/components/PostCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { BlogCategoryTabs } from '@/components/BlogCategoryTabs'
import { CategoryBridge } from '@/components/CategoryBridge'
import { BlogClosing } from '@/components/BlogClosing'
import { JsonLd } from '@/components/JsonLd'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import {
  getCachedArchive,
  getCachedCategories,
  getCachedPostCategoryMap,
  type CategoryData,
  type PostCardData,
} from '@/lib/cache'
import { blogCategoryPath, blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

// Category listings are finite (66 published posts across 5 categories today),
// so they are not paginated — one page per category is the whole category.
const CATEGORY_POST_LIMIT = 100

const COPY = {
  es: {
    emptyHeading: 'Todavía no hay artículos en esta categoría',
    emptyBody: 'Explora el resto del blog mientras tanto.',
    count: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`),
  },
  en: {
    emptyHeading: 'No posts in this category yet',
    emptyBody: 'Browse the rest of the blog in the meantime.',
    count: (n: number) => (n === 1 ? '1 post' : `${n} posts`),
  },
}

async function findCategory(locale: 'es' | 'en', slug: string): Promise<CategoryData | undefined> {
  const categories = await getCachedCategories(locale)
  return categories.find((c) => c.slug === slug)
}

/**
 * Before the URL restructure, posts lived at `/blog/<slug>`, which now
 * collides with this route's `<category>` segment. Rather than lose those
 * URLs (66 published posts, already indexed), a segment that is not a real
 * category but IS a known post slug resolves to the post's new home so the
 * caller can 308 there.
 */
async function legacyPostRedirectPath(
  locale: 'es' | 'en',
  segment: string,
): Promise<string | null> {
  const postCategoryMap = await getCachedPostCategoryMap(locale)
  const categorySlug = postCategoryMap[segment]

  if (!categorySlug) return null

  const path = blogPostPath(categorySlug, segment)
  return locale === 'en' ? `/en${path}` : path
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale, category: categorySlug } = await params
  const category = await findCategory(locale as 'es' | 'en', categorySlug)

  if (!category) return {}

  const path = blogCategoryPath(categorySlug)
  const title = category.title
  const description = category.description ?? ''

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en${path}` : path,
      locale: locale as 'es' | 'en',
      slug: categorySlug,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', path, `/en${path}`),
  }
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale: rawLocale, category: categorySlug } = await params
  const locale = rawLocale as 'es' | 'en'

  const [category, categories] = await Promise.all([
    findCategory(locale, categorySlug),
    getCachedCategories(locale),
  ])

  if (!category) {
    const legacyPath = await legacyPostRedirectPath(locale, categorySlug)
    if (legacyPath) permanentRedirect(legacyPath)
    notFound()
  }

  const result = await getCachedArchive({
    relationTo: 'posts',
    limit: CATEGORY_POST_LIMIT,
    locale,
    categoryId: category.id,
  })

  const docs = result.docs as PostCardData[]
  const t = COPY[locale] ?? COPY.es
  const trail = buildBlogTrail(locale, { slug: categorySlug, title: category.title })

  return (
    <main>
      <PageHero
        variant="index"
        trail={trail}
        title={category.title}
        subtitle={category.description}
        // El conteo es la orientación más barata que puede dar una categoría:
        // dice si acá hay dos artículos o veinte antes de que el visitante
        // scrollee para averiguarlo.
        meta={[t.count(result.totalDocs)]}
      />

      <Container className="py-12 md:py-16">
        <BlogCategoryTabs locale={locale} categories={categories} activeSlug={categorySlug} />

        {docs.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-heading text-heading">{t.emptyHeading}</p>
            <p className="mt-2 text-body text-muted-foreground">{t.emptyBody}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc, i) => {
              // Same above-the-fold rule as ArchiveBlock: the first row must
              // not be SSR-hidden behind ScrollReveal's opacity:0 nor
              // lazy-load its thumbnail (LCP).
              const isAboveFold = i < 3
              return (
                <ScrollReveal key={doc.id} priority={isAboveFold}>
                  <PostCard
                    post={doc}
                    priority={isAboveFold}
                    href={blogPostPath(resolvePrimaryCategorySlug(doc.categories), doc.slug ?? '')}
                  />
                </ScrollReveal>
              )
            })}
          </div>
        )}
      </Container>

      <CategoryBridge locale={locale} categories={categories} currentSlug={categorySlug} />

      <BlogClosing locale={locale} categoryId={category.id} />

      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
