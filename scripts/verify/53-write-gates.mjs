// Auditoria estatica de compuertas del preview (fase 53, D-03, T-53-10).
//
// 1. Las seis rutas/acciones con escritura conocidas deben llamar
//    isPreviewReadonly() ANTES de la primera escritura (.create(, .update(,
//    .delete(, .sendEmail(); en subscribe-lead-magnet tambien antes de .find().
// 2. Cualquier archivo nuevo bajo src/app/go, src/app/actions o
//    src/app/api/newsletter que escriba sin mencionar isPreviewReadonly falla.
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
const SCAN_DIRS = ['src/app/go', 'src/app/actions', 'src/app/api/newsletter']
const WRITE_CALLS = ['.create(', '.update(', '.delete(', '.sendEmail(']

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

for (const dir of SCAN_DIRS) {
  for (const rel of walk(dir)) {
    const code = read(rel)
    if (firstIndex(code, WRITE_CALLS) !== -1 && !code.includes('isPreviewReadonly')) {
      problems.push(`FAIL ${rel}: escribe sin compuerta isPreviewReadonly`)
    }
  }
}

if (problems.length) {
  console.log(problems.join('\n'))
  process.exit(1)
}
console.log('OK')
