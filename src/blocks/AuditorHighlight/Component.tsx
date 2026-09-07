import { getTranslations } from 'next-intl/server'
import { Gauge } from 'lucide-react'

import type { AuditorHighlightBlock as AuditorHighlightBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
import { AUDITOR_URL, AUDITOR_STATS } from '@/lib/auditor'

/**
 * Server Component, no 'use client', no fetch to auditor.juan-tech.com — the
 * 4 stats are local constants (src/lib/auditor.ts), not live data. Renders
 * between ServicesShowcase and AboutSection in Home's layout, deliberately
 * NOT adjacent to AuditOfferBlock (the paid 600 USD audit) — see
 * 48.5-UI-SPEC.md "Home Block" for why AboutSection is the required buffer.
 *
 * Icon is Gauge (never Search — already used by ServicesShowcase's
 * "Auditoría SEO Técnica" card), so the two "audit" surfaces never share an
 * icon.
 *
 * CTA is a plain native `<a>` wrapped in `buttonVariants()` classes, not
 * `next/link`, `@/i18n/navigation`'s `Link`, or `CMSLink` — this exits to a
 * different domain, and the Outbound Link Contract requires 0 KB of added
 * client JS regardless of what else is on the page.
 */
export async function AuditorHighlightComponent(props: AuditorHighlightBlockProps) {
  const { title, description, ctaLabel, freeTierNote } = props
  const t = await getTranslations('auditorHighlight')

  return (
    <Container className="py-16">
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          {/*
            Row-major grid auto-placement (no `order-*` overrides needed): on
            a single column (mobile) the 3 items stack in DOM order — content,
            then stats, then CTA — matching the UI-SPEC's required mobile
            order. On `md:grid-cols-2`, auto-placement fills (1,1)=content,
            (1,2)=stats, then the next free cell is (2,1)=CTA — landing the
            CTA directly under content in the left column, with stats
            occupying the full right column. freeTierNote sits outside this
            grid, always last, full width.
          */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
                <Gauge className="size-5 text-primary" />
              </div>
              {/* SEO-10.2: sin `title` no saltamos de nivel de heading — el
                  encabezado de sección existe igual, solo visualmente oculto. */}
              {title ? (
                <h2 className="font-heading text-heading mt-4">{title}</h2>
              ) : (
                <h2 className="sr-only">{t('sectionHeading')}</h2>
              )}
              <p className="mt-2 text-body text-muted-foreground">{description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 content-start md:self-start">
              {AUDITOR_STATS.map((stat) => (
                <div key={stat.labelKey}>
                  <p className="font-heading text-display font-semibold tracking-tight tabular-nums text-primary-text">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-label uppercase tracking-wide opacity-70">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>

            <a
              href={AUDITOR_URL}
              target="_blank"
              rel="noopener"
              className={`${buttonVariants()} self-start`}
            >
              {ctaLabel || t('cta')}
              <span className="sr-only"> ({t('opensInNewTab')})</span>
            </a>
          </div>

          <p className="text-label text-muted-foreground mt-6">{freeTierNote}</p>
        </CardContent>
      </Card>
    </Container>
  )
}
