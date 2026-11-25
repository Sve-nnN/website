import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { AboutView } from '@/components/pages/AboutView'
import { getAboutData } from '@/lib/about-data'
import { buildAlternates } from '@/lib/canonical'
import { getCtaData } from '@/lib/cta-data'
import { buildOpenGraph } from '@/lib/og-image'
import { pageTitle } from '@/lib/page-title'
import { buildProfilePageJsonLd } from '@/lib/person'

// Mismo patrón ISR de Home, Stack y Servicios (SEO-06): generateStaticParams
// vacío, dynamicParams (default true) sirve cada locale en la primera visita.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

// Sobre mí vive en el global `about-page` y NO en la colección `pages`: un doc
// de pages entraría al sitemap.xml de producción como una URL que devuelve 404
// hasta el corte (Pitfall 1). Es la misma ruta en ambos idiomas (/sobre-mi y
// /en/sobre-mi) y emite un `ProfilePage` con el Person canónico del sitio.
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
  // Los componentes de servidor que traducen leen el idioma de aqui (ISR).
  setRequestLocale(locale)
  const typedLocale: 'es' | 'en' = locale === 'en' ? 'en' : 'es'
  const [data, cta, profile] = await Promise.all([
    getAboutData(typedLocale),
    getCtaData(typedLocale),
    buildProfilePageJsonLd(typedLocale, typedLocale === 'en' ? '/en/sobre-mi' : '/sobre-mi'),
  ])

  // Sin global ni autor no hay nada que mostrar. Cualquier otro fallo de la
  // Local API ya lo absorbió getAboutData: la página sale sin esa sección.
  if (!data) notFound()

  return (
    <>
      <AboutView data={data} locale={typedLocale} cta={cta} />
      <JsonLd data={profile} />
    </>
  )
}
