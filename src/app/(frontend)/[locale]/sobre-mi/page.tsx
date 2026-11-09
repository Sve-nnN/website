import { notFound } from 'next/navigation'

import { AboutView } from '@/components/pages/AboutView'
import { getAboutData } from '@/lib/about-data'
import { buildAlternates } from '@/lib/canonical'
import { buildOpenGraph } from '@/lib/og-image'
import { pageTitle } from '@/lib/page-title'

// Mismo patrón ISR de Home, Stack y Servicios (SEO-06): generateStaticParams
// vacío, dynamicParams (default true) sirve cada locale en la primera visita.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

// Sobre mí vive en el global `about-page` y NO en la colección `pages`: un doc
// de pages entraría al sitemap.xml de producción como una URL que devuelve 404
// hasta el corte (Pitfall 1). Esta ruta no se agrega al sitemap ni emite
// JSON-LD nuevo. Es la misma ruta en ambos idiomas (/sobre-mi y /en/sobre-mi).
//
// Sin `robots` propio: en el preview el layout ya pone noindex, y tras el corte
// la página es indexable.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const typedLocale: 'es' | 'en' = locale === 'en' ? 'en' : 'es'
  const data = await getAboutData(typedLocale)

  const title = data?.name ?? 'Juan Carlos Angulo'
  const description = data?.hero.lead ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: typedLocale === 'en' ? '/en/sobre-mi' : '/sobre-mi',
      locale: typedLocale,
      slug: 'sobre-mi',
    }),
    alternates: buildAlternates(typedLocale, '/sobre-mi', '/en/sobre-mi'),
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const typedLocale: 'es' | 'en' = locale === 'en' ? 'en' : 'es'
  const data = await getAboutData(typedLocale)

  // Sin global ni autor no hay nada que mostrar. Cualquier otro fallo de la
  // Local API ya lo absorbió getAboutData: la página sale sin esa sección.
  if (!data) notFound()

  return <AboutView data={data} locale={typedLocale} />
}
