// Mixed file on purpose. `PlainLink` is for hrefs that are ALREADY
// locale-correct at the source (the Services column, whose URL segment is
// itself translated), and it is the fallback the `isPrefixableHref` guard
// picks for admin-authored values that must not be rewritten. `LocaleLink`
// is for internal unprefixed paths — the post and case-study feeds, and the
// closing CTA — which the middleware never rewrites on the way out.
import PlainLink from 'next/link'
import { getPayload } from 'payload'

import type { Footer as FooterType, Post, CaseStudy } from '@/payload-types'

import config from '@/payload.config'
import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'
import { Container } from '@/components/Container'
import { Separator } from '@/components/ui/separator'
import { SocialIcon, socialLabels } from '@/components/SocialIcon'
import { Button } from '@/components/ui/button'
import { blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
import { buildServiceHref, buildServicesIndexHref } from '@/lib/service-slugs'
import { SERVICE_SLUGS, getServicePage } from '@/lib/services-data'

/**
 * POLISH: footer links measured 20–21px tall on production, under WCAG 2.2
 * AA's 24x24 minimum target size (2.5.8) — and these are navigation links in
 * a list, not inline links inside a sentence, so the inline exception does
 * not apply. `inline-block` + vertical padding lifts them past 24px without
 * changing the visual rhythm. They also had no focus treatment at all; the
 * ring matches the one the button and input primitives already use.
 */
const footerLinkClass =
  'inline-block py-1 text-body opacity-90 transition-opacity duration-fast ease-out hover:opacity-100 focus-visible:outline-none focus-visible:rounded-sm focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus'

interface DynamicColumnResult {
  id: string | null | undefined
  title?: string | null
  items: { id: number; label: string; href: string }[]
}

const closingCopy = {
  es: {
    tagline: 'Ingeniero de software y consultor SEO técnico. Lima, Perú.',
    cta: 'Hablemos de tu proyecto',
    servicesTitle: 'Servicios',
    servicesIndex: 'Todos los servicios',
    groupLabel: (title: string) => `Enlaces de ${title}`,
    legalLabel: 'Enlaces legales',
    socialLabel: 'Redes',
  },
  en: {
    tagline: 'Software engineer and technical SEO consultant. Lima, Peru.',
    cta: "Let's talk about your project",
    servicesTitle: 'Services',
    servicesIndex: 'All services',
    groupLabel: (title: string) => `${title} links`,
    legalLabel: 'Legal links',
    socialLabel: 'Social',
  },
}

/**
 * The four service landings plus their index, built from SERVICE_SLUGS rather
 * than from the CMS's footer columns.
 *
 * None of the commercial pages were in the footer: no services index, no
 * service landing, no /websites. Ten of nineteen slots went to blog and case
 * study titles. The footer is the only nav block present on all 194 URLs, so
 * it was routing the visitor whose action defines the site's commercial
 * success (PRODUCT.md) everywhere except to what they would hire. Deriving
 * the column from the slug list means it cannot drift from the real routes.
 */
async function resolveServicesColumn(locale: 'en' | 'es'): Promise<DynamicColumnResult | null> {
  const pages = await Promise.all(SERVICE_SLUGS.map((slug) => getServicePage(locale, slug)))

  const items = pages.flatMap((page, i) =>
    page
      ? [
          {
            id: page.id,
            label: page.title,
            href: buildServiceHref(locale, SERVICE_SLUGS[i]),
          },
        ]
      : [],
  )

  if (items.length === 0) return null

  return {
    id: 'services',
    title: closingCopy[locale].servicesTitle,
    items: [
      ...items,
      { id: -1, label: closingCopy[locale].servicesIndex, href: buildServicesIndexHref(locale) },
    ],
  }
}

async function resolveDynamicColumn(
  entry: NonNullable<FooterType['dynamicColumns']>[number],
  locale: 'en' | 'es',
): Promise<DynamicColumnResult | null> {
  const payload = await getPayload({ config })
  const limit = entry.limit ?? 5

  if (entry.source === 'latestPosts') {
    const result = await payload.find({
      collection: 'posts',
      limit,
      locale,
      sort: '-publishedAt',
      where: { _status: { equals: 'published' } },
    })
    const docs = result.docs as Post[]
    if (docs.length === 0) return null
    return {
      id: entry.id,
      title: entry.title,
      items: docs.map((doc) => ({
        id: doc.id,
        label: doc.title,
        href: blogPostPath(resolvePrimaryCategorySlug(doc.categories), doc.slug ?? ''),
      })),
    }
  }

  if (entry.source === 'latestCaseStudies') {
    const result = await payload.find({
      collection: 'case-studies',
      limit,
      locale,
      sort: '-createdAt',
      where: { _status: { equals: 'published' } },
    })
    const docs = result.docs as CaseStudy[]
    if (docs.length === 0) return null
    return {
      id: entry.id,
      title: entry.title,
      items: docs.map((doc) => ({
        id: doc.id,
        label: doc.title,
        href: `/case-studies/${doc.slug}`,
      })),
    }
  }

  return null
}

export async function SiteFooter({ locale }: { locale: string }) {
  const payload = await getPayload({ config })
  const typedLocale = locale as 'en' | 'es'

  const footer = await payload.findGlobal({
    slug: 'footer',
    depth: 1,
    locale: typedLocale,
  })

  const [servicesColumn, dynamicColumns] = await Promise.all([
    resolveServicesColumn(typedLocale),
    Promise.all(
      (footer.dynamicColumns ?? []).map((entry) => resolveDynamicColumn(entry, typedLocale)),
    ).then((cols) => cols.filter((col): col is DynamicColumnResult => col !== null)),
  ])

  const t = closingCopy[typedLocale] ?? closingCopy.es

  return (
    // POLISH: mt-24 (96px) is not a step on the project's spacing scale
    // (4/8/16/24/32/48/64); mt-16 is the 64px top of that scale.
    <footer
      aria-label={typedLocale === 'en' ? 'Site footer' : 'Pie de página'}
      className="bg-secondary text-secondary-foreground mt-16"
    >
      {/* CRITIQUE P1 — the footer had no ending. Zero ember elements across a
          732px band, no name, no positioning, no next step: the visitor who
          had read the whole page (the highest-intent moment on the site) was
          handed a link list and "todos los derechos reservados". The header
          spends an ember button on someone who has read nothing; this spends
          one on someone who has read everything. That is the ≤10%-per-view
          ember allowance going where DESIGN.md intends it. */}
      <Container className="border-b border-border/20 py-12 md:py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-heading text-heading tracking-tight">Juan Carlos Angulo</p>
            <p className="mt-2 max-w-[45ch] text-body opacity-80">{t.tagline}</p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            {/* Was `typedLocale === 'en' ? '/en/contact' : '/contact'`. The
                locale-aware Link derives the prefix, so the hand-picked one is
                gone — same output, one less place to keep in sync. */}
            <LocaleLink href="/contact">{t.cta}</LocaleLink>
          </Button>
        </div>
      </Container>

      <Container className="py-12 md:py-16">
        {/* The Services column makes five groups, so the track count moves off
            4 — otherwise the fifth wrapped alone onto a second row. */}
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8">
          {servicesColumn && (
            <nav aria-label={t.groupLabel(servicesColumn.title ?? t.servicesTitle)}>
              <h2 className="font-heading text-label mb-3 uppercase tracking-wide text-secondary-foreground/70">
                {servicesColumn.title}
              </h2>
              {/* Deliberately the PLAIN link: `buildServiceHref` /
                  `buildServicesIndexHref` are already locale-correct at the
                  source (`/servicios/<slug>` for es, `/en/services/<slug>` for
                  en). Services are the one section whose URL SEGMENT is
                  translated, not just prefixed, so a generic locale prefix
                  cannot produce these URLs. Verified: the guard returns false
                  for the en hrefs (they open with a locale segment); the es
                  ones would be a no-op anyway, since es is the default locale
                  and takes no prefix. */}
              <ul className="space-y-2">
                {servicesColumn.items.map((item) => (
                  <li key={item.id}>
                    <PlainLink href={item.href} className={footerLinkClass}>
                      {item.label}
                    </PlainLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* CRITIQUE — each group is now a labelled nav landmark. There were
              zero <nav> elements inside the footer, so a screen-reader user
              met 19 tab stops at the end of every page with nothing to skip
              past and no name for any of the four groups. */}
          {footer.columns?.map((column, i) => (
            <nav key={column.id ?? i} aria-label={t.groupLabel(column.title ?? '')}>
              {column.title && (
                <h2 className="font-heading text-label mb-3 uppercase tracking-wide text-secondary-foreground/70">
                  {column.title}
                </h2>
              )}
              <ul className="space-y-2">
                {column.links?.map((item, j) => {
                  // Admin-authored, so it gets the same guard `CMSLink` uses:
                  // an absolute URL, a bare `#fragment`, or a path an editor
                  // already prefixed by hand must never be given a prefix.
                  const href = item.link.url ?? '#'
                  const ItemLink = isPrefixableHref(href) ? LocaleLink : PlainLink
                  return (
                    <li key={item.id ?? j}>
                      <ItemLink href={href} className={footerLinkClass}>
                        {item.link.label}
                      </ItemLink>
                    </li>
                  )
                })}
              </ul>
            </nav>
          ))}

          {dynamicColumns.map((column) => (
            <nav key={column.id} aria-label={t.groupLabel(column.title ?? '')}>
              {column.title && (
                <h2 className="font-heading text-label mb-3 uppercase tracking-wide text-secondary-foreground/70">
                  {column.title}
                </h2>
              )}
              <ul className="space-y-2">
                {column.items.map((item) => (
                  <li key={item.id}>
                    {/* CRITIQUE P2 — case-study titles run to ~70 characters
                        and wrapped to three lines inside a 252px column, so
                        the feed columns were dense paragraphs while the static
                        ones sat half empty. Clamped to two lines; the full
                        title stays available as the link's title attribute. */}
                    {/* These are the ORIGINAL defect: `blogPostPath(...)` and
                        `/case-studies/<slug>` are unprefixed, which on an /en
                        page IS the Spanish URL. Both sections live in a single
                        route folder under `[locale]` (unlike services, whose
                        segment is translated), so the locale-aware Link's
                        generic prefix produces the right URL for both. */}
                    <LocaleLink
                      href={item.href}
                      title={item.label}
                      className={`${footerLinkClass} line-clamp-2`}
                    >
                      {item.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* CRITIQUE P3 — the separator measured ~1.66:1 against the navy, under
            the 3:1 a meaningful boundary needs, and it is the footer's only
            structural division. The border token alone carries enough weight;
            stacking a second opacity on top of it was what buried it. */}
        <Separator className="mt-12" />
        <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          {/* POLISH: the icons themselves were 20x20 with no padding, so the
              whole tap target was 20px — the clearest 2.5.8 failure in the
              footer, and an isolated control with no inline exception. The
              icon keeps its 20px optical size inside a 40px target. */}
          <div className="flex gap-1" role="group" aria-label={t.socialLabel}>
            {footer.socialLinks?.map((social, i) => (
              <a
                key={social.id ?? i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={socialLabels[social.platform] ?? social.platform}
                className="inline-flex size-10 items-center justify-center rounded-md opacity-80 transition-opacity duration-fast ease-out hover:opacity-100 focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
              >
                <SocialIcon platform={social.platform} className="size-5" />
              </a>
            ))}
          </div>

          {/* CRITIQUE P3 (my own bug, from the earlier polish pass): the 0.8
              lived on this wrapper while `hover:opacity-100` sat on the child,
              whose own opacity already computed to 1 — so the hover could
              never fire and these three links were the only ones in the footer
              with no pointer feedback. The dimming moves onto the links. */}
          <nav
            aria-label={t.legalLabel}
            className="flex flex-col gap-1 text-label sm:flex-row sm:gap-4"
          >
            {footer.legalLinks?.map((legal, i) => {
              // Admin-authored, same guard as the column links above.
              const LegalLink = isPrefixableHref(legal.href) ? LocaleLink : PlainLink
              return (
                <LegalLink
                  key={legal.id ?? i}
                  href={legal.href}
                  className="inline-block py-1 opacity-80 transition-opacity duration-fast ease-out hover:opacity-100 focus-visible:outline-none focus-visible:rounded-sm focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                >
                  {legal.label}
                </LegalLink>
              )
            })}
          </nav>
        </div>

        {footer.copyrightText && (
          <p className="mt-6 text-label opacity-70">{footer.copyrightText}</p>
        )}
      </Container>
    </footer>
  )
}
