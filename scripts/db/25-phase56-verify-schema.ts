/**
 * SOLO LECTURA. Verifica el esquema y la siembra de la fase 56 en la base a la que
 * apunte DATABASE_URI: global legal-pages (migracion phase56_legal_shadow) y la
 * siembra EN de home-page y about-page.
 *
 * No contiene ninguna llamada de escritura de la Local API. Imprime host, puerto y
 * base (nunca usuario ni contrasena), asi que es seguro pegar la salida en el chat.
 *
 * Antes de abrir Payload llama assertSafeTarget: aborta si el host no es
 * 127.0.0.1, localhost o shared-postgres, si es Neon o si la base no se llama
 * juantech. Nunca se carga el archivo .env local: la DATABASE_URI sale del
 * entorno del tunel.
 *
 * Se corre dos veces en 56-12, con el usuario dueno (juantech_user) y con el rol de
 * solo lectura del preview (juantech_preview_ro). Si ese rol no puede leer las
 * tablas nuevas, permission denied sale aqui y no en una pagina rota del preview.
 *
 *   DATABASE_URI=<tunel, rol> PAYLOAD_SECRET=<cualquiera> \
 *     node_modules/.bin/tsx scripts/db/25-phase56-verify-schema.ts [banderas]
 *
 * Banderas:
 *   --expect-seeded         legal-pages con privacy y terms con texto en es y en
 *   --expect-date           legal-pages.effectiveDate no vacia
 *   --expect-shadow-seeded  siembra EN de home-page y about-page (centinelas, listas, etapas)
 *   --es-only               con las dos anteriores, exige solo ES (el EN espera la aprobacion
 *                           de Juan y todavia no se sembro)
 *   --selftest              fixtures, sin tocar ninguna base
 */
import { ABOUT_COPY_ES } from './data/56-about-copy'
import {
  assertSafeTarget,
  evaluateLegalState,
  evaluateShadow56State,
  HOME_LIST_COUNTS,
  mergeGroup,
  mergeGroupAllowShrink,
  safeTarget,
  type CheckResult,
  type LegalLocaleState,
  type LegalState,
  type Shadow56State,
} from './data/56-seed-lib'

const EXPECT_SEEDED = process.argv.includes('--expect-seeded')
const EXPECT_DATE = process.argv.includes('--expect-date')
const EXPECT_SHADOW_SEEDED = process.argv.includes('--expect-shadow-seeded')
const ES_ONLY = process.argv.includes('--es-only')
const SELFTEST = process.argv.includes('--selftest')

/** Cuantas etapas debe tener about-page: se deriva del copy de la fase, no se cablea. */
const ABOUT_STAGES = ABOUT_COPY_ES.experience.stages.length

function report(results: CheckResult[]): number {
  let fails = 0
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}: ${r.why}`)
    if (!r.ok) fails++
  }
  return fails
}

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

const lexical = (text: string) => ({
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
})
const lexicalEmpty = { root: { type: 'root', children: [{ type: 'paragraph', children: [] }] } }

const legalLocale = (over: Partial<NonNullable<LegalLocaleState>> = {}): LegalLocaleState => ({
  privacyBody: lexical('Politica de privacidad'),
  termsBody: lexical('Terminos de uso'),
  effectiveDate: null,
  ...over,
})

const emptyLegal: LegalState = {
  es: { privacyBody: lexicalEmpty, termsBody: null, effectiveDate: null },
  en: { privacyBody: null, termsBody: null, effectiveDate: null },
}

function list(n: number): { n: number }[] {
  return Array.from({ length: n }, (_, i) => ({ n: i }))
}

function homeFixture(tagline: string, lead: string): Record<string, unknown> {
  const home: Record<string, unknown> = { tagline, hero: { lead } }
  for (const [path, expected] of HOME_LIST_COUNTS) {
    const [group, key] = path.split('.')
    home[group] = { ...((home[group] as object) ?? {}), [key]: list(expected) }
  }
  return home
}

function aboutFixture(lead: string, stages: Record<string, unknown>[]): Record<string, unknown> {
  return { hero: { lead }, experience: { stages } }
}

function stageList(n: number): Record<string, unknown>[] {
  return Array.from({ length: n }, (_, i) => ({ when: `Etapa ${i}`, role: 'Rol' }))
}

function shadowFixture(over: { enTagline?: string; enHeroLead?: string; stages?: Record<string, unknown>[] } = {}): Shadow56State {
  const stages = over.stages ?? stageList(ABOUT_STAGES)
  return {
    es: { home: homeFixture('Tagline', 'Lead'), about: aboutFixture('Lead', stages) },
    en: {
      home: homeFixture(over.enTagline ?? 'Tagline', over.enHeroLead ?? 'Lead'),
      about: aboutFixture('Lead', stages),
    },
  }
}

function selftest(): never {
  let bad = 0
  const expect = (label: string, results: CheckResult[], want: 'none' | 'some', mustMention?: string) => {
    const failing = results.filter((r) => !r.ok)
    let good = want === 'none' ? failing.length === 0 : failing.length > 0
    if (good && mustMention) good = failing.some((r) => r.name.includes(mustMention) || r.why.includes(mustMention))
    console.log(`${good ? 'PASS' : 'FAIL'} ${label} (${failing.length} resultado(s) en FAIL)`)
    if (!good) bad++
  }
  const check = (label: string, ok: boolean) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
    if (!ok) bad++
  }

  // Test 1: estado legal vacio
  expect('legal vacio es valido sin expect-seeded', evaluateLegalState(emptyLegal, { expectSeeded: false }), 'none')
  expect('legal vacio produce FAIL con expect-seeded', evaluateLegalState(emptyLegal, { expectSeeded: true }), 'some')

  // Test 2: legal sembrado
  const seeded: LegalState = { es: legalLocale(), en: legalLocale() }
  expect('legal sembrado pasa con expect-seeded', evaluateLegalState(seeded, { expectSeeded: true }), 'none')
  expect('legal sembrado sin fecha pasa sin expect-date', evaluateLegalState(seeded, { expectSeeded: true, expectDate: false }), 'none')
  expect('legal sembrado sin fecha falla con expect-date', evaluateLegalState(seeded, { expectSeeded: true, expectDate: true }), 'some', 'effectiveDate')
  const dated: LegalState = { es: legalLocale({ effectiveDate: '2026-11-20T00:00:00.000Z' }), en: legalLocale() }
  expect('legal con fecha pasa con expect-date', evaluateLegalState(dated, { expectSeeded: true, expectDate: true }), 'none')
  expect(
    'lectura nula con permission denied explica el GRANT',
    evaluateLegalState({ es: null, en: null, permissionDenied: true }, { expectSeeded: false }),
    'some',
    'GRANT SELECT',
  )
  expect(
    'lectura nula sin permiso denegado apunta a la migracion',
    evaluateLegalState({ es: null, en: null }, { expectSeeded: false }),
    'some',
    'migracion',
  )

  // Test 3: estado sombra con EN sembrado y centinela
  const opts = { expectShadowSeeded: true, expectedStages: ABOUT_STAGES }
  expect('sombra con EN sembrado pasa con expect-shadow-seeded', evaluateShadow56State(shadowFixture(), opts), 'none')
  expect('sombra con tagline EN vacio falla (centinela)', evaluateShadow56State(shadowFixture({ enTagline: '' }), opts), 'some', 'tagline EN')
  expect('sombra con hero.lead EN vacio falla (centinela)', evaluateShadow56State(shadowFixture({ enHeroLead: '  ' }), opts), 'some', 'hero.lead EN')
  expect(
    'sombra sin expect-shadow-seeded solo exige lectura',
    evaluateShadow56State(shadowFixture({ enTagline: '' }), { expectShadowSeeded: false, expectedStages: ABOUT_STAGES }),
    'none',
  )

  // Test 3b: modo esOnly (el EN todavia no se sembro)
  const noEn = shadowFixture({ enTagline: '', enHeroLead: '' })
  expect('esOnly no exige el centinela EN', evaluateShadow56State(noEn, { ...opts, esOnly: true }), 'none')
  const legalEsOnly: LegalState = { es: legalLocale(), en: { privacyBody: null, termsBody: null, effectiveDate: null } }
  expect('legal esOnly pasa con solo ES sembrado', evaluateLegalState(legalEsOnly, { expectSeeded: true, esOnly: true }), 'none')
  expect('legal sin esOnly falla con EN vacio', evaluateLegalState(legalEsOnly, { expectSeeded: true }), 'some')

  // Test 4: marcador de ranura y cantidad de etapas
  const slot = '{' + '{pendiente}' + '}'
  const withSlot = stageList(ABOUT_STAGES)
  withSlot[1] = { when: `${slot} fecha`, role: 'Rol' }
  expect('about con una etapa con marcador de ranura falla', evaluateShadow56State(shadowFixture({ stages: withSlot }), opts), 'some', 'marcadores')
  expect(
    'about con otra cantidad de etapas falla',
    evaluateShadow56State(shadowFixture({ stages: stageList(ABOUT_STAGES + 1) }), opts),
    'some',
    'experience.stages',
  )

  // Test 5: mergeGroupAllowShrink
  const current = { items: [{ id: 'a', t: 1 }, { id: 'b', t: 2 }, { id: 'c', t: 3 }], keep: 'x' }
  const desired = { items: [{ t: 10 }, { t: 20 }] }
  const r = mergeGroupAllowShrink(current, desired)
  const items = (r.merged as { items: { id?: string; t: number }[] }).items
  check('mergeGroupAllowShrink recorta a las filas deseadas', items.length === 2 && items[0].t === 10 && items[1].t === 20)
  check('mergeGroupAllowShrink conserva el id de las filas que quedan', items[0].id === 'a' && items[1].id === 'b')
  check(
    'mergeGroupAllowShrink devuelve la fila descartada con ruta e id',
    r.discarded.length === 1 && r.discarded[0].path === 'items[2]' && r.discarded[0].id === 'c',
  )
  check('mergeGroupAllowShrink conserva claves ajenas', (r.merged as { keep?: string }).keep === 'x')
  const same = mergeGroupAllowShrink({ items: [{ id: 'a' }] }, { items: [{ t: 1 }] })
  check('mergeGroupAllowShrink sin sobrantes no descarta nada', same.discarded.length === 0)
  let threw = false
  try {
    mergeGroup(current, desired)
  } catch {
    threw = true
  }
  check('mergeGroup de la 54 sigue lanzando con filas sobrantes', threw)

  console.log(bad === 0 ? '\nPASS selftest 25-phase56-verify-schema' : `\nFAIL selftest 25-phase56-verify-schema (${bad})`)
  process.exit(bad > 0 ? 1 : 0)
}

// ---------------------------------------------------------------------------
// Lectura real (solo lectura)
// ---------------------------------------------------------------------------

function errText(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  return `${err.message} ${String((err as { cause?: unknown }).cause ?? '')}`.replace(/\s+/g, ' ').trim()
}

async function main() {
  if (SELFTEST) selftest()

  // La base equivocada se rechaza ANTES de abrir Payload.
  const target = assertSafeTarget(process.env.DATABASE_URI, false, false)

  console.log('=== Verificacion de esquema y siembra de la fase 56 (solo lectura) ===')
  console.log(`  host/base: ${safeTarget(process.env.DATABASE_URI)} (host ${target.host}, puerto ${target.port}, base ${target.database})`)
  const modes = [
    EXPECT_SEEDED && '--expect-seeded',
    EXPECT_DATE && '--expect-date',
    EXPECT_SHADOW_SEEDED && '--expect-shadow-seeded',
    ES_ONLY && '--es-only',
  ].filter(Boolean)
  console.log(`  modo: ${modes.length > 0 ? modes.join(' ') : 'solo esquema (los tres globals se leen)'}`)

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  let permissionDenied = false
  async function attempt<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn()
    } catch (err) {
      const msg = errText(err)
      if (msg.toLowerCase().includes('permission denied')) {
        permissionDenied = true
        console.log(`  (lectura de ${label} fallo: permission denied; el rol conectado no puede leer las tablas nuevas)`)
      } else {
        console.log(`  (lectura de ${label} fallo: ${msg.slice(0, 200)})`)
      }
      return null
    }
  }

  const readGlobal = (slug: 'legal-pages' | 'home-page' | 'about-page', locale: 'es' | 'en') =>
    attempt(`${slug} ${locale}`, () => payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 0 }))

  const legalEs = await readGlobal('legal-pages', 'es')
  const legalEn = await readGlobal('legal-pages', 'en')
  const homeEs = await readGlobal('home-page', 'es')
  const homeEn = await readGlobal('home-page', 'en')
  const aboutEs = await readGlobal('about-page', 'es')
  const aboutEn = await readGlobal('about-page', 'en')

  const toLegal = (g: unknown): LegalLocaleState => {
    if (!g || typeof g !== 'object') return null
    const d = g as { privacy?: { body?: unknown }; terms?: { body?: unknown }; effectiveDate?: unknown }
    return { privacyBody: d.privacy?.body, termsBody: d.terms?.body, effectiveDate: d.effectiveDate }
  }
  const legalState: LegalState = { es: toLegal(legalEs), en: toLegal(legalEn), permissionDenied }
  const shadowState: Shadow56State = {
    es: { home: homeEs as Record<string, unknown> | null, about: aboutEs as Record<string, unknown> | null },
    en: { home: homeEn as Record<string, unknown> | null, about: aboutEn as Record<string, unknown> | null },
  }

  let fails = 0
  fails += report(evaluateLegalState(legalState, { expectSeeded: EXPECT_SEEDED, expectDate: EXPECT_DATE, esOnly: ES_ONLY }))
  fails += report(
    evaluateShadow56State(shadowState, { expectShadowSeeded: EXPECT_SHADOW_SEEDED, expectedStages: ABOUT_STAGES, esOnly: ES_ONLY }),
  )
  console.log(fails === 0 ? '\nTodo en PASS' : `\n${fails} resultado(s) en FAIL`)
  process.exit(fails === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
