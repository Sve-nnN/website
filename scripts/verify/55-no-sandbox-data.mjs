// Auditoria estatica de datos del sandbox en src, extendida para la fase 55 (plan 55-02,
// PAG-03, D-02, Pitfall 8).
//
// 1. Aplica `auditSource` de 54-no-sandbox-data.mjs a todo src/: ninguna importacion de
//    designs ni de un directorio de datos del sandbox, ninguna ruta /img/ o /logos/ sin
//    archivo bajo public/ y ningun marcador pendiente de llaves dobles.
// 2. Si existen designs/design-system-mui/src/data/case-lessons.ts y cases.ts, lee de
//    ellos EN TIEMPO DE EJECUCION los titulos de leccion y los slugs de caso y falla si
//    alguno aparece como literal de cadena en src. Las lecciones del sandbox son un
//    borrador (D-02): no se copian a src, ni siquiera a pruebas. Los textos se leen para
//    comparar y nunca se escriben en este archivo. Si el directorio del sandbox no existe
//    en esta maquina (no esta versionado), imprime SKIP del chequeo adicional y no falla.
//
// Sin red ni base de datos. Imprime PASS o FAIL motivo y sale con 1 ante cualquier FAIL.
//
// Modos:
//   --selftest  Fixture valido (cero fallos) y defectuosos (titulo de leccion como literal,
//               slug de caso como literal, importacion de designs); sale 0 solo si se
//               comporta asi.
//   (sin modo)  Audita src/.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { auditSource } from './54-no-sandbox-data.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(ROOT, 'src')
const SANDBOX_DATA = join(ROOT, 'designs', 'design-system-mui', 'src', 'data')

const SKIP_DIRS = new Set(['node_modules', '.next', 'migrations'])
const SKIP_FILES = new Set(['payload-types.ts', 'importMap.js', 'importMap.ts'])
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|json)$/

const KIND_TEXT = {
  'import-designs': 'importa del directorio designs',
  'import-data': 'importa del directorio de datos del sandbox',
  asset: 'ruta de activo del sandbox sin archivo bajo public/',
  marker: 'marcador pendiente en codigo',
  'lesson-title': 'titulo de leccion del sandbox como literal',
  'case-slug': 'slug de caso del sandbox como literal',
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) yield* walk(full)
    else if (EXT.test(name) && !SKIP_FILES.has(name)) yield full
  }
}

/** Titulos de leccion y slugs de caso a partir del texto de los dos archivos del sandbox. */
export function extractForbidden(lessonsSource, casesSource) {
  const titles = new Set()
  for (const m of lessonsSource.matchAll(/\btitle:\s*(['"`])((?:\\.|(?!\1).)+)\1/g)) titles.add(m[2].replace(/\\(['"`])/g, '$1'))
  const slugs = new Set()
  for (const m of casesSource.matchAll(/["']?\bslug["']?:\s*["']([a-z0-9][a-z0-9-]*)["']/g)) slugs.add(m[1])
  for (const m of lessonsSource.matchAll(/^\s*['"]([a-z0-9][a-z0-9-]*)['"]\s*:\s*\[/gm)) slugs.add(m[1])
  return { titles: [...titles], slugs: [...slugs] }
}

/** Escapa un texto para usarlo dentro de una expresion regular. */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Fallos del chequeo adicional sobre un archivo: titulos y slugs prohibidos como literal
 * de cadena (entre comillas o acentos graves, o como parte de un literal mas largo).
 * @returns {{ kind: string, detail: string }[]}
 */
export function auditForbidden(source, { titles = [], slugs = [] }) {
  const failures = []
  for (const t of titles) {
    if (t.length < 12) continue
    if (new RegExp(`['"\`][^'"\`\\n]*${esc(t)}[^'"\`\\n]*['"\`]`).test(source)) failures.push({ kind: 'lesson-title', detail: t.slice(0, 60) })
  }
  for (const s of slugs) {
    if (new RegExp(`['"\`]${esc(s)}['"\`]`).test(source)) failures.push({ kind: 'case-slug', detail: s })
  }
  return failures
}

function loadForbidden() {
  const lessons = join(SANDBOX_DATA, 'case-lessons.ts')
  const cases = join(SANDBOX_DATA, 'cases.ts')
  if (!existsSync(lessons) || !existsSync(cases)) return null
  return extractForbidden(readFileSync(lessons, 'utf8'), readFileSync(cases, 'utf8'))
}

// ------------------------------------------------------------------- selftest

function selftest() {
  let bad = 0
  const none = (name, f) => {
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const some = (name, f, kind) => {
    if (f.some((x) => x.kind === kind)) console.log(`PASS selftest ${name}: detecta ${kind}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: no detecto ${kind} (${JSON.stringify(f)})`)
    }
  }
  // Datos inventados: la autoprueba tampoco contiene texto del sandbox.
  const forbidden = {
    titles: ['Una leccion inventada para la autoprueba'],
    slugs: ['caso-inventado-para-la-autoprueba'],
  }
  const both = (src) => [...auditSource(src, () => true), ...auditForbidden(src, forbidden)]

  none('fixture valido', both("import { x } from '@/lib/x'\nconst a = 'otro texto'\nconst s = 'caso-inventado-para-la-autoprueba-mas-largo'\n"))
  some('titulo de leccion como literal', both("const t = 'Una leccion inventada para la autoprueba'"), 'lesson-title')
  some('titulo de leccion dentro de un literal mas largo', both('const t = `Titulo: Una leccion inventada para la autoprueba.`'), 'lesson-title')
  some('slug de caso como literal', both("const slug = 'caso-inventado-para-la-autoprueba'"), 'case-slug')
  some('slug de caso entre comillas dobles', both('const slug = "caso-inventado-para-la-autoprueba"'), 'case-slug')
  some('importacion de designs', both("import d from '../../designs/redesign-v5/data'"), 'import-designs')
  some('importacion de @/data', both("import { l } from '@/data/case-lessons'"), 'import-data')
  none('el slug dentro de una ruta mas larga no es un literal exacto', both("const href = '/case-studies/caso-inventado-para-la-autoprueba'"))

  const ex = extractForbidden(
    "export const lessons = {\n  'caso-uno-de-prueba': [\n    { title: 'Titulo de leccion de prueba uno', body: 'x' },\n    { title: \"Otro titulo de prueba\", body: 'y' },\n  ],\n}\n",
    'export const cases = [\n{\n  "slug": "caso-uno-de-prueba",\n  "title": "No es leccion"\n}\n]\n',
  )
  const exOk =
    ex.titles.length === 2 &&
    ex.titles.includes('Titulo de leccion de prueba uno') &&
    ex.titles.includes('Otro titulo de prueba') &&
    ex.slugs.length === 1 &&
    ex.slugs[0] === 'caso-uno-de-prueba'
  if (exOk) console.log('PASS selftest extractForbidden: lee titulos de leccion y slugs de caso, no los titulos de caso')
  else {
    bad += 1
    console.log(`FAIL selftest extractForbidden: ${JSON.stringify(ex)}`)
  }

  console.log(bad === 0 ? 'PASS selftest 55-no-sandbox-data: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 55-no-sandbox-data (${bad})`)
  return bad === 0 ? 0 : 1
}

// --------------------------------------------------------------------- auditoria

function audit() {
  const forbidden = loadForbidden()
  let files = 0
  const failures = []
  for (const file of walk(SRC)) {
    files += 1
    const source = readFileSync(file, 'utf8')
    const found = [...auditSource(source), ...(forbidden ? auditForbidden(source, forbidden) : [])]
    for (const f of found) failures.push(`${relative(ROOT, file)}: ${KIND_TEXT[f.kind]} (${f.detail})`)
  }
  if (forbidden) {
    console.log(`PASS lectura del sandbox: ${forbidden.titles.length} titulos de leccion y ${forbidden.slugs.length} slugs de caso para comparar`)
  } else {
    console.log('SKIP el directorio del sandbox (designs/design-system-mui/src/data) no existe en esta maquina: se omite el chequeo de titulos y slugs')
  }
  if (failures.length === 0) {
    console.log(`PASS ${files} archivos de src sin importaciones del sandbox, sin rutas de activos inexistentes, sin marcadores pendientes${forbidden ? ' y sin titulos de leccion ni slugs de caso como literales' : ''}`)
    return 0
  }
  for (const f of failures) console.log(`FAIL ${f}`)
  console.log(`FAIL 55-no-sandbox-data: ${failures.length} hallazgo(s) en ${files} archivos`)
  return 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(process.argv.includes('--selftest') ? selftest() : audit())
