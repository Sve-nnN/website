'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useLocale, useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { Section } from '@/components/mui/Section'
import type { HomeSites } from '@/lib/home-data-b'

import { SiteCard } from './SiteCard'

const SITES_HREF = '/websites'

/**
 * Columnas (de 6) que ocupa la tarjeta `i` de `n`: con cinco o mas, las tres
 * primeras de 2 y las siguientes de 3; con cuatro, dos renglones de 2 tarjetas;
 * con tres, tres de 2; con una o dos, mitades.
 */
function spanFor(i: number, n: number): number {
  if (n >= 5) return i < 3 ? 2 : 3
  if (n === 3) return 2
  return 3
}

/** Fecha larga en el idioma de la pagina, en UTC para que servidor y cliente coincidan. */
function formatDate(iso: string, locale: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

/**
 * Sitios destacados con captura, puntajes y tecnologias reales. La nota se arma
 * con la plantilla `home.sites.note` y la fecha de captura mas reciente de los
 * sitios mostrados; sin fecha no hay nota. Sin sitios no se renderiza.
 */
export function Sites({ sites }: { sites: HomeSites }) {
  const t = useTranslations('home')
  const locale = useLocale()
  if (sites.items.length === 0) return null

  const date = sites.capturedAt ? formatDate(sites.capturedAt, locale) : null
  const n = sites.items.length

  return (
    <Section id="sitios" title={sites.title}>
      {date && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
          {t('sites.note', { date })}
        </Typography>
      )}
      <UL
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(6, minmax(0,1fr))' },
          gap: 2,
        }}
      >
        {sites.items.map((site, i) => (
          <Box key={site.id} component="li" sx={{ display: 'grid', gridColumn: { md: `span ${spanFor(i, n)}` } }}>
            <SiteCard site={site} />
          </Box>
        ))}
      </UL>
      {sites.ctaLabel && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button component={linkFor(SITES_HREF)} href={SITES_HREF} variant="contained" size="large">
            {sites.ctaLabel}
          </Button>
        </Box>
      )}
    </Section>
  )
}
