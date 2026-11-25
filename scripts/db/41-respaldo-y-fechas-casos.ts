/**
 * Auditoría SEO 2026-11. Respaldo y comprobación de `publishedAt` en los casos.
 *
 * Sin argumentos de escritura: este script solo lee. Guarda en `--respaldo=DIR`
 * los documentos que tocan los scripts 42 y 43 y la migración
 * `case_studies_published_at`, y después imprime la fecha de publicación de cada
 * caso junto a la primera versión publicada que Payload conserva.
 *
 *   tsx scripts/db/41-respaldo-y-fechas-casos.ts --respaldo=/ruta/fuera/del/repo
 *   tsx scripts/db/41-respaldo-y-fechas-casos.ts --verificar
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { assertSafeTarget } from './data/54-seed-lib'

const backupDir = process.argv.find((a) => a.startsWith('--respaldo='))?.split('=')[1]
const VERIFY = process.argv.includes('--verificar')
const POSTS = ['mejores-cursos-seo-espanol', 'core-web-vitals-guide', 'structured-data-seo', 'seo-off-page-guia']
const PAGES = ['seo-tecnico-lima', 'seo-tecnico-madrid']

async function main() {
  assertSafeTarget(process.env.DATABASE_URI, false, false)
  const payload = await getPayload({ config })

  if (backupDir) {
    if (path.resolve(backupDir).startsWith(path.resolve(process.cwd()))) {
      throw new Error('El respaldo va fuera del repo')
    }
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 })
    const out: Record<string, unknown> = { tomado: new Date().toISOString() }
    for (const locale of ['es', 'en'] as const) {
      for (const [collection, slugs] of [['posts', POSTS], ['pages', PAGES]] as const) {
        const { docs } = await payload.find({
          collection,
          where: { slug: { in: [...slugs] } },
          locale,
          fallbackLocale: false,
          depth: 0,
          limit: 20,
        })
        out[`${collection}.${locale}`] = docs
      }
      const { docs } = await payload.find({
        collection: 'case-studies',
        locale,
        fallbackLocale: false,
        depth: 0,
        limit: 100,
        // Antes de la migración las columnas nuevas no existen todavía.
        select: { title: true, slug: true, _status: true, createdAt: true, updatedAt: true },
      })
      out[`case-studies.${locale}`] = docs
    }
    out.llms = await payload.findGlobal({ slug: 'llms' })
    const file = path.join(backupDir, `respaldo-seo-${Date.now()}.json`)
    fs.writeFileSync(file, JSON.stringify(out, null, 2), { mode: 0o600 })
    console.log(`Respaldo escrito en ${file} (${fs.statSync(file).size} bytes)`)
  }

  if (VERIFY) {
    const { docs } = await payload.find({ collection: 'case-studies', depth: 0, limit: 100 })
    const rows = []
    for (const d of docs) {
      const v = await payload.findVersions({
        collection: 'case-studies',
        where: { and: [{ parent: { equals: d.id } }, { 'version._status': { equals: 'published' } }] },
        sort: 'createdAt',
        limit: 1,
        depth: 0,
      })
      const first = v.docs[0]?.createdAt
      rows.push({ slug: d.slug, publishedAt: d.publishedAt, primeraPublicada: first, coincide: d.publishedAt === first })
    }
    console.table(rows)
    if (rows.some((r) => !r.coincide)) process.exitCode = 1
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
