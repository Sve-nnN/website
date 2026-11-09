import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

import { OL } from '@/components/mui/lists'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'

import { singleNodeRoot, splitColumn } from './column-parts'

/**
 * Como trabajo: columna 2 del segundo `content`. El encabezado h3 se promueve a
 * h2 y cada nodo con texto es un paso de una lista ordenada con numeral mono
 * 01, 02 de 36px (decorativo, `aria-hidden`: la numeracion la da el `ol`).
 */
export function ServiceHow({ richText }: { richText: unknown }) {
  const { title, items } = splitColumn(richText)
  if (title === null && items.length === 0) return null
  return (
    <Box
      component="section"
      id="como"
      aria-labelledby={title ? 'como-t' : undefined}
      sx={{ py: { xs: 8, md: 12 } }}
    >
      <Container maxWidth="lg">
        {title && (
          <Typography id="como-t" variant="h3" component="h2" sx={{ mb: 5, maxWidth: 760 }}>
            {title}
          </Typography>
        )}
        <OL role="list" sx={{ display: 'grid', gap: 3, maxWidth: 820 }}>
          {items.map((node, i) => (
            <Box
              key={i}
              component="li"
              sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 3, alignItems: 'start' }}
            >
              <Typography
                aria-hidden="true"
                component="span"
                sx={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '2.25rem',
                  lineHeight: 1,
                  fontWeight: 600,
                  color: 'accentText',
                  minWidth: 56,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Box sx={{ '& p': { mb: 0, fontSize: '1rem', lineHeight: '1.5rem' } }}>
                <MuiRichText data={singleNodeRoot(node)} maxWidth={820} />
              </Box>
            </Box>
          ))}
        </OL>
      </Container>
    </Box>
  )
}
