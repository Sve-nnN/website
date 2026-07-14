import type { LocalProofSectionBlock as LocalProofSectionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/card'

export function LocalProofSectionComponent(props: LocalProofSectionBlockProps) {
  const { stats, testimonial } = props

  return (
    <Container className="py-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {stats?.map((stat, i) => (
          <div key={stat.id ?? i} className="text-center sm:text-left">
            <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
              {stat.value}
            </p>
            <p className="mt-1 text-label uppercase tracking-wide opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>
      {testimonial?.quote && (
        <Card className="mt-12">
          <CardContent className="p-8">
            <blockquote className="border-l-4 border-primary pl-6">
              <p className="font-heading text-heading italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-4">
                <p className="text-label font-semibold">{testimonial.authorName}</p>
                <p className="text-label text-muted-foreground">{testimonial.authorBusiness}</p>
              </footer>
            </blockquote>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
