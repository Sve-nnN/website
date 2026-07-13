import { getTranslations } from 'next-intl/server'

import type { ServiceScopeCardBlock as ServiceScopeCardBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/card'

// HARD RULE (25-UI-SPEC.md "New Block 1: Scope Card"): this component must
// NEVER render a currency glyph or price/tier anywhere. The single Card +
// stacked-rows layout is deliberate — it must read as one "spec sheet,"
// never as a 3-tier pricing grid.
export async function ServiceScopeCardComponent(props: ServiceScopeCardBlockProps) {
  const { title, scope, outcome, timeline } = props
  const t = await getTranslations('serviceScopeCard')

  return (
    <Container className="py-12">
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h2 className="font-heading text-heading">{title ?? t('title')}</h2>

          <div className="mt-6 flex flex-col gap-6">
            <div>
              <p className="text-label uppercase tracking-wide opacity-70">{t('scopeLabel')}</p>
              <p className="mt-1 text-body">{scope}</p>
            </div>

            <div>
              <p className="text-label uppercase tracking-wide opacity-70">{t('outcomeLabel')}</p>
              <p className="mt-1 text-body">{outcome}</p>
            </div>

            <div>
              <p className="text-label uppercase tracking-wide opacity-70">{t('timelineLabel')}</p>
              <p className="mt-1 text-body text-primary-text font-semibold">{timeline}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
