import { getLocale } from 'next-intl/server'

import type { FeaturedPostsBlock as FeaturedPostsBlockProps, Post } from '@/payload-types'

import { Container } from '@/components/Container'
import { PostCard } from '@/components/PostCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { getCachedFeaturedContent } from '@/lib/cache'

export async function FeaturedPostsBlockComponent(props: FeaturedPostsBlockProps) {
  const { title, limit } = props
  const locale = (await getLocale()) as 'en' | 'es'

  // Phase 43 (43-01): deduped + cached — this and FeaturedCaseStudiesBlock
  // both call the same unstable_cache-wrapped fetcher instead of each doing
  // its own `payload.findGlobal` (root cause #1 of 43-CONTEXT.md).
  const featuredContent = await getCachedFeaturedContent(locale)

  // Runtime data is scoped down by `populate` in getCachedFeaturedContent
  // (title/slug/excerpt/heroImage only) — the generated `Post` type is used
  // here only to satisfy the filter's type predicate against
  // FeaturedContent's static `(number | Post)[]` field type; `PostCard`
  // below narrows further via `PostCardData` at its own prop boundary.
  const posts = (featuredContent.featuredPosts ?? [])
    .filter((p): p is Post => typeof p === 'object')
    .slice(0, limit ?? 3)

  if (posts.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, i) => {
          // 28-04 gap-closure (LCP fix): first row is above the fold on
          // every breakpoint — see ArchiveBlock's same pattern and
          // ScrollReveal.tsx for the root cause.
          const isAboveFold = i < 3
          return (
            <ScrollReveal key={post.id} priority={isAboveFold}>
              <PostCard post={post} priority={isAboveFold} />
            </ScrollReveal>
          )
        })}
      </div>
    </Container>
  )
}
