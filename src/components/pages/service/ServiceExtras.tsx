import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AUDITOR_URL } from '@/lib/auditor'

// Oculto a la vista, visible para el lector de pantalla (Server Component:
// no puede leer valores de un modulo cliente).
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

type Props = {
  heading?: string | null
  narrative: string
}

/**
 * Extra de la landing de auditoria (bloque auditorCallout): tarjeta `raised`
 * con el h3 del bloque, la narrativa y un boton outlined externo al auditor
 * automatizado. El destino es AUDITOR_URL (dato fijo del producto de Juan, no
 * contenido editable) con el mismo texto de messages que el componente
 * anterior. Enlace externo: rel noopener noreferrer y aviso de pestana nueva.
 */
export function ServiceExtras({ heading, narrative }: Props) {
  const t = useTranslations('auditorCallout')
  const c = useTranslations('common')
  return (
    <Box component="section" aria-labelledby="extras-t" sx={{ pb: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Card sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2, justifyItems: 'start', maxWidth: 820, bgcolor: 'raised' }}>
          <Typography id="extras-t" variant="h5" component="h3">
            {heading?.trim() || t('heading')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {narrative}
          </Typography>
          <Button
            href={AUDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            endIcon={<ExternalLink size={16} aria-hidden="true" />}
          >
            {t('cta')}
            <Box component="span" sx={visuallyHidden}>{` (${c('opensInNewTab')})`}</Box>
          </Button>
        </Card>
      </Container>
    </Box>
  )
}
