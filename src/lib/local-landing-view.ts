// Módulo puro: sin React, sin Payload en tiempo de ejecución y sin next-intl.
// Decide qué ranura de las landings SEO técnico Lima y Madrid ocupa cada bloque
// del layout, y separa la cifra de la estadística del hero.
//
// Igual que service-slots.ts, la regla es POSICIÓN y blockType, nunca el texto
// de un encabezado. Un blockType que la vista no conoce cae a `generic` (el
// llamador lo pinta con el registro anterior de bloques), así que ningún texto
// indexable se pierde (SEO-03).
import type { Page } from '@/payload-types'

export type LocalLayoutBlock = Page['content']['layout'][number]

type BlockOf<T extends LocalLayoutBlock['blockType']> = Extract<LocalLayoutBlock, { blockType: T }>

export type LocalSection =
  | { kind: 'proof'; block: BlockOf<'localProofSection'> }
  | { kind: 'prose'; block: BlockOf<'content'> }
  | { kind: 'faq'; block: BlockOf<'faq'> }
  | { kind: 'cta'; block: BlockOf<'callToAction'>; closing: boolean }
  | { kind: 'generic'; block: LocalLayoutBlock }

export type LocalSlots = {
  hero: BlockOf<'hero'> | null
  sections: LocalSection[]
}

/**
 * Separa el número inicial de la estadística del resto del texto.
 * "+40 proyectos entregados" da `{ figure: '+40', caption: 'proyectos entregados' }`.
 * Sin número al inicio devuelve `{ figure: null, caption: text }`: la cifra grande
 * solo se pinta cuando existe.
 */
export function splitInlineStat(text: string | null | undefined): { figure: string | null; caption: string } {
  const value = (text ?? '').trim()
  const match = value.match(/^([+\-−]?\d[\d.,]*)\s*(.*)$/)
  if (!match) return { figure: null, caption: value }
  return { figure: match[1] ?? null, caption: (match[2] ?? '').trim() }
}

/**
 * Reparte el layout en `{ hero, sections }`.
 *
 * - El primer `hero` va a su ranura propia y no entra en `sections`; un segundo
 *   ejemplar cae a `generic` para no perderlo.
 * - `localProofSection` es `proof`, todo `content` es `prose` y `faq` es `faq`.
 * - El último `callToAction` lleva `closing: true`; los anteriores `false`.
 * - Cualquier otro blockType es `generic`.
 * - Las secciones conservan el orden del layout.
 */
export function composeLocalSlots(layout: LocalLayoutBlock[] | null | undefined): LocalSlots {
  const blocks = layout ?? []

  let lastCtaIndex = -1
  blocks.forEach((b, i) => {
    if (b.blockType === 'callToAction') lastCtaIndex = i
  })

  let hero: LocalSlots['hero'] = null
  const sections: LocalSection[] = []

  blocks.forEach((block, i) => {
    switch (block.blockType) {
      case 'hero':
        if (!hero) hero = block
        else sections.push({ kind: 'generic', block })
        return
      case 'localProofSection':
        sections.push({ kind: 'proof', block })
        return
      case 'content':
        sections.push({ kind: 'prose', block })
        return
      case 'faq':
        sections.push({ kind: 'faq', block })
        return
      case 'callToAction':
        sections.push({ kind: 'cta', block, closing: i === lastCtaIndex })
        return
      default:
        sections.push({ kind: 'generic', block })
    }
  })

  return { hero, sections }
}
