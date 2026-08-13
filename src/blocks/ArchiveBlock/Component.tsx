import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { ArchiveBlock as ArchiveBlockProps, Post, CaseStudy, Website, Category } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { PostCard } from '@/components/PostCard'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { WebsiteCard } from '@/components/WebsiteCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { getCachedArchive, type PostCardData, type CaseStudyCardData } from '@/lib/cache'
import { BlogCategoryTabs } from '@/components/BlogCategoryTabs'

interface ArchiveBlockComponentProps extends ArchiveBlockProps {
  // Server-rendered category filter reads this from the page's own searchParams;
  // callers (page plans) pass it through since block props don't carry request state.
  activeCategory?: string
}

export async function ArchiveBlockComponent(props: ArchiveBlockComponentProps) {
  const {
    relationTo,
    mode,
    limit,
    selectedDocs,
    enableCategoryFilter,
    activeCategory,
    emptyStateHeading,
    emptyStateBody,
  } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  let docs: (Post | CaseStudy | Website | PostCardData | CaseStudyCardData)[] = []
  let categories: Category[] = []

  if (mode === 'manual' && selectedDocs?.length) {
    docs = selectedDocs.flatMap((d) => (typeof d.value === 'object' ? [d.value as Post | CaseStudy | Website] : []))
  } else {
    // T-05-04-01: validate the category param against the real fetched
    // categories list before using it in a `where` clause — never pass raw
    // user input straight into a Payload query.
    let categoryFilter: number | undefined

    if (relationTo === 'posts' && enableCategoryFilter) {
      const categoriesResult = await payload.find({
        collection: 'categories',
        limit: 100,
        locale,
      })
      categories = categoriesResult.docs

      if (activeCategory) {
        const match = categories.find((c) => c.slug === activeCategory)
        // T-05-04-01 / T-05-07-01: an activeCategory that doesn't match any
        // real, fetched category (garbage/unknown ?category= value) must
        // resolve to zero results (empty state), never fall through to an
        // unfiltered "all posts" query — that would silently ignore an
        // invalid filter instead of surfacing it as "no matches".
        categoryFilter = match ? match.id : -1
      }
    }

    // 43-02: delegates to the shared 43-01 cache fetcher (select-scoped for
    // posts/case-studies -- richText/results.metrics no longer serialize
    // into this grid's RSC payload). categoryId is part of the cache key,
    // so distinct category filters never share a cache entry (T-43-06).
    const result = await getCachedArchive({
      relationTo,
      limit: limit ?? 3,
      locale,
      categoryId: categoryFilter,
    })

    docs = result.docs
  }

  return (
    <Container className="py-12">
      {relationTo === 'posts' && enableCategoryFilter && (
        <BlogCategoryTabs locale={locale} categories={categories} activeSlug={activeCategory} />
      )}
      {docs.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-heading text-heading">{emptyStateHeading}</p>
          {emptyStateBody && <p className="mt-2 text-body text-muted-foreground">{emptyStateBody}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc, i) => {
            // 28-04 gap-closure (LCP fix): the first row (lg:grid-cols-3) is
            // above the fold on every breakpoint this grid renders at — do
            // not SSR-hide it behind ScrollReveal's opacity:0 initial state,
            // and do not lazy-load its thumbnail image. See ScrollReveal.tsx.
            const isAboveFold = i < 3
            return (
              <ScrollReveal key={doc.id} priority={isAboveFold}>
                {relationTo === 'posts' ? (
                  <PostCard post={doc as PostCardData} priority={isAboveFold} />
                ) : relationTo === 'websites' ? (
                  <WebsiteCard website={doc as Website} />
                ) : (
                  <CaseStudyCard caseStudy={doc as CaseStudyCardData} />
                )}
              </ScrollReveal>
            )
          })}
        </div>
      )}
    </Container>
  )
}
