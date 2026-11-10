/**
 * Exportador de revision de la fase 56 (plan 56-01).
 *
 * Imprime en markdown, por prefijo de id, los textos que Juan debe aprobar. Solo lee
 * archivos del repo: no usa red, no abre ninguna base y no escribe archivos.
 *
 *   node_modules/.bin/tsx scripts/verify/56-review-export.ts                  todo, agrupado por prefijo
 *   node_modules/.bin/tsx scripts/verify/56-review-export.ts --only MSG       solo los ids que empiezan por MSG
 *   node_modules/.bin/tsx scripts/verify/56-review-export.ts --only LEGAL ALT uno o varios prefijos
 *   node_modules/.bin/tsx scripts/verify/56-review-export.ts --selftest
 *
 * Lo piden los gates de aprobacion de los planes 56-04, 56-06, 56-07, 56-09 y 56-11.
 */
import { pathToFileURL } from 'node:url'

import type { Decision } from '../db/data/56-content-decisions'
import { discoverDecisions } from './56-gate'

/** Prefijo de agrupacion de un id: lo que va antes del primer guion, o `D-22` / `D-11` para las decisiones D-NN. */
export function prefixOf(id: string): string {
  const d = /^(D-\d+)/.exec(id)
  if (d) return d[1]
  return id.split('-')[0]
}

/** ¿El id empieza por alguno de los prefijos pedidos? Sin prefijos entran todos. */
export function matchesPrefixes(id: string, prefixes: readonly string[]): boolean {
  if (prefixes.length === 0) return true
  return prefixes.some((p) => id === p || id.startsWith(p))
}

function quote(text: string): string {
  return text
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n')
}

/** Una seccion markdown por decision. */
export function renderDecision(d: Decision): string {
  const lines: string[] = []
  lines.push(`### ${d.id}: ${d.label}`)
  lines.push('')
  lines.push(`- Estado: ${d.status}`)
  lines.push(`- Gate: ${d.gate}`)
  lines.push(`- Elegida: ${d.chosen ?? '(ninguna)'}`)
  lines.push(`- Recomendada: ${d.recommended ?? '(ninguna)'}`)
  if (d.source) lines.push(`- Fuente: ${d.source}`)
  if (d.options) {
    lines.push('')
    lines.push('Opciones:')
    for (const [key, opt] of Object.entries(d.options)) {
      const tags = [key === d.chosen ? 'elegida' : '', key === d.recommended ? 'recomendada' : ''].filter(Boolean)
      lines.push('')
      lines.push(`**Opción ${key}**${tags.length ? ` (${tags.join(', ')})` : ''}`)
      lines.push(`- ES: ${opt.es ?? '(sin texto)'}`)
      lines.push(`- EN: ${opt.en ?? '(sin texto)'}`)
      if (opt.note) lines.push(`- Nota: ${opt.note}`)
    }
  }
  if (d.preview && (d.preview.es || d.preview.en)) {
    lines.push('')
    lines.push('Vista previa:')
    if (d.preview.es) {
      lines.push('')
      lines.push('ES')
      lines.push(quote(d.preview.es))
    }
    if (d.preview.en) {
      lines.push('')
      lines.push('EN')
      lines.push(quote(d.preview.en))
    }
  }
  return lines.join('\n')
}

/** Documento markdown completo: decisiones agrupadas por prefijo, en orden de aparicion. */
export function renderReview(decisions: readonly Decision[], prefixes: readonly string[] = []): string {
  const picked = decisions.filter((d) => matchesPrefixes(d.id, prefixes))
  if (picked.length === 0) {
    return prefixes.length > 0
      ? `No hay decisiones registradas con prefijo ${prefixes.join(', ')}.`
      : 'No hay decisiones registradas todavía.'
  }
  const groups = new Map<string, Decision[]>()
  for (const d of picked) {
    const key = prefixOf(d.id)
    groups.set(key, [...(groups.get(key) ?? []), d])
  }
  const out: string[] = ['# Textos para tu revisión', '']
  for (const [prefix, items] of groups) {
    out.push(`## ${prefix} (${items.length})`, '')
    for (const d of items) out.push(renderDecision(d), '')
  }
  return out.join('\n').trimEnd()
}

function selftest(): number {
  let bad = 0
  const expect = (label: string, ok: boolean, detail = '') => {
    if (ok) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}${detail ? `: ${detail}` : ''}`)
    }
  }
  const fixture: Decision[] = [
    {
      id: 'D-22a',
      label: 'Título del hero',
      status: 'propuesto',
      gate: 'aprobado',
      chosen: 'A',
      recommended: 'A',
      options: { A: { es: 'Consultor SEO técnico que también programa', en: 'Technical SEO consultant who also codes', note: 'recomendada' }, B: { es: 'otra' } },
    },
    { id: 'MSG-x', label: 'Mensaje x', status: 'propuesto', gate: 'propuesto', preview: { es: 'Antes: a\nDespués: b', en: 'Before: a\nAfter: b' } },
    { id: 'MSG-y', label: 'Mensaje y', status: 'aprobado', gate: 'propuesto' },
    { id: 'LEGAL-1', label: 'Legal', status: 'pendiente', gate: 'aprobado' },
  ]
  const msg = renderReview(fixture, ['MSG'])
  expect('--only MSG lista las dos decisiones MSG y ninguna otra', msg.includes('MSG-x') && msg.includes('MSG-y') && !msg.includes('LEGAL-1') && !msg.includes('D-22a'), msg)
  expect('el preview imprime antes y después en es y en', msg.includes('> Antes: a') && msg.includes('> Después: b') && msg.includes('> Before: a'))
  const hero = renderReview(fixture, ['D-22'])
  expect('--only D-22 imprime opciones con es, en y marcas', hero.includes('Opción A** (elegida, recomendada)') && hero.includes('- EN: Technical SEO consultant who also codes') && hero.includes('- Nota: recomendada'))
  const all = renderReview(fixture)
  expect('sin --only agrupa por prefijo', all.includes('## D-22 (1)') && all.includes('## MSG (2)') && all.includes('## LEGAL (1)'))
  expect('un prefijo sin decisiones lo dice', /No hay decisiones/.test(renderReview(fixture, ['ZZZ'])))
  expect('prefixOf agrupa D-NN y el resto por primer segmento', prefixOf('D-11b') === 'D-11' && prefixOf('CTA-home-cierre') === 'CTA' && prefixOf('MSG-emailCapture-errorBody') === 'MSG')
  console.log(bad === 0 ? 'PASS selftest 56-review-export: filtro por prefijo, agrupacion y vista previa' : `FAIL selftest 56-review-export (${bad})`)
  return bad === 0 ? 0 : 1
}

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  if (args.includes('--selftest')) return selftest()
  const i = args.indexOf('--only')
  const prefixes = i >= 0 ? args.slice(i + 1).filter((a) => !a.startsWith('--')) : []
  if (i >= 0 && prefixes.length === 0) {
    console.error('FAIL --only necesita al menos un prefijo de id (por ejemplo MSG, LEGAL, D-22)')
    return 1
  }
  const found = await discoverDecisions()
  console.log(renderReview(found.decisions, prefixes))
  return found.problems.length > 0 ? 1 : 0
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(await main())
