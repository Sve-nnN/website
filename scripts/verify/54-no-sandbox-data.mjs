// Auditoria estatica de datos y rutas del sandbox en src (fase 54, plan 54-16,
// PAG-01, criterio 1 de ROADMAP: ningun dato hardcodeado del sandbox llega al codigo).
//
// Recorre src/ (sin node_modules, .next ni archivos generados) y exige:
//   1. Ninguna importacion (from, import(), require()) que apunte al directorio
//      designs ni al directorio de datos del sandbox (@/data/... o una ruta relativa
//      que pase por designs).
//   2. Ninguna cadena de ruta /logos/ ni /img/ del sandbox que no exista como archivo
//      bajo public/ del repo (la cadena debe empezar justo despues de una comilla, un
//      acento grave o un parentesis, para no confundirla con una URL absoluta).
//   3. La secuencia de llaves dobles de los marcadores pendientes (dos llaves, una
//      palabra y dos llaves de cierre) ausente en todo src: los marcadores viven solo
//      en datos de Payload y en scripts/db/data. Las llaves dobles de JSX con
//      objetos no coinciden: las de style llevan dos puntos y las de atajo como
//      value={{ config }} van precedidas de un signo igual.
//
// Sin red ni base de datos. Imprime PASS o FAIL motivo y sale con 1 ante cualquier FAIL.
//
// Modos:
//   --selftest  Evalua auditSource sobre un fixture valido (cero fallos) y sobre
//               defectuosos (importacion de designs, de @/data, ruta /img/ sin archivo,
//               marcador pendiente); sale 0 solo si se comporta asi.
//   (sin modo)  Audita src/.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(ROOT, 'src')
const PUBLIC = join(ROOT, 'public')

const SKIP_DIRS = new Set(['node_modules', '.next', 'migrations'])
const SKIP_FILES = new Set(['payload-types.ts', 'importMap.js', 'importMap.ts'])
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|json)$/

const IMPORT_RE = /(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"]([^'"\n]+)['"]/gm
const ASSET_RE = /['"`(](\/(?:img|logos)\/[^\s'"`)?#]+)/g
const MARKER_RE = /(?<!=)\{\{\s*[A-Za-zÀ-ÿ_ -]{2,}\s*\}\}/g

/** Fallos de un archivo: lista de { kind, detail }. `assetExists` se inyecta para la autoprueba. */
export function auditSource(source, assetExists = (p) => existsSync(join(PUBLIC, p))) {
  const failures = []
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1]
    if (/(^|\/)designs(\/|$)/.test(spec)) failures.push({ kind: 'import-designs', detail: spec })
    else if (/^@\/data(\/|$)/.test(spec)) failures.push({ kind: 'import-data', detail: spec })
  }
  for (const m of source.matchAll(ASSET_RE)) {
    if (!assetExists(m[1])) failures.push({ kind: 'asset', detail: m[1] })
  }
  for (const m of source.matchAll(MARKER_RE)) failures.push({ kind: 'marker', detail: m[0] })
  return failures
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

const KIND_TEXT = {
  'import-designs': 'importa del directorio designs',
  'import-data': 'importa del directorio de datos del sandbox',
  asset: 'ruta de activo del sandbox sin archivo bajo public/',
  marker: 'marcador pendiente en codigo',
}

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
  const exists = (p) => p === '/logos/real.svg'

  none(
    'fixture valido',
    auditSource(
      "import { x } from '@/lib/x'\nconst a = <Box sx={{ margin: 0 }} />\nconst s = '/logos/real.svg'\nconst u = 'https://juan-tech.com/img/ajeno.png'\n",
      exists,
    ),
  )
  some('importacion de designs', auditSource("import d from '../../../designs/redesign-v5/data'", exists), 'import-designs')
  some('importacion dinamica de designs', auditSource("const d = await import('@/../designs/x')", exists), 'import-designs')
  some('importacion de @/data', auditSource("import { logos } from '@/data/logos'", exists), 'import-data')
  some('ruta /img/ sin archivo', auditSource("const s = '/img/foto.jpg'", exists), 'asset')
  some('ruta /logos/ sin archivo en plantilla', auditSource('const s = `/logos/otro.svg`', exists), 'asset')
  some('marcador pendiente', auditSource("const t = '{{pendiente}}'", exists), 'marker')
  none('atajo de objeto en JSX', auditSource('<Ctx.Provider value={{ config }}>', exists))
  none('llaves dobles de JSX con objeto', auditSource('<div style={{ margin: 0, color: "red" }} />', exists))

  console.log(bad === 0 ? 'PASS selftest 54-no-sandbox-data: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 54-no-sandbox-data (${bad})`)
  return bad === 0 ? 0 : 1
}

function audit() {
  let files = 0
  const failures = []
  for (const file of walk(SRC)) {
    files += 1
    for (const f of auditSource(readFileSync(file, 'utf8'))) {
      failures.push(`${relative(ROOT, file)}: ${KIND_TEXT[f.kind]} (${f.detail})`)
    }
  }
  if (failures.length === 0) {
    console.log(`PASS ${files} archivos de src sin importaciones del sandbox, sin rutas de activos inexistentes y sin marcadores pendientes`)
    return 0
  }
  for (const f of failures) console.log(`FAIL ${f}`)
  console.log(`FAIL 54-no-sandbox-data: ${failures.length} hallazgo(s) en ${files} archivos`)
  return 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(process.argv.includes('--selftest') ? selftest() : audit())
