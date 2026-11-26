/**
 * Asigna a los casos 21 a 24 su captura de Search Console con periodos iguales (134 días),
 * tomada el 2026-11-25. En el caso 23 además corrige la posición media a la cifra exacta que
 * muestra Search Console (53.8 y 19.3; el texto publicado decía 53.7 y 19.2).
 *
 * Las capturas viven fuera del repositorio. No borra nada. Un caso por corrida (`--id=23`).
 * Idempotente: reutiliza la Media si el archivo ya existe.
 *
 * DRY-RUN por defecto. Con `--apply` exige `--db-checked` y respalda el caso antes de escribir.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { assertSafeTarget, missingCloudinaryVars, safeTarget } from './data/54-seed-lib'

const BASE = join(homedir(), 'juantech-respaldos-2026-11-24')
const APPLY = process.argv.includes('--apply')
const ID = Number(process.argv.find((a) => a.startsWith('--id='))?.split('=')[1])
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Row = Record<string, unknown>

const PERIODS: Record<Locale, string> = {
  es: 'compara del 12 de julio al 22 de noviembre de 2026 (línea continua) con el 13 de julio al 23 de noviembre de 2025 (línea discontinua)',
  en: 'comparing July 12 to November 22, 2026 (solid line) with July 13 to November 23, 2025 (dashed line)',
}

const SHOTS: Record<number, { file: string; alt: Record<Locale, string> }> = {
  21: {
    file: 'gsc-vitawallet-comparacion-134-dias.jpg',
    alt: {
      es: `Gráfico de Search Console de Vitawallet que ${PERIODS.es}: 40.5 mil clics frente a 84.7 mil, 22.9 millones de impresiones frente a 13.4 millones y posición media de 9 frente a 11.2`,
      en: `Search Console chart for Vitawallet ${PERIODS.en}: 40.5 thousand clicks against 84.7 thousand, 22.9 million impressions against 13.4 million and average position 9 against 11.2`,
    },
  },
  22: {
    file: 'gsc-deltacloudz-comparacion-134-dias.jpg',
    alt: {
      es: `Gráfico de Search Console de Delta Cloudz que ${PERIODS.es}: 44.1 mil clics frente a 60.6 mil, 2.46 millones de impresiones frente a 2.57 millones y posición media de 10.9 frente a 15.6`,
      en: `Search Console chart for Delta Cloudz ${PERIODS.en}: 44.1 thousand clicks against 60.6 thousand, 2.46 million impressions against 2.57 million and average position 10.9 against 15.6`,
    },
  },
  23: {
    file: 'gsc-phixser-comparacion-134-dias.jpg',
    alt: {
      es: `Gráfico de Search Console de Phixser que ${PERIODS.es}: 926 clics frente a 392, 680 mil impresiones frente a 82.5 mil y posición media de 19.3 frente a 53.8`,
      en: `Search Console chart for Phixser ${PERIODS.en}: 926 clicks against 392, 680 thousand impressions against 82.5 thousand and average position 19.3 against 53.8`,
    },
  },
  24: {
    file: 'gsc-software-administrativo-comparacion-134-dias.jpg',
    alt: {
      es: `Gráfico de Search Console de una empresa de software administrativo que ${PERIODS.es}: 154 mil clics frente a 20.3 mil, 429 mil impresiones frente a 86.9 mil y posición media de 3.7 frente a 6.6`,
      en: `Search Console chart for a business software company ${PERIODS.en}: 154 thousand clicks against 20.3 thousand, 429 thousand impressions against 86.9 thousand and average position 3.7 against 6.6`,
    },
  },
}

const fixPosition = (s: unknown) => String(s).replace('53.7', '53.8').replace('19.2', '19.3')

/** Solo caso 23: campos con la posición media, con los ids de fila intactos. */
function positionData(d: Row) {
  const results = d.results as Row
  return {
    kpis: (d.kpis as Row[]).map((k) => ({ ...k, value: fixPosition(k.value), label: fixPosition(k.label) })),
    challenge: (d.challenge as Row[]).map((c) => ({ ...c, text: fixPosition(c.text) })),
    results: {
      ...results,
      metrics: (results.metrics as Row[]).map((m) => ({ ...m, before: fixPosition(m.before), after: fixPosition(m.after) })),
    },
  }
}

async function main() {
  const shot = SHOTS[ID]
  if (!shot) throw new Error('Falta --id=21|22|23|24')
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} captura del caso ${ID} ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)
  assertSafeTarget(process.env.DATABASE_URI, APPLY, process.argv.includes('--db-checked'))
  const missing = missingCloudinaryVars(process.env)
  if (missing.length > 0) throw new Error(`Faltan variables de Cloudinary: ${missing.join(', ')}`)
  const path = join(BASE, 'capturas-casos', shot.file)
  if (!existsSync(path)) throw new Error(`Falta la captura ${shot.file}`)

  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  const read = async (locale: Locale | 'all') =>
    (await payload.findByID({ collection: 'case-studies', id: ID, locale, fallbackLocale: false, depth: 0, draft: false })) as unknown as Row
  const before = await read('all')
  if (before._status !== 'published') throw new Error(`El caso ${ID} no está publicado: se aborta.`)

  const found = await payload.find({
    collection: 'media',
    where: { filename: { like: shot.file.replace(/\.jpg$/, '') } },
    limit: 2,
    depth: 0,
  })
  if (found.docs.length > 1) throw new Error('Hay más de una Media con ese nombre: resolver a mano.')
  console.log(`  heroImage actual: ${JSON.stringify(before.heroImage)} · media existente: ${found.docs[0]?.id ?? 'ninguna'}`)
  if (!APPLY) {
    console.log('Dry-run listo: sin cambios.')
    process.exit(0)
  }
  const backup = `${BASE}/50-caso-${ID}-antes-${Date.now()}.json`
  writeFileSync(backup, JSON.stringify(before, null, 2), { mode: 0o600, flag: 'wx' })
  console.log(`  respaldo: ${backup}`)

  const mediaId =
    found.docs[0]?.id ??
    (await payload.create({ collection: 'media', locale: 'es', data: { alt: shot.alt.es }, filePath: path })).id
  for (const locale of LOCALES) {
    await payload.update({ collection: 'media', id: mediaId, locale, fallbackLocale: false, depth: 0, data: { alt: shot.alt[locale] } })
  }

  for (const locale of LOCALES) {
    const current = await read(locale)
    await payload.update({
      collection: 'case-studies',
      id: ID,
      locale,
      draft: false,
      fallbackLocale: false,
      depth: 0,
      data: { heroImage: mediaId, _status: 'published', ...(ID === 23 ? positionData(current) : {}) } as never,
    })
  }

  let failed = false
  for (const locale of LOCALES) {
    const d = await read(locale)
    const m = (await payload.findByID({ collection: 'media', id: mediaId, locale, fallbackLocale: false, depth: 0 })) as unknown as Row
    const stale = ID === 23 && /53\.7|19\.2/.test(JSON.stringify([d.kpis, d.challenge, d.results]))
    const ok = d.heroImage === mediaId && d.title === (before.title as Row)[locale] && d._status === 'published' && m.alt === shot.alt[locale] && !stale
    console.log(`  ${locale}: ${ok ? 'OK' : 'FALLA'} · media ${mediaId} · url ${String(m.url)}`)
    if (!ok) failed = true
  }
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
