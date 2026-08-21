import { notFound } from 'next/navigation'

import { getServicePage, getServiceMetadata } from '@/lib/services-data'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { buildServiceJsonLd } from '@/lib/service-schema'
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

export function generateStaticParams(): Array<{ locale: string; slug: string }> {
  return []
}

async function getPage(locale: string, slug: string) {
  return getServicePage(locale as 'es' | 'en', slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  return getServiceMetadata(locale as 'es' | 'en', slug)
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPage(locale, slug)

  if (!doc) {
    notFound()
  }

  const trail = buildTrail(locale as 'es' | 'en', { slug: doc.slug ?? slug, title: doc.title })

  return (
    <main>
      <JsonLd
        data={buildServiceJsonLd(
          locale as 'es' | 'en',
          doc.slug ?? slug,
          doc.title,
          doc.meta?.description,
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{ hero: { breadcrumbs: trail } }}
      />
    </main>
  )
}
