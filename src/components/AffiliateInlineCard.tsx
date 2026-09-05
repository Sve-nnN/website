import { getTranslations } from 'next-intl/server'

import type { AffiliateLink } from '@/payload-types'

// CONSTRAINT DURA (T-48-09, 48-03-PLAN.md Task 1 Paso 3): este archivo NUNCA
// importa `AffiliateDisclosure` ni `RichTextRenderer` (ni nada que
// transitivamente los importe) — reabriría el hazard de TDZ/import circular
// documentado en el docblock de `richTextBlockConverters.tsx` (ese módulo
// importa este converter, y `RichTextRenderer` importa ese módulo).
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { AffiliateLink as AffiliateLinkAnchor } from '@/components/AffiliateLink'
import { resolveAffiliateCta } from '@/lib/affiliate-cta'

/**
 * Card leaf para el bloque Lexical `affiliate-inline` — segundo consumidor
 * de `AffiliateLink`/`resolveAffiliateCta` (el primero es `ToolCard`,
 * Plan 48-01). Misma máquina de 3 estados de CTA (activo/pendiente/none),
 * misma fuente de `rel="sponsored nofollow noopener"`.
 */
export async function AffiliateInlineCard({
  affiliateLink,
  locale,
}: {
  affiliateLink?: (number | null) | AffiliateLink
  locale?: 'es' | 'en'
}) {
  const resolved = typeof affiliateLink === 'object' && affiliateLink !== null ? affiliateLink : null

  // Si el ID no resolvió a un doc poblado, no hay nombre/tagline reales que
  // mostrar — nunca renderizar un ID crudo (T-48-11). Sin nombre, no hay
  // card: mejor nada que un placeholder vacío.
  if (!resolved || !resolved.name) return null

  const t = locale
    ? await getTranslations({ locale, namespace: 'stackPage' })
    : await getTranslations('stackPage')

  const { name, tagline } = resolved
  const cta = resolveAffiliateCta(resolved, name, t('ctaDefault', { tool: name }))

  return (
    <div className="not-prose my-8 rounded-lg border border-border bg-card shadow-sm p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-label uppercase tracking-wide opacity-70">{t('inlineEyebrow')}</p>
          <p className="font-heading text-heading">{name}</p>
          {tagline && <p className="text-body text-muted-foreground">{tagline}</p>}
        </div>
        {cta.kind === 'active' && (
          <AffiliateLinkAnchor href={cta.href} className={buttonVariants({ size: 'sm' })}>
            {cta.label}
          </AffiliateLinkAnchor>
        )}
        {cta.kind === 'pending' && <Badge variant="outline">{t('badgePending')}</Badge>}
        {/* cta.kind === 'none' (GSC): nada en este slot — ningún post de esta
            fase referencia el doc de GSC desde el bloque inline. */}
      </div>
    </div>
  )
}
