/**
 * Decisiones de copy de la home D-22a a D-22g (plan 56-02, D-22).
 *
 * La fuente es scripts/db/data/56-juan-inputs.json, que sale de
 * .planning/phase-56-prep/textos-pendientes-juan.md con scripts/verify/56-inputs-check.mjs
 * --emit-json. Aqui no se inventa ningun texto: solo entra lo que Juan decidio o pego.
 * Cambiar una eleccion es cambiar una linea ("Elegida:") en ese archivo y regenerar el JSON.
 *
 * REGLA DE VALORES POR DEFECTO (D-22):
 *   - Si la opcion elegida tiene texto, la decision lleva el estado que dice el archivo
 *     (aprobado cuando Juan ya eligio).
 *   - Si la opcion elegida no tiene texto, la decision cae a la opcion `vigente` (el valor
 *     que Juan rechazo) con estado `pendiente`, y el corte falla hasta que responda.
 *
 * Sin imports de Payload ni de red. No importa 54-home-copy.ts: el plan 56-09 lo convierte
 * en un reexport de 56-home-copy.ts y un import aqui seria circular.
 */
import type { Decision, DecisionOption, DecisionStatus } from './56-content-decisions'
import inputsJson from './56-juan-inputs.json'

type InOption = {
  es?: string | null
  en?: string | null
  valor?: string | null
  desde?: number | null
  hasta?: number | null
  leyenda?: string | null
  nota?: string | null
  sinCifra?: boolean
}

type InDecision = {
  title: string
  vigente: string | null
  recommended: string | null
  chosen: string | null
  estado: string | null
  nota: string | null
  options: Record<string, InOption>
  quitarFraseGooglebot?: boolean
}

type Inputs = { decisions: Record<string, InDecision> }

const INPUTS = inputsJson as unknown as Inputs

/** Cifras de origen de una candidata de estadistica. */
export type StatOption = {
  valor: string
  desde: number | null
  hasta: number | null
  leyenda: string
  nota?: string
}

/** Porcentaje recalculado desde las cifras de origen, o null si faltan. */
export function recomputePct(stat: Pick<StatOption, 'desde' | 'hasta'>): number | null {
  if (stat.desde === null || stat.hasta === null || stat.desde <= 0) return null
  return Math.round(((stat.hasta - stat.desde) / stat.desde) * 100)
}

function isStat(o: InOption): boolean {
  return typeof o.valor === 'string'
}

/** Una opcion cuenta como "con texto" si trae ES, es una cifra con leyenda, o es la opcion sin cifra. */
function hasText(o: InOption): boolean {
  if (o.sinCifra === true) return true
  if (isStat(o)) return Boolean(o.valor && o.leyenda)
  return Boolean(o.es)
}

function toOption(o: InOption): DecisionOption {
  if (o.sinCifra === true) {
    return { note: o.nota ?? 'El hero no muestra estadistica' }
  }
  if (isStat(o)) {
    const origin =
      o.desde !== null && o.desde !== undefined && o.hasta !== null && o.hasta !== undefined
        ? `de ${o.desde} a ${o.hasta}`
        : 'sin cifras de origen'
    return {
      es: `${o.valor} ${o.leyenda}`,
      note: [origin, o.nota].filter(Boolean).join('. '),
    }
  }
  const out: DecisionOption = {}
  if (o.es) out.es = o.es
  if (o.en) out.en = o.en
  if (o.nota) out.note = o.nota
  return out
}

function asStatus(value: string | null): DecisionStatus {
  return value === 'aprobado' || value === 'propuesto' || value === 'pendiente' ? value : 'propuesto'
}

/**
 * Arma una decision desde su seccion del archivo de Juan. Exportada para la autoprueba.
 * Las casillas vacias no generan opcion. Siempre agrega la opcion `vigente`.
 */
export function buildDecision(id: string, label: string, input: InDecision): Decision {
  const options: Record<string, DecisionOption> = {}
  for (const [key, opt] of Object.entries(input.options)) {
    if (hasText(opt)) options[key] = toOption(opt)
  }
  options.vigente = {
    es: input.vigente ?? undefined,
    note: 'Valor vigente de la fase 54, rechazado por Juan',
  }

  const recommended = input.recommended && input.recommended in options ? input.recommended : undefined
  const chosenHasText = Boolean(input.chosen && input.chosen !== 'vigente' && input.chosen in options)
  return {
    id,
    label,
    gate: 'aprobado',
    status: chosenHasText ? asStatus(input.estado) : 'pendiente',
    chosen: chosenHasText ? (input.chosen as string) : 'vigente',
    recommended,
    options,
    source: '.planning/phase-56-prep/textos-pendientes-juan.md',
  }
}

const LABELS: Record<string, string> = {
  'D-22a': 'Titulo del hero',
  'D-22b': 'Texto del hero',
  'D-22c': 'Estadistica del hero',
  'D-22d': 'Tagline bajo el hero',
  'D-22e': 'Titulo de la medicion',
  'D-22f': 'Texto de la medicion',
  'D-22g': 'Lead de servicios',
  'D-22g-item': 'Texto del item SEO tecnico',
}

function must(id: string): InDecision {
  const d = INPUTS.decisions[id]
  if (!d) throw new Error(`56-juan-inputs.json no trae la seccion ${id}. Regenerar con 56-inputs-check.mjs --emit-json.`)
  return d
}

/** Una constante por decision. Cambiar la eleccion es cambiar una linea del archivo de Juan. */
export const HOME_DECISIONS: Record<string, Decision> = Object.fromEntries(
  Object.keys(LABELS).map((id) => [id, buildDecision(id, LABELS[id], must(id))]),
)

export const DECISIONS: Decision[] = Object.values(HOME_DECISIONS)

/** Candidatas de estadistica con sus cifras de origen, para que la leyenda y el porcentaje se verifiquen. */
export const HERO_STATS: Record<string, StatOption> = Object.fromEntries(
  Object.entries(must('D-22c').options)
    .filter(([, o]) => isStat(o))
    .map(([key, o]) => [
      key,
      {
        valor: o.valor as string,
        desde: o.desde ?? null,
        hasta: o.hasta ?? null,
        leyenda: o.leyenda as string,
        ...(o.nota ? { nota: o.nota } : {}),
      },
    ]),
)

/** Decision ya tomada por Juan: la frase sobre Googlebot sale del lead y del item SEO tecnico. */
export const QUITAR_FRASE_GOOGLEBOT: boolean = must('D-22g').quitarFraseGooglebot === true

/** Decision ya tomada por Juan: se quitan las notas "Bueno: hasta" de la medicion. */
export const QUITAR_NOTAS_BUENO_HASTA = true

/** ¿El hero muestra estadistica? Falso cuando la decision elegida es "ninguna". */
export const HERO_MUESTRA_ESTADISTICA: boolean = HOME_DECISIONS['D-22c'].chosen !== 'ninguna'
