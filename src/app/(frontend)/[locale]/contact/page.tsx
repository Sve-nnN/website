import { notFound } from 'next/navigation'

import { ContactView } from '@/components/pages/ContactView'
import { getCachedPageBySlug } from '@/lib/cache'
import { getContactData } from '@/lib/contact-data'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/sitemap-data'
import { personRef } from '@/lib/person'
import { websiteRef, BUSINESS_ID } from '@/lib/site-schema'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

function contactFallbackTitle(locale: string) {
  return locale === 'es' ? 'Contacto' : 'Contact'
}

// Misma lectura que getContactData (cacheada, overrideAccess: false): una sola
// politica de acceso para la metadata y el cuerpo.
async function getContactPage(locale: string) {
  return getCachedPageBySlug('contact', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getContactPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? contactFallbackTitle(locale)
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/contact' : '/contact'

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'contact',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/contact', '/en/contact'),
  }
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ sent?: string }>
}) {
  const [{ locale }, { sent }] = await Promise.all([params, searchParams])
  const data = await getContactData(locale as 'es' | 'en')

  if (!data) {
    notFound()
  }

  // Estado del envio: la accion redirige a ?sent=true|false. Cualquier otro
  // valor (o ninguno) deja el formulario sin estado.
  const status = sent === 'true' ? 'success' : sent === 'false' ? 'error' : null

  // SEO-48: /contact era una de las diez paginas sin ningun dato estructurado.
  // `ContactPage` es lo que dice que esta URL ES el canal de contacto de la
  // entidad, en vez de una pagina mas que casualmente tiene un formulario.
  //
  // Sin `email` ni `telephone` en el nodo: el correo vive en una env var y no
  // se publica en el HTML a proposito, y telefono no hay. Se declara la
  // relacion con la entidad, que es lo que si es cierto.
  const contactPath = locale === 'en' ? '/en/contact' : '/contact'
  const contactPageData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_URL}${contactPath}#contactpage`,
    url: `${SITE_URL}${contactPath}`,
    name: data.schemaName,
    inLanguage: locale === 'en' ? 'en' : 'es',
    isPartOf: websiteRef,
    about: { '@id': BUSINESS_ID },
    mainEntity: personRef,
  }

  return (
    <div>
      <JsonLd data={contactPageData} />
      <ContactView
        data={data}
        locale={locale as 'es' | 'en'}
        status={status}
        formEmail={data.email ?? process.env.CONTACT_TO_EMAIL ?? ''}
      />
    </div>
  )
}
