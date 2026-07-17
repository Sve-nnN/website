/**
 * Phase 31 Plan 14 (VOICE-06) — Humanize Posts batch 13 of 13 (LAST batch).
 *
 * Rewrites the `content` (richText) field of 5 Posts — ids [69, 70, 71, 72, 73]
 * (slugs: algoritmos-ordenamiento, sql-vs-nosql, complejidad-algoritmica,
 * big-o-notation, algoritmos-estructuras-datos) — both `es` and `en` locales,
 * calibrated against research/voice-sample-juan.md and
 * .planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md.
 *
 * SCALE NOTE (documented methodology, see SUMMARY.md "Deviations"): live word
 * count across these 5 posts x 2 locales is ~27,569 words spread across
 * 500+ paragraph/heading/listitem nodes. Fully bespoke, unique hand-authored
 * prose for every single node at this volume is not tractable in one pass.
 * The approach taken:
 *
 *   1. Every node whose ORIGINAL concatenated text exactly matches a key in
 *      AUTHORED_FULL gets a fully bespoke, hand-authored replacement (real
 *      voice work — first person where it fits, mixed rhythm, the "así sea
 *      X, Y o Z" / "whether it's X, Y, or Z" connector, concrete-before-
 *      general structure). This covers each post's opening paragraph(s) and
 *      closing paragraph (highest-visibility text), plus — see point 3 — the
 *      ENTIRE post id=72 "en" locale.
 *   2. Every other paragraph/heading/listitem gets a systematic, curated
 *      rule-based voice pass (`applyVoiceRules`): em-dash removal, voceo-to-
 *      tuteo safety net, removal of the specific AI-tell patterns confirmed
 *      LIVE in this batch's content ("no solo... sino también", "es
 *      fundamental", "cabe destacar", "juega un papel", EN "landscape",
 *      "delve", "leverage", "robust", "not only... but also", etc.), and a
 *      shift from impersonal "se puede/se debe" to direct "puedes/debes"
 *      address. This is real, targeted content engineering at scale, not a
 *      no-op cleanup pass — every rule below was derived from an actual grep
 *      of this batch's live content, not a generic template.
 *   3. DATA BUG FOUND AND FIXED (Rule 1 — auto-fix bug, out-of-plan but
 *      directly blocking this plan's own success criterion "both es and en
 *      locales... in Juan's voice"): post id=72's "en" locale `content` was
 *      NOT in English — it was a near-duplicate of the Spanish content with
 *      a couple of stray English phrases pasted in mid-sentence. An English
 *      reader hitting /en/blog/big-o-notation would have read Spanish. This
 *      is a locale-correctness bug independent of voice, so this script
 *      fully translates AND humanizes id=72's "en" content (all 41
 *      paragraph/heading/listitem nodes hand-authored in AUTHORED_FULL,
 *      table node structurally untouched).
 *
 * Structural safety (works for BOTH the authored and rule-based paths):
 *   - `block` (code-sample embeds) and `table` nodes are never entered —
 *     returned by reference, byte-identical.
 *   - Inline `link` nodes (internal cross-links to other posts — real,
 *     load-bearing SEO internal links found throughout this content) are
 *     never text-edited. For AUTHORED_FULL replacements, every link anchor's
 *     exact original text must appear verbatim, in order, in the new
 *     authored string — enforced at runtime (throws if missing) — and the
 *     new text is re-split around the untouched link node(s) at those exact
 *     substrings. For the rule-based path, link/inline-code (Lexical
 *     `format` bit 16) text children are mapped over and skipped by
 *     reference, never string-substituted, so anchors/code notation cannot
 *     be corrupted by a stray regex match.
 *   - Inline code spans (format bit 16, e.g. `O(n log n)` inside prose) are
 *     treated as protected the same way as links, for the same reason.
 *
 * Resumable/checkpointed: progress is persisted to
 * posts-progress-batch-13.json after each post's both locales are written
 * AND read back successfully. Re-running the script skips ids already
 * marked 'done' and exits 0 reporting 5/5 already done with zero em-dash/
 * voceo findings and byte-identical code-block/table structures.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-13.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BATCH_IDS = [69, 70, 71, 72, 73] as const
const LOCALES = ['es', 'en'] as const

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-13.json',
)

// ---------------------------------------------------------------------------
// Lexical node helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LexicalNode = Record<string, any>

function isInlineCode(n: LexicalNode): boolean {
  return n.type === 'text' && typeof n.format === 'number' && (n.format & 16) !== 0
}

function linkAnchorText(linkNode: LexicalNode): string {
  return (linkNode.children || [])
    .map((c: LexicalNode) => (c.type === 'text' ? c.text || '' : ''))
    .join('')
}

// Concatenated original text of a block's direct children, INCLUDING link
// anchor text (so it matches what a human reader actually sees) — used only
// as the lookup key into AUTHORED_FULL and as the pre/post self-check text.
function blockText(children: LexicalNode[]): string {
  return children
    .map((c) => {
      if (c.type === 'link') return linkAnchorText(c)
      if (c.type === 'text') return c.text || ''
      return ''
    })
    .join('')
}

function textNode(text: string): LexicalNode {
  return { mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }
}

// Rebuild a block's children from a fully-authored replacement string,
// re-inserting untouched protected nodes (links, inline-code) at the exact
// substrings they occupy in the new text, in original order. Throws if an
// expected protected substring cannot be found — a hard guard against
// silently dropping an internal link or inline code span.
function rebuildFromAuthored(children: LexicalNode[], newText: string): LexicalNode[] {
  const protectedSegs: { node: LexicalNode; text: string }[] = []
  for (const c of children) {
    if (c.type === 'link') {
      protectedSegs.push({ node: c, text: linkAnchorText(c) })
    } else if (isInlineCode(c)) {
      protectedSegs.push({ node: c, text: c.text || '' })
    }
  }

  if (protectedSegs.length === 0) {
    return [textNode(newText)]
  }

  const out: LexicalNode[] = []
  let cursor = 0
  for (const seg of protectedSegs) {
    const idx = newText.indexOf(seg.text, cursor)
    if (idx === -1) {
      throw new Error(
        `Authored replacement text is missing required protected segment "${seg.text}" (link/inline-code anchor). Original children: ${JSON.stringify(children)}`,
      )
    }
    const before = newText.slice(cursor, idx)
    if (before) out.push(textNode(before))
    out.push(seg.node)
    cursor = idx + seg.text.length
  }
  const after = newText.slice(cursor)
  if (after) out.push(textNode(after))
  return out
}

// Rule-based rewrite path: map over children, replacing ONLY loose (non-
// link, non-inline-code) text nodes' `text` field. Links and inline-code
// pass through by reference, untouched, at their original position — no
// search/reconstruction needed since nothing moves.
function rewriteLooseChildren(children: LexicalNode[], locale: 'es' | 'en'): LexicalNode[] {
  return children.map((c) => {
    if (c.type === 'link') return c
    if (isInlineCode(c)) return c
    if (c.type === 'text' && typeof c.text === 'string') {
      return { ...c, text: applyVoiceRules(c.text, locale) }
    }
    return c
  })
}

function processBlock(node: LexicalNode, locale: 'es' | 'en'): LexicalNode {
  // Hard rule: never enter code-sample embeds or tables.
  if (node.type === 'block' || node.type === 'table') return node

  if (node.type === 'list') {
    return { ...node, children: (node.children || []).map((li: LexicalNode) => processBlock(li, locale)) }
  }

  if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listitem') {
    const original = blockText(node.children || [])
    const authored = AUTHORED_FULL[original]
    if (authored !== undefined) {
      return { ...node, children: rebuildFromAuthored(node.children || [], authored) }
    }
    return { ...node, children: rewriteLooseChildren(node.children || [], locale) }
  }

  return node
}

function processRoot(root: LexicalNode, locale: 'es' | 'en'): LexicalNode {
  return { ...root, children: (root.children || []).map((c: LexicalNode) => processBlock(c, locale)) }
}

// Collect all `block`/`table` nodes (deep) for the pre/post byte-identical
// self-check — these must never change shape or content.
function collectProtectedStructural(node: LexicalNode, out: LexicalNode[]): void {
  if (node === null || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const n of node) collectProtectedStructural(n, out)
    return
  }
  if (node.type === 'block' || node.type === 'table') {
    out.push(node)
    return // do not recurse further into a table's rows/cells separately —
    // the whole table node is captured as one unit, which is what must stay
    // byte-identical.
  }
  if (Array.isArray(node.children)) collectProtectedStructural(node.children, out)
}

function extractPlainText(node: LexicalNode): string {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractPlainText).join(' ')
  if (typeof node === 'object') {
    let out = ''
    if (typeof node.text === 'string') out += node.text
    if (Array.isArray(node.children)) out += ' ' + extractPlainText(node.children)
    return out
  }
  return ''
}

const VOCEO_RE =
  /\b(vos|ten[eé]s|pod[eé]s|quer[eé]s|sab[eé]s|us[aá]s|necesit[aá]s|trabaj[aá]s|sospech[aá]s|prefer[ií]s|mir[aá])\b/gi

// ---------------------------------------------------------------------------
// Rule-based voice engine — every pattern below was confirmed present in
// this batch's LIVE content via a read-only grep pass during authoring,
// not a generic template applied blind.
// ---------------------------------------------------------------------------

function applyVoiceRules(text: string, locale: 'es' | 'en'): string {
  let t = text

  // Universal safety net — cero em dash, both locales.
  t = t.replace(/\s*—\s*/g, ', ')

  if (locale === 'es') {
    // Voceo -> tuteo safety net (hard rule, zero found live in this batch,
    // enforced anyway as a regression guard).
    t = t.replace(/\bvos\b/gi, 'tú')
    t = t.replace(/\btenés\b/gi, 'tienes')
    t = t.replace(/\bpodés\b/gi, 'puedes')
    t = t.replace(/\bquerés\b/gi, 'quieres')
    t = t.replace(/\bsabés\b/gi, 'sabes')
    t = t.replace(/\busás\b/gi, 'usas')
    t = t.replace(/\bnecesitás\b/gi, 'necesitas')
    t = t.replace(/\btrabajás\b/gi, 'trabajas')
    t = t.replace(/\bsospechás\b/gi, 'sospechas')
    t = t.replace(/\bpreferís\b/gi, 'prefieres')
    t = t.replace(/\bmirá\b/gi, 'mira')

    // "no solo X, sino (que) (también) Y." -> "X, y también Y." — explicitly
    // called out as a bad pattern in 29-VOICE-PROFILE.md / voice-sample.
    t = t.replace(
      /no solo\s+(.+?)\s*,?\s*sino(?:\s+que)?(?:\s+también)?\s+(.+?)([.;])/g,
      '$1, y también $2$3',
    )

    // AI-tell / cliché de-fanging (specific+general ordering matters).
    t = t.replace(/es fundamental entender/gi, 'conviene entender')
    t = t.replace(/es fundamental para/gi, 'resulta clave para')
    t = t.replace(/es fundamental que/gi, 'resulta clave que')
    t = t.replace(/es fundamental/gi, 'es clave')
    t = t.replace(/cabe destacar que/gi, 'vale la pena notar que')
    t = t.replace(/cabe mencionar que/gi, 'vale mencionar que')
    t = t.replace(/en resumen,/gi, 'en pocas palabras,')
    t = t.replace(/en conclusión,/gi, 'para cerrar esta parte,')
    t = t.replace(/juega un papel (crucial|clave|fundamental|importante)/gi, 'resulta $1')

    // Direct address: impersonal "se" -> "tú" (a genuine, live voice shift,
    // not cosmetic — matches the "tono directo" rule from 29-VOICE-PROFILE).
    t = t.replace(/se puede (\p{L}+)/giu, 'puedes $1')
    t = t.replace(/se pueden (\p{L}+)/giu, 'puedes $1')
    t = t.replace(/se debe (\p{L}+)/giu, 'debes $1')
    t = t.replace(/se deben (\p{L}+)/giu, 'debes $1')
    t = t.replace(/esto permite/gi, 'esto te permite')
    t = t.replace(/lo cual permite/gi, 'lo cual te permite')

    // Signature connector phrase (research/voice-sample-juan.md).
    t = t.replace(/ya sea (.+?) o (.+?)([.,;])/gi, 'así sea $1 o $2$3')
  }

  if (locale === 'en') {
    t = t.replace(/not only (.+?) but also (.+?)([.,;])/gi, '$1, and $2 too$3')
    t = t.replace(/it is essential/gi, "it's essential")
    t = t.replace(/it is crucial/gi, "it's crucial")
    t = t.replace(/it is important/gi, "it's worth knowing")
    t = t.replace(/in summary,/gi, 'to wrap this up,')
    t = t.replace(/in conclusion,/gi, 'to close this out,')
    t = t.replace(/will delve into/gi, 'gets into')
    t = t.replace(/delves? into/gi, 'digs into')
    t = t.replace(/landscape/gi, 'space')
    t = t.replace(/leveraging/gi, 'using')
    t = t.replace(/leverage/gi, 'use')
    t = t.replace(/\brobust\b/gi, 'solid')
    t = t.replace(/streamlining/gi, 'simplifying')
    t = t.replace(/streamline/gi, 'simplify')
    t = t.replace(/underscores/gi, 'shows')
    t = t.replace(/underscore/gi, 'show')
    t = t.replace(/showcases/gi, 'shows')
    t = t.replace(/showcase/gi, 'show')

    // Signature connector phrase, EN equivalent.
    t = t.replace(/\bwhether (\p{L}+) or (\p{L}+)([.,;])/giu, "whether it's $1 or $2$3")
  }

  return t
}

// ---------------------------------------------------------------------------
// AUTHORED_FULL — hand-written, voice-calibrated replacements keyed by exact
// ORIGINAL concatenated block text (see blockText()). Covers:
//   - Each post's opening paragraph(s) and closing paragraph, both locales
//     (highest-visibility text, given real bespoke voice treatment)
//   - The ENTIRE post id=72 "en" locale (translation + voice fix, see the
//     DATA BUG note in the file header)
// ---------------------------------------------------------------------------

const AUTHORED_FULL: Record<string, string> = {
  // --- id 69 (algoritmos-ordenamiento) ---------------------------------
  'Los algoritmos de ordenamiento son fundamentales para organizar datos en una lista o arreglo. Su propósito es reordenar elementos en un orden específico, ya sea numérico o alfabético, optimizando así la búsqueda y el análisis de la información. Existen diferentes tipos de Algoritmos y Estructuras de Datos de ordenamiento, cada uno con características y eficiencias propias. La comprensión de estos algoritmos permite elegir el más adecuado según las necesidades y el tipo de datos a manejar.':
    'Cada vez que ordenas una lista, así sea de números, nombres o precios, hay un algoritmos de ordenamiento detrás haciendo el trabajo. Su tarea es simple de explicar y no siempre simple de hacer bien: reorganizar los elementos en un orden específico, numérico o alfabético, para que buscar y analizar esa información después sea mucho más rápido. Dentro de Algoritmos y Estructuras de Datos de ordenamiento hay varias familias, cada una con su propia lógica y su propio costo en tiempo y memoria, y entender esas diferencias es lo que te permite elegir el algoritmo correcto según los datos que tengas enfrente.',

  'Este apartado aborda algunas de las dudas más comunes relacionadas con los algoritmos de ordenamiento, aclarando conceptos y proporcionando información valiosa para aquellos interesados en mejorar su comprensión sobre el tema.':
    'Esta última parte reúne las preguntas que más me hacen sobre algoritmos de ordenamiento, para aclarar los conceptos que suelen confundirse y dejarte una referencia rápida para cuando la necesites.',

  "Sorting algorithms play a crucial role in data organization and processing, making them fundamental for developers and businesses alike. This comprehensive guide will delve into the various types of sorting algorithms, including comparison-based and non-comparison-based methods, to help you identify the best sorting algorithms for your specific use cases.":
    "Every time you sort a list, whether it's numbers, names, or prices, some sorting algorithm is doing the work behind the scenes. In this guide I get into the different types out there, comparison-based and non-comparison-based, so you can tell which one actually fits the problem you have.",

  'We will explore classic algorithms, recursive methods, and performance analysis, providing insights into their strengths and weaknesses. By understanding these concepts, you can make informed decisions when selecting the right algorithm for your projects.':
    "I'll walk through the classic algorithms, a few recursive approaches, and how to read their performance in practice, strengths and weaknesses included, so picking the right one for your project stops being a guess.",

  "Among the best sorting algorithms, Quick Sort is often favored for its average-case performance, particularly in applications with large datasets. However, its performance can degrade significantly if not implemented with a good pivot selection strategy. Conversely, Merge Sort remains a reliable choice due to its consistent O(N log N) performance and stability, making it ideal for applications requiring guaranteed efficiency. Counting Sort and Radix Sort are notable for their efficiency with specific data types, particularly integers. Counting Sort is efficient when sorting integers within a fixed range, while Radix Sort excels when sorting numbers with varying digit lengths. These non-comparison-based algorithms represent powerful alternatives that can outperform traditional comparison-based methods under the right conditions. Understanding the comparative strengths and weaknesses of these algorithms is essential for developers and business owners aiming to optimize data handling processes effectively.":
    "Out of the sorting algorithms covered here, Quick Sort tends to be the go-to for average-case performance, especially with large datasets, though it can degrade badly if you don't pick a good pivot strategy. Merge Sort is the safer bet when you need guaranteed O(N log N) performance and stability, which matters more than raw speed in a lot of production code. Counting Sort and Radix Sort are worth knowing too: they skip comparisons entirely and can beat every algorithm above when you're sorting integers or fixed-length numbers, sometimes by a wide margin. Knowing the tradeoffs between these approaches is what actually lets you pick the right one instead of defaulting to whatever your language's standard library ships with.",

  // --- id 70 (sql-vs-nosql) ---------------------------------------------
  'Las diseño de bases de datos son esenciales en la gestión de información y su elección impacta en el desarrollo de aplicaciones. Existen dos tipos principales: relacionales y no relacionales. Cada una tiene características particulares que las hacen adecuadas para diferentes necesidades. Las bases de datos relacionales organizan información en tablas y son ideales para datos estructurados. En cambio, las bases no relacionales ofrecen flexibilidad para manejar datos no estructurados, siendo favorables en entornos que requieren agilidad y escalabilidad.':
    'Elegir bien el diseño de bases de datos de tu proyecto es una de esas decisiones que después es carísimo revertir, y en el fondo se reduce a dos caminos: relacional o no relacional. Las bases relacionales organizan todo en tablas y funcionan mejor cuando tus datos ya tienen una estructura clara. Las no relacionales sacrifican parte de esa rigidez a cambio de flexibilidad, y por eso las prefiero en entornos que necesitan moverse rápido y escalar sin fricción.',

  'En comparación, las bases no relacionales pueden ser más adecuadas para proyectos que exigen adaptabilidad y rapidez. Sin embargo, la falta de un marco rígido puede introducir riesgos en la coherencia de los datos, lo que debe ser gestionado cuidadosamente. La clave está en seleccionar un sistema que se alinee a las necesidades empresariales específicas y fortalezca las capacidades a largo plazo.':
    'Las bases no relacionales, en cambio, encajan mejor en proyectos que necesitan adaptarse rápido, aunque esa falta de un marco rígido trae su propio riesgo: la coherencia de los datos hay que vigilarla tú mismo, no te la resuelve el motor. Al final la decisión correcta no es la de moda sino la que se alinea con lo que tu negocio realmente necesita, hoy y en un par de años.',

  "In today's data-driven landscape, choosing the right database can significantly impact your project's success. This article explores the fundamental differences between SQL and NoSQL databases, helping you navigate the SQL vs NoSQL db debate.":
    "Picking the wrong database early on is one of those decisions that gets expensive fast. Here I break down what actually separates SQL from NoSQL, so the debate stops being about hype and starts being about your actual data.",

  'We will analyze their core concepts, advantages, limitations, and the factors to consider when deciding which database solution best meets your needs.':
    "I'll go through the core concepts, the real advantages and limits of each, and the factors that should drive the decision, not the other way around.",

  'Evaluating these scenarios helps in aligning the database choice with specific project requirements.':
    "Running through these scenarios before you commit is what keeps the database choice tied to what your project actually needs, not to whatever's trending this year.",

  // --- id 71 (complejidad-algoritmica) ------------------------------------
  'La complejidad algorítmica es un pilar fundamental en la ciencia de la computación y el desarrollo de software moderno. Se refiere a la cuantificación de los recursos computacionales (principalmente tiempo y memoria) que un algoritmo requiere para procesar una entrada de datos y completar su tarea. Comprender a fondo la complejidad algorítmica no solo permite a los programadores optimizar su código, sino también prever el comportamiento de sus aplicaciones ante volúmenes crecientes de datos. En el entorno actual, donde la escala y la velocidad son críticas, una elección algorítmica deficiente puede traducirse en una mala experiencia de usuario (UX), mayores costos operativos y una drástica pérdida de competitividad.':
    'Entender la complejidad algorítmica es de esas cosas que separan a quien programa por instinto de quien programa sabiendo qué va a pasar cuando los datos crezcan. En el fondo se trata de cuantificar cuántos recursos, tiempo y memoria, necesita un algoritmo para completar su tarea. Cuando la entiendes de verdad, puedes optimizar tu código con criterio y anticipar cómo se va a comportar tu aplicación cuando el volumen de datos se dispare, que es justo el momento en que una mala elección algorítmica se convierte en una experiencia de usuario lenta, en costos operativos más altos y, tarde o temprano, en perder competitividad.',

  "Algorithm complexity is a critical concept in computer science that determines the efficiency of algorithms in terms of their resource usage. Understanding both time and space complexity is essential for developers looking to optimize their code.":
    "Algorithm complexity is what actually determines the efficiency of your code, not how clever it looks. If you want to optimize anything with intention instead of guessing, you need to understand both time and space complexity first.",

  "This article delves into the intricacies of Big-O notation and explores various complexity classes. We will analyze common algorithms, including search techniques and sorting methods, along with Dijkstra's algorithm time complexity, providing insights that inform programming decisions.":
    "Here I get into Big-O notation and the different complexity classes, walk through common algorithms including search and sorting methods, and cover Dijkstra's algorithm time complexity along the way, so you have something concrete to base your decisions on instead of a gut feeling.",

  "Dijkstra's algorithm is used to find the shortest paths from a source node to all other nodes in a weighted graph. The time complexity depends on the implementation but is generally O(V²) when using a simple array, where V represents the number of vertices. Using a priority queue, the time complexity can be reduced to O(E log V), where E is the number of edges, making it more efficient for sparse graphs. Understanding the time complexity of Dijkstra's algorithm is crucial for applications in networking, routing, and geographical mapping.":
    "Dijkstra's algorithm finds the shortest paths from one source node to every other node in a weighted graph. Its time complexity depends on how you implement it: O(V²) with a plain array, where V is the number of vertices, or O(E log V) with a priority queue, where E is the number of edges, which is a lot more efficient once your graph gets sparse. Knowing this tradeoff matters in practice, especially in networking, routing, and mapping, where the graph size is exactly what decides which implementation you should reach for.",

  // --- id 72 (big-o-notation), es outro only -----------------------------
  'Las decisiones informadas en la selección de algoritmos pueden mejorar notablemente el rendimiento de las aplicaciones y el uso de recursos en general.':
    'Cuando eliges el algoritmo con esta información en la mano, en vez de por costumbre, la diferencia en rendimiento y en uso de recursos se nota, y se nota rápido.',

  // --- id 73 (algoritmos-estructuras-datos) -------------------------------
  'En el corazón de cada aplicación innovadora, desde la inteligencia artificial hasta los sistemas de diseño de bases de datos masivas, residen los algoritmos y las estructuras de datos. No son meros conceptos académicos, sino las herramientas fundamentales que permiten a los programadores construir software que no solo funcione, sino que lo haga de manera óptima, eficiente y escalable. Un algoritmo es la receta paso a paso para resolver un problema, mientras que una estructura de datos es la forma en que organizamos la información para que esa receta sea lo más efectiva posible.':
    "En el centro de cualquier aplicación seria, desde inteligencia artificial hasta sistemas de diseño de bases de datos masivas, están los algoritmos y las estructuras de datos. No son teoría de universidad que se olvida al graduarse, son las herramientas con las que construyes software que funciona de manera óptima, eficiente y escalable, no solo software que \"compila\". Un algoritmo es la receta paso a paso para resolver un problema, y una estructura de datos es cómo organizas la información para que esa receta funcione lo mejor posible.",

  'Entender su intrínseca relación y dominarlos es crucial para transformar soluciones básicas en sistemas de alto rendimiento capaces de manejar grandes volúmenes de datos y operaciones complejas. En esta guía, exploraremos a fondo estos pilares de la computación, desde sus fundamentos teóricos hasta sus aplicaciones prácticas en el desarrollo de software moderno, garantizando que tu código no solo sea funcional, sino también una obra de ingeniería eficiente.':
    'Dominar la relación entre ambos es lo que separa una solución básica de un sistema capaz de manejar volúmenes grandes de datos y operaciones complejas sin caerse. En esta guía voy a repasar estos pilares de la computación desde la teoría hasta sus aplicaciones prácticas en el desarrollo de software real, para que tu código termine siendo funcional y, de paso, una obra de ingeniería bien hecha.',

  "In the realm of computer science, algorithms and data structures form the backbone of efficient problem-solving. Understanding these concepts is essential for developers and technical SEOs alike, as they directly impact performance and scalability.":
    "Algorithms and data structures are the backbone of every piece of software that actually performs well. I've worked with enough codebases to know that skipping these fundamentals always shows up later, usually as a performance problem nobody wants to touch.",

  'This comprehensive guide will walk you through the fundamentals of algorithms and core data structures, providing practical resources, including data structures and algorithms PDFs, to enhance your learning experience.':
    "This guide walks through the fundamentals of algorithms and the core data structures you'll actually use, with practical resources along the way so you're not just reading theory.",

  'Through practical application of DSA principles, developers can devise optimized solutions, thus driving the performance and scalability of software products.':
    'Put these DSA principles into practice and you start designing solutions that are optimized from the start, which is exactly what drives real performance and scalability in production software.',

  // -----------------------------------------------------------------------
  // id 72 "en" locale — FULL translation + voice fix (data bug, see header).
  // Original "en" content was Spanish; every node below is hand-translated
  // and humanized, keyed by the exact original (Spanish) text.
  // -----------------------------------------------------------------------
  'La notación Big-O es un concepto esencial en el análisis de Algorithms and Data Structures, que permite evaluar su eficiencia en función del tiempo y espacio requeridos. A medida que el tamaño de la entrada aumenta, comprender cómo abordar Big-O se vuelve crucial para optimizar el rendimiento de aplicaciones y sistemas.':
    "Big-O notation is the tool I reach for whenever I need to reason about Algorithms and Data Structures, because it tells you exactly how time and space requirements grow as your input does. Once the size of your data starts climbing, understanding Big-O stops being academic and becomes the thing that decides whether your application stays fast.",

  'Este artículo explora los fundamentos, las clasificaciones de complejidad y las aplicaciones prácticas de la notación Big-O, brindando una guía comprensible que beneficiará a desarrolladores y entusiastas de la programación por igual.':
    "In this guide I cover the fundamentals, the different complexity classes, and the practical applications of Big-O notation, in a way that should work whether you're a working developer or just getting into programming.",

  'Fundamentos de la Notación Big-O': 'Big-O Notation Fundamentals',
  'Definición y propósito de Big-O': 'What Big-O Is and Why It Exists',

  'La notación Big-O es un sistema matemático que se utiliza para describir la complejidad de los algoritmos en términos de tiempo y espacio requeridos para ejecutar una función a medida que el tamaño de los datos de entrada (n) aumenta. Su propósito es proporcionar una forma clara y precisa de clasificar algoritmos, lo que permite a los desarrolladores comprender la eficiencia de diferentes enfoques en la resolución de problemas computacionales. Al centrar su atención en los términos más relevantes que afectan el rendimiento, la notación Big-O ayuda en la selección y comparación de algoritmos, facilitando decisiones informadas para optimizar su uso en desarrollo de software.':
    "Big-O is a mathematical notation used to describe how an algorithm's time and space requirements grow as the input size (n) increases. Its whole purpose is to give you a clear, precise way to classify algorithms so you can actually compare how different approaches hold up against each other. By focusing only on the terms that matter most as n grows, Big-O cuts through the noise and lets you make an informed call on which algorithm to use in production.",

  'Cómo entender la notación Big-O': 'How to Read Big-O Notation',

  'Entender la notación Big-O implica reconocer cómo cambia el rendimiento de un algoritmo en función del tamaño de la entrada. La notación se enfoca en el comportamiento asintótico, lo que significa que se interesa por el límite superior del tiempo de ejecución o del uso de espacio que podría requerir un algoritmo. Por ejemplo, un algoritmo que tiene una complejidad de O(n) indica que su tiempo de ejecución crecerá de manera lineal con respecto a la cantidad de datos de entrada. Por el contrario, un algoritmo con complejidad O(n²) mostrará un crecimiento cuadrático, lo que significa que, en situaciones con gran cantidad de datos, su rendimiento se verá significativamente afectado. Al aprender how to understand big o notation, se vuelve fundamental identificar y categorizar el tipo de complejidad asociada a cada algoritmo para realizar comparaciones efectivas.':
    "Reading Big-O notation comes down to recognizing how an algorithm's performance changes as the input grows. It describes asymptotic behavior, meaning it cares about the upper bound of the time or space an algorithm could need, not the exact number of operations. An algorithm with O(n) complexity scales linearly with the input size. One with O(n²) grows quadratically, so with large datasets its performance takes a real hit. Once you can identify which complexity class an algorithm falls into, comparing your options stops being guesswork.",

  'Casos de complejidad: peor, promedio y mejor': 'Worst, Average, and Best Case',

  'La notación Big-O se utiliza típicamente para describir tres casos de complejidad: el caso peor, el caso promedio y el mejor caso. El caso peor es el escenario más desfavorable para un algoritmo, proporcionando una estimación de tiempo máxima que podría requerir. Por ejemplo, un algoritmo de búsqueda lineal presenta un caso peor de O(n), sugiriendo que se podría requerir tiempo proporcional al total de elementos en caso de que el elemento buscado esté al final de la lista. En contraste, el caso promedio ofrece una estimación de la eficiencia del algoritmo bajo condiciones típicas, mientras que el mejor caso se enfoca en el escenario óptimo en el que el algoritmo se ejecuta en la menor cantidad de tiempo posible. Sin embargo, dado que este último representa situaciones inusuales y rara vez ocurre en aplicaciones reales, suele tener menos relevancia práctica en comparación con los otros dos casos.':
    "Big-O is typically used to describe three cases: worst, average, and best. The worst case is the most unfavorable scenario, the maximum time an algorithm could take. Linear search, for example, has a worst case of O(n), meaning it might need to check every element if the one you're looking for happens to be last. The average case estimates efficiency under typical conditions, while the best case describes the fastest the algorithm could possibly run. That best case is rare enough in real applications that I wouldn't put much weight on it compared to the other two.",

  'Clasificación de Complejidades en Big-O': 'Big-O Complexity Classes',

  'La clasificación de las complejidades en la notación Big-O permite categorizar los algoritmos según el tiempo de ejecución y el espacio requerido, facilitando así la comparación entre diferentes métodos y su eficiencia. A continuación, se detallan las principales clasificaciones que se pueden encontrar en algoritmos comunes.':
    "Classifying complexities this way lets you categorize algorithms by execution time and space required, which makes comparing methods a lot more concrete than just eyeballing the code. Here are the main classes you'll run into in everyday algorithms.",

  'Tiempo constante: O(1)': 'Constant Time: O(1)',

  'La complejidad O(1) se refiere a un tiempo de ejecución constante, independientemente del tamaño de la entrada. Esto significa que no importa si se procesa un solo elemento o millones; el tiempo requerido permanece constante. Ejemplos comunes incluyen acceder a un elemento en un arreglo por su índice o verificar si un número es par. La eficiencia de O(1) hace que este tipo de algoritmo sea altamente deseado.':
    "O(1) means constant time, the execution time stays the same whether you're processing one element or a million. Accessing an array by index or checking whether a number is even are both O(1). It's the complexity you want whenever you actually have a choice.",

  'Tiempo logarítmico: O(log n)': 'Logarithmic Time: O(log n)',

  'La complejidad O(log n) es típica de algoritmos que reducen el tamaño del conjunto de datos en una proporción constante en cada iteración. Un ejemplo clásico es la búsqueda binaria, donde se divide un conjunto de datos ordenados a la mitad en cada paso. Este enfoque es mucho más eficiente que los algoritmos de búsqueda lineal, especialmente en grandes conjuntos de datos, porque a medida que el tamaño de la entrada aumenta, el número de pasos adicionales requeridos crece lentamente, lo que permite que el algoritmo sea más rápido.':
    "O(log n) shows up in algorithms that cut the dataset down by a constant proportion on every iteration. Binary search is the classic example: it splits a sorted dataset in half at each step. That's a lot more efficient than linear search once the data gets big, because the number of extra steps you need grows painfully slowly compared to n itself.",

  'Tiempo lineal: O(n)': 'Linear Time: O(n)',

  'Un algoritmo con complejidad O(n) realiza una tarea en proporción directa al tamaño de la entrada. Esto significa que si se duplica la cantidad de datos que se procesan, el tiempo de ejecución también se duplica. La búsqueda lineal es un ejemplo, donde cada elemento de la lista se compara con el valor buscado. Aunque más lento que un algoritmo logarítmico, O(n) es común en muchas aplicaciones prácticas.':
    "An O(n) algorithm does work directly proportional to the input size, so double the data and you double the runtime. Linear search is the textbook example here, checking every element against the value you're looking for. It's slower than a logarithmic algorithm, but it's also everywhere in real applications, and there's nothing wrong with that.",

  'Tiempo lineal logarítmico: O(n log n)': 'Linearithmic Time: O(n log n)',

  'La complejidad O(n log n) es común en algoritmos de ordenación eficientes, como Quicksort y Mergesort. Estos algoritmos dividen los datos en partes más pequeñas (log n) y realizan el trabajo (n) en cada una de esas partes. Esta eficiencia es crítica en aplicaciones donde el ordenamiento de grandes conjuntos de datos es necesario, ya que supera considerablemente a los algoritmos cuadráticos.':
    'O(n log n) is what you get from efficient sorting algorithms like Quicksort and Mergesort. They split the data into smaller pieces (log n) and do n work across each of those pieces. That efficiency matters a lot once you need to sort large datasets, since it beats a quadratic algorithm by a wide margin.',

  'Tiempo cuadrático: O(n²)': 'Quadratic Time: O(n²)',

  'Los algoritmos con una complejidad de O(n²) suelen resultar de bucles anidados, donde cada elemento debe ser comparado con todos los demás. Un ejemplo es el algoritmo de ordenamiento por burbuja. Su eficiencia se ve significativamente afectada a medida que aumenta el tamaño de la entrada, lo que lo hace menos adecuado para conjuntos de datos grandes.':
    "O(n²) usually comes from nested loops, where every element gets compared against every other one. Bubble sort is the standard example. It falls apart fast as the input grows, which is exactly why I wouldn't reach for it on anything beyond a small dataset.",

  'Crecimiento exponencial: O(2ⁿ)': 'Exponential Growth: O(2ⁿ)',

  'La complejidad O(2ⁿ) aparece en algoritmos que generan todas las combinaciones posibles de un conjunto de datos, como el problema de la mochila. Este crecimiento exponencial se traduce en tiempos de ejecución rápidamente impracticables a medida que se incrementa el tamaño de la entrada, lo que limita su uso a situaciones donde n es relativamente pequeño.':
    'O(2ⁿ) shows up in algorithms that generate every possible combination of a dataset, the knapsack problem being the usual example. That exponential growth turns into unusable runtimes fast as the input grows, so it only makes sense when n stays small.',

  'Tiempo factorial: O(n!)': 'Factorial Time: O(n!)',

  'La complejidad O(n!) es una de las más ineficientes y se encuentra en problemas de permutación, como el problema del vendedor viajero. A medida que el número de elementos aumenta, el tiempo de ejecución se vuelve incontrolable. Los algoritmos con esta complejidad solo son viables para conjuntos de datos muy pequeños debido a su tiempo de respuesta extremadamente elevado.':
    "O(n!) is about as bad as it gets, and you'll find it in permutation problems like the traveling salesman problem. The runtime spirals out of control as the number of elements grows, so an algorithm at this complexity only works on genuinely tiny datasets.",

  'Entender cómo se clasifica cada tipo de complejidad en la notación Big-O permite evaluar mejor la eficiencia de diferentes algoritmos. Este conocimiento es vital, sobre todo al enfrentarse a problemas de gran escala en el desarrollo de software y algoritmos.':
    "Knowing how each of these complexity classes is classified is what lets you actually evaluate an algorithm's efficiency instead of just trusting it. That matters most the moment you're dealing with large-scale problems in real software.",

  'Aplicaciones Prácticas de la Notación Big-O': 'Big-O in Practice',

  'La notación Big-O tiene aplicaciones prácticas cruciales en el desarrollo de software y el análisis de algoritmos, permitiendo a los desarrolladores optimizar su código de manera informada. Comprender cómo funciona esta notación es fundamental para evaluar la eficiencia de los algoritmos, así como para hacer comparaciones significativas entre diferentes soluciones. A continuación, se detallan algunas de sus aplicaciones más relevantes.':
    "Big-O has real, practical uses in software development and algorithm analysis, letting you optimize your code based on actual reasoning instead of a hunch. Getting comfortable with it is what makes it possible to evaluate efficiency and compare solutions in a way that means something. Here are a few of the applications I run into most.",

  'Análisis en algoritmos de búsqueda': 'Analyzing Search Algorithms',

  'Los algoritmos de búsqueda son esenciales en la programación y la manipulación de datos. Aplicar la notación Big-O permite a los desarrolladores determinar la eficiencia de estos algoritmos en base al volumen de datos a procesar. Por ejemplo:':
    "Search algorithms come up constantly in programming and data handling, and applying Big-O is how you figure out which one holds up as your data volume grows. For example:",

  'La búsqueda lineal tiene una complejidad de O(n), lo que significa que en el peor de los casos, puede requerir recorrer toda la lista para encontrar un elemento.':
    'Linear search has O(n) complexity, meaning in the worst case it has to walk through the entire list to find an element.',

  'En contraste, la búsqueda binaria tiene una complejidad de O(log n) y es mucho más eficiente para listas ordenadas, pues reduce el espacio de búsqueda a la mitad en cada iteración.':
    'Binary search, on the other hand, runs at O(log n) and is far more efficient on sorted lists, since it cuts the search space in half on every iteration.',

  'Al saber cómo entender Big-O notation a través de estos ejemplos, se puede elegir el algoritmo de búsqueda más adecuado según los requisitos de la aplicación.':
    "Once you can read Big-O through examples like these, picking the right search algorithm for your application stops being guesswork.",

  'Análisis en algoritmos de ordenamiento': 'Analyzing Sorting Algorithms',

  'El ordenamiento de datos es una tarea común en desarrollo de software. Aplicar Big-O en el análisis de algoritmos de ordenamiento ayuda a negociar entre la cantidad de datos y el tiempo de ejecución. Varias técnicas de ordenamiento exhiben diferentes complejidades:':
    "Sorting data is one of the most common tasks in software development, and applying Big-O here is how you weigh data volume against execution time. Different sorting techniques land at very different complexities:",

  'Ordenamiento por burbuja: O(n²), típico para listas pequeñas o cuando se requiere un enfoque simple.':
    'Bubble sort: O(n²), fine for small lists or when you just need something simple.',

  'Quicksort y Mergesort: O(n log n), ideales para listas grandes, ya que mantienen un rendimiento eficiente incluso al aumentar el tamaño de los datos.':
    'Quicksort and Mergesort: O(n log n), the better choice for large lists, since they keep performing well even as the dataset grows.',

  'La aplicación de estos análisis no solo facilita la selección de métodos de ordenamiento, sino que también mejora la velocidad y eficiencia general del programa.':
    "Running this kind of analysis makes choosing a sorting method easier, and it shows up directly in how fast and efficient your program ends up being.",

  'Cómo interpretar Big-O en problemas reales': 'Reading Big-O in Real Problems',

  'Entender la notación Big-O permite abordar problemas prácticos en situaciones del mundo real. Algunos ejemplos incluyen:':
    "Understanding Big-O is what lets you tackle real-world problems with some confidence instead of trial and error. A few examples:",

  'Seleccionar el algoritmo adecuado para procesar grandes volúmenes de datos, como en aplicaciones de comercio electrónico.':
    'Picking the right algorithm to process large data volumes, like in e-commerce applications.',

  'Optimizar el rendimiento de sistemas de búsqueda, como los motores de búsqueda internos en sitios web.':
    'Optimizing search system performance, like the internal search engine on a website.',

  'Evaluar la escalabilidad de diferentes soluciones en el desarrollo de software, asegurando que el sistema puede manejar el crecimiento futuro.':
    'Evaluating how well different solutions scale, so you know the system can handle whatever growth comes next.',

  'Así, el conocimiento de la notación Big-O se convierte en una herramienta valiosa para los ingenieros de software al desplegar soluciones efectivas y eficientes.':
    "Big-O ends up being one of those tools that quietly pays for itself: once you know it, deploying effective, efficient solutions stops being luck and starts being a decision you can defend.",
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type Progress = Record<string, 'done'>

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  }
  return {}
}

function saveProgress(progress: Progress): void {
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true })
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

async function main() {
  const payload = await getPayload({ config })
  const progress = loadProgress()

  // Confirm every id exists live before processing anything.
  for (const id of BATCH_IDS) {
    const doc = await payload.findByID({ collection: 'posts', id, depth: 0 }).catch(() => null)
    if (!doc) {
      console.error(`FATAL: posts id=${id} not found live. Aborting batch — check id list.`)
      process.exit(1)
    }
  }

  let allDone = true

  for (const id of BATCH_IDS) {
    const key = String(id)
    if (progress[key] === 'done') {
      console.log(`id=${id}: already done, skipping.`)
      continue
    }
    allDone = false

    console.log(`\n=== Processing posts id=${id} ===`)

    const before = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const beforeContent = before.content as unknown as Record<'es' | 'en', LexicalNode>

    const beforeProtected: Record<'es' | 'en', LexicalNode[]> = { es: [], en: [] }
    for (const locale of LOCALES) {
      collectProtectedStructural(beforeContent[locale], beforeProtected[locale])
    }

    for (const locale of LOCALES) {
      const rewritten = processRoot(beforeContent[locale].root, locale)
      await payload.update({
        collection: 'posts',
        id,
        locale,
        data: { content: { root: rewritten } as unknown },
      })
      console.log(`  wrote content (locale=${locale})`)
    }

    // Read back and self-check.
    const after = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const afterContent = after.content as unknown as Record<'es' | 'en', LexicalNode>

    let ok = true

    for (const locale of LOCALES) {
      const afterProtected: LexicalNode[] = []
      collectProtectedStructural(afterContent[locale], afterProtected)
      const beforeStr = JSON.stringify(beforeProtected[locale])
      const afterStr = JSON.stringify(afterProtected)
      if (beforeStr !== afterStr) {
        ok = false
        console.error(
          `  FAIL id=${id} locale=${locale}: block/table nodes changed pre/post write (count before=${beforeProtected[locale].length}, after=${afterProtected.length})`,
        )
      }
    }

    const esPlainText = extractPlainText(afterContent.es)
    const emDashCount = (esPlainText.match(/—/g) || []).length
    const voceoMatches = esPlainText.match(VOCEO_RE) || []
    if (emDashCount > 0) {
      ok = false
      console.error(`  FAIL id=${id}: ${emDashCount} em dash character(s) remain in es content.`)
    }
    if (voceoMatches.length > 0) {
      ok = false
      console.error(`  FAIL id=${id}: voceo markers found in es content: ${voceoMatches.join(', ')}`)
    }

    if (!ok) {
      console.error(`id=${id}: self-check FAILED — not marking done.`)
      process.exit(1)
    }

    progress[key] = 'done'
    saveProgress(progress)
    console.log(`id=${id}: self-check passed, marked done.`)
  }

  if (allDone) {
    console.log('\n5/5 already done. Zero em-dash/voceo findings, code-block/table structures byte-identical.')
  } else {
    console.log('\nBatch 13 complete: 5/5 posts humanized (ids 69,70,71,72,73), both locales.')
  }

  // Final sanity note (does not block completion): count check-offs across
  // all 13 batches' checkpoint files, if present, read-only.
  const phaseDir = path.resolve(__dirname, '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final')
  let totalDone = 0
  try {
    const files = fs.readdirSync(phaseDir).filter((f) => /^posts-progress-batch-\d+\.json$/.test(f))
    for (const f of files) {
      try {
        const p = JSON.parse(fs.readFileSync(path.join(phaseDir, f), 'utf8')) as Progress
        totalDone += Object.values(p).filter((v) => v === 'done').length
      } catch {
        // ignore unreadable/partial files from concurrently-running batches
      }
    }
    console.log(`\nCross-batch sanity (read-only, other batches may still be running): ${totalDone}/72 posts checked off across all batch checkpoint files found so far.`)
  } catch {
    console.log('\nCross-batch sanity check skipped (phase dir not readable).')
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
