/**
 * Lote 1 de CTAs (plan 56-02, D-15).
 *
 * La fuente es scripts/db/data/56-juan-inputs.json (generado desde
 * .planning/phase-56-prep/textos-pendientes-juan.md). Aqui no se inventa ningun texto.
 *
 *   - Fila con ES y EN pegados por Juan: estado `aprobado` (D-15: aprobados tal como se listaron).
 *   - El cierre de la home (cierre-lead) sale aprobado con el texto de D-15.
 *   - Fila sin texto: estado `pendiente`, con el texto vigente en ES y sin EN. El gate del corte la detecta.
 *
 * loadAt: `corte` para lo que lee master (header-cta, audit-offer-cta, auditor-cta); `ahora`
 * para el global sombra home-page y para messages (D-02).
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision, DecisionStatus } from './56-content-decisions'
import inputsJson from './56-juan-inputs.json'

export type CtaLoadAt = 'ahora' | 'corte'

export type CtaRow = {
  id: string
  /** Donde vive el texto: global sombra, messages, bloque de pages o global header. */
  origen: string
  loadAt: CtaLoadAt
  /** Texto en espanol: el aprobado, o el vigente si la fila esta pendiente. */
  es: string
  /** Texto en ingles aprobado. Ausente mientras la fila este pendiente. */
  en?: string
  /** Texto vigente en espanol, como respaldo. */
  vigenteEs: string
  estado: DecisionStatus
}

type InRow = {
  id: string
  origen: string | null
  carga: string | null
  vigenteEs: string | null
  es: string | null
  en: string | null
}

const ROWS = (inputsJson as unknown as { lote1: InRow[] }).lote1

/** Arma una fila desde la entrada de Juan. Exportada para la autoprueba. */
export function buildCtaRow(row: InRow): CtaRow {
  const approved = Boolean(row.es && row.en)
  const vigenteEs = row.vigenteEs ?? ''
  return {
    id: row.id,
    origen: row.origen ?? '',
    loadAt: row.carga === 'corte' ? 'corte' : 'ahora',
    es: approved ? (row.es as string) : vigenteEs,
    ...(approved ? { en: row.en as string } : {}),
    vigenteEs,
    estado: approved ? 'aprobado' : 'pendiente',
  }
}

export const CTA_LOTE1: CtaRow[] = ROWS.map(buildCtaRow)

/** Una decision por fila, ids CTA-<id>. El gate del corte exige estado aprobado. */
export const DECISIONS: Decision[] = CTA_LOTE1.map((row) => ({
  id: `CTA-${row.id}`,
  label: `CTA ${row.id}`,
  status: row.estado,
  gate: 'aprobado',
  chosen: row.estado === 'aprobado' ? 'aprobado' : 'vigente',
  options:
    row.estado === 'aprobado'
      ? { aprobado: { es: row.es, en: row.en }, vigente: { es: row.vigenteEs } }
      : { vigente: { es: row.vigenteEs, note: 'Sin texto del lote 1 pegado por Juan' } },
  source: `${row.origen} (carga: ${row.loadAt})`,
}))
