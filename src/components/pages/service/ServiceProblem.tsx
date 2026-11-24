import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { extractHeadings, type LexicalRootLike } from '@/components/mui/rich-text/lexical-toc'

/**
 * Problema que resuelve el servicio: el primer `content` del layout. El h2 es el
 * primer encabezado h2 del rich text (con el id que le pone MuiRichText), asi
 * que la region se nombra con ese mismo id. Sin h2 no se declara aria-labelledby.
 *
 * Section no sirve aqui: arma el id `${id}-t` y el del encabezado sale del texto.
 * Server Component: solo objetos sx planos.
 */
export function ServiceProblem({ richTexts }: { richTexts: unknown[] }) {
  const docs = richTexts as Array<SerializedEditorState | null | undefined>
  // Normalmente el bloque trae una columna; si trae mas, todas se renderizan.
  const firstH2 = docs
    .map((d) => extractHeadings(d?.root as unknown as LexicalRootLike, [2])[0])
    .find(Boolean)
  return (
    <Box
      component="section"
      aria-labelledby={firstH2?.id}
      sx={{ pb: { xs: 8, md: 10 } }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            maxWidth: 760,
            '& p': { color: 'text.secondary', fontSize: '1.125rem', lineHeight: '1.75rem' },
          }}
        >
          {docs.map((data, i) => (
            <MuiRichText key={i} data={data} maxWidth={760} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}
