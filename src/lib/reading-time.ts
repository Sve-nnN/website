// Estimación de tiempo de lectura sobre contenido Lexical.
//
// Vivía dentro de src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx,
// donde solo la página del post podía usarla. La entrada destacada del índice
// necesita el mismo dato, y duplicar el conteo de palabras habría dejado dos
// definiciones de "cuánto se tarda en leer esto" que podían divergir.
//
// Sigue siendo una estimación deliberadamente barata: recorre el JSON y suma
// nodos de texto, sin dependencias nuevas. NO se calcula para las cards del
// listado: eso exigiría traer el `content` completo de cada post al payload
// RSC del grid, que es justo lo que el `select` de getCachedArchive evita.

const WORDS_PER_MINUTE = 200

/** Recorre el árbol Lexical acumulando el texto de cada nodo `text`. */
function extractPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  let text = n.text ?? ''
  if (Array.isArray(n.children)) {
    text += ' ' + n.children.map(extractPlainText).join(' ')
  }
  return text
}

/**
 * Minutos de lectura, mínimo 1. Un post vacío o sin contenido devuelve 1 en vez
 * de 0: "0 min de lectura" es ruido, no información.
 */
export function estimateReadingTime(content: { root?: unknown } | null | undefined): number {
  const plainText = extractPlainText(content?.root)
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}

/** Etiqueta localizada, para no repetir el ternario en cada superficie. */
export function readingTimeLabel(minutes: number, locale: 'es' | 'en'): string {
  return locale === 'es' ? `${minutes} min de lectura` : `${minutes} min read`
}
