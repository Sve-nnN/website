// Funciones puras de la superficie Casos de exito (fase 55, plan 55-09). Sin
// acceso al CMS: las lecturas viven en `getCachedCaseStudiesIndex` y
// `getCachedCaseStudyBySlug` (src/lib/cache.ts) y este modulo solo convierte los
// documentos en props serializables para las vistas.
//
// Ningun import de designs/ ni de datos del sandbox (D-02).
import { formatSector, splitHeroMetric } from '@/components/mui/split-hero-metric'

/** Fila de resultados tal como llega de Payload (docs y fixtures). */
export type CaseMetricDocLike = {
  label?: string | null
  before?: string | null
  after?: string | null
}

/** Forma minima que el indice y la comparacion leen del documento. */
export type CaseDocLike = {
  id?: number | string
  slug?: string | null
  title?: string | null
  heroMetric?: string | null
  heroSubtitle?: string | null
  sector?: string | null
  period?: string | null
  results?: {
    periodBefore?: string | null
    periodAfter?: string | null
    metrics?: ReadonlyArray<CaseMetricDocLike | null> | null
  } | null
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// ---------------------------------------------------------------------------
// Indice (tarea 1)
// ---------------------------------------------------------------------------

export type CaseIndexItem = {
  slug: string
  title: string
  /** Cifra de cabeza ya separada por `splitHeroMetric` ("+406 %"). Vacia si el caso no tiene `heroMetric`. */
  metric: string
  /** Etiqueta bajo la cifra ("clics interanuales"), o null si el texto no calza. */
  metricLabel: string | null
  /** Sector sin raya larga ni corta (`formatSector`), o null. */
  sector: string | null
  subtitle: string | null
  period: string | null
}

/**
 * Documentos de `case-studies` a props por tarjeta, en el orden recibido. Sin
 * slug o sin titulo no hay tarjeta. `_locale` queda en la firma para que la
 * ruta y el detalle llamen igual.
 */
export function toCaseIndexProps(
  docs: ReadonlyArray<CaseDocLike>,
  _locale: 'es' | 'en',
): CaseIndexItem[] {
  const items: CaseIndexItem[] = []
  for (const doc of docs) {
    const slug = text(doc.slug)
    const title = text(doc.title)
    if (!slug || !title) continue
    const { metric, label } = splitHeroMetric(doc.heroMetric)
    items.push({
      slug,
      title,
      metric,
      metricLabel: label,
      sector: text(formatSector(doc.sector)),
      subtitle: text(doc.heroSubtitle),
      period: text(doc.period),
    })
  }
  return items
}
