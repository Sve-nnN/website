/**
 * Autoprueba de los datos tipados de la home y del lote 1 de CTAs (plan 56-02).
 * No usa red ni base de datos.
 *
 *   node_modules/.bin/tsx scripts/verify/56-home-inputs-selftest.ts
 */
import { resolveDecision } from '../db/data/56-content-decisions'
import { CTA_LOTE1, DECISIONS as CTA_DECISIONS, buildCtaRow } from '../db/data/56-cta-lote1'
import {
  DECISIONS as HOME_DECISION_LIST,
  HERO_MUESTRA_ESTADISTICA,
  HERO_STATS,
  HOME_DECISIONS,
  QUITAR_FRASE_GOOGLEBOT,
  buildDecision,
  recomputePct,
} from '../db/data/56-options-home'

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const MARKER_OPEN = '{'.repeat(2)

let bad = 0
function expect(label: string, ok: boolean, detail = '') {
  if (ok) console.log(`PASS ${label}`)
  else {
    bad += 1
    console.log(`FAIL ${label}${detail ? `: ${detail}` : ''}`)
  }
}

// Test 1: cada decision D-22 tiene recommended, chosen y un valor resoluble.
const ids = ['D-22a', 'D-22b', 'D-22c', 'D-22d', 'D-22e', 'D-22f', 'D-22g', 'D-22g-item']
for (const id of ids) {
  const d = HOME_DECISIONS[id]
  let resolved = false
  try {
    resolved = resolveDecision(d) !== undefined
  } catch {
    resolved = false
  }
  expect(`${id} tiene recommended, chosen y resuelve`, Boolean(d?.recommended && d.chosen && resolved))
}

// Lo que Juan decidio el 2026-11-10 queda aprobado y con el texto exacto.
const text = (id: string, lang: 'es' | 'en') => resolveDecision(HOME_DECISIONS[id])?.[lang]
expect('D-22a elegida A, aprobada, EN con "also codes"', HOME_DECISIONS['D-22a'].chosen === 'A' && HOME_DECISIONS['D-22a'].status === 'aprobado' && text('D-22a', 'en') === 'Technical SEO consultant who also codes')
expect('D-22a es "Consultor SEO técnico que también programa"', text('D-22a', 'es') === 'Consultor SEO técnico que también programa')
expect('D-22b elegida 2 y aprobada', HOME_DECISIONS['D-22b'].chosen === '2' && HOME_DECISIONS['D-22b'].status === 'aprobado')
expect('D-22c elegida ninguna y el hero no muestra estadistica', HOME_DECISIONS['D-22c'].chosen === 'ninguna' && HOME_DECISIONS['D-22c'].status === 'aprobado' && HERO_MUESTRA_ESTADISTICA === false)
expect('D-22d elegida 2', HOME_DECISIONS['D-22d'].chosen === '2' && HOME_DECISIONS['D-22d'].status === 'aprobado')
expect('D-22e elegida 3 con su EN', HOME_DECISIONS['D-22e'].chosen === '3' && text('D-22e', 'en') === "How Google sees your site's speed")
expect('D-22f elegida 2', HOME_DECISIONS['D-22f'].chosen === '2' && HOME_DECISIONS['D-22f'].status === 'aprobado')
expect('D-22g elegida 3 y bandera de Googlebot verdadera', HOME_DECISIONS['D-22g'].chosen === '3' && text('D-22g', 'es') === 'Desde la auditoría hasta el código en producción, con resultados que puedes medir.' && QUITAR_FRASE_GOOGLEBOT === true)
expect('D-22g-item es el texto nuevo, aprobado', HOME_DECISIONS['D-22g-item'].status === 'aprobado' && text('D-22g-item', 'en') === 'I audit crawling, indexing and structured data, and fix what keeps Google from understanding and ranking your pages.')

// Test 2: una decision cuya opcion elegida no tiene texto cae a vigente y queda pendiente.
const fallback = buildDecision('D-22x', 'Prueba', {
  title: 'Prueba',
  vigente: 'Texto vigente',
  recommended: 'A',
  chosen: 'B',
  estado: 'aprobado',
  nota: null,
  options: { A: { es: 'Texto A', en: 'Text A' }, B: { es: null, en: null } },
})
expect('opcion elegida sin texto cae a vigente con estado pendiente', fallback.status === 'pendiente' && fallback.chosen === 'vigente' && resolveDecision(fallback)?.es === 'Texto vigente')
expect('una casilla vacia no genera opcion', !('B' in (fallback.options ?? {})))

// Test 3: la estadistica recalcula su porcentaje desde desde y hasta.
const expected: Record<string, number> = { atlanta: 309, urologia: 406, baldosa: 143, edtech: 104, migracion: 68 }
for (const [key, pct] of Object.entries(expected)) {
  const s = HERO_STATS[key]
  expect(`estadistica ${key} recalcula +${pct} %`, Boolean(s) && recomputePct(s) === pct && s.valor === `+${pct} %`, JSON.stringify(s))
}
expect('clientes18 queda sin respaldo medido', HERO_STATS.clientes18 !== undefined && recomputePct(HERO_STATS.clientes18) === null && /sin respaldo/.test(HERO_STATS.clientes18.nota ?? ''))
expect('migracion avisa que es trafico mensual', /mensual/i.test(HERO_STATS.migracion.leyenda) && /MENSUAL/.test(HERO_STATS.migracion.nota ?? ''))

// Test 4: el lote 1 trae el cierre aprobado en ES y EN, tal cual D-15.
const cierre = CTA_LOTE1.find((r) => r.id === 'cierre-lead')
expect('cierre-lead aprobado con el texto de D-15', cierre?.estado === 'aprobado' && cierre.es === '¿Tienes un proyecto en mente? Cuéntame de qué se trata.' && cierre.en === 'Have a project in mind? Tell me what it is about.')
expect('el cierre ya no trae la frase retirada', !/empiezo por mirar/.test(cierre?.es ?? ''))
const pendRow = buildCtaRow({ id: 'x', origen: 'o', carga: 'ahora', vigenteEs: 'Vigente', es: null, en: null })
expect('una fila sin texto queda pendiente con el vigente y sin EN', pendRow.estado === 'pendiente' && pendRow.es === 'Vigente' && pendRow.en === undefined)
for (const id of ['header-cta', 'audit-offer-cta', 'auditor-cta']) {
  expect(`${id} se carga en el corte`, CTA_LOTE1.find((r) => r.id === id)?.loadAt === 'corte')
}
expect('el resto del lote 1 se carga ahora', CTA_LOTE1.filter((r) => !['header-cta', 'audit-offer-cta', 'auditor-cta'].includes(r.id)).every((r) => r.loadAt === 'ahora'))
expect('hay 17 filas y una decision CTA por fila', CTA_LOTE1.length === 17 && CTA_DECISIONS.length === 17 && CTA_DECISIONS.every((d) => d.id.startsWith('CTA-')))

// Test 5: ninguna cadena contiene raya larga, media ni marcador.
const everything = JSON.stringify([HOME_DECISION_LIST, CTA_DECISIONS, CTA_LOTE1, HERO_STATS])
expect('sin raya larga', !everything.includes(EM_DASH))
expect('sin raya media', !everything.includes(EN_DASH))
expect('sin marcador de ranura', !everything.includes(MARKER_OPEN))

console.log(bad === 0 ? 'PASS 56-home-inputs-selftest' : `FAIL 56-home-inputs-selftest: ${bad} caso(s)`)
process.exit(bad === 0 ? 0 : 1)
