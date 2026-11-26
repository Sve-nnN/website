/**
 * Costo de hidratacion por ruta (fase 60). Solo lectura: GET contra uno o dos
 * servidores ya levantados. No necesita base ni build propios.
 *
 * Dos grupos de metricas:
 *
 *   Deterministas (no dependen de la carga de la maquina):
 *     - bytes de HTML (crudo y gzip) y bytes del payload RSC en linea
 *     - bytes de JS descargados (cuerpo sin comprimir) y numero de archivos
 *     - elementos del DOM
 *     - fibras de React tras hidratar: total, compuestas (funciones, forwardRef,
 *       memo, contextos) y de DOM. Las fibras compuestas son el trabajo que un
 *       Server Component quita del cliente.
 *
 *   De tiempo (ruidosas): ScriptDuration, TaskDuration, RecalcStyleDuration y
 *     bloqueo total (suma de lo que cada tarea larga pasa de 50 ms), con CPU
 *     frenada. Con dos servidores las corridas se intercalan A, B, A, B para que
 *     una subida de carga afecte a los dos por igual. Cada corrida anota la carga
 *     media de 1 minuto.
 *
 * Uso:
 *   node scripts/verify/60-hydration-metrics.mjs --base antes=http://localhost:3601 \
 *     --base despues=http://localhost:3602 --runs 15 --cpu 4 --out /ruta/salida.json
 *
 * Opciones: --routes /a,/b ; --runs 0 mide solo lo determinista.
 */
import { writeFileSync } from 'node:fs'
import { loadavg } from 'node:os'
import { gzipSync } from 'node:zlib'

import { chromium } from 'playwright'

const DEFAULT_ROUTES = [
  '/sobre-mi',
  '/blog',
  '/blog/seo',
  '/blog/seo/estrategia-seo',
  '/case-studies/immigration-law-atlanta-seo',
  '/contact',
]

const args = process.argv.slice(2)
const all = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []))
const one = (name, fallback) => all(name)[0] ?? fallback

const bases = all('--base').map((entry) => {
  const at = entry.indexOf('=')
  return { name: entry.slice(0, at), url: entry.slice(at + 1).replace(/\/$/, '') }
})
if (bases.length === 0) {
  console.error('Falta --base nombre=http://host:puerto')
  process.exit(1)
}
const routes = one('--routes', DEFAULT_ROUTES.join(',')).split(',').filter(Boolean)
const runs = Number(one('--runs', '15'))
const cpu = Number(one('--cpu', '4'))
const out = one('--out', null)

const median = (values) => {
  const s = [...values].sort((a, b) => a - b)
  if (s.length === 0) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const quantile = (values, q) => {
  const s = [...values].sort((a, b) => a - b)
  if (s.length === 0) return null
  const pos = (s.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return s[lo] + (s[hi] - s[lo]) * (pos - lo)
}

/** Recorre el arbol de fibras vigente desde la raiz hidratada sobre `document`. */
function countFibers() {
  const key = Object.keys(document).find((k) => k.startsWith('__reactContainer'))
  if (!key) return null
  const root = document[key].stateNode.current
  const result = { total: 0, composite: 0, host: 0, text: 0 }
  // Tags de React 19: 0 funcion, 1 clase, 9 consumidor, 10 proveedor, 11 forwardRef,
  // 14 y 15 memo; 5, 26 y 27 elementos del DOM; 6 texto.
  const composite = new Set([0, 1, 9, 10, 11, 14, 15])
  const host = new Set([5, 26, 27])
  const stack = [root]
  while (stack.length > 0) {
    const fiber = stack.pop()
    result.total += 1
    if (composite.has(fiber.tag)) result.composite += 1
    else if (host.has(fiber.tag)) result.host += 1
    else if (fiber.tag === 6) result.text += 1
    if (fiber.child) stack.push(fiber.child)
    if (fiber.sibling) stack.push(fiber.sibling)
  }
  return result
}

async function open(browser, url, { throttle }) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const origin = new URL(url).origin
  // Nada externo (imagenes de Cloudinary, analitica): su latencia es ruido.
  await page.route('**/*', (route) =>
    route.request().url().startsWith(origin) && !route.request().url().includes('/_next/image')
      ? route.continue()
      : route.abort(),
  )
  await page.addInitScript(() => {
    window.__long = []
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__long.push({ start: e.startTime, duration: e.duration })
    }).observe({ type: 'longtask', buffered: true })
  })
  const client = await context.newCDPSession(page)
  await client.send('Performance.enable')
  if (throttle > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: throttle })
  return { context, page, client }
}

async function settle(page) {
  await page.waitForLoadState('load')
  await page.waitForFunction(() => {
    const el = document.querySelector('footer a')
    return Boolean(el) && Object.keys(el).some((k) => k.startsWith('__reactProps'))
  }, null, { timeout: 60_000 })
  await page.waitForTimeout(1500)
}

async function staticMetrics(browser, base, route) {
  const url = base.url + route
  const { context, page } = await open(browser, url, { throttle: 1 })
  const scripts = new Map()
  page.on('response', async (response) => {
    if (response.request().resourceType() !== 'script') return
    try {
      scripts.set(response.url(), (await response.body()).length)
    } catch {
      // Respuesta sin cuerpo (navegacion cerrada): no cuenta.
    }
  })
  const response = await page.goto(url, { waitUntil: 'load' })
  const html = await response.text()
  await settle(page)
  const flight = [...html.matchAll(/<script>self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g)]
    .reduce((sum, m) => sum + Buffer.byteLength(m[1]), 0)
  const dom = await page.evaluate(() => document.querySelectorAll('*').length)
  const fibers = await page.evaluate(countFibers)
  await context.close()
  return {
    status: response.status(),
    htmlBytes: Buffer.byteLength(html),
    htmlGzip: gzipSync(html).length,
    flightBytes: flight,
    jsBytes: [...scripts.values()].reduce((a, b) => a + b, 0),
    jsFiles: scripts.size,
    dom,
    fibers,
  }
}

async function timedRun(browser, base, route) {
  const url = base.url + route
  const { context, page, client } = await open(browser, url, { throttle: cpu })
  await page.goto(url, { waitUntil: 'load' })
  await settle(page)
  const { metrics } = await client.send('Performance.getMetrics')
  const get = (name) => (metrics.find((m) => m.name === name)?.value ?? 0) * 1000
  const long = await page.evaluate(() => window.__long)
  await context.close()
  return {
    scriptMs: get('ScriptDuration'),
    taskMs: get('TaskDuration'),
    styleMs: get('RecalcStyleDuration'),
    layoutMs: get('LayoutDuration'),
    blockingMs: long.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0),
    load1: loadavg()[0],
  }
}

const browser = await chromium.launch()
const report = { date: new Date().toISOString(), runs, cpu, bases: bases.map((b) => b.name), routes: {} }

try {
  for (const route of routes) {
    const entry = { static: {}, runs: {} }
    for (const base of bases) {
      // Primera visita: calienta la cache ISR del servidor.
      await fetch(base.url + route)
      await fetch(base.url + route)
      entry.static[base.name] = await staticMetrics(browser, base, route)
      entry.runs[base.name] = []
    }
    for (let i = 0; i < runs; i += 1) {
      // Orden alternado: ningun servidor va siempre primero.
      const order = i % 2 === 0 ? bases : [...bases].reverse()
      for (const base of order) entry.runs[base.name].push(await timedRun(browser, base, route))
    }
    if (runs > 0) {
      entry.summary = {}
      for (const base of bases) {
        const list = entry.runs[base.name]
        entry.summary[base.name] = Object.fromEntries(
          ['scriptMs', 'taskMs', 'styleMs', 'layoutMs', 'blockingMs', 'load1'].map((k) => {
            const values = list.map((r) => r[k])
            return [k, {
              median: Math.round(median(values) * 10) / 10,
              p25: Math.round(quantile(values, 0.25) * 10) / 10,
              p75: Math.round(quantile(values, 0.75) * 10) / 10,
            }]
          }),
        )
      }
      if (bases.length === 2) {
        const [a, b] = bases.map((x) => entry.runs[x.name])
        entry.paired = Object.fromEntries(
          ['scriptMs', 'taskMs', 'styleMs', 'blockingMs'].map((k) => {
            const diffs = a.map((r, i) => b[i][k] - r[k])
            return [k, {
              medianDiff: Math.round(median(diffs) * 10) / 10,
              improvedPairs: diffs.filter((d) => d < 0).length,
              pairs: diffs.length,
            }]
          }),
        )
      }
    }
    report.routes[route] = entry
    console.log(`\n== ${route}`)
    console.table(Object.fromEntries(bases.map((b) => {
      const s = entry.static[b.name]
      return [b.name, {
        status: s.status, html: s.htmlBytes, gzip: s.htmlGzip, rsc: s.flightBytes, js: s.jsBytes,
        dom: s.dom, fibras: s.fibers?.total, compuestas: s.fibers?.composite,
      }]
    })))
    if (runs > 0) {
      console.table(Object.fromEntries(bases.map((b) => {
        const s = entry.summary[b.name]
        return [b.name, Object.fromEntries(Object.entries(s).map(([k, v]) => [k, `${v.median} [${v.p25} a ${v.p75}]`]))]
      })))
      if (entry.paired) console.table(entry.paired)
    }
    if (out) writeFileSync(out, JSON.stringify(report, null, 2))
  }
} finally {
  await browser.close()
}
