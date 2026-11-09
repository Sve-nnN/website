'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { UL } from '@/components/mui/lists'
import { visuallyHidden } from '@/components/mui/ScoreRing'
import { Section } from '@/components/mui/Section'
import { AUDITOR_STATS } from '@/lib/auditor'
import type { HomeAuditor } from '@/lib/home-data-b'

/**
 * Mi auditor SEO: tarjeta `raised` dentro de una seccion normal, con el h2
 * visual en h5, la descripcion, las cuatro cifras verificables del auditor
 * (constantes de src/lib/auditor.ts, no editables), el boton outlined hacia el
 * auditor en pestana nueva y la nota del plan gratuito visible. Sin titulo en
 * el CMS usa el encabezado de messages `auditorHighlight.sectionHeading`.
 */
export function AuditorHighlightCard({ auditor }: { auditor: HomeAuditor }) {
  const t = useTranslations('auditorHighlight')

  return (
    <Section id="auditor" labelledBy="auditor-t" py>
      <Card sx={{ bgcolor: 'raised', p: { xs: 3, md: 5 }, display: 'grid', gap: 3, justifyItems: 'start' }}>
        <Typography id="auditor-t" variant="h5" component="h2">
          {auditor.title ?? t('sectionHeading')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>
          {auditor.description}
        </Typography>
        <UL sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' }, gap: 3, width: '100%' }}>
          {AUDITOR_STATS.map((stat) => (
            <Box key={stat.labelKey} component="li">
              <Typography variant="mono" component="p" sx={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600, color: 'accentText' }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(stat.labelKey)}
              </Typography>
            </Box>
          ))}
        </UL>
        <Button
          component="a"
          href={auditor.href}
          target="_blank"
          rel="noopener"
          variant="outlined"
          size="small"
        >
          {auditor.ctaLabel ?? t('cta')}
          <Box component="span" sx={visuallyHidden}>
            {` (${t('opensInNewTab')})`}
          </Box>
        </Button>
        <Typography variant="caption" color="text.secondary">
          {auditor.freeTierNote}
        </Typography>
      </Card>
    </Section>
  )
}
