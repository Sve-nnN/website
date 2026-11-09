'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { linkFor } from '@/components/mui/links'

type Props = {
  /** Texto del bloque ya renderizado en servidor con MuiRichText. */
  children: ReactNode
  /** Enlace del bloque, ya saneado con `resolveLinkHref`. Sin el no hay boton. */
  link: { label: string; href: string } | null
}

/**
 * Banda del callToAction intermedio: tarjeta `raised` con el texto del bloque y
 * un boton hacia su enlace. No lleva formulario: la pagina tiene uno solo, el
 * del cierre (CtaSection, `id="contacto"`).
 */
export function ServiceCtaBand({ children, link }: Props) {
  return (
    <Box sx={{ pb: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Card
          sx={{
            bgcolor: 'raised',
            p: { xs: 3, md: 4 },
            display: 'grid',
            gap: 3,
            alignItems: 'center',
            gridTemplateColumns: link ? { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) auto' } : 'minmax(0,1fr)',
          }}
        >
          <Box sx={{ '& p': { mb: 0, fontSize: '1.125rem', lineHeight: '1.75rem' } }}>{children}</Box>
          {link && (
            <Button
              component={linkFor(link.href)}
              href={link.href}
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={20} aria-hidden="true" />}
            >
              {link.label}
            </Button>
          )}
        </Card>
      </Container>
    </Box>
  )
}
