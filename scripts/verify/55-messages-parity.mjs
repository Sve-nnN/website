// Paridad es/en de los namespaces de interfaz de la fase 55 (plan 55-02, D-28).
//
// Importa `check`, `REVIEWED` y `REQUIRED` de 54-messages-parity.mjs, conserva los
// namespaces de la fase 54 y agrega los seis de esta fase: cases, websites, blog, post,
// authors y richText. Las reglas son las de 54 (paridad de claves, valores no vacios,
// variables ICU y forma de plural iguales, sin guiones largos ni cortos, sin llaves
// dobles de marcadores, claves Heading o Title sin punto ni coma).
//
// Cada plan de la fase agrega su namespace, asi que por defecto solo se exigen los que
// aparecen en alguno de los dos archivos (un namespace presente solo en un idioma falla);
// con --final el ultimo plan exige los seis.
//
// Modos:
//   --selftest  Fixture valido y defectuosos; sale 0 solo si se comporta asi.
//   --final     Exige los seis namespaces de la fase 55 (ademas de los de la 54).
//   (sin modo)  Revisa messages/es.json contra messages/en.json.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { HEADING_RULE_EXEMPT, REQUIRED, REVIEWED, check } from './54-messages-parity.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Namespaces que agrega la fase 55. */
export const PHASE_55 = ['cases', 'websites', 'blog', 'post', 'authors', 'richText']

const EM_DASH = String.fromCharCode(0x2014)

/**
 * Fallos de dos catalogos ya parseados.
 * @param {{ final?: boolean }} opts con `final` los seis namespaces de la fase son obligatorios
 */
export function run(es, en, { final = false } = {}) {
  const namespaces = [...REVIEWED, ...PHASE_55]
  const required = final ? [...REQUIRED, ...PHASE_55] : REQUIRED
  return check(es, en, namespaces, required, HEADING_RULE_EXEMPT)
}

// ------------------------------------------------------------------- selftest

function selftest() {
  const base = () => ({
    common: { readMore: 'Leer mas', step: 'Paso {n}' },
    blog: { searchLabel: 'Buscar articulos', resultCount: '{count, plural, one {# resultado} other {# resultados}}', indexHeading: 'Todos los articulos' },
    authors: { rolesTitle: 'Experiencia' },
  })
  const baseEn = () => ({
    common: { readMore: 'Read more', step: 'Step {n}' },
    blog: { searchLabel: 'Search articles', resultCount: '{count, plural, one {# result} other {# results}}', indexHeading: 'All articles' },
    authors: { rolesTitle: 'Experience' },
  })
  const results = []
  const expect = (label, failures, wantFail, needle) => {
    const ok = wantFail ? failures.some((f) => (needle ? f.includes(needle) : true)) : failures.length === 0
    results.push({ label, ok, failures })
  }
  const opts = {}
  // Con solo algunos namespaces presentes, run() ignora los demas de la 54 salvo que sean requeridos:
  // el fixture los incluye para aislar las reglas de la 55.
  const full = (m) => ({ ...Object.fromEntries(REQUIRED.filter((n) => n !== 'common').map((n) => [n, { x: 'y' }])), ...m })

  expect('fixture valido sin fallos', run(full(base()), full(baseEn()), opts), false)

  const missing = baseEn()
  delete missing.blog.searchLabel
  expect('clave ausente en en', run(full(base()), full(missing), opts), true, 'clave solo en es: blog.searchLabel')

  const icu = baseEn()
  icu.common.step = 'Step {count}'
  expect('variable ICU distinta', run(full(base()), full(icu), opts), true, 'variables ICU distintas')

  const dash = baseEn()
  dash.authors.rolesTitle = `Work ${EM_DASH} roles`
  expect('guion largo en un valor', run(full(base()), full(dash), opts), true, 'guion largo o corto')

  const comma = base()
  comma.blog.indexHeading = 'Todos, ahora'
  expect('coma en una clave Heading', run(full(comma), full(baseEn()), opts), true, 'blog.indexHeading')

  const onlyEs = base()
  const noAuthorsEn = baseEn()
  delete noAuthorsEn.authors
  expect('namespace solo en es', run(full(onlyEs), full(noAuthorsEn), opts), true, 'falta el namespace authors en en')

  const withoutNew = { ...base() }
  delete withoutNew.authors
  const withoutNewEn = { ...baseEn() }
  delete withoutNewEn.authors
  expect('namespaces de la 55 ausentes sin --final no fallan', run(full(withoutNew), full(withoutNewEn), opts), false)
  expect('namespaces de la 55 ausentes con --final fallan', run(full(withoutNew), full(withoutNewEn), { final: true }), true, 'falta el namespace cases')

  const pending = baseEn()
  pending.common.readMore = `Read ${'{'.repeat(2)}x${'}'.repeat(2)}`
  expect('marcador pendiente de llaves dobles', run(full(base()), full(pending), opts), true, 'marcador pendiente')

  let bad = 0
  for (const r of results) {
    if (r.ok) console.log(`  ok   ${r.label}`)
    else {
      bad += 1
      console.log(`  FAIL ${r.label}: ${JSON.stringify(r.failures)}`)
    }
  }
  if (bad > 0) {
    console.log(`FAIL selftest 55-messages-parity: ${bad} caso(s) no se comportaron como se esperaba`)
    return 1
  }
  console.log('PASS selftest 55-messages-parity: el fixture valido da cero fallos y cada defecto da al menos uno')
  return 0
}

// ------------------------------------------------------------------------ main

function main(final) {
  const read = (locale) => JSON.parse(fs.readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8'))
  const es = read('es')
  const en = read('en')
  const failures = run(es, en, { final })
  if (failures.length > 0) {
    for (const reason of failures) console.log(`FAIL ${reason}`)
    console.log('FAIL 55-messages-parity')
    return 1
  }
  const present = PHASE_55.filter((n) => es[n] && en[n])
  const waiting = PHASE_55.filter((n) => !present.includes(n))
  console.log(
    `PASS paridad es/en y reglas de voz en los namespaces de la 54 y en los de la 55 presentes (${present.join(', ') || 'ninguno'})${final ? ' con --final' : `; pendientes de otros planes: ${waiting.join(', ') || 'ninguno'}`}`,
  )
  return 0
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(process.argv.includes('--selftest') ? selftest() : main(process.argv.includes('--final')))
