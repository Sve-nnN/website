import Image from 'next/image'
import { getPayload } from 'payload'
import { getTranslations } from 'next-intl/server'

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

  // FIX (25-REVIEW critical finding): `title` is a non-localized field —
  // per-locale seed writes on the same doc share one stored value, so
  // whichever locale wrote last "wins" for every locale. Same class of bug
  // as the Services nav/link fix earlier in this phase. Fall back to a
  // real locale-aware translation instead of trusting the stored value
  // when it's null/absent — the seed script must write `title: null`
  // explicitly on the 4 Servicios landings (not simply omit the key:
  // Payload's per-locale update() leaves non-localized fields untouched
  // when absent from the submitted data rather than clearing them, so
  // omitting the key alone left a stale value from an earlier seed run in
  // place — confirmed by direct inspection of the raw stored JSON).
  // Editor-set titles on other pages, where this block is single-instance,
  // are unaffected.
  const t = await getTranslations('testimonialsCarousel')
  const resolvedTitle = title ?? t('title')

  return (
    <Container className="py-12">
      {resolvedTitle && <h2 className="font-heading text-heading mb-6">{resolvedTitle}</h2>}
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
