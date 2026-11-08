// Paridad es/en de los namespaces de interfaz de la fase 54 (plan 03).
//
// Namespaces revisados: common, home, services, about, contact, stack, legal,
// search y notFound. El resto de namespaces del repo conserva guiones heredados
// y no se mira aqui (shell lo cubre 53-messages-parity.mjs).
//
// Reglas, por namespace:
//   1. mismo conjunto de rutas de clave en es y en
//   2. valores de texto no vacios
//   3. mismo conjunto de variables ICU `{nombre}` clave por clave, incluidas las
//      de dentro de plurales, y misma forma (plural o select) en ambos idiomas;
//      todo plural trae la rama `other`
//   4. ningun guion largo ni corto (escritos por codigo para que este archivo
//      tampoco los contenga)
//   5. ningun marcador pendiente de llaves dobles
//   6. si el ultimo segmento de la clave termina en Heading o Title, el valor
//      no lleva punto ni coma (voz y tono del sitio)
//
// Imprime PASS o FAIL motivo y sale con 1 ante cualquier FAIL.
//
// Uso:
//   node scripts/verify/54-messages-parity.mjs
//   node scripts/verify/54-messages-parity.mjs --selftest

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// Namespaces que esta guardia mira.
export const REVIEWED = ['common', 'home', 'services', 'about', 'contact', 'stack', 'legal', 'search', 'notFound']

// Namespaces que ya deben existir con contenido en esta etapa del plan. Se amplia
// a los nueve cuando la tarea 2 los escribe.
export const REQUIRED = ['common', 'search', 'notFound']

// Claves cuyo nombre termina en Heading o Title pero cuyo valor es una oracion
// de copy existente movida tal cual desde search/page.tsx, no un encabezado.
// Se muestra dentro de un Alert, nunca en un h1 a h6, y reescribirla cambiaria
// copy aprobado. Cualquier otra clave Heading o Title sigue sujeta a la regla.
export const HEADING_RULE_EXEMPT = ['search.errorHeading']

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const PENDING_OPEN = '{'.repeat(2)
const PENDING_CLOSE = '}'.repeat(2)
// Marcador pendiente: llaves dobles con texto dentro y sin llaves anidadas. Un plural
// ICU puede terminar en el cierre doble (`... other {# x}}`), asi que no basta con
// buscar el cierre suelto.
const PENDING_MARKER = new RegExp(`${'\\{'.repeat(2)}[^{}]*${'\\}'.repeat(2)}`)

function flatten(obj, prefix = '') {
  const out = {}
  for (const [key, value] of Object.entries(obj ?? {})) {
    const route = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') Object.assign(out, flatten(value, route))
    else out[route] = value
  }
  return out
}

// Nombres de variable, incluidas las que viven dentro de ramas de plural o select.
function icuNames(text) {
  const names = new Set()
  for (const m of String(text).matchAll(/\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*[,}]/g)) names.add(m[1])
  return [...names].sort().join(',')
}

// Tipos de argumento compuestos (plural, select, selectordinal) en orden estable.
function icuKinds(text) {
  return [...String(text).matchAll(/\{\s*[A-Za-z_][A-Za-z0-9_]*\s*,\s*(plural|select|selectordinal)\s*,/g)]
    .map((m) => m[1])
    .sort()
    .join(',')
}

/**
 * Compara dos catalogos ya parseados. Devuelve la lista de motivos de fallo.
 * `namespaces` son los que se revisan; `required` los que no pueden faltar.
 */
export function check(es, en, namespaces = REVIEWED, required = REQUIRED, exempt = HEADING_RULE_EXEMPT) {
  const failures = []
  const fail = (reason) => failures.push(reason)

  for (const ns of namespaces) {
    const inEs = es?.[ns] && typeof es[ns] === 'object'
    const inEn = en?.[ns] && typeof en[ns] === 'object'
    if (!inEs && !inEn) {
      if (required.includes(ns)) fail(`falta el namespace ${ns} en es y en`)
      continue
    }
    if (!inEs) {
      fail(`falta el namespace ${ns} en es`)
      continue
    }
    if (!inEn) {
      fail(`falta el namespace ${ns} en en`)
      continue
    }

    const flat = { es: flatten(es[ns], ns), en: flatten(en[ns], ns) }
    const keys = { es: Object.keys(flat.es).sort(), en: Object.keys(flat.en).sort() }

    for (const key of keys.es) if (!(key in flat.en)) fail(`clave solo en es: ${key}`)
    for (const key of keys.en) if (!(key in flat.es)) fail(`clave solo en en: ${key}`)

    if (keys.es.length === 0) fail(`el namespace ${ns} esta vacio`)

    for (const locale of ['es', 'en']) {
      for (const [key, value] of Object.entries(flat[locale])) {
        if (typeof value !== 'string' || value.trim() === '') {
          fail(`${locale}: ${key} esta vacia o no es texto`)
          continue
        }
        if (value.includes(EM_DASH) || value.includes(EN_DASH)) fail(`${locale}: ${key} contiene guion largo o corto`)
        if (PENDING_MARKER.test(value)) {
          fail(`${locale}: ${key} contiene un marcador pendiente de llaves dobles`)
        }
        const last = key.split('.').pop()
        if (/(heading|title)$/i.test(last) && !exempt.includes(key) && /[.,]/.test(value)) {
          fail(`${locale}: ${key} es un encabezado y lleva punto o coma`)
        }
        if (icuKinds(value) && !/\bother\s*\{/.test(value)) fail(`${locale}: ${key} tiene un plural sin rama other`)
      }
    }

    for (const key of keys.es) {
      if (!(key in flat.en)) continue
      if (icuNames(flat.es[key]) !== icuNames(flat.en[key])) {
        fail(`variables ICU distintas en ${key}: es [${icuNames(flat.es[key])}] en [${icuNames(flat.en[key])}]`)
      }
      if (icuKinds(flat.es[key]) !== icuKinds(flat.en[key])) {
        fail(`forma ICU distinta en ${key}: es [${icuKinds(flat.es[key])}] en [${icuKinds(flat.en[key])}]`)
      }
    }
  }
  return failures
}

function selftest() {
  const base = () => ({
    common: { readMore: 'Leer mas', step: 'Paso {n}', opens: 'se abre' },
    search: {
      title: 'Buscar',
      resultCount: '{count, plural, one {# resultado} other {# resultados}}',
      noResultsHeading: 'Sin resultados para "{q}"',
    },
  })
  const baseEn = () => ({
    common: { readMore: 'Read more', step: 'Step {n}', opens: 'opens' },
    search: {
      title: 'Search',
      resultCount: '{count, plural, one {# result} other {# results}}',
      noResultsHeading: 'No results for "{q}"',
    },
  })
  const ns = ['common', 'search']
  const results = []
  const expect = (label, failures, wantFail, needle) => {
    const ok = wantFail ? failures.some((f) => (needle ? f.includes(needle) : true)) : failures.length === 0
    results.push({ label, ok, failures })
  }

  expect('fixture valido sin fallos', check(base(), baseEn(), ns, ns), false)

  const missing = baseEn()
  delete missing.common.opens
  expect('clave ausente en en', check(base(), missing, ns, ns), true, 'clave solo en es: common.opens')

  const icu = baseEn()
  icu.common.step = 'Step {count}'
  expect('variable ICU distinta', check(base(), icu, ns, ns), true, 'variables ICU distintas en common.step')

  const dash = baseEn()
  dash.common.readMore = `Read ${EM_DASH} more`
  expect('guion largo en un valor', check(base(), dash, ns, ns), true, 'guion largo o corto')

  const comma = base()
  comma.search.title = 'Buscar, ahora'
  const commaEn = baseEn()
  commaEn.search.title = 'Search now'
  expect('coma en una clave Title', check(comma, commaEn, ns, ns), true, 'search.title es un encabezado')

  const pending = baseEn()
  pending.common.readMore = `Read ${PENDING_OPEN}x${PENDING_CLOSE}`
  expect('marcador pendiente de llaves dobles', check(base(), pending, ns, ns), true, 'marcador pendiente')

  const exemptEs = base()
  exemptEs.search.errorHeading = 'Algo fallo. Intenta de nuevo.'
  const exemptEn = baseEn()
  exemptEn.search.errorHeading = 'Something failed. Try again.'
  expect('errorHeading exento de la regla de encabezado', check(exemptEs, exemptEn, ns, ns, ['search.errorHeading']), false)
  expect('errorHeading sin exencion falla', check(exemptEs, exemptEn, ns, ns, []), true, 'search.errorHeading')

  expect('namespace requerido ausente', check({ common: base().common }, { common: baseEn().common }, ns, ns), true, 'falta el namespace search')

  let bad = 0
  for (const r of results) {
    if (r.ok) console.log(`  ok   ${r.label}`)
    else {
      bad += 1
      console.log(`  FAIL ${r.label}: ${JSON.stringify(r.failures)}`)
    }
  }
  if (bad > 0) {
    console.log(`FAIL selftest: ${bad} caso(s) no se comportaron como se esperaba`)
    process.exit(1)
  }
  console.log('PASS selftest: el fixture valido da cero fallos y cada defecto da al menos uno')
}

function main() {
  const read = (locale) => JSON.parse(fs.readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8'))
  const failures = check(read('es'), read('en'))
  if (failures.length > 0) {
    for (const reason of failures) console.log(`FAIL ${reason}`)
    process.exit(1)
  }
  console.log(`PASS paridad es/en y reglas de voz en: ${REQUIRED.join(', ')}`)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  if (process.argv.includes('--selftest')) selftest()
  else main()
}
