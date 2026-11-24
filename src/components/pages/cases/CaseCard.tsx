'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import type { CaseIndexItem } from '@/lib/case-study-data'

type Props = {
  item: CaseIndexItem
  /** Tarjeta destacada: franja oscura. La cifra sigue a 72 px (escala aceptada). */
  featured?: boolean
  /** Nivel del encabezado del titulo. 3 por defecto (h1 de la pagina, h2 de la seccion). */
  headingLevel?: 2 | 3
}

// Una cifra que no se pudo separar de su etiqueta ("0 a 56 clics") llega entera
// y no cabe a 72 px en una tarjeta de tres columnas: baja a 48 px, que es parte
// de la escala display aceptada el 2026-11-08.
const LONG_METRIC = 9

/**
 * Tarjeta de caso: sector, cifra de cabeza, titulo con enlace estirado,
 * subtitulo y una senal de lectura. El enlace vive en el titulo y su pseudo
 * elemento cubre la tarjeta; el `outline` del enlace queda en none y el foco
 * se dibuja en la tarjeta con `:has(a:focus-visible)`. El nombre accesible del
 * enlace es el titulo visible.
 */
export function CaseCard({ item, featured, headingLevel = 3 }: Props) {
  const t = useTranslations('cases.index')
  const href = `/case-studies/${item.slug}`
  const heading = `h${headingLevel}` as 'h2' | 'h3'
  const long = item.metric.length > LONG_METRIC

  return (
    <Card
      sx={{
        position: 'relative',
        p: { xs: 3, md: featured ? 5 : 4 },
        display: 'grid',
        gap: 2,
        alignContent: 'start',
        height: '100%',
        minWidth: 0,
        ...(featured ? { bgcolor: 'band.bg', color: 'band.text', borderColor: 'band.border' } : {}),
        transition: 'transform var(--jt-motion-slow, 500ms), border-color var(--jt-motion-slow, 500ms)',
        '&:hover': { transform: 'translateY(-4px)', borderColor: featured ? 'primary.main' : 'text.primary' },
        'html[data-motion="paused"] &:hover': { transform: 'none' },
        '&:has(a:focus-visible)': {
          outline: '2px solid var(--jt-palette-accentText)',
          outlineOffset: '2px',
        },
      }}
    >
      {item.sector && (
        <Chip
          label={item.sector}
          size="small"
          sx={{
            justifySelf: 'start',
            maxWidth: '100%',
            height: 'auto',
            '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
            ...(featured ? { bgcolor: 'transparent', color: 'band.text', borderColor: 'band.border' } : {}),
          }}
        />
      )}
      {item.metric && (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
          <Typography
            component="p"
            sx={{
              fontSize: long ? '3rem' : '4.5rem',
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              overflowWrap: 'anywhere',
              color: featured ? 'primary.main' : 'accentText',
            }}
          >
            {item.metric}
          </Typography>
          {item.metricLabel && (
            <Typography variant="body2" sx={{ color: featured ? 'band.muted' : 'text.secondary' }}>
              {item.metricLabel}
            </Typography>
          )}
        </Box>
      )}
      <Typography variant={featured ? 'h4' : 'h6'} component={heading}>
        <Link
          component={linkFor(href)}
          href={href}
          underline="none"
          sx={{
            color: 'inherit',
            outline: 'none',
            '&::after': { content: '""', position: 'absolute', inset: 0 },
          }}
        >
          {item.title}
        </Link>
      </Typography>
      {item.subtitle && (
        <Typography variant="body2" sx={{ color: featured ? 'band.muted' : 'text.secondary', maxWidth: 640 }}>
          {item.subtitle}
        </Typography>
      )}
      <Typography
        variant="body2"
        aria-hidden="true"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          fontWeight: 600,
          mt: 1,
          color: featured ? 'primary.main' : 'accentText',
        }}
      >
        {t('viewCase')} <ArrowRight size={16} />
      </Typography>
    </Card>
  )
}
