// Seleccion de la fuente del texto legal (fase 56, plan 56-08, D-02 y D-09).
//
// Puro: sin Payload ni red. Las rutas /privacy y /terms comparten esta unica
// implementacion. El texto nuevo vive en el global privado legal-pages; mientras
// el cuerpo de un idioma este vacio (o la tabla no exista todavia), la ruta cae
// al doc `pages` de ESE idioma, que es lo que sirve produccion hoy.
//
// Title, meta title, meta description, Open Graph y migas NO pasan por aqui:
// siguen saliendo del doc `pages` por paridad de SEO con la fase 54-16.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { extractLegalRichTexts } from '@/components/pages/LegalView'

export type LegalKey = 'privacy' | 'terms'

/** Forma estructural de getCachedLegalPages (src/lib/cache.ts). */
export type LegalGlobalLike = {
  privacy?: SerializedEditorState | null
  terms?: SerializedEditorState | null
  effectiveDate?: string | null
}

type PageDocLike = { content?: { layout?: ReadonlyArray<unknown> | null } | null } | null | undefined

export type LegalSource = {
  richTexts: SerializedEditorState[]
  /** Valor crudo del global. Solo viaja junto con el texto del global. */
  effectiveDate: string | null
  source: 'global' | 'pages'
}

function hasChildren(state: SerializedEditorState | null | undefined): state is SerializedEditorState {
  return !!state?.root && Array.isArray(state.root.children) && state.root.children.length > 0
}

/**
 * Elige entre el global y el doc `pages`. La fecha efectiva solo acompana al
 * texto del global: el texto de produccion (doc pages) nunca muestra fecha,
 * porque no hay dato confiable y no se usa la fecha de modificacion.
 */
export function pickLegalSource(
  doc: PageDocLike,
  legal: LegalGlobalLike | null | undefined,
  key: LegalKey,
): LegalSource {
  const fromGlobal = legal?.[key]
  if (hasChildren(fromGlobal)) {
    const raw = typeof legal?.effectiveDate === 'string' ? legal.effectiveDate.trim() : ''
    return { richTexts: [fromGlobal], effectiveDate: raw === '' ? null : raw, source: 'global' }
  }
  return { richTexts: extractLegalRichTexts(doc?.content?.layout), effectiveDate: null, source: 'pages' }
}

export type LegalEffective = {
  /** YYYY-MM-DD, para el atributo dateTime. */
  iso: string
  /** Fecha larga en el idioma de la ruta, formateada en UTC. */
  formatted: string
}

/**
 * Normaliza la fecha del global (Payload la entrega como timestamp ISO a
 * medianoche UTC, p. ej. 2026-11-30T00:00:00.000Z) y la formatea en UTC: con la
 * zona del servidor o del visitante el dia se correria uno hacia atras en
 * America. Devuelve null si no hay dato o no es una fecha valida.
 */
export function legalEffective(raw: string | null | undefined, locale: 'es' | 'en'): LegalEffective | null {
  if (!raw) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim())
  if (!m) return null
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  const formatted = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
  return { iso: `${m[1]}-${m[2]}-${m[3]}`, formatted }
}
