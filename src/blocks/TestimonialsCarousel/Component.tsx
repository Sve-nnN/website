import Image from 'next/image'
import { getPayload } from 'payload'

import type { TestimonialsCarouselBlock as TestimonialsCarouselBlockProps } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/card'

export async function TestimonialsCarouselComponent(props: TestimonialsCarouselBlockProps) {
  const { title, limit } = props
  const payload = await getPayload({ config })

  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    limit: limit ?? 8,
  })

  if (testimonials.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {testimonials.map((testimonial) => {
          const avatar = typeof testimonial.avatar === 'object' ? testimonial.avatar : null

          return (
            <Card key={testimonial.id} className="min-w-[300px] snap-start">
              <CardContent className="pt-6">
                <p className="text-body italic">&ldquo;{testimonial.testimonial}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  {avatar?.url && (
                    <Image
                      src={avatar.url}
                      alt={avatar.alt ?? testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-label">{testimonial.name}</p>
                    <p className="text-label text-muted-foreground">
                      {testimonial.role} · {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Container>
  )
}
