import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { WebsiteDetailView } from '@/components/pages/websites/WebsiteDetailView'
import { buildWebsitesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { getCachedWebsiteBySlug } from '@/lib/cache'
import { buildWebsiteJsonLd, toWebsiteDetailProps } from '@/lib/websites-data'
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

export function generateStaticParams(): Array<{ locale: string; slug: string }> {
  return []
}

// Lectura por la capa cacheada (overrideAccess false y select dentro). Si la
// lectura falla lanza: unstable_cache no guarda la excepcion y la ruta no
// responde un 404 falso por un fallo transitorio.
function getWebsite(locale: string, slug: string) {
  return getCachedWebsiteBySlug(slug, locale as 'es' | 'en')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getWebsite(locale, slug)

  if (!doc) {
    return {}
  }

  const meta = doc.meta
  const title = meta?.title ?? doc.title
  const description = meta?.description ?? doc.role ?? doc.industry ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en/websites/${slug}` : `/websites/${slug}`,
      locale: locale as 'es' | 'en',
      slug: doc.slug ?? slug,
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', `/websites/${slug}`, `/en/websites/${slug}`),
  }
}

export default async function WebsitePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const loc = locale as 'es' | 'en'
  const doc = await getWebsite(locale, slug)

  if (!doc) {
    notFound()
  }

  const site = toWebsiteDetailProps(doc, loc)
  if (!site) {
    notFound()
  }

  const trail = buildWebsitesTrail(loc, {
    slug: doc.slug ?? slug,
    title: doc.title,
  })

  return (
    <>
      <WebsiteDetailView crumbs={trail.map((c) => ({ label: c.label, href: c.url }))} site={site} />
      <JsonLd data={buildWebsiteJsonLd(doc)} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  )
}
