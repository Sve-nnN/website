import Image from 'next/image'

import type { AboutSectionBlock as AboutSectionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'

export function AboutSectionComponent(props: AboutSectionBlockProps) {
  const { eyebrow, title, paragraphs, photo } = props

  const photoDoc = typeof photo === 'object' ? photo : null

  return (
    <Container className="py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className={photoDoc?.url ? 'md:col-span-7' : 'md:col-span-12'}>
          {eyebrow && (
            <p className="text-label uppercase tracking-wide text-primary mb-2">{eyebrow}</p>
          )}
          <h2 className="font-heading text-heading">{title}</h2>
          <div className="mt-4 space-y-4">
            {paragraphs?.map((paragraph, i) => (
              <p key={i} className="text-body text-muted-foreground">
                {paragraph.text}
              </p>
            ))}
          </div>
        </div>
        {photoDoc?.url && (
          <div className="md:col-span-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={photoDoc.url}
                alt={photoDoc.alt ?? title ?? ''}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
