import Image from 'next/image'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { Card, CardContent } from '@/components/ui/card'

export function PostCard({ post }: { post: Post }) {
  const heroImage = typeof post.heroImage === 'object' ? post.heroImage : null
  const imageUrl = heroImage?.url ?? getFallbackHeroImage(post.slug ?? String(post.id))

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/10] bg-muted">
          <Image
            src={imageUrl}
            alt={heroImage?.alt ?? post.title}
            fill
            className="object-cover transition-transform duration-base ease-standard group-hover:scale-105"
          />
        </div>
        <CardContent className="p-6">
          <h3 className="font-display text-heading">{post.title}</h3>
          {post.excerpt && <p className="mt-2 text-body text-muted-foreground line-clamp-2">{post.excerpt}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}
