'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { ArrowRight, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { PageHero } from '@/components/mui/PageHero'
import type { Crumb } from '@/components/mui/Crumbs'
import { linkFor } from '@/components/mui/links'

export type ServiceScopeData = {
  /** Titulo del bloque; sin el, se usa `serviceScopeCard.title` de messages. */
  title?: string | null
  scope: string
  outcome: string
  timeline: string
}

type Props = {
  /** Migas de `buildTrail`, ya prefijadas por idioma. */
  crumbs: Crumb[]
  title: string
  lead?: string | null
  scope: ServiceScopeData | null
  /** CTA del aside: texto y href ya saneados con `resolveLinkHref`. Sin el no hay boton. */
  cta: { label: string; href: string } | null
}

/**
 * Cabecera de la landing de servicio: PageHero con el alcance del trabajo como
 * aside. El aside es una `Card` con `aria-labelledby` a su h2 (overline); los
 * tres bloques son h3. Sin scope el hero ocupa una sola columna.
 */
export function ServiceHero({ crumbs, title, lead, scope, cta }: Props) {
  const t = useTranslations('serviceScopeCard')
  const d = useTranslations('services.detail')

  const aside = scope ? (
    <Card
      component="aside"
      aria-labelledby="alcance-t"
      sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2.5, boxShadow: '0 24px 48px -24px rgba(0,0,0,0.25)' }}
    >
      <Typography id="alcance-t" variant="overline" component="h2" sx={{ color: 'accentText' }}>
        {scope.title?.trim() || t('title')}
      </Typography>
      <Box>
        <Typography variant="subtitle1" component="h3" sx={{ mb: 0.5 }}>
          {t('scopeLabel')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {scope.scope}
        </Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="h3" sx={{ mb: 0.5 }}>
          {t('outcomeLabel')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {scope.outcome}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'raised' }}>
        <Clock size={20} aria-hidden="true" />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('timelineLabel')}
          </Typography>
          <Typography variant="subtitle1" component="p" sx={{ fontSize: '1rem' }}>
            {scope.timeline}
          </Typography>
        </Box>
      </Box>
      {cta && (
        <Button
          component={linkFor(cta.href)}
          href={cta.href}
          variant="contained"
          size="large"
          endIcon={<ArrowRight size={20} aria-hidden="true" />}
        >
          {cta.label}
        </Button>
      )}
    </Card>
  ) : undefined

  return <PageHero crumbs={crumbs} eyebrow={d('eyebrow')} title={title} lead={lead ?? undefined} aside={aside} />
}
