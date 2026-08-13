import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'

import { getFallbackHeroImage } from '@/lib/heroImageFallback'

type Media = { url?: string | null; alt?: string | null } | number | null | undefined

type BaseProps = {
  locale: 'es' | 'en'
  title: string
  slug: string
  heroImage?: Media
  className?: string
}

type FeaturedPostProps = BaseProps & {
  kind: 'post'
  excerpt?: string | null
  publishedAt?: string | null
  // Posts live at /blog/<category>/<slug>, so the caller resolves the path
  // through `blog-paths.ts` and passes it in — same contract PostCard uses.
  href: string
}

type FeaturedCaseStudyProps = BaseProps & {
  kind: 'case-study'
  heroSubtitle?: string | null
  heroMetric?: string | null
  sector?: string | null
}

type FeaturedEntryProps = FeaturedPostProps | FeaturedCaseStudyProps

const copy = {
  es: {
    latestPost: 'Lo más reciente',
    latestCase: 'Último caso',
    readPost: 'Leer el artículo',
    readCase: 'Ver el caso completo',
  },
  en: {
    latestPost: 'Latest',
    latestCase: 'Latest case',
    readPost: 'Read the article',
    readCase: 'See the full case',
  },
}

function formatDate(date: string, locale: 'es' | 'en') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}

/**
 * Single lead entry above a listing grid: the newest post on /blog, the newest
 * case study on /case-studies.
 *
 * It deliberately does NOT reuse PostCard/CaseStudyCard at a larger size. A
 * scaled-up card still reads as "one of the grid, but bigger", and the point of
 * a lead is that it is a different kind of thing. So it sits on the navy
 * surface the rest of the listing never uses, runs its image full-bleed against
 * the panel edge, and gives the entry room for its subtitle or metric — none of
 * which the grid cards do.
 *
 * The "Latest" marker rides on the image rather than sitting above the heading:
 * a kicker over a title is a habit worth refusing, and here the badge has a
 * surface of its own to live on.
 */
export function FeaturedEntry(props: FeaturedEntryProps) {
  const { locale, title, slug, heroImage, className } = props
  const t = copy[locale] ?? copy.es

  const image = typeof heroImage === 'object' && heroImage !== null ? heroImage : null
  const imageUrl = image?.url ?? getFallbackHeroImage(slug)

  const isCase = props.kind === 'case-study'
  const href = isCase ? `/case-studies/${slug}` : props.href
  const badge = isCase ? t.latestCase : t.latestPost
  const cta = isCase ? t.readCase : t.readPost
  const description = isCase ? props.heroSubtitle : props.excerpt

  return (
    <Link
      href={href}
      className={`group block rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus ${className ?? ''}`}
    >
      <article className="overflow-hidden rounded-2xl bg-secondary text-secondary-foreground shadow-sm transition-shadow duration-base ease-standard group-hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="relative aspect-[16/10] md:col-span-5 md:aspect-auto md:min-h-[20rem]">
            <Image
              src={imageUrl}
              alt={image?.alt ?? ''}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 42vw, 100vw"
              priority
            />
            <span className="absolute left-4 top-4 inline-flex items-center rounded-sm bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
              {badge}
            </span>
          </div>

          <div className="flex flex-col justify-center gap-4 p-6 md:col-span-7 md:p-10">
            <h2 className="font-heading text-heading tracking-tight text-balance">{title}</h2>

            {/* `text-secondary-foreground/80` would be the natural way to dim
                this, but Tailwind's slash modifier generates nothing against a
                custom property stored as a plain hex (`--secondary-foreground:
                #FAFAF7`) — verified by compiling the utility in isolation, it
                emits no rule at all. `opacity` on the element is the version
                that actually renders. Same reason the header's `bg-secondary/95`
                had to be reverted; see SiteHeaderChrome. */}
            {description && (
              <p className="max-w-[60ch] text-body opacity-80">{description}</p>
            )}

            {isCase && props.heroMetric && (
              <p className="font-heading text-heading font-semibold tracking-tight tabular-nums text-primary">
                {props.heroMetric}
              </p>
            )}

            {/* Metadata sits under the title, not above it, so the entry leads
                with what it is about rather than with a label. */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label opacity-70">
              {isCase && props.sector && <span>{props.sector}</span>}
              {!isCase && props.publishedAt && (
                <time dateTime={props.publishedAt}>{formatDate(props.publishedAt, locale)}</time>
              )}
            </div>

            <span className="inline-flex items-center gap-1 text-label text-primary">
              {cta}
              <ArrowRight
                className="size-4 transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
