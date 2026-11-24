// Auditoria estatica de compuertas del preview (fase 53, D-03, T-53-10).
//
// 1. Las seis rutas/acciones con escritura conocidas deben llamar
//    isPreviewReadonly() ANTES de la primera escritura (.create(, .update(,
//    .delete(, .sendEmail(); en subscribe-lead-magnet tambien antes de .find().
// 2. Cualquier punto de entrada bajo src/ (archivo con 'use server' o route.ts/tsx)
//    que escriba sin mencionar isPreviewReadonly falla (WR-07: antes solo miraba
//    tres carpetas, asi que una accion nueva en otro sitio pasaba sin revision).
// 3. Los puntos de entrada de Payload (API REST, GraphQL y pagina del admin) deben
//    llevar la guarda de runtime (WR-03): guardPreviewRoute o isPreviewReadonly.
// 4. Un punto de entrada que importe un modulo de WRITER_HELPERS (escritura
//    delegada a un helper) tambien debe mencionar isPreviewReadonly.
//
// Limites conocidos: es un analisis textual, no de flujo de control. Comprueba
// que la compuerta aparezca antes de la primera escritura, no que cubra todas las
// ramas. La revision humana sigue siendo necesaria cuando una compuerta vive dentro
// de un `if`.
//
// Imprime OK o FAIL archivo: motivo, y sale con 1 si hay algun FAIL.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const GATED = [
  'src/app/go/[slug]/route.ts',
  'src/app/actions/subscribe.tsx',
  'src/app/actions/subscribe-lead-magnet.tsx',
  'src/app/actions/contact.ts',
  'src/app/api/newsletter/confirm/route.ts',
  'src/app/api/newsletter/unsubscribe/route.ts',
]
const SCAN_DIR = 'src'
const WRITE_CALLS = [
  '.create(',
  '.update(',
  '.delete(',
  '.sendEmail(',
  '.updateGlobal(',
  '.duplicate(',
  '.restoreVersion(',
  '.login(',
  '.forgotPassword(',
  '.resetPassword(',
  '.jobs.queue(',
  '.db.',
]
// Modulos de src/ que escriben en nombre de quien los importa. Hoy no hay ninguno:
// `.update(` de src/lib/download-token.ts es un HMAC, no una escritura. Al crear un
// helper que escriba, agregarlo aqui para exigir la compuerta a sus llamadores.
const WRITER_HELPERS = []
// Puntos de entrada de Payload que no escriben con una llamada literal pero
// exponen escritura: deben llevar la guarda de runtime.
const PAYLOAD_ENTRYPOINTS = [
  'src/app/(payload)/api/[...slug]/route.ts',
  'src/app/(payload)/api/graphql/route.ts',
  'src/app/(payload)/api/graphql-playground/route.ts',
  'src/app/(payload)/admin/[[...segments]]/page.tsx',
]
const GATE_MARKERS = ['isPreviewReadonly', 'guardPreviewRoute']

const problems = []

// Quita comentarios para que una mencion en un docblock no cuente como llamada.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => line.replace(/(^|[^:'"`])\/\/.*$/, '$1'))
    .join('\n')
}

function firstIndex(code, needles) {
  const found = needles.map((n) => code.indexOf(n)).filter((i) => i !== -1)
  return found.length ? Math.min(...found) : -1
}

function read(rel) {
  return stripComments(fs.readFileSync(path.join(root, rel), 'utf8'))
}

function walk(dir) {
  const abs = path.join(root, dir)
  if (!fs.existsSync(abs)) return []
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(rel)
    return /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [rel] : []
  })
}

for (const rel of GATED) {
  if (!fs.existsSync(path.join(root, rel))) {
    problems.push(`FAIL ${rel}: el archivo no existe`)
    continue
  }
  const code = read(rel)
  const gate = code.indexOf('isPreviewReadonly()')
  if (gate === -1) {
    problems.push(`FAIL ${rel}: no llama isPreviewReadonly()`)
    continue
  }
  const write = firstIndex(code, WRITE_CALLS)
  if (write !== -1 && gate > write) {
    problems.push(`FAIL ${rel}: isPreviewReadonly() aparece despues de la primera escritura`)
  }
  if (rel.endsWith('subscribe-lead-magnet.tsx')) {
    const find = code.indexOf('.find(')
    if (find !== -1 && gate > find) {
      problems.push(`FAIL ${rel}: isPreviewReadonly() aparece despues de .find()`)
    }
  }
}

const hasGate = (code) => GATE_MARKERS.some((m) => code.includes(m))

for (const rel of walk(SCAN_DIR)) {
  const raw = fs.readFileSync(path.join(root, rel), 'utf8')
  const isEntry =
    /^\s*['"]use server['"]/m.test(raw) || /(^|[\\/])route\.(ts|tsx|js|mjs)$/.test(rel)
  if (!isEntry) continue
  const code = stripComments(raw)
  if (firstIndex(code, WRITE_CALLS) !== -1 && !hasGate(code)) {
    problems.push(`FAIL ${rel}: escribe sin compuerta isPreviewReadonly`)
  }
  for (const helper of WRITER_HELPERS) {
    const base = helper.replace(/^src\//, '').replace(/\.(ts|tsx|js|mjs)$/, '')
    if (code.includes(base) && !hasGate(code)) {
      problems.push(`FAIL ${rel}: importa ${helper} (escribe) sin compuerta isPreviewReadonly`)
    }
  }
}

for (const rel of PAYLOAD_ENTRYPOINTS) {
  if (!fs.existsSync(path.join(root, rel))) {
    problems.push(`FAIL ${rel}: el archivo no existe`)
    continue
  }
  if (!hasGate(read(rel))) {
    problems.push(`FAIL ${rel}: sin guarda de runtime del preview (guardPreviewRoute o isPreviewReadonly)`)
  }
}

if (problems.length) {
  console.log(problems.join('\n'))
  process.exit(1)
}
console.log('OK')
