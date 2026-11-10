import { JsonLd } from '@/components/JsonLd'
import { CtaSection } from '@/components/mui/CtaSection'
import { WebsitesIndexView } from '@/components/pages/websites/WebsitesIndexView'
import { buildWebsitesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { getCachedWebsitesIndex } from '@/lib/cache'
import { getCtaData } from '@/lib/cta-data'
import { toWebsiteIndexProps } from '@/lib/websites-data'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'

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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = locale === 'es' ? 'Sitios web' : 'Websites'
  // El hub no es un doc de `pages`, asi que no tiene de donde sacar una
  // description del CMS: se quedaba sin `<meta name="description">` del todo.
  // Detectado en la corrida de unlighthouse del 2026-08-22.
  const description =
    locale === 'es'
      ? 'Sitios que construí de punta a punta: qué resolvía cada uno, con qué stack se hizo y cómo quedó el rendimiento y el SEO técnico.'
      : 'Sites I built end to end: what each one had to solve, the stack behind it, and where its performance and technical SEO landed.'
  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
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
  const loc = locale as 'es' | 'en'

  // La lectura lanza dentro de la cache y aqui NO se captura: si falla una
  // regeneracion ISR, Next conserva el ultimo HTML bueno en lugar de fijar una
  // lista vacia con 200. El estado vacio solo aparece con la coleccion vacia.
  const docs = await getCachedWebsitesIndex(loc)
  const items = toWebsiteIndexProps(docs, loc)

  const trail = buildWebsitesTrail(loc)
  const ctaData = await getCtaData(loc)

  return (
    <>
      <WebsitesIndexView
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        title={locale === 'es' ? 'Sitios web' : 'Websites'}
        items={items}
      />
      {ctaData && (
        <div lang={ctaData.isFallback && locale === 'en' ? 'es' : undefined}>
          <CtaSection
            title={ctaData.title}
            lead={ctaData.lead}
            email={ctaData.email}
            name={ctaData.name}
            avatarUrl={ctaData.avatarUrl}
          />
        </div>
      )}
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  )
}
