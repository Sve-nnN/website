// Deliberately the PLAIN link, not the locale-aware `Link` from
// `@/i18n/navigation`: the only `<Link>` on this page renders a breadcrumb
// url, which arrives already locale-prefixed from `src/lib/breadcrumbs.ts`.
// The cards themselves link through `WebsiteCard`, which IS locale-aware.
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { WebsiteCard } from '@/components/WebsiteCard'
import { JsonLd } from '@/components/JsonLd'
import { buildWebsitesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

async function getWebsites(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'websites',
    locale: locale as 'es' | 'en',
    limit: 50,
  })
  return docs
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = locale === 'es' ? 'Sitios web' : 'Websites'
  return {
    title,
    openGraph: buildOpenGraph({
      title,
      url: locale === 'en' ? '/en/websites' : '/websites',
      locale: locale as 'es' | 'en',
      slug: 'websites',
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/websites', '/en/websites'),
  }
}

export default async function WebsitesListPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const websites = await getWebsites(locale)
  const trail = buildWebsitesTrail(locale as 'es' | 'en')

  return (
    <main>
      <Container className="py-16">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {trail.map((crumb, i) => {
              const isLast = i === trail.length - 1
              return (
                <li key={crumb.url} className="flex items-center gap-x-2">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {isLast ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.url}
                      className="hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
        <h1 className="font-display text-display">
          {locale === 'es' ? 'Sitios web' : 'Websites'}
        </h1>

        {websites.length === 0 ? (
          <div className="mt-12 text-center py-16">
            <p className="font-heading text-heading">
              {locale === 'es' ? 'Próximamente' : 'Coming soon'}
            </p>
            <p className="mt-2 text-body text-muted-foreground">
              {locale === 'es'
                ? 'Estamos preparando nuevos casos de sitios web. Vuelve pronto.'
                : "We're preparing new website case studies. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((w) => (
              <WebsiteCard key={w.id} website={w} />
            ))}
          </div>
        )}
      </Container>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
