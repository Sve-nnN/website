/**
 * Verifica GO-04 (schema): round-trip de `affiliate-clicks` + confirma que
 * `update()` con `overrideAccess: false` es rechazado (append-only
 * estructural, no solo convención).
 *
 * Run:
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-clicks-schema.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const TEST_SLUG = 'schema-verify-test'

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

async function main() {
  const payload = await getPayload({ config })

  // (a) count inicial debe ser 0.
  const before = await payload.count({ collection: 'affiliate-clicks' })
  check(before.totalDocs === 0, `count inicial esperado 0, obtuvo ${before.totalDocs}`)

  // (b) create de prueba.
  const doc = await payload.create({
    collection: 'affiliate-clicks',
    data: { slug: TEST_SLUG, userAgent: 'verify-script' },
  })

  try {
    // (c) findByID confirma persistencia de ambos campos.
    const found = await payload.findByID({ collection: 'affiliate-clicks', id: doc.id })
    check(found.slug === TEST_SLUG, `slug esperado "${TEST_SLUG}", obtuvo "${found.slug}"`)
    check(found.userAgent === 'verify-script', `userAgent esperado "verify-script", obtuvo "${found.userAgent}"`)

    // (d) update con overrideAccess: false debe ser RECHAZADO.
    let updateRejected = false
    try {
      await payload.update({
        collection: 'affiliate-clicks',
        id: doc.id,
        data: { userAgent: 'should-not-be-allowed' },
        overrideAccess: false,
      })
    } catch {
      updateRejected = true
    }
    check(updateRejected, 'update() con overrideAccess:false debería haber sido rechazado y no lo fue')
  } finally {
    // (e) borrar el doc de prueba (con overrideAccess: true por defecto, como
    // hace el resto de las tasks de mantenimiento del repo).
    await payload.delete({ collection: 'affiliate-clicks', id: doc.id })

    // (f) count final vuelve a 0.
    const after = await payload.count({ collection: 'affiliate-clicks' })
    check(after.totalDocs === 0, `count final esperado 0, obtuvo ${after.totalDocs}`)
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
