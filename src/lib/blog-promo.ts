import type { BlogPromo } from '@/payload-types'

/**
 * Resuelve los textos de conversión del blog para una categoría concreta.
 *
 * Por qué existe: quien llega a un post de Estrategia SEO suele trabajar sobre
 * WordPress o Webflow y su problema es de contenido y arquitectura; quien llega
 * a SEO Técnico está mirando renderizado y Core Web Vitals en su propio código.
 * El mismo párrafo no le habla a los dos, y un CTA que no reconoce el problema
 * del lector es un CTA que se saltea.
 *
 * La mezcla es POR CAMPO, no por bloque: la fila de la categoría solo pisa lo
 * que tiene cargado y todo lo demás cae al texto general. Así una categoría
 * puede cambiar únicamente el título y heredar el resto, sin que nadie tenga
 * que copiar los cinco campos para tocar uno.
 *
 * Los `points` de la banda de cierre son la excepción declarada: una lista a
 * medio pisar (dos puntos de la categoría mezclados con tres generales) no
 * significa nada, así que es todo o nada.
 */

type Category = { id: number } | number | null | undefined

function categoryId(ref: Category): number | null {
  if (typeof ref === 'number') return ref
  if (ref && typeof ref === 'object') return ref.id
  return null
}

/** Devuelve `override` si tiene contenido real, y si no el valor general. */
function pick<T>(override: T | null | undefined, base: T | null | undefined): T | null | undefined {
  if (typeof override === 'string') return override.trim() === '' ? base : override
  return override ?? base
}

export type ResolvedBlogPromo = {
  inline: NonNullable<BlogPromo['inline']>
  rail: NonNullable<BlogPromo['rail']>
  closing: NonNullable<BlogPromo['closing']>
}

export function resolveBlogPromo(
  promo: BlogPromo | null | undefined,
  category?: number | null,
): ResolvedBlogPromo {
  const base = {
    inline: promo?.inline ?? {},
    rail: promo?.rail ?? {},
    closing: promo?.closing ?? {},
  }

  if (!promo?.byCategory?.length || !category) return base

  // La primera fila gana. Un global con la misma categoría dos veces es un
  // error de carga, no un caso que valga la pena resolver con reglas.
  const row = promo.byCategory.find((r) => categoryId(r.category) === category)

  if (!row) return base

  const overridePoints = row.closing?.points?.filter((p) => p.item?.trim())

  return {
    inline: {
      title: pick(row.inline?.title, base.inline.title),
      text: pick(row.inline?.text, base.inline.text),
      linkLabel: pick(row.inline?.linkLabel, base.inline.linkLabel),
      linkUrl: pick(row.inline?.linkUrl, base.inline.linkUrl),
    },
    rail: {
      title: pick(row.rail?.title, base.rail.title),
      body: pick(row.rail?.body, base.rail.body),
      linkLabel: pick(row.rail?.linkLabel, base.rail.linkLabel),
      linkUrl: pick(row.rail?.linkUrl, base.rail.linkUrl),
    },
    closing: {
      heading: pick(row.closing?.heading, base.closing.heading),
      body: pick(row.closing?.body, base.closing.body),
      points: overridePoints?.length ? overridePoints : base.closing.points,
      primaryLabel: pick(row.closing?.primaryLabel, base.closing.primaryLabel),
      primaryUrl: pick(row.closing?.primaryUrl, base.closing.primaryUrl),
      secondaryLabel: pick(row.closing?.secondaryLabel, base.closing.secondaryLabel),
      secondaryUrl: pick(row.closing?.secondaryUrl, base.closing.secondaryUrl),
    },
  }
}
