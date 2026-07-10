import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { ArchiveBlock as ArchiveBlockProps, Post, CaseStudy, Category } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { PostCard } from '@/components/PostCard'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

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

  let docs: (Post | CaseStudy)[] = []
  let categories: Category[] = []

  if (mode === 'manual' && selectedDocs?.length) {
    docs = selectedDocs.map((d) => d.value as Post | CaseStudy).filter((d) => typeof d === 'object')
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

    const result = await payload.find({
      collection: relationTo,
      limit: limit ?? 3,
      sort: '-publishedAt',
      locale,
      where: categoryFilter
        ? {
            categories: { in: [categoryFilter] },
          }
        : undefined,
    })

    docs = result.docs
  }

  return (
    <Container className="py-12">
      {relationTo === 'posts' && enableCategoryFilter && categories.length > 0 && (
        <Tabs value={activeCategory ?? 'all'} className="mb-8">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <a href="?">All</a>
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.slug ?? String(cat.id)} asChild>
                <a href={`?category=${cat.slug}`}>{cat.title}</a>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {docs.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-heading text-heading">{emptyStateHeading}</p>
          {emptyStateBody && <p className="mt-2 text-body text-muted-foreground">{emptyStateBody}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) =>
            relationTo === 'posts' ? (
              <PostCard key={doc.id} post={doc as Post} />
            ) : (
              <CaseStudyCard key={doc.id} caseStudy={doc as CaseStudy} />
            ),
          )}
        </div>
      )}
    </Container>
  )
}
