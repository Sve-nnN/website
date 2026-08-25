// Módulo puro, sin imports de Payload ni de la base, por el mismo motivo que
// service-slugs.ts: lo consumen el footer (Server Component), las propias
// landings y el schema, y ninguno debería arrastrar el SDK de servidor.
//
// Las dos landings de SEO local (issue #42) estaban en el sitemap desde el
// principio y aun así, medido el 2026-08-25 en Search Console:
//
//   /seo-tecnico-madrid      URL desconocida para Google, nunca rastreada
//   /en/seo-tecnico-madrid   Descubierta, actualmente sin indexar, nunca rastreada
//   /seo-tecnico-lima        conocida, 13 impresiones, 1 clic, posición media 7,8
//
// Las cuatro recibían UN solo enlace interno en todo el sitio. Con un enlace
// por página, Google las trata como periferia: Lima entró igual y ya está en
// posición 7,8 con cero refuerzo, lo que dice que la keyword es alcanzable;
// Madrid, con la misma plantilla y el mismo enlazado, ni siquiera se rastreó.
//
// A diferencia de los servicios, el segmento de URL NO cambia por idioma: la
// landing vive en `/seo-tecnico-madrid` y en `/en/seo-tecnico-madrid`, con el
// mismo slug. Por eso acá alcanza con el prefijo de locale.

export type LocalLanding = {
  slug: string
  /** Ciudad tal como se declara en `areaServed`. */
  city: string
  /** País de la ciudad, en formato ISO 3166-1 alpha-2. */
  country: string
}

export const LOCAL_LANDINGS: readonly LocalLanding[] = [
  { slug: 'seo-tecnico-lima', city: 'Lima', country: 'PE' },
  { slug: 'seo-tecnico-madrid', city: 'Madrid', country: 'ES' },
] as const

export const LOCAL_LANDING_SLUGS = LOCAL_LANDINGS.map((l) => l.slug)

/** Href correcto por locale. El slug es el mismo en los dos idiomas. */
export function buildLocalLandingHref(locale: 'es' | 'en', slug: string): string {
  return locale === 'es' ? `/${slug}` : `/en/${slug}`
}

export function findLocalLanding(slug: string): LocalLanding | undefined {
  return LOCAL_LANDINGS.find((l) => l.slug === slug)
}
