// Verificador del archivo de entrada de Juan (plan 56-02, D-15, D-22, T-56-05, T-56-06).
//
// Lee .planning/phase-56-prep/textos-pendientes-juan.md, cuenta casillas llenas y vacias por
// seccion, rechaza rayas largas, rayas medias y marcadores de ranura en el texto pegado, y
// recalcula el porcentaje de cada candidata de estadistica desde sus cifras de origen.
// No usa red ni base de datos.
//
//   node scripts/verify/56-inputs-check.mjs                  tabla de casillas, sale 1 si algo falla
//   node scripts/verify/56-inputs-check.mjs --require-filled sale 1 si queda alguna casilla "(pega aqui)"
//   node scripts/verify/56-inputs-check.mjs --emit-json      escribe scripts/db/data/56-juan-inputs.json
//   node scripts/verify/56-inputs-check.mjs --selftest       prueba el parser con fixtures en memoria
//
// Las rayas y la apertura de marcador se arman por codigo para que este archivo no las contenga.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const INPUT = join(ROOT, '.planning', 'phase-56-prep', 'textos-pendientes-juan.md')
const OUTPUT = join(ROOT, 'scripts', 'db', 'data', '56-juan-inputs.json')

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const MARKER_OPEN = '{'.repeat(2)
const EMPTY = '(pega aquí)'

/** Fallos de texto pegado: rayas y marcador de ranura. */
export function textFailures(where, text) {
  const out = []
  if (text.includes(EM_DASH)) out.push(`${where}: contiene raya larga`)
  if (text.includes(EN_DASH)) out.push(`${where}: contiene raya media`)
  if (text.includes(MARKER_OPEN)) out.push(`${where}: contiene apertura de marcador de ranura`)
  return out
}

function cell(value) {
  const v = (value ?? '').trim()
  return v === '' || v === EMPTY ? null : v
}

/** "- clave | k1: v1 | k2: v2" a { key, fields }. El valor se parte en el primer ": ". */
function parseBullet(line) {
  const parts = line.replace(/^-\s+/, '').split(' | ')
  const key = parts[0].trim()
  const fields = {}
  for (const part of parts.slice(1)) {
    const i = part.indexOf(':')
    if (i === -1) continue
    fields[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return { key, fields }
}

function toNumber(raw) {
  if (raw === undefined) return null
  const n = Number(String(raw).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && String(raw).trim() !== '' ? n : null
}

/**
 * Parsea el markdown. Devuelve { lote1, decisions, problems, counts }.
 * counts: una fila por seccion con { id, filled, empty }.
 */
export function parseInputs(markdown) {
  const problems = [...textFailures('textos-pendientes-juan.md', markdown)]
  const lote1 = []
  const decisions = {}
  const counts = []

  const sections = []
  let current = null
  for (const raw of markdown.split('\n')) {
    const h = /^## (\S+)\s+(.*)$/.exec(raw)
    if (h) {
      current = { id: h[1], title: h[2].trim(), lines: [] }
      sections.push(current)
    } else if (current) {
      current.lines.push(raw)
    }
  }

  for (const sec of sections) {
    let filled = 0
    let empty = 0
    const count = (value) => {
      if (cell(value) === null) empty += 1
      else filled += 1
    }

    if (sec.id === 'LOTE1') {
      for (const line of sec.lines.filter((l) => l.startsWith('- '))) {
        const { key, fields } = parseBullet(line)
        const row = {
          id: key,
          origen: cell(fields['origen']),
          carga: cell(fields['carga']),
          vigenteEs: cell(fields['vigente ES']),
          es: cell(fields['ES']),
          en: cell(fields['EN']),
        }
        count(fields['ES'])
        count(fields['EN'])
        if (!row.origen) problems.push(`LOTE1 ${key}: falta el origen`)
        if (row.carga !== 'ahora' && row.carga !== 'corte') problems.push(`LOTE1 ${key}: carga debe ser ahora o corte`)
        lote1.push(row)
      }
      counts.push({ id: 'LOTE1', filled, empty })
      continue
    }

    const d = { title: sec.title, vigente: null, recommended: null, chosen: null, estado: null, nota: null, options: {} }
    for (const line of sec.lines) {
      let m
      if ((m = /^Vigente \(rechazado por Juan\):\s*(.*)$/.exec(line))) d.vigente = cell(m[1])
      else if ((m = /^Recomendada:\s*(.*)$/.exec(line))) d.recommended = cell(m[1])
      else if ((m = /^Elegida:\s*(.*)$/.exec(line))) d.chosen = cell(m[1])
      else if ((m = /^Estado:\s*(.*)$/.exec(line))) d.estado = cell(m[1])
      else if ((m = /^Nota:\s*(.*)$/.exec(line))) d.nota = cell(m[1])
      else if ((m = /^Quitar la frase sobre Googlebot[^:]*:\s*(.*)$/.exec(line))) d.quitarFraseGooglebot = /^s[ií]$/i.test(m[1].trim())
      else if (line.startsWith('- ')) {
        const { key, fields } = parseBullet(line)
        const opt = {}
        if ('ES' in fields || 'EN' in fields) {
          opt.es = cell(fields['ES'])
          opt.en = cell(fields['EN'])
          count(fields['ES'])
          count(fields['EN'])
        } else if ('valor' in fields) {
          opt.valor = cell(fields['valor'])
          opt.desde = toNumber(fields['desde'])
          opt.hasta = toNumber(fields['hasta'])
          opt.leyenda = cell(fields['leyenda'])
          if (fields['nota']) opt.nota = cell(fields['nota'])
          count(fields['valor'])
          count(fields['leyenda'])
          if (opt.desde !== null && opt.hasta !== null && opt.desde > 0) {
            const pct = Math.round(((opt.hasta - opt.desde) / opt.desde) * 100)
            const written = toNumber(opt.valor)
            if (written !== pct) {
              problems.push(`${sec.id} ${key}: el porcentaje escrito (${opt.valor}) no coincide con el calculado (+${pct} %) desde ${opt.desde} hasta ${opt.hasta}`)
            }
          }
        } else if ('sin cifra' in fields) {
          opt.sinCifra = /^s[ií]$/i.test(fields['sin cifra'])
          if (fields['nota']) opt.nota = cell(fields['nota'])
          filled += 1
        }
        d.options[key] = opt
      }
    }
    if (d.chosen && !(d.chosen in d.options)) problems.push(`${sec.id}: Elegida "${d.chosen}" no existe entre las opciones`)
    if (d.recommended && !(d.recommended in d.options)) problems.push(`${sec.id}: Recomendada "${d.recommended}" no existe entre las opciones`)
    if (d.estado && !['aprobado', 'propuesto', 'pendiente'].includes(d.estado)) problems.push(`${sec.id}: Estado invalido "${d.estado}"`)
    decisions[sec.id] = d
    counts.push({ id: sec.id, filled, empty })
  }

  return { lote1, decisions, problems, counts }
}

const REQUIRED_SECTIONS = ['LOTE1', 'D-22a', 'D-22b', 'D-22c', 'D-22d', 'D-22e', 'D-22f', 'D-22g']

export function missingSections(counts) {
  const have = new Set(counts.map((c) => c.id))
  return REQUIRED_SECTIONS.filter((id) => !have.has(id))
}

function renderTable(counts) {
  const head = ['seccion', 'llenas', 'vacias']
  const rows = counts.map((c) => [c.id, String(c.filled), String(c.empty)])
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const line = (cols) => cols.map((c, i) => c.padEnd(widths[i])).join('  ')
  return [line(head), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n')
}

/** Contenido del JSON generado: estable, sin casillas vacias como texto. */
export function toJson(parsed) {
  return JSON.stringify({ lote1: parsed.lote1, decisions: parsed.decisions }, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

function selftest() {
  let bad = 0
  const expect = (label, ok, detail = '') => {
    if (ok) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}${detail ? `: ${detail}` : ''}`)
    }
  }
  const good = [
    '## LOTE1 CTAs',
    `- a | origen: sombra | carga: ahora | vigente ES: Hola | ES: Uno | EN: One`,
    `- b | origen: header | carga: corte | vigente ES: Adios | ES: ${EMPTY} | EN: ${EMPTY}`,
    '## D-22a Titulo',
    'Vigente (rechazado por Juan): Viejo',
    'Recomendada: A',
    'Elegida: A',
    'Estado: aprobado',
    '- A | ES: Texto A | EN: Text A',
    `- B | ES: ${EMPTY} | EN: ${EMPTY}`,
    '## D-22c Estadistica',
    'Elegida: x',
    '- x | valor: +309 % | desde: 9621 | hasta: 39323 | leyenda: clics',
    '- y | valor: +68 % | desde: 82000 | hasta: 138000 | leyenda: mensual',
    '- ninguna | sin cifra: si',
  ].join('\n')
  const r1 = parseInputs(good)
  expect('fixture bueno no tiene problemas', r1.problems.length === 0, r1.problems.join('; '))
  const lote = r1.counts.find((c) => c.id === 'LOTE1')
  expect('cuenta llenas y vacias del lote 1', lote.filled === 2 && lote.empty === 2, JSON.stringify(lote))
  const a = r1.counts.find((c) => c.id === 'D-22a')
  expect('cuenta la opcion A llena y la B vacia', a.filled === 2 && a.empty === 2, JSON.stringify(a))
  expect('una casilla vacia queda null en el JSON', r1.decisions['D-22a'].options.B.es === null && r1.lote1[1].es === null)
  expect('la opcion ninguna se reconoce', r1.decisions['D-22c'].options.ninguna.sinCifra === true)

  const dash = good.replace('Texto A', `Texto ${EM_DASH} A`)
  expect('rechaza raya larga', parseInputs(dash).problems.some((p) => /raya larga/.test(p)))
  const dash2 = good.replace('Texto A', `Texto ${EN_DASH} A`)
  expect('rechaza raya media', parseInputs(dash2).problems.some((p) => /raya media/.test(p)))
  const marker = good.replace('Texto A', `Texto ${MARKER_OPEN}pendiente}} A`)
  expect('rechaza marcador de ranura', parseInputs(marker).problems.some((p) => /marcador/.test(p)))
  const pct = good.replace('+309 %', '+310 %')
  expect('rechaza porcentaje que no coincide con sus cifras', parseInputs(pct).problems.some((p) => /no coincide/.test(p)))
  const badChosen = good.replace('Elegida: A', 'Elegida: Z')
  expect('rechaza Elegida fuera de las opciones', parseInputs(badChosen).problems.some((p) => /no existe/.test(p)))
  expect('detecta secciones obligatorias ausentes', missingSections(r1.counts).includes('D-22g'))
  expect('el JSON es estable', toJson(r1) === toJson(parseInputs(good)))

  console.log(bad === 0 ? 'PASS 56-inputs-check --selftest' : `FAIL 56-inputs-check --selftest: ${bad} caso(s)`)
  return bad === 0 ? 0 : 1
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--selftest')) return selftest()

  if (!existsSync(INPUT)) {
    console.log(`FAIL 56-inputs-check: falta ${INPUT}`)
    return 1
  }
  const parsed = parseInputs(readFileSync(INPUT, 'utf8'))
  console.log(renderTable(parsed.counts))
  const problems = [...parsed.problems]
  for (const id of missingSections(parsed.counts)) problems.push(`falta la seccion ${id}`)

  const totalEmpty = parsed.counts.reduce((n, c) => n + c.empty, 0)
  if (args.includes('--require-filled') && totalEmpty > 0) {
    problems.push(`quedan ${totalEmpty} casilla(s) "${EMPTY}"`)
  }

  if (problems.length > 0) {
    for (const p of problems) console.log(`FAIL ${p}`)
    console.log(`FAIL 56-inputs-check: ${problems.length} problema(s)`)
    return 1
  }

  if (args.includes('--emit-json')) {
    writeFileSync(OUTPUT, toJson(parsed))
    console.log(`Escrito ${OUTPUT}`)
  }
  console.log(`PASS 56-inputs-check: ${totalEmpty} casilla(s) vacia(s), el resto llena`)
  return 0
}

process.exit(main())
