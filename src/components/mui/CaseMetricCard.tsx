'use client'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { linkFor } from './links'

type Props = {
  href: string
  /** Sector del caso, ya pasado por `formatSector`. */
  tag?: string | null
  /** Cifra, ya separada por `splitHeroMetric` ("+406 %"). */
  metric: string
  title: string
  /** Etiqueta bajo la cifra ("clics interanuales"). */
  suffix?: string | null
  /** `band` sobre una franja oscura, `paper` sobre el fondo de la pagina. */
  tone?: 'band' | 'paper'
  as?: 'li' | 'div'
}

/**
 * Tarjeta de resultado de un caso con la cifra a 72px. El enlace vive en el
 * titulo y se estira con `::after` a toda la tarjeta; su `outline` queda en
 * none y el foco se dibuja en la tarjeta con `:has(a:focus-visible)`. El
 * nombre accesible del enlace es el titulo visible.
 */
export function CaseMetricCard({ href, tag, metric, title, suffix, tone = 'band', as = 'li' }: Props) {
  const band = tone === 'band'
  return (
    <Box
      component={as}
      sx={{
        position: 'relative',
        p: 4,
        borderRadius: 2,
        border: 1,
        borderColor: band ? 'band.border' : 'divider',
        bgcolor: band ? 'band.surface' : 'background.paper',
        color: band ? 'band.text' : 'text.primary',
        display: 'grid',
        // La columna y la tarjeta no crecen con su contenido: un sector largo
        // ("Manufactura / Materiales de construccion artesanal") sacaba la tarjeta
        // de la pantalla a 320 px (hallazgo de 55-10 con el respaldo de la home).
        gridTemplateColumns: 'minmax(0,1fr)',
        minWidth: 0,
        gap: 2,
        alignContent: 'start',
        transition: 'transform var(--jt-motion-slow, 500ms), border-color var(--jt-motion-slow, 500ms)',
        '&:hover': { borderColor: 'text.primary', transform: 'translateY(-4px)' },
        'html[data-motion="paused"] &:hover': { transform: 'none' },
        '&:has(a:focus-visible)': {
          outline: '2px solid var(--jt-palette-accentText)',
          outlineOffset: '2px',
        },
      }}
    >
      {tag && (
        <Chip
          label={tag}
          size="small"
          sx={{
            justifySelf: 'start',
            maxWidth: '100%',
            height: 'auto',
            // El rotulo del sector puede ocupar varias lineas en pantallas angostas.
            '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
            ...(band ? { bgcolor: 'transparent', color: 'band.text', borderColor: 'band.border' } : {}),
          }}
        />
      )}
      <Typography
        component="p"
        sx={{
          fontSize: '4.5rem',
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: band ? 'primary.main' : 'accentText',
        }}
      >
        {metric}
      </Typography>
      <Typography variant="h6" component="h3">
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
          {title}
        </Link>
      </Typography>
      {suffix && (
        <Typography variant="body2" sx={{ color: band ? 'band.muted' : 'text.secondary' }}>
          {suffix}
        </Typography>
      )}
    </Box>
  )
}
