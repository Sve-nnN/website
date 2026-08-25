import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/sitemap-data'
import { buildLocalService } from '@/lib/site-schema'
import { buildLocalLandingHref, findLocalLanding } from '@/lib/local-landing-slugs'

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
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'seo-tecnico-lima' } },
    locale: locale as 'es' | 'en',
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? (locale === 'es' ? 'SEO Técnico en Lima' : 'Technical SEO in Lima')
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/seo-tecnico-lima' : '/seo-tecnico-lima'

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'seo-tecnico-lima',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/seo-tecnico-lima', '/en/seo-tecnico-lima'),
  }
}

export default async function SeoTecnicoLimaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const doc = await getPage(locale)

  if (!doc) {
    notFound()
  }

  // SEO-42: esta landing no emitia ningun dato estructurado, ni siquiera
  // BreadcrumbList, cuando el resto del sitio si lo tiene. Es justo el tipo de
  // pagina que mas gana con `Service` + `areaServed`: lo que se pregunta en esa
  // busqueda es quien presta este servicio en esta ciudad.
  const landing = findLocalLanding('seo-tecnico-lima')!
  const serviceData = buildLocalService({
    locale: locale as 'es' | 'en',
    city: landing.city,
    country: landing.country,
    name: doc.meta?.title ?? doc.title,
    description: doc.meta?.description ?? undefined,
    url: `${SITE_URL}${buildLocalLandingHref(locale as 'es' | 'en', landing.slug)}`,
  })

  return (
    <main>
      <JsonLd data={serviceData} />
      <RenderBlocks blocks={doc.content?.layout ?? []} />
    </main>
  )
}
