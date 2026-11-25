/**
 * Reescribe UN caso (21 a 24) con las cifras corregidas, retira la captura anterior y lo
 * publica. Autorizado por Juan el 2026-11-24. No borra documentos ni archivos.
 *
 * Un caso por corrida (`--id=23`) para escribir despacio contra producción.
 * DRY-RUN por defecto. Con `--apply` exige `--db-checked` (04-which-database.ts) y guarda un
 * respaldo del documento (todos los idiomas) antes de escribir.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/44-casos-gsc-corregidos.ts --id=23
 *   ... --id=23 --apply --db-checked
 */
import { writeFileSync } from 'node:fs'

import { assertSafeTarget, safeTarget } from './data/54-seed-lib'
import { CASES, PERIOD, PERIOD_AFTER, PERIOD_BEFORE, SERVICES, SOLUTION, type CaseFix } from './data/44-casos-gsc'

const BACKUP_DIR = '/Users/juan/juantech-respaldos-2026-11-24'
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Row = Record<string, unknown>

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')
const ID = Number(process.argv.find((a) => a.startsWith('--id='))?.split('=')[1])

/** Cifras de la versión retirada: ninguna puede quedar en el documento. */
const OLD_FIGURES = [
  '+107%', '85,065', '175,844', '71.4M', '+433%',
  '+70%', '61,126', '103,793', '6.14M', '+137%',
  '+339%', '1,728', '876K', '+948%', '83.6K',
  '+958%', '20,363', '215,398', '680K', '+679%',
]

function paragraph(text: string) {
  return {
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
      children: [
        {
          type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0,
          children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
        },
      ],
    },
  }
}

/** Datos de un idioma. Con `ids` reutiliza las filas que creó el otro idioma. */
function dataFor(c: CaseFix, lang: Locale, ids?: Row) {
  const idOf = (rows: unknown, i: number) => (Array.isArray(rows) ? { id: (rows[i] as Row).id } : {})
  return {
    title: c.title[lang],
    heroMetric: c.heroMetric[lang],
    heroSubtitle: c.heroSubtitle[lang],
    sector: c.sector[lang],
    period: PERIOD,
    services: SERVICES.map((s, i) => ({ ...idOf(ids?.services, i), service: s[lang] })),
    kpis: c.kpis.map((k, i) => ({ ...idOf(ids?.kpis, i), value: k.value, label: k.label[lang] })),
    clientContext: paragraph(c.clientContext[lang]),
    challenge: c.challenge.map((t, i) => ({ ...idOf(ids?.challenge, i), text: t[lang] })),
    solution: [{ ...idOf(ids?.solution, 0), title: SOLUTION.title[lang], description: SOLUTION.description[lang] }],
    results: {
      periodBefore: PERIOD_BEFORE,
      periodAfter: PERIOD_AFTER,
      metrics: c.metrics.map((m, i) => ({
        ...idOf((ids?.results as Row | undefined)?.metrics, i),
        before: m.before,
        after: m.after,
        label: m.label[lang],
      })),
    },
    lessons: c.lessons.map((l, i) => ({ ...idOf(ids?.lessons, i), title: l.title[lang], body: l.body[lang] })),
    conclusion: paragraph(c.conclusion[lang]),
    meta: { title: c.title[lang], description: c.metaDescription[lang] },
    heroImage: null,
    _status: 'published' as const,
  }
}

/** Rutas donde `current` no coincide con lo escrito (solo claves escritas). */
function mismatches(current: unknown, desired: unknown, path = ''): string[] {
  if (desired === null) return current === null || current === undefined ? [] : [path]
  if (Array.isArray(desired)) {
    if (!Array.isArray(current) || current.length !== desired.length) return [`${path}.length`]
    return desired.flatMap((d, i) => mismatches(current[i], d, `${path}[${i}]`))
  }
  if (typeof desired === 'object') {
    if (!current || typeof current !== 'object') return [path]
    return Object.entries(desired as Row).flatMap(([k, v]) =>
      mismatches((current as Row)[k], v, path ? `${path}.${k}` : k),
    )
  }
  return current === desired ? [] : [path]
}

async function main() {
  const c = CASES.find((x) => x.id === ID)
  if (!c) throw new Error('Falta --id=21|22|23|24')
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} caso ${c.id} ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)
  assertSafeTarget(process.env.DATABASE_URI, APPLY, DB_CHECKED)

  const text = JSON.stringify(c) + JSON.stringify(SOLUTION)
  const dashes = [String.fromCharCode(0x2013), String.fromCharCode(0x2014)]
  if (dashes.some((d) => text.includes(d))) throw new Error('El texto contiene rayas.')
  const headings = [c.title, ...c.lessons.map((l) => l.title), SOLUTION.title]
  if (headings.some((h) => /[.,]/.test(h.es + h.en))) throw new Error('Un encabezado lleva punto o coma.')

  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  const read = async (locale: Locale | 'all') =>
    (await payload.findByID({
      collection: 'case-studies',
      id: c.id,
      locale,
      fallbackLocale: false,
      depth: 0,
      draft: false,
    })) as unknown as Row

  const before = await read('all')
  if (before.slug !== c.slug) throw new Error(`El slug no coincide: ${String(before.slug)}`)
  console.log('  antes:', JSON.stringify({ status: before._status, title: before.title, heroMetric: before.heroMetric, heroImage: before.heroImage }))
  console.log('  después:', JSON.stringify({ title: c.title, heroMetric: c.heroMetric, heroImage: null }))
  if (!APPLY) {
    console.log('Dry-run listo: sin cambios.')
    process.exit(0)
  }

  const backup = `${BACKUP_DIR}/44-caso-${c.id}-antes-${Date.now()}.json`
  writeFileSync(backup, JSON.stringify(before, null, 2), { mode: 0o600, flag: 'wx' })
  console.log(`  respaldo: ${backup}`)

  const write = (locale: Locale, data: unknown) =>
    payload.update({
      collection: 'case-studies',
      id: c.id,
      locale,
      draft: false,
      fallbackLocale: false,
      depth: 0,
      data: data as never,
    })

  await write('es', dataFor(c, 'es'))
  const es = await read('es')
  await write('en', dataFor(c, 'en', es))

  let failed = false
  for (const locale of LOCALES) {
    const d = await read(locale)
    const bad = mismatches(d, dataFor(c, locale))
    const stale = OLD_FIGURES.filter((f) => JSON.stringify(d).includes(f))
    console.log(`  ${locale}: estado ${String(d._status)}, diferencias ${JSON.stringify(bad)}, cifras antiguas ${JSON.stringify(stale)}`)
    if (bad.length || stale.length || d._status !== 'published') failed = true
  }
  const pub = await payload.find({
    collection: 'case-studies',
    where: { id: { equals: c.id } },
    overrideAccess: false,
    draft: false,
    limit: 1,
    depth: 0,
  })
  console.log('  visible sin sesión:', pub.docs.length === 1)
  process.exit(failed || pub.docs.length !== 1 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
