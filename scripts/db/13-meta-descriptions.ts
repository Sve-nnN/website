/**
 * Escribe la meta description de las 13 entradas y 2 categorías que no tenían
 * ninguna (issue #8).
 *
 * La plantilla de post ya cae al `excerpt` cuando falta `meta.description`
 * (`blog/[category]/[slug]/page.tsx:59`), así que estas quince rutas no tenían
 * ni una cosa ni la otra: salían sin `<meta name="description">` y Google
 * armaba el snippet por su cuenta. La de categoría sale de
 * `categories.description`, que también estaba vacía en dos.
 *
 * Están escritas a mano, una por una, leyendo cada artículo. No se generan
 * truncando el primer párrafo: un corte a 155 caracteres del intro deja frases
 * a la mitad y repite el título.
 *
 * `que-es-css` es la única URL del dominio que rankea algo hoy (`css`, posición
 * 23-26 en Ecuador y Colombia), así que es la que más pesa de las quince.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/13-meta-descriptions.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/13-meta-descriptions.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

const SKIPPED: string[] = []

const MIN = 120
const MAX = 155

type Copy = { es: string; en: string }

/** slug del post -> meta description por idioma. */
const POSTS: Record<string, Copy> = {
  'dynamic-programming': {
    es: 'Cómo partir un problema en subproblemas y dejar de recalcular lo mismo: memoización, tabulación y ejemplos como la distancia de edición.',
    en: 'How to break a problem into subproblems and stop recomputing the same work: memoisation, tabulation, and worked examples like edit distance.',
  },
  'graph-algorithms': {
    es: 'Recorridos BFS y DFS, caminos más cortos y detección de ciclos, con los casos donde cada algoritmo de grafos conviene y dónde se te rompe.',
    en: 'BFS and DFS traversals, shortest paths and cycle detection, with the cases where each graph algorithm earns its place and where it breaks.',
  },
  'que-es-css': {
    es: 'Qué es CSS y cómo funciona la cascada: selectores, especificidad, modelo de caja y layout, explicado desde cero y con ejemplos que podés copiar.',
    en: 'What CSS is and how the cascade works: selectors, specificity, the box model and layout, explained from scratch with examples you can copy.',
  },
  'space-complexity': {
    es: 'Cuánta memoria consume un algoritmo según el tamaño de su entrada, cómo se mide en notación Big O y dónde choca con la complejidad temporal.',
    en: 'How much memory an algorithm uses relative to its input, how to measure it in Big O notation, and where it trades off against time complexity.',
  },
  'tree-traversal': {
    es: 'Recorridos preorden, inorden, postorden y por niveles: qué hace cada uno, cuándo elegirlo y cómo se implementan con recursión o con una pila.',
    en: 'Preorder, inorder, postorder and level-order traversals: what each one does, when to pick it, and how to implement it with recursion or a stack.',
  },
  'astro-vs-nextjs': {
    es: 'Astro o Next.js según lo que estés construyendo: sitio de contenido o aplicación dinámica, con las diferencias de rendimiento y de hidratación.',
    en: 'Astro or Next.js depending on what you are building: content site or dynamic app, with the real differences in performance and hydration.',
  },
  'headless-cms-comparison': {
    es: 'Comparación de los CMS headless que valen la pena: modelo de contenido, API, precio y cuánto trabajo te ahorran de verdad al publicar.',
    en: 'A comparison of the headless CMSs worth your time: content model, API, pricing, and how much publishing work each one actually saves you.',
  },
  'nextjs-cms': {
    es: 'Cómo conectar Next.js con un CMS sin perder rendimiento: opciones de renderizado, revalidación del contenido y qué mirar antes de elegir uno.',
    en: 'How to pair Next.js with a CMS without losing performance: rendering options, content revalidation, and what to check before you pick one.',
  },
  'payload-cms-guide': {
    es: 'Payload CMS con lo que de verdad importa: colecciones, campos, la Local API y en qué proyectos conviene frente a los otros CMS headless.',
    en: 'Payload CMS covering what actually matters: collections, fields, the Local API, and the projects where it beats other headless options.',
  },
  'keyword-research-guide': {
    es: 'Cómo investigar palabras clave sin perder semanas: intención de búsqueda, volumen contra dificultad, agrupación por tema y qué descartar.',
    en: 'How to research keywords without burning weeks: search intent, volume against difficulty, grouping by topic, and what to discard early.',
  },
  'auditoria-seo': {
    es: 'Qué revisa una auditoría SEO en serio: rastreo, indexación, rendimiento y datos estructurados, y cómo ordenar los hallazgos por impacto real.',
    en: 'What a serious SEO audit checks: crawling, indexing, performance and structured data, and how to rank the findings by their real impact.',
  },
  'seo-on-page-guia': {
    es: 'SEO on page sin checklists vacías: intención, títulos, encabezados, enlazado interno y los detalles técnicos que sí mueven el posicionamiento.',
    en: 'On-page SEO without hollow checklists: intent, titles, headings, internal linking, and the technical details that actually move rankings.',
  },
  'structured-data-seo': {
    es: 'Datos estructurados que Google sí usa: qué tipos de schema conviene emitir, cómo validarlos y qué resultados enriquecidos podés esperar.',
    en: 'Structured data Google actually uses: which schema types are worth emitting, how to validate them, and which rich results to expect.',
  },
}

/** slug de la categoría -> description por idioma. */
const CATEGORIES: Record<string, Copy> = {
  development: {
    es: 'Artículos de desarrollo web: Next.js, CMS headless, bases de datos y decisiones de arquitectura, con el detalle técnico que cambia el resultado.',
    en: 'Web development articles: Next.js, headless CMSs, databases and architecture decisions, with the technical detail that changes the outcome.',
  },
  general: {
    es: 'Sección general del blog. Hoy los artículos viven en Ciencias de la Computación, Desarrollo, Estrategia SEO y SEO Técnico, que es donde conviene mirar.',
    en: 'The blog general section. Articles currently live under Computer Science, Development, SEO Strategy and Technical SEO, which is where to look.',
  },
}

function checkLengths(): boolean {
  let ok = true
  const rows: Array<[string, string, number]> = []

  for (const [slug, copy] of Object.entries({ ...POSTS, ...CATEGORIES })) {
    for (const locale of ['es', 'en'] as const) {
      const length = copy[locale].length
      rows.push([slug, locale, length])
      if (length < MIN || length > MAX) ok = false
    }
  }

  for (const [slug, locale, length] of rows) {
    const flag = length < MIN || length > MAX ? '  <-- FUERA DE RANGO' : ''
    console.log(`  ${String(length).padStart(3)}  ${locale}  ${slug}${flag}`)
  }

  return ok
}

async function main() {
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} ===`)
  console.log(`\n--- largos (objetivo ${MIN}-${MAX}) ---`)

  if (!checkLengths()) {
    console.error(`\nHay descripciones fuera del rango ${MIN}-${MAX}. No se escribe nada.`)
    process.exit(1)
  }

  const payload = await getPayload({ config })

  for (const locale of ['es', 'en'] as const) {
    console.log(`\n=== posts [${locale}] ===`)

    for (const [slug, copy] of Object.entries(POSTS)) {
      // `fallbackLocale: false` importa: sin eso, un post sin traducir devuelve
      // el texto en español y parece que la fila EN existe. Payload valida los
      // campos requeridos (title, content) al escribir, así que un update sobre
      // una fila EN vacía revienta con ValidationError en vez de escribir solo
      // la meta. Pasó con `space-complexity` (id 57) el 2026-08-20.
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        locale,
        fallbackLocale: false,
        limit: 1,
      })
      const doc = docs[0]

      if (!doc) {
        console.log(`  FALTA  ${slug} (no existe en la coleccion)`)
        process.exitCode = 1
        continue
      }

      // Un post sin título en este idioma no está traducido. Escribirle una
      // meta description en inglés sería rotular una página que sigue en
      // español: eso es el issue #7, no este.
      if (!doc.title) {
        console.log(`  SALTEADO  ${slug} (sin traduccion ${locale}; es del issue #7)`)
        SKIPPED.push(`${locale} ${slug}`)
        continue
      }

      const current = doc.meta?.description ?? ''
      console.log(`  ${slug}: "${current.slice(0, 40)}" -> "${copy[locale].slice(0, 40)}..."`)

      if (!APPLY) continue

      await payload.update({
        collection: 'posts',
        id: doc.id,
        locale,
        // Sin `draft: false` un update deja el doc publicado en estado borrador
        // y desaparece del sitio. Ya pasó dos veces con la colección Websites.
        draft: false,
        data: { meta: { ...(doc.meta ?? {}), description: copy[locale] } },
      })
    }

    console.log(`\n=== categorias [${locale}] ===`)

    for (const [slug, copy] of Object.entries(CATEGORIES)) {
      const { docs } = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
      })
      const doc = docs[0]

      if (!doc) {
        console.log(`  FALTA  ${slug} (no existe en la coleccion)`)
        process.exitCode = 1
        continue
      }

      console.log(`  ${slug}: "${(doc.description ?? '').slice(0, 40)}" -> "${copy[locale].slice(0, 40)}..."`)

      if (!APPLY) continue

      await payload.update({
        collection: 'categories',
        id: doc.id,
        locale,
        data: { description: copy[locale] },
      })
    }
  }

  if (!APPLY) {
    console.log('\nCorré con --apply para escribir.')
    return
  }

  console.log('\n--- verificacion ---')
  for (const locale of ['es', 'en'] as const) {
    for (const [slug, copy] of Object.entries(POSTS)) {
      if (SKIPPED.includes(`${locale} ${slug}`)) continue

      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        locale,
        fallbackLocale: false,
        limit: 1,
      })
      const written = docs[0]?.meta?.description ?? ''
      if (written !== copy[locale]) {
        console.error(`  MAL  ${locale} ${slug}: quedo "${written}"`)
        process.exitCode = 1
      }
    }
  }
  console.log(
    process.exitCode
      ? '  hay diferencias, mirar arriba'
      : `  escritas ${30 - SKIPPED.length} de 30 descripciones`,
  )

  if (SKIPPED.length) {
    console.log('\n--- salteadas por falta de traduccion (issue #7) ---')
    for (const entry of SKIPPED) console.log(`  ${entry}`)
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
