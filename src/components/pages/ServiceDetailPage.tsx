// Server Component compartido por las dos rutas gemelas: /servicios/[slug] y
// /services/[slug]. Lee el doc de `pages`, lo reparte en ranuras con
// `composeServiceSlots` y renderiza cada una en MUI. El contrato de SEO
// (metadata, ISR, JSON-LD de Service y de BreadcrumbList) es el de las rutas
// anteriores: mismas funciones y mismos argumentos.
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { buildBreadcrumbJsonLd, buildTrail } from '@/lib/breadcrumbs'
import { resolveLinkHref, type NavLinkInput } from '@/lib/nav-links'
import { buildServiceJsonLd } from '@/lib/service-schema'
import { composeServiceSlots } from '@/lib/service-slots'
import { getServicePage } from '@/lib/services-data'

import { ServiceHero } from './service/ServiceHero'

type Locale = 'es' | 'en'

export async function ServiceDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const doc = await getServicePage(locale, slug)
  if (!doc) notFound()

  const resolvedSlug = doc.slug ?? slug
  const trail = buildTrail(locale, { slug: resolvedSlug, title: doc.title })
  const { hero, scope, sections } = composeServiceSlots(doc.content?.layout ?? [])

  // CTA del aside del hero: el enlace del primer callToAction del layout.
  const firstCta = sections.find((s) => s.kind === 'cta')
  const firstLink = firstCta?.kind === 'cta' ? firstCta.block.links?.[0]?.link : undefined
  const ctaHref = firstLink ? resolveLinkHref(firstLink as NavLinkInput, locale) : null
  const ctaLabel = firstLink?.label?.trim()
  const cta = ctaHref && ctaLabel ? { label: ctaLabel, href: ctaHref } : null

  return (
    <>
      <JsonLd data={buildServiceJsonLd(locale, resolvedSlug, doc.title, doc.meta?.description)} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <ServiceHero
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        title={hero?.title?.trim() || doc.title}
        lead={hero?.subtitle}
        scope={
          scope
            ? { title: scope.title, scope: scope.scope, outcome: scope.outcome, timeline: scope.timeline }
            : null
        }
        cta={cta}
      />
      {/* Hasta que cada seccion tenga su vista, el registro anterior atiende el resto. */}
      <RenderBlocks blocks={sections.map((s) => s.block)} />
    </>
  )
}
