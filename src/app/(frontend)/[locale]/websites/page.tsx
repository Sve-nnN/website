import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
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
      <PageHero
        variant="index"
        trail={trail}
        title={locale === 'es' ? 'Sitios web' : 'Websites'}
      />

      <Container className="py-12 md:py-16">
        {websites.length === 0 ? (
          <div className="text-center py-16">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
