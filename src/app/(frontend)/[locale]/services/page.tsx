import { notFound } from 'next/navigation'

import {
  getServicesIndexPage,
  getServicesIndexMetadata,
  getServicePage,
  SERVICE_SLUGS,
} from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildServicesIndexJsonLd } from '@/lib/service-schema'
import { JsonLd } from '@/components/JsonLd'

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

async function getPage(locale: string) {
  return getServicesIndexPage(locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return getServicesIndexMetadata(locale as 'es' | 'en')
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const doc = await getPage(locale)

  if (!doc) {
    notFound()
  }

  const trail = buildTrail(locale as 'es' | 'en')

  // SEO-09: the index lists several offerings, so it is not itself a `Service`.
  // Titles come from the real service pages — a landing that does not resolve
  // is dropped rather than listed from a hardcoded label.
  const servicePages = await Promise.all(
    SERVICE_SLUGS.map((slug) => getServicePage(locale as 'es' | 'en', slug)),
  )
  const services = servicePages.flatMap((page, i) =>
    page ? [{ slug: SERVICE_SLUGS[i], title: page.title }] : [],
  )

  return (
    <main>
      {services.length > 0 && (
        <JsonLd data={buildServicesIndexJsonLd(locale as 'es' | 'en', services)} />
      )}
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{ hero: { breadcrumbs: trail } }}
      />
    </main>
  )
}
