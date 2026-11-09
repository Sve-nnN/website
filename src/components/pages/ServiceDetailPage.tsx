// Server Component compartido por las dos rutas gemelas: /servicios/[slug] y
// /services/[slug]. Lee el doc de `pages`, lo reparte en ranuras con
// `composeServiceSlots` y renderiza cada una en MUI. El contrato de SEO
// (metadata, ISR, JSON-LD de Service y de BreadcrumbList) es el de las rutas
// anteriores: mismas funciones y mismos argumentos.
//
// Un solo formulario por pagina: el cierre (CtaSection, id="contacto"). El
// callToAction intermedio es una banda con enlace, sin formulario.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { notFound } from 'next/navigation'
import { Fragment } from 'react'
import { getTranslations } from 'next-intl/server'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { FaqAccordion } from '@/components/mui/FaqAccordion'
import { LogoMarquee } from '@/components/mui/LogoMarquee'
import { headingText, type LexicalNodeLike } from '@/components/mui/rich-text/lexical-toc'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { Section } from '@/components/mui/Section'
import { CtaSection } from '@/components/mui/CtaSection'
import { TestimonialCards } from '@/components/mui/TestimonialCards'
import { buildBreadcrumbJsonLd, buildTrail } from '@/lib/breadcrumbs'
import { getCtaData } from '@/lib/cta-data'
import { resolveLinkHref, type NavLinkInput } from '@/lib/nav-links'
import { buildServiceJsonLd } from '@/lib/service-schema'
import { composeServiceSlots, type ServiceSection } from '@/lib/service-slots'
import {
  getCaseProof,
  getOtherServices,
  getServiceLogos,
  getServiceTestimonials,
} from '@/lib/service-view-data'
import { getServicePage } from '@/lib/services-data'

import { OtherServices } from './service/OtherServices'
import { ServiceCaseProof } from './service/ServiceCaseProof'
import { ServiceCtaBand } from './service/ServiceCtaBand'
import { ServiceExtras } from './service/ServiceExtras'
import { ServiceHero } from './service/ServiceHero'
import { ServiceHow } from './service/ServiceHow'
import { ServiceIncludes } from './service/ServiceIncludes'
import { ServiceProblem } from './service/ServiceProblem'

type Locale = 'es' | 'en'
type CtaSectionData = Extract<ServiceSection, { kind: 'cta' }>

/** Texto plano del richText de un bloque, con un espacio entre parrafos. */
function plainText(richText: unknown): string | null {
  const children = (richText as { root?: { children?: LexicalNodeLike[] } } | null | undefined)?.root?.children ?? []
  const text = children
    .map((n) => headingText(n).trim())
    .filter(Boolean)
    .join(' ')
  return text === '' ? null : text
}

/** Enlace del primer renglon de links de un bloque callToAction, saneado. */
function ctaLink(section: CtaSectionData, locale: Locale): { label: string; href: string } | null {
  const link = section.block.links?.[0]?.link
  if (!link) return null
  const href = resolveLinkHref(link as NavLinkInput, locale)
  const label = link.label?.trim()
  return href && label ? { label, href } : null
}

export async function ServiceDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const doc = await getServicePage(locale, slug)
  if (!doc) notFound()

  const resolvedSlug = doc.slug ?? slug
  const trail = buildTrail(locale, { slug: resolvedSlug, title: doc.title })
  const { hero, scope, sections } = composeServiceSlots(doc.content?.layout ?? [])

  const firstCta = sections.find((s): s is CtaSectionData => s.kind === 'cta')
  const closing = sections.find((s): s is CtaSectionData => s.kind === 'cta' && s.closing)

  const logosSection = sections.find((s) => s.kind === 'logos')
  const testimonialsSection = sections.find((s) => s.kind === 'testimonials')
  const caseSection = sections.find((s) => s.kind === 'caseProof')

  const [t, tMarquee, tTestimonials, logos, testimonials, proof, others, ctaData] = await Promise.all([
    getTranslations({ locale, namespace: 'services.detail' }),
    getTranslations({ locale, namespace: 'home.marquee' }),
    getTranslations({ locale, namespace: 'testimonialsCarousel' }),
    logosSection?.kind === 'logos' ? getServiceLogos(logosSection.block.clients) : Promise.resolve([]),
    testimonialsSection?.kind === 'testimonials'
      ? getServiceTestimonials(testimonialsSection.block.limit)
      : Promise.resolve([]),
    caseSection?.kind === 'caseProof' ? getCaseProof(locale, caseSection.block.caseStudy) : Promise.resolve(null),
    getOtherServices(locale, resolvedSlug),
    closing ? getCtaData(locale) : Promise.resolve(null),
  ])

  const aside = firstCta ? ctaLink(firstCta, locale) : null

  const renderSection = (s: ServiceSection, i: number) => {
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
                <MuiRichText key={col.id ?? j} data={col.richText as unknown as SerializedEditorState} maxWidth={760} />
              ))}
            </Container>
          </Box>
        )
      case 'cta':
        // El cierre se pinta al final de la pagina, con el unico formulario.
        // Si no hay datos de cierre, el bloque se pinta como banda y su texto no se pierde.
        if (s.closing && ctaData) return null
        return (
          <ServiceCtaBand key={key} link={ctaLink(s, locale)}>
            <MuiRichText data={s.block.richText as unknown as SerializedEditorState} maxWidth={760} />
          </ServiceCtaBand>
        )
      case 'auditor':
        return <ServiceExtras key={key} heading={s.block.heading} narrative={s.block.narrative} />
      case 'logos':
        if (logos.length === 0) return null
        return (
          <LogoMarquee
            key={key}
            title={s.block.title?.trim() || tMarquee('groupLabel')}
            groupLabel={tMarquee('groupLabel')}
            logos={logos}
          />
        )
      case 'testimonials':
        // Cero citas, sin seccion.
        if (testimonials.length === 0) return null
        return (
          <Section key={key} id="testimonios" band title={s.block.title?.trim() || tTestimonials('title')}>
            <TestimonialCards items={testimonials} />
          </Section>
        )
      case 'caseProof':
        if (!proof) return null
        return (
          <ServiceCaseProof key={key} proof={proof} title={s.block.title} framingText={s.block.framingText} />
        )
      case 'faq': {
        const items = (s.block.faqs ?? []).map((f) => ({
          question: f.question,
          answer: <MuiRichText data={f.answer as unknown as SerializedEditorState} maxWidth={720} />,
        }))
        if (items.length === 0) return null
        return (
          <Section key={key} id="faq" title={s.block.title?.trim() || t('faqTitle')}>
            <FaqAccordion idPrefix="sf" items={items} headingLevel={3} />
          </Section>
        )
      }
      default:
        // Bloques sin vista propia: el registro anterior, para no perder texto.
        return <RenderBlocks key={key} blocks={[s.block]} />
    }
  }

  const closingLead =
    ctaData && ctaData.isFallback && locale === 'en'
      ? ctaData.lead
      : (closing ? plainText(closing.block.richText) : null) ?? ctaData?.lead ?? null

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
        cta={aside}
      />
      {sections.map(renderSection)}
      <OtherServices items={others} />
      {ctaData && (
        <div lang={ctaData.isFallback && locale === 'en' ? 'es' : undefined}>
          <CtaSection
            title={ctaData.title}
            lead={closingLead}
            email={ctaData.email}
            name={ctaData.name}
            avatarUrl={ctaData.avatarUrl}
          />
        </div>
      )}
    </>
  )
}
