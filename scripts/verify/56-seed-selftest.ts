/**
 * Autoprueba del registro de decisiones de la fase 56 y de los helpers de
 * 54-seed-lib que la fase usa (plan 56-01).
 *
 * No toca ninguna base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/56-seed-selftest.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 */
import {
  assertNoForbiddenChars,
  assertSafeTarget,
  findPendingMarkers,
  safeTarget,
} from '../db/data/54-seed-lib'
import {
  gateFailures,
  resolveDecision,
  validateDecisions,
  type Decision,
} from '../db/data/56-content-decisions'

let failures = 0

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (err) {
    failures++
    console.log(`FAIL ${name}: ${(err as Error).message}`)
  }
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

function expectThrows(fn: () => unknown, label: string) {
  let threw = false
  try {
    fn()
  } catch {
    threw = true
  }
  if (!threw) throw new Error(`${label}: debia lanzar y no lanzo`)
}

const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)
const OPEN = '{' + '{'

const dec = (over: Partial<Decision>): Decision => ({
  id: 'D-22a',
  label: 'Titulo del hero',
  status: 'aprobado',
  gate: 'aprobado',
  ...over,
})

// ---------------------------------------------------------------------------
// Registro de decisiones
// ---------------------------------------------------------------------------
check('resolveDecision devuelve options[chosen]', () => {
  const d = dec({ chosen: 'B', options: { A: { es: 'uno' }, B: { es: 'dos', en: 'two' } } })
  const o = resolveDecision(d)
  assert(o?.es === 'dos' && o?.en === 'two', 'opcion equivocada')
})

check('resolveDecision lanza si chosen no existe en options', () => {
  expectThrows(() => resolveDecision(dec({ chosen: 'Z', options: { A: { es: 'uno' } } })), 'chosen inexistente')
  expectThrows(() => resolveDecision(dec({ options: { A: { es: 'uno' } } })), 'sin chosen')
})

check('resolveDecision devuelve undefined si no hay options', () => {
  assert(resolveDecision(dec({})) === undefined, 'debia ser undefined')
})

check('gateFailures: un pendiente es problema en modo corte y aviso en modo revision', () => {
  const d = [dec({ status: 'pendiente' })]
  assert(gateFailures(d, 'corte').problems.length === 1, 'no fallo el corte')
  const rev = gateFailures(d, 'revision')
  assert(rev.problems.length === 0 && rev.warnings.length === 1, 'revision debia avisar sin fallar')
})

check('gateFailures: propuesto con gate aprobado es problema, con gate propuesto es aviso', () => {
  const blocked = gateFailures([dec({ status: 'propuesto', gate: 'aprobado' })])
  assert(blocked.problems.length === 1 && blocked.warnings.length === 0, 'debia fallar')
  const soft = gateFailures([dec({ status: 'propuesto', gate: 'propuesto' })])
  assert(soft.problems.length === 0 && soft.warnings.length === 1, 'debia ser aviso')
})

check('gateFailures: un aprobado no genera nada', () => {
  const r = gateFailures([dec({ status: 'aprobado' }), dec({ id: 'x', status: 'aprobado', gate: 'propuesto' })])
  assert(r.problems.length === 0 && r.warnings.length === 0, 'un aprobado no debia dar ruido')
})

check('validateDecisions detecta id duplicado, estado invalido y chosen fuera de options', () => {
  const dup = validateDecisions([dec({ id: 'CTA-1' }), dec({ id: 'CTA-1' })])
  assert(dup.some((p) => /duplicado/.test(p)), 'no vio el duplicado')
  assert(validateDecisions([dec({ status: 'x' as never })]).some((p) => /estado invalido/.test(p)), 'no vio el estado')
  assert(validateDecisions([dec({ chosen: 'Z', options: { A: {} } })]).some((p) => /no existe en options/.test(p)), 'no vio chosen')
  assert(validateDecisions([dec({ id: 'a' }), dec({ id: 'b' })]).length === 0, 'un conjunto limpio dio problemas')
})

// ---------------------------------------------------------------------------
// Helpers de 54-seed-lib que la fase usa
// ---------------------------------------------------------------------------
check('assertNoForbiddenChars rechaza raya larga, raya media y marcador', () => {
  expectThrows(() => assertNoForbiddenChars({ a: `x ${EM} y` }), 'raya larga')
  expectThrows(() => assertNoForbiddenChars({ a: `x ${EN} y` }), 'raya media')
  expectThrows(() => assertNoForbiddenChars({ a: `${OPEN}pendiente}}` }), 'marcador')
  assertNoForbiddenChars({ a: 'texto limpio', b: ['otro limpio'] })
})

check('findPendingMarkers devuelve la ruta generica del marcador', () => {
  const found = findPendingMarkers({ stages: [{ when: `${OPEN}pendiente}} fecha` }], ok: 'x' })
  assert(found.length === 1 && found[0] === 'stages[].when', `ruta inesperada: ${found.join(',')}`)
  assert(findPendingMarkers({ a: 'limpio' }).length === 0, 'vio un marcador donde no hay')
})

check('assertSafeTarget rechaza una base de Neon', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@ep-hidden-heart-atc1vys8.neon.tech/neondb', false, false),
    'neon.tech',
  )
})

check('assertSafeTarget rechaza un host no permitido', () => {
  expectThrows(() => assertSafeTarget('postgresql://u:p@db.ejemplo.com:5432/juantech', false, false), 'host')
})

check('assertSafeTarget rechaza --apply sin --db-checked y acepta el tunel con ambos', () => {
  expectThrows(() => assertSafeTarget('postgresql://u:p@127.0.0.1:15432/juantech', true, false), 'apply sin db-checked')
  const t = assertSafeTarget('postgresql://u:p@127.0.0.1:15432/juantech', true, true)
  assert(t.host === '127.0.0.1' && t.port === '15432' && t.database === 'juantech', 'partes mal leidas')
})

check('safeTarget nunca imprime usuario ni clave', () => {
  const s = safeTarget('postgresql://usuario_x:clave_x@127.0.0.1:15432/juantech')
  assert(s === '127.0.0.1:15432/juantech', `salida inesperada: ${s}`)
})

console.log(failures === 0 ? 'PASS 56-seed-selftest: registro de decisiones y helpers de la fase' : `FAIL 56-seed-selftest: ${failures} caso(s)`)
process.exit(failures === 0 ? 0 : 1)
