import type { ReactNode } from 'react'
import Image from 'next/image'
import PlainLink from 'next/link'

import type { BreadcrumbItem } from '@/lib/breadcrumbs'

import { Container } from '@/components/Container'
import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'

/**
 * The one hero band every non-home page template renders.
 *
 * WHY IT EXISTS — before this, eleven routes hand-rolled their own hero and no
 * two agreed. The blog index came from the CMS Hero block (navy band, ember
 * `border-b-4`, Khand title); case studies, websites, authors, search and the
 * category pages sat on the light surface with an Array `text-display` title
 * and no band at all; the three detail pages each had a third treatment (post:
 * a 21/9 image strip above the copy; case study: image-as-background with a
 * scrim and `border-t-8`; website: a bare navy strip with no border and no
 * image). Three of them also copy-pasted their own breadcrumb `<ol>`, each
 * with slightly different classes and none with focus styles.
 *
 * So the hero is now a template decision, not a page decision:
 *
 * - `index` — every listing/section page. Khand `text-heading` title, per
 *   DESIGN.md's "Array Is For Titles" rule (Array is reserved for the home
 *   hero and for the title of a piece that presents itself); ember
 *   `border-b-4` underlining the section, the shorter `py-10 md:py-14` scale.
 * - `detail` — post, case study and website pages. Array `text-display`
 *   title, the same ember `border-b-4` closing the band, `py-12 md:py-16`,
 *   and the optional hero image as a scrimmed background rather than a
 *   stacked strip (the strip pushed the h1 to the bottom edge of the fold).
 *
 * The ember rule sits at the BOTTOM on both templates. The case study used to
 * carry it on top (`border-t-8`), which measured fine in isolation and read
 * wrong in place: the header is sticky and navy, so a top border landed
 * flush against it and looked like an underline on the navigation instead of
 * the hero's own edge. At the bottom it does the job it was drawn for —
 * separating the navy band from the paper surface below.
 *
 * The `local-landing` and `home` variants keep their own treatments in
 * `src/blocks/Hero/Component.tsx` — the shader and the decorative ring are
 * signatures of those two surfaces, not shared template furniture.
 */

const variantStyles = {
  index: {
    section: 'border-b-4 border-primary',
    padding: 'py-10 md:py-14',
    title: 'font-heading text-heading',
  },
  detail: {
    section: 'border-b-4 border-primary',
    padding: 'py-12 md:py-16',
    title: 'font-display text-display',
  },
} as const

export type PageHeroVariant = keyof typeof variantStyles

type PageHeroProps = {
  variant: PageHeroVariant
  title: string
  /** Rendered above the title. Urls may arrive already locale-prefixed. */
  trail?: BreadcrumbItem[]
  subtitle?: string | null
  /** `detail` only: the ember proof line under the copy (case study metric). */
  metric?: string | null
  /** Plain strings joined with interpuncts, below the copy. */
  meta?: (string | null | undefined)[]
  /** Free-form metadata row (byline, dates) rendered after `meta`. */
  metaSlot?: ReactNode
  /** `detail` only: background image behind a scrim. */
  image?: { url: string; alt?: string | null } | null
  /** Actions, chips or anything else that closes the hero. */
  children?: ReactNode
}

/**
 * Trail rendered on the navy band. Deliberately not the shared `Breadcrumbs`
 * component: that one is tuned for the light surface (`text-muted-foreground`
 * / `text-foreground`), which is unreadable here.
 *
 * Link component is picked per crumb by `isPrefixableHref`, the same guard
 * `CMSLink` and `SiteFooter` use, because urls reach this component from two
 * sources: `src/lib/breadcrumbs.ts`, which already prefixes the locale, and
 * the admin-authored `Hero.breadcrumbs` array, whose `url` is NOT localized
 * and so arrives bare. Prefixing an already-prefixed url stacks a second
 * locale segment; not prefixing a bare one leaks `/blog` onto an `/en` page.
 */
function HeroBreadcrumbs({ trail }: { trail: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-secondary-foreground/70">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1
          const CrumbLink = crumb.url && isPrefixableHref(crumb.url) ? LocaleLink : PlainLink
          return (
            <li key={crumb.url || `${crumb.label}-${i}`} className="flex items-center gap-x-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {isLast || !crumb.url ? (
                <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
              ) : (
                <CrumbLink
                  href={crumb.url}
                  className="rounded-sm underline-offset-2 transition-colors duration-fast ease-out hover:text-secondary-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                >
                  {crumb.label}
                </CrumbLink>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function PageHero({
  variant,
  title,
  trail,
  subtitle,
  metric,
  meta,
  metaSlot,
  image,
  children,
}: PageHeroProps) {
  const styles = variantStyles[variant]
  const metaValues = (meta ?? []).filter((v): v is string => Boolean(v))
  const backgroundImage = variant === 'detail' ? image : null

  return (
    <section
      className={`relative overflow-hidden bg-secondary text-secondary-foreground ${styles.section}`}
    >
      {backgroundImage?.url && (
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={backgroundImage.url}
            alt=""
            fill
            className="object-cover opacity-45"
            priority
            sizes="100vw"
          />
          {/* Scrim: the hero images are wide-gamut abstract gradients, so a
              flat tint alone left light passages under the copy. The vertical
              ramp keeps the lower half — where the title, subtitle and meta
              sit — reliably dark. */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/75 to-secondary/40" />
        </div>
      )}
      <Container className={`relative z-10 ${styles.padding}`}>
        {trail && trail.length > 0 && <HeroBreadcrumbs trail={trail} />}
        <h1 className={`${styles.title} tracking-tight text-balance`}>{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-[65ch] text-body text-secondary-foreground/85">{subtitle}</p>
        )}
        {/* The metric is the title's proof, so it steps one level below it and
            keeps the ember, which reads at 4.9:1 on navy. Two `text-display`
            elements in one band compete and neither wins. */}
        {metric && (
          <p className="mt-6 font-heading text-heading text-primary tracking-tight tabular-nums">
            {metric}
          </p>
        )}
        {metaValues.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-secondary-foreground/80">
            {/* Interpuncts are rendered from the array so no separator is
                orphaned when a field is missing — the client name is absent on
                every anonymised case study. */}
            {metaValues.map((value, i) => (
              <span key={value} className="flex items-center gap-x-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                {value}
              </span>
            ))}
          </div>
        )}
        {metaSlot && (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">{metaSlot}</div>
        )}
        {children}
      </Container>
    </section>
  )
}
