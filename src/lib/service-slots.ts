// Módulo puro: sin React, sin Payload en tiempo de ejecución y sin next-intl.
// Decide qué ranura de la landing de servicio ocupa cada bloque del layout.
//
// La regla es POSICIÓN y blockType, nunca el texto de un encabezado: el texto
// es contenido del editor y cambia por idioma. Con esta regla un editor puede
// reordenar bloques en el admin sin romper la vista, y un blockType que la
// vista no conoce cae a `generic` (el llamador lo pinta con el registro
// anterior de bloques), así que ningún texto indexable se pierde (SEO-03).
import type { Page } from '@/payload-types'

export type ServiceLayoutBlock = Page['content']['layout'][number]

type BlockOf<T extends ServiceLayoutBlock['blockType']> = Extract<ServiceLayoutBlock, { blockType: T }>

export type ServiceSection =
  | { kind: 'problem'; block: BlockOf<'content'> }
  | { kind: 'twoColumns'; block: BlockOf<'content'> }
  | { kind: 'prose'; block: BlockOf<'content'> }
  | { kind: 'cta'; block: BlockOf<'callToAction'>; closing: boolean }
  | { kind: 'auditor'; block: BlockOf<'auditorCallout'> }
  | { kind: 'logos'; block: BlockOf<'clientLogosBlock'> }
  | { kind: 'testimonials'; block: BlockOf<'testimonialsCarousel'> }
  | { kind: 'caseProof'; block: BlockOf<'relatedCaseStudyBlock'> }
  | { kind: 'faq'; block: BlockOf<'faq'> }
  | { kind: 'generic'; block: ServiceLayoutBlock }

export type ServiceSlots = {
  hero: BlockOf<'hero'> | null
  scope: BlockOf<'serviceScopeCard'> | null
  sections: ServiceSection[]
}

/**
 * Reparte el layout en `{ hero, scope, sections }`.
 *
 * - `hero` y `serviceScopeCard` van a su ranura propia (el primero de cada uno;
 *   un segundo ejemplar cae a `generic` para no perderlo).
 * - El primer `content` es `problem`. El segundo es `twoColumns` solo si trae
 *   exactamente dos columnas; con otro número es `prose`. Todo `content`
 *   posterior es `prose`.
 * - El último `callToAction` lleva `closing: true`; los anteriores `false`.
 * - Las secciones conservan el orden del layout.
 */
export function composeServiceSlots(layout: ServiceLayoutBlock[] | null | undefined): ServiceSlots {
  const blocks = layout ?? []

  let lastCtaIndex = -1
  blocks.forEach((b, i) => {
    if (b.blockType === 'callToAction') lastCtaIndex = i
  })

  let hero: ServiceSlots['hero'] = null
  let scope: ServiceSlots['scope'] = null
  let contentCount = 0
  const sections: ServiceSection[] = []

  blocks.forEach((block, i) => {
    switch (block.blockType) {
      case 'hero':
        if (!hero) hero = block
        else sections.push({ kind: 'generic', block })
        return
      case 'serviceScopeCard':
        if (!scope) scope = block
        else sections.push({ kind: 'generic', block })
        return
      case 'content': {
        contentCount += 1
        if (contentCount === 1) {
          sections.push({ kind: 'problem', block })
          return
        }
        // Solo el SEGUNDO content puede ser twoColumns (y solo con dos columnas).
        if (contentCount === 2 && (block.columns?.length ?? 0) === 2) {
          sections.push({ kind: 'twoColumns', block })
          return
        }
        sections.push({ kind: 'prose', block })
        return
      }
      case 'callToAction':
        sections.push({ kind: 'cta', block, closing: i === lastCtaIndex })
        return
      case 'auditorCallout':
        sections.push({ kind: 'auditor', block })
        return
      case 'clientLogosBlock':
        sections.push({ kind: 'logos', block })
        return
      case 'testimonialsCarousel':
        sections.push({ kind: 'testimonials', block })
        return
      case 'relatedCaseStudyBlock':
        sections.push({ kind: 'caseProof', block })
        return
      case 'faq':
        sections.push({ kind: 'faq', block })
        return
      default:
        sections.push({ kind: 'generic', block })
    }
  })

  return { hero, scope, sections }
}
