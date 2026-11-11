/**
 * Fase 56 (plan 56-12): siembra el texto legal sombra en el global `legal-pages`.
 *
 * Qué escribe, y solo esto: `privacy.body` y `terms.body` (Lexical, localizados).
 * NUNCA escribe `effectiveDate` (D-09): la fecha efectiva la fija 56-14 el día del corte.
 * Master sigue sirviendo /privacy y /terms desde los docs de la colección pages: este global
 * es sombra y la ruta nueva cae al doc pages mientras el cuerpo del idioma esté vacío.
 *
 * IDIOMAS. Por defecto solo siembra ES. El EN es opt-in:
 *   --include-en           siembra también EN (LEGAL-PRIVACY-EN y LEGAL-TERMS-EN deben estar
 *                          aprobadas en el registro; si siguen propuestas exige además
 *                          --allow-proposed-en, que significa "Juan las aprobó fuera del repo")
 *   --allow-proposed-en    permite sembrar un EN que el registro aún marca propuesto
 *
 * DRY-RUN POR DEFECTO.
 *   --apply                escribe; exige --db-checked
 *   --db-checked           Juan confirmó con 04-which-database.ts contra qué base apunta
 *   --allow-pending        permite sembrar aunque alguna decisión LEGAL esté en estado
 *                          pendiente (una propuesta no cuenta como pendiente)
 *
 * Como Payload normaliza el estado Lexical, antes y después se compara el texto aplanado de
 * encabezados, párrafos y elementos de lista, no el JSON completo.
 *
 * Seguridad de la base (CLAUDE.md, Database Safety; incidente 2026-08-17): imprime host,
 * puerto y nombre (nunca usuario ni contraseña) y rechaza toda base que no sea la de
 * producción vía túnel o shared-postgres, ANTES de importar Payload. Nunca se carga el .env
 * del repo y no usa ninguna operación de borrado de la Local API.
 *
 *   DATABASE_URI=<túnel> PAYLOAD_SECRET=migrate-only \
 *     node_modules/.bin/tsx scripts/db/27-phase56-seed-legal.ts [banderas]
 */
import { pathToFileURL } from 'node:url'

import type { DecisionStatus } from './data/56-content-decisions'
import { DECISIONS as LEGAL_DECISIONS, PRIVACY_EN, PRIVACY_ES, TERMS_EN, TERMS_ES } from './data/56-legal-copy'
import { sectionsToLexical } from './data/56-legal-lexical'
import { assertNoForbiddenChars, assertSafeTarget, safeTarget } from './data/56-seed-lib'

type Locale = 'es' | 'en'

export type Opts = {
  apply: boolean
  dbChecked: boolean
  includeEn: boolean
  allowProposedEn: boolean
  allowPending: boolean
}

export type Io = { out: (line: string) => void; err: (line: string) => void }

export type LegalSource = {
  locale: Locale
  privacy: unknown
  terms: unknown
  /** Ids de decision de los dos documentos de este idioma. */
  docDecisionIds: [string, string]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayloadLike = any

export type DecisionLite = { id: string; status: DecisionStatus; gate: string }

export const DEFAULT_SOURCES: LegalSource[] = [
  {
    locale: 'es',
    privacy: sectionsToLexical(PRIVACY_ES),
    terms: sectionsToLexical(TERMS_ES),
    docDecisionIds: ['LEGAL-PRIVACY-ES', 'LEGAL-TERMS-ES'],
  },
  {
    locale: 'en',
    privacy: sectionsToLexical(PRIVACY_EN),
    terms: sectionsToLexical(TERMS_EN),
    docDecisionIds: ['LEGAL-PRIVACY-EN', 'LEGAL-TERMS-EN'],
  },
]

export function parseArgs(argv: string[]): Opts {
  const has = (flag: string) => argv.includes(flag)
  return {
    apply: has('--apply'),
    dbChecked: has('--db-checked'),
    includeEn: has('--include-en'),
    allowProposedEn: has('--allow-proposed-en'),
    allowPending: has('--allow-pending'),
  }
}

// ---------------------------------------------------------------------------
// Utilidades puras
// ---------------------------------------------------------------------------

/** La fecha efectiva no se escribe desde este script (D-09): lanza si el dato la trae. */
export function assertNoEffectiveDate(data: Record<string, unknown>): void {
  if (Object.prototype.hasOwnProperty.call(data, 'effectiveDate')) {
    throw new Error('el dato a escribir trae effectiveDate: la fija 56-14 el dia del corte (D-09)')
  }
}

type LexNode = { type?: string; text?: string; children?: LexNode[] }

function textOf(node: LexNode): string {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(textOf).join('')
}

/**
 * Texto aplanado de un estado Lexical: un renglon por encabezado, parrafo y elemento de
 * lista, en orden. Ignora formato, ids y cualquier normalizacion de Payload.
 */
export function lexicalLines(state: unknown): string[] {
  const out: string[] = []
  const walk = (node: LexNode) => {
    if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'listitem') {
      const t = textOf(node).replace(/\s+/g, ' ').trim()
      if (t !== '') out.push(t)
      return
    }
    for (const child of node.children ?? []) walk(child)
  }
  const root = (state as { root?: LexNode } | null | undefined)?.root
  if (root) walk(root)
  return out
}

export function sameLines(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((line, i) => line === b[i])
}

// ---------------------------------------------------------------------------
// Ejecucion (inyectable: la autoprueba usa una Local API falsa en memoria)
// ---------------------------------------------------------------------------

async function readLegal(payload: PayloadLike, locale: Locale): Promise<Record<string, unknown>> {
  return (await payload.findGlobal({ slug: 'legal-pages', locale, fallbackLocale: false, depth: 0 })) as Record<string, unknown>
}

function bodyOf(doc: Record<string, unknown>, key: 'privacy' | 'terms'): unknown {
  return (doc[key] as { body?: unknown } | undefined)?.body
}

export async function run(
  opts: Opts,
  env: { DATABASE_URI?: string },
  loadPayload: () => Promise<PayloadLike>,
  io: Io,
  sources: LegalSource[] = DEFAULT_SOURCES,
  decisions: DecisionLite[] = LEGAL_DECISIONS,
): Promise<number> {
  const log = io.out
  log(`=== ${opts.apply ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} ===`)
  log(`  base: ${safeTarget(env.DATABASE_URI)}`)

  try {
    assertSafeTarget(env.DATABASE_URI, opts.apply, opts.dbChecked)
  } catch (err) {
    log(`ABORT: ${(err as Error).message}`)
    return 1
  }

  const chosen = sources.filter((s) => opts.includeEn || s.locale === 'es')
  log(`  idiomas: ${chosen.map((s) => s.locale).join(', ')}${opts.includeEn ? '' : ' (EN no incluido: usa --include-en cuando Juan lo apruebe)'}`)

  // Estado de cada decision LEGAL (se imprime siempre).
  log('\n  Decisiones LEGAL:')
  for (const d of decisions) log(`    ${d.id.padEnd(34)} ${d.status.padEnd(10)} gate ${d.gate}`)
  const pending = decisions.filter((d) => d.status === 'pendiente')
  if (pending.length > 0 && !opts.allowPending) {
    log(`ABORT: hay decisiones LEGAL pendientes (${pending.map((d) => d.id).join(', ')}). Juan debe responder; --allow-pending lo salta.`)
    return 1
  }

  // Un EN todavia propuesto exige la segunda bandera.
  if (opts.includeEn && !opts.allowProposedEn) {
    const notApproved = sources
      .filter((s) => s.locale === 'en')
      .flatMap((s) => s.docDecisionIds)
      .filter((id) => decisions.find((d) => d.id === id)?.status !== 'aprobado')
    if (notApproved.length > 0) {
      log(`ABORT: ${notApproved.join(', ')} no estan aprobadas. Juan debe aprobarlas; si ya lo hizo fuera del repo, agrega --allow-proposed-en.`)
      return 1
    }
  }

  // Comprobaciones puras ANTES de abrir Payload.
  for (const s of chosen) {
    for (const [label, state] of [['privacy', s.privacy], ['terms', s.terms]] as const) {
      try {
        assertNoForbiddenChars(state)
      } catch (err) {
        log(`ABORT en ${label} (${s.locale}): ${(err as Error).message}`)
        return 1
      }
      if (lexicalLines(state).length === 0) {
        log(`ABORT: ${label} (${s.locale}) no tiene texto: no se siembra un cuerpo vacio`)
        return 1
      }
    }
  }

  let payload: PayloadLike
  try {
    payload = await loadPayload()
  } catch (err) {
    log(`ABORT abriendo Payload: ${(err as Error).message}`)
    return 1
  }

  // Plan de solo lectura antes de la primera escritura.
  type Plan = { s: LegalSource; data: Record<string, unknown>; changed: string[] }
  const plans: Plan[] = []
  try {
    for (const s of chosen) {
      const current = await readLegal(payload, s.locale)
      const changed: string[] = []
      log(`\n--- global legal-pages (locale ${s.locale}) ---`)
      for (const [key, state] of [['privacy', s.privacy], ['terms', s.terms]] as const) {
        const same = sameLines(lexicalLines(bodyOf(current, key)), lexicalLines(state))
        log(`  ${same ? 'igual  ' : 'difiere'} ${key}.body (${lexicalLines(state).length} renglones)`)
        if (!same) changed.push(key)
      }
      // Grupos COMPLETOS (leidos y fusionados con el cuerpo nuevo). Sin effectiveDate.
      const data: Record<string, unknown> = {}
      for (const key of changed as ('privacy' | 'terms')[]) {
        data[key] = { ...((current[key] as object | undefined) ?? {}), body: key === 'privacy' ? s.privacy : s.terms }
      }
      plans.push({ s, data, changed })
    }
  } catch (err) {
    log(`ABORT leyendo legal-pages: ${(err as Error).message}\n  (la migracion phase56_legal_shadow debe estar aplicada)`)
    return 1
  }

  if (!opts.apply) {
    log('\nDRY-RUN: no se escribe. Vuelve a correr con --apply --db-checked.')
    return 0
  }

  let allOk = true
  try {
    for (const plan of plans) {
      log(`\nEscribiendo legal-pages (${plan.s.locale})`)
      if (plan.changed.length === 0) {
        log('  nada que escribir (idempotente)')
        continue
      }
      assertNoEffectiveDate(plan.data)
      await payload.updateGlobal({ slug: 'legal-pages', locale: plan.s.locale, data: plan.data })

      const after = await readLegal(payload, plan.s.locale)
      for (const key of plan.changed as ('privacy' | 'terms')[]) {
        const want = lexicalLines(key === 'privacy' ? plan.s.privacy : plan.s.terms)
        const got = lexicalLines(bodyOf(after, key))
        const ok = sameLines(got, want)
        allOk = ok && allOk
        log(ok ? `  OK   ${key}.body (${plan.s.locale}): releido y comparado` : `  FALLA ${key}.body (${plan.s.locale}): ${got.length} renglones leidos y se esperaban ${want.length}`)
      }
    }
  } catch (err) {
    log(`ABORT escribiendo: ${(err as Error).message}\n  Lo escrito antes de este error queda aplicado. Revisa con 25-phase56-verify-schema.ts.`)
    return 1
  }

  log('\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. La fecha efectiva NO se escribio: la fija 56-14.')
  return allOk ? 0 : 1
}

async function main() {
  const code = await run(
    parseArgs(process.argv.slice(2)),
    process.env,
    async () => {
      const { getPayload } = await import('payload')
      const config = (await import('../../src/payload.config')).default
      return getPayload({ config })
    },
    { out: (l) => console.log(l), err: (l) => console.error(l) },
  )
  process.exit(code)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
