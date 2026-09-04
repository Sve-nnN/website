/**
 * Verifica GO-01/GO-02/GO-03 contra el dev server real (ya debe estar
 * corriendo en http://localhost:3000) conectado al Postgres real de Dokploy.
 *
 * Crea dos docs de prueba en `affiliate-links` (uno activo, uno inactivo)
 * ANTES de la primera request HTTP a /go/*, para que la primera lectura de
 * `getCachedAffiliateLinks('es')` (sin cachear todavía en este arranque del
 * dev server) los vea frescos sin esperar el TTL de la cache.
 *
 * Run (con el dev server ya arriba):
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-go-route.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'

const ACTIVE_SLUG = 'go-verify-active'
const INACTIVE_SLUG = 'go-verify-inactive'
const TARGET_URL = 'https://example.com/go-verify-target?keep=1'

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

async function main() {
  const payload = await getPayload({ config })

  // (a) Crear ambos docs de prueba antes de la primera request.
  const activeDoc = await payload.create({
    collection: 'affiliate-links',
    data: {
      name: 'GO Verify Active',
      slug: ACTIVE_SLUG,
      program: 'other',
      active: true,
      destinations: [{ marketplace: 'default', url: TARGET_URL }],
    },
  })

  const inactiveDoc = await payload.create({
    collection: 'affiliate-links',
    data: {
      name: 'GO Verify Inactive',
      slug: INACTIVE_SLUG,
      program: 'other',
      active: false,
      destinations: [{ marketplace: 'default', url: TARGET_URL }],
    },
  })

  try {
    // (b) Slug activo: 302 + Location exacto + no-store.
    const activeRes = await fetch(`${BASE_URL}/go/${ACTIVE_SLUG}`, { redirect: 'manual' })
    check(activeRes.status === 302, `activo: esperaba 302, obtuvo ${activeRes.status}`)
    check(
      activeRes.headers.get('location') === TARGET_URL,
      `activo: Location esperado "${TARGET_URL}", obtuvo "${activeRes.headers.get('location')}"`,
    )
    check(
      activeRes.headers.get('cache-control') === 'no-store',
      `activo: cache-control esperado "no-store", obtuvo "${activeRes.headers.get('cache-control')}"`,
    )

    // ?to= se ignora por completo — mismo Location exacto.
    const withToRes = await fetch(`${BASE_URL}/go/${ACTIVE_SLUG}?to=https://evil.example.com`, {
      redirect: 'manual',
    })
    check(
      withToRes.headers.get('location') === TARGET_URL,
      `?to=: Location esperado "${TARGET_URL}" (ignorando ?to=), obtuvo "${withToRes.headers.get('location')}"`,
    )

    // Slug inactivo -> 404.
    const inactiveRes = await fetch(`${BASE_URL}/go/${INACTIVE_SLUG}`, { redirect: 'manual' })
    check(inactiveRes.status === 404, `inactivo: esperaba 404, obtuvo ${inactiveRes.status}`)
    const inactiveBody = await inactiveRes.text()

    // Slug inexistente -> 404 con el MISMO body que el inactivo.
    const missingRes = await fetch(`${BASE_URL}/go/does-not-exist-slug`, { redirect: 'manual' })
    check(missingRes.status === 404, `inexistente: esperaba 404, obtuvo ${missingRes.status}`)
    const missingBody = await missingRes.text()
    check(
      inactiveBody === missingBody,
      `inactivo e inexistente deben devolver el mismo body ("${inactiveBody}" vs "${missingBody}")`,
    )

    // /go pelado -> 404.
    const bareRes = await fetch(`${BASE_URL}/go`, { redirect: 'manual' })
    check(bareRes.status === 404, `/go pelado: esperaba 404, obtuvo ${bareRes.status}`)

    // (c) Matriz de control + decoy.
    const controlRoutes = ['/', '/en', '/servicios', '/en/services', '/blog']
    for (const route of controlRoutes) {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' })
      check(res.status === 200, `ruta control ${route}: esperaba 200, obtuvo ${res.status}`)
    }

    const decoyRes = await fetch(`${BASE_URL}/golang-para-seo`, { redirect: 'manual' })
    check(decoyRes.status === 404, `decoy /golang-para-seo: esperaba 404, obtuvo ${decoyRes.status}`)

    // (d) robots.txt bloquea /go.
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`)
    const robotsBody = await robotsRes.text()
    check(robotsBody.includes('Disallow: /go'), `robots.txt no contiene "Disallow: /go" (body: ${robotsBody})`)
  } finally {
    // (e) Limpieza: borrar ambos docs de prueba.
    await payload.delete({ collection: 'affiliate-links', id: activeDoc.id })
    await payload.delete({ collection: 'affiliate-links', id: inactiveDoc.id })

    const remaining = await payload.count({ collection: 'affiliate-links' })
    check(remaining.totalDocs === 0, `affiliate-links debería quedar en COUNT(*) = 0, quedó en ${remaining.totalDocs}`)
  }

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
