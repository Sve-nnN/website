'use client'

import * as m from 'motion/react-m'
import Image from 'next/image'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Card, CardContent } from '@/components/ui/card'

export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  const reducedMotion = useReducedMotion()
  const heroImage = typeof post.heroImage === 'object' ? post.heroImage : null
  const imageUrl = heroImage?.url ?? getFallbackHeroImage(post.slug ?? String(post.id))

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/10] bg-muted">
          <m.div
            className="h-full w-full"
            whileHover={{ scale: reducedMotion ? 1 : 1.05 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <Image
              src={imageUrl}
              alt={heroImage?.alt ?? post.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
            />
          </m.div>
        </div>
        <CardContent className="p-6">
          <h3 className="font-heading text-heading">{post.title}</h3>
          {post.excerpt && <p className="mt-2 text-body text-muted-foreground line-clamp-2">{post.excerpt}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}
