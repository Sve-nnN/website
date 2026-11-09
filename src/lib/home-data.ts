// Lector y mapeador de la home (fase 54, plan 54-08). Convierte el global
// `home-page` en props tipadas y serializables para HomeView.
//
// `mapHomeGlobal` es una funcion pura: sin imports de Payload en su cuerpo, asi
// la autoprueba (scripts/verify/54-home-ssr.ts) la alimenta con el copy
// sembrado como fixture. `getHomeData` es la unica parte que toca el CMS y
// NUNCA lanza: ante un error registra y devuelve todas las secciones en null,
// para que la home no responda 500 (T-54-33).
import { getCachedHomePage, type Locale } from '@/lib/cache'
import { sanitizeHref } from '@/lib/nav-links'
import type { HomePage } from '@/payload-types'

export type HomeHero = {
  eyebrow: string | null
  titleLine1: string
  titleLine2: string | null
  lead: string | null
  ctaLabel: string | null
  /** Destino ya saneado con sanitizeHref. null deja el boton sin enlace. */
  ctaHref: string | null
  statValue: string | null
  statCaption: string | null
}

export type HomeData = {
  hero: HomeHero | null
  tagline: string | null
  /** True cuando la pagina es EN pero el copy del global salio en espanol. */
  isFallback: boolean
}

/** Cadena con contenido o null (vacio, solo espacios o un valor que no es texto). */
export function str(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function emptyHomeData(): HomeData {
  return { hero: null, tagline: null, isFallback: false }
}

function mapHero(hero: HomePage['hero'], locale: Locale): HomeHero | null {
  if (!hero) return null
  const titleLine1 = str(hero.titleLine1)
  const titleLine2 = str(hero.titleLine2)
  // Sin ninguna linea de titulo no hay h1 que mostrar: la seccion se omite y la
  // vista emite el h1 de respaldo.
  if (!titleLine1 && !titleLine2) return null
  return {
    eyebrow: str(hero.eyebrow),
    titleLine1: titleLine1 ?? (titleLine2 as string),
    titleLine2: titleLine1 ? titleLine2 : null,
    lead: str(hero.lead),
    ctaLabel: str(hero.ctaLabel),
    ctaHref: sanitizeHref(hero.ctaHref, locale),
    statValue: str(hero.statValue),
    statCaption: str(hero.statCaption),
  }
}

/** Documento del global `home-page` a props. Una seccion sin contenido da null. */
export function mapHomeGlobal(
  global: Partial<HomePage> | null | undefined,
  locale: Locale,
  isFallback: boolean,
): HomeData {
  if (!global) return { ...emptyHomeData(), isFallback }
  return {
    hero: mapHero(global.hero, locale),
    tagline: str(global.tagline),
    isFallback,
  }
}

/**
 * Lee el global por la capa cacheada y lo mapea. Nunca lanza: un fallo de la
 * Local API (global sin migrar, rol sin permiso, base caida) deja la home sin
 * esas secciones en lugar de un 500.
 */
export async function getHomeData(locale: Locale): Promise<HomeData> {
  try {
    const { data, isFallback } = await getCachedHomePage(locale)
    return mapHomeGlobal(data, locale, isFallback)
  } catch (err) {
    console.error('[home]', err)
    return emptyHomeData()
  }
}
