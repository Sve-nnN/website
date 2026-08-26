/**
 * Escribe las meta descriptions que faltan por completo (issue #43, grupo 1).
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/19-meta-descriptions-faltantes.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/19-meta-descriptions-faltantes.ts --apply
 *
 * ── Qué se corrige acá y qué no ─────────────────────────────────────────────
 *
 * Medido contra la base el 2026-08-26, sobre 166 docs-locale publicados:
 *
 *   60  tienen `meta.description` propia
 *   106 no la tienen, y de esos:
 *       10  no tienen NADA que sirva de fallback -> la página se sirve sin
 *           etiqueta `<meta name="description">`, y Google inventa el snippet
 *       62  caen al `excerpt`, que pasa de 160 caracteres y sale cortado
 *       ~34 caen a un fallback corto que funciona
 *
 * Este script cubre SOLO los 10 sin etiqueta, que son 5 slugs en dos idiomas.
 * Los 62 con excerpt largo van aparte: ahí la decisión no es escribir una
 * description, es que el `excerpt` está cumpliendo dos funciones (teaser en el
 * listado y snippet en la SERP) que necesitan longitudes distintas.
 *
 * ── Por qué el issue decía otra cosa ────────────────────────────────────────
 *
 * La auditoría contó lo que se sirve en el HTML y dedujo "10 sin description,
 * 80 largas". Mirando la base, el reparto real es otro: casi nadie tiene
 * `meta.description`, y lo que se ve en el HTML sale del fallback a `excerpt`.
 * El síntoma era correcto, la causa no.
 *
 * ── Sobre el inglés de technical-seo-guide ──────────────────────────────────
 *
 * `[en] technical-seo-guide` también está sin description, y NO se le escribe
 * una. Esa URL está en noindex desde #7 porque sirve el texto en español.
 * Escribirle un snippet en inglés sería maquillar el problema en vez de
 * resolverlo: cuando se traduzca, se le escribe la suya.
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

type Entry = {
  collection: 'posts'
  slug: string
  locale: 'es' | 'en'
  description: string
}

const ENTRIES: Entry[] = [
  {
    collection: 'posts',
    slug: 'binary-search-tree',
    locale: 'es',
    description:
      'Cómo funciona un árbol de búsqueda binaria: inserción, búsqueda y borrado, por qué importa el balanceo y los tres recorridos que vas a usar.',
  },
  {
    collection: 'posts',
    slug: 'merge-sort-python',
    locale: 'es',
    description:
      'Merge sort en Python paso a paso: cómo divide y combina, el código completo y en qué casos conviene frente a otros ordenamientos.',
  },
  {
    collection: 'posts',
    slug: 'quicksort-python',
    locale: 'es',
    description:
      'Quicksort en Python: cómo elige el pivote, el código listo para usar, su complejidad real y cuándo rinde mejor que merge sort.',
  },
  {
    collection: 'posts',
    slug: 'time-complexity',
    locale: 'es',
    description:
      'Qué es la complejidad temporal y cómo calcularla: las clases más comunes, cómo se clasifica un algoritmo y el análisis del de Prim.',
  },
  {
    collection: 'posts',
    slug: 'technical-seo-guide',
    locale: 'es',
    description:
      'SEO técnico para quien escribe el código: cómo ver tu sitio como lo ve Google y qué revisar antes de echarle la culpa al contenido.',
  },
  {
    collection: 'posts',
    slug: 'binary-search-tree',
    locale: 'en',
    // Sin mencionar balanceo, a diferencia de la versión española: los H2 del
    // artículo en inglés son fundamentals, core operations e in-order
    // traversal, y no cubre árboles balanceados. El snippet describe lo que
    // hay en la página, no lo que hay en su par en el otro idioma.
    description:
      'How a binary search tree works: the fundamentals, insert, search and delete, and why in-order traversal returns your data already sorted.',
  },
  {
    collection: 'posts',
    slug: 'merge-sort-python',
    locale: 'en',
    description:
      'Merge sort in Python from scratch: how the divide and merge steps work, the full implementation, its time complexity and where it falls short.',
  },
  {
    collection: 'posts',
    slug: 'quicksort-python',
    locale: 'en',
    description:
      'Quicksort in Python explained: pivot choice, working code, time and space complexity, and the trade-offs against other sorting algorithms.',
  },
  {
    collection: 'posts',
    slug: 'time-complexity',
    locale: 'en',
    description:
      'Time complexity explained: the core classes, how Big O describes them, how sorting algorithms compare and what is worth optimising first.',
  },
]

const MAX_LENGTH = 160

async function main() {
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} ===\n`)

  // Un snippet que se corta en la SERP no cumple su función. Se verifica acá y
  // no en revisión, porque el límite es del buscador, no una preferencia.
  const tooLong = ENTRIES.filter((e) => e.description.length > MAX_LENGTH)
  if (tooLong.length > 0) {
    console.error(`ABORTADO: ${tooLong.length} description(s) pasan de ${MAX_LENGTH} caracteres:`)
    for (const e of tooLong) console.error(`  ${e.description.length} [${e.locale}] ${e.slug}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  let written = 0
  let skipped = 0

  for (const entry of ENTRIES) {
    const { docs } = await payload.find({
      collection: entry.collection,
      where: { slug: { equals: entry.slug } },
      locale: entry.locale,
      // CRÍTICO. Sin esto Payload devuelve el valor ESPAÑOL cuando el campo en
      // inglés está vacío, que es su fallback de locale por defecto. La primera
      // versión de este script no lo tenía: escribió las 5 descriptions en
      // español y después, al llegar a las 4 inglesas, leyó ese mismo texto
      // español, lo tomó por "ya tiene una" y las salteó. Resultado: cuatro
      // páginas en inglés sirviendo un snippet en castellano, que es peor que
      // el hueco que veníamos a tapar.
      //
      // `fallbackLocale: false` hace que un campo vacío en `en` se lea vacío,
      // que es lo que hace falta para distinguir "no tiene" de "hereda".
      fallbackLocale: false,
      limit: 1,
      depth: 0,
    })

    const doc = docs[0] as
      | { id: number; _status?: string | null; meta?: Record<string, unknown> | null }
      | undefined

    if (!doc) {
      console.log(`  saltea (no existe)  [${entry.locale}] ${entry.slug}`)
      skipped++
      continue
    }

    const current = (doc.meta?.description as string | undefined) ?? ''
    if (current) {
      // No se pisa lo que ya haya: este script llena huecos, no reescribe.
      console.log(`  saltea (ya tiene)   [${entry.locale}] ${entry.slug}: ${current.slice(0, 60)}`)
      skipped++
      continue
    }

    console.log(
      `  ${APPLY ? 'escrito ' : 'escribiria'} [${entry.locale}] ${entry.slug} (${entry.description.length} car.)`,
    )
    console.log(`      ${entry.description}`)

    if (APPLY) {
      await payload.update({
        collection: entry.collection,
        id: doc.id,
        locale: entry.locale,
        // Sin `draft: false` un update sobre una colección con borradores
        // despublica el doc publicado. Ver scripts/db/05.
        draft: doc._status === 'published' ? false : undefined,
        // Se conserva el resto de `meta` (title, image): pasar solo
        // `description` reemplazaría el grupo entero y borraría lo demás.
        data: { meta: { ...(doc.meta ?? {}), description: entry.description } } as never,
      })
    }

    written++
  }

  console.log(`\n=== ${written} ${APPLY ? 'escritas' : 'a escribir'}, ${skipped} salteadas ===`)

  if (!APPLY) console.log('\nCorré con --apply para escribir.')

  process.exit(0)
}

main()
