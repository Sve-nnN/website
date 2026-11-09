// Server Component a proposito (sin directiva de cliente). Vista compartida por las dos
// rutas legales (/privacy y /terms). El texto de Payload no se toca: solo se
// cambia la capa visual y se agrega un indice con anclas por id de encabezado.
//
// Los rich text de todas las columnas del doc se combinan en UNA raiz sintetica
// (los `children` de cada raiz, en orden). Asi el deduplicado de ids es global
// y el indice sale de la misma raiz que se renderiza: cada href del indice
// coincide con un id del texto (Pitfall 11 de 54-RESEARCH.md).
//
// Sin landmark principal (lo pone el layout), sin listas sueltas y sin linea de
// ultima actualizacion: no hay dato y no se usa la fecha de modificacion del doc
// (UI-SPEC, Privacy y Terms). Esa linea queda para la fase 56.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

import { PageHero } from '@/components/mui/PageHero'
import type { Crumb } from '@/components/mui/Crumbs'
import { extractHeadings, type LexicalRootLike } from '@/components/mui/rich-text/lexical-toc'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { Toc } from '@/components/mui/rich-text/Toc'

type Props = {
  title: string
  crumbs: Crumb[]
  /** Un estado Lexical por columna del doc, en orden. */
  richTexts: Array<SerializedEditorState | null | undefined>
  eyebrow: string
  /** Nombre del indice (messages legal.tocLabel). */
  tocLabel: string
}

type ColumnLike = { richText?: unknown } | null | undefined
type BlockLike = { blockType?: string; columns?: ColumnLike[] | null } | null | undefined

/**
 * Rich text de las columnas de todos los bloques `content` del layout, en
 * orden. Las dos rutas legales leen el doc igual, asi que la extraccion vive
 * aqui y no se duplica.
 */
export function extractLegalRichTexts(
  layout: ReadonlyArray<unknown> | null | undefined,
): SerializedEditorState[] {
  const out: SerializedEditorState[] = []
  for (const raw of layout ?? []) {
    const block = raw as BlockLike
    if (block?.blockType !== 'content') continue
    for (const col of block.columns ?? []) {
      const state = col?.richText as SerializedEditorState | null | undefined
      if (state?.root && Array.isArray(state.root.children)) out.push(state)
    }
  }
  return out
}

/** Combina las raices en una sola. Conserva la referencia de cada nodo hijo. */
export function combineRichTexts(
  richTexts: Array<SerializedEditorState | null | undefined>,
): SerializedEditorState | null {
  const children = richTexts.flatMap((s) => (s?.root?.children ?? []) as unknown[])
  if (children.length === 0) return null
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children,
    },
  } as unknown as SerializedEditorState
}

export function LegalView({ title, crumbs, richTexts, eyebrow, tocLabel }: Props) {
  const combined = combineRichTexts(richTexts)
  const items = combined ? extractHeadings(combined.root as unknown as LexicalRootLike) : []
  const hasToc = items.length >= 2

  return (
    <>
      <PageHero compact crumbs={crumbs} eyebrow={eyebrow} title={title} />
      <Box sx={{ pb: { xs: 8, md: 12 } }}>
        <Container
          maxWidth="lg"
          sx={{
            display: 'grid',
            gridTemplateColumns: hasToc
              ? { xs: 'minmax(0,1fr)', lg: 'minmax(0,760px) 260px' }
              : 'minmax(0,760px)',
            justifyContent: hasToc ? 'space-between' : 'start',
            columnGap: 8,
            rowGap: 2,
          }}
        >
          {hasToc && (
            <Box sx={{ gridColumn: { lg: 2 }, gridRow: { lg: 1 } }}>
              <Toc items={items} label={tocLabel} />
            </Box>
          )}
          <Box sx={{ gridColumn: { lg: 1 }, gridRow: { lg: 1 }, minWidth: 0 }}>
            <MuiRichText data={combined} />
          </Box>
        </Container>
      </Box>
    </>
  )
}
