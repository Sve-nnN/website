'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

import { Crumbs, type Crumb } from './Crumbs'
import { GrainBlob } from './GrainBlob'

type Props = {
  crumbs: Crumb[]
  eyebrow?: string
  title: string
  lead?: string
  children?: ReactNode
  aside?: ReactNode
  /** Variante para paginas legales y busqueda: h1 mas bajo. */
  compact?: boolean
}

/**
 * Cabecera de paginas interiores: migas, eyebrow, h1, lead y un blob de grano
 * difuminado. Emite exactamente un h1 (`#page-title`) al que apunta
 * `aria-labelledby`. Nunca declara un landmark principal: el layout pone el unico main.
 *
 * Escala vertical de UI-SPEC: pt 128 y 160, pb 48 y 80.
 */
export function PageHero({ crumbs, eyebrow, title, lead, children, aside, compact }: Props) {
  return (
    <Box
      component="section"
      aria-labelledby="page-title"
      sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 16, md: 20 }, pb: { xs: 6, md: 10 } }}
    >
      <GrainBlob
        feather={28}
        sx={{
          width: { xs: 360, md: 560 },
          aspectRatio: '1',
          right: { xs: -160, md: -120 },
          top: { xs: -140, md: -200 },
          opacity: 0.55,
          zIndex: 0,
        }}
      />
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: aside
            ? { xs: 'minmax(0,1fr)', md: 'minmax(0,1.15fr) minmax(0,0.85fr)' }
            : 'minmax(0,1fr)',
          gap: { xs: 5, md: 8 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'grid', gap: 3, justifyItems: 'start', minWidth: 0 }}>
          <Crumbs items={crumbs} />
          {eyebrow && (
            <Typography variant="overline" sx={{ color: 'accentText' }}>
              {eyebrow}
            </Typography>
          )}
          <Typography
            id="page-title"
            variant="h1"
            component="h1"
            sx={{
              maxWidth: 820,
              ...(compact ? { fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.1 } : {}),
            }}
          >
            {title}
          </Typography>
          {lead && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.25rem', lineHeight: '1.875rem', maxWidth: 720 }}
            >
              {lead}
            </Typography>
          )}
          {children}
        </Box>
        {aside}
      </Container>
    </Box>
  )
}
