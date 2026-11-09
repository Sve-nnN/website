// Orquestador de la bateria de verificacion de la fase 54 (plan 54-16).
//
// Ejecuta cada paso como proceso hijo, imprime PASS o FAIL por paso con su nombre,
// continua tras un fallo, resume al final y sale con 1 si alguno fallo.
//
// Modos:
//   --selftests  Autopruebas que no tocan el preview: los --selftest de los
//                verificadores 54 y 53, la paridad de mensajes, los verificadores
//                de la migracion y de render (tsx) y la auditoria estatica del sandbox.
//                Algunas pruebas de render descargan los docs publicos de produccion
//                (solo lectura).
//   --live       Bateria contra BASE_URL (obligatoria) y PROD_BASE (por defecto
//                https://juan-tech.com), con EXPECT_PREVIEW heredado, en este orden:
//                notfound --wait, layer-check, page-contract, notfound, dual-urls,
//                crawl-parity, search, stack-affiliate, contact-form (SIN enviar),
//                faq-ssr, about, shell-contract, computed-styles y write-gates.
//   --no-wait    Con --live, omite la espera del despliegue (primer paso).
//   --verbose    Muestra la salida completa de cada paso (por defecto solo las lineas
//                FAIL y WARN y un conteo).
//
// Seguridad: el formulario de Contacto se corre sin --submit; esta bateria nunca
// envia correos. El envio real con Resend se prueba una sola vez en la fase 57.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre la bateria con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// El entorno se hereda a cada paso. Ese archivo es temporal de la sesion y nunca
// entra al repo.

import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const V = 'scripts/verify'
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx')

const node = (name, file, args = [], env = {}) => ({ name, cmd: process.execPath, args: [`${V}/${file}`, ...args], env })
const tsx = (name, file) => ({ name, cmd: TSX, args: [`${V}/${file}`], env: {} })

/** Pasos de --selftests. */
export function selftestSteps() {
  return [
    node('54-notfound-status --selftest', '54-notfound-status.mjs', ['--selftest']),
    node('54-page-contract --selftest', '54-page-contract.mjs', ['--selftest']),
    node('54-search --selftest', '54-search.mjs', ['--selftest']),
    node('54-stack-affiliate --selftest', '54-stack-affiliate.mjs', ['--selftest']),
    node('54-contact-form --selftest', '54-contact-form.mjs', ['--selftest']),
    node('54-about --selftest', '54-about.mjs', ['--selftest']),
    node('54-dual-urls --selftest', '54-dual-urls.mjs', ['--selftest']),
    node('54-faq-ssr --selftest', '54-faq-ssr.mjs', ['--selftest']),
    node('53-shell-contract --selftest', '53-shell-contract.mjs', ['--selftest']),
    node('53-messages-parity', '53-messages-parity.mjs'),
    node('54-messages-parity --selftest', '54-messages-parity.mjs', ['--selftest']),
    node('54-messages-parity', '54-messages-parity.mjs'),
    node('54-migration-additive --selftest', '54-migration-additive.mjs', ['--selftest']),
    node('54-migration-additive', '54-migration-additive.mjs'),
    tsx('54-seed-selftest', '54-seed-selftest.ts'),
    tsx('54-primitives-ssr', '54-primitives-ssr.ts'),
    tsx('54-richtext-toc', '54-richtext-toc.ts'),
    tsx('54-conversion-ssr', '54-conversion-ssr.ts'),
    tsx('54-home-ssr', '54-home-ssr.ts'),
    tsx('54-home-b-ssr', '54-home-b-ssr.ts'),
    tsx('54-service-slots', '54-service-slots.ts'),
    tsx('54-service-ssr', '54-service-ssr.ts'),
    tsx('54-legal-ssr', '54-legal-ssr.ts'),
    tsx('54-search-ssr', '54-search-ssr.ts'),
    tsx('54-contact-ssr', '54-contact-ssr.ts'),
    tsx('54-stack-ssr', '54-stack-ssr.ts'),
    tsx('54-about-ssr', '54-about-ssr.ts'),
    tsx('54-index-ssr', '54-index-ssr.ts'),
    tsx('54-local-ssr', '54-local-ssr.ts'),
    node('54-no-sandbox-data --selftest', '54-no-sandbox-data.mjs', ['--selftest']),
    node('54-no-sandbox-data', '54-no-sandbox-data.mjs'),
  ]
}

/** Pasos de --live, en el orden fijado por RESEARCH. */
export function liveSteps({ base, prodBase, wait = true }) {
  const steps = []
  if (wait) steps.push({ ...node('54-notfound-status --wait', '54-notfound-status.mjs', ['--wait']), timeoutMs: 30 * 60_000 })
  steps.push(
    node('53-layer-check', '53-layer-check.mjs'),
    node('54-page-contract', '54-page-contract.mjs', [], { PROD_BASE: prodBase }),
    node('54-notfound-status', '54-notfound-status.mjs'),
    node('54-dual-urls', '54-dual-urls.mjs'),
    node('53-crawl-parity', '53-crawl-parity.mjs', [], { PREVIEW_BASE: base, PROD_BASE: prodBase }),
    node('54-search', '54-search.mjs'),
    node('54-stack-affiliate', '54-stack-affiliate.mjs'),
    // Sin --submit a proposito: nunca se envia el formulario desde la bateria.
    node('54-contact-form (sin enviar)', '54-contact-form.mjs'),
    node('54-faq-ssr', '54-faq-ssr.mjs'),
    node('54-about', '54-about.mjs', [], { PROD_BASE: prodBase }),
    node('53-shell-contract', '53-shell-contract.mjs'),
    node('53-computed-styles', '53-computed-styles.mjs', [], { REQUIRE_BUTTON: '1' }),
    node('53-write-gates', '53-write-gates.mjs'),
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

async function runAll(title, steps, verbose) {
  const results = []
  console.log(`# ${title}: ${steps.length} pasos`)
  for (const step of steps) {
    const r = await runStep(step, process.env, verbose)
    const lines = r.out.split('\n')
    const pass = lines.filter((l) => /^PASS\b/.test(l)).length
    const fail = lines.filter((l) => /^FAIL\b/.test(l)).length
    const warn = lines.filter((l) => /^WARN\b/.test(l)).length
    const ok = r.code === 0
    results.push({ name: step.name, ok, pass, fail, warn })
    console.log(`${ok ? 'PASS' : 'FAIL'} ${step.name} (${pass} PASS, ${fail} FAIL, ${warn} WARN lineas, salida ${r.code}, ${(r.ms / 1000).toFixed(1)}s)`)
    if (!verbose) {
      for (const l of lines.filter((x) => /^(FAIL|WARN)\b/.test(x)).slice(0, 40)) console.log(`    ${l}`)
      if (!ok && fail === 0) for (const l of lines.filter(Boolean).slice(-8)) console.log(`    ${l}`)
    }
  }
  const failed = results.filter((r) => !r.ok)
  console.log('')
  console.log(`# Resumen ${title}: ${results.length - failed.length} pasos PASS, ${failed.length} pasos FAIL`)
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}`)
  console.log(`${failed.length === 0 ? 'PASS' : 'FAIL'} 54-run-all ${title}`)
  return failed.length === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  let code
  if (args.includes('--selftests')) {
    code = await runAll('--selftests', selftestSteps(), verbose)
  } else if (args.includes('--live')) {
    const base = process.env.BASE_URL?.replace(/\/$/, '')
    if (!base) {
      console.error('FAIL BASE_URL es obligatoria con --live')
      process.exit(1)
    }
    const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
    process.env.BASE_URL = base
    process.env.PROD_BASE = prodBase
    code = await runAll('--live', liveSteps({ base, prodBase, wait: !args.includes('--no-wait') }), verbose)
  } else {
    console.error('Uso: node scripts/verify/54-run-all.mjs --selftests | --live [--no-wait] [--verbose]')
    code = 1
  }
  process.exit(code)
}
