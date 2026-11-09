// Modulo puro (sin React): parte la columna de un bloque `content` en su
// encabezado y sus items, para que Que incluye y Como trabajo rendericen cada
// parrafo como un item sin perder ningun nodo. Importa solo el helper puro de
// texto de encabezados.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { headingText, type LexicalNodeLike } from '@/components/mui/rich-text/lexical-toc'

type RootLike = { root?: { children?: LexicalNodeLike[] } } | null | undefined

export type ColumnParts = {
  /** Texto plano del primer encabezado de la columna, o null si no hay. */
  title: string | null
  /** Resto de nodos, en orden, sin parrafos vacios. */
  items: LexicalNodeLike[]
}

/**
 * El primer nodo `heading` es el titulo de la seccion (h3 en el admin,
 * promovido a h2 en la vista). Todo otro nodo con texto es un item; un parrafo
 * vacio (solo salto de linea) no es contenido y se omite.
 */
export function splitColumn(richText: unknown): ColumnParts {
  const children = (richText as RootLike)?.root?.children ?? []
  let title: string | null = null
  const items: LexicalNodeLike[] = []
  for (const node of children) {
    if (title === null && node.type === 'heading') {
      const text = headingText(node).trim()
      if (text !== '') {
        title = text
        continue
      }
    }
    if (node.type === 'paragraph' && headingText(node).trim() === '') continue
    items.push(node)
  }
  return { title, items }
}

/** Raiz sintetica con un solo nodo: MuiRichText conserva negritas y enlaces de ese parrafo. */
export function singleNodeRoot(node: LexicalNodeLike): SerializedEditorState {
  return {
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [node] },
  } as unknown as SerializedEditorState
}
