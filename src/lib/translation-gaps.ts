// Posts cuya versión en inglés está tan incompleta que no debería estar en el
// índice de Google (issue #7). Un slug en esta lista sale con `noindex` en /en,
// sin hreflang `en`, fuera del sitemap EN, y los enlaces internos hacia él van a
// la versión en español.
//
// La lista está vacía desde el 2026-11-24: los 14 posts publicados que figuraban
// aquí (7 servían el español por el fallback de locale y 7 tenían un inglés
// truncado) recibieron la traducción completa con
// scripts/db/40-en-posts-translation.ts. Los otros 3 slugs
// (`big-o-notation`, `algoritmos-estructuras-datos`, `programacion-dinamica`)
// quedaron en borrador y redirigidos tras la fusión del 2026-11-14.
//
// IMPORTANTE: esa traducción vive en la base de producción. Antes de quitar un
// slug de aquí, la base ya tiene que servir su inglés completo.
//
// Para volver a medir:
//   python3 scripts/seo/measure-translations.py
export const EN_TRANSLATION_INCOMPLETE: ReadonlySet<string> = new Set([
  // 'slug-del-post', // % del ES y fecha de la medición
])

/** ¿Esta URL debe quedar fuera del índice por traducción incompleta? */
export function isEnTranslationIncomplete(locale: string, slug: string | undefined): boolean {
  return locale === 'en' && !!slug && EN_TRANSLATION_INCOMPLETE.has(slug)
}

/**
 * Fase 57 (D-04 F4): href escrito a mano en el contenido (absoluto al propio
 * sitio o con `/en` ya puesto) hacia el gemelo EN noindex de un post de la
 * lista. Devuelve el mismo href sin el segmento `/en`, o sea la versión ES
 * canónica, y deja intacto cualquier otro. No toca la base: corrige el enlace
 * al renderizar. Solo reconoce `/en/blog/<categoría>/<slug>` exacto.
 */
export function rewriteIncompleteEnPostHref(href: string): string {
  const m = href.match(/^((?:https?:\/\/(?:www\.)?juan-tech\.com)?)\/en(\/blog\/[^/?#]+\/([^/?#]+)\/?)([?#].*)?$/i)
  if (!m || !EN_TRANSLATION_INCOMPLETE.has(m[3])) return href
  return `${m[1]}${m[2]}${m[4] ?? ''}`
}
