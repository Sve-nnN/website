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
  /**
   * Id del hijo que da nombre a la región cuando no hay `title`. Sin `title` ni
   * `labelledBy` la sección no emite `aria-labelledby` (IN-09 de 54-REVIEW.md).
   */
  labelledBy?: string
  /** Padding superior en unidades de tema cuando no es band ni py. */
  pt?: number
  /** Padding vertical doble (80 y 96px en md segun la escala de seccion). */
  py?: boolean
}

/**
 * Seccion base. Con `title` emite el h2 (variante h3 del tema) con id
 * `${id}-t` y la región se nombra con él. Sin `title`, la región se nombra con
 * el hijo cuyo id llega en `labelledBy`; sin ninguno de los dos se omite
 * `aria-labelledby`, de modo que nunca queda apuntando a un id inexistente.
 * No declara landmark principal.
 */
export function Section({ id, title, lead, band, children, labelledBy, pt = 0, py }: Props) {
  const doubled = band || py
  const nameId = title ? `${id}-t` : labelledBy
  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={nameId}
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
