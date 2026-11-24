/**
 * Fase 56: reemplaza el archivo de las 4 capturas de Websites que quedaron viejas o rotas
 * (Juan Tech, Arianna Lupi, Dr. Vargas y Estylopia) por las recapturas de
 * `.planning/phase-56-prep/captures/`, y deja el alt en ES y EN.
 *
 * Va EN EL CORTE, no antes: master lee esos docs de Media (D-02). Orden del corte:
 *   1. merge y despliegue
 *   2. recapturar Juan Tech desde produccion si la home cambio (ver README de captures)
 *   3. este script, primero en seco y despues con --apply --db-checked
 *   4. 28-phase56-cutover-load.ts (el alt ya queda cargado aqui, el cargador lo deja igual)
 *
 * DRY-RUN POR DEFECTO. Misma guardia de base que 26 y 27: imprime host, puerto y base (nunca
 * usuario ni clave), exige --db-checked con --apply y rechaza Neon. No usa ninguna operacion
 * de borrado: el archivo anterior no se elimina de Cloudinary desde aqui.
 *
 *   node_modules/.bin/tsx scripts/db/32-phase56-replace-captures.ts [--apply --db-checked] [--only juan-tech]
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { ALL_ALTS } from './data/56-alt-texts'
import { assertSafeTarget, safeTarget } from './data/56-seed-lib'

const CAPTURES_DIR = resolve(process.cwd(), '.planning/phase-56-prep/captures')

/** clave del alt de 56-alt-texts.ts -> archivo recapturado */
const FILES: Record<string, string> = {
  'juan-tech': 'juan-tech-com.png',
  ariannalupi: 'ariannalupi-com.png',
  drmanuelvargashidalgo: 'drmanuelvargashidalgo-com.png',
  estylopia: 'estylopia-com.png',
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const dbChecked = args.includes('--db-checked')
  const onlyIdx = args.indexOf('--only')
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : undefined

  console.log(`=== ${apply ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} · reemplazo de capturas ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)
  assertSafeTarget(process.env.DATABASE_URI, apply, dbChecked)

  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  for (const [key, file] of Object.entries(FILES)) {
    if (only && only !== key) continue
    const row = ALL_ALTS.find((a) => a.key === key)
    if (!row) throw new Error(`no hay fila de alt para ${key}`)
    const path = resolve(CAPTURES_DIR, file)
    if (!existsSync(path)) throw new Error(`falta la captura ${path}`)
    const data = readFileSync(path)

    const found = await payload.find({
      collection: 'media',
      where: { filename: { contains: row.mediaSlug } },
      limit: 5,
      depth: 0,
      locale: 'es',
      fallbackLocale: false,
    })
    if (found.docs.length !== 1) {
      console.log(`  SALTA ${key}: se esperaba 1 doc de Media con "${row.mediaSlug}" y hay ${found.docs.length}`)
      continue
    }
    const doc = found.docs[0] as { id: number | string; filename?: string; url?: string; alt?: string }
    console.log(`  ${apply ? 'REEMPLAZA' : 'reemplazaría'} media ${doc.id} (${doc.filename}) con ${file} (${data.length} bytes)`)
    console.log(`      alt ES: ${row.es}\n      alt EN: ${row.en}`)
    console.log(`      respaldo del archivo actual: ${doc.url ?? '(sin url)'}`)
    if (!apply) continue

    await payload.update({
      collection: 'media',
      id: doc.id,
      locale: 'es',
      data: { alt: row.es },
      file: { data, mimetype: 'image/png', name: `${row.mediaSlug}.png`, size: data.length },
    })
    await payload.update({ collection: 'media', id: doc.id, locale: 'en', data: { alt: row.en } })
    const after = await payload.findByID({ collection: 'media', id: doc.id, depth: 0, locale: 'en', fallbackLocale: false })
    console.log(after.alt === row.en ? `  OK   media ${doc.id}: alt EN releido` : `  FALLA media ${doc.id}: el alt EN no coincide`)
  }
  console.log('\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. Verifica contra el HTML servido.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
