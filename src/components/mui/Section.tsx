'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type Props = {
  id: string
  title?: string
  lead?: string
  /** Franja con `band.bg`. Implica padding vertical doble. */
  band?: boolean
  children: ReactNode
  /** Padding superior en unidades de tema cuando no es band ni py. */
  pt?: number
  /** Padding vertical doble (80 y 96px en md segun la escala de seccion). */
  py?: boolean
}

/**
 * Seccion base con `aria-labelledby` al id `${id}-t`. Con `title` emite el h2
 * (variante h3 del tema) con ese id. Una seccion sin `title` exige que un hijo
 * declare el id `${id}-t`; si no, el aria-labelledby quedaria colgando.
 * No declara landmark principal.
 */
export function Section({ id, title, lead, band, children, pt = 0, py }: Props) {
  const doubled = band || py
  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={`${id}-t`}
      sx={{
        py: doubled ? { xs: 8, md: 12 } : undefined,
        pt: doubled ? undefined : pt,
        pb: doubled ? undefined : { xs: 8, md: 12 },
        ...(band ? { bgcolor: 'band.bg', color: 'band.text' } : {}),
      }}
    >
      <Container maxWidth="lg">
        {title && (
          <Box sx={{ display: 'grid', gap: 2, maxWidth: 680, mb: 6 }}>
            <Typography id={`${id}-t`} variant="h3" component="h2">
              {title}
            </Typography>
            {lead && (
              <Typography
                variant="body1"
                sx={{ fontSize: '1.25rem', lineHeight: '1.875rem', color: band ? 'band.muted' : 'text.secondary' }}
              >
                {lead}
              </Typography>
            )}
          </Box>
        )}
        {children}
      </Container>
    </Box>
  )
}
