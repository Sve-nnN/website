// Orquestador de la bateria de verificacion de la fase 56 (plan 56-01, D-01, T-56-01).
//
// Ejecuta cada paso como proceso hijo, imprime PASS o FAIL por paso con su nombre,
// continua tras un fallo, resume al final y sale con 1 si alguno fallo.
//
// La bateria de la fase 55 corre completa como regresion (ella a su vez importa la de la
// 54): `selftestSteps` y `liveSteps` se importan de 55-run-all.mjs.
//
// Todos los pasos de la fase se declaran desde este plan, por nombre de script. Un paso
// cuyo script aun no existe imprime SKIP con su nombre y no falla: cada plan posterior
// agrega su script sin tocar este archivo. El ultimo plan (56-14) corre con --strict.
//
// Modos:
//   --selftests  Autopruebas que no tocan el preview: guardia de datos y de scripts, gate
//                de decisiones, autopruebas de datos, de render y de los verificadores
//                vivos de la fase, migracion aditiva y verificador de esquema (--selftest);
//                despues la regresion completa de la 55 (y por ella la de la 54).
//   --live       Bateria contra BASE_URL (obligatoria) y PROD_BASE (por defecto
//                https://juan-tech.com), con EXPECT_PREVIEW heredado, en este orden:
//                54-notfound-status --wait, 56-no-marker-live, 56-cta-live, 56-legal-live,
//                55-seo-parity de home y legales en es y en (paridad de title y meta
//                description, D-23), 56-cases-lessons-live sin --expect-loaded y la
//                regresion viva de la 55.
//   --no-wait    Con --live, omite la espera del despliegue (primer paso).
//   --strict     Un paso de la fase 56 cuyo script aun no existe cuenta como FAIL. Sin esta
//                bandera imprime SKIP con su nombre y no falla.
//   --selftest   Prueba la logica de SKIP y --strict con pasos y ejecutor simulados.
//   --verbose    Muestra la salida completa de cada paso (por defecto solo las lineas
//                FAIL y WARN y un conteo).
//
// Seguridad: la bateria nunca escribe en la base ni envia correos: todo es HTTP de solo
// lectura contra el preview y produccion, analisis estatico y renderizado en memoria.
// Los scripts de escritura (26 a 28) NO se corren desde aqui: los corre Juan por turnos.
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

import { liveSteps as liveSteps55, selftestSteps as selftestSteps55 } from './55-run-all.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const V = 'scripts/verify'
const D = 'scripts/db'
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx')
const LONG = 20 * 60_000

const node = (name, file, args = [], env = {}) => ({ name, cmd: process.execPath, args: [`${V}/${file}`, ...args], env })
const tsx = (name, file, args = []) => ({ name, cmd: TSX, args: [`${V}/${file}`, ...args], env: {} })
const tsxDb = (name, file, args = []) => ({ name, cmd: TSX, args: [`${D}/${file}`, ...args], env: {} })

/** Un paso es de la fase 56 si su script se llama 56-* o 2N-phase56-*; solo esos pueden quedar en SKIP. */
export const isPhase56Step = (step) => /^(56-|2\d-phase56-)/.test(basename(step.args?.[0] ?? ''))

/** ¿Existe el script del paso? Los pasos que no son de la 56 se dan por existentes. */
export function scriptExists(step, exists = existsSync) {
  if (!isPhase56Step(step)) return true
  return exists(join(ROOT, step.args[0]))
}

/** Pasos de --selftests: los 56 y despues la regresion completa de la 55 (que incluye la 54). */
export function selftestSteps() {
  return [
    node('56-run-all --selftest', '56-run-all.mjs', ['--selftest']),
    node('56-content-guard --selftest', '56-content-guard.mjs', ['--selftest']),
    node('56-content-guard', '56-content-guard.mjs'),
    node('56-content-guard --messages', '56-content-guard.mjs', ['--messages']),
    tsx('56-gate --selftest', '56-gate.ts', ['--selftest']),
    tsx('56-gate', '56-gate.ts'),
    tsx('56-seed-selftest', '56-seed-selftest.ts'),
    tsx('56-review-export --selftest', '56-review-export.ts', ['--selftest']),
    node('56-inputs-check --selftest', '56-inputs-check.mjs', ['--selftest']),
    node('56-inputs-check', '56-inputs-check.mjs'),
    node('56-migration-additive --selftest', '56-migration-additive.mjs', ['--selftest']),
    node('56-migration-additive', '56-migration-additive.mjs'),
    tsxDb('25-phase56-verify-schema --selftest', '25-phase56-verify-schema.ts', ['--selftest']),
    tsx('56-legal-copy-selftest', '56-legal-copy-selftest.ts'),
    tsx('56-legal-ssr', '56-legal-ssr.ts'),
    tsx('56-home-copy-selftest', '56-home-copy-selftest.ts'),
    tsx('56-lessons-selftest', '56-lessons-selftest.ts'),
    tsx('56-alts-selftest', '56-alts-selftest.ts'),
    tsx('56-shadow-seed-selftest', '56-shadow-seed-selftest.ts'),
    tsx('56-cutover-selftest', '56-cutover-selftest.ts'),
    node('56-cta-live --selftest', '56-cta-live.mjs', ['--selftest']),
    node('56-legal-live --selftest', '56-legal-live.mjs', ['--selftest']),
    node('56-no-marker-live --selftest', '56-no-marker-live.mjs', ['--selftest']),
    node('56-cases-lessons-live --selftest', '56-cases-lessons-live.mjs', ['--selftest']),
    ...selftestSteps55().map((s) => ({ ...s, name: `55 regresion: ${s.name}` })),
  ]
}

/** Rutas de home y legales en es y en cuya paridad de title y meta se compara con produccion (D-23). */
export const SEO_PARITY_PATHS = ['/', '/en', '/privacy', '/en/privacy', '/terms', '/en/terms']

/** Pasos de --live: primero los 56 y al final la regresion viva de la 55 sin esperar de nuevo. */
export function liveSteps({ base, prodBase, wait = true }) {
  const steps = []
  if (wait) steps.push({ ...node('54-notfound-status --wait', '54-notfound-status.mjs', ['--wait']), timeoutMs: 30 * 60_000 })
  steps.push(
    node('56-no-marker-live', '56-no-marker-live.mjs', [], { PROD_BASE: prodBase }),
    node('56-cta-live', '56-cta-live.mjs', [], { PROD_BASE: prodBase }),
    node('56-legal-live', '56-legal-live.mjs', [], { PROD_BASE: prodBase }),
    // D-23: title y meta description de home y legales identicos a produccion.
    { ...node('55-seo-parity (home y legales)', '55-seo-parity.mjs', ['--paths', SEO_PARITY_PATHS.join(',')], { PROD_BASE: prodBase }), timeoutMs: LONG },
    // Sin --expect-loaded: el cargador del corte aun no corrio, asi que no se exige que las lecciones esten cargadas.
    node('56-cases-lessons-live', '56-cases-lessons-live.mjs', [], { PROD_BASE: prodBase }),
    // Regresion: toda la bateria viva de la 55 (y por ella la de la 54), sin repetir la espera.
    ...liveSteps55({ base, prodBase, wait: false }).map((s) => ({ ...s, name: `55 regresion: ${s.name}` })),
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
  console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'} 56-run-all ${title}`)
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
  const missing = { name: '56-futuro', cmd: 'x', args: [`${V}/56-futuro.mjs`], env: {} }
  const missingDb = { name: '2N-phase56-futuro', cmd: 'x', args: [`${D}/29-phase56-futuro.ts`], env: {} }
  const present = { name: '56-presente', cmd: 'x', args: [`${V}/56-presente.mjs`], env: {} }
  const old = { name: '55-viejo', cmd: 'x', args: [`${V}/55-viejo.mjs`], env: {} }
  const exists = (p) => p.endsWith('56-presente.mjs')
  const expect = (label, got, want) => {
    if (got === want) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}: salida ${got}, se esperaba ${want}`)
    }
  }
  expect('script 56 ausente sin --strict es SKIP y no falla', await quiet(() => runAll('t', [missing, present], { exists, run: okRun })), 0)
  expect('script 2N-phase56 ausente sin --strict es SKIP', await quiet(() => runAll('t', [missingDb], { exists, run: okRun })), 0)
  expect('script 56 ausente con --strict falla', await quiet(() => runAll('t', [missing, present], { exists, run: okRun, strict: true })), 1)
  expect('script 2N-phase56 ausente con --strict falla', await quiet(() => runAll('t', [missingDb], { exists, run: okRun, strict: true })), 1)
  expect('un paso presente que falla da FAIL', await quiet(() => runAll('t', [present], { exists, run: failRun })), 1)
  expect('un paso presente que pasa da PASS con --strict', await quiet(() => runAll('t', [present], { exists, run: okRun, strict: true })), 0)
  expect('un script que no es 56 nunca es SKIP', await quiet(() => runAll('t', [old], { exists: () => false, run: failRun })), 1)

  const names = selftestSteps().map((st) => st.name)
  const declared = [
    '56-content-guard --selftest', '56-gate --selftest', '56-seed-selftest', '56-review-export --selftest',
    '56-inputs-check --selftest', '56-migration-additive --selftest', '56-migration-additive',
    '25-phase56-verify-schema --selftest', '56-legal-copy-selftest', '56-legal-ssr', '56-home-copy-selftest',
    '56-lessons-selftest', '56-alts-selftest', '56-shadow-seed-selftest', '56-cutover-selftest',
    '56-cta-live --selftest', '56-legal-live --selftest', '56-no-marker-live --selftest', '56-cases-lessons-live --selftest',
    '55 regresion: 55-run-all --selftest', '55 regresion: 54-rsc-boundary',
  ]
  const missingNames = declared.filter((n) => !names.includes(n))
  expect(`selftestSteps declara todos los pasos de la fase y la regresion 55 (faltan: ${missingNames.join(', ') || 'ninguno'})`, missingNames.length, 0)

  const live = liveSteps({ base: 'https://b', prodBase: 'https://p' })
  const liveNames = live.map((st) => st.name)
  const order = ['54-notfound-status --wait', '56-no-marker-live', '56-cta-live', '56-legal-live', '55-seo-parity (home y legales)', '56-cases-lessons-live']
  expect(
    'liveSteps respeta el orden fijado y termina con la regresion 55',
    order.every((n, i) => liveNames[i] === n) && liveNames.slice(order.length).every((n) => n.startsWith('55 regresion: ')) ? 0 : 1,
    0,
  )
  const noWait = liveSteps({ base: 'https://b', prodBase: 'https://p', wait: false }).map((st) => st.name)
  expect('--no-wait omite 54-notfound-status --wait de la parte 56', noWait[0] === '56-no-marker-live' ? 0 : 1, 0)
  const seo = live.find((st) => st.name.startsWith('55-seo-parity'))
  expect('la paridad SEO cubre home y legales en es y en', SEO_PARITY_PATHS.length === 6 && seo?.args.includes(SEO_PARITY_PATHS.join(',')) ? 0 : 1, 0)
  const lessons = live.find((st) => st.name === '56-cases-lessons-live')
  expect('56-cases-lessons-live corre sin --expect-loaded', lessons && !lessons.args.includes('--expect-loaded') ? 0 : 1, 0)
  console.log(bad === 0 ? 'PASS selftest 56-run-all: SKIP, --strict, pasos declarados y orden se comportan como se esperaba' : `FAIL selftest 56-run-all (${bad})`)
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
    console.error('Uso: node scripts/verify/56-run-all.mjs --selftests | --live [--no-wait] [--strict] [--verbose]')
    code = 1
  }
  process.exit(code)
}
