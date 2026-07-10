import Image from 'next/image'
import Link from 'next/link'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { CMSLink } from '@/components/CMSLink'

/**
 * Renders per `variant`: `home` uses the Display-size title over the
 * secondary/navy background (UI-SPEC hero treatment); listing/post-header/
 * case-study-header use smaller Heading-size treatments. Hero image
 * per-slug deterministic fallback (for posts specifically) is applied by the
 * calling page (05-05/05-08), not here — this component only renders
 * `media` when present.
 *
 * `links` (10.8, UI-22): optional CTA buttons, reusing the shared
 * link()/linkGroup() field factory + CMSLink renderer already used by
 * CallToAction (src/blocks/CallToAction). `breadcrumbs` (10.8, UI-23):
 * optional label+url trail, only exposed on the `listing` variant in the
 * schema, rendered as a plain <nav> above the title.
 */
export function HeroComponent(props: HeroBlockProps) {
  const { variant, title, subtitle, media, links, breadcrumbs } = props
  const image = typeof media === 'object' ? media : null

  const isHome = variant === 'home'
  const isListing = variant === 'listing'

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
        {isListing && breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-foreground/70">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1
                return (
                  <li key={crumb.id ?? i} className="flex items-center gap-x-2">
                    {i > 0 && <span aria-hidden="true">/</span>}
                    {isLast || !crumb.url ? (
                      <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-secondary-foreground underline-offset-2 hover:underline">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
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
        {links && links.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-4">
            {links.map(({ link }, i) => (
              <CMSLink key={i} {...link} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
