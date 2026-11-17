/**
 * READ-ONLY. Comparación de rendimiento preview contra producción (CAL-02, D-03).
 *
 * Por URL: una petición de calentamiento por entorno, luego N corridas (5 por
 * defecto) de Lighthouse móvil intercaladas (preview, producción, preview...),
 * siempre de una en una porque preview y producción comparten VPS y base.
 * Reporta la mediana de LCP, TTFB, TBT y CLS, el elemento LCP, el peso de HTML y
 * JS, el puntaje de accesibilidad (CAL-01 lo exige en 1,00) y la cabecera
 * x-nextjs-cache de cada corrida.
 *
 * Lighthouse corre solo con las categorías performance y accessibility: en el
 * preview la categoría de búsqueda falla is-crawlable porque es noindex por
 * diseño. Usa el CLI local de node_modules, nunca PageSpeed Insights (429).
 *
 * INP no se mide en laboratorio. El script lo aproxima con Playwright: abre el
 * menú y el selector de idioma y lee PerformanceObserver de eventos con
 * durationThreshold de 16 ms. Se imprime como "proxy de INP" (supuesto A5).
 *
 * Regla de no empeorar (PERF_TOLERANCE, por defecto 0.10, la confirma Juan en 57-05):
 *   LCP, TTFB y TBT: mediana preview <= (1 + tolerancia) x mediana producción
 *   CLS: mediana preview <= max(mediana producción, 0,1)
 *
 * Uso:
 *   node scripts/verify/57-perf-compare.mjs --selftest
 *   PREVIEW_BASE=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com \
 *     node scripts/verify/57-perf-compare.mjs --out evidence/57-perf-baseline.json
 *
 * Opciones: --runs N, --paths /,/en (lista separada por comas), --no-inp, --out <archivo>
 * Sin base de datos: solo GET a páginas públicas.
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)

export const CATEGORIES = ['performance', 'accessibility']
export const METRICS = ['lcp', 'ttfb', 'tbt', 'cls']
const DEFAULT_TOLERANCE = 0.1
const CLS_FLOOR = 0.1

// ---------------------------------------------------------------------------
// Lógica pura
// ---------------------------------------------------------------------------

export function median(values) {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b)
  if (v.length === 0) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/** Veredicto de una métrica. Devuelve { pass, limit }. */
export function judgeMetric(metric, preview, prod, tolerance = DEFAULT_TOLERANCE) {
  if (preview == null || prod == null) return { pass: false, limit: null, reason: 'sin dato' }
  if (metric === 'cls') {
    const limit = Math.max(prod, CLS_FLOOR)
    return { pass: preview <= limit, limit }
  }
  const limit = prod * (1 + tolerance)
  return { pass: preview <= limit, limit }
}

export function lighthouseArgs(url, outputPath) {
  return [
    url,
    '--output=json',
    `--output-path=${outputPath}`,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--quiet',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
  ]
}

/** Busca el primer objeto `node` dentro de los detalles de un audit. */
function findNode(details) {
  if (!details || typeof details !== 'object') return null
  if (details.node && typeof details.node === 'object') return details.node
  if (details.type === 'node') return details
  for (const v of Object.values(details)) {
    const items = Array.isArray(v) ? v : [v]
    for (const it of items) {
      const n = findNode(it)
      if (n) return n
    }
  }
  return null
}

/** Extrae lo que el gate necesita de un LHR (JSON de Lighthouse). */
export function extractRun(lhr) {
  const a = lhr.audits ?? {}
  const num = (id) => (typeof a[id]?.numericValue === 'number' ? a[id].numericValue : null)
  // Lighthouse 13 movió el elemento LCP al insight lcp-breakdown-insight; el audit viejo queda de respaldo.
  const node = findNode(a['lcp-breakdown-insight']?.details) ?? findNode(a['largest-contentful-paint-element']?.details)
  const subparts = (a['lcp-breakdown-insight']?.details?.items ?? [])
    .filter((i) => i.type === 'table')
    .flatMap((t) => t.items ?? [])
    .map((i) => ({ subpart: i.subpart ?? i.label, ms: i.duration ?? null }))
  const requests = a['network-requests']?.details?.items ?? []
  const doc = requests.find((r) => r.resourceType === 'Document')
  const scripts = requests.filter((r) => r.resourceType === 'Script')
  const sum = (arr, k) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0)
  return {
    lcp: num('largest-contentful-paint'),
    ttfb: num('server-response-time'),
    tbt: num('total-blocking-time'),
    cls: num('cumulative-layout-shift'),
    fcp: num('first-contentful-paint'),
    performanceScore: lhr.categories?.performance?.score ?? null,
    accessibilityScore: lhr.categories?.accessibility?.score ?? null,
    lcpElement: node
      ? {
          selector: node.selector ?? null,
          nodeLabel: node.nodeLabel ?? null,
          snippet: node.snippet ?? null,
          // Con carga de recurso (resourceLoadDelay o resourceLoadDuration) el LCP es una imagen.
          hasResource: subparts.some((s) => /resourceLoad/.test(s.subpart ?? '')),
          subparts,
        }
      : null,
    htmlTransfer: doc?.transferSize ?? null,
    htmlResource: doc?.resourceSize ?? null,
    jsTransfer: sum(scripts, 'transferSize'),
    jsResource: sum(scripts, 'resourceSize'),
    totalByteWeight: num('total-byte-weight'),
    lighthouseVersion: lhr.lighthouseVersion ?? null,
  }
}

const lcpKind = (el) => {
  if (!el) return 'desconocido'
  const s = `${el.snippet ?? ''}`.toLowerCase()
  if (s.startsWith('<img') || s.startsWith('<picture') || s.startsWith('<video') || s.startsWith('<svg')) return 'imagen'
  if (/background-image/.test(s) || el.hasResource) return 'imagen (recurso cargado)'
  return 'texto o bloque sin recurso'
}

export function summarize(runs, tolerance) {
  const out = {}
  for (const env of ['preview', 'prod']) {
    const list = runs.filter((r) => r.env === env && r.metrics)
    const med = {}
    for (const k of [...METRICS, 'fcp', 'performanceScore', 'accessibilityScore', 'htmlTransfer', 'htmlResource', 'jsTransfer', 'jsResource', 'totalByteWeight']) {
      med[k] = median(list.map((r) => r.metrics[k]))
    }
    const elements = list.map((r) => r.metrics.lcpElement?.selector ?? r.metrics.lcpElement?.snippet ?? null)
    const top = elements.filter(Boolean).sort((x, y) => elements.filter((e) => e === y).length - elements.filter((e) => e === x).length)[0]
    const topRun = list.find((r) => (r.metrics.lcpElement?.selector ?? r.metrics.lcpElement?.snippet) === top)
    med.lcpElement = topRun?.metrics.lcpElement ?? null
    med.lcpKind = lcpKind(med.lcpElement)
    med.cache = list.map((r) => r.cache)
    med.runs = list.length
    out[env] = med
  }
  const verdict = {}
  for (const m of METRICS) verdict[m] = judgeMetric(m, out.preview[m], out.prod[m], tolerance)
  verdict.a11y = { pass: out.preview.accessibilityScore === 1, limit: 1 }
  return { medians: out, verdict, pass: Object.values(verdict).every((v) => v.pass) }
}

// ---------------------------------------------------------------------------
// Medición
// ---------------------------------------------------------------------------

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  try {
    const p = chromium.executablePath()
    if (p && existsSync(p)) return p
  } catch {}
  return undefined
}

function runLighthouse(url) {
  const dir = mkdtempSync(join(tmpdir(), 'lh57-'))
  const outFile = join(dir, 'lhr.json')
  const cli = join(dirname(require.resolve('lighthouse/package.json')), 'cli', 'index.js')
  return new Promise((resolve) => {
    const env = { ...process.env }
    const cp = chromePath()
    if (cp) env.CHROME_PATH = cp
    const child = spawn(process.execPath, [cli, ...lighthouseArgs(url, outFile)], { env, stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), 180000)
    child.on('close', (code) => {
      clearTimeout(timer)
      try {
        const lhr = JSON.parse(readFileSync(outFile, 'utf8'))
        if (lhr.runtimeError) resolve({ error: `${lhr.runtimeError.code}: ${lhr.runtimeError.message}` })
        else resolve({ lhr })
      } catch {
        resolve({ error: `lighthouse salió ${code}: ${stderr.trim().split('\n').slice(-2).join(' ')}` })
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })
  })
}

async function fetchCacheHeader(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'juan-tech-57-perf-compare' } })
    const cache = res.headers.get('x-nextjs-cache') ?? 'sin cabecera'
    await res.arrayBuffer()
    return `${res.status} ${cache}`
  } catch (err) {
    return `error ${err.message}`
  }
}

/** Proxy de INP: interacciones de menú y selector de idioma a 375 px con CPU x4. */
async function inpProxy(browser, url) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.__inp57 = []
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (e.interactionId) window.__inp57.push({ name: e.name, duration: e.duration, id: e.interactionId })
      }).observe({ type: 'event', durationThreshold: 16, buffered: true })
    } catch {}
  })
  const notes = []
  try {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(url, { waitUntil: 'load', timeout: 60000 })
    await page.waitForTimeout(1000)
    // Menú del rediseño (aria-controls="menu-movil") o, en el sitio viejo, el primer botón con aria-expanded visible.
    let menu = page.locator('button[aria-controls="menu-movil"]').first()
    if (!(await menu.count())) menu = page.locator('header button[aria-expanded]:visible, button[aria-label*="men" i]:visible').first()
    if (await menu.count()) {
      await menu.click()
      await page.waitForTimeout(400)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else notes.push('sin botón de menú')
    let lang = page.locator('button[aria-controls="menu-idioma"]').first()
    if (!(await lang.count())) lang = page.locator('button[aria-label*="idioma" i], button[aria-label*="language" i]').first()
    if ((await lang.count()) && (await lang.isVisible())) {
      await lang.click()
      await page.waitForTimeout(400)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else notes.push('selector de idioma no visible a 375 px')
    const entries = await page.evaluate(() => window.__inp57)
    const byId = new Map()
    for (const e of entries) byId.set(e.id, Math.max(byId.get(e.id) ?? 0, e.duration))
    const worst = byId.size ? Math.max(...byId.values()) : null
    return { proxyInpMs: worst, interactions: byId.size, notes }
  } catch (err) {
    return { proxyInpMs: null, interactions: 0, notes: [...notes, `error ${err.message.split('\n')[0]}`] }
  } finally {
    await context.close()
  }
}

async function sitemapServicePath(prod) {
  try {
    const xml = await (await fetch(`${prod}/sitemap.xml`, { signal: AbortSignal.timeout(30000) })).text()
    const paths = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/+$/, ''))
    return paths.find((p) => /^\/servicios\/[^/]+$/.test(p)) ?? '/servicios/seo-technical-audit'
  } catch {
    return '/servicios/seo-technical-audit'
  }
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------

const fmt = (m, v) => {
  if (v == null) return 'sin dato'
  if (m === 'cls') return v.toFixed(3)
  return `${Math.round(v)} ms`
}
const kb = (v) => (v == null ? 'sin dato' : `${(v / 1024).toFixed(1)} KB`)

function printTable(results, tolerance) {
  console.log(`\n== Rendimiento: mediana preview contra producción (tolerancia ${(tolerance * 100).toFixed(0)}%) ==`)
  for (const r of results) {
    const { medians: md, verdict } = r.summary
    console.log(`\n${r.summary.pass ? 'PASS' : 'FAIL'} ${r.path} (${md.preview.runs} y ${md.prod.runs} corridas)`)
    console.log('  Métrica | Preview | Producción | Límite | Veredicto')
    for (const m of METRICS) {
      const v = verdict[m]
      console.log(`  ${m.toUpperCase()} | ${fmt(m, md.preview[m])} | ${fmt(m, md.prod[m])} | ${fmt(m, v.limit)} | ${v.pass ? 'PASS' : 'FAIL'}`)
    }
    console.log(`  Accesibilidad Lighthouse | ${md.preview.accessibilityScore ?? 'sin dato'} | ${md.prod.accessibilityScore ?? 'sin dato'} | 1 | ${verdict.a11y.pass ? 'PASS' : 'FAIL'} (CAL-01)`)
    console.log(`  Peso HTML transferido | ${kb(md.preview.htmlTransfer)} | ${kb(md.prod.htmlTransfer)}`)
    console.log(`  Peso JS transferido | ${kb(md.preview.jsTransfer)} | ${kb(md.prod.jsTransfer)}`)
    console.log(`  Elemento LCP preview: ${md.preview.lcpKind}, ${md.preview.lcpElement?.selector ?? 'sin dato'}`)
    console.log(`  Elemento LCP producción: ${md.prod.lcpKind}, ${md.prod.lcpElement?.selector ?? 'sin dato'}`)
    console.log(`  x-nextjs-cache preview: ${md.preview.cache.join(', ')}`)
    console.log(`  x-nextjs-cache producción: ${md.prod.cache.join(', ')}`)
    if (r.inp) {
      console.log(`  Proxy de INP (no es INP de campo): preview ${fmt('inp', r.inp.preview?.proxyInpMs)}, producción ${fmt('inp', r.inp.prod?.proxyInpMs)}`)
    }
  }
}

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest()
  const previewBase = (process.env.PREVIEW_BASE ?? 'https://dev.juan-tech.com').replace(/\/+$/, '')
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/+$/, '')
  const tolerance = process.env.PERF_TOLERANCE != null ? Number(process.env.PERF_TOLERANCE) : DEFAULT_TOLERANCE
  const runsPerEnv = Number(argValue('--runs') ?? 5)
  const out = argValue('--out')
  const paths = argValue('--paths')?.split(',') ?? ['/', '/en', await sitemapServicePath(prodBase), '/blog/seo/estrategia-seo']
  const withInp = !process.argv.includes('--no-inp')

  console.log(`Lighthouse móvil, ${runsPerEnv} corridas intercaladas por entorno, categorías ${CATEGORIES.join(' y ')}`)
  console.log(`Preview ${previewBase} contra producción ${prodBase}; rutas ${paths.join(', ')}`)

  const results = []
  for (const path of paths) {
    const urls = { preview: previewBase + path, prod: prodBase + path }
    const warm = { preview: await fetchCacheHeader(urls.preview), prod: await fetchCacheHeader(urls.prod) }
    console.log(`\n${path}: calentamiento preview ${warm.preview}, producción ${warm.prod}`)
    const runs = []
    for (let i = 0; i < runsPerEnv; i++) {
      for (const env of ['preview', 'prod']) {
        const cache = await fetchCacheHeader(urls[env])
        const res = await runLighthouse(urls[env])
        const metrics = res.lhr ? extractRun(res.lhr) : null
        runs.push({ env, run: i + 1, cache, metrics, error: res.error ?? null })
        console.log(`  corrida ${i + 1} ${env}: ${metrics ? `LCP ${fmt('lcp', metrics.lcp)}, TTFB ${fmt('ttfb', metrics.ttfb)}, TBT ${fmt('tbt', metrics.tbt)}, CLS ${fmt('cls', metrics.cls)}` : res.error} (${cache})`)
      }
    }
    let inp = null
    if (withInp) {
      const browser = await chromium.launch()
      try {
        inp = { preview: await inpProxy(browser, urls.preview), prod: await inpProxy(browser, urls.prod) }
      } finally {
        await browser.close()
      }
    }
    results.push({ path, warm, runs, inp, summary: summarize(runs, tolerance) })
  }

  printTable(results, tolerance)
  const pass = results.every((r) => r.summary.pass)
  if (out) {
    mkdirSync(dirname(out), { recursive: true })
    const lcpElements = Object.fromEntries(
      results.map((r) => [r.path, { preview: { kind: r.summary.medians.preview.lcpKind, ...r.summary.medians.preview.lcpElement }, prod: { kind: r.summary.medians.prod.lcpKind, ...r.summary.medians.prod.lcpElement } }]),
    )
    writeFileSync(
      out,
      JSON.stringify(
        {
          measuredAt: new Date().toISOString(),
          previewBase,
          prodBase,
          tolerance,
          runsPerEnv,
          categories: CATEGORIES,
          lighthouseVersion: results[0]?.runs.find((r) => r.metrics)?.metrics.lighthouseVersion ?? null,
          rule: 'LCP, TTFB y TBT: mediana preview <= (1 + tolerancia) x producción; CLS <= max(producción, 0,1); accesibilidad Lighthouse = 1',
          inpNote: 'proxy de INP medido con Playwright (menú y selector de idioma, CPU x4); no es INP de campo',
          lcpElements,
          pass,
          results,
        },
        null,
        2,
      ) + '\n',
    )
    console.log(`\nJSON escrito en ${out}`)
  }
  console.log(pass ? '\nPASS: el preview no empeora frente a producción' : '\nFAIL: al menos una métrica empeora o falta dato')
  process.exit(pass ? 0 : 1)
}

// ---------------------------------------------------------------------------
// Autoprueba (sin red)
// ---------------------------------------------------------------------------

function selftest() {
  let failed = 0
  const check = (ok, label) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
    if (!ok) failed++
  }
  // Test 1: mediana.
  check(median([900, 100, 500, 300, 700]) === 500 && median([500, 300, 100, 900, 700]) === 500, 'test 1: la mediana de cinco es el tercero ordenado y no depende del orden')
  check(median([1, null, 3]) === 2 && median([]) === null, 'test 1b: la mediana ignora huecos y devuelve null sin datos')
  // Test 2: tolerancia.
  check(judgeMetric('lcp', 1090, 1000).pass === true, 'test 2: LCP preview 1,09 x producción pasa')
  check(judgeMetric('lcp', 1110, 1000).pass === false, 'test 2b: LCP preview 1,11 x producción falla')
  check(judgeMetric('lcp', 1110, 1000, 0.2).pass === true, 'test 2c: con tolerancia 0,2 la misma cifra pasa')
  check(judgeMetric('ttfb', 1200, 1000).pass === false && judgeMetric('tbt', 100, 100).pass === true, 'test 2d: TTFB y TBT usan la misma regla')
  check(judgeMetric('lcp', null, 1000).pass === false, 'test 2e: un dato faltante no pasa')
  // Test 3: CLS.
  check(judgeMetric('cls', 0.08, 0.02).pass === true, 'test 3: CLS 0,08 con producción 0,02 pasa (tope 0,1)')
  check(judgeMetric('cls', 0.12, 0.02).pass === false, 'test 3b: CLS 0,12 con producción 0,02 falla')
  check(judgeMetric('cls', 0.15, 0.2).pass === true, 'test 3c: CLS por debajo de una producción peor que 0,1 pasa')
  // Test 4: categorías.
  const args = lighthouseArgs('https://example.test/', '/tmp/x.json')
  const cat = args.find((a) => a.startsWith('--only-categories='))
  check(cat === '--only-categories=performance,accessibility', 'test 4: Lighthouse recibe solo performance y accessibility')
  check(!/\bseo\b|best-practices/.test(cat), 'test 4b: nunca la categoría de búsqueda ni best-practices')
  // Extracción de un LHR de ejemplo.
  const lhr = {
    lighthouseVersion: '13.4.1',
    categories: { performance: { score: 0.91 }, accessibility: { score: 1 } },
    audits: {
      'largest-contentful-paint': { numericValue: 2100 },
      'server-response-time': { numericValue: 300 },
      'total-blocking-time': { numericValue: 120 },
      'cumulative-layout-shift': { numericValue: 0.01 },
      'first-contentful-paint': { numericValue: 1200 },
      'total-byte-weight': { numericValue: 500000 },
      // Forma de Lighthouse 13: tabla de subpartes y nodo dentro del insight.
      'lcp-breakdown-insight': {
        details: {
          type: 'list',
          items: [
            { type: 'table', items: [{ subpart: 'timeToFirstByte', duration: 300 }, { subpart: 'elementRenderDelay', duration: 700 }] },
            { type: 'node', selector: 'main > h1', nodeLabel: 'Hola', snippet: '<h1 class="x">' },
          ],
        },
      },
      'network-requests': {
        details: {
          items: [
            { resourceType: 'Document', transferSize: 50000, resourceSize: 200000 },
            { resourceType: 'Script', transferSize: 10000, resourceSize: 30000 },
            { resourceType: 'Script', transferSize: 5000, resourceSize: 15000 },
            { resourceType: 'Stylesheet', transferSize: 9000, resourceSize: 40000 },
          ],
        },
      },
    },
  }
  const m = extractRun(lhr)
  check(m.lcp === 2100 && m.ttfb === 300 && m.tbt === 120 && m.cls === 0.01 && m.accessibilityScore === 1, 'test 5: métricas extraídas del JSON de Lighthouse')
  check(m.lcpElement?.selector === 'main > h1' && lcpKind(m.lcpElement) === 'texto o bloque sin recurso' && m.lcpElement.subparts.length === 2, 'test 5b: elemento LCP del insight de Lighthouse 13 y su tipo (texto)')
  check(lcpKind({ snippet: '<div class="x">', hasResource: true }) === 'imagen (recurso cargado)', 'test 5e: un bloque con carga de recurso cuenta como imagen')
  check(m.htmlTransfer === 50000 && m.jsTransfer === 15000 && m.jsResource === 45000, 'test 5c: peso de HTML y JS desde network-requests')
  check(lcpKind({ snippet: '<img src="a.webp">' }) === 'imagen', 'test 5d: un img como LCP se clasifica como imagen')
  // Resumen completo.
  const mk = (env, lcp, a11y = 1) => ({ env, cache: 'HIT', metrics: { ...m, lcp, accessibilityScore: a11y } })
  const runs = [mk('preview', 2000), mk('prod', 2000), mk('preview', 2050), mk('prod', 1900), mk('preview', 2500), mk('prod', 2100)]
  const s = summarize(runs, 0.1)
  check(s.pass === true && s.medians.preview.lcp === 2050 && s.medians.prod.lcp === 2000, 'test 6: resumen con mediana por entorno y veredicto PASS')
  const s2 = summarize([...runs.slice(0, 5), mk('prod', 2100)].map((r, i) => (i === 0 ? { ...r, metrics: { ...r.metrics, accessibilityScore: 0.96 } } : r)), 0.1)
  check(s2.medians.preview.accessibilityScore === 1, 'test 6b: la mediana de accesibilidad absorbe una corrida suelta')
  const s3 = summarize(runs.map((r) => (r.env === 'preview' ? { ...r, metrics: { ...r.metrics, accessibilityScore: 0.96 } } : r)), 0.1)
  check(s3.pass === false && s3.verdict.a11y.pass === false, 'test 6c: accesibilidad por debajo de 1 falla (CAL-01)')
  console.log(failed ? `\nSELFTEST FAIL (${failed})` : '\nSELFTEST PASS')
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
