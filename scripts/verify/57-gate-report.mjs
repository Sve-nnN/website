// Agregador del reporte del gate de la fase 57 (plan 57-08, GO-01, T-57-28, T-57-29).
//
// Lee los JSON que escribe 57-run-all.mjs --live en evidence/, la salida de 56-gate.ts --json
// (sin base de datos ni red) y la lista manual de 57-A11Y-MANUAL.md, y escribe
// 57-GATE-REPORTE.md en español neutro, sin rayas largas ni medias.
//
// El reporte nunca imprime cabeceras de sesión, tokens, credenciales ni rutas del sistema:
// toda cadena que viene de un JSON pasa por limpia() antes de entrar al Markdown.
//
// Un FAIL nunca se oculta: cada hallazgo aparece clasificado (defecto a corregir, diferencia
// legítima que Juan acepta en 57-09, o decisión pendiente de Juan) y todo lo que impide el
// corte entra en la sección "Bloquea el corte".
//
// Uso:
//   node scripts/verify/57-gate-report.mjs --selftest
//   node scripts/verify/57-gate-report.mjs [--evidence <dir>] [--out <archivo.md>] [--no-gate]
//
// Variables: BASE_URL y PROD_BASE solo para rotular el reporte. Solo lectura local.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PHASE_DIR = '.planning/phases/57-gate-de-calidad-y-corte-a-producci-n'
export const EVIDENCE_DIR = `${PHASE_DIR}/evidence`
export const REPORT_FILE = `${PHASE_DIR}/57-GATE-REPORTE.md`
export const MANUAL_FILE = `${PHASE_DIR}/57-A11Y-MANUAL.md`

/** Archivos que escribe 57-run-all.mjs --live y que lee este agregador. */
export const FILES = {
  seo: '57-final-seo-parity.json',
  legacy: '57-final-legacy-sweep.json',
  a11y: '57-final-a11y.json',
  perf: '57-final-perf.json',
  bundle: '57-final-bundle.json',
  bundleBefore: '57-bundle-before.json',
  steps: '57-final-steps.json',
}

// ---------------------------------------------------------------------------
// Limpieza (T-57-28)
// ---------------------------------------------------------------------------

/** Quita sesiones, tokens, rutas del sistema y rayas largas o medias de cualquier cadena. */
export function limpia(value) {
  let t = String(value ?? '')
  t = t.replace(/set-cookie\s*[:=]\s*[^|\n]*/gi, '[omitido]')
  t = t.replace(/set-cookie/gi, '[omitido]')
  t = t.replace(/\b(?:authorization|x-api-key|cookie)\s*[:=]\s*[^|\n]*/gi, '[omitido]')
  t = t.replace(/\bBearer\s+[\w.~+/=-]+/gi, '[omitido]')
  t = t.replace(/\b(?:sk|pk|rk|re|ghp|gho|ghs|xox[abprs])[_-][A-Za-z0-9_-]{10,}/g, '[omitido]')
  t = t.replace(/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}/g, '[omitido]')
  t = t.replace(/\b[A-Fa-f0-9]{32,}\b/g, '[omitido]')
  t = t.replace(/\b(token|secret|password|api[_-]?key)\s*[=:]\s*\S+/gi, '$1=[omitido]')
  t = t.replace(/\/(?:Users|home)\/[^\s|)`"']+/g, '[ruta local]')
  t = t.replace(/[A-Za-z]:\\Users\\[^\s|)`"']+/g, '[ruta local]')
  t = t.replace(/—/g, ', ').replace(/–/g, '-')
  return t
}

const cell = (v) => limpia(v).replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim()
const ms = (n) => (typeof n === 'number' ? `${Math.round(n)} ms` : 'sin dato')
const kb = (n) => (typeof n === 'number' ? `${(n / 1024).toFixed(1)} KB` : 'sin dato')
const num = (n, d = 3) => (typeof n === 'number' ? String(Number(n.toFixed(d))) : 'sin dato')

// ---------------------------------------------------------------------------
// Evaluación: de los datos al modelo del reporte
// ---------------------------------------------------------------------------

/**
 * @param {object} data { meta, seo, legacy, a11y, perf, bundle, bundleBefore, steps, gate, manual }
 * Cualquier fuente puede ser null: un dato ausente es un bloqueo, nunca un PASS silencioso.
 */
export function evaluate(data) {
  const blockers = [] // { area, que, causa, clase }
  const accept = [] // { area, que, causa }
  const block = (area, que, causa, clase = 'defecto a corregir') => blockers.push({ area, que, causa, clase })

  // SEO
  const seo = { ok: false, sinDato: !data.seo, diffs: [], resumen: null, autor: [], redirectsFail: 0 }
  if (!data.seo) {
    block('SEO', 'No hay medición de paridad SEO', 'falta 57-final-seo-parity.json: el paso 57-seo-parity-all no corrió o falló antes de escribirlo')
  } else {
    seo.resumen = data.seo.total ?? null
    seo.diffs = (data.seo.diferencias ?? []).map((d) => ({ ...d, clase: d.clase ?? 'sin-clasificar' }))
    seo.autor = data.seo.presupuestoAutor ?? []
    for (const d of seo.diffs) {
      if (d.clase === 'b') accept.push({ area: 'SEO', que: `${d.path} (${d.field})`, causa: d.motivo || d.message })
      else block('SEO', `${d.path} (${d.field}): ${d.message}`, d.motivo || 'diferencia sin clasificar contra producción', d.clase === 'sin-clasificar' ? 'defecto a corregir (sin clasificar)' : 'defecto a corregir')
    }
    for (const a of seo.autor) if (a.ok === false) block('SEO', `HTML del autor ${a.path}: ${a.bytes} bytes contra un presupuesto de ${a.presupuesto}`, 'F5: el perfil del autor supera el presupuesto de peso')
    seo.ok = !blockers.some((b) => b.area === 'SEO')
  }

  // Barrido de clases Tailwind
  const legacy = { ok: false, sinDato: !data.legacy }
  if (!data.legacy) block('Render', 'No hay barrido de clases utilitarias', 'falta 57-final-legacy-sweep.json')
  else {
    legacy.gate = data.legacy.gate
    legacy.urls = data.legacy.urls?.length ?? 0
    legacy.fallos = (data.legacy.urls ?? []).filter((u) => (u.coincidencias ?? u.matches ?? 0) > 0 || u.ok === false || u.pass === false)
    legacy.control = (data.legacy.controlFailures ?? []).length
    legacy.ok = data.legacy.gate === 'PASS' && legacy.control === 0
    if (!legacy.ok) block('Render', `El barrido de clases utilitarias da ${data.legacy.gate} (${legacy.fallos.length} URLs, ${legacy.control} fallos de control)`, 'quedan clases de Tailwind en el HTML servido o el control positivo no es válido')
  }

  // Accesibilidad
  const a11y = { ok: false, sinDato: !data.a11y, plantillas: [] }
  if (!data.a11y) block('Accesibilidad', 'No hay barrido de accesibilidad', 'falta 57-final-a11y.json')
  else {
    const by = new Map()
    for (const r of data.a11y.results ?? []) {
      const key = r.template ?? r.url
      const row = by.get(key) ?? { plantilla: key, paginas: 0, violaciones: 0, problemas: 0, fallos: [] }
      row.paginas += 1
      row.violaciones += (r.violations ?? []).length
      row.problemas += (r.problems ?? []).length
      if (r.pass === false || (r.violations ?? []).length || (r.problems ?? []).length) {
        row.fallos.push(`${r.locale ?? ''} ${r.width ?? ''}px: ${[...(r.violations ?? []).map((v) => `axe ${v.id}`), ...(r.problems ?? [])].join('; ') || 'falla'}`.trim())
      }
      by.set(key, row)
    }
    a11y.plantillas = [...by.values()]
    for (const p of a11y.plantillas) if (p.fallos.length) block('Accesibilidad', `Plantilla ${p.plantilla}: ${p.violaciones} violaciones de axe y ${p.problemas} problemas de teclado`, p.fallos.slice(0, 3).join(' | '))
    a11y.ok = a11y.plantillas.length > 0 && a11y.plantillas.every((p) => p.fallos.length === 0)
    if (a11y.plantillas.length === 0) block('Accesibilidad', 'El barrido no trae resultados', 'results vacío')
  }

  // Rendimiento
  const perf = { ok: false, sinDato: !data.perf, filas: [], tolerancia: data.perf?.tolerance }
  if (!data.perf) block('Rendimiento', 'No hay comparación de rendimiento', 'falta 57-final-perf.json')
  else {
    for (const r of data.perf.results ?? []) {
      const m = r.summary?.medians ?? {}
      const v = r.summary?.verdict ?? {}
      const bad = Object.entries(v).filter(([, x]) => x && x.pass === false).map(([k]) => k)
      perf.filas.push({ path: r.path, preview: m.preview ?? {}, prod: m.prod ?? {}, verdict: v, bad, pass: r.summary?.pass !== false && bad.length === 0, inp: r.inp ?? null })
      for (const k of bad) block('Rendimiento', `${r.path}: ${k.toUpperCase()} peor que la tolerancia`, `mediana del preview ${k === 'cls' || k === 'a11y' ? num(m.preview?.[k === 'a11y' ? 'accessibilityScore' : k]) : ms(m.preview?.[k])} contra límite ${k === 'cls' || k === 'a11y' ? num(v[k]?.limit) : ms(v[k]?.limit)}`)
    }
    perf.lcp = data.perf.lcpElements ?? {}
    perf.ok = perf.filas.length > 0 && perf.filas.every((f) => f.pass)
    if (perf.filas.length === 0) block('Rendimiento', 'La comparación no trae resultados', 'results vacío')
  }

  // Bundle
  const bundle = { ok: false, sinDato: !data.bundle || !data.bundleBefore }
  if (bundle.sinDato) block('Bundle', 'Falta la medición del bundle antes o después', 'faltan 57-bundle-before.json o 57-final-bundle.json')
  else {
    const t = (o, k) => o.totals?.[k] ?? {}
    bundle.filas = ['css', 'js'].map((k) => ({ tipo: k.toUpperCase(), antes: t(data.bundleBefore, k), despues: t(data.bundle, k), crece: (t(data.bundle, k).raw ?? 0) > (t(data.bundleBefore, k).raw ?? 0) }))
    bundle.ok = bundle.filas.every((f) => !f.crece)
    for (const f of bundle.filas.filter((x) => x.crece)) block('Bundle', `El ${f.tipo} crece: ${kb(f.antes.raw)} a ${kb(f.despues.raw)}`, 'CAL-03 exige que el peso no crezca tras retirar Tailwind')
  }

  // Pasos del orquestador
  const steps = data.steps?.steps ?? []
  const OWNED = new Set(['57-seo-parity-all', '57-legacy-render-sweep', '57-a11y-sweep', '57-perf-compare', '57-bundle-weight'])
  for (const s of steps) {
    if (s.skipped || s.ok) continue
    if (OWNED.has(s.name)) continue // su veredicto sale de los datos, arriba
    block('Batería', `El paso ${s.name} da FAIL`, (s.failLines ?? []).slice(0, 3).join(' | ') || `salida ${s.code}`)
  }
  if (!data.steps) block('Batería', 'No hay registro de pasos de la batería', 'falta 57-final-steps.json')

  // F1 a F5 y F13
  const headers = steps.find((s) => s.name === '57-headers-check')
  const hdr = !headers ? 'Sin medir' : headers.ok ? 'Corregido' : 'FAIL'
  const hdrNote = !headers ? 'el paso 57-headers-check no está en el registro' : `57-headers-check ${headers.ok ? 'PASS' : 'FAIL'}`
  const lcpAll = Object.entries(perf.lcp ?? {})
  const lcpImg = lcpAll.filter(([, v]) => v.preview?.hasResource)
  const f4 = (data.seo?.enlaces?.fallos ?? []).filter((f) => f.clase !== 'b')
  const f5 = (data.seo?.presupuestoAutor ?? [])
  const findings = [
    { id: 'F1', nombre: 'TTFB y LCP del post con caché', estado: hdr, nota: `${hdrNote} (s-maxage presente y sin no-store en el post)` },
    { id: 'F2', nombre: 'Critical-CH y pista de tema', estado: hdr, nota: `${hdrNote} (sin accept-ch ni critical-ch fuera de /admin)` },
    { id: 'F3', nombre: 'Imagen LCP sin fetchpriority', estado: !lcpAll.length ? 'Sin medir' : lcpImg.length ? 'Revisar' : 'No aplica', nota: !lcpAll.length ? 'sin elementos LCP en la medición' : lcpImg.length ? `el LCP es una imagen en ${lcpImg.map(([p]) => p).join(', ')}` : 'el elemento LCP de las URLs medidas no es una imagen' },
    { id: 'F4', nombre: 'Enlaces a gemelos EN noindex', estado: !data.seo ? 'Sin medir' : f4.length ? 'FAIL' : 'Corregido', nota: !data.seo ? 'sin paridad' : `${f4.length} destinos con enlaces a gemelos noindex o rotos` },
    { id: 'F5', nombre: 'HTML del perfil de autor', estado: !f5.length ? 'Sin medir' : f5.every((a) => a.ok) ? 'Corregido' : 'FAIL', nota: f5.map((a) => `${a.path}: ${a.bytes} de ${a.presupuesto} bytes`).join('; ') || 'sin dato' },
    { id: 'F13', nombre: 'x-powered-by', estado: hdr, nota: hdrNote },
  ]
  for (const f of findings) if (f.estado === 'FAIL' || f.estado === 'Sin medir') {
    if (!blockers.some((b) => b.que.startsWith(`${f.id} `))) block('Hallazgos', `${f.id} ${f.nombre}: ${f.estado}`, f.nota)
  }

  // Gate de decisiones
  const gate = { sinDato: !data.gate, problemas: data.gate?.problems ?? [], advertencias: data.gate?.warnings ?? [], total: data.gate?.total ?? 0 }
  if (!data.gate) block('Gate de decisiones', 'No se pudo leer el gate de decisiones de la 56', 'falló 56-gate.ts --json', 'decisión de Juan')
  for (const p of gate.problemas) block('Gate de decisiones', p.split(':')[0], p, 'decisión de Juan')

  const porArea = (area) => blockers.filter((b) => b.area === area).length
  const areas = [
    ['SEO contra producción', seo, porArea('SEO')],
    ['Clases utilitarias en el HTML', legacy, porArea('Render')],
    ['Accesibilidad automática', a11y, porArea('Accesibilidad')],
    ['Rendimiento contra producción', perf, porArea('Rendimiento')],
    ['Peso del bundle', bundle, porArea('Bundle')],
    ['Hallazgos F1 a F5 y F13', { sinDato: false }, porArea('Hallazgos')],
    ['Batería de pasos', { sinDato: !data.steps }, porArea('Batería')],
    ['Gate de decisiones de la 56', gate, porArea('Gate de decisiones')],
  ].map(([nombre, o, n]) => ({ nombre, bloqueos: n, estado: o.sinDato ? 'SIN DATO' : n === 0 ? 'PASS' : 'FAIL' }))

  return { meta: data.meta ?? {}, seo, legacy, a11y, perf, bundle, steps, findings, gate, areas, blockers, accept, manual: data.manual ?? [] }
}

// ---------------------------------------------------------------------------
// Presentación
// ---------------------------------------------------------------------------

export function render(model) {
  const L = []
  const m = model.meta
  const bl = model.blockers
  L.push('# Reporte del gate de calidad de la fase 57')
  L.push('')
  L.push(`Generado: ${cell(m.generado ?? 'sin fecha')}. Preview: ${cell(m.preview ?? 'sin dato')}. Producción: ${cell(m.prod ?? 'sin dato')}. Commit del repo: ${cell(m.commit ?? 'sin dato')}.`)
  L.push('')
  L.push('Juan, este reporte reúne la medición final del preview contra producción. Todo es lectura por HTTP: no escribe en la base ni envía correos.')
  L.push('')
  L.push('## Resumen de una pantalla')
  L.push('')
  L.push(bl.length === 0
    ? 'Resultado: sin bloqueos automáticos. Quedan las aceptaciones por escrito y la revisión manual.'
    : `Resultado: el corte NO está listo. Hay ${bl.length} bloqueo(s), listados en "Bloquea el corte".`)
  L.push('')
  L.push('| Área | Estado | Bloqueos |')
  L.push('|---|---|---|')
  for (const a of model.areas) L.push(`| ${cell(a.nombre)} | ${a.estado === 'FAIL' ? '**FAIL**' : a.estado} | ${a.bloqueos} |`)
  L.push('')
  L.push(`Qué pasa: ${model.areas.filter((a) => a.estado === 'PASS').map((a) => a.nombre).join('; ') || 'ningún área en PASS'}.`)
  L.push('')
  L.push(`Qué falla: ${model.areas.filter((a) => a.estado !== 'PASS').map((a) => `${a.nombre} (${a.estado})`).join('; ') || 'nada'}.`)
  L.push('')
  L.push(`Qué necesita tu aceptación: ${model.accept.length} diferencia(s) legítima(s) y ${model.gate.problemas.length} decisión(es) pendiente(s).`)
  L.push('')

  L.push('## Bloquea el corte')
  L.push('')
  if (bl.length === 0) L.push('Nada bloquea el corte en la medición automática.')
  else {
    L.push('| Área | Qué | Causa | Clasificación |')
    L.push('|---|---|---|---|')
    for (const b of bl) L.push(`| ${cell(b.area)} | ${cell(b.que)} | ${cell(b.causa)} | ${cell(b.clase)} |`)
  }
  L.push('')
  L.push('## Diferencias que aceptas por escrito en 57-09')
  L.push('')
  if (model.accept.length === 0) L.push('Ninguna.')
  else {
    L.push('| Área | Qué | Causa |')
    L.push('|---|---|---|')
    for (const a of model.accept) L.push(`| ${cell(a.area)} | ${cell(a.que)} | ${cell(a.causa)} |`)
  }
  L.push('')

  L.push('## SEO por URL')
  L.push('')
  if (model.seo.sinDato) L.push('Sin dato.')
  else {
    const t = model.seo.resumen ?? {}
    L.push(`${t.urlsPass ?? '?'} de ${t.urlsRevisadas ?? '?'} URLs sin diferencias. Enlaces internos revisados: ${t.enlacesInternosRevisados ?? '?'}, con ${t.enlacesFail ?? '?'} fallo(s). Redirects revisados: ${t.redirectsRevisados ?? '?'}, con ${t.redirectsFail ?? '?'} distinto(s).`)
    L.push('')
    if (model.seo.diffs.length) {
      L.push('| URL | Campo | Diferencia | Clase | Motivo |')
      L.push('|---|---|---|---|---|')
      for (const d of model.seo.diffs) L.push(`| ${cell(d.path)} | ${cell(d.field)} | ${cell(String(d.message ?? '').slice(0, 300))} | ${cell(d.clase)} | ${cell(d.motivo)} |`)
    } else L.push('Sin diferencias contra producción.')
    L.push('')
    L.push('Clase a: defecto a corregir. Clase b: diferencia legítima que Juan acepta en 57-09. Sin clasificar: se trata como defecto.')
  }
  L.push('')

  L.push('## Accesibilidad por plantilla')
  L.push('')
  if (model.a11y.sinDato) L.push('Sin dato.')
  else {
    L.push('axe 4.12.1 con WCAG 2.2 AA y recorrido de Tab, en ES y EN, a 375 y 1280 px. Cubre una parte de WCAG; el resto va en la revisión manual.')
    L.push('')
    L.push('| Plantilla | Páginas medidas | Violaciones axe | Problemas de teclado | Estado |')
    L.push('|---|---|---|---|---|')
    for (const p of model.a11y.plantillas) L.push(`| ${p.fallos.length ? 'ROJO ' : ''}${cell(p.plantilla)} | ${p.paginas} | ${p.violaciones} | ${p.problemas} | ${p.fallos.length ? '**FAIL**' : 'PASS'} |`)
  }
  L.push('')

  L.push('## Rendimiento')
  L.push('')
  if (model.perf.sinDato) L.push('Sin dato.')
  else {
    L.push(`Lighthouse móvil, mediana por URL. Regla: LCP, TTFB y TBT del preview no superan producción más max(${num((model.perf.tolerancia ?? 0.1) * 100, 0)}%, 50 ms); CLS no supera max(producción, 0,1); accesibilidad de Lighthouse igual a 1.`)
    L.push('')
    L.push('| URL | LCP preview / prod (límite) | TTFB preview / prod (límite) | TBT preview / prod (límite) | CLS | A11y | Veredicto |')
    L.push('|---|---|---|---|---|---|---|')
    for (const f of model.perf.filas) {
      const p = f.preview, q = f.prod, v = f.verdict
      const mark = (k) => (v[k]?.pass === false ? ' **FAIL**' : '')
      L.push(`| ${f.pass ? '' : 'ROJO '}${cell(f.path)} | ${ms(p.lcp)} / ${ms(q.lcp)} (${ms(v.lcp?.limit)})${mark('lcp')} | ${ms(p.ttfb)} / ${ms(q.ttfb)} (${ms(v.ttfb?.limit)})${mark('ttfb')} | ${ms(p.tbt)} / ${ms(q.tbt)} (${ms(v.tbt?.limit)})${mark('tbt')} | ${num(p.cls)} / ${num(q.cls)}${mark('cls')} | ${num(p.accessibilityScore)}${mark('a11y')} | ${f.pass ? 'PASS' : '**FAIL**'} |`)
    }
    const inp = model.perf.filas.filter((f) => f.inp)
    if (inp.length) {
      L.push('')
      L.push('Proxy de INP medido con Playwright (no es INP de campo y no entra en la regla):')
      L.push('')
      L.push('| URL | Preview | Producción |')
      L.push('|---|---|---|')
      for (const f of inp) L.push(`| ${cell(f.path)} | ${ms(f.inp.preview?.proxyInpMs)} | ${ms(f.inp.prod?.proxyInpMs)} |`)
    }
  }
  L.push('')

  L.push('## Bundle antes y después del retiro de Tailwind')
  L.push('')
  if (model.bundle.sinDato) L.push('Sin dato.')
  else {
    L.push('| Tipo | Antes | Después | Gzip antes | Gzip después | Veredicto |')
    L.push('|---|---|---|---|---|---|')
    for (const f of model.bundle.filas) L.push(`| ${f.tipo} | ${kb(f.antes.raw)} | ${kb(f.despues.raw)} | ${kb(f.antes.gzip)} | ${kb(f.despues.gzip)} | ${f.crece ? '**FAIL**' : 'PASS'} |`)
  }
  L.push('')
  L.push(`Clases utilitarias en el HTML: ${model.legacy.sinDato ? 'sin dato' : `${model.legacy.gate} (${model.legacy.urls} URLs revisadas)`}.`)
  L.push('')

  L.push('## Hallazgos F1 a F5 y F13')
  L.push('')
  L.push('| Hallazgo | Estado | Evidencia |')
  L.push('|---|---|---|')
  for (const f of model.findings) L.push(`| ${f.id} ${cell(f.nombre)} | ${f.estado === 'FAIL' ? '**FAIL**' : f.estado} | ${cell(f.nota)} |`)
  L.push('')

  L.push('## Pasos de la batería')
  L.push('')
  if (!model.steps.length) L.push('Sin registro.')
  else {
    L.push('| Paso | Resultado | Detalle |')
    L.push('|---|---|---|')
    for (const s of model.steps) L.push(`| ${cell(s.name)} | ${s.skipped ? (s.ok ? 'SKIP' : 'FAIL') : s.ok ? 'PASS' : '**FAIL**'} | ${cell((s.failLines ?? []).slice(0, 2).join(' | '))} |`)
  }
  L.push('')

  L.push('## Estado del gate de decisiones de la 56')
  L.push('')
  if (model.gate.sinDato) L.push('Sin dato.')
  else {
    L.push(`${model.gate.total} decisiones en total. Problemas que impiden el corte: ${model.gate.problemas.length}. Advertencias (propuesto con gate propuesto, no bloquean): ${model.gate.advertencias.length}.`)
    L.push('')
    for (const p of model.gate.problemas) L.push(`- Bloquea: ${cell(p)}`)
    for (const w of model.gate.advertencias) L.push(`- Advertencia: ${cell(w)}`)
  }
  L.push('')

  L.push('## Lo que revisas a mano')
  L.push('')
  L.push('Lista completa de 57-A11Y-MANUAL.md. Ningún script prueba bien estos puntos. Las URLs apuntan al preview.')
  L.push('')
  if (!model.manual.length) L.push('No se pudo leer 57-A11Y-MANUAL.md.')
  for (const g of model.manual) {
    L.push(`### ${cell(g.titulo)}`)
    L.push('')
    for (const i of g.items) L.push(`- [ ] ${limpia(i)}`)
    L.push('')
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n'
}

/** Agrupa los ítems `- [ ]` de la lista manual por su encabezado de nivel 2. */
export function parseManual(md) {
  const groups = []
  let cur = null
  for (const line of String(md ?? '').split('\n')) {
    const h = line.match(/^##\s+(.+)$/)
    if (h) {
      cur = { titulo: h[1], items: [] }
      groups.push(cur)
      continue
    }
    const i = line.match(/^- \[ \]\s+(.+)$/)
    if (i && cur) cur.items.push(i[1])
  }
  return groups.filter((g) => g.items.length)
}

// ---------------------------------------------------------------------------
// Lectura de fuentes
// ---------------------------------------------------------------------------

function readJson(dir, name) {
  const p = join(dir, name)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

/** 56-gate.ts --json: lee los módulos de datos, sin base ni red. */
function readGate() {
  const r = spawnSync(join(ROOT, 'node_modules', '.bin', 'tsx'), ['scripts/verify/56-gate.ts', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 120_000 })
  try {
    const j = JSON.parse(r.stdout)
    return { total: j.total, problems: j.problems ?? [], warnings: j.warnings ?? [] }
  } catch {
    return null
  }
}

function gitHead() {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : 'sin dato'
}

export function collect({ evidenceDir, withGate = true }) {
  const read = (k) => readJson(evidenceDir, FILES[k])
  const manualPath = join(ROOT, MANUAL_FILE)
  return {
    meta: { generado: new Date().toISOString(), preview: process.env.BASE_URL ?? 'https://dev.juan-tech.com', prod: process.env.PROD_BASE ?? 'https://juan-tech.com', commit: gitHead() },
    seo: read('seo'),
    legacy: read('legacy'),
    a11y: read('a11y'),
    perf: read('perf'),
    bundle: read('bundle'),
    bundleBefore: read('bundleBefore'),
    steps: read('steps'),
    gate: withGate ? readGate() : null,
    manual: existsSync(manualPath) ? parseManual(readFileSync(manualPath, 'utf8')) : [],
  }
}

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

function synthetic() {
  const medians = (lcp, ttfb, tbt, cls = 0) => ({ lcp, ttfb, tbt, cls, accessibilityScore: 1 })
  const okVerdict = { lcp: { pass: true, limit: 5000 }, ttfb: { pass: true, limit: 400 }, tbt: { pass: true, limit: 80 }, cls: { pass: true, limit: 0.1 }, a11y: { pass: true, limit: 1 } }
  return {
    meta: { generado: '2026-11-24T00:00:00Z', preview: 'https://p.test', prod: 'https://prod.test', commit: 'f00d777' },
    seo: {
      total: { urlsPass: 10, urlsRevisadas: 11, enlacesInternosRevisados: 5, enlacesFail: 0, redirectsRevisados: 2, redirectsFail: 0 },
      diferencias: [{ path: '/blog/general', field: 'palabras', message: 'palabras en main: 120 contra 135', clase: 'b', motivo: 'Categoria vacia — Juan lo acepta' }],
      enlaces: { fallos: [] },
      presupuestoAutor: [{ path: '/authors/x', bytes: 360000, presupuesto: 500000, ok: true }],
    },
    legacy: { gate: 'PASS', urls: [{ path: '/', coincidencias: 0 }], controlFailures: [] },
    a11y: { results: [{ template: 'home', locale: 'es', width: 375, violations: [], problems: [], pass: true }] },
    perf: {
      tolerance: 0.1,
      lcpElements: { '/': { preview: { hasResource: false }, prod: { hasResource: true } } },
      results: [{ path: '/', summary: { medians: { preview: medians(2600, 286, 60), prod: medians(5100, 319, 24) }, verdict: okVerdict, pass: true }, inp: { preview: { proxyInpMs: 168 }, prod: { proxyInpMs: 64 } } }],
    },
    bundle: { totals: { css: { raw: 9000, gzip: 2000 }, js: { raw: 1200000, gzip: 400000 } } },
    bundleBefore: { totals: { css: { raw: 54000, gzip: 10000 }, js: { raw: 1275000, gzip: 416000 } } },
    steps: { steps: [{ name: '57-headers-check', ok: true, code: 0 }, { name: '57-seo-parity-all', ok: false, code: 1, failLines: ['FAIL x'] }] },
    gate: { total: 100, problems: [], warnings: ['D-11-lead: propuesto'] },
    manual: [{ titulo: '1. Teclado y foco', items: ['La primera pulsacion de Tab muestra el enlace de salto.'] }],
  }
}

function selftest() {
  let bad = 0
  const check = (ok, label, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'} selftest ${label}${ok ? '' : `: ${extra}`}`)
    if (!ok) bad += 1
  }
  const SECCIONES = ['## Resumen de una pantalla', '## Bloquea el corte', '## SEO por URL', '## Accesibilidad por plantilla', '## Rendimiento', '## Bundle antes y después', '## Hallazgos F1 a F5 y F13', '## Estado del gate de decisiones', '## Lo que revisas a mano']

  // Test 3: secciones, sin sesión ni tokens, sin rayas.
  const d = synthetic()
  d.seo.diferencias[0].motivo += ' set-cookie: sid=abc123; HttpOnly ghp_AbCdEf0123456789AbCdEf0123456789 /Users/juan/secreto/x.txt Bearer abc.def.ghi'
  d.steps.steps[1].failLines = ['FAIL authorization: Bearer zzz9 token=sk_live_ABCDEFGHIJKLMNOP']
  const md = render(evaluate(d))
  const faltan = SECCIONES.filter((s) => !md.includes(s))
  check(faltan.length === 0, 'test 3: el reporte trae todas las secciones', `faltan ${faltan.join(', ')}`)
  check(!/set-cookie/i.test(md), 'test 3b: el reporte no contiene set-cookie')
  check(!/ghp_|sk_live|Bearer|authorization|\/Users\/|abc123/i.test(md), 'test 3c: el reporte no contiene tokens, sesiones ni rutas del sistema')
  check(!/[a-f0-9]{32,}/i.test(md), 'test 3d: el reporte no contiene valores largos que parezcan token')
  check(!/[—–]/.test(md), 'test 3e: el reporte no contiene rayas largas ni medias')
  check(md.includes('sin bloqueos automáticos') && !evaluate(d).blockers.length, 'test 3f: datos sanos no bloquean (la diferencia clase b se acepta, no bloquea)', JSON.stringify(evaluate(d).blockers))
  check(md.includes('## Diferencias que aceptas') && evaluate(d).accept.length === 1, 'test 3g: la diferencia legítima aparece para aceptar')

  // Test 4: violación de axe y LCP peor que la tolerancia.
  const e = synthetic()
  e.a11y.results.push({ template: 'contacto', locale: 'es', width: 1280, violations: [{ id: 'color-contrast', nodes: 2 }], problems: [], pass: false })
  e.perf.results[0].summary.verdict.lcp = { pass: false, limit: 3000 }
  e.perf.results[0].summary.pass = false
  const m2 = evaluate(e)
  const md2 = render(m2)
  const sec = md2.split('## Bloquea el corte')[1].split('\n## ')[0]
  check(sec.includes('contacto') && sec.includes('color-contrast'), 'test 4: la violación de axe aparece en Bloquea el corte', sec.slice(0, 200))
  check(sec.includes('LCP peor que la tolerancia'), 'test 4b: el LCP peor que la tolerancia aparece en Bloquea el corte')
  check(/\| ROJO contacto /.test(md2) && /\| ROJO \/ \|/.test(md2), 'test 4c: las filas fallidas se marcan en rojo')
  check(md2.includes('el corte NO está listo'), 'test 4d: el resumen dice que el corte no está listo')

  // Datos ausentes y bundle que crece: nunca PASS silencioso.
  const f = synthetic()
  f.seo = null
  f.bundle.totals.js.raw = 1275001
  const m3 = evaluate(f)
  check(m3.blockers.some((b) => b.area === 'SEO') && m3.blockers.some((b) => b.area === 'Bundle'), 'test 5: un dato ausente y un bundle que crece bloquean')
  // Diferencia sin clasificar es defecto.
  const g = synthetic()
  g.seo.diferencias.push({ path: '/x', field: 'title', message: 'distinto' })
  check(evaluate(g).blockers.some((b) => b.que.startsWith('/x')), 'test 5b: una diferencia sin clasificar bloquea')
  // Gate de decisiones.
  const h = synthetic()
  h.gate.problems = ['CUT-legal-date-efectiva: estado pendiente']
  check(evaluate(h).blockers.some((b) => b.clase === 'decisión de Juan'), 'test 5c: una decisión pendiente bloquea como decisión de Juan')
  // Lista manual.
  const pm = parseManual('## 1. A\n- [ ] uno\n- [ ] dos\n## Hallazgos\ntexto\n## 2. B\n- [ ] tres\n')
  check(pm.length === 2 && pm[0].items.length === 2, 'test 6: parseManual agrupa los ítems por encabezado')
  console.log(bad === 0 ? 'PASS selftest 57-gate-report' : `FAIL selftest 57-gate-report (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def)
  if (args.includes('--selftest')) process.exit(selftest())
  const evidenceDir = resolve(ROOT, opt('--evidence', EVIDENCE_DIR))
  const out = resolve(ROOT, opt('--out', REPORT_FILE))
  const model = evaluate(collect({ evidenceDir, withGate: !args.includes('--no-gate') }))
  writeFileSync(out, render(model))
  console.log(`Reporte escrito en ${out.replace(ROOT + '/', '')}`)
  console.log(`${model.blockers.length === 0 ? 'PASS' : 'FAIL'} 57-gate-report: ${model.blockers.length} bloqueo(s), ${model.accept.length} aceptación(es) pendiente(s)`)
  process.exit(0)
}
