import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { getTranslations } from 'next-intl/server'

import type { AffiliateLink } from '@/payload-types'

// CONSTRAINT DURA (T-48-09, 48-03-PLAN.md Task 1 Paso 3): este archivo NUNCA
// importa `AffiliateDisclosure` ni `RichTextRenderer` (ni nada que
// transitivamente los importe) — reabriría el hazard de TDZ/import circular
// documentado en el docblock de `richTextBlockConverters.tsx` (ese módulo
// importa este converter, y `RichTextRenderer` importa ese módulo).
import { AFFILIATE_REL } from '@/components/AffiliateLink'
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

  // Plan 57-07 (D-06): MUI en lugar de utilidades Tailwind. Este es el respaldo de los
  // bloques de un cuerpo sin convertidores MUI; el post usa el de `mui/rich-text/blocks`.
  return (
    <Box
      sx={{
        my: 4,
        p: 3,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="overline" component="p" sx={{ opacity: 0.7 }}>
            {t('inlineEyebrow')}
          </Typography>
          <Typography variant="h6" component="p">
            {name}
          </Typography>
          {tagline && (
            <Typography variant="body1" component="p" sx={{ color: 'text.secondary' }}>
              {tagline}
            </Typography>
          )}
        </Box>
        {cta.kind === 'active' && (
          <Button
            component="a"
            href={cta.href}
            target="_blank"
            rel={AFFILIATE_REL}
            variant="contained"
            size="small"
          >
            {cta.label}
          </Button>
        )}
        {cta.kind === 'pending' && <Chip label={t('badgePending')} variant="outlined" size="small" />}
        {/* cta.kind === 'none' (GSC): nada en este slot — ningún post de esta
            fase referencia el doc de GSC desde el bloque inline. */}
      </Box>
    </Box>
  )
}
