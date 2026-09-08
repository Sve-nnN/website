import type { Block } from 'payload'

// Bloque Lexical (NO bloque de Pages) — registrado vía `BlocksFeature` en
// `posts.content` junto a `AffiliateInlineBlock` (Phase 48). `slug` kebab-case
// a propósito: este valor literal es el que Payload guarda como
// `fields.blockType` en el nodo Lexical serializado.
//
// Zero-config (`fields: []`): el lead magnet es un concepto fijo y singular
// para esta fase (un solo checklist, dos PDFs por locale) — no hay nada que
// el editor deba elegir por instancia, per 49-UI-SPEC.md Component Contract
// Detail. El editor solo arrastra el bloque dentro del cuerpo del post.
export const EmailCaptureBlock: Block = {
  slug: 'email-capture',
  interfaceName: 'EmailCaptureBlock',
  fields: [],
}
