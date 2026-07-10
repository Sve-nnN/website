import Link from 'next/link'
import { getPayload } from 'payload'
import { Link2, Code2, AtSign, Globe } from 'lucide-react'

import type { Footer as FooterType, Post, CaseStudy } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { Separator } from '@/components/ui/separator'

// lucide-react ships no brand icons (Linkedin/Github/X removed) — same
// generic substitutes used in ContactFormBlock's icon map (05-04).
const socialIconMap = {
  linkedin: Link2,
  github: Code2,
  x: AtSign,
  website: Globe,
}

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
      items: docs.map((doc) => ({ id: doc.id, label: doc.title, href: `/blog/${doc.slug}` })),
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
    <footer className="bg-secondary text-secondary-foreground mt-24">
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
                    <Link href={item.link.url ?? '#'} className="text-body opacity-90 hover:opacity-100">
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
                    <Link href={item.href} className="text-body opacity-90 hover:opacity-100">
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
          <div className="flex gap-4">
            {footer.socialLinks?.map((social, i) => {
              const Icon = socialIconMap[social.platform] ?? Globe
              return (
                <a
                  key={social.id ?? i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="opacity-80 hover:opacity-100"
                >
                  <Icon className="size-5" />
                </a>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 text-label opacity-80 sm:flex-row sm:gap-4">
            {footer.legalLinks?.map((legal, i) => (
              <Link key={legal.id ?? i} href={legal.href}>
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
