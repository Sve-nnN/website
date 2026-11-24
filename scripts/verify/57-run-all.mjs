// Orquestador de la batería de verificación de la fase 57 (plan 57-08, GO-01, GO-03, T-57-29).
//
// Corre cada paso como proceso hijo, imprime PASS o FAIL por paso con su nombre, continúa tras
// un fallo, resume al final y sale con 1 si alguno falló. La regresión completa de 53 a 56 corre
// dentro (56-run-all.mjs es el último paso de cada modo).
//
// Modos:
//   --selftests  Autopruebas sin red: cada script 57-*, la comprobación estática de cabeceras
//                (57-headers-check --static) y 56-run-all --selftests.
//   --live       Batería contra BASE_URL (obligatoria, el preview) y PROD_BASE (por defecto
//                https://juan-tech.com), con EXPECT_PREVIEW heredado. Escribe en evidence/ los
//                JSON que lee 57-gate-report.mjs y el registro de pasos 57-final-steps.json.
//   --vs-snapshot <archivo>
//                Con --live y tras el corte: agrega 57-seo-parity-all --live-prod contra ese
//                snapshot (GO-03). Sin esta opción el paso no corre.
//   --no-wait    Con --live, no espera el despliegue en la regresión 56.
//   --strict     Un paso de la fase 57 cuyo script no existe cuenta como FAIL. Sin esta
//                bandera imprime SKIP con su nombre y no falla.
//   --selftest   Prueba la lógica de FAIL, SKIP y --strict con pasos y ejecutor simulados.
//   --verbose    Muestra la salida completa de cada paso.
//
// Seguridad: todo es HTTP de solo lectura contra el preview y producción, análisis estático y
// renderizado en memoria. Este orquestador no ejecuta ningún script que se conecte a una base
// ni envía correos.
//
// DNS: si esta máquina falla con ENOTFOUND dev.juan-tech.com por caché negativa de DNS, corre la
// batería con NODE_OPTIONS="--require <ruta del scratchpad de la sesión>/dnsfix.cjs". El archivo
// es temporal de la sesión y nunca entra al repo. El entorno se hereda a cada paso.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { EVIDENCE_DIR, FILES, limpia } from './57-gate-report.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const V = 'scripts/verify'
const LONG = 20 * 60_000
const EV = (name) => `${EVIDENCE_DIR}/${name}`

const node = (name, file, args = [], env = {}, timeoutMs) => ({ name, cmd: process.execPath, args: [`${V}/${file}`, ...args], env, ...(timeoutMs ? { timeoutMs } : {}) })

/** Un paso es de la fase 57 si su script se llama 57-*; solo esos pueden quedar en SKIP. */
export const isPhase57Step = (step) => /^57-/.test(basename(step.args?.[0] ?? ''))

/** ¿Existe el script del paso? Los pasos que no son de la 57 se dan por existentes. */
export function scriptExists(step, exists = existsSync) {
  if (!isPhase57Step(step)) return true
  return exists(join(ROOT, step.args[0]))
}

/** Pasos de --selftests: cada script 57-*, la estática de cabeceras y la regresión 56. */
export function selftestSteps() {
  return [
    node('57-run-all --selftest', '57-run-all.mjs', ['--selftest']),
    node('57-gate-report --selftest', '57-gate-report.mjs', ['--selftest']),
    node('57-unreachable-components --selftest', '57-unreachable-components.mjs', ['--selftest']),
    node('57-seo-parity-all --selftest', '57-seo-parity-all.mjs', ['--selftest']),
    node('57-legacy-render-sweep --selftest', '57-legacy-render-sweep.mjs', ['--selftest']),
    node('57-headers-check --selftest', '57-headers-check.mjs', ['--selftest']),
    node('57-headers-check --static', '57-headers-check.mjs', ['--static']),
    node('57-a11y-sweep --selftest', '57-a11y-sweep.mjs', ['--selftest'], {}, LONG),
    node('57-perf-compare --selftest', '57-perf-compare.mjs', ['--selftest'], {}, LONG),
    node('57-bundle-weight --selftest', '57-bundle-weight.mjs', ['--selftest']),
    node('57-new-routes --selftest', '57-new-routes.mjs', ['--selftest']),
    node('57-vps-disk-check --selftest', '57-vps-disk-check.mjs', ['--selftest']),
    node('57-dokploy-status --selftest', '57-dokploy-status.mjs', ['--selftest']),
    { ...node('56-run-all --selftests', '56-run-all.mjs', ['--selftests']), timeoutMs: 40 * 60_000 },
  ]
}

/** Pasos de --live. `vsSnapshot` agrega la comparación de producción contra el snapshot previo al corte. */
export function liveSteps({ base, prodBase, vsSnapshot = null, wait = false }) {
  const steps = [
    node('53-crawl-parity', '53-crawl-parity.mjs', [], { PREVIEW_BASE: base, PROD_BASE: prodBase }, LONG),
    node('57-seo-parity-all', '57-seo-parity-all.mjs', ['--out', EV(FILES.seo)], { PROD_BASE: prodBase }, 40 * 60_000),
    node('57-legacy-render-sweep', '57-legacy-render-sweep.mjs', ['--out', EV(FILES.legacy)], { PROD_BASE: prodBase }, LONG),
    node('57-headers-check', '57-headers-check.mjs', []),
    node('57-a11y-sweep', '57-a11y-sweep.mjs', ['--out', EV(FILES.a11y)], { PROD_BASE: prodBase }, 45 * 60_000),
    node('57-perf-compare', '57-perf-compare.mjs', ['--out', EV(FILES.perf)], { PREVIEW_BASE: base, PROD_BASE: prodBase }, 90 * 60_000),
    node('57-bundle-weight', '57-bundle-weight.mjs', ['--compare', EV(FILES.bundleBefore), '--out', EV(FILES.bundle)]),
    node('56-run-all --live', '56-run-all.mjs', ['--live', ...(wait ? [] : ['--no-wait'])], {}, 90 * 60_000),
  ]
  if (vsSnapshot) {
    // GO-03: solo tras el corte, cuando PROD_BASE ya sirve el sitio nuevo.
    steps.splice(steps.length - 1, 0, node('57-seo-parity-all --live-prod', '57-seo-parity-all.mjs', ['--live-prod', '--vs-snapshot', vsSnapshot], { PROD_BASE: prodBase }, 40 * 60_000))
  }
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
      out += `\nFAIL el paso excedió ${(step.timeoutMs ?? 10 * 60_000) / 1000}s y se detuvo\n`
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
 * Corre los pasos. `exists` y `run` se inyectan para probar FAIL, SKIP y --strict.
 * @returns {Promise<{code:number, results:object[]}>}
 */
export async function runAll(title, steps, { verbose = false, strict = false, exists = existsSync, run = runStep } = {}) {
  const results = []
  console.log(`# ${title}: ${steps.length} pasos${strict ? ' (--strict: un script ausente cuenta como FAIL)' : ''}`)
  for (const step of steps) {
    if (!scriptExists(step, exists)) {
      const file = step.args[0]
      if (strict) {
        results.push({ name: step.name, ok: false, skipped: true, code: null, ms: 0, failLines: [`el script ${file} no existe y --strict no admite SKIP`] })
        console.log(`FAIL ${step.name}: el script ${file} no existe y --strict no admite SKIP`)
      } else {
        results.push({ name: step.name, ok: true, skipped: true, code: null, ms: 0, failLines: [] })
        console.log(`SKIP ${step.name}: el script ${file} aún no existe`)
      }
      continue
    }
    const r = await run(step, process.env, verbose)
    const lines = r.out.split('\n')
    const pass = lines.filter((l) => /^PASS\b/.test(l)).length
    const failLines = lines.filter((l) => /^FAIL\b/.test(l))
    const warn = lines.filter((l) => /^WARN\b/.test(l)).length
    const ok = r.code === 0
    const tail = !ok && failLines.length === 0 ? lines.filter(Boolean).slice(-4) : []
    results.push({ name: step.name, ok, skipped: false, code: r.code, ms: r.ms, failLines: [...failLines.slice(0, 20), ...tail].map((l) => limpia(l).slice(0, 400)) })
    console.log(`${ok ? 'PASS' : 'FAIL'} ${step.name} (${pass} PASS, ${failLines.length} FAIL, ${warn} WARN líneas, salida ${r.code}, ${(r.ms / 1000).toFixed(1)}s)`)
    if (!verbose) {
      for (const l of [...failLines, ...lines.filter((x) => /^WARN\b/.test(x))].slice(0, 40)) console.log(`    ${l}`)
      for (const l of tail) console.log(`    ${l}`)
    }
  }
  const failed = results.filter((r) => !r.ok)
  const skipped = results.filter((r) => r.skipped && r.ok)
  const ran = results.filter((r) => !r.skipped)
  console.log('')
  console.log(`# Resumen ${title}: ${ran.filter((r) => r.ok).length} pasos PASS, ${failed.length} pasos FAIL, ${skipped.length} pasos SKIP`)
  for (const r of results) console.log(`${r.skipped ? (r.ok ? 'SKIP' : 'FAIL') : r.ok ? 'PASS' : 'FAIL'} ${r.name}`)
  console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'} 57-run-all ${title}`)
  return { code: failed.length === 0 ? 0 : 1, results }
}

/** Autoprueba: pasos y ejecutor simulados, sin procesos hijos. */
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
  const expect = (label, got, want) => {
    if (got === want) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}: salida ${got}, se esperaba ${want}`)
    }
  }
  const mk = (name, file) => ({ name, cmd: 'x', args: [`${V}/${file}`], env: {} })
  const present = mk('57-presente', '57-presente.mjs')
  const missing = mk('57-futuro', '57-futuro.mjs')
  const foreign = mk('53-viejo', '53-viejo.mjs')
  const exists = (p) => p.endsWith('57-presente.mjs')
  const okRun = async () => ({ code: 0, out: 'PASS x\n', ms: 1 })
  const failOnFirst = async (step) => (step.name === '57-primero' ? { code: 1, out: 'FAIL boom\n', ms: 1 } : { code: 0, out: 'PASS ok\n', ms: 1 })

  // Test 1: un paso que falla no detiene a los siguientes y el resumen sale 1.
  const seen = []
  const run1 = async (step, env, v) => {
    seen.push(step.name)
    return failOnFirst(step, env, v)
  }
  const first = { ...present, name: '57-primero' }
  const second = { ...present, name: '57-segundo' }
  const r1 = await quiet(() => runAll('t', [first, second], { exists, run: run1 }))
  expect('test 1: un paso que falla no detiene a los siguientes', seen.join(','), '57-primero,57-segundo')
  expect('test 1b: el resumen sale 1 si algún paso falla', r1.code, 1)
  expect('test 1c: todos los pasos PASS salen 0', (await quiet(() => runAll('t', [present, second], { exists, run: okRun }))).code, 0)

  // Test 2: script de la fase ausente, FAIL con --strict y SKIP sin ella.
  expect('test 2: script 57 ausente sin --strict es SKIP', (await quiet(() => runAll('t', [missing, present], { exists, run: okRun }))).code, 0)
  expect('test 2b: script 57 ausente con --strict es FAIL', (await quiet(() => runAll('t', [missing, present], { exists, run: okRun, strict: true }))).code, 1)
  expect('test 2c: un script que no es 57 nunca es SKIP', (await quiet(() => runAll('t', [foreign], { exists: () => false, run: async () => ({ code: 1, out: 'FAIL x\n', ms: 1 }) }))).code, 1)

  // Declaración de pasos y seguridad.
  const names = selftestSteps().map((s) => s.name)
  const want = ['57-gate-report --selftest', '57-headers-check --static', '57-seo-parity-all --selftest', '57-bundle-weight --selftest', '56-run-all --selftests']
  expect('selftestSteps declara los scripts de la fase y la regresión 56', want.filter((n) => !names.includes(n)).length, 0)
  const live = liveSteps({ base: 'https://b', prodBase: 'https://p' })
  const liveNames = live.map((s) => s.name)
  expect('liveSteps termina con la regresión 56 en vivo', liveNames[liveNames.length - 1], '56-run-all --live')
  expect('liveSteps sin snapshot no corre la comparación contra el snapshot', liveNames.includes('57-seo-parity-all --live-prod') ? 1 : 0, 0)
  const withSnap = liveSteps({ base: 'https://b', prodBase: 'https://p', vsSnapshot: 's.json' }).map((s) => s.name)
  expect('liveSteps con snapshot corre --live-prod antes de la regresión 56', withSnap.indexOf('57-seo-parity-all --live-prod') === withSnap.length - 2 ? 0 : 1, 0)
  const all = [...selftestSteps(), ...live].flatMap((s) => [s.cmd, ...s.args]).join(' ')
  expect('ningún paso toca scripts de base de datos', new RegExp(['scripts', 'db'].join('/') + '|' + ['--env', 'file'].join('-') + '|' + ['DATABASE', 'URI'].join('_')).test(all) ? 1 : 0, 0)
  console.log(bad === 0 ? 'PASS selftest 57-run-all: FAIL continuo, SKIP, --strict y pasos declarados' : `FAIL selftest 57-run-all (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const strict = args.includes('--strict')
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
  let code
  if (args.includes('--selftest')) {
    code = await selftest()
  } else if (args.includes('--selftests')) {
    code = (await runAll('--selftests', selftestSteps(), { verbose, strict })).code
  } else if (args.includes('--live')) {
    const base = process.env.BASE_URL?.replace(/\/$/, '')
    if (!base) {
      console.error('FAIL BASE_URL es obligatoria con --live')
      process.exit(1)
    }
    const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
    process.env.BASE_URL = base
    process.env.PROD_BASE = prodBase
    const { code: c, results } = await runAll('--live', liveSteps({ base, prodBase, vsSnapshot: opt('--vs-snapshot') ?? null, wait: !args.includes('--no-wait') }), { verbose, strict })
    code = c
    mkdirSync(join(ROOT, EVIDENCE_DIR), { recursive: true })
    writeFileSync(join(ROOT, EV(FILES.steps)), JSON.stringify({ generado: new Date().toISOString(), base, prodBase, strict, steps: results }, null, 2) + '\n')
    console.log(`Registro de pasos escrito en ${EV(FILES.steps)}`)
  } else {
    console.error('Uso: node scripts/verify/57-run-all.mjs --selftests | --live [--vs-snapshot <archivo>] [--no-wait] [--strict] [--verbose] | --selftest')
    code = 1
  }
  process.exit(code)
}
