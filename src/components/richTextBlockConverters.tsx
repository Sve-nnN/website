import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import React from 'react'
import { RichText, defaultJSXConverters } from '@payloadcms/richtext-lexical/react'
import { Plus } from 'lucide-react'

/**
 * Converters for the `block` nodes that live inside migrated post content.
 *
 * The old JuanPortfolio articles embedded `code-block` and `faq` blocks in
 * their Lexical body. Those node types survived the migration into
 * `posts.content`, but the frontend rendered rich text with
 * `defaultJSXConverters` only — which has no `blocks` converter — so Payload
 * logged "found code-block block, but no converter is provided" server-side
 * and rendered NOTHING. Result: 87 code samples across 19 posts and 10 FAQ
 * sections were silently missing from the published articles.
 *
 * These blocks are not registered in any `BlocksFeature`, so `payload-types`
 * has no generated type for them — the field shapes below are read straight
 * off the stored JSON (`{ language, code }` and `{ title, faqs[] }`), matching
 * what `src/blocks/Code/Component.tsx` and `src/blocks/FAQ/Component.tsx`
 * render for the same blocks when used as page blocks. Those components are
 * NOT imported here on purpose: `FAQComponent` imports `RichTextRenderer`,
 * which imports this module, and that cycle is exactly the shape that already
 * caused a production TDZ ReferenceError once (see `src/lib/sitemap-data.ts`).
 */

type CodeBlockNodeFields = {
  blockType: 'code-block'
  language?: string | null
  code?: string | null
}

type FaqBlockNodeFields = {
  blockType: 'faq'
  title?: string | null
  faqs?:
    | {
        id?: string | null
        question?: string | null
        // Lexical editor state for the answer.
        answer?: Parameters<typeof RichText>[0]['data'] | null
      }[]
    | null
}

function CodeBlockNode({ language, code }: CodeBlockNodeFields) {
  if (!code) return null

  return (
    <div className="my-6 rounded-md bg-secondary text-secondary-foreground overflow-x-auto">
      {language && (
        <div className="px-4 py-2 text-label border-b border-white/10">{language}</div>
      )}
      <pre className="p-4 text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function FaqBlockNode({ title, faqs }: FaqBlockNodeFields) {
  if (!faqs?.length) return null

  return (
    <section className="my-10">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="space-y-3">
        {faqs.map((item, i) => (
          <details
            key={item.id ?? i}
            className="group rounded-lg border border-border bg-card px-6 shadow-sm"
          >
            <summary className="cursor-pointer font-sans font-semibold text-body list-none flex items-center justify-between py-4">
              {item.question}
              <Plus
                className="ml-4 size-5 text-primary transition-transform duration-fast ease-out group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            {item.answer && (
              <div className="pb-4">
                <RichText data={item.answer} converters={richTextConverters} />
              </div>
            )}
          </details>
        ))}
      </div>
    </section>
  )
}

/**
 * Tabla con fila de encabezado, aunque el dato no la declare.
 *
 * El conversor oficial decide `<th>` contra `<td>` leyendo `node.headerState`.
 * En las tablas que vinieron de la migración ese campo es `undefined` (se ve en
 * el HTML servido como `lexical-table-cell-header-undefined`), así que TODAS
 * las celdas salían `<td>` y ocho artículos fallaban el audit `td-has-header`:
 * una tabla sin encabezados es, para un lector de pantalla, una grilla de
 * valores sueltos sin decir de qué son.
 *
 * La regla: si NINGUNA celda de la tabla declara `headerState`, la primera fila
 * se trata como encabezado. Si alguna lo declara, se respeta el dato y esto no
 * hace nada. En artículos técnicos la primera fila es el encabezado
 * prácticamente siempre, y la alternativa de hoy no es "sin suposición", es
 * "ningún encabezado", que ya sabemos que está mal.
 *
 * `scope="col"` es lo que convierte el `<th>` en algo útil: sin él, un lector
 * de pantalla sabe que la celda es encabezado pero no de qué columna.
 */
type TableCellNode = {
  headerState?: number
  colSpan?: number
  rowSpan?: number
  backgroundColor?: string | null
  children?: unknown[]
}

type TableRowNode = { children?: TableCellNode[] }

type TableNode = { children?: TableRowNode[] }

function tableDeclaresHeaders(node: TableNode): boolean {
  return (node.children ?? []).some((row) =>
    (row.children ?? []).some((cell) => typeof cell.headerState === 'number' && cell.headerState > 0),
  )
}

const CELL_STYLE = { border: '1px solid #ccc', padding: '8px' } as const

function TableFromNode({
  node,
  nodesToJSX,
}: {
  node: TableNode
  nodesToJSX: (args: { nodes: unknown[] }) => React.ReactNode
}) {
  const rows = node.children ?? []
  const declaresHeaders = tableDeclaresHeaders(node)

  const renderRow = (row: TableRowNode, rowIndex: number) => {
    const isHeaderRow = !declaresHeaders && rowIndex === 0

    return (
      <tr key={rowIndex} className="lexical-table-row">
        {(row.children ?? []).map((cell, cellIndex) => {
          const isHeaderCell = isHeaderRow || (cell.headerState ?? 0) > 0
          const Cell = isHeaderCell ? 'th' : 'td'

          return (
            <Cell
              key={cellIndex}
              className="lexical-table-cell"
              scope={isHeaderCell ? 'col' : undefined}
              colSpan={cell.colSpan && cell.colSpan > 1 ? cell.colSpan : undefined}
              rowSpan={cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined}
              style={{ ...CELL_STYLE, backgroundColor: cell.backgroundColor || undefined }}
            >
              {nodesToJSX({ nodes: (cell.children ?? []) as unknown[] })}
            </Cell>
          )
        })}
      </tr>
    )
  }

  const [firstRow, ...restRows] = rows

  return (
    // `overflow-x-auto`: una tabla de cinco columnas en un telefono desborda
    // el ancho de la pagina entera si no scrollea dentro de su propio marco.
    <div className="lexical-table-container my-6 overflow-x-auto">
      <table className="lexical-table" style={{ borderCollapse: 'collapse' }}>
        {!declaresHeaders && firstRow ? (
          <>
            <thead>{renderRow(firstRow, 0)}</thead>
            <tbody>{restRows.map((row, i) => renderRow(row, i + 1))}</tbody>
          </>
        ) : (
          <tbody>{rows.map(renderRow)}</tbody>
        )}
      </table>
    </div>
  )
}

export const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...defaultJSXConverters,
  blocks: {
    'code-block': ({ node }: { node: { fields: CodeBlockNodeFields } }) => (
      <CodeBlockNode {...node.fields} />
    ),
    faq: ({ node }: { node: { fields: FaqBlockNodeFields } }) => <FaqBlockNode {...node.fields} />,
  },
  table: ({ node, nodesToJSX }) => (
    <TableFromNode node={node as TableNode} nodesToJSX={nodesToJSX as never} />
  ),
})
