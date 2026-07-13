import Image from 'next/image'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'

export function MediaBlockComponent(props: MediaBlockProps) {
  const { media } = props
  const image = typeof media === 'object' ? media : null

  if (!image?.url) return null

  return (
    <Container className="py-8">
      <div className="relative w-full aspect-video">
        <Image
          src={image.url}
          alt={image.alt ?? ''}
          fill
          className="object-cover rounded-md"
          sizes="100vw"
        />
      </div>
    </Container>
  )
}
