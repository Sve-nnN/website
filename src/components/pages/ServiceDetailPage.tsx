// Server Component compartido por las dos rutas gemelas: /servicios/[slug] y
// /services/[slug]. Lee el doc de `pages`, lo reparte en ranuras con
// `composeServiceSlots` y renderiza cada una en MUI. El contrato de SEO
// (metadata, ISR, JSON-LD de Service y de BreadcrumbList) es el de las rutas
// anteriores: mismas funciones y mismos argumentos.
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { Fragment } from 'react'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { buildBreadcrumbJsonLd, buildTrail } from '@/lib/breadcrumbs'
import { resolveLinkHref, type NavLinkInput } from '@/lib/nav-links'
import { buildServiceJsonLd } from '@/lib/service-schema'
import { composeServiceSlots } from '@/lib/service-slots'
import { getServicePage } from '@/lib/services-data'

import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'

import { ServiceExtras } from './service/ServiceExtras'
import { ServiceHero } from './service/ServiceHero'
import { ServiceHow } from './service/ServiceHow'
import { ServiceIncludes } from './service/ServiceIncludes'
import { ServiceProblem } from './service/ServiceProblem'

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
      {sections.map((s, i) => {
        const key = s.block.id ?? i
        switch (s.kind) {
          case 'problem':
            return <ServiceProblem key={key} richTexts={(s.block.columns ?? []).map((c) => c.richText)} />
          case 'twoColumns':
            return (
              <Fragment key={key}>
                <ServiceIncludes richText={s.block.columns?.[0]?.richText} />
                <ServiceHow richText={s.block.columns?.[1]?.richText} />
              </Fragment>
            )
          case 'prose':
            // Todas las columnas, en orden: ningun texto del editor se pierde.
            return (
              <Box key={key} sx={{ pb: { xs: 8, md: 10 } }}>
                <Container maxWidth="lg">
                  {s.block.columns?.map((col, j) => (
                    <MuiRichText key={col.id ?? j} data={col.richText as never} maxWidth={760} />
                  ))}
                </Container>
              </Box>
            )
          case 'auditor':
            return <ServiceExtras key={key} heading={s.block.heading} narrative={s.block.narrative} />
          default:
            // Hasta que cada seccion tenga su vista, el registro anterior atiende el resto.
            return <RenderBlocks key={key} blocks={[s.block]} />
        }
      })}
    </>
  )
}
