// Server Component a propósito: sin 'use client'. Convierte Lexical a elementos
// React que escapan el texto por defecto, así que ningún HTML se inyecta en
// crudo (T-54-21). Es el renderizador de prosa larga que la fase 55 (blog)
// reutiliza: un solo convertidor Lexical a MUI para todo el sitio.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { useLocale, useTranslations } from 'next-intl'

import { resolveLinkHref, sanitizeHref, type NavLinkInput } from '@/lib/nav-links'
import { buildRichTextConverters, richTextConverters } from '@/components/richTextBlockConverters'
import { rewriteIncompleteEnPostHref } from '@/lib/translation-gaps'

import { AppLink } from '@/components/static/AppLink'

import { muiBlockConverters, type RichTextOverrides, type Translate } from './blocks'
import { buildHeadingIdMap, type LexicalNodeLike, type LexicalRootLike } from './lexical-toc'

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
  /**
   * Convertidores de bloque que se combinan sobre los de la base y sobre los de
   * MUI de este archivo. Con `ctx` el valor por defecto es
   * `muiBlockConverters(...)` (bloques del post re-vestidos con MUI); sin `ctx`
   * no hay overrides y se mantiene el comportamiento de la fase 54 (Privacy y
   * Terms).
   */
  overrides?: RichTextOverrides
}

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

export function MuiRichText({ data, maxWidth = 760, headingIds, ctx, overrides }: Props) {
  const t = useTranslations('common')
  const tRichText = useTranslations('richText')
  const tEmailCapture = useTranslations('emailCapture')
  const tStackPage = useTranslations('stackPage')
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
    const rawHref =
      fields?.linkType === 'internal'
        ? resolveLinkHref({ type: 'reference', reference: fields.doc }, locale)
        : sanitizeHref(fields?.url, locale)
    // Fase 57 (D-04 F4): un enlace del contenido al gemelo EN noindex de un post
    // de EN_TRANSLATION_INCOMPLETE apunta a la versión ES canónica.
    const href = rawHref ? rewriteIncompleteEnPostHref(rawHref) : rawHref
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
        <a key={key} className="jt-link jt-link--always" href={href} target="_blank" rel="noopener noreferrer">
          {children}
          <span className="jt-sr-only">{` (${t('opensInNewTab')})`}</span>
        </a>
      )
    }
    if (sameSite) {
      return (
        <a key={key} className="jt-link jt-link--always" href={href}>
          {children}
        </a>
      )
    }
    return (
      <AppLink key={key} className="jt-link jt-link--always" href={href}>
        {children}
      </AppLink>
    )
  }

  // Parte de los convertidores del sitio (code-block, faq, affiliate-inline,
  // tabla con encabezado y baja de h1 a h2) para no perder contenido indexable
  // (SEO-03) y reemplaza solo lo que cambia con MUI.
  const blockOverrides: RichTextOverrides | undefined =
    overrides ??
    (ctx
      ? muiBlockConverters({
          locale,
          t: {
            richText: tRichText as unknown as Translate,
            common: t as unknown as Translate,
            emailCapture: tEmailCapture as unknown as Translate,
            stackPage: tStackPage as unknown as Translate,
          },
          postPath: ctx.postPath,
          subscribedState: ctx.subscribedState,
        })
      : undefined)

  const converters: JSXConvertersFunction = (args) => {
    const base = ctx ? buildRichTextConverters(ctx)(args) : richTextConverters(args)
    const extra = blockOverrides?.(args)
    return {
      ...base,
      ...(extra?.table ? { table: extra.table } : {}),
      blocks: { ...base.blocks, ...extra?.blocks },
      heading: (a) => {
        const node = a.node as unknown as LexicalNodeLike
        const id = idByNode.get(node)
        const { nodesToJSX } = a
        const children = nodesToJSX({ nodes: a.node.children })
        // Un h1 del cuerpo se renderiza como h2 (SEO-44) y, al estar en el
        // mapa de ids, lleva id y entra al índice.
        if ((node.tag === 'h2' || node.tag === 'h1') && id) {
          return (
            <h2 className="jt-h4 jt-prose__h2" id={id}>
              {children}
            </h2>
          )
        }
        if (node.tag === 'h3' && id) {
          return (
            <h3 className="jt-h5 jt-prose__h3" id={id}>
              {children}
            </h3>
          )
        }
        // h4 a h6 (y un h1 sin id): convertidor del sitio (baja h1 a h2, SEO-44).
        const fallback = base.heading as (x: typeof a) => ReactNode
        return fallback(a)
      },
      paragraph: ({ node, nodesToJSX }) => {
        const children = nodesToJSX({ nodes: node.children })
        if (!children?.length) return <br />
        return <p className="jt-body1 jt-prose__p">{children}</p>
      },
      list: ({ node, nodesToJSX }) => {
        const n = node as unknown as ListNode
        const children = nodesToJSX({ nodes: node.children })
        const List = n.tag === 'ol' ? 'ol' : 'ul'
        return (
          <List className="jt-prose__list" role="list">
            {children}
          </List>
        )
      },
      listitem: ({ node, nodesToJSX }) => {
        const n = node as unknown as ListItemNode
        const hasSubLists = (n.children ?? []).some((c) => c.type === 'list')
        const children = nodesToJSX({ nodes: node.children })
        return (
          <li
            className={hasSubLists ? 'jt-body1 jt-prose__li jt-prose__li--nested' : 'jt-body1 jt-prose__li'}
            value={n.value}
          >
            {children}
          </li>
        )
      },
      link: ({ node, nodesToJSX }) =>
        renderLink((node as unknown as { fields?: LinkFields }).fields, nodesToJSX({ nodes: node.children })),
      autolink: ({ node, nodesToJSX }) =>
        renderLink((node as unknown as { fields?: LinkFields }).fields, nodesToJSX({ nodes: node.children })),
      quote: ({ node, nodesToJSX }) => (
        <blockquote className="jt-body1 jt-prose__quote">{nodesToJSX({ nodes: node.children })}</blockquote>
      ),
    }
  }

  return (
    // Un texto largo sin espacios (una URL pegada tal cual en un parrafo, medido
    // en /blog/development/que-es-css) no debe ensanchar la pagina: `jt-prose`
    // parte la palabra solo cuando no cabe, sin cambiar el ancho minimo de las
    // tablas, que siguen desplazandose dentro de ScrollRegion. Lo que no pasa por
    // un convertidor (h4 a h6, codigo en linea) lo viste la misma clase.
    <div className="jt-prose" style={{ maxWidth }}>
      <RichText data={data} converters={converters} disableContainer />
    </div>
  )
}
