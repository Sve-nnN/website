// Módulo puro: sin React, sin Payload y sin next-intl. Lo importan el
// renderizador (MuiRichText, en servidor) y las páginas que arman el índice,
// así que ambos sacan los ids de la MISMA función y las anclas coinciden por
// construcción (Pitfall 11 de 54-RESEARCH.md). La fase 55 lo reutiliza.

/** Forma mínima de un nodo Lexical serializado. */
export type LexicalNodeLike = {
  type?: string
  tag?: string
  text?: string
  children?: LexicalNodeLike[]
}

/** Forma mínima de `root` de un SerializedEditorState. */
export type LexicalRootLike = {
  children?: LexicalNodeLike[]
}

export type HeadingEntry = {
  id: string
  text: string
  level: number
}

/**
 * Mismo algoritmo que `slugify` de postUtils.ts del sandbox: minúsculas, sin
 * acentos, todo lo no alfanumérico a guion, sin guiones en los bordes y tope
 * de 60 caracteres.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/** Texto plano de un nodo: concatena el texto de los hijos de forma recursiva. */
export function headingText(node: LexicalNodeLike): string {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(headingText).join('')
}

/**
 * Ids que ya declara la página y que un encabezado del cuerpo nunca debe usar:
 * el slug "contacto" colisionaría con la sección de contacto, "main-content"
 * con el destino del enlace de salto y "page-title" con el h1 de la página
 * (Pitfall 2 de 55-RESEARCH.md; hoy ninguno choca, es prevención) y los ids fijos
 * que declara la vista del post (`post-*`). Un slug
 * reservado se numera como un duplicado (`contacto-2`).
 */
export const RESERVED_IDS: ReadonlySet<string> = new Set([
  'contacto',
  'main-content',
  'page-title',
  // Ids fijos de la vista del post (fase 55-11): el articulo y sus secciones.
  'post-body',
  'post-disclosure',
  'post-author-t',
  'post-related-t',
  'post-nav-t',
])

/** Niveles que entran al índice y reciben id por defecto: h1, h2 y h3. */
export const DEFAULT_LEVELS: number[] = [1, 2, 3]

type Found = { node: LexicalNodeLike; entry: HeadingEntry }

/**
 * Recorre `root.children` (solo el primer nivel, igual que el render) y asigna
 * ids únicos. Un texto repetido recibe `-2`, `-3`; un texto vacío usa el id
 * base `seccion`. Si el id calculado ya existe (un encabezado literal "x-2"
 * junto a dos "x") o es un id reservado de la página, sigue contando hasta
 * hallar uno libre.
 *
 * `levels` filtra por la etiqueta real (h1 = 1). Un h1 del cuerpo se reporta
 * como nivel 2 porque el sitio lo renderiza como h2 (SEO-44): así entra al
 * índice junto a los h2 y recibe id.
 */
function collect(root: LexicalRootLike | null | undefined, levels: number[]): Found[] {
  const used = new Set<string>()
  const out: Found[] = []
  for (const node of root?.children ?? []) {
    if (node.type !== 'heading' || typeof node.tag !== 'string') continue
    const tagLevel = Number(node.tag.slice(1))
    if (!levels.includes(tagLevel)) continue
    const level = tagLevel === 1 ? 2 : tagLevel
    const text = headingText(node).trim()
    const base = slugify(text) || 'seccion'
    let id = base
    let n = 1
    while (used.has(id) || RESERVED_IDS.has(id)) {
      n += 1
      id = `${base}-${n}`
    }
    used.add(id)
    out.push({ node, entry: { id, text, level } })
  }
  return out
}

/** Encabezados h1 (como nivel 2), h2 y h3 en orden, con su id. Alimenta el índice. */
export function extractHeadings(
  root: LexicalRootLike | null | undefined,
  levels: number[] = DEFAULT_LEVELS,
): HeadingEntry[] {
  return collect(root, levels).map((f) => f.entry)
}

/** Mapa de la referencia del nodo a su id. Alimenta el render de MuiRichText. */
export function buildHeadingIdMap(
  root: LexicalRootLike | null | undefined,
  levels: number[] = DEFAULT_LEVELS,
): Map<LexicalNodeLike, string> {
  return new Map(collect(root, levels).map((f) => [f.node, f.entry.id]))
}
