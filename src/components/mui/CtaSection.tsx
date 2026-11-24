'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

import { CtaPanel, type CtaPanelProps } from './CtaPanel'

/**
 * Cierre de conversion de las paginas. El `id="contacto"` va en este
 * contenedor (un div): los enlaces `#contacto` de la home y `/#contacto` del
 * resto del sitio caen aqui. La region etiquetada es CtaPanel, por su h2.
 * Sin titulo no renderiza nada.
 */
export function CtaSection(props: Partial<CtaPanelProps>) {
  const { title, email } = props
  if (!title || !email) return null
  return (
    <Box id="contacto" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <CtaPanel {...props} title={title} email={email} />
      </Container>
    </Box>
  )
}
