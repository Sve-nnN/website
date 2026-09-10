import { getTranslations } from 'next-intl/server'
import PlainLink from 'next/link'

import type { ToolStackBlock } from '@/payload-types'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Prose } from '@/components/Prose'
import { AffiliateLink } from '@/components/AffiliateLink'
import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'
import { resolveAffiliateCta } from '@/lib/affiliate-cta'

type CategoryGroup = NonNullable<ToolStackBlock['categoryGroups']>[number]
export type ToolCardData = NonNullable<CategoryGroup['tools']>[number]

function normalizeToSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Card por herramienta — una única máquina de estados visual cubriendo
 * "afiliado activo," "sin afiliado todavía," y "link directo, sin programa"
 * (GSC). Solo el slot de CTA cambia entre estados; el resto de la card
 * (nombre/narrative/pro/con/referencia) renderiza al mismo peso visual
 * siempre — Pitfall 5 de 48-RESEARCH.md: NUNCA opacity-50/disabled aquí.
 */
export async function ToolCard({ tool, locale }: { tool: ToolCardData; locale?: 'es' | 'en' }) {
  const t = locale
    ? await getTranslations({ locale, namespace: 'stackPage' })
    : await getTranslations('stackPage')

  const { name, affiliateLink, narrative, pro, con, referenceLink } = tool

  const resolvedAffiliateLink =
    typeof affiliateLink === 'object' && affiliateLink !== null ? affiliateLink : null
  const slug = resolvedAffiliateLink?.slug ?? normalizeToSlug(name)

  const cta = resolveAffiliateCta(affiliateLink, name, t('ctaDefault', { tool: name }))

  const caseStudy =
    referenceLink?.type === 'caseStudy' &&
    typeof referenceLink.caseStudy === 'object' &&
    referenceLink.caseStudy !== null
      ? referenceLink.caseStudy
      : null

  const referenceHref =
    referenceLink?.type === 'caseStudy'
      ? caseStudy
        ? `/case-studies/${caseStudy.slug}`
        : null
      : (referenceLink?.url ?? null)

  const ReferenceLinkComponent =
    referenceHref && isPrefixableHref(referenceHref) ? LocaleLink : PlainLink

  return (
    <div data-tool-narrative={slug}>
      <Card>
        <CardContent className="p-8">
          <h3 className="font-heading text-heading">{name}</h3>

          <div className="mt-4">
            <p className="text-label uppercase tracking-wide opacity-70">{t('rowUsage')}</p>
            <Prose>
              <p>{narrative}</p>
            </Prose>
          </div>

          <div className="mt-4">
            <p className="text-label uppercase tracking-wide opacity-70">{t('rowPro')}</p>
            <p className="text-body">{pro}</p>
          </div>

          <div className="mt-4">
            <p className="text-label uppercase tracking-wide opacity-70">{t('rowCon')}</p>
            <p className="text-body">{con ?? t('rowConEmpty')}</p>
          </div>

          {referenceHref && (
            <div className="mt-4">
              <p className="text-label uppercase tracking-wide opacity-70">{t('rowReference')}</p>
              <ReferenceLinkComponent
                href={referenceHref}
                className="text-primary-text underline underline-offset-2"
              >
                {referenceLink?.type === 'caseStudy' ? caseStudy?.title : referenceHref}
              </ReferenceLinkComponent>
            </div>
          )}

          <div className="mt-6">
            {cta.kind === 'active' && (
              <AffiliateLink href={cta.href} className={buttonVariants({ size: 'sm' })}>
                {cta.label}
              </AffiliateLink>
            )}
            {cta.kind === 'pending' && <Badge variant="outline">{t('badgePending')}</Badge>}
            {/* cta.kind === 'none' (GSC): nada en este slot, per contrato UI-SPEC. */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
