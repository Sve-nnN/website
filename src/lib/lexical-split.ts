// Corta el contenido Lexical de un post en dos mitades para poder insertar la
// oferta inline DENTRO del artículo, no antes ni después.
//
// Por qué así y no con un bloque del CMS: el cuerpo del post es un único campo
// `richText`, no una composición de bloques como las Pages. La alternativa
// sería pedirle a Juan que coloque el bloque a mano en cada uno de los 66
// posts, que es exactamente el tipo de trabajo manual que el CMS existe para
// evitar.
//
// El corte NO parte párrafos: opera sobre los hijos directos del root, que son
// nodos de bloque completos (párrafo, heading, lista, código). Ambas mitades se
// renderizan dentro del MISMO `<article>`, así que la tabla de contenidos, que
// lee `article h2` del DOM, sigue encontrando todos los encabezados.

import type { Post } from '@/payload-types'

/** El mismo tipo que Payload genera para el cuerpo del post. */
type Content = Post['content']

type LexicalNode = { type?: string; tag?: string }

/** Fracción del artículo que se lee antes de encontrar la oferta. */
const SPLIT_RATIO = 0.4

/** Por debajo de esto el post es demasiado corto para partirlo. */
const MIN_BLOCKS_TO_SPLIT = 6

function isHeadingTwo(node: unknown): boolean {
  const n = node as LexicalNode
  return n?.type === 'heading' && n?.tag === 'h2'
}

/**
 * Devuelve `{ before, after }` con el mismo shape que el campo original, o
 * `{ before: content, after: null }` cuando el post es demasiado corto para
 * partirlo — ahí la oferta se salta y el artículo se renderiza entero.
 *
 * El punto de corte busca el primer h2 que caiga después del 40% del cuerpo. Un
 * corte a mitad de una sección deja la oferta flotando entre dos párrafos que
 * se están explicando; entre secciones cae en la pausa natural donde el lector
 * ya cerró una idea.
 */
export function splitContentForOffer(content: Content | null | undefined): {
  before: Content | null | undefined
  after: Content | null
} {
  const children = content?.root?.children

  if (!content?.root || !Array.isArray(children) || children.length < MIN_BLOCKS_TO_SPLIT) {
    return { before: content, after: null }
  }

  const target = Math.floor(children.length * SPLIT_RATIO)
  let splitAt = children.findIndex((node, i) => i >= target && isHeadingTwo(node))

  // Sin h2 después del umbral (post sin secciones, o con todas al principio):
  // se corta en el umbral mismo, que sigue siendo un límite de bloque.
  if (splitAt === -1) splitAt = target

  // Un corte en 0 pondría la oferta antes del primer párrafo, que es lo mismo
  // que ponerla arriba del artículo. Ahí no va.
  if (splitAt <= 0 || splitAt >= children.length) {
    return { before: content, after: null }
  }

  // El cast es sobre los hijos, que Payload tipa como nodos serializados y
  // acá se tratan como opacos: este módulo NUNCA mira dentro de un nodo salvo
  // para preguntar si es un h2, así que no necesita el tipo completo.
  const slice = (from: number, to?: number) =>
    ({
      ...content,
      root: { ...content.root, children: children.slice(from, to) },
    }) as Content

  return { before: slice(0, splitAt), after: slice(splitAt) }
}
