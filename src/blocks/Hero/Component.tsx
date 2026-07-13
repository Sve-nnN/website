import Image from 'next/image'
import Link from 'next/link'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { CMSLink } from '@/components/CMSLink'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

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
 *
 * Non-home variants (`listing`/`post-header`/`case-study-header`) are
 * differentiated via `variantStyles` below (padding scale, overlay opacity,
 * accent border) — CSS-only, no new schema fields (28-02, UIPOL-03).
 */
const variantStyles: Record<
  NonNullable<HeroBlockProps['variant']>,
  { padding: string; overlayOpacity: string | null; border: string }
> = {
  home: { padding: 'py-16 md:py-24', overlayOpacity: null, border: '' },
  listing: { padding: 'py-10 md:py-14', overlayOpacity: null, border: 'border-b-4 border-primary' },
  'post-header': {
    padding: 'py-12 md:py-16',
    overlayOpacity: 'opacity-30',
    border: 'border-t-4 border-primary',
  },
  'case-study-header': {
    padding: 'py-14 md:py-20',
    overlayOpacity: 'opacity-45',
    border: 'border-t-8 border-primary',
  },
}

export function HeroComponent(props: HeroBlockProps) {
  const { variant, title, subtitle, media, links, breadcrumbs } = props
  const image = typeof media === 'object' ? media : null

  const isHome = variant === 'home'
  const isListing = variant === 'listing'
  const styles = variantStyles[variant]

  return (
    <section
      className={
        isHome
          ? 'relative bg-secondary text-secondary-foreground py-16 md:py-24 overflow-hidden'
          : `relative bg-secondary text-secondary-foreground ${styles.padding} ${styles.border}`
      }
    >
      {isHome && <HeroGrainGradient />}
      {!isHome && !isListing && image?.url && styles.overlayOpacity && (
        <div className={`absolute inset-0 ${styles.overlayOpacity}`}>
          <Image
            src={image.url}
            alt={image.alt ?? ''}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      )}
      <Container className="relative z-10">
        {isListing && breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-foreground/70">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1
                return (
                  <li key={crumb.id ?? crumb.url} className="flex items-center gap-x-2">
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
            {links.map((row, i) => (
              <CMSLink key={row.id ?? i} {...row.link} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
