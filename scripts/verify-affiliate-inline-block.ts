/**
 * Verifica INL-01/INL-02 (48-03-PLAN.md Task 2) contra el dev server real
 * (ya debe estar corriendo en http://localhost:3000) conectado al Postgres
 * real de Dokploy, DESPUÉS de correr scripts/seed-phase48-inline-demo.ts.
 * Este archivo NO crea/borra datos — solo lee HTML servido y hace una
 * consulta Local API de solo lectura para confirmar la profundidad de
 * población.
 *
 * Requiere DEMO_SLUG en el entorno (el slug impreso por
 * seed-phase48-inline-demo.ts).
 *
 * Run (con el dev server ya arriba y la demo ya sembrada):
 *   DEMO_SLUG=<slug> node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-inline-block.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const DEMO_SLUG = process.env.DEMO_SLUG

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

async function fetchHtml(path: string): Promise<{ res: Response; html: string }> {
  const res = await fetch(`${BASE_URL}${path}`)
  const html = await res.text()
  return { res, html }
}

/** Encuentra el path real del post (categoría primaria) vía Local API, sin asumir la categoría. */
async function resolvePostPath(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
): Promise<{ path: string; categorySlug: string }> {
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    locale: 'es',
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })

  if (docs.length === 0) {
    throw new Error(`No se encontró el post slug=${slug} vía Local API.`)
  }

  const categories = (docs[0].categories ?? []) as Array<{ slug?: string } | number>
  const firstCategory = categories[0]
  const categorySlug =
    typeof firstCategory === 'object' && firstCategory !== null && firstCategory.slug
      ? firstCategory.slug
      : 'general'

  return { path: `/blog/${categorySlug}/${slug}`, categorySlug }
}

/**
 * Task 2 Paso 3: confirma EMPÍRICAMENTE que `fields.affiliateLink` dentro
 * del nodo Lexical llega poblado como objeto (con `.program` accesible) al
 * `depth` actual de `getCachedPost` (2, fijo en src/lib/cache.ts).
 */
async function verifyPopulationDepth(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
): Promise<void> {
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    locale: 'es',
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })

  if (docs.length === 0) {
    check(false, `verifyPopulationDepth: no se encontró el post slug=${slug}`)
    return
  }

  const children = (docs[0].content?.root?.children ?? []) as Array<{
    type?: string
    fields?: { blockType?: string; affiliateLink?: unknown }
  }>
  const blockNode = children.find(
    (n) => n.type === 'block' && n.fields?.blockType === 'affiliate-inline',
  )

  check(!!blockNode, `verifyPopulationDepth: no se encontró el nodo affiliate-inline en slug=${slug} a depth:2`)

  const link = blockNode?.fields?.affiliateLink
  const isPopulatedObject = typeof link === 'object' && link !== null && 'program' in (link as object)

  check(
    isPopulatedObject,
    `verifyPopulationDepth: fields.affiliateLink llegó como ${typeof link === 'object' ? JSON.stringify(link) : typeof link} en vez de un objeto poblado con .program a depth:2 — subir el depth explícito de getCachedPost si esto falla`,
  )

  if (isPopulatedObject) {
    console.log(
      `verifyPopulationDepth OK: fields.affiliateLink llegó poblado a depth:2 (program="${(link as { program?: string }).program}")`,
    )
  }
}

async function verifyHtml(path: string): Promise<void> {
  const { res, html } = await fetchHtml(path)
  check(res.status === 200, `${path}: esperaba 200, obtuvo ${res.status}`)

  // El card inline debe emitir el mismo rel que /stack.
  const sponsoredIndex = html.indexOf('rel="sponsored nofollow noopener"')
  check(sponsoredIndex !== -1, `${path}: falta un link con rel="sponsored nofollow noopener"`)

  // El disclosure (mismo frame que /stack, role="note") debe preceder al
  // primer link sponsored — comparación de índices de string, no visual.
  const noteIndex = html.indexOf('role="note"')
  check(noteIndex !== -1, `${path}: falta el frame de disclosure (role="note")`)
  check(
    noteIndex !== -1 && sponsoredIndex !== -1 && noteIndex < sponsoredIndex,
    `${path}: el disclosure (index ${noteIndex}) debe preceder al primer link sponsored (index ${sponsoredIndex})`,
  )

  // Nunca /go/undefined.
  const undefinedHrefs = html.match(/href="[^"]*undefined[^"]*"/g)
  check(
    !undefinedHrefs || undefinedHrefs.length === 0,
    `${path}: hrefs con "undefined": ${JSON.stringify(undefinedHrefs)}`,
  )

  // El CTA de DinoRANK vía /go/dinorank (mismo doc que /stack).
  check(html.includes('/go/dinorank'), `${path}: falta un href a /go/dinorank`)
}

async function main() {
  if (!DEMO_SLUG) {
    console.log('FAIL: falta DEMO_SLUG en el entorno')
    process.exitCode = 1
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const { path } = await resolvePostPath(payload, DEMO_SLUG)

  await verifyHtml(path)
  await verifyPopulationDepth(payload, DEMO_SLUG)

  if (failures.length > 0) {
    console.log(`FAIL: ${failures.join(' | ')}`)
    process.exitCode = 1
    process.exit(1)
  }

  console.log('PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  console.log('FAIL: excepción no controlada, ver stderr arriba')
  process.exitCode = 1
  process.exit(1)
})
