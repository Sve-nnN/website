/**
 * Arregla el salto de h1 a h3 que vive en el contenido, no en el código
 * (issue #10.2).
 *
 * `/seo-tecnico-madrid` y `/seo-tecnico-lima` saltan de la h1 de la página a
 * un h3 ("Por qué un especialista remoto tiene sentido para tu empresa"). Ese
 * encabezado se escribió como H3 en el editor. No hay ningún H2 antes, así que
 * un lector de pantalla escucha un nivel que no existe.
 *
 * La regla que aplica el script: dentro de un mismo campo de rich text, si hay
 * H3 y no hay ningún H2, todos los H3 suben a H2. Sube el bloque entero, o sea
 * que la jerarquía relativa entre encabezados se mantiene intacta; lo único que
 * cambia es que arranca en el nivel que corresponde. Si el campo ya tiene un H2
 * en algún lado, no se toca: ahí el H3 es correcto.
 *
 * Visualmente los encabezados van a verse más grandes, porque el estilo va
 * atado al nivel. Es un cambio visible, chico y en tres páginas.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/14-fix-heading-levels.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/14-fix-heading-levels.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

// El indice de servicios entra por la misma razon que las dos landings
// locales: sus tarjetas se escribieron como H3 dentro del rich text, y arriba
// solo esta la h1 de la pagina. Verificado en el HTML servido tras el deploy,
// los `<h3>` salen de `payload-richtext` y no de ningun componente.
//
// El slug del documento es `services` aunque la URL en español sea
// /servicios: es la unica plantilla con el segmento traducido
// (SERVICES_INDEX_SLUG en src/lib/service-slugs.ts).
const SLUGS = ['services', 'seo-tecnico-madrid', 'seo-tecnico-lima']

type LexicalNode = { type?: string; tag?: string; children?: LexicalNode[] }

/** Todos los tags de heading que aparecen en un árbol lexical, en orden. */
function collectHeadingTags(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const child of node) collectHeadingTags(child, found)
    return found
  }
  if (!node || typeof node !== 'object') return found

  const typed = node as LexicalNode
  if (typed.type === 'heading' && typed.tag) found.push(typed.tag)

  for (const value of Object.values(node as Record<string, unknown>)) {
    if (value && typeof value === 'object') collectHeadingTags(value, found)
  }
  return found
}

/** Devuelve una copia con todos los `heading` h3 convertidos a h2. */
function promoteH3<T>(node: T): T {
  if (Array.isArray(node)) return node.map((child) => promoteH3(child)) as unknown as T
  if (!node || typeof node !== 'object') return node

  const entries = Object.entries(node as Record<string, unknown>).map(([key, value]) => [
    key,
    value && typeof value === 'object' ? promoteH3(value) : value,
  ])
  const copy = Object.fromEntries(entries) as Record<string, unknown>

  if (copy.type === 'heading' && copy.tag === 'h3') copy.tag = 'h2'

  return copy as T
}

async function main() {
  const payload = await getPayload({ config })
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} ===`)

  for (const locale of ['es', 'en'] as const) {
    for (const slug of SLUGS) {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        fallbackLocale: false,
        limit: 1,
      })
      const doc = docs[0]

      if (!doc) {
        console.log(`\n[${locale}] ${slug}: no existe en este idioma, se saltea`)
        continue
      }

      const before = collectHeadingTags(doc.content)
      const needsFix = before.includes('h3') && !before.includes('h2')

      console.log(`\n[${locale}] ${slug}`)
      console.log(`  encabezados: ${before.join(', ') || '(ninguno)'}`)

      if (!needsFix) {
        console.log('  ya tiene un h2, no se toca')
        continue
      }

      const fixed = promoteH3(doc.content)
      console.log(`  quedaria:    ${collectHeadingTags(fixed).join(', ')}`)

      if (!APPLY) continue

      await payload.update({
        collection: 'pages',
        id: doc.id,
        locale,
        // Sin `draft: false` la página publicada vuelve a borrador y desaparece
        // del sitio. Ya pasó dos veces con la colección Websites.
        draft: false,
        data: { content: fixed },
      })

      const { docs: after } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        fallbackLocale: false,
        limit: 1,
      })
      const written = collectHeadingTags(after[0]?.content)
      const stillBroken = written.includes('h3') && !written.includes('h2')
      console.log(`  escrito:     ${written.join(', ')}${stillBroken ? '  <-- SIGUE MAL' : ''}`)
      if (stillBroken) process.exitCode = 1
    }
  }

  if (!APPLY) console.log('\nCorré con --apply para escribir.')
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
