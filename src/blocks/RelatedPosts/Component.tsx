import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { RelatedPostsBlockType, Post } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { PostCard } from '@/components/PostCard'

interface RelatedPostsComponentProps extends RelatedPostsBlockType {
  // Passed by the calling page (05-08 blog post detail) when this block runs
  // in the context of a specific post — not queried internally, per 05-04's
  // interface contract, since RenderBlocks has no notion of "current post".
  currentPostId?: number
  currentCategoryIds?: number[]
}

export async function RelatedPostsComponent(props: RelatedPostsComponentProps) {
  const { title, posts, autoSelect, limit, currentPostId, currentCategoryIds } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  let docs: Post[] = []

  if (posts && posts.length > 0) {
    docs = posts.filter((p): p is Post => typeof p === 'object')
  } else if (autoSelect && currentCategoryIds && currentCategoryIds.length > 0) {
    const result = await payload.find({
      collection: 'posts',
      limit: limit ?? 3,
      locale,
      where: {
        and: [
          { categories: { in: currentCategoryIds } },
          ...(currentPostId ? [{ id: { not_equals: currentPostId } }] : []),
        ],
      },
    })
    docs = result.docs
  }

  if (docs.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-display text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </Container>
  )
}
