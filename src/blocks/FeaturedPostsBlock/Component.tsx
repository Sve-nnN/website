import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { FeaturedPostsBlock as FeaturedPostsBlockProps, Post } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { PostCard } from '@/components/PostCard'
import { ScrollReveal } from '@/components/ScrollReveal'

export async function FeaturedPostsBlockComponent(props: FeaturedPostsBlockProps) {
  const { title, limit } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  const featuredContent = await payload.findGlobal({
    slug: 'featured-content',
    depth: 1,
    locale,
  })

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
