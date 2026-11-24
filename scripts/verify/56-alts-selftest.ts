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
  DECORATIVE_IMAGES,
  ALT_HARD_MAX,
  CAPTURE_ALTS,
  DECISIONS,
  PHOTO_ALTS,
  type AltRow,
} from '../db/data/56-alt-texts'
import { validateDecisions } from '../db/data/56-content-decisions'
import {
  DECISIONS as HEAD_DECISIONS,
  HEADINGS,
  bannedInProposal,
  isRealPunctuation,
  parseContractWarnings,
} from '../db/data/56-headings-table'

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

check('datos: el avatar decorativo queda fuera de las filas de alt', () => {
  assert(DECORATIVE_IMAGES.length > 0, 'falta el registro de imagenes decorativas')
  assert(
    DECORATIVE_IMAGES.every((d) => !ALL_ALTS.some((r) => r.mediaSlug === d.mediaSlug)),
    'una imagen decorativa aparece tambien como fila de alt',
  )
})
check('datos: 4 fotos y 6 capturas, todas con valor actual', () => {
  assert(PHOTO_ALTS.length === 4, `${PHOTO_ALTS.length} fotos`)
  assert(CAPTURE_ALTS.length === 6, `${CAPTURE_ALTS.length} capturas`)
  assert(ALL_ALTS.every((r) => r.actualEs.trim() && r.actualEn.trim()), 'falta un valor actual')
})
check('datos: solo esta aprobado lo cargable (Juan aprobo los alt el 2026-11-10; el de Juan Tech se recapturo el 2026-11-14)', () => {
  assert(ALL_ALTS.every((r) => (r.status === 'aprobado') === r.loadable), 'un alt aprobado no es cargable, o uno cargable no esta aprobado')
})

// ---- tabla de encabezados (D-17, T-56-23)
const FIXTURE_CONTRACT = [
  'PASS / contrato',
  'WARN /: encabezado con punto o coma (h2: Errores reales, con el commit que los corrige)',
  'WARN /: encabezado con punto o coma (h3: Desarrollo con Next.js y Payload)',
  'WARN /privacy: encabezado con punto o coma (h2: 6. Cookies)',
  'FAIL /sobre-mi contrato: marcador',
].join('\n')

check('encabezados: el parser lee solo los avisos de encabezado', () => {
  const rows = parseContractWarnings(FIXTURE_CONTRACT)
  assert(rows.length === 3, `${rows.length} filas`)
  assert(rows[0].level === 2 && rows[0].text === 'Errores reales, con el commit que los corrige', 'fila 1 mal leida')
})
check('encabezados: el regex afinado separa reales de falsos positivos', () => {
  const real = ['Errores reales, con el commit que los corrige', '6. Cookies', 'Desarrollo, CMS y medios']
  const falsos = ['Desarrollo con Next.js y Payload', 'Dr. Manuel A. Vargas Hidalgo', 'más de 86,000 clics', 'el archivo llms.txt']
  for (const t of real) assert(isRealPunctuation(t), `deberia ser real: ${t}`)
  for (const t of falsos) assert(!isRealPunctuation(t), `deberia ser falso positivo: ${t}`)
})
check('encabezados: la regla de la voz rechaza puntuacion en una propuesta', () => {
  assert(bannedInProposal('Cómo uso tus datos').length === 0, 'rechazo un texto limpio')
  assert(bannedInProposal('Antes, después').length > 0, 'no rechazo la coma')
  assert(bannedInProposal('Tema: subtema').length > 0, 'no rechazo los dos puntos')
  assert(bannedInProposal('Texto cortado...').length > 0, 'no rechazo los puntos suspensivos')
  assert(bannedInProposal('¿Cuánto dura una auditoría?').length === 0, 'rechazo una pregunta de FAQ')
})
check('encabezados: el recuento reproduce el contrato contra dev (52 unicos, 13 falsos, 39 reales)', () => {
  const dev = HEADINGS.filter((r) => r.enDev)
  assert(dev.length === 52, `${dev.length} unicos en dev, se esperaban 52`)
  assert(dev.filter((r) => !r.real).length === 13, 'falsos positivos distintos de 13')
  assert(dev.filter((r) => r.real).length === 39, 'reales en dev distintos de 39')
  assert(HEADINGS.filter((r) => r.real).length === 41, 'reales totales distintos de 41 (39 + 2 lecciones)')
})
check('encabezados: la marca real coincide con el regex afinado y no hay filas repetidas', () => {
  const bad = HEADINGS.filter((r) => r.enDev && r.real !== isRealPunctuation(r.antes)).map((r) => r.id)
  assert(bad.length === 0, `marca real incoherente en ${bad.join(', ')}`)
  const seen = new Set<string>()
  for (const r of HEADINGS) {
    const k = `${r.level}|${r.antes}`
    assert(!seen.has(k), `fila repetida ${r.id}`)
    seen.add(k)
  }
})
check('encabezados: toda propuesta cumple la voz y los falsos positivos no se tocan', () => {
  for (const r of HEADINGS) {
    if (r.real) {
      assert(r.despues.trim().length > 0, `${r.id}: fila real sin propuesta`)
      const p = bannedInProposal(r.despues)
      assert(p.length === 0, `${r.id}: ${p.join('; ')}`)
    } else {
      assert(r.despues === '' && r.accion === 'ninguna-falso-positivo', `${r.id}: un falso positivo no lleva propuesta`)
    }
  }
})
check('encabezados: solo se documenta, lo de master queda en decidir Juan o en reemplazo al cortar', () => {
  for (const r of HEADINGS.filter((x) => x.viveEn === 'master' && x.real)) {
    assert(r.accion === 'decidir-juan' || r.accion === 'reemplazar-al-cortar', `${r.id}: accion ${r.accion} sobre un encabezado de master`)
    assert(r.group === 'legal' ? r.accion === 'reemplazar-al-cortar' : r.accion === 'decidir-juan', `${r.id}: accion no coincide con su grupo`)
  }
  assert(HEADINGS.filter((r) => r.group === 'lecciones').every((r) => r.viveEn === 'nuevo'), 'las lecciones deben ser contenido nuevo')
})
check('encabezados: los grupos de master quedan aprobados con no tocar (Juan, 2026-11-10)', () => {
  const p = validateDecisions(HEAD_DECISIONS)
  assert(p.length === 0, p.join('; '))
  assert(HEAD_DECISIONS.every((d) => d.id.startsWith('HEAD-')), 'id sin prefijo HEAD-')
  for (const g of ['codefixes', 'servicios', 'stack', 'busqueda']) {
    const d = HEAD_DECISIONS.find((x) => x.id === `HEAD-${g}`)
    assert(d, `falta HEAD-${g}`)
    assert(d.status === 'aprobado' && d.chosen === 'no-tocar', `HEAD-${g} debe estar aprobado con no-tocar`)
  }
})

if (failures > 0) {
  console.log(`FAIL 56-alts-selftest: ${failures} caso(s) fallaron`)
  process.exit(1)
}
console.log('PASS 56-alts-selftest')
