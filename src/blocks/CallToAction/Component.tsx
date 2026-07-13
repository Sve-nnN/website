import type { CallToActionBlock as CallToActionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { CMSLink } from '@/components/CMSLink'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

export function CallToActionComponent(props: CallToActionBlockProps) {
  const { richText, links } = props

  return (
    <Container className="py-12 md:py-16">
      <section className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10">
        <HeroGrainGradient variant="cta" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/10"
          aria-hidden="true"
        />
        <div className="relative z-10 py-16 md:py-20 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 text-center md:text-left">
          <div className="flex-1 max-w-xl">
            <RichTextRenderer data={richText} className="text-secondary-foreground" />
          </div>
          {links && links.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              {links.map((row, i) => {
                const { link } = row
                return (
                  <div key={row.id ?? i} className="w-full sm:w-auto">
                    <CMSLink {...link} className="w-full sm:w-auto" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </Container>
  )
}
