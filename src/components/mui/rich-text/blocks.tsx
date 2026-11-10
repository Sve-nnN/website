// Server Component a propósito: sin 'use client'. Re-viste con MUI los bloques
// del cuerpo de los posts (code-block, table, faq, affiliate-inline y
// email-capture) sobre los convertidores base de richTextBlockConverters.
//
// CONSTRAINT DURA (T-48-09, T-55-18, mismo hazard de TDZ documentado en
// richTextBlockConverters.tsx): este archivo no importa el renderer de rich
// text viejo, el marco de divulgación de afiliados ni el FAQ viejo, ni nada que
// los importe de forma transitiva. Solo lee `richTextBlockConverters` a través
// de MuiRichText, que ya lo importaba.
//
// T-55-23: todo el texto llega como hijo de React (se escapa solo). Ningún
// bloque usa HTML en crudo.
import type { JSXConverter, JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { CopyCodeButton } from './CopyCodeButton'
import { ScrollRegion } from '../ScrollRegion'

/** Traductor mínimo: lo que devuelve `useTranslations(namespace)` en el servidor. */
export type Translate = (key: string, values?: Record<string, string | number>) => string

/** Contexto por petición con el que MuiRichText arma los convertidores de bloque. */
export type BlockCtx = {
  /** Idioma de la página. */
  locale: 'es' | 'en'
  /** Traductores por namespace (richText, emailCapture, stackPage). */
  t: { richText: Translate; emailCapture?: Translate; stackPage?: Translate }
  /** Ruta del post para el campo oculto postPath del bloque email-capture. */
  postPath?: string
  /** Valor de ?subscribed= de la página del post. */
  subscribedState?: string
}

/** Lo que aporta este módulo sobre los convertidores base de MuiRichText. */
export type RichTextOverrides = (args: Parameters<JSXConvertersFunction>[0]) => {
  blocks?: Record<string, JSXConverter<any>>
  table?: JSXConverter<any>
}

type CodeBlockFields = {
  blockType: 'code-block'
  language?: string | null
  code?: string | null
}

/**
 * Bloque de código: contenedor oscuro con el lenguaje como rótulo y el botón
 * Copiar en la cabecera, y el `pre` dentro de ScrollRegion. El `pre` no lleva
 * tabIndex propio: ScrollRegion lo agrega solo cuando desborda, medido en el
 * navegador (A11Y.md sección 6, Pitfall 6).
 */
function renderCodeBlock(fields: CodeBlockFields, ctx: BlockCtx): ReactNode {
  const code = fields.code
  if (!code) return null
  const language = fields.language?.trim() || null

  return (
    <Box
      sx={{
        my: 3,
        borderRadius: 2,
        border: 1,
        borderColor: 'band.border',
        bgcolor: 'band.surface',
        color: 'band.text',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: language ? 'space-between' : 'flex-end',
          gap: 2,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'band.border',
        }}
      >
        {language && (
          <Typography variant="caption" component="span" sx={{ fontFamily: 'var(--font-geist-mono)', color: 'band.muted' }}>
            {language}
          </Typography>
        )}
        <CopyCodeButton code={code} />
      </Box>
      <ScrollRegion label={ctx.t.richText('codeRegionLabel')}>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            typography: 'mono',
            lineHeight: '1.5rem',
            color: 'band.text',
            // El estilo de `code` en línea de MuiRichText no aplica dentro del bloque.
            '&& code': { p: 0, border: 0, bgcolor: 'transparent', borderRadius: 0, fontSize: 'inherit' },
          }}
        >
          <code>{code}</code>
        </Box>
      </ScrollRegion>
    </Box>
  )
}

/**
 * Convertidores MUI por tipo de bloque. Cada uno conserva el contenido que
 * trae Payload sin reescribirlo; solo cambia la presentación.
 */
export function muiBlockConverters(ctx: BlockCtx): RichTextOverrides {
  return () => ({
    blocks: {
      'code-block': ({ node }: { node: { fields: CodeBlockFields } }) => renderCodeBlock(node.fields, ctx),
    },
  })
}
