/**
 * READ-ONLY. Peso de CSS y JS servidos por plantilla (CAL-03).
 *
 * Descarga el HTML público de las plantillas principales, lista cada
 * <link rel="stylesheet" href> y cada <script src>, y pide cada recurso con
 * Accept-Encoding: gzip. Registra por recurso el tamaño sin comprimir y el
 * comprimido con gzip: si el servidor ya responde con gzip, usa esos bytes; si
 * responde sin comprimir (o con otra codificación que no se pide), comprime en
 * local con gzip nivel 6 y lo marca como "gzip local".
 *
 * Sirve para el antes y el después del retiro de Tailwind: --out guarda la
 * medición y --compare <archivo> imprime la diferencia y falla si el total de
 * CSS o de JS (únicos, sin comprimir) crece. No necesita next build ni base.
 *
 * Uso:
 *   node scripts/verify/57-bundle-weight.mjs --selftest
 *   BASE_URL=https://dev.juan-tech.com node scripts/verify/57-bundle-weight.mjs --out evidence/57-bundle-before.json
 *   BASE_URL=https://dev.juan-tech.com node scripts/verify/57-bundle-weight.mjs --compare evidence/57-bundle-before.json
 *
 * Variables: BASE_URL (por defecto https://dev.juan-tech.com),
 * BUNDLE_SLACK_BYTES (holgura antes de fallar, por defecto 0).
 */
import { createServer } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { request as httpRequest } from 'node:http'
import { gunzipSync, gzipSync } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export const TEMPLATES = [
  ['home', '/'],
  ['home-en', '/en'],
  ['servicios-indice', '/servicios'],
  ['servicios-detalle', '/servicios/seo-technical-audit'],
  ['blog-indice', '/blog'],
  ['blog-categoria', '/blog/seo'],
  ['blog-post', '/blog/seo/estrategia-seo'],
  ['casos-indice', '/case-studies'],
  ['casos-detalle', '/case-studies/immigration-law-atlanta-seo'],
  ['websites-indice', '/websites'],
  ['autores-perfil', '/authors/juan-carlos-angulo'],
  ['sobre-mi', '/sobre-mi'],
  ['contacto', '/contact'],
  ['stack', '/stack'],
  ['busqueda', '/search'],
]

// ---------------------------------------------------------------------------
// Lógica pura
// ---------------------------------------------------------------------------

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? (m[2] ?? m[3] ?? m[4]) : null
}

/** CSS y JS referenciados por un HTML, sin duplicados y en orden de aparición. */
export function extractAssets(html, baseUrl) {
  const css = []
  const js = []
  const clean = html.replace(/<!--[\s\S]*?-->/g, '')
  for (const m of clean.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    const rel = (attr(tag, 'rel') ?? '').toLowerCase().split(/\s+/)
    const href = attr(tag, 'href')
    if (rel.includes('stylesheet') && href) css.push(new URL(href.replace(/&amp;/g, '&'), baseUrl).href)
  }
  for (const m of clean.matchAll(/<script\b[^>]*>/gi)) {
    const src = attr(m[0], 'src')
    if (src) js.push(new URL(src.replace(/&amp;/g, '&'), baseUrl).href)
  }
  return { css: [...new Set(css)], js: [...new Set(js)] }
}

/** Compara dos mediciones. Falla si el CSS o el JS total (únicos, sin comprimir) crece. */
export function compare(before, after, slack = 0) {
  const rows = []
  let pass = true
  for (const kind of ['css', 'js']) {
    const b = before.totals[kind]
    const a = after.totals[kind]
    const grew = a.raw - b.raw > slack
    if (grew) pass = false
    rows.push({ kind, beforeRaw: b.raw, afterRaw: a.raw, deltaRaw: a.raw - b.raw, beforeGzip: b.gzip, afterGzip: a.gzip, deltaGzip: a.gzip - b.gzip, pass: !grew })
  }
  return { pass, rows }
}

// ---------------------------------------------------------------------------
// Red
// ---------------------------------------------------------------------------

/** GET sin descompresión automática, para leer los bytes que viajan. */
function rawGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = (u.protocol === 'https:' ? httpsRequest : httpRequest)(
      u,
      { method: 'GET', headers: { 'accept-encoding': 'gzip', 'user-agent': 'juan-tech-57-bundle-weight', ...headers }, timeout: 60000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          resolve(rawGet(new URL(res.headers.location, url).href, headers))
          return
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve({ status: res.statusCode, encoding: res.headers['content-encoding'] ?? null, body: Buffer.concat(chunks) }))
      },
    )
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.end()
  })
}

async function measureAsset(url) {
  const res = await rawGet(url)
  if (res.status !== 200) return { url, status: res.status, raw: 0, gzip: 0, gzipSource: 'sin dato' }
  if (res.encoding === 'gzip') {
    return { url, status: 200, raw: gunzipSync(res.body).length, gzip: res.body.length, gzipSource: 'servidor' }
  }
  if (res.encoding && res.encoding !== 'identity') {
    // Codificación inesperada: pide sin comprimir y comprime en local.
    const plain = await rawGet(url, { 'accept-encoding': 'identity' })
    return { url, status: 200, raw: plain.body.length, gzip: gzipSync(plain.body).length, gzipSource: `local (servidor envió ${res.encoding})` }
  }
  return { url, status: 200, raw: res.body.length, gzip: gzipSync(res.body).length, gzipSource: 'local' }
}

export async function measure(base, templates = TEMPLATES) {
  const assetCache = new Map()
  const perTemplate = []
  for (const [id, path] of templates) {
    const pageUrl = base + path
    let html = ''
    let status = null
    try {
      const res = await rawGet(pageUrl)
      status = res.status
      html = (res.encoding === 'gzip' ? gunzipSync(res.body) : res.body).toString('utf8')
    } catch (err) {
      perTemplate.push({ id, path, status: `error ${err.message}` })
      continue
    }
    const { css, js } = extractAssets(html, pageUrl)
    const row = { id, path, status, html: { raw: Buffer.byteLength(html), gzip: gzipSync(html).length }, css: { count: css.length, raw: 0, gzip: 0 }, js: { count: js.length, raw: 0, gzip: 0 }, assets: { css, js } }
    for (const [kind, list] of [['css', css], ['js', js]]) {
      for (const u of list) {
        if (!assetCache.has(u)) assetCache.set(u, { kind, ...(await measureAsset(u).catch((e) => ({ url: u, status: `error ${e.message}`, raw: 0, gzip: 0 }))) })
        const a = assetCache.get(u)
        row[kind].raw += a.raw
        row[kind].gzip += a.gzip
      }
    }
    perTemplate.push(row)
  }
  const totals = { css: { count: 0, raw: 0, gzip: 0 }, js: { count: 0, raw: 0, gzip: 0 } }
  for (const a of assetCache.values()) {
    totals[a.kind].count++
    totals[a.kind].raw += a.raw
    totals[a.kind].gzip += a.gzip
  }
  return { measuredAt: new Date().toISOString(), base, totals, templates: perTemplate, assets: [...assetCache.values()] }
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const signedKb = (n) => `${n > 0 ? '+' : ''}${(n / 1024).toFixed(1)} KB`

function printMeasure(m) {
  console.log(`\n== Peso por plantilla en ${m.base} (sin comprimir / gzip) ==`)
  console.log('Plantilla | Estado | HTML | CSS | JS')
  for (const t of m.templates) {
    if (!t.css) {
      console.log(`${t.id} | ${t.status} | sin dato`)
      continue
    }
    console.log(`${t.id} ${t.path} | ${t.status} | ${kb(t.html.raw)} / ${kb(t.html.gzip)} | ${t.css.count} arch. ${kb(t.css.raw)} / ${kb(t.css.gzip)} | ${t.js.count} arch. ${kb(t.js.raw)} / ${kb(t.js.gzip)}`)
  }
  console.log(`\nTotal de recursos únicos: CSS ${m.totals.css.count} archivos ${kb(m.totals.css.raw)} / ${kb(m.totals.css.gzip)}; JS ${m.totals.js.count} archivos ${kb(m.totals.js.raw)} / ${kb(m.totals.js.gzip)}`)
}

function printCompare(c) {
  console.log('\n== Antes contra después (recursos únicos) ==')
  console.log('Tipo | Antes sin comprimir | Después | Diferencia | Antes gzip | Después gzip | Diferencia gzip | Veredicto')
  for (const r of c.rows) {
    console.log(`${r.kind.toUpperCase()} | ${kb(r.beforeRaw)} | ${kb(r.afterRaw)} | ${signedKb(r.deltaRaw)} | ${kb(r.beforeGzip)} | ${kb(r.afterGzip)} | ${signedKb(r.deltaGzip)} | ${r.pass ? 'PASS' : 'FAIL crece'}`)
  }
}

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest()
  const base = (process.env.BASE_URL ?? 'https://dev.juan-tech.com').replace(/\/+$/, '')
  const out = argValue('--out')
  const cmp = argValue('--compare')
  const slack = Number(process.env.BUNDLE_SLACK_BYTES ?? 0)
  const m = await measure(base)
  printMeasure(m)
  if (out) {
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, JSON.stringify(m, null, 2) + '\n')
    console.log(`\nJSON escrito en ${out}`)
  }
  if (cmp) {
    const before = JSON.parse(readFileSync(cmp, 'utf8'))
    const c = compare(before, m, slack)
    printCompare(c)
    console.log(c.pass ? '\nPASS: ni el CSS ni el JS crecen' : '\nFAIL: el CSS o el JS total crece frente a la medición anterior')
    process.exit(c.pass ? 0 : 1)
  }
  const broken = m.templates.filter((t) => t.status !== 200 || !t.css)
  process.exit(broken.length ? 1 : 0)
}

// ---------------------------------------------------------------------------
// Autoprueba (servidor local)
// ---------------------------------------------------------------------------

async function selftest() {
  let failed = 0
  const check = (ok, label, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${extra ? ` (${extra})` : ''}`)
    if (!ok) failed++
  }
  const html = `<!doctype html><html><head>
    <link rel="stylesheet" href="/_next/static/css/a.css" data-precedence="next"/>
    <link data-precedence="next" href='/_next/static/css/b.css' rel=stylesheet>
    <link rel="preload" as="style" href="/_next/static/css/preload-only.css"/>
    <link rel="icon" href="/favicon.ico"/>
    <!-- <link rel="stylesheet" href="/comentado.css"> -->
    <link rel="stylesheet" href="/_next/static/css/a.css"/>
    </head><body>
    <script src="/_next/static/chunks/main.js" async=""></script>
    <script async src="/_next/static/chunks/page.js?v=1&amp;x=2"></script>
    <script>self.__next_f=[]</script>
    <script type="application/ld+json">{"@type":"Thing"}</script>
    </body></html>`
  // Test 5: extracción.
  const assets = extractAssets(html, 'http://127.0.0.1/')
  check(
    assets.css.length === 2 && assets.css[0].endsWith('/a.css') && assets.css[1].endsWith('/b.css'),
    'test 5: solo los link rel stylesheet, sin duplicados, preload ni comentarios',
    assets.css.join(', '),
  )
  check(assets.js.length === 2 && assets.js[1].endsWith('/page.js?v=1&x=2'), 'test 5b: solo los script con src, con &amp; resuelto', assets.js.join(', '))

  // Tamaños con un servidor local: a.css en gzip desde el servidor, el resto sin comprimir.
  const A_CSS = '.a{color:red}'.repeat(200)
  const B_CSS = '.b{margin:0}'.repeat(100)
  const MAIN_JS = 'console.log(1);'.repeat(300)
  const PAGE_JS = 'var x=2;'.repeat(50)
  const files = { '/_next/static/css/a.css': A_CSS, '/_next/static/css/b.css': B_CSS, '/_next/static/chunks/main.js': MAIN_JS, '/_next/static/chunks/page.js': PAGE_JS }
  const server = createServer((req, res) => {
    const path = req.url.split('?')[0]
    if (path === '/') {
      res.writeHead(200, { 'content-type': 'text/html' })
      return res.end(html)
    }
    const body = files[path]
    if (!body) {
      res.writeHead(404)
      return res.end()
    }
    if (path.endsWith('a.css') && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
      res.writeHead(200, { 'content-encoding': 'gzip' })
      return res.end(gzipSync(body))
    }
    res.writeHead(200)
    res.end(body)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const m = await measure(base, [['home', '/'], ['otra', '/']])
    const a = m.assets.find((x) => x.url.endsWith('a.css'))
    check(a.raw === A_CSS.length && a.gzip === gzipSync(A_CSS).length && a.gzipSource === 'servidor', 'test 5c: CSS gzip del servidor, tamaño sin comprimir y comprimido', `${a.raw} / ${a.gzip}`)
    const b = m.assets.find((x) => x.url.endsWith('b.css'))
    check(b.raw === B_CSS.length && b.gzipSource === 'local', 'test 5d: CSS sin comprimir se mide y se comprime en local')
    check(
      m.totals.css.raw === A_CSS.length + B_CSS.length && m.totals.js.raw === MAIN_JS.length + PAGE_JS.length && m.totals.css.count === 2,
      'test 5e: los totales cuentan cada recurso único una sola vez aunque dos plantillas lo compartan',
    )
    check(m.templates[0].css.raw === A_CSS.length + B_CSS.length && m.templates[0].js.count === 2, 'test 5f: peso por plantilla')
    // Comparación.
    const heavier = structuredClone(m)
    heavier.totals.js.raw += 1
    check(compare(m, heavier).pass === false, 'test 6: --compare falla si el JS crece un byte')
    const lighterCss = structuredClone(m)
    lighterCss.totals.css.raw -= 500
    check(compare(m, lighterCss).pass === true, 'test 6b: --compare pasa si el CSS baja y el JS queda igual')
    const heavierCss = structuredClone(m)
    heavierCss.totals.css.raw += 100
    check(compare(m, heavierCss).pass === false && compare(m, heavierCss, 200).pass === true, 'test 6c: CSS más pesado falla salvo con holgura explícita')
  } finally {
    server.close()
  }
  console.log(failed ? `\nSELFTEST FAIL (${failed})` : '\nSELFTEST PASS')
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
