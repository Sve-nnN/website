// Server Component compartido por las landings SEO técnico Lima y Madrid. Lee el
// doc de `pages`, lo reparte en ranuras con `composeLocalSlots` y renderiza cada
// una en MUI. El contrato de SEO (metadata, ISR y JSON-LD de Service) es el de
// las rutas anteriores: mismas funciones, mismos argumentos y la misma URL
// (SEO-42). Solo cambia la capa visual.
//
// Un solo formulario por página: el cierre (CtaSection, id="contacto"). Un
// callToAction anterior es una banda con enlace, sin formulario.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { CtaSection } from '@/components/mui/CtaSection'
import { FaqAccordion } from '@/components/mui/FaqAccordion'
import { PageHero } from '@/components/mui/PageHero'
import { headingText, type LexicalNodeLike } from '@/components/mui/rich-text/lexical-toc'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { Section } from '@/components/mui/Section'
import { getCtaData } from '@/lib/cta-data'
import { composeLocalSlots, type LocalSection } from '@/lib/local-landing-view'
import { getLocalLandingPage } from '@/lib/local-landing-data'
import { buildLocalLandingHref, findLocalLanding } from '@/lib/local-landing-slugs'
import { resolveLinkHref, type NavLinkInput } from '@/lib/nav-links'
import { omitPlaceholder } from '@/lib/placeholder'
import { SITE_URL } from '@/lib/sitemap-data'
import { buildLocalService } from '@/lib/site-schema'

import { LocalHeroActions, LocalHeroStat, LocalProof, type LocalAction } from './LocalLanding'
import { ServiceCtaBand } from './service/ServiceCtaBand'

type Locale = 'es' | 'en'
type CtaSectionData = Extract<LocalSection, { kind: 'cta' }>

/** Texto plano del richText de un bloque, con un espacio entre párrafos. */
function plainText(richText: unknown): string | null {
  const children = (richText as { root?: { children?: LexicalNodeLike[] } } | null | undefined)?.root?.children ?? []
  const text = children
    .map((n) => headingText(n).trim())
    .filter(Boolean)
    .join(' ')
  return text === '' ? null : text
}

/** Enlace del primer renglón de links de un bloque callToAction, saneado. */
function ctaLink(section: CtaSectionData, locale: Locale): { label: string; href: string } | null {
  const link = section.block.links?.[0]?.link
  if (!link) return null
  const href = resolveLinkHref(link as NavLinkInput, locale)
  const label = link.label?.trim()
  return href && label ? { label, href } : null
}

export async function LocalLandingPage({ locale, slug }: { locale: Locale; slug: string }) {
  const doc = await getLocalLandingPage(locale, slug)
  if (!doc) notFound()

  // SEO-42: Service + areaServed. Mismos argumentos y misma URL que las rutas anteriores.
  const landing = findLocalLanding(slug)
  if (!landing) notFound()
  const serviceData = buildLocalService({
    locale,
    city: landing.city,
    country: landing.country,
    name: doc.meta?.title ?? doc.title,
    description: doc.meta?.description ?? undefined,
    url: `${SITE_URL}${buildLocalLandingHref(locale, landing.slug)}`,
  })

  const { hero, sections } = composeLocalSlots(doc.content?.layout ?? [])
  const closing = sections.find((s): s is CtaSectionData => s.kind === 'cta' && s.closing)

  const [tCommon, tDetail, ctaData] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'services.detail' }),
    closing ? getCtaData(locale) : Promise.resolve(null),
  ])

  const title = omitPlaceholder(hero?.title?.trim()) || doc.title
  const eyebrow = omitPlaceholder(hero?.cityName?.trim()) || undefined
  const lead = omitPlaceholder(hero?.subtitle?.trim()) || undefined

  // Los botones del hero anterior: se conservan para no perder los enlaces internos.
  const actions: LocalAction[] = (hero?.links ?? []).flatMap((item): LocalAction[] => {
    const link = item.link
    if (!link) return []
    const href = resolveLinkHref(link as NavLinkInput, locale)
    const label = link.label?.trim()
    if (!href || !label) return []
    return [{ label, href, appearance: link.appearance === 'outline' ? 'outline' : 'primary' }]
  })

  // Sin estadística real (vacía o marcador) no hay aside: el hero queda en una columna.
  const statText = omitPlaceholder(hero?.inlineStat?.trim()) || null

  const crumbs = [{ label: tCommon('breadcrumbHome'), href: '/' }, { label: title }]

  const renderSection = (s: LocalSection, i: number) => {
    const key = s.block.id ?? i
    switch (s.kind) {
      case 'proof':
        return <LocalProof key={key} stats={s.block.stats} testimonial={s.block.testimonial} />
      case 'prose':
        // Todas las columnas, en orden: ningún texto del editor se pierde.
        return (
          <Box key={key} sx={{ py: { xs: 6, md: 8 } }}>
            <Container maxWidth="lg">
              {s.block.columns?.map((col, j) => (
                <MuiRichText key={col.id ?? j} data={col.richText as unknown as SerializedEditorState} maxWidth={760} />
              ))}
            </Container>
          </Box>
        )
      case 'faq': {
        const items = (s.block.faqs ?? []).map((f) => ({
          question: f.question,
          answer: <MuiRichText data={f.answer as unknown as SerializedEditorState} maxWidth={720} />,
        }))
        if (items.length === 0) return null
        return (
          <Section key={key} id="faq" py title={s.block.title?.trim() || tDetail('faqTitle')}>
            <FaqAccordion idPrefix="lf" items={items} headingLevel={3} />
          </Section>
        )
      }
      case 'cta':
        // El cierre se pinta al final de la página, con el único formulario.
        // Si no hay datos de cierre, el bloque se pinta como banda y su texto no se pierde.
        if (s.closing && ctaData) return null
        return (
          <ServiceCtaBand key={key} link={ctaLink(s, locale)}>
            <MuiRichText data={s.block.richText as unknown as SerializedEditorState} maxWidth={760} />
          </ServiceCtaBand>
        )
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
      <JsonLd data={serviceData} />
      <PageHero
        crumbs={crumbs}
        eyebrow={eyebrow}
        title={title}
        lead={lead}
        aside={statText ? <LocalHeroStat text={statText} /> : undefined}
      >
        <LocalHeroActions actions={actions} />
      </PageHero>
      {sections.map(renderSection)}
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
