import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { Check } from 'lucide-react'

import { UL } from '@/components/mui/lists'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'

import { singleNodeRoot, splitColumn } from './column-parts'

/**
 * Que incluye: columna 1 del segundo `content`. El encabezado h3 de la columna
 * se promueve a h2; cada nodo con texto es un item de una lista con marca de
 * verificacion en circulo de 32px y el texto al lado. Sin tarjetas ni fondos
 * por item: el CMS solo trae parrafos, no se inventan tarjetas.
 *
 * Cada item pasa por MuiRichText sobre una raiz sintetica de un solo nodo para
 * conservar negritas y enlaces. La franja es siempre oscura (`band`), asi que
 * el texto y los enlaces del rich text se recolorean para ella.
 */
export function ServiceIncludes({ richText }: { richText: unknown }) {
  const { title, items } = splitColumn(richText)
  if (title === null && items.length === 0) return null
  return (
    <Box
      component="section"
      id="incluye"
      aria-labelledby={title ? 'incluye-t' : undefined}
      sx={{ py: { xs: 8, md: 12 }, bgcolor: 'band.bg', color: 'band.text' }}
    >
      <Container maxWidth="lg">
        {title && (
          <Typography id="incluye-t" variant="h3" component="h2" sx={{ mb: 5, maxWidth: 760 }}>
            {title}
          </Typography>
        )}
        <UL role="list" sx={{ display: 'grid', gap: 3, maxWidth: 820 }}>
          {items.map((node, i) => (
            <Box
              key={i}
              component="li"
              sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 2, alignItems: 'start' }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Check size={18} strokeWidth={3} />
              </Box>
              <Box
                sx={{
                  '& p': { color: 'inherit', mb: 0, lineHeight: '1.625rem' },
                  '& a': { color: 'primary.main' },
                }}
              >
                <MuiRichText data={singleNodeRoot(node) as SerializedEditorState} maxWidth={760} />
              </Box>
            </Box>
          ))}
        </UL>
      </Container>
    </Box>
  )
}
