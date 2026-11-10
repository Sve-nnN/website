/**
 * Registro de decisiones de contenido de la fase 56 (plan 56-01, D-22).
 *
 * Cada texto que solo Juan decide vive en una constante con estado. El gate de la
 * fase 57 lee ese estado y no la memoria de nadie. Cambiar la eleccion es cambiar
 * una linea (`chosen`).
 *
 * Sin imports de Payload ni de red: se prueba con scripts/verify/56-seed-selftest.ts
 * y scripts/verify/56-gate.ts sin tocar ninguna base.
 *
 * CONVENCION de todo archivo scripts/db/data/56-*.ts (salvo este):
 *   - exporta `DECISIONS: Decision[]` (puede ser un arreglo vacio);
 *   - usa estos prefijos de id: D-22a a D-22g y D-11 (home y Sobre mi), CTA-,
 *     LEGAL-, LESSON-, ALT-, HEAD-, CUT-, MSG-.
 * scripts/verify/56-gate.ts descubre por si solo todos esos archivos y junta su
 * DECISIONS. Un plan nuevo solo crea su archivo de datos: nunca edita este registro
 * ni el orquestador.
 *
 * REGLA DE VALORES POR DEFECTO (D-22):
 *   - Si existe el texto de la opcion recomendada, se siembra con estado `propuesto`.
 *   - Si solo existe el valor vigente (que Juan rechazo), se siembra ese valor con
 *     estado `pendiente`, y el corte falla hasta que Juan responda.
 *
 * ESTADOS
 *   aprobado   Juan lo aprobo por escrito.
 *   propuesto  Claude lo redacto o lo recomienda y Juan aun no lo confirmo.
 *   pendiente  No hay texto aceptable todavia.
 *
 * GATE (el minimo que exige el corte)
 *   aprobado   El corte exige estado aprobado.
 *   propuesto  El corte acepta aprobado o propuesto (el handoff lo lista como aviso).
 */

export type DecisionStatus = 'aprobado' | 'propuesto' | 'pendiente'
export type DecisionGate = 'aprobado' | 'propuesto'

export type DecisionOption = {
  es?: string
  en?: string
  note?: string
}

export type Decision = {
  /** Identificador unico con prefijo de la convencion (D-22a, CTA-, LEGAL-, ...). */
  id: string
  /** Etiqueta corta legible para Juan. */
  label: string
  status: DecisionStatus
  /** El minimo que exige el corte para este texto. */
  gate: DecisionGate
  /** Clave de `options` elegida. */
  chosen?: string
  /** Clave de `options` recomendada por Claude. */
  recommended?: string
  options?: Record<string, DecisionOption>
  /** Texto largo para revision (por ejemplo antes y despues). */
  preview?: { es?: string; en?: string }
  /** De donde sale el dato: un archivo, una URL o una nota de la conversacion. */
  source?: string
}

export type GateMode = 'corte' | 'revision'

export type GateReport = {
  /** Impiden el corte. */
  problems: string[]
  /** No impiden el corte, pero van al handoff. */
  warnings: string[]
}

const STATUSES: readonly DecisionStatus[] = ['aprobado', 'propuesto', 'pendiente']
const GATES: readonly DecisionGate[] = ['aprobado', 'propuesto']

/**
 * Devuelve `options[chosen]`. Lanza si `chosen` no existe en `options`. Devuelve
 * undefined si la decision no tiene `options`.
 */
export function resolveDecision(decision: Decision): DecisionOption | undefined {
  if (!decision.options) return undefined
  const key = decision.chosen
  if (key === undefined || !Object.prototype.hasOwnProperty.call(decision.options, key)) {
    throw new Error(
      `${decision.id}: la opcion elegida "${String(key)}" no existe en options (${Object.keys(decision.options).join(', ')}).`,
    )
  }
  return decision.options[key]
}

/** Problemas de forma: id unico y presente, estado y gate validos, `chosen` dentro de `options`. */
export function validateDecisions(decisions: readonly Decision[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const d of decisions) {
    const id = typeof d?.id === 'string' ? d.id : ''
    if (!id.trim()) {
      problems.push('decision sin id')
      continue
    }
    if (seen.has(id)) problems.push(`${id}: id duplicado`)
    seen.add(id)
    if (!STATUSES.includes(d.status)) problems.push(`${id}: estado invalido "${String(d.status)}"`)
    if (!GATES.includes(d.gate)) problems.push(`${id}: gate invalido "${String(d.gate)}"`)
    if (d.options) {
      if (d.chosen !== undefined && !Object.prototype.hasOwnProperty.call(d.options, d.chosen)) {
        problems.push(`${id}: chosen "${d.chosen}" no existe en options`)
      }
      if (d.recommended !== undefined && !Object.prototype.hasOwnProperty.call(d.options, d.recommended)) {
        problems.push(`${id}: recommended "${d.recommended}" no existe en options`)
      }
    } else if (d.chosen !== undefined) {
      problems.push(`${id}: tiene chosen pero no options`)
    }
  }
  return problems
}

/**
 * Evalua el gate del corte.
 *  - Un estado `pendiente` es problema siempre (en modo `corte`).
 *  - Un estado `propuesto` es problema solo si `gate` es `aprobado`.
 *  - Un `propuesto` con gate `propuesto` se devuelve como aviso para el handoff.
 * En modo `revision` nada es problema (el exportador de revision lista el estado sin
 * fallar): lo que fallaria queda como aviso.
 */
export function gateFailures(decisions: readonly Decision[], mode: GateMode = 'corte'): GateReport {
  const problems: string[] = []
  const warnings: string[] = []
  for (const d of decisions) {
    let msg: string | null = null
    let blocking = false
    if (d.status === 'pendiente') {
      msg = `${d.id}: estado pendiente (${d.label}); Juan debe responder antes del corte`
      blocking = true
    } else if (d.status === 'propuesto') {
      if (d.gate === 'aprobado') {
        msg = `${d.id}: propuesto, pero el gate exige aprobado (${d.label})`
        blocking = true
      } else {
        msg = `${d.id}: propuesto con gate propuesto (${d.label}); anotar en el handoff`
      }
    }
    if (!msg) continue
    if (blocking && mode === 'corte') problems.push(msg)
    else warnings.push(msg)
  }
  return { problems, warnings }
}
