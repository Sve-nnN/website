import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import { WebsiteCard } from '@/components/WebsiteCard'
import { JsonLd } from '@/components/JsonLd'
import { buildWebsitesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'

// SEO-06: estas rutas servian `cache-control: no-store` y re-ejecutaban el SSR
// completo en cada request. Venia de `force-dynamic`, que estaba por una razon
// real: el build de Dokploy corre en un contenedor sin red hacia
// shared-postgres, asi que cualquier prerender en `next build` falla.
//
// ISR resuelve las dos cosas: `generateStaticParams` devuelve una lista VACIA,
// o sea que el build no renderiza ni una ruta y nunca toca la base;
// `dynamicParams` (true por defecto) deja que cada URL se renderice en la
// primera visita y quede en la cache incremental, y de ahi salen las
// siguientes. Verificado en el prerender-manifest: cero rutas prerenderizadas.
//
// La frescura no depende del TTL: los hooks de contenido llaman
// `revalidatePath` (src/lib/cache-tags.ts), asi que publicar en el admin
// actualiza la pagina sin esperar los 60 s. El TTL es la red de seguridad.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

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
