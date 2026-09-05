// PURE FUNCTION — a propósito, este archivo no importa `payload` ni
// `@payload-config` (mismo estilo que src/lib/affiliate.ts / lexical-split.ts),
// para poder recorrer `content.root.children` con cero queries adicionales
// (INL-02, 48-03-PLAN.md Task 2 Paso 1). Ante cualquier forma inesperada del
// árbol Lexical, devuelve `false`/`[]` de forma segura (T-48-12) — el peor
// caso es "no muestra el disclosure de más", nunca un crash.

type AffiliateInlineFields = {
  blockType?: string
  affiliateLink?: { program?: string | null } | number | null
}

type AffiliateInlineBlockNode = {
  type: 'block'
  fields: AffiliateInlineFields
}

type LexicalNode = {
  type?: string
  fields?: unknown
  children?: unknown
}

type LexicalContent = {
  root?: {
    children?: unknown
  }
} | null | undefined

function isAffiliateInlineNode(node: unknown): node is AffiliateInlineBlockNode {
  if (typeof node !== 'object' || node === null) return false
  const n = node as LexicalNode
  if (n.type !== 'block') return false
  const fields = n.fields as AffiliateInlineFields | undefined
  return typeof fields === 'object' && fields !== null && fields.blockType === 'affiliate-inline'
}

/**
 * Recorre recursivamente `content.root.children` (y los `children` de cada
 * nodo — un bloque puede en teoría anidar dentro de una lista u otro
 * contenedor) buscando nodos `{ type: 'block', fields: { blockType:
 * 'affiliate-inline' } }`. Devuelve el array completo de nodos encontrados.
 */
export function findAffiliateInlineNodes(content: LexicalContent): AffiliateInlineBlockNode[] {
  const children = content?.root?.children
  if (!Array.isArray(children)) return []

  const found: AffiliateInlineBlockNode[] = []

  const walk = (nodes: unknown): void => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      if (isAffiliateInlineNode(node)) {
        found.push(node)
      }
      if (typeof node === 'object' && node !== null) {
        const n = node as LexicalNode
        if (Array.isArray(n.children)) {
          walk(n.children)
        }
      }
    }
  }

  walk(children)

  return found
}

/** `true` si el post usa el bloque inline al menos una vez, en cualquier parte del documento. */
export function postHasAffiliateInline(content: LexicalContent): boolean {
  return findAffiliateInlineNodes(content).length > 0
}

/**
 * `true` si alguno de los bloques inline encontrados referencia un doc de
 * `affiliate-links` con `program === 'amazon'`. Hoy ningún post de esta fase
 * lo hace (Amazon vive solo como `gearItems[]` en `/stack`), pero la función
 * debe implementarse completa y correctamente igual, per 48-UI-SPEC.md, para
 * cualquier post futuro que sí lo haga.
 */
export function postHasAmazonAffiliateInline(content: LexicalContent): boolean {
  return findAffiliateInlineNodes(content).some((node) => {
    const link = node.fields.affiliateLink
    return typeof link === 'object' && link !== null && link.program === 'amazon'
  })
}
