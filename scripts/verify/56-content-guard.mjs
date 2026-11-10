// Guardia estatica de datos y de scripts de la fase 56 (plan 56-01, D-01, D-04, T-56-01, T-56-02).
//
// Sin red y sin base: solo lee archivos del repo.
//
// Modo --data: recorre scripts/db/data/56-*.ts y 56-*.json. Falla ante raya larga, raya
//   media o apertura de marcador de ranura.
// Modo --messages: recorre messages/*.json y falla ante raya larga o media (no mira el
//   marcador: los plurales ICU llevan llaves anidadas). Va aparte para que el plan que
//   limpia messages pueda correr --data antes de terminar.
// Modo --scripts: recorre scripts/db/2*-phase56-*.ts y exige, por cada uno:
//   1. que importe y llame assertSafeTarget;
//   2. que declare las banderas --apply y --db-checked si escribe (uno de solo lectura no las necesita);
//   3. que no cargue .env por bandera ni con dotenv;
//   4. que no use operaciones de borrado (Local API ni SQL);
//   5. que todo update de coleccion lleve draft: false;
//   6. que no imprima DATABASE_URI (solo safeTarget).
// Sin banderas corre --data y --scripts. --selftest prueba la guardia con fixtures en memoria.
// Sin archivos que revisar sale 0 e imprime cuantos reviso.
//
// Las rayas y la apertura de marcador se arman por codigo para que este archivo no las contenga.
//
// Uso:
//   node scripts/verify/56-content-guard.mjs [--data] [--scripts] [--messages] [--selftest]

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const PENDING_OPEN = '{' + '{'

// ------------------------------------------------------------------ datos

/**
 * Fallos de un archivo de datos. `markers` en falso omite la busqueda del marcador de
 * ranura (messages/*.json lleva llaves anidadas de plurales ICU).
 */
export function checkData(text, name, { markers = true } = {}) {
  const failures = []
  if (text.includes(EM_DASH)) failures.push(`${name}: contiene raya larga`)
  if (text.includes(EN_DASH)) failures.push(`${name}: contiene raya media`)
  if (markers && text.includes(PENDING_OPEN)) failures.push(`${name}: contiene apertura de marcador de ranura`)
  return failures
}

// ---------------------------------------------------------------- scripts

/** Quita comentarios de bloque y de linea (sin tocar `://` de las URL). */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1')
}

/** Texto de la llamada que empieza en `openIndex` (el parentesis de apertura), balanceado. */
function callBody(src, openIndex) {
  let depth = 0
  for (let i = openIndex; i < src.length; i++) {
    if (src[i] === '(') depth += 1
    else if (src[i] === ')') {
      depth -= 1
      if (depth === 0) return src.slice(openIndex, i + 1)
    }
  }
  return src.slice(openIndex)
}

function calls(src, re) {
  const out = []
  for (const m of src.matchAll(re)) out.push(callBody(src, m.index + m[0].length - 1))
  return out
}

/** Fallos de un script scripts/db/2N-phase56-*.ts. */
export function checkScript(rawSource, name) {
  const failures = []
  const src = stripComments(rawSource)
  const fail = (why) => failures.push(`${name}: ${why}`)

  if (!/import\s[^;]*\bassertSafeTarget\b[^;]*\sfrom\s/.test(src)) fail('no importa assertSafeTarget')
  else if (!/\bassertSafeTarget\s*\(/.test(src)) fail('importa assertSafeTarget pero no lo llama')

  // Las banderas se exigen a todo script que escribe; uno de solo lectura (por ejemplo el
  // verificador de esquema) no las necesita, pero sigue exigiendo assertSafeTarget.
  const writes = /\bpayload\s*\.\s*(create|update|updateGlobal|duplicate)\s*\(/.test(src) || /\bfindOrCreateMedia\s*\(/.test(src)
  if (writes && !src.includes('--apply')) fail('escribe y no declara la bandera --apply (dry-run por defecto)')
  if (writes && !src.includes('--db-checked')) fail('escribe y no declara la bandera --db-checked')

  if (/--env-file/.test(src) || /from\s+['"]dotenv/.test(src) || /require\(\s*['"]dotenv/.test(src) || /\bloadEnvConfig\b/.test(src)) {
    fail('carga .env por bandera o con dotenv (el hook lo bloquea; DATABASE_URI viene del shell)')
  }

  if (/\bpayload\s*\.\s*delete\s*\(/.test(src) || /\.\s*db\s*\.\s*delete\w*\s*\(/.test(src) || /\bdeleteVersions\s*\(/.test(src) || /\bdelete(One|Many)\s*\(/.test(src)) {
    fail('usa una operacion de borrado de la Local API')
  }
  if (/\b(DELETE\s+FROM|DROP\s+(TABLE|COLUMN)|TRUNCATE)\b/i.test(src)) fail('contiene SQL destructivo')

  for (const body of calls(src, /\bpayload\s*\.\s*update\s*\(/g)) {
    if (/\bcollection\s*:/.test(body) && !/\bdraft\s*:\s*false\b/.test(body)) {
      fail('un update de coleccion no lleva draft: false (despublica el documento)')
    }
  }

  for (const body of calls(src, /\bconsole\s*\.\s*(log|info|warn|error|debug)\s*\(/g)) {
    if (/DATABASE_URI/.test(body) && !/\bsafeTarget\s*\(/.test(body)) fail('imprime DATABASE_URI (solo se imprime safeTarget)')
  }
  return failures
}

// ------------------------------------------------------------ archivos

function listFiles(dir, re) {
  try {
    return readdirSync(dir)
      .filter((f) => re.test(f))
      .sort()
      .map((f) => join(dir, f))
  } catch {
    return []
  }
}

export function dataFiles(root = ROOT) {
  return {
    strict: [...listFiles(join(root, 'scripts', 'db', 'data'), /^56-.+\.(ts|json)$/)],
    messages: listFiles(join(root, 'messages'), /\.json$/),
  }
}

export function scriptFiles(root = ROOT) {
  return listFiles(join(root, 'scripts', 'db'), /^2\d?-phase56-.+\.ts$/)
}

function rel(p) {
  return p.startsWith(ROOT) ? p.slice(ROOT.length + 1) : p
}

function runData() {
  const { strict } = dataFiles()
  const failures = []
  for (const f of strict) failures.push(...checkData(readFileSync(f, 'utf8'), rel(f)))
  for (const l of failures) console.log(`FAIL ${l}`)
  console.log(`${failures.length === 0 ? 'PASS' : 'FAIL'} 56-content-guard --data: ${strict.length} archivo(s) de datos 56 revisados`)
  return failures.length === 0 ? 0 : 1
}

function runMessages() {
  const { messages } = dataFiles()
  const failures = []
  for (const f of messages) failures.push(...checkData(readFileSync(f, 'utf8'), rel(f), { markers: false }))
  for (const l of failures) console.log(`FAIL ${l}`)
  console.log(`${failures.length === 0 ? 'PASS' : 'FAIL'} 56-content-guard --messages: ${messages.length} archivo(s) de messages revisados`)
  return failures.length === 0 ? 0 : 1
}

function runScripts() {
  const files = scriptFiles()
  const failures = []
  for (const f of files) failures.push(...checkScript(readFileSync(f, 'utf8'), rel(f)))
  for (const l of failures) console.log(`FAIL ${l}`)
  console.log(`${failures.length === 0 ? 'PASS' : 'FAIL'} 56-content-guard --scripts: ${files.length} script(s) de la fase revisados`)
  return failures.length === 0 ? 0 : 1
}

// ------------------------------------------------------------- autoprueba

const GOOD_SCRIPT = `
import { assertSafeTarget, safeTarget } from './data/54-seed-lib'
const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')
async function main() {
  console.log('base: ' + safeTarget(process.env.DATABASE_URI))
  assertSafeTarget(process.env.DATABASE_URI, APPLY, DB_CHECKED)
  // nunca se usa --env-file=.env aqui
  await payload.update({ collection: 'pages', id: 1, data: {}, draft: false })
  await payload.updateGlobal({ slug: 'legal-pages', data: {} })
}
`

export function selftest() {
  let bad = 0
  const results = []
  const expectClean = (label, failures) => results.push({ label, ok: failures.length === 0, failures })
  const expectBad = (label, failures, needle) => results.push({ label, ok: failures.some((f) => f.includes(needle)), failures })

  expectClean('script bueno sin fallos', checkScript(GOOD_SCRIPT, 'bueno.ts'))
  expectBad('script sin assertSafeTarget', checkScript(GOOD_SCRIPT.replace(/assertSafeTarget/g, 'assertAlgo'), 'a.ts'), 'no importa assertSafeTarget')
  expectBad('script sin --db-checked', checkScript(GOOD_SCRIPT.replace("'--db-checked'", "'--listo'"), 'b.ts'), '--db-checked')
  expectBad('script sin --apply', checkScript(GOOD_SCRIPT.replace("'--apply'", "'--escribir'"), 'c.ts'), '--apply')
  expectBad('script que carga .env por bandera', checkScript(`${GOOD_SCRIPT}\nconst a = '--env-file=.env'`, 'd.ts'), 'carga .env')
  expectBad('script con dotenv', checkScript(`import 'dotenv/config'\nimport dotenv from 'dotenv'\n${GOOD_SCRIPT}`, 'd2.ts'), 'carga .env')
  expectBad('script que borra con la Local API', checkScript(`${GOOD_SCRIPT}\nawait payload.delete({ collection: 'pages', id: 1 })`, 'e.ts'), 'borrado')
  expectBad('script con SQL destructivo', checkScript(`${GOOD_SCRIPT}\nconst q = 'DROP COLUMN x'`, 'e2.ts'), 'SQL destructivo')
  expectBad('update de coleccion sin draft false', checkScript(GOOD_SCRIPT.replace(', draft: false', ''), 'f.ts'), 'draft: false')
  expectBad('script que imprime DATABASE_URI', checkScript(`${GOOD_SCRIPT}\nconsole.log(process.env.DATABASE_URI)`, 'g.ts'), 'imprime DATABASE_URI')
  expectBad('DATABASE_URI en plantilla de texto', checkScript(`${GOOD_SCRIPT}\nconsole.error(\`uri \${process.env.DATABASE_URI}\`)`, 'g2.ts'), 'imprime DATABASE_URI')
  expectClean('script de solo lectura no necesita --apply', checkScript(`import { assertSafeTarget, safeTarget } from './data/54-seed-lib'\nassertSafeTarget(process.env.DATABASE_URI, false, false)\nawait payload.find({ collection: 'pages' })`, 'ro.ts'))
  expectBad('script de solo lectura sin assertSafeTarget', checkScript(`await payload.find({ collection: 'pages' })`, 'ro2.ts'), 'no importa assertSafeTarget')
  expectClean('comentario con --env-file no cuenta', checkScript(`${GOOD_SCRIPT}\n// uso: node --env-file=.env x`, 'h.ts'))
  expectClean('updateGlobal no exige draft false', checkScript(GOOD_SCRIPT, 'i.ts'))

  expectClean('datos limpios', checkData('{"a":"texto normal con {date}"}', 'ok.json'))
  expectBad('datos con raya larga', checkData(`texto ${EM_DASH} otro`, 'x.ts'), 'raya larga')
  expectBad('datos con raya media', checkData(`texto ${EN_DASH} otro`, 'x.ts'), 'raya media')
  expectBad('datos con marcador de ranura', checkData(`texto ${PENDING_OPEN}pendiente}} otro`, 'x.ts'), 'marcador de ranura')
  expectClean('messages con plural ICU anidado no es marcador', checkData('{"n":"{count, plural, one {# a} other {# b}}"}', 'm.json', { markers: false }))
  expectBad('messages con raya larga', checkData(`{"a":"x${EM_DASH}y"}`, 'm.json', { markers: false }), 'raya larga')

  for (const r of results) {
    if (r.ok) console.log(`PASS selftest ${r.label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${r.label}: ${JSON.stringify(r.failures)}`)
    }
  }
  console.log(bad === 0 ? 'PASS selftest 56-content-guard: fixtures buenos aceptados y malos rechazados' : `FAIL selftest 56-content-guard (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  let code = 0
  if (args.includes('--selftest')) code = selftest()
  else {
    const none = !args.includes('--data') && !args.includes('--scripts') && !args.includes('--messages')
    if (none || args.includes('--data')) code = Math.max(code, runData())
    if (none || args.includes('--scripts')) code = Math.max(code, runScripts())
    if (args.includes('--messages')) code = Math.max(code, runMessages())
  }
  process.exit(code)
}
