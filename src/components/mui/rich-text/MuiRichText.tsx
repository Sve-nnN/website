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
import { buildRichTextConverters, richTextConverters } from '@/components/richTextBlockConverters'

import { UL, OL } from '../lists'
import { buildHeadingIdMap, type LexicalNodeLike, type LexicalRootLike } from './lexical-toc'
import { RichTextLink } from './RichTextLink'

type Props = {
  data: SerializedEditorState | null | undefined
  /** Ancho máximo del texto en px. 760 por defecto (UI-SPEC, prosa larga). */
  maxWidth?: number
  /**
   * Mapa de la referencia del nodo a su id, calculado UNA vez sobre el cuerpo
   * completo con `buildHeadingIdMap`. Las dos mitades de un cuerpo partido por
   * `splitContentForOffer` comparten los nodos hijos por referencia, así que
   * con el mismo mapa comparten numeración y no repiten ids. Sin esta prop se
   * calcula sobre `data.root` (comportamiento de la fase 54).
   */
  headingIds?: Map<object, string>
  /**
   * Contexto por petición para los bloques que lo necesitan (captura de
   * email). Con `ctx` los convertidores se componen sobre
   * `buildRichTextConverters(ctx)`; sin él se usa el conjunto estático y el
   * bloque `email-capture` no se pinta (Privacy y Terms no lo llevan).
   */
  ctx?: { subscribedState?: string; postPath?: string }
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

// Hosts del propio sitio. Comparación por hostname exacto contra este conjunto,
// nunca por "contiene": juan-tech.com.evil.com no es del sitio (T-55-17).
const SITE_HOSTS = new Set(['juan-tech.com', 'www.juan-tech.com'])

/** True si `href` es absoluto y su hostname es uno de los hosts del sitio. */
function isSameSiteHref(href: string): boolean {
  if (!/^https?:/i.test(href)) return false
  try {
    return SITE_HOSTS.has(new URL(href).hostname.toLowerCase())
  } catch {
    return false
  }
}

type ListNode = { tag?: string; listType?: string; children?: unknown[] }
type ListItemNode = { children?: Array<{ type?: string }>; value?: number }

export function MuiRichText({ data, maxWidth = 760, headingIds, ctx }: Props) {
  const t = useTranslations('common')
  const locale = useLocale() === 'en' ? 'en' : 'es'

  if (!data) return null

  // El mismo recorrido que arma el índice de la página: los ids coinciden. Si
  // la página ya calculó el mapa sobre el cuerpo completo, se usa ese.
  const idByNode: Map<object, string> =
    headingIds ?? buildHeadingIdMap(data.root as unknown as LexicalRootLike)

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

    // Producción sirve los enlaces absolutos al propio sitio en la misma pestaña
    // y con el href intacto (Pitfall 1 de 55-RESEARCH.md): se mantienen así. En
    // el preview llevan a producción. Solo otro host o `fields.newTab` abren
    // una pestaña nueva.
    const sameSite = isSameSiteHref(href)
    const external = (/^https?:/i.test(href) && !sameSite) || Boolean(fields?.newTab)
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
    if (sameSite) {
      return (
        <Link key={key} href={href} underline="always" sx={{ color: 'accentText' }}>
          {children}
        </Link>
      )
    }
    return (
      <RichTextLink key={key} href={href}>
        {children}
      </RichTextLink>
    )
  }

  // Parte de los convertidores del sitio (code-block, faq, affiliate-inline,
  // tabla con encabezado y baja de h1 a h2) para no perder contenido indexable
  // (SEO-03) y reemplaza solo lo que cambia con MUI.
  const converters: JSXConvertersFunction = (args) => {
    const base = ctx ? buildRichTextConverters(ctx)(args) : richTextConverters(args)
    return {
      ...base,
      heading: (a) => {
        const node = a.node as unknown as LexicalNodeLike
        const id = idByNode.get(node)
        const { nodesToJSX } = a
        const children = nodesToJSX({ nodes: a.node.children })
        // Un h1 del cuerpo se renderiza como h2 (SEO-44) y, al estar en el
        // mapa de ids, lleva id y entra al índice.
        if ((node.tag === 'h2' || node.tag === 'h1') && id) {
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
        // h4 a h6 (y un h1 sin id): convertidor del sitio (baja h1 a h2, SEO-44).
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
