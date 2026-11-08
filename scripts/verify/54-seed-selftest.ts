/**
 * Autoprueba de los scripts de siembra de la fase 54 (plan 54-04).
 *
 * tsc no revisa scripts/ (excluido en tsconfig): la forma de los datos se
 * comprueba aquí, en tiempo de ejecución. No toca ninguna base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-seed-selftest.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 */
import {
  assertNoForbiddenChars,
  assertPendingMarkersOnlyIn,
  assertSafeTarget,
  buildDiff,
  mergeGroup,
  normalizeName,
  safeTarget,
} from '../db/data/54-seed-lib'
import { HOME_COPY_ES } from '../db/data/54-home-copy'

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

function expectThrows(fn: () => unknown, label: string) {
  let threw = false
  try {
    fn()
  } catch {
    threw = true
  }
  if (!threw) throw new Error(`${label}: debía lanzar y no lanzó`)
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)
const OPEN = '{' + '{'

// ---------------------------------------------------------------------------
// Guardias de base
// ---------------------------------------------------------------------------
check('assertSafeTarget rechaza neon.tech (la base abandonada del incidente)', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@ep-hidden-heart-atc1vys8.neon.tech/neondb', false, false),
    'neon.tech',
  )
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@ep-x.neon.tech/juantech', true, true),
    'neon.tech con nombre juantech',
  )
})

check('assertSafeTarget rechaza una base que no se llama juantech', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@127.0.0.1:15432/otra', false, false),
    'base distinta',
  )
})

check('assertSafeTarget rechaza hosts desconocidos', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@db.ejemplo.com:5432/juantech', false, false),
    'host desconocido',
  )
})

check('assertSafeTarget rechaza URI ausente o no parseable', () => {
  expectThrows(() => assertSafeTarget(undefined, false, false), 'sin URI')
  expectThrows(() => assertSafeTarget('esto no es una url', false, false), 'URI rota')
})

check('assertSafeTarget rechaza --apply sin --db-checked', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@127.0.0.1:15432/juantech', true, false),
    'apply sin dbChecked',
  )
})

check('assertSafeTarget acepta 127.0.0.1:15432/juantech con ambos flags y en dry-run', () => {
  const t = assertSafeTarget('postgresql://u:p@127.0.0.1:15432/juantech?sslmode=disable', true, true)
  assert(t.host === '127.0.0.1' && t.port === '15432' && t.database === 'juantech', 'partes mal leídas')
  assertSafeTarget('postgresql://u:p@shared-postgres:5432/juantech', false, false)
  assertSafeTarget('postgresql://u:p@localhost:5432/juantech', false, false)
})

check('safeTarget nunca imprime usuario ni contraseña', () => {
  const s = safeTarget('postgresql://usuario_secreto:clave_secreta@127.0.0.1:15432/juantech')
  assert(s === '127.0.0.1:15432/juantech', `salida inesperada: ${s}`)
  assert(!s.includes('secret'), 'filtró credenciales')
})

// ---------------------------------------------------------------------------
// Diff y fusión
// ---------------------------------------------------------------------------
check('buildDiff: igual no produce diferencias, un campo distinto sí', () => {
  const a = { hero: { title: 'x', lead: 'y' }, items: [{ t: '1' }, { t: '2' }] }
  assert(buildDiff(a, { hero: { title: 'x', lead: 'y' }, items: [{ t: '1' }, { t: '2' }] }).length === 0, 'iguales dieron diff')
  const d = buildDiff(a, { hero: { title: 'x', lead: 'otro' }, items: [{ t: '1' }, { t: '2' }] })
  assert(d.length === 1 && d[0] === 'hero.lead', `diff inesperado: ${d.join(',')}`)
})

check('buildDiff ignora claves extra de lo leído (id) y detecta filas de más o de menos', () => {
  const current = { items: [{ id: 'a', t: '1' }] }
  assert(buildDiff(current, { items: [{ t: '1' }] }).length === 0, 'el id contó como diferencia')
  assert(buildDiff(current, { items: [{ t: '1' }, { t: '2' }] }).length > 0, 'no detectó fila nueva')
})

check('mergeGroup conserva ids y lanza si la base tiene filas sobrantes', () => {
  const merged = mergeGroup({ items: [{ id: 'a', t: 'viejo', extra: 1 }] }, { items: [{ t: 'nuevo' }] }) as {
    items: { id: string; t: string; extra: number }[]
  }
  assert(merged.items[0].id === 'a' && merged.items[0].t === 'nuevo' && merged.items[0].extra === 1, 'fusión incorrecta')
  expectThrows(() => mergeGroup({ items: [{ id: 'a' }, { id: 'b' }] }, { items: [{ t: 'x' }] }), 'filas sobrantes')
})

// ---------------------------------------------------------------------------
// Nombres y chequeos de copy
// ---------------------------------------------------------------------------
check('normalizeName: money-com y money.com coinciden; acentos y puntuación se ignoran', () => {
  assert(normalizeName('money-com') === normalizeName('Money.com'), 'money')
  assert(normalizeName('Crédito USS') === normalizeName('credito-uss'), 'credito-uss')
  assert(normalizeName('Dr. Manuel A. Vargas Hidalgo') === normalizeName('dr-manuel-a-vargas-hidalgo'), 'dr vargas')
  assert(normalizeName('Apturio') !== normalizeName('Aprendoclub'), 'distintos coinciden')
})

check('assertNoForbiddenChars rechaza guion largo, guion corto y marcador de ranura', () => {
  expectThrows(() => assertNoForbiddenChars({ a: `uno ${EM} dos` }), 'guion largo')
  expectThrows(() => assertNoForbiddenChars({ a: [`uno ${EN} dos`] }), 'guion corto')
  expectThrows(() => assertNoForbiddenChars({ a: `${OPEN}testimonio}}` }), 'marcador')
  assertNoForbiddenChars({ a: 'texto limpio, con coma y punto.' })
})

check('assertNoForbiddenChars exime el marcador solo en la ruta permitida, nunca los guiones', () => {
  const obj = { experience: { stages: [{ when: `${OPEN}pendiente}} fecha` }] } }
  assertNoForbiddenChars(obj, ['experience.stages[].when'])
  expectThrows(() => assertNoForbiddenChars(obj, ['otra.ruta']), 'ruta no permitida')
  expectThrows(
    () => assertNoForbiddenChars({ experience: { stages: [{ when: `${OPEN}x}} ${EM}` }] } }, ['experience.stages[].when']),
    'guion en ruta eximida',
  )
})

check('assertPendingMarkersOnlyIn deja pasar la ruta permitida y rechaza las demás', () => {
  const ok = { experience: { stages: [{ when: `${OPEN}pendiente}}` }] } }
  assertPendingMarkersOnlyIn(ok, ['experience.stages[].when'])
  expectThrows(
    () => assertPendingMarkersOnlyIn({ ...ok, faq: { items: [{ answer: `${OPEN}x}}` }] } }, ['experience.stages[].when']),
    'marcador fuera de ruta',
  )
  assertPendingMarkersOnlyIn({ limpio: 'sí' }, [])
})

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------
check('HOME_COPY_ES.tagline y hero no contienen caracteres prohibidos ni marcadores', () => {
  assertNoForbiddenChars({ tagline: HOME_COPY_ES.tagline, hero: HOME_COPY_ES.hero })
  assert(typeof HOME_COPY_ES.tagline === 'string' && HOME_COPY_ES.tagline.length > 20, 'tagline vacío')
  for (const k of ['eyebrow', 'titleLine1', 'titleLine2', 'lead', 'ctaLabel', 'ctaHref', 'statValue', 'statCaption']) {
    assert(typeof (HOME_COPY_ES.hero as Record<string, unknown>)[k] === 'string', `hero.${k} falta`)
  }
})

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nTodos los casos en PASS')
