import { JsonLd } from '@/components/JsonLd'
import { CtaSection } from '@/components/mui/CtaSection'
import { AuthorsIndexView } from '@/components/pages/authors/AuthorsIndexView'
import { buildAuthorsTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { getCachedAuthorsIndex } from '@/lib/cache'
import { getCtaData } from '@/lib/cta-data'
import { toAuthorsIndexProps } from '@/lib/authors-data'
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
  const title = locale === 'es' ? 'Autores' : 'Authors'
  return {
    title: pageTitle(title),
    openGraph: buildOpenGraph({
      title,
      url: locale === 'en' ? '/en/authors' : '/authors',
      locale: locale as 'es' | 'en',
      slug: 'authors',
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/authors', '/en/authors'),
  }
}

export default async function AuthorsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const loc = locale as 'es' | 'en'

  // La lectura lanza dentro de la cache y aqui NO se captura: si falla una
  // regeneracion ISR, Next conserva el ultimo HTML bueno en lugar de fijar una
  // lista vacia con 200. El estado vacio solo aparece con la coleccion vacia.
  const docs = await getCachedAuthorsIndex(loc)
  const items = toAuthorsIndexProps(docs, loc)

  const trail = buildAuthorsTrail(loc)
  const ctaData = await getCtaData(loc)

  return (
    <>
      <AuthorsIndexView
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        title={locale === 'es' ? 'Autores' : 'Authors'}
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
