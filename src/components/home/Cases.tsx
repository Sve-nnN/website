'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { CaseMetricCard } from '@/components/mui/CaseMetricCard'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { Section } from '@/components/mui/Section'
import type { HomeCases } from '@/lib/home-data-b'

const CASES_HREF = '/case-studies'

/**
 * Resultados de Search Console. Hasta tres tarjetas de cifra sobre franja
 * `band`, y un pie con la nota y el boton hacia todos los casos. Sin casos no
 * se renderiza (ni encabezado huerfano).
 */
export function Cases({ cases }: { cases: HomeCases }) {
  if (cases.items.length === 0) return null

  return (
    <Section id="casos" band title={cases.title} lead={cases.lead ?? undefined}>
      <UL
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3, minmax(0,1fr))' },
          gap: 2,
        }}
      >
        {cases.items.map((c) => (
          <CaseMetricCard key={c.id} href={c.href} tag={c.tag} metric={c.metric} title={c.title} suffix={c.label} tone="band" />
        ))}
      </UL>
      {(cases.note || cases.ctaLabel) && (
        <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          {cases.note && (
            <Typography variant="body2" sx={{ color: 'band.muted' }}>
              {cases.note}
            </Typography>
          )}
          {cases.ctaLabel && (
            <Button component={linkFor(CASES_HREF)} href={CASES_HREF} variant="contained">
              {cases.ctaLabel}
            </Button>
          )}
        </Box>
      )}
    </Section>
  )
}
