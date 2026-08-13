import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight, Search, TrendingUp, Code, Sparkles, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import type { ServicesShowcaseBlock as ServicesShowcaseBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_SLUGS, getServicePage } from '@/lib/services-data'
import { buildServiceHref } from '@/lib/service-slugs'

// Hardcoded slug -> icon map, colocated here (not a new Payload field, per
// 24-UI-SPEC.md's icon decision) — `SERVICE_SLUGS` is a fixed, compile-time-
// known allowlist, not user input, so a static map is safe and correct.
// `Code` is the fallback for any unmapped slug, matching AboutSectionComponent.
const iconBySlug: Record<string, LucideIcon> = {
  'seo-technical-audit': Search,
  'seo-consulting': TrendingUp,
  'fullstack-development': Code,
  'ai-seo-geo': Sparkles,
}

// Same dual-segment locale convention as src/lib/canonical.ts/breadcrumbs.ts,
// reimplemented locally (2 lines) rather than imported — those modules pull
// in DB-touching dependencies not needed for a plain href string.
// buildServiceHref now lives in @/lib/service-slugs so the footer's Services
// column builds the same URL from the same definition.

export async function ServicesShowcaseComponent(props: ServicesShowcaseBlockProps) {
  const { title } = props
  const locale = (await getLocale()) as 'es' | 'en'

  const resolvedPages = await Promise.all(
    SERVICE_SLUGS.map((slug) => getServicePage(locale, slug)),
  )
  const pages = resolvedPages.filter((p): p is NonNullable<typeof p> => Boolean(p))

  if (pages.length === 0) return null

  const t = await getTranslations('servicesShowcase')

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {pages.map((page) => {
          const Icon = iconBySlug[page.slug ?? ''] ?? Code
          return (
            <Link
              key={page.id}
              href={buildServiceHref(locale, page.slug ?? '')}
              className="group block h-full"
            >
              {/* POLISH: h-full on the link + card so cards in the same grid
                  row share a bottom edge regardless of title/description
                  length, instead of each sizing to its own content. */}
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-heading mt-4">{page.title}</h3>
                  {page.meta?.description && (
                    <p className="mt-2 text-body text-muted-foreground line-clamp-2">
                      {page.meta.description}
                    </p>
                  )}
                  {/* POLISH: AA contrast — see AboutSection eyebrow note.
                      #F7581E on the light card is 3.15:1; #D03D07 is 4.61:1. */}
                  <div className="mt-4 flex items-center gap-1 text-label text-primary-text">
                    <span>{t('cta')}</span>
                    <ArrowRight className="size-4 transition-transform duration-fast ease-standard group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
