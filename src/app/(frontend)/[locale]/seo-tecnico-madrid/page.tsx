import { LocalLandingPage } from '@/components/pages/LocalLandingPage'
import { getLocalLandingPage } from '@/lib/local-landing-data'
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

// Misma lectura que el cuerpo de la pagina (overrideAccess: false): la metadata
// no puede salir de un documento que el cuerpo no serviria a un anonimo.
async function getPage(locale: string) {
  return getLocalLandingPage(locale as 'es' | 'en', 'seo-tecnico-madrid')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)
  const meta = doc?.meta

  const title =
    meta?.title ?? doc?.title ?? (locale === 'es' ? 'SEO Técnico en Madrid / España' : 'Technical SEO in Madrid / Spain')
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/seo-tecnico-madrid' : '/seo-tecnico-madrid'

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'seo-tecnico-madrid',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(
      locale as 'es' | 'en',
      '/seo-tecnico-madrid',
      '/en/seo-tecnico-madrid',
    ),
  }
}

export default async function SeoTecnicoMadridPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <LocalLandingPage locale={locale as 'es' | 'en'} slug="seo-tecnico-madrid" />
}
