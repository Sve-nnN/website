// Server Component a propósito: sin 'use client'. Convierte Lexical a elementos
// React que escapan el texto por defecto, así que ningún HTML se inyecta en
// crudo (T-54-21). Es el renderizador de prosa larga que la fase 55 (blog)
// reutiliza: un solo convertidor Lexical a MUI para todo el sitio.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { RichText } from '@payloadcms/richtext-lexical/react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useLocale, useTranslations } from 'next-intl'

import { resolveLinkHref, sanitizeHref, type NavLinkInput } from '@/lib/nav-links'
import { richTextConverters } from '@/components/richTextBlockConverters'

import { linkFor } from '../links'
import { UL, OL } from '../lists'
import { buildHeadingIdMap, type LexicalNodeLike, type LexicalRootLike } from './lexical-toc'

type Props = {
  data: SerializedEditorState | null | undefined
  /** Ancho máximo del texto en px. 760 por defecto (UI-SPEC, prosa larga). */
  maxWidth?: number
}

// Oculto a la vista y visible para el lector de pantalla. Va local porque este
// archivo es un Server Component y no puede leer valores de un módulo cliente.
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

type LinkFields = {
  url?: string | null
  newTab?: boolean | null
  linkType?: 'custom' | 'internal' | null
  doc?: NavLinkInput['reference']
}

type ListNode = { tag?: string; listType?: string; children?: unknown[] }
type ListItemNode = { children?: Array<{ type?: string }>; value?: number }

export function MuiRichText({ data, maxWidth = 760 }: Props) {
  const t = useTranslations('common')
  const locale = useLocale() === 'en' ? 'en' : 'es'

  if (!data) return null

  // El mismo recorrido que arma el índice de la página: los ids coinciden.
  const idByNode = buildHeadingIdMap(data.root as unknown as LexicalRootLike)

  function renderLink(
    fields: LinkFields | undefined,
    children: ReactNode,
    key?: string | number,
  ): ReactNode {
    const href =
      fields?.linkType === 'internal'
        ? resolveLinkHref({ type: 'reference', reference: fields.doc }, locale)
        : sanitizeHref(fields?.url, locale)
    // Esquema no permitido o sin destino: queda el texto, sin enlace (T-54-22).
    if (!href) return <span key={key}>{children}</span>

    const external = /^https?:/i.test(href) || Boolean(fields?.newTab)
    if (external) {
      return (
        <Link
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          underline="always"
          sx={{ color: 'accentText' }}
        >
          {children}
          <Box component="span" sx={visuallyHidden}>
            {` (${t('opensInNewTab')})`}
          </Box>
        </Link>
      )
    }
    return (
      <Link key={key} component={linkFor(href)} href={href} underline="always" sx={{ color: 'accentText' }}>
        {children}
      </Link>
    )
  }

  // Parte de los convertidores del sitio (code-block, faq, affiliate-inline,
  // tabla con encabezado y baja de h1 a h2) para no perder contenido indexable
  // (SEO-03) y reemplaza solo lo que cambia con MUI.
  const converters: JSXConvertersFunction = (args) => {
    const base = richTextConverters(args)
    return {
      ...base,
      heading: (a) => {
        const node = a.node as unknown as LexicalNodeLike
        const id = idByNode.get(node)
        const { nodesToJSX } = a
        const children = nodesToJSX({ nodes: a.node.children })
        if (node.tag === 'h2' && id) {
          return (
            <Typography
              variant="h4"
              component="h2"
              id={id}
              sx={{ mt: '48px', mb: 2, scrollMarginTop: '96px', color: 'text.primary' }}
            >
              {children}
            </Typography>
          )
        }
        if (node.tag === 'h3' && id) {
          return (
            <Typography
              variant="h5"
              component="h3"
              id={id}
              sx={{ mt: '32px', mb: 2, scrollMarginTop: '96px', color: 'text.primary' }}
            >
              {children}
            </Typography>
          )
        }
        // h1 y h4 a h6: convertidor del sitio (baja h1 a h2, SEO-44).
        const fallback = base.heading as (x: typeof a) => ReactNode
        return fallback(a)
      },
      paragraph: ({ node, nodesToJSX }) => {
        const children = nodesToJSX({ nodes: node.children })
        if (!children?.length) return <Box component="br" />
        return (
          <Typography variant="body1" component="p" sx={{ color: 'text.primary', mb: 2 }}>
            {children}
          </Typography>
        )
      },
      list: ({ node, nodesToJSX }) => {
        const n = node as unknown as ListNode
        const children = nodesToJSX({ nodes: node.children })
        const ordered = n.tag === 'ol'
        const List = ordered ? OL : UL
        return (
          <List
            sx={{
              listStyleType: ordered ? 'decimal' : 'disc',
              paddingLeft: '24px',
              mb: 2,
              color: 'text.primary',
            }}
          >
            {children}
          </List>
        )
      },
      listitem: ({ node, nodesToJSX }) => {
        const n = node as unknown as ListItemNode
        const hasSubLists = (n.children ?? []).some((c) => c.type === 'list')
        const children = nodesToJSX({ nodes: node.children })
        return (
          <Box
            component="li"
            value={n.value}
            sx={{
              mb: 1,
              typography: 'body1',
              ...(hasSubLists ? { listStyleType: 'none' } : {}),
              '& > ul, & > ol': { mb: 0, mt: 1 },
            }}
          >
            {children}
          </Box>
        )
      },
      link: ({ node, nodesToJSX }) =>
        renderLink((node as unknown as { fields?: LinkFields }).fields, nodesToJSX({ nodes: node.children })),
      autolink: ({ node, nodesToJSX }) =>
        renderLink((node as unknown as { fields?: LinkFields }).fields, nodesToJSX({ nodes: node.children })),
      quote: ({ node, nodesToJSX }) => (
        <Typography
          component="blockquote"
          variant="body1"
          sx={{
            m: 0,
            mb: 2,
            pl: 3,
            borderLeft: '2px solid',
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        >
          {nodesToJSX({ nodes: node.children })}
        </Typography>
      ),
    }
  }

  return (
    <Box
      sx={{
        maxWidth,
        '& > :first-child': { mt: 0 },
        // Lo que no pasa por un convertidor de MUI (h4 a h6, código en línea,
        // contenedores de bloque) hereda la tipografía del tema.
        '& h4, & h5, & h6': { mt: 3, mb: 2, color: 'text.primary' },
        '& code': {
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '0.9em',
          px: 0.5,
          borderRadius: 0.75,
          bgcolor: 'raised',
          border: 1,
          borderColor: 'divider',
        },
      }}
    >
      <RichText data={data} converters={converters} disableContainer />
    </Box>
  )
}
