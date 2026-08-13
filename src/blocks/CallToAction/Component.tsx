import type { CallToActionBlock as CallToActionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { CMSLink } from '@/components/CMSLink'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

export function CallToActionComponent(props: CallToActionBlockProps) {
  const { richText, links } = props

  return (
    <Container className="py-12 md:py-16">
      {/* POLISH: `shadow-xl` and `ring-white/10` were both outside the system —
          the shadow scale stops at `lg` (see tailwind.config.ts boxShadow) and
          white is a raw color where `secondary-foreground` is the token that
          means "ink on a navy surface". */}
      <section className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-secondary-foreground/10">
        <HeroGrainGradient variant="cta" />
        {/* POLISH: the previous vertical-only scrim left the copy sitting on
            whichever shader band happened to be behind it — at some frames the
            ember arcs ran directly under both the heading and the button, so
            the one element that has to stay legible competed with the
            background. A flat base scrim plus a left-anchored one keeps the
            text column readable without flattening the shader in the middle,
            where nothing sits on top of it. */}
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-black/45"
          aria-hidden="true"
        />
        {/* POLISH: the inner row had vertical padding only, so the heading was
            flush against the rounded left edge and the CTA button against the
            right one (measured: 0px on both sides at 1440px). */}
        <div className="relative z-10 px-6 py-16 sm:px-10 md:px-12 md:py-20 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 text-center md:text-left">
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
