import Image from 'next/image'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'

/**
 * Renders per `variant`: `home` uses the Display-size title over the
 * secondary/navy background (UI-SPEC hero treatment); listing/post-header/
 * case-study-header use smaller Heading-size treatments. Hero image
 * per-slug deterministic fallback (for posts specifically) is applied by the
 * calling page (05-05/05-08), not here — this component only renders
 * `media` when present.
 */
export function HeroComponent(props: HeroBlockProps) {
  const { variant, title, subtitle, media } = props
  const image = typeof media === 'object' ? media : null

  const isHome = variant === 'home'

  return (
    <section
      className={
        isHome
          ? 'relative bg-secondary text-secondary-foreground py-16 md:py-24'
          : 'relative bg-secondary text-secondary-foreground py-12 md:py-16'
      }
    >
      {image?.url && (
        <div className="absolute inset-0 opacity-30">
          <Image src={image.url} alt={image.alt ?? ''} fill className="object-cover" priority />
        </div>
      )}
      <Container className="relative z-10">
        {title && (
          <h1
            className={
              isHome
                ? 'font-display text-display tracking-tight'
                : 'font-heading text-heading tracking-tight'
            }
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-6 text-body max-w-2xl text-secondary-foreground/80">{subtitle}</p>
        )}
      </Container>
    </section>
  )
}
