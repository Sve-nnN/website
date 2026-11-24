'use client'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { IconTile } from '@/components/mui/IconTile'
import { OL } from '@/components/mui/lists'
import { Section } from '@/components/mui/Section'
import type { HomeProcess } from '@/lib/home-data-b'

/**
 * Proceso en pasos numerados. Una lista ordenada en rejilla de 1, 2 y 4
 * columnas (xs, sm y md); cada paso es una tarjeta con icono, el rotulo
 * "Paso n" de messages, h3 y cuerpo. Sin pasos no se renderiza (ni encabezado).
 */
export function Process({ process }: { process: HomeProcess }) {
  const t = useTranslations('common')
  if (process.steps.length === 0) return null

  return (
    <Section id="proceso" py title={process.title}>
      <OL
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
        {process.steps.map((step, i) => (
          <Card key={`${i}-${step.title}`} component="li" sx={{ p: 3, display: 'grid', gap: 1.5, alignContent: 'start' }}>
            {step.icon && <IconTile name={step.icon} />}
            <Typography variant="overline" color="text.secondary">
              {t('step', { n: i + 1 })}
            </Typography>
            <Typography variant="h6" component="h3">
              {step.title}
            </Typography>
            {step.body && (
              <Typography variant="body2" color="text.secondary">
                {step.body}
              </Typography>
            )}
          </Card>
        ))}
      </OL>
    </Section>
  )
}
