import type { TestimonialSectionBlock as TestimonialSectionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'

export function TestimonialSectionComponent(props: TestimonialSectionBlockProps) {
  const { quote, authorName, authorRole } = props

  return (
    <Container className="py-12">
      <blockquote className="border-l-4 border-primary pl-6">
        <p className="font-heading text-heading italic">&ldquo;{quote}&rdquo;</p>
        <footer className="mt-4">
          <p className="text-label font-semibold">{authorName}</p>
          <p className="text-label text-muted-foreground">{authorRole}</p>
        </footer>
      </blockquote>
    </Container>
  )
}
