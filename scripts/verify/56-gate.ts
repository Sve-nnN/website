/**
 * Gate de decisiones de contenido de la fase 56 (plan 56-01, D-22).
 *
 * Descubre por si solo todos los modulos scripts/db/data/56-*.ts (salvo el registro
 * de tipos), junta su export DECISIONS, valida la forma y evalua el gate.
 * No toca ninguna base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/56-gate.ts            tabla de decisiones
 *   node_modules/.bin/tsx scripts/verify/56-gate.ts --gate     sale 1 si algo impide el corte (fase 57)
 *   node_modules/.bin/tsx scripts/verify/56-gate.ts --json     resultado en JSON
 *   node_modules/.bin/tsx scripts/verify/56-gate.ts --selftest
 *
 * Sin modulos todavia es valido y sale 0.
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  gateFailures,
  validateDecisions,
  type Decision,
  type GateReport,
} from '../db/data/56-content-decisions'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA_DIR = join(ROOT, 'scripts', 'db', 'data')
const REGISTRY_FILE = '56-content-decisions.ts'

export type DiscoveredModule = { file: string; decisions: Decision[] }

export type Discovery = {
  modules: DiscoveredModule[]
  decisions: Decision[]
  /** Fallos de descubrimiento y de forma (modulo sin DECISIONS, id duplicado, estado invalido). */
  problems: string[]
}

/** Nombres de los modulos de datos de la fase 56 (sin el registro de tipos). */
export function listDataModules(dataDir: string = DATA_DIR): string[] {
  return readdirSync(dataDir)
    .filter((f) => /^56-.+\.ts$/.test(f) && f !== REGISTRY_FILE)
    .sort()
}

/** Junta el export DECISIONS de cada modulo y valida el conjunto. */
export async function discoverDecisions(dataDir: string = DATA_DIR): Promise<Discovery> {
  const modules: DiscoveredModule[] = []
  const problems: string[] = []
  for (const file of listDataModules(dataDir)) {
    let mod: Record<string, unknown>
    try {
      mod = (await import(pathToFileURL(join(dataDir, file)).href)) as Record<string, unknown>
    } catch (err) {
      problems.push(`${file}: no se pudo importar (${(err as Error).message})`)
      continue
    }
    const decisions = mod.DECISIONS
    if (!Array.isArray(decisions)) {
      problems.push(`${file}: no exporta DECISIONS como arreglo (convencion de la fase 56)`)
      continue
    }
    modules.push({ file, decisions: decisions as Decision[] })
  }
  const decisions = modules.flatMap((m) => m.decisions)
  problems.push(...validateDecisions(decisions))
  return { modules, decisions, problems }
}

export type GateResult = GateReport & { total: number }

/** Forma (problemas de descubrimiento) mas gate del corte. */
export function evaluate(decisions: readonly Decision[], shapeProblems: readonly string[] = []): GateResult {
  const gate = gateFailures(decisions, 'corte')
  return { total: decisions.length, problems: [...shapeProblems, ...gate.problems], warnings: gate.warnings }
}

function table(decisions: readonly Decision[]): string {
  if (decisions.length === 0) return '(sin decisiones registradas todavia)'
  const rows = decisions.map((d) => [d.id, d.status, d.gate, d.chosen ?? '-'])
  const head = ['id', 'estado', 'gate', 'elegida']
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const line = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i])).join('  ')
  return [line(head), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n')
}

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

function selftest(): number {
  let bad = 0
  const expect = (label: string, ok: boolean, detail = '') => {
    if (ok) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}${detail ? `: ${detail}` : ''}`)
    }
  }
  const base = (over: Partial<Decision>): Decision => ({
    id: 'D-22a',
    label: 'Titulo del hero',
    status: 'aprobado',
    gate: 'aprobado',
    ...over,
  })

  const clean = [
    base({ id: 'D-22a', chosen: 'A', options: { A: { es: 'uno' } } }),
    base({ id: 'MSG-x', status: 'propuesto', gate: 'propuesto' }),
  ]
  const r1 = evaluate(clean, validateDecisions(clean))
  expect('fixture limpio no tiene problemas y avisa de la propuesta', r1.problems.length === 0 && r1.warnings.length === 1, JSON.stringify(r1))

  const pending = [base({ status: 'pendiente' })]
  const r2 = evaluate(pending, validateDecisions(pending))
  expect('un pendiente impide el corte', r2.problems.length === 1 && /pendiente/.test(r2.problems[0]), JSON.stringify(r2))

  const proposed = [base({ status: 'propuesto', gate: 'aprobado' })]
  const r3 = evaluate(proposed, validateDecisions(proposed))
  expect('un propuesto con gate aprobado impide el corte', r3.problems.length === 1, JSON.stringify(r3))

  const dup = [base({ id: 'CTA-1' }), base({ id: 'CTA-1' })]
  const r4 = evaluate(dup, validateDecisions(dup))
  expect('un id duplicado es problema', r4.problems.some((p) => /duplicado/.test(p)), JSON.stringify(r4))

  const wrongChosen = [base({ chosen: 'Z', options: { A: { es: 'uno' } } })]
  const r5 = evaluate(wrongChosen, validateDecisions(wrongChosen))
  expect('chosen fuera de options es problema', r5.problems.some((p) => /no existe en options/.test(p)), JSON.stringify(r5))

  const badStatus = [base({ status: 'quizas' as never })]
  expect('un estado invalido es problema', validateDecisions(badStatus).some((p) => /estado invalido/.test(p)))

  const r6 = evaluate([])
  expect('sin decisiones es valido', r6.problems.length === 0 && r6.total === 0)

  console.log(bad === 0 ? 'PASS selftest 56-gate: fixtures limpio, pendiente, propuesto con gate aprobado e id duplicado' : `FAIL selftest 56-gate (${bad})`)
  return bad === 0 ? 0 : 1
}

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  if (args.includes('--selftest')) return selftest()

  const found = await discoverDecisions()
  const result = evaluate(found.decisions, found.problems)

  if (args.includes('--json')) {
    console.log(
      JSON.stringify(
        {
          modules: found.modules.map((m) => ({ file: m.file, decisions: m.decisions.length })),
          total: result.total,
          problems: result.problems,
          warnings: result.warnings,
          decisions: found.decisions.map((d) => ({ id: d.id, status: d.status, gate: d.gate, chosen: d.chosen ?? null })),
        },
        null,
        2,
      ),
    )
  } else {
    console.log(`# Modulos de datos 56-*: ${found.modules.length} (${found.modules.map((m) => m.file).join(', ') || 'ninguno'})`)
    console.log(table(found.decisions))
    for (const w of result.warnings) console.log(`WARN ${w}`)
    for (const p of result.problems) console.log(`${args.includes('--gate') ? 'FAIL' : 'INFO'} ${p}`)
  }

  if (args.includes('--gate')) {
    if (result.problems.length > 0) {
      console.log(`FAIL 56-gate: ${result.problems.length} problema(s) impiden el corte`)
      return 1
    }
    console.log(`PASS 56-gate: ${result.total} decision(es), ${result.warnings.length} aviso(s) para el handoff`)
    return 0
  }
  // Sin --gate: informa y sale 0 salvo que la forma de los datos este rota.
  return found.problems.length > 0 ? 1 : 0
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(await main())
