import type { Metadata } from 'next'

/**
 * Decide si un `<title>` lleva el sufijo de marca (issue #45).
 *
 * De los 169 títulos que servía el sitio, 165 no nombraban a nadie. Los peores
 * eran los de las páginas índice y las fichas de sitios web, medidos el
 * 2026-08-26 sobre el HTML servido:
 *
 *   "Blog"        /blog y /en/blog, idénticos entre sí
 *   "General"     /blog/general y su par en inglés
 *   "Apturio"     /websites/apturio-com y su par
 *   "Servicios"   "Contacto"   "React 19"   "Juan Tech"   "Estylopia"
 *
 * En una SERP, "Apturio" a secas no dice de quién es ni de qué va.
 *
 * ── Por qué NO se le pone a todos ───────────────────────────────────────────
 *
 * Google corta el título cerca de los 60 caracteres. El sufijo ocupa 21. Un
 * artículo cuyo título ya mide 55 no gana contexto al agregárselo: pierde el
 * final de su propia frase. Medido sobre los 165 sin marca: 56 tienen lugar y
 * 109 no.
 *
 * La regla es por eso una sola, y comprobable: se agrega solo si el resultado
 * sigue entrando en 60 caracteres.
 *
 * ── Cómo se aplica ──────────────────────────────────────────────────────────
 *
 * El sufijo lo pone `title.template` del layout raíz, así el texto vive en un
 * solo lugar. Esta función decide si la página se deja plantillar (devuelve un
 * string, y Next aplica el template) o si se planta (devuelve `absolute`, que
 * lo evita).
 *
 * También se planta cuando el título YA nombra la marca, cosa que hoy pasa en
 * cuatro páginas porque su `meta.title` viene del CMS con el sufijo puesto a
 * mano. Sin esta comprobación quedarían con la marca dos veces, y volvería a
 * pasar cada vez que alguien la escriba en el admin.
 */
export const BRAND = 'Juan Carlos Angulo'

/** Lo que agrega `title.template`. Debe coincidir con el layout raíz. */
export const BRAND_SUFFIX = ` | ${BRAND}`

/** Longitud a partir de la cual Google empieza a cortar. */
export const TITLE_LIMIT = 60

export function pageTitle(raw: string | null | undefined): Metadata['title'] {
  const title = (raw ?? '').trim()

  if (!title) return { absolute: BRAND }
  if (title.includes(BRAND)) return { absolute: title }
  if (title.length + BRAND_SUFFIX.length > TITLE_LIMIT) return { absolute: title }

  return title
}
