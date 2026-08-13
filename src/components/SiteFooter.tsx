import Link from 'next/link'
import { getPayload } from 'payload'

import type { Footer as FooterType, Post, CaseStudy } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { Separator } from '@/components/ui/separator'
import { SocialIcon, socialLabels } from '@/components/SocialIcon'
import { blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'

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

  const dynamicColumns = (
    await Promise.all(
      (footer.dynamicColumns ?? []).map((entry) => resolveDynamicColumn(entry, typedLocale)),
    )
  ).filter((col): col is DynamicColumnResult => col !== null)

  return (
    // POLISH: mt-24 (96px) is not a step on the project's spacing scale
    // (4/8/16/24/32/48/64); mt-16 is the 64px top of that scale.
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 md:grid-cols-4 gap-x-8">
          {footer.columns?.map((column, i) => (
            <div key={column.id ?? i}>
              {column.title && (
                <h3 className="font-heading text-label mb-3 uppercase tracking-wide text-secondary-foreground/70">
                  {column.title}
                </h3>
              )}
              <ul className="space-y-2">
                {column.links?.map((item, j) => (
                  <li key={item.id ?? j}>
                    <Link href={item.link.url ?? '#'} className={footerLinkClass}>
                      {item.link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {dynamicColumns.map((column) => (
            <div key={column.id}>
              {column.title && (
                <h3 className="font-heading text-label mb-3 uppercase tracking-wide text-secondary-foreground/70">
                  {column.title}
                </h3>
              )}
              <ul className="space-y-2">
                {column.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className={footerLinkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="opacity-30 mt-12" />
        <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          {/* POLISH: the icons themselves were 20x20 with no padding, so the
              whole tap target was 20px — the clearest 2.5.8 failure in the
              footer, and an isolated control with no inline exception. The
              icon keeps its 20px optical size inside a 40px target. */}
          <div className="flex gap-1">
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

          <div className="flex flex-col gap-1 text-label opacity-80 sm:flex-row sm:gap-4">
            {footer.legalLinks?.map((legal, i) => (
              <Link
                key={legal.id ?? i}
                href={legal.href}
                className="inline-block py-1 transition-opacity duration-fast ease-out hover:opacity-100 focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
              >
                {legal.label}
              </Link>
            ))}
          </div>
        </div>

        {footer.copyrightText && (
          <p className="mt-6 text-label opacity-70">{footer.copyrightText}</p>
        )}
      </Container>
    </footer>
  )
}
