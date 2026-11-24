/** Publica los 4 casos creados por el script 34 (create con draft:false los dejo en borrador). Aditivo. */
import { assertSafeTarget } from './data/54-seed-lib'
const IDS = [21, 22, 23, 24]
async function main() {
  assertSafeTarget(process.env.DATABASE_URI, true, process.argv.includes('--db-checked'))
  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })
  for (const id of IDS) {
    for (const locale of ['es', 'en'] as const) {
      await payload.update({ collection: 'case-studies', id, locale, data: { _status: 'published' } as never, draft: false, fallbackLocale: false, depth: 0 })
    }
    const d = (await payload.findByID({ collection: 'case-studies', id, draft: false, depth: 0, locale: 'es', fallbackLocale: false })) as unknown as { _status?: string; slug?: string }
    const pub = await payload.find({ collection: 'case-studies', where: { id: { equals: id } }, draft: false, overrideAccess: false, limit: 1, depth: 0 })
    console.log(id, d.slug, 'status:', d._status, 'visible sin sesion:', pub.docs.length === 1)
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
