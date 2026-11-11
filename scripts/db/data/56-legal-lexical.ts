/**
 * Constructor puro de estado Lexical para el texto legal (fase 56, plan 56-05, CONT-03).
 *
 * Sin Payload, sin React y sin red. Una seccion es un titulo (h2 sin numero) y una lista
 * de bloques: parrafo o lista con vinetas. Dentro de un bloque, el texto puede llevar
 * enlaces (solo https y mailto). El texto entra siempre como nodos de texto de Lexical,
 * nunca como HTML (T-56-18).
 *
 * Cada bloque y cada elemento de lista lleva `evidence`: de donde sale la afirmacion
 * (ruta del codigo, verificacion contra el HTML o un hecho de LEGAL_FACTS). La evidencia
 * no se renderiza ni se guarda en Lexical: solo la lee la autoprueba, que rechaza un
 * bloque sin evidencia (T-56-15).
 *
 * Las funciones heading, paragraph y richTextDoc parten de scripts/seed-legal-pages.ts,
 * que no se importa porque ejecuta efectos al cargarse.
 */
import type { Decision } from './56-content-decisions'

/** Convencion de la fase 56 (56-gate descubre este modulo): no registra decisiones. */
export const DECISIONS: Decision[] = []

/** Trozo de texto de un bloque: texto plano o texto con enlace. */
export type InlinePart = string | { text: string; href: string }

/** Contenido de un parrafo o de un elemento de lista. */
export type InlineContent = InlinePart | InlinePart[]

export type LegalListItem = { content: InlineContent; evidence: string }

export type LegalBlock =
  | { type: 'p'; content: InlineContent; evidence: string }
  | { type: 'ul'; items: LegalListItem[] }

export type LegalSection = { title: string; blocks: LegalBlock[] }

/** Estado Lexical serializado, con la forma que acepta lexical-toc.ts (extractHeadings). */
export type LexicalState = {
  root: {
    type: 'root'
    children: Record<string, unknown>[]
    direction: 'ltr'
    format: ''
    indent: 0
    version: 1
  }
}

/** Solo https y mailto: cualquier otro esquema (javascript:, data:, http:) lanza. */
export function assertSafeHref(href: string): string {
  if (!/^(https:\/\/|mailto:)/i.test(href)) {
    throw new Error(`Enlace no permitido (solo https y mailto): ${href}`)
  }
  return href
}

function textNode(text: string): Record<string, unknown> {
  return { type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }
}

function linkNode(text: string, href: string): Record<string, unknown> {
  return {
    type: 'link',
    version: 3,
    fields: { linkType: 'custom', url: assertSafeHref(href), newTab: false },
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

function inlineNodes(content: InlineContent): Record<string, unknown>[] {
  const parts = Array.isArray(content) ? content : [content]
  return parts.map((part) => (typeof part === 'string' ? textNode(part) : linkNode(part.text, part.href)))
}

export function heading(text: string): Record<string, unknown> {
  return {
    type: 'heading',
    tag: 'h2',
    version: 1,
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

export function paragraph(content: InlineContent): Record<string, unknown> {
  return {
    type: 'paragraph',
    version: 1,
    children: inlineNodes(content),
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
  }
}

export function bulletList(items: LegalListItem[]): Record<string, unknown> {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: items.map((item, i) => ({
      type: 'listitem',
      value: i + 1,
      version: 1,
      children: inlineNodes(item.content),
      direction: 'ltr',
      format: '',
      indent: 0,
    })),
  }
}

export function richTextDoc(children: Record<string, unknown>[]): LexicalState {
  return {
    root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
  }
}

/** Convierte secciones tipadas a estado Lexical: un h2 por seccion y sus bloques en orden. */
export function sectionsToLexical(sections: readonly LegalSection[]): LexicalState {
  const children: Record<string, unknown>[] = []
  for (const section of sections) {
    children.push(heading(section.title))
    for (const block of section.blocks) {
      children.push(block.type === 'p' ? paragraph(block.content) : bulletList(block.items))
    }
  }
  return richTextDoc(children)
}

/** Texto plano de un contenido en linea, para las autopruebas. */
export function inlineText(content: InlineContent): string {
  const parts = Array.isArray(content) ? content : [content]
  return parts.map((p) => (typeof p === 'string' ? p : p.text)).join('')
}

/** Todos los textos de una seccion (titulo, parrafos y elementos), para las autopruebas. */
export function sectionTexts(section: LegalSection): string[] {
  const out = [section.title]
  for (const b of section.blocks) {
    if (b.type === 'p') out.push(inlineText(b.content))
    else for (const it of b.items) out.push(inlineText(it.content))
  }
  return out
}
