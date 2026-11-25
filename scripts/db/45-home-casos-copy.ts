/**
 * Corrige el texto de la sección de casos de la home y neutraliza el alt de las capturas
 * retiradas (media 80 a 83). Autorizado por Juan el 2026-11-24. No borra nada.
 *
 *   - home-page.cases.lead: afirmaba que cada cifra compara un año contra el anterior.
 *   - home-page.cases.note: afirmaba que todos los clientes van anónimos.
 *   - media 80 a 83: los alt repetían las cifras retiradas.
 *
 * DRY-RUN por defecto. Con `--apply` exige `--db-checked` y respalda antes de escribir.
 */
import { writeFileSync } from 'node:fs'

import { assertSafeTarget, safeTarget } from './data/54-seed-lib'

const BACKUP = `/Users/juan/juantech-respaldos-2026-11-24/45-antes-${Date.now()}.json`
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Row = Record<string, unknown>

const HOME: Record<Locale, { lead: string; note: string }> = {
  es: { lead: 'Cada caso indica los periodos que compara.', note: 'Los datos salen de Search Console.' },
  en: { lead: 'Each case states the periods it compares.', note: 'The data comes from Search Console.' },
}
const MEDIA_IDS = [80, 81, 82, 83]
const ALT: Record<Locale, string> = {
  es: 'Captura de Search Console retirada',
  en: 'Withdrawn Search Console screenshot',
}

/** Rutas cuyo valor difiere entre dos documentos. */
function changedPaths(a: unknown, b: unknown, path = ''): string[] {
  if (a === b) return []
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].flatMap((k) =>
      changedPaths((a as Row)[k], (b as Row)[k], path ? `${path}.${k}` : k),
    )
  }
  return [path]
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`=== ${apply ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)
  assertSafeTarget(process.env.DATABASE_URI, apply, process.argv.includes('--db-checked'))

  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  const readHome = async (locale: Locale) =>
    (await payload.findGlobal({ slug: 'home-page', locale, fallbackLocale: false, depth: 0 })) as unknown as Row
  const readMedia = async (id: number, locale: Locale) =>
    (await payload.findByID({ collection: 'media', id, locale, fallbackLocale: false, depth: 0 })) as unknown as Row

  const home = { es: await readHome('es'), en: await readHome('en') }
  const media: Record<string, Row> = {}
  for (const id of MEDIA_IDS) {
    for (const l of LOCALES) media[`${id}-${l}`] = await readMedia(id, l)
    const name = String(media[`${id}-es`]!.filename)
    if (!/gsc-.*clics-12-meses/.test(name)) throw new Error(`media ${id} no es una captura retirada: ${name}`)
  }
  for (const l of LOCALES) console.log(`  [${l}] ${JSON.stringify(home[l].cases)} -> ${JSON.stringify(HOME[l])}`)
  if (!apply) {
    console.log('Dry-run listo: sin cambios.')
    process.exit(0)
  }
  writeFileSync(BACKUP, JSON.stringify({ home, media }, null, 2), { mode: 0o600, flag: 'wx' })
  console.log(`  respaldo: ${BACKUP}`)

  for (const l of LOCALES) {
    await payload.updateGlobal({
      slug: 'home-page',
      locale: l,
      fallbackLocale: false,
      depth: 0,
      data: { cases: { ...(home[l].cases as Row), ...HOME[l] } } as never,
    })
  }
  for (const id of MEDIA_IDS) {
    for (const l of LOCALES) {
      await payload.update({ collection: 'media', id, locale: l, fallbackLocale: false, depth: 0, data: { alt: ALT[l] } })
    }
  }

  let failed = false
  for (const l of LOCALES) {
    const after = await readHome(l)
    const diff = changedPaths(home[l], after)
    const extra = diff.filter((p) => !['cases.lead', 'cases.note', 'updatedAt'].includes(p))
    const cases = after.cases as Row
    const ok = cases.lead === HOME[l].lead && cases.note === HOME[l].note && extra.length === 0
    console.log(`  home [${l}] ${ok ? 'OK' : 'FALLA'} cambios ${JSON.stringify(diff)}`)
    if (!ok) failed = true
    for (const id of MEDIA_IDS) {
      const m = await readMedia(id, l)
      if (m.alt !== ALT[l] || m.url !== media[`${id}-${l}`]!.url) failed = true
    }
  }
  console.log(`  alts de media ${failed ? 'REVISAR' : 'OK'}`)
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
