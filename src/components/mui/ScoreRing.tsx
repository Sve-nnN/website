'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export type ScoreBand = 'good' | 'mid' | 'poor'
export const bandOf = (v: number): ScoreBand => (v >= 90 ? 'good' : v >= 50 ? 'mid' : 'poor')
const palette = { good: 'success', mid: 'warning', poor: 'error' } as const

export const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

type Props = {
  /** Puntaje 0 a 100. `null` o no finito: el anillo no se pinta. */
  value: number | null | undefined
  label: string
  /** Sufijo accesible ("de 100"). Lo pasa el llamador desde messages. */
  srSuffix: string
  size?: number
  as?: 'li' | 'div'
}

/**
 * Anillo de puntaje tipo Lighthouse. El dato es el numero en texto; el anillo
 * y el color refuerzan, nunca llevan la informacion solos (SC 1.4.1).
 * Sin valor numerico no devuelve marcado (el doc juan-tech-com trae los cuatro
 * puntajes en null).
 */
export function ScoreRing({ value, label, srSuffix, size = 48, as = 'li' }: Props) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const score = Math.min(100, Math.max(0, value))
  const color = `var(--jt-palette-${palette[bandOf(score)]}-main)`
  return (
    <Box component={as} sx={{ display: 'grid', justifyItems: 'center', gap: 1, textAlign: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color,
          background: `conic-gradient(${color} ${score}%, var(--jt-palette-raised) 0)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: size > 60 ? 6 : 4,
            borderRadius: '50%',
            background: 'var(--jt-palette-background-paper)',
          },
        }}
      >
        <Typography
          variant="mono"
          component="b"
          sx={{ position: 'relative', fontWeight: 600, fontSize: size > 60 ? '1.5rem' : '1rem', color: 'inherit' }}
        >
          {score}
          <Box component="span" sx={visuallyHidden}>
            {` ${srSuffix}`}
          </Box>
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}
