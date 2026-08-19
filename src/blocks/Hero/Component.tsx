import Image from 'next/image'
import { MapPin, CheckCircle2 } from 'lucide-react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { CMSLink } from '@/components/CMSLink'
import { PageHero, type PageHeroVariant } from '@/components/PageHero'
import { omitPlaceholder } from '@/lib/placeholder'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

/**
 * Two heroes live here and only two: `home`, whose grain shader is a signature
 * of that one surface, and `local-landing`, whose city badge, inline stat and
 * decorative ring are signatures of the Lima/Madrid pages. Both are rendered
 * below.
 *
 * Every other variant is template furniture shared with the eleven
 * code-rendered pages, so it delegates to `PageHero` (see the note at the top
 * of `src/components/PageHero.tsx` for why): `listing` maps to the `index`
 * template, `post-header` and `case-study-header` to `detail`. Before this,
 * the block carried its own `variantStyles` table and the pages carried
 * theirs, which is how a CMS-driven blog index and a code-driven case-studies
 * index ended up looking like two different sites.
 *
 * The breadcrumb trail and the CTA row are locale-aware inside `PageHero` and
 * `CMSLink` respectively — `crumb.url` is admin-authored and NOT localized in
 * `config.ts`, so it needs the `isPrefixableHref` guard `PageHero` applies.
 */
const TEMPLATE_VARIANT: Record<string, PageHeroVariant> = {
  listing: 'index',
  'post-header': 'detail',
  'case-study-header': 'detail',
}

export function HeroComponent(props: HeroBlockProps) {
  const {
    variant,
    title,
    subtitle,
    media,
    links,
    breadcrumbs,
    cityName,
    inlineStat,
    ringSide,
    ringOpacity,
    ringFlipX,
  } = props
  const image = typeof media === 'object' ? media : null

  const isHome = variant === 'home'
  const isLocalLanding = variant === 'local-landing'
  // `media` is the background image on the detail templates; on the home hero
  // it is the portrait instead, since that hero's background is the shader.
  const portrait = isHome ? image : null

  const ctaRow = links && links.length > 0 && (
    <div className="mt-8 flex flex-wrap gap-4">
      {links.map((row, i) => (
        <CMSLink key={row.id ?? i} {...row.link} />
      ))}
    </div>
  )

  if (!isHome && !isLocalLanding) {
    const templateVariant = TEMPLATE_VARIANT[variant] ?? 'index'
    return (
      <PageHero
        variant={templateVariant}
        title={title ?? ''}
        subtitle={subtitle}
        trail={(breadcrumbs ?? []).flatMap((crumb) =>
          crumb.label ? [{ label: crumb.label, url: crumb.url ?? '' }] : [],
        )}
        image={image?.url ? { url: image.url, alt: image.alt } : null}
      >
        {ctaRow}
      </PageHero>
    )
  }

  return (
    <section className="relative bg-secondary text-secondary-foreground py-16 md:py-24 overflow-hidden">
      {isHome && <HeroGrainGradient />}
      {isLocalLanding && (
        <svg
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 size-[28rem] md:size-[36rem] ${
            ringSide === 'left' ? '-left-32 md:-left-40' : '-right-32 md:-right-40'
          }`}
          style={{
            opacity: ringOpacity ?? 0.25,
            transform: ringFlipX ? 'translateY(-50%) scaleX(-1)' : 'translateY(-50%)',
          }}
          viewBox="0 0 400 400"
          fill="none"
        >
          <ellipse
            cx="200"
            cy="200"
            rx="180"
            ry="150"
            stroke="currentColor"
            strokeWidth="2"
            className="text-secondary-foreground"
          />
        </svg>
      )}
      <Container className="relative z-10">
        <div
          className={
            portrait
              ? 'grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16'
              : undefined
          }
        >
          <div>
            {isLocalLanding && cityName && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-foreground/10 px-4 py-1.5 text-label">
                <MapPin className="size-4 text-primary" />
                <span>{cityName}</span>
              </div>
            )}
            {title && (
              <h1 className="font-display text-display tracking-tight text-balance">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-6 text-body max-w-2xl text-secondary-foreground/80">{subtitle}</p>
            )}
            {isLocalLanding && omitPlaceholder(inlineStat) && (
              <div className="mt-4 flex items-center gap-2 text-body">
                <CheckCircle2 className="size-5 text-primary" />
                <span>{inlineStat}</span>
              </div>
            )}
            {ctaRow}
          </div>

          {/* The portrait comes AFTER the copy in source order so the h1 is
              the first thing on a phone, where the two columns collapse into
              one. It shipped with `order-first`, which did the exact opposite
              of what this comment claimed: measured on a 390px viewport the
              photo took the whole first screen and pushed the headline below
              the fold. No order override — DOM order is already right in both
              directions, since the grid puts the second child in the right-hand
              column from `md` up.

              Why a face at all: of fifteen competitor home pages analysed,
              almost none show one, including the ones written by people who
              actually program. A photo is the single thing an agency cannot
              put on its page, and this whole site argues that one person does
              the audit and the code. */}
          {portrait?.url && (
            <div>
              <Image
                src={portrait.url}
                alt={portrait.alt ?? title ?? ''}
                width={520}
                height={650}
                priority
                sizes="(min-width: 768px) 22rem, 60vw"
                className="w-48 md:w-[22rem] rounded-2xl border border-secondary-foreground/20 object-cover"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
