/**
 * Autoprueba de los textos alternativos de la fase 56 (plan 56-07, D-18, T-56-22).
 *
 *   node_modules/.bin/tsx scripts/verify/56-alts-selftest.ts
 *
 * No toca ninguna base ni la red. Imprime PASS o FAIL motivo por caso y sale con 1
 * ante cualquier FAIL. Primero prueba las reglas contra fixtures buenos y malos, luego
 * las aplica a los datos reales de scripts/db/data/56-alt-texts.ts.
 */
import {
  ALL_ALTS,
  ALT_HARD_MAX,
  CAPTURE_ALTS,
  DECISIONS,
  PHOTO_ALTS,
  type AltRow,
} from '../db/data/56-alt-texts'
import { validateDecisions } from '../db/data/56-content-decisions'

const EM = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const OPEN = '{' + '{'
const FORBIDDEN_PREFIXES = [/^imagen\s+de\b/i, /^imagen\b/i, /^foto\s+de\b/i, /^fotograf[ií]a\s+de\b/i, /^captura\s+de\b/i, /^screenshot\s+of\b/i, /^image\s+of\b/i, /^picture\s+of\b/i, /^photo\s+of\b/i]

/** Reglas sobre un solo texto. Devuelve los problemas (vacio si cumple). */
export function textProblems(label: string, text: string): string[] {
  const out: string[] = []
  const t = text.trim()
  if (!t) return [`${label}: vacio`]
  for (const re of FORBIDDEN_PREFIXES) if (re.test(t)) out.push(`${label}: empieza por un prefijo prohibido (${re})`)
  if (t.includes(EM) || t.includes(EN_DASH)) out.push(`${label}: lleva raya larga o media`)
  if (t.includes(OPEN) || t.includes('}}')) out.push(`${label}: lleva marcador de ranura`)
  if (/portfolio/i.test(t)) out.push(`${label}: usa "portfolio"`)
  if (t.length > ALT_HARD_MAX) out.push(`${label}: ${t.length} caracteres, pasa el tope de ${ALT_HARD_MAX}`)
  return out
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

/** Reglas sobre una fila: ES y EN, actual de las capturas, ES distinto de EN. */
export function rowProblems(row: AltRow): string[] {
  const out = [...textProblems(`${row.key}.es`, row.es), ...textProblems(`${row.key}.en`, row.en)]
  if (row.kind === 'captura' && (!row.actualEs.trim() || !row.actualEn.trim())) {
    out.push(`${row.key}: falta el valor actual (respaldo) de la captura`)
  }
  if (wordCount(row.es) > 3 && row.es.trim().toLowerCase() === row.en.trim().toLowerCase()) {
    out.push(`${row.key}: el EN es igual al ES (quedo en español)`)
  }
  if (!row.loadable && row.status !== 'pendiente') {
    out.push(`${row.key}: no es cargable pero su estado es ${row.status}, debe ser pendiente`)
  }
  return out
}

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

const good: AltRow = {
  key: 'x',
  kind: 'captura',
  mediaSlug: 'x-screenshot',
  es: 'Inicio de un sitio en tema oscuro con titular y botón de contacto',
  en: 'Home page of a dark theme site with a headline and a contact button',
  actualEs: 'X captura de pantalla completa',
  actualEn: 'X captura de pantalla completa',
  status: 'propuesto',
  loadable: true,
  nota: 'fixture',
  source: 'fixture',
}

// ---- reglas contra fixtures
check('fixture bueno: sin problemas', () => {
  const p = rowProblems(good)
  assert(p.length === 0, p.join('; '))
})
for (const [name, es] of [
  ['prefijo "Imagen de"', 'Imagen de un sitio web con titular y botón de contacto'],
  ['prefijo "Foto de"', 'Foto de Juan sonriendo frente a una pared gris'],
  ['prefijo "Captura de"', 'Captura de pantalla del inicio de un sitio'],
] as const) {
  check(`fixture malo rechazado: ${name}`, () => {
    assert(rowProblems({ ...good, es }).length > 0, 'no lo rechazo')
  })
}
check('fixture malo rechazado: EN igual al ES', () => {
  assert(rowProblems({ ...good, en: good.es }).some((m) => m.includes('EN es igual')), 'no detecto el EN en español')
})
check('fixture malo rechazado: vacio', () => {
  assert(rowProblems({ ...good, en: '  ' }).length > 0, 'no rechazo el vacio')
})
check('fixture malo rechazado: raya larga', () => {
  assert(rowProblems({ ...good, es: `Inicio de un sitio ${EM} titular y botón de contacto` }).length > 0, 'no rechazo la raya')
})
check('fixture malo rechazado: raya media', () => {
  assert(rowProblems({ ...good, en: `Home page ${EN_DASH} headline and a contact button` }).length > 0, 'no rechazo la raya media')
})
check('fixture malo rechazado: marcador de ranura', () => {
  assert(rowProblems({ ...good, es: `Inicio ${OPEN}pendiente}} del sitio con titular` }).length > 0, 'no rechazo el marcador')
})
check('fixture malo rechazado: demasiado largo', () => {
  assert(rowProblems({ ...good, es: 'palabra '.repeat(40) }).length > 0, 'no rechazo el largo')
})
check('fixture malo rechazado: captura sin valor actual', () => {
  assert(rowProblems({ ...good, actualEn: '' }).length > 0, 'no exigio el actual')
})
check('fixture malo rechazado: no cargable pero propuesto', () => {
  assert(rowProblems({ ...good, loadable: false }).length > 0, 'no exigio pendiente')
})

// ---- datos reales
check('datos: cada fila cumple las reglas', () => {
  const p = ALL_ALTS.flatMap(rowProblems)
  assert(p.length === 0, p.join('; '))
})
check('datos: claves y mediaSlug unicos', () => {
  const keys = new Set(ALL_ALTS.map((r) => r.key))
  const slugs = new Set(ALL_ALTS.map((r) => r.mediaSlug))
  assert(keys.size === ALL_ALTS.length, 'clave repetida')
  assert(slugs.size === ALL_ALTS.length, 'mediaSlug repetido')
})
check('datos: el registro de decisiones es valido y trae una por fila', () => {
  const p = validateDecisions(DECISIONS)
  assert(p.length === 0, p.join('; '))
  assert(DECISIONS.length === ALL_ALTS.length, `${DECISIONS.length} decisiones para ${ALL_ALTS.length} filas`)
  assert(DECISIONS.every((d) => d.id.startsWith('ALT-')), 'id sin prefijo ALT-')
})
check('datos: el hero de Sobre mi y al menos una captura existen', () => {
  assert(PHOTO_ALTS.some((r) => r.key === 'about-hero'), 'falta about-hero')
  assert(CAPTURE_ALTS.length > 0, 'faltan capturas')
})

if (failures > 0) {
  console.log(`FAIL 56-alts-selftest: ${failures} caso(s) fallaron`)
  process.exit(1)
}
console.log('PASS 56-alts-selftest')
