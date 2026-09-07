import { getTranslations } from 'next-intl/server'

import type { ToolStackBlock as ToolStackBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Prose } from '@/components/Prose'
import { AffiliateDisclosureFrame } from '@/components/AffiliateDisclosureFrame'
import { ToolCard } from '@/components/ToolCard'
import { GearCard } from '@/components/GearCard'
import { StackHighlightCallout } from '@/components/StackHighlightCallout'

/**
 * Server component de la página `/stack`. Renderiza las 3 secciones
 * completas: tool cards por categoría, Gear grid, y los dos
 * StackHighlightCallout ("elegiría hoy" / no-commission pick).
 */
export async function ToolStackComponent({
  intro,
  categoryGroups,
  gearIntro,
  gearItems,
  elegiriaHoy,
  noCommissionPick,
  locale,
}: ToolStackBlockProps & { locale?: 'es' | 'en' }) {
  const t = locale
    ? await getTranslations({ locale, namespace: 'stackPage' })
    : await getTranslations('stackPage')

  const resolvedNoCommissionPick =
    typeof noCommissionPick === 'object' && noCommissionPick !== null ? noCommissionPick : null

  return (
    <Container className="py-16">
      {intro && (
        <Prose>
          <p>{intro}</p>
        </Prose>
      )}

      {/* SIEMPRE hasAmazonLinks=true en /stack — el Gear siempre está presente. */}
      <div className="mt-8">
        <AffiliateDisclosureFrame hasAmazonLinks locale={locale} />
      </div>

      {(categoryGroups ?? []).map((group, i) => {
        const tools = group.tools ?? []
        if (tools.length === 0) return null

        return (
          <div key={group.id ?? i} className="mt-12">
            <h2 className="font-heading text-heading">{group.heading}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {tools.map((tool, j) => (
                <ToolCard key={tool.id ?? j} tool={tool} locale={locale} />
              ))}
            </div>
          </div>
        )
      })}

      {gearItems && gearItems.length > 0 && (
        <div className="mt-12">
          {gearIntro && (
            <Prose>
              <p>{gearIntro}</p>
            </Prose>
          )}
          <h2 className="mt-4 font-heading text-heading">{t('gearHeading')}</h2>
          {/* items-start (no items-stretch): alturas desiguales de card no
              deben estirar a las vecinas, per el backstop de overflow. */}
          <div className="mt-6 grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gearItems.map((item, i) => (
              <GearCard key={item.id ?? i} item={item} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {elegiriaHoy && (
        <div className="mt-12">
          <StackHighlightCallout heading={t('elegiriaHoyHeading')} narrative={elegiriaHoy} />
        </div>
      )}

      {resolvedNoCommissionPick && (
        <div className="mt-12">
          <StackHighlightCallout
            heading={t('noCommissionHeading')}
            badge={t('noCommissionBadge')}
            narrative={resolvedNoCommissionPick.whyIUseIt ?? ''}
            linkHref={
              resolvedNoCommissionPick.program === 'google-search-console'
                ? 'https://search.google.com/search-console'
                : undefined
            }
            linkLabel={t('gscLinkLabel')}
          />
        </div>
      )}
    </Container>
  )
}
