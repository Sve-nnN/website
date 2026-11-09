// Orquestador de la bateria de verificacion de la fase 55 (plan 55-02, D-32, T-55-08).
//
// Ejecuta cada paso como proceso hijo, imprime PASS o FAIL por paso con su nombre,
// continua tras un fallo, resume al final y sale con 1 si alguno fallo.
//
// La bateria de la fase 54 corre completa como regresion: `selftestSteps` y `liveSteps`
// se importan de 54-run-all.mjs y los pasos 55 se agregan a su alrededor.
//
// Modos:
//   --selftests  Autopruebas que no tocan el preview, en este orden: los --selftest de
//                55-page-contract, 55-seo-parity, 55-post-contract, 55-content-parity,
//                55-tracer-live, 55-blog-search, 55-no-sandbox-data y 55-messages-parity;
//                55-migration-additive (con y sin --selftest); tsx sobre 55-cache-tags,
//                55-richtext-ssr, 55-richtext-blocks-ssr, 55-websites-ssr,
//                55-home-fallback-ssr, 55-cases-ssr, 55-blog-ssr, 55-post-ssr y
//                55-authors-ssr; despues las autopruebas de la 54 (incluida 54-rsc-boundary).
//                Algunas pruebas de render descargan los docs publicos de produccion
//                (solo lectura).
//   --live       Bateria contra BASE_URL (obligatoria) y PROD_BASE (por defecto
//                https://juan-tech.com), con EXPECT_PREVIEW heredado, en este orden:
//                54-notfound-status --wait, 53-layer-check, 55-page-contract con
//                --require-home-sections, 55-seo-parity, 55-tracer-live, 55-post-contract
//                con --preview-only, 55-content-parity, 55-blog-search, 53-crawl-parity,
//                53-write-gates y, como regresion, la bateria live de la 54 con --no-wait.
//   --no-wait    Con --live, omite la espera del despliegue (primer paso).
//   --strict     Un paso 55 cuyo script aun no existe cuenta como FAIL. Sin esta bandera
//                imprime SKIP con su nombre y no falla: asi cada plan de la fase agrega
//                su script sin romper la bateria. El ultimo plan de la fase la exige.
//   --selftest   Prueba la logica de SKIP y --strict con pasos y ejecutor simulados.
//   --verbose    Muestra la salida completa de cada paso (por defecto solo las lineas
//                FAIL y WARN y un conteo).
//
// Seguridad: la bateria nunca envia correos (el formulario de Contacto corre sin
// --submit) y nunca escribe en la base: todo es HTTP de solo lectura contra el preview y
// produccion, analisis estatico y renderizado de vistas en memoria.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre la bateria con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// El entorno se hereda a cada paso. Ese archivo es temporal de la sesion y nunca entra
// al repo.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { liveSteps as liveSteps54, selftestSteps as selftestSteps54 } from './54-run-all.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const V = 'scripts/verify'
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx')

const node = (name, file, args = [], env = {}) => ({ name, cmd: process.execPath, args: [`${V}/${file}`, ...args], env })
const tsx = (name, file) => ({ name, cmd: TSX, args: [`${V}/${file}`], env: {} })
const LONG = 20 * 60_000

/** Un paso es de la fase 55 si su script se llama 55-*; solo esos pueden quedar en SKIP. */
export const isPhase55Step = (step) => /^55-/.test(basename(step.args?.[0] ?? ''))

/** ¿Existe el script del paso? Los pasos que no son de la 55 se dan por existentes. */
export function scriptExists(step, exists = existsSync) {
  if (!isPhase55Step(step)) return true
  return exists(join(ROOT, step.args[0]))
}

/** Pasos de --selftests: los 55 y despues la regresion completa de la 54. */
export function selftestSteps() {
  return [
    node('55-run-all --selftest', '55-run-all.mjs', ['--selftest']),
    node('55-page-contract --selftest', '55-page-contract.mjs', ['--selftest']),
    node('55-seo-parity --selftest', '55-seo-parity.mjs', ['--selftest']),
    node('55-post-contract --selftest', '55-post-contract.mjs', ['--selftest']),
    node('55-content-parity --selftest', '55-content-parity.mjs', ['--selftest']),
    node('55-tracer-live --selftest', '55-tracer-live.mjs', ['--selftest']),
    node('55-blog-search --selftest', '55-blog-search.mjs', ['--selftest']),
    node('55-no-sandbox-data --selftest', '55-no-sandbox-data.mjs', ['--selftest']),
    node('55-no-sandbox-data', '55-no-sandbox-data.mjs'),
    node('55-messages-parity --selftest', '55-messages-parity.mjs', ['--selftest']),
    node('55-messages-parity', '55-messages-parity.mjs'),
    node('55-migration-additive --selftest', '55-migration-additive.mjs', ['--selftest']),
    node('55-migration-additive', '55-migration-additive.mjs'),
    tsx('55-cache-tags', '55-cache-tags.ts'),
    tsx('55-richtext-ssr', '55-richtext-ssr.ts'),
    tsx('55-richtext-blocks-ssr', '55-richtext-blocks-ssr.ts'),
    tsx('55-websites-ssr', '55-websites-ssr.ts'),
    tsx('55-home-fallback-ssr', '55-home-fallback-ssr.ts'),
    tsx('55-cases-ssr', '55-cases-ssr.ts'),
    tsx('55-blog-ssr', '55-blog-ssr.ts'),
    tsx('55-post-ssr', '55-post-ssr.ts'),
    tsx('55-authors-ssr', '55-authors-ssr.ts'),
    ...selftestSteps54(),
  ]
}

/** Pasos de --live: primero los 55 y al final la regresion live de la 54 sin esperar de nuevo. */
export function liveSteps({ base, prodBase, wait = true }) {
  const steps = []
  if (wait) steps.push({ ...node('54-notfound-status --wait', '54-notfound-status.mjs', ['--wait']), timeoutMs: 30 * 60_000 })
  steps.push(
    node('53-layer-check', '53-layer-check.mjs'),
    { ...node('55-page-contract --require-home-sections', '55-page-contract.mjs', ['--require-home-sections'], { PROD_BASE: prodBase }), timeoutMs: LONG },
    { ...node('55-seo-parity', '55-seo-parity.mjs', [], { PROD_BASE: prodBase }), timeoutMs: LONG },
    node('55-tracer-live', '55-tracer-live.mjs', [], { PROD_BASE: prodBase }),
    { ...node('55-post-contract --preview-only', '55-post-contract.mjs', ['--preview-only'], { PROD_BASE: prodBase }), timeoutMs: LONG },
    { ...node('55-content-parity', '55-content-parity.mjs', [], { PROD_BASE: prodBase }), timeoutMs: LONG },
    node('55-blog-search', '55-blog-search.mjs', [], { PROD_BASE: prodBase }),
    node('53-crawl-parity', '53-crawl-parity.mjs', [], { PREVIEW_BASE: base, PROD_BASE: prodBase }),
    node('53-write-gates', '53-write-gates.mjs'),
    // Regresion: toda la bateria live de la 54, sin repetir la espera del despliegue.
    ...liveSteps54({ base, prodBase, wait: false }).map((s) => ({ ...s, name: `54 regresion: ${s.name}` })),
  )
  return steps
}

function runStep(step, env, verbose) {
  return new Promise((done) => {
    const started = Date.now()
    const child = spawn(step.cmd, step.args, { cwd: ROOT, env: { ...env, ...step.env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => {
      out += d
      if (verbose) process.stdout.write(d)
    })
    child.stderr.on('data', (d) => {
      out += d
      if (verbose) process.stderr.write(d)
    })
    const timer = setTimeout(() => {
      out += `\nFAIL el paso excedio ${(step.timeoutMs ?? 10 * 60_000) / 1000}s y se detuvo\n`
      child.kill('SIGKILL')
    }, step.timeoutMs ?? 10 * 60_000)
    child.on('error', (err) => {
      clearTimeout(timer)
      done({ code: 1, out: `${out}\nFAIL no se pudo ejecutar: ${err.message}\n`, ms: Date.now() - started })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      done({ code: code ?? 1, out, ms: Date.now() - started })
    })
  })
}

/**
 * Corre los pasos. `exists` y `run` se inyectan para probar la logica de SKIP y --strict.
 * @returns {Promise<number>} codigo de salida
 */
export async function runAll(title, steps, { verbose = false, strict = false, exists = existsSync, run = runStep } = {}) {
  const results = []
  console.log(`# ${title}: ${steps.length} pasos${strict ? ' (--strict: un script ausente cuenta como FAIL)' : ''}`)
  for (const step of steps) {
    if (!scriptExists(step, exists)) {
      const file = step.args[0]
      if (strict) {
        results.push({ name: step.name, ok: false, skipped: true })
        console.log(`FAIL ${step.name}: el script ${file} no existe y --strict no admite SKIP`)
      } else {
        results.push({ name: step.name, ok: true, skipped: true })
        console.log(`SKIP ${step.name}: el script ${file} aun no existe (lo agrega un plan posterior de la fase)`)
      }
      continue
    }
    const r = await run(step, process.env, verbose)
    const lines = r.out.split('\n')
    const pass = lines.filter((l) => /^PASS\b/.test(l)).length
    const fail = lines.filter((l) => /^FAIL\b/.test(l)).length
    const warn = lines.filter((l) => /^WARN\b/.test(l)).length
    const ok = r.code === 0
    results.push({ name: step.name, ok, skipped: false })
    console.log(`${ok ? 'PASS' : 'FAIL'} ${step.name} (${pass} PASS, ${fail} FAIL, ${warn} WARN lineas, salida ${r.code}, ${(r.ms / 1000).toFixed(1)}s)`)
    if (!verbose) {
      for (const l of lines.filter((x) => /^(FAIL|WARN)\b/.test(x)).slice(0, 40)) console.log(`    ${l}`)
      if (!ok && fail === 0) for (const l of lines.filter(Boolean).slice(-8)) console.log(`    ${l}`)
    }
  }
  const failed = results.filter((r) => !r.ok)
  const skipped = results.filter((r) => r.skipped && r.ok)
  const ran = results.filter((r) => !r.skipped)
  console.log('')
  console.log(
    `# Resumen ${title}: ${ran.length - ran.filter((r) => !r.ok).length} pasos PASS, ${failed.length} pasos FAIL, ${skipped.length} pasos SKIP`,
  )
  for (const r of results) console.log(`${r.skipped ? (r.ok ? 'SKIP' : 'FAIL') : r.ok ? 'PASS' : 'FAIL'} ${r.name}`)
  console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'} 55-run-all ${title}`)
  return failed.length === 0 ? 0 : 1
}

/** Autoprueba de la logica de SKIP y --strict: pasos simulados, sin procesos hijos. */
async function selftest() {
  let bad = 0
  const quiet = async (fn) => {
    const log = console.log
    console.log = () => {}
    try {
      return await fn()
    } finally {
      console.log = log
    }
  }
  const okRun = async () => ({ code: 0, out: 'PASS x\n', ms: 1 })
  const failRun = async () => ({ code: 1, out: 'FAIL x\n', ms: 1 })
  const missing = { name: '55-futuro', cmd: 'x', args: [`${V}/55-futuro.mjs`], env: {} }
  const present = { name: '55-presente', cmd: 'x', args: [`${V}/55-presente.mjs`], env: {} }
  const old = { name: '54-viejo', cmd: 'x', args: [`${V}/54-viejo.mjs`], env: {} }
  const exists = (p) => p.endsWith('55-presente.mjs')
  const expect = (label, got, want) => {
    if (got === want) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}: salida ${got}, se esperaba ${want}`)
    }
  }
  expect('script 55 ausente sin --strict es SKIP y no falla', await quiet(() => runAll('t', [missing, present], { exists, run: okRun })), 0)
  expect('script 55 ausente con --strict falla', await quiet(() => runAll('t', [missing, present], { exists, run: okRun, strict: true })), 1)
  expect('un paso presente que falla da FAIL', await quiet(() => runAll('t', [present], { exists, run: failRun })), 1)
  expect('un paso presente que pasa da PASS con --strict', await quiet(() => runAll('t', [present], { exists, run: okRun, strict: true })), 0)
  expect('un script que no es 55 nunca es SKIP', await quiet(() => runAll('t', [old], { exists: () => false, run: failRun })), 1)
  const names = selftestSteps().map((st) => st.name)
  const hasAll = ['55-seo-parity --selftest', '55-blog-search --selftest', '54-rsc-boundary', '54-page-contract --selftest'].every((n) => names.includes(n))
  expect('selftestSteps incluye los pasos 55 y la regresion 54', hasAll ? 0 : 1, 0)
  const live = liveSteps({ base: 'https://b', prodBase: 'https://p' }).map((st) => st.name)
  const order = ['54-notfound-status --wait', '53-layer-check', '55-page-contract --require-home-sections', '55-seo-parity', '55-tracer-live', '55-post-contract --preview-only', '55-content-parity', '55-blog-search', '53-crawl-parity', '53-write-gates']
  expect('liveSteps respeta el orden fijado y termina con la regresion 54', order.every((n, i) => live[i] === n) && live.slice(order.length).every((n) => n.startsWith('54 regresion: ')) ? 0 : 1, 0)
  console.log(bad === 0 ? 'PASS selftest 55-run-all: SKIP, --strict y orden de pasos se comportan como se esperaba' : `FAIL selftest 55-run-all (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const strict = args.includes('--strict')
  let code
  if (args.includes('--selftest')) {
    code = await selftest()
  } else if (args.includes('--selftests')) {
    code = await runAll('--selftests', selftestSteps(), { verbose, strict })
  } else if (args.includes('--live')) {
    const base = process.env.BASE_URL?.replace(/\/$/, '')
    if (!base) {
      console.error('FAIL BASE_URL es obligatoria con --live')
      process.exit(1)
    }
    const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
    process.env.BASE_URL = base
    process.env.PROD_BASE = prodBase
    code = await runAll('--live', liveSteps({ base, prodBase, wait: !args.includes('--no-wait') }), { verbose, strict })
  } else {
    console.error('Uso: node scripts/verify/55-run-all.mjs --selftests | --live [--no-wait] [--strict] [--verbose]')
    code = 1
  }
  process.exit(code)
}
