'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { UL } from '@/components/mui/lists'
import { Section } from '@/components/mui/Section'
import type { HomeVitals } from '@/lib/home-data'

const pct = (n: number) => `${Math.min(100, Math.max(0, n))}%`

/**
 * Cuatro lecturas de Core Web Vitals. El color nunca va solo (SC 1.4.1): la
 * cifra y la nota dicen el resultado en texto, y la barra lleva un nombre
 * accesible armado con la plantilla `home.vitals.ariaLabel`. Sin items la
 * seccion no se renderiza.
 */
export function Vitals({ vitals }: { vitals: HomeVitals }) {
  const t = useTranslations('home')
  if (vitals.items.length === 0) return null

  return (
    <Section id="medicion" title={vitals.title} lead={vitals.lead ?? undefined}>
      {vitals.measurementNote && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, maxWidth: 760 }}>
          {vitals.measurementNote}
        </Typography>
      )}
      <UL
        aria-label={t('vitals.groupLabel')}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0,1fr)',
            sm: 'repeat(2, minmax(0,1fr))',
            md: 'repeat(4, minmax(0,1fr))',
          },
          gap: 2,
        }}
      >
        {vitals.items.map((v, i) => (
          <Card key={`${i}-${v.name}`} component="li" sx={{ p: 3, display: 'grid', gap: 1.5, alignContent: 'start' }}>
            <Typography variant="h6" component="h3">
              {v.name}
            </Typography>
            {v.desc && (
              <Typography variant="body2" color="text.secondary">
                {v.desc}
              </Typography>
            )}
            {v.value && (
              <Typography variant="mono" component="p" sx={{ fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 600 }}>
                {v.value}
              </Typography>
            )}
            <Box
              role="img"
              aria-label={t('vitals.ariaLabel', { name: v.name, label: v.label ?? v.value ?? '' })}
              sx={{ position: 'relative', height: 8, borderRadius: 9999, display: 'flex', mt: 1 }}
            >
              <Box sx={{ width: pct(v.goodPct), bgcolor: 'success.main', borderRadius: '9999px 0 0 9999px' }} />
              <Box sx={{ width: pct(v.midPct), bgcolor: 'warning.main' }} />
              <Box sx={{ width: pct(v.poorPct), bgcolor: 'error.main', borderRadius: '0 9999px 9999px 0' }} />
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  left: pct(v.markerPct),
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'text.primary',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  transform: 'translateX(-50%)',
                }}
              />
            </Box>
            {v.note && (
              <Typography variant="caption" color="text.secondary">
                {v.note}
              </Typography>
            )}
          </Card>
        ))}
      </UL>
    </Section>
  )
}
