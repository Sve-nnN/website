/**
 * Segunda tanda de meta descriptions (issue #8, hallazgo posterior).
 *
 * El #8 se cerró con las 15 rutas de su baseline, pero ese baseline salió de
 * una corrida de Lighthouse sobre 62 rutas del 2026-08-14. La corrida completa
 * del 2026-08-22, ya con el sitio en ISR, encontró cinco entradas más sin
 * `<meta name="description">` que no estaban en aquella lista.
 *
 * Mismo criterio que `13-meta-descriptions.ts`: escritas a mano leyendo cada
 * artículo, en los dos idiomas, entre 120 y 155 caracteres, y el script se
 * niega a escribir si alguna se sale del rango. Igual que allá, se saltean los
 * posts sin traducción real en inglés: eso es el issue #7.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/15-meta-descriptions-ronda-2.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/15-meta-descriptions-ronda-2.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')
const SKIPPED: string[] = []

const MIN = 120
const MAX = 155

const POSTS: Record<string, { es: string; en: string }> = {
  'heap-data-structure': {
    es: 'Qué es un heap y para qué sirve: propiedad de montículo, inserción y extracción, y por qué es la estructura detrás de las colas de prioridad.',
    en: 'What a heap is and what it buys you: the heap property, insertion and extraction, and why it is the structure behind priority queues.',
  },
  'queue-data-structure': {
    es: 'La cola explicada por su regla FIFO: cómo se implementa, qué variantes existen (circular, de prioridad, deque) y dónde aparece en algoritmos.',
    en: 'The queue explained through its FIFO rule: how to implement it, which variants exist (circular, priority, deque) and where algorithms use it.',
  },
  'headless-cms-seo': {
    es: 'SEO en un CMS headless: qué se rompe cuando el front se separa del contenido, y cómo resolver renderizado, metadatos y rendimiento sin perder.',
    en: 'SEO on a headless CMS: what breaks when the front end splits from the content, and how to handle rendering, metadata and performance safely.',
  },
  'nextjs-seo': {
    es: 'SEO en Next.js sin adivinar: qué estrategia de renderizado conviene a cada página, cómo emitir los metadatos y qué mirar en Core Web Vitals.',
    en: 'Next.js SEO without guesswork: which rendering strategy fits each page, how to emit metadata, and what to watch in your Core Web Vitals.',
  },
  'technical-seo-checklist': {
    es: 'Checklist de SEO técnico con los diez puntos que de verdad mueven la aguja: HTTPS, errores de rastreo, enlaces rotos, estructura y velocidad.',
    en: 'A technical SEO checklist of the ten items that actually move the needle: HTTPS, crawl errors, broken links, site structure and load speed.',
  },
}

function checkLengths(): boolean {
  let ok = true
  for (const [slug, copy] of Object.entries(POSTS)) {
    for (const locale of ['es', 'en'] as const) {
      const length = copy[locale].length
      const bad = length < MIN || length > MAX
      if (bad) ok = false
      console.log(`  ${String(length).padStart(3)}  ${locale}  ${slug}${bad ? '  <-- FUERA DE RANGO' : ''}`)
    }
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
      // `fallbackLocale: false` por la misma razón que en el script 13: sin
      // eso un post sin traducir devuelve el texto en español y parece
      // traducido, y el update revienta contra los campos requeridos vacíos.
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
        // Sin `draft: false` el doc publicado vuelve a borrador y desaparece.
        draft: false,
        data: { meta: { ...(doc.meta ?? {}), description: copy[locale] } },
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

  const total = Object.keys(POSTS).length * 2
  console.log(
    process.exitCode
      ? '  hay diferencias, mirar arriba'
      : `  escritas ${total - SKIPPED.length} de ${total} descripciones`,
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
