/**
 * Autoprueba de los scripts de siembra de la fase 56 (plan 56-12):
 *   - scripts/db/26-phase56-seed-shadow.ts (home-page y about-page)
 *   - scripts/db/27-phase56-seed-legal.ts  (legal-pages)
 *
 * Usa una Local API falsa en memoria: no abre ninguna base, no usa la red y no lee el .env.
 * La Local API falsa no tiene ninguna operacion de borrado: si un script intentara borrar,
 * lanzaria y el caso fallaria.
 *
 *   node_modules/.bin/tsx scripts/verify/56-shadow-seed-selftest.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 */
import {
  ABOUT_COPY_ES,
} from '../db/data/56-about-copy'
import { HOME_COPY_ES } from '../db/data/56-home-copy'
import * as legal from '../db/27-phase56-seed-legal'
import * as shadow from '../db/26-phase56-seed-shadow'

type Locale = 'es' | 'en'
type Store = Record<string, Partial<Record<Locale, Record<string, unknown>>>>

const PROD_URI = 'postgresql://x:y@127.0.0.1:15432/juantech?sslmode=disable'
const NEON_URI = 'postgresql://x:y@ep-hidden-heart-atc1vys8.c-2.us-west-2.aws.neon.tech/neondb'

let failures = 0
function check(name: string, ok: boolean, why = '') {
  if (ok) console.log(`PASS ${name}`)
  else {
    failures++
    console.log(`FAIL ${name}${why ? `: ${why}` : ''}`)
  }
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

type Write = { slug: string; locale: Locale; data: Record<string, unknown> }

function fakePayload(initial: Store, opts: { emptyToNull?: boolean; fieldNames?: Record<string, string[]> } = {}) {
  const store: Store = clone(initial)
  const writes: Write[] = []
  const normalize = (v: unknown): unknown => {
    if (!opts.emptyToNull) return v
    if (v === '') return null
    if (Array.isArray(v)) return v.map(normalize)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, normalize(x)]))
    return v
  }
  return {
    store,
    writes,
    config: {
      globals: Object.entries(opts.fieldNames ?? {}).map(([slug, names]) => ({ slug, fields: names.map((name) => ({ name })) })),
    },
    async findGlobal(args: { slug: string; locale: Locale; fallbackLocale?: unknown }) {
      if (args.fallbackLocale !== false) throw new Error('la lectura debe usar fallbackLocale: false')
      return clone(store[args.slug]?.[args.locale] ?? {})
    },
    async updateGlobal(args: Write) {
      writes.push(clone(args))
      store[args.slug] = store[args.slug] ?? {}
      store[args.slug][args.locale] = { ...(store[args.slug][args.locale] ?? {}), ...(normalize(clone(args.data)) as object) }
      return store[args.slug][args.locale]
    },
  }
}

type Fake = ReturnType<typeof fakePayload>

const io = () => {
  const lines: string[] = []
  return { lines, io: { out: (l: string) => lines.push(l), err: (l: string) => lines.push(l) } }
}

const baseOpts = (over: Partial<shadow.Opts> = {}): shadow.Opts => ({
  apply: false,
  dbChecked: false,
  only: null,
  includeEn: false,
  allowProposedEn: false,
  allowShrinkStages: false,
  printCurrent: false,
  ...over,
})

const fieldNames = (): Record<string, string[]> => ({
  'home-page': Object.keys(HOME_COPY_ES),
  'about-page': Object.keys(ABOUT_COPY_ES),
})

async function runShadow(opts: shadow.Opts, fake: Fake, uri = PROD_URI, sources?: shadow.Source[]) {
  let loads = 0
  const { lines, io: sink } = io()
  const code = await shadow.run(
    opts,
    { DATABASE_URI: uri },
    async () => {
      loads++
      return fake
    },
    sink,
    sources,
  )
  return { code, loads, text: lines.join('\n') }
}

async function main() {
  // ------------------------------------------------------------ script 26
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts(), fake)
    check('26: el dry-run sale 0 y no escribe', r.code === 0 && fake.writes.length === 0, `codigo ${r.code}, escrituras ${fake.writes.length}`)
    check('26: el dry-run imprime la base como host:puerto/base y nunca usuario', r.text.includes('127.0.0.1:15432/juantech') && !r.text.includes('x:y'))
  }
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true }), fake)
    check('26: --apply sin --db-checked falla antes de importar Payload', r.code === 1 && r.loads === 0 && fake.writes.length === 0, `codigo ${r.code}, cargas ${r.loads}`)
  }
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, NEON_URI)
    check('26: una base de Neon falla antes de importar nada', r.code === 1 && r.loads === 0 && fake.writes.length === 0 && /neon/i.test(r.text), `codigo ${r.code}, cargas ${r.loads}`)
  }
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, 'postgresql://x:y@127.0.0.1:15432/otra')
    check('26: una base con otro nombre falla', r.code === 1 && r.loads === 0)
  }
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake)
    const locales = fake.writes.map((w) => `${w.slug}:${w.locale}`)
    check(
      '26: --apply --db-checked escribe solo ES (home-page y about-page) y sale 0',
      r.code === 0 && locales.join(',') === 'home-page:es,about-page:es',
      `codigo ${r.code}, escrituras ${locales.join(',')}`,
    )
    check('26: nunca envia title ni meta', fake.writes.every((w) => !('title' in w.data) && !('meta' in w.data)))
    const again = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake)
    check('26: repetir no escribe nada (idempotente)', again.code === 0 && fake.writes.length === 2, `escrituras ${fake.writes.length}`)
  }
  {
    // Payload puede devolver null donde el copy manda cadena vacia: no debe contar como diferencia.
    const fake = fakePayload({}, { emptyToNull: true, fieldNames: fieldNames() })
    const first = await runShadow(baseOpts({ apply: true, dbChecked: true, only: 'home' }), fake)
    const second = await runShadow(baseOpts({ apply: true, dbChecked: true, only: 'home' }), fake)
    check('26: una cadena vacia leida como null no cuenta como diferencia', first.code === 0 && second.code === 0 && fake.writes.length === 1, `escrituras ${fake.writes.length}`)
  }
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true, only: 'about' }), fake)
    check('26: --only about escribe solo about-page', r.code === 0 && fake.writes.length === 1 && fake.writes[0].slug === 'about-page')
  }

  // EN opt-in
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const proposed = shadow.DEFAULT_SOURCES.map((s) => ({ ...s, enStatus: 'propuesto' as const }))
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true, includeEn: true }), fake, PROD_URI, proposed)
    check('26: --include-en con el EN todavia propuesto aborta sin escribir', r.code === 1 && fake.writes.length === 0 && /propuesto/.test(r.text), `codigo ${r.code}, escrituras ${fake.writes.length}`)
  }
  {
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const proposed = shadow.DEFAULT_SOURCES.map((s) => ({ ...s, enStatus: 'propuesto' as const }))
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true, includeEn: true, allowProposedEn: true }), fake, PROD_URI, proposed)
    const order = fake.writes.map((w) => `${w.slug}:${w.locale}`).join(',')
    check(
      '26: --include-en --allow-proposed-en escribe es y luego en de cada global',
      r.code === 0 && order === 'home-page:es,home-page:en,about-page:es,about-page:en',
      `codigo ${r.code}, orden ${order}`,
    )
  }
  {
    const approved = shadow.DEFAULT_SOURCES.map((s) => ({ ...s, enStatus: 'aprobado' as const }))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true, includeEn: true }), fake, PROD_URI, approved)
    check('26: con el EN aprobado en el registro basta --include-en', r.code === 0 && fake.writes.length === 4, `codigo ${r.code}, escrituras ${fake.writes.length}`)
  }

  // Centinela
  for (const [label, mutate] of [
    ['tagline EN de home vacio', (s: shadow.Source[]) => ({ ...s[0], en: { ...s[0].en, tagline: '' } })],
    ['hero.lead EN de about vacio', (s: shadow.Source[]) => ({ ...s[1], en: { ...s[1].en, hero: { ...(s[1].en.hero as object), lead: '  ' } } })],
  ] as const) {
    const base = shadow.DEFAULT_SOURCES.map((s) => ({ ...s, enStatus: 'aprobado' as const }))
    const idx = label.startsWith('tagline') ? 0 : 1
    const sources = base.map((s, i) => (i === idx ? mutate(base) : s))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true, includeEn: true }), fake, PROD_URI, sources)
    check(`26: ${label} aborta (centinela) antes de abrir Payload`, r.code === 1 && r.loads === 0 && fake.writes.length === 0 && /centinela/.test(r.text), `codigo ${r.code}`)
  }
  {
    // El centinela vacio no estorba si el EN no se incluye.
    const base = shadow.DEFAULT_SOURCES.map((s, i) => (i === 0 ? { ...s, en: { ...s.en, tagline: '' } } : s))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, PROD_URI, base)
    check('26: sin --include-en el centinela EN no se exige', r.code === 0)
  }

  // Claves ajenas al global y rayas
  {
    const sources = shadow.DEFAULT_SOURCES.map((s, i) => (i === 0 ? { ...s, es: { ...s.es, title: 'Otro titulo' } } : s))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, PROD_URI, sources)
    check('26: un copy con title aborta (D-23) sin escribir', r.code === 1 && r.loads === 0 && fake.writes.length === 0 && /title/.test(r.text))
  }
  {
    const sources = shadow.DEFAULT_SOURCES.map((s, i) => (i === 0 ? { ...s, es: { ...s.es, claveAjena: { a: 1 } } } : s))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, PROD_URI, sources)
    check('26: un copy con una clave que el global no tiene aborta sin escribir', r.code === 1 && fake.writes.length === 0 && /claveAjena/.test(r.text))
  }
  {
    const dash = String.fromCharCode(0x2014)
    const sources = shadow.DEFAULT_SOURCES.map((s, i) => (i === 0 ? { ...s, es: { ...s.es, tagline: `Uno ${dash} dos` } } : s))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, PROD_URI, sources)
    check('26: un copy con raya larga aborta antes de abrir Payload', r.code === 1 && r.loads === 0)
  }
  {
    const slot = '{' + '{pendiente}' + '}'
    const sources = shadow.DEFAULT_SOURCES.map((s, i) => (i === 1 ? { ...s, es: { ...s.es, bio: { title: slot } } } : s))
    const fake = fakePayload({}, { fieldNames: fieldNames() })
    const r = await runShadow(baseOpts({ apply: true, dbChecked: true }), fake, PROD_URI, sources)
    check('26: un copy con marcador de ranura aborta antes de abrir Payload', r.code === 1 && r.loads === 0)
  }

  // Recorte de etapas (5 contra 4)
  {
    const withExtra = clone(ABOUT_COPY_ES) as { experience: { stages: Record<string, unknown>[] } }
    withExtra.experience.stages = withExtra.experience.stages.map((st, i) => ({ ...st, id: `row-${i}` }))
    withExtra.experience.stages.push({ id: 'row-sobrante', when: 'nov 2022 a hoy', role: 'Rol viejo', org: 'aprendoseo', body: 'texto viejo' })
    const initial: Store = { 'about-page': { es: withExtra as unknown as Record<string, unknown> } }

    const dry = fakePayload(initial, { fieldNames: fieldNames() })
    const rDry = await runShadow(baseOpts({ only: 'about' }), dry)
    check('26: dry-run con 5 etapas contra 4 sale 0, no escribe y lista la fila que sobra', rDry.code === 0 && dry.writes.length === 0 && /DESCARTA experience\.stages\[4\] \(id row-sobrante\)/.test(rDry.text) && /aprendoseo/.test(rDry.text), rDry.text)

    const refuse = fakePayload(initial, { fieldNames: fieldNames() })
    const rRefuse = await runShadow(baseOpts({ apply: true, dbChecked: true }), refuse)
    check('26: con 5 etapas en la base y 4 en el copy aborta sin la bandera y no escribe NADA (ni la home)', rRefuse.code === 1 && refuse.writes.length === 0 && /allow-shrink-stages/.test(rRefuse.text), `codigo ${rRefuse.code}, escrituras ${refuse.writes.length}`)

    const noApply = fakePayload(initial, { fieldNames: fieldNames() })
    const rNoApply = await runShadow(baseOpts({ allowShrinkStages: true }), noApply)
    check('26: --allow-shrink-stages sin --apply aborta', rNoApply.code === 1 && noApply.writes.length === 0)

    const shrink = fakePayload(initial, { fieldNames: fieldNames() })
    const rShrink = await runShadow(baseOpts({ apply: true, dbChecked: true, only: 'about', allowShrinkStages: true }), shrink)
    const written = shrink.writes[0]?.data.experience as { stages: { id?: string }[] } | undefined
    check(
      '26: con --allow-shrink-stages recorta a 4, conserva los ids de las filas que quedan y lista la fila descartada',
      rShrink.code === 0 && written?.stages.length === 4 && written.stages[0].id === 'row-0' && /DESCARTA experience\.stages\[4\] \(id row-sobrante\)/.test(rShrink.text) && /apruebo recortar etapas/.test(rShrink.text),
      `codigo ${rShrink.code}`,
    )
    check('26: tras el recorte la relectura coincide con el copy', (shrink.store['about-page']?.es?.experience as { stages: unknown[] }).stages.length === 4)
  }

  // Respaldo
  {
    const initial: Store = { 'home-page': { es: { tagline: 'Hola' }, en: { tagline: 'Hello' } }, 'about-page': { es: { bio: { title: 'x' } }, en: {} } }
    const fake = fakePayload(initial, { fieldNames: fieldNames() })
    const lines: string[] = []
    const errs: string[] = []
    const code = await shadow.run(baseOpts({ printCurrent: true }), { DATABASE_URI: PROD_URI }, async () => fake, { out: (l) => lines.push(l), err: (l) => errs.push(l) })
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = JSON.parse(lines.join('\n')) as Record<string, unknown>
    } catch {
      parsed = null
    }
    check('26: --print-current imprime solo JSON en stdout, no escribe y guarda los avisos en stderr', code === 0 && parsed !== null && 'home-page:es' in parsed && 'about-page:en' in parsed && fake.writes.length === 0 && errs.length > 0)
    check('26: --print-current no imprime credenciales', !lines.join('\n').includes('x:y') && !errs.join('\n').includes('x:y'))
  }
  {
    const fake = fakePayload({}, {})
    const lines: string[] = []
    const code = await shadow.run(baseOpts({ printCurrent: true }), { DATABASE_URI: NEON_URI }, async () => fake, { out: (l) => lines.push(l), err: () => undefined })
    check('26: --print-current tambien rechaza una base de Neon', code === 1 && lines.length === 0)
  }
  check('26: parseArgs rechaza --only con un valor desconocido', (() => { try { shadow.parseArgs(['--only', 'otro']); return false } catch { return true } })())

  // ------------------------------------------------------------ script 27
  const runLegal = async (opts: legal.Opts, fake: Fake, uri = PROD_URI, sources?: legal.LegalSource[], decisions?: legal.DecisionLite[]) => {
    let loads = 0
    const { lines, io: sink } = io()
    const code = await legal.run(opts, { DATABASE_URI: uri }, async () => { loads++; return fake }, sink, sources, decisions)
    return { code, loads, text: lines.join('\n') }
  }
  const lOpts = (over: Partial<legal.Opts> = {}): legal.Opts => ({ apply: false, dbChecked: false, includeEn: false, allowProposedEn: false, allowPending: false, ...over })

  {
    const fake = fakePayload({})
    const r = await runLegal(lOpts(), fake)
    check('27: el dry-run sale 0 y no escribe', r.code === 0 && fake.writes.length === 0 && /Decisiones LEGAL/.test(r.text))
  }
  {
    const fake = fakePayload({})
    const r = await runLegal(lOpts({ apply: true }), fake)
    check('27: --apply sin --db-checked falla antes de importar Payload', r.code === 1 && r.loads === 0)
  }
  {
    const fake = fakePayload({})
    const r = await runLegal(lOpts({ apply: true, dbChecked: true }), fake, NEON_URI)
    check('27: una base de Neon falla antes de importar nada', r.code === 1 && r.loads === 0 && fake.writes.length === 0)
  }
  {
    const fake = fakePayload({})
    const r = await runLegal(lOpts({ apply: true, dbChecked: true }), fake)
    check('27: --apply --db-checked siembra solo ES por defecto', r.code === 0 && fake.writes.length === 1 && fake.writes[0].locale === 'es', `escrituras ${fake.writes.length}`)
    const data = fake.writes[0]?.data ?? {}
    check('27: escribe privacy y terms y nunca effectiveDate', 'privacy' in data && 'terms' in data && !('effectiveDate' in data) && fake.writes.every((w) => !('effectiveDate' in w.data)))
    const again = await runLegal(lOpts({ apply: true, dbChecked: true }), fake)
    check('27: repetir no escribe nada (compara el texto aplanado)', again.code === 0 && fake.writes.length === 1)
  }
  {
    const fake = fakePayload({})
    const enProposed: legal.DecisionLite[] = ['LEGAL-PRIVACY-ES', 'LEGAL-TERMS-ES'].map((id) => ({ id, status: 'aprobado' as const, gate: 'aprobado' as const })).concat(['LEGAL-PRIVACY-EN', 'LEGAL-TERMS-EN'].map((id) => ({ id, status: 'propuesto' as never, gate: 'aprobado' as const })))
    const r = await runLegal(lOpts({ apply: true, dbChecked: true, includeEn: true }), fake, PROD_URI, undefined, enProposed)
    check('27: --include-en con los documentos EN propuestos aborta sin escribir', r.code === 1 && fake.writes.length === 0 && /LEGAL-PRIVACY-EN/.test(r.text))
    const ok = await runLegal(lOpts({ apply: true, dbChecked: true, includeEn: true, allowProposedEn: true }), fake, PROD_URI, undefined, enProposed)
    check('27: --include-en --allow-proposed-en escribe es y en', ok.code === 0 && fake.writes.map((w) => w.locale).join(',') === 'es,en')
  }
  {
    const pending: legal.DecisionLite[] = [{ id: 'LEGAL-FACT-X', status: 'pendiente', gate: 'aprobado' }]
    const fake = fakePayload({})
    const r = await runLegal(lOpts({ apply: true, dbChecked: true }), fake, PROD_URI, undefined, pending)
    check('27: una decision LEGAL pendiente aborta sin --allow-pending', r.code === 1 && r.loads === 0 && fake.writes.length === 0)
    const ok = await runLegal(lOpts({ apply: true, dbChecked: true, allowPending: true }), fake, PROD_URI, undefined, pending)
    check('27: --allow-pending permite sembrar', ok.code === 0 && fake.writes.length === 1)
  }
  {
    const fake = fakePayload({})
    const r = await runLegal(lOpts(), fake)
    check('27: las decisiones propuestas del texto ES no bloquean la siembra', r.code === 0)
  }
  {
    let threw = false
    try {
      legal.assertNoEffectiveDate({ privacy: {}, effectiveDate: '2026-11-20' })
    } catch {
      threw = true
    }
    let clean = true
    try {
      legal.assertNoEffectiveDate({ privacy: {}, terms: {} })
    } catch {
      clean = false
    }
    check('27: assertNoEffectiveDate lanza si el dato trae effectiveDate y deja pasar el resto', threw && clean)
  }
  {
    const empty = legal.DEFAULT_SOURCES.map((s) => ({ ...s, privacy: { root: { type: 'root', children: [{ type: 'paragraph', children: [] }] } } }))
    const fake = fakePayload({})
    const r = await runLegal(lOpts({ apply: true, dbChecked: true }), fake, PROD_URI, empty)
    check('27: un cuerpo sin texto aborta antes de abrir Payload', r.code === 1 && r.loads === 0)
  }
  {
    const a = legal.lexicalLines({ root: { type: 'root', children: [{ type: 'heading', children: [{ type: 'text', text: 'Titulo' }] }, { type: 'list', children: [{ type: 'listitem', children: [{ type: 'text', text: 'Uno' }] }] }, { type: 'paragraph', children: [{ type: 'text', text: 'Con ' }, { type: 'link', children: [{ type: 'text', text: 'enlace' }] }] }] } })
    check('27: lexicalLines aplana encabezados, elementos de lista y enlaces', a.join('|') === 'Titulo|Uno|Con enlace', a.join('|'))
  }

  console.log(failures === 0 ? '\nPASS selftest 56-shadow-seed-selftest' : `\nFAIL selftest 56-shadow-seed-selftest (${failures})`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
