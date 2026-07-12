import type { CallToActionBlock as CallToActionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { CMSLink } from '@/components/CMSLink'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

export function CallToActionComponent(props: CallToActionBlockProps) {
  const { richText, links } = props

  return (
    <section className="relative overflow-hidden rounded-lg">
      <HeroGrainGradient />
      <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
      <Container className="relative z-10 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <RichTextRenderer data={richText} className="text-secondary-foreground" />
        </div>
        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {links.map(({ link }, i) => (
              <CMSLink key={i} {...link} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
