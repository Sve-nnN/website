// Server Component compartido por las dos rutas gemelas: /servicios y
// /services. Lee el índice y los cuatro docs de servicio, y renderiza la vista
// MUI. El contrato de SEO (metadata, ISR, JSON-LD de ItemList y BreadcrumbList)
// es el de las rutas anteriores: mismas funciones y mismos argumentos.
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { CtaSection } from '@/components/mui/CtaSection'
import { buildBreadcrumbJsonLd, buildTrail } from '@/lib/breadcrumbs'
import { getCtaData } from '@/lib/cta-data'
import { buildServicesIndexJsonLd } from '@/lib/service-schema'
import { getServicesIndexData } from '@/lib/services-index-data'

import { ServicesIndexView } from './ServicesIndexView'

type Locale = 'es' | 'en'

export async function ServicesIndexPage({ locale }: { locale: Locale }) {
  const data = await getServicesIndexData(locale)
  if (!data) notFound()

  const trail = buildTrail(locale)
  const ctaData = await getCtaData(locale)

  return (
    <>
      {/* SEO-09: el índice lista varias ofertas, así que no es un `Service` en sí. */}
      {data.services.length > 0 && <JsonLd data={buildServicesIndexJsonLd(locale, data.services)} />}
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <ServicesIndexView
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        title={data.heroTitle}
        lead={data.heroLead}
        cards={data.cards}
        rows={data.rows}
        contactHref={locale === 'es' ? '/#contacto' : '/en#contacto'}
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
    </>
  )
}
