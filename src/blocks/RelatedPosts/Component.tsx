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
    // Misma razon que el `overrideAccess: false` de abajo: un post elegido a
    // mano tambien puede haberse despublicado despues de elegirlo, y su tarjeta
    // enlazaria a una URL que ya no responde 200.
    docs = posts.filter(
      (p): p is Post => typeof p === 'object' && p._status === 'published',
    )
  } else if (autoSelect && currentCategoryIds && currentCategoryIds.length > 0) {
    const result = await payload.find({
      collection: 'posts',
      limit: limit ?? 3,
      locale,
      // SEO-40: sin esto la Local API se saltea `read: authenticatedOrPublished`
      // y el rail devolvia posts DESPUBLICADOS. Los 7 perdedores de la
      // consolidacion de canibalizacion (#5) quedaron en borrador con un 301
      // encima, y este bloque los seguia enlazando por su slug viejo: medido el
      // 2026-08-25, 64 enlaces servidos hacia `/blog/tech-seo/tech-seo-guide` y
      // `/blog/tech-seo/nextjs-seo-optimization`, que hoy son 308.
      //
      // No era solo un salto de mas. Un enlace interno hacia la URL vieja le
      // confirma a Google que sigue viva, que es justo lo que bloquea la
      // consolidacion del indice (#38), y ademas exponia contenido sin publicar.
      //
      // `overrideAccess: false` es el mismo mecanismo que ya usaban
      // RelatedCaseStudyBlock y todos los fetchers de src/lib/cache.ts.
      overrideAccess: false,
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
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </Container>
  )
}
