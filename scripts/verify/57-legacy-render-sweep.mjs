// Barrido de clases tipo Tailwind en el HTML servido (plan 57-02, CAL-03, D-06).
//
// Descarga el HTML de cada URL del sitemap de producción, más las rutas nuevas de
// 57-new-routes.mjs y las que no tienen entrada en el sitemap (una URL que da 404, búsqueda,
// privacidad, términos, contacto, Sobre mí) en es y en, contra BASE_URL. Cuenta las clases
// utilitarias de Tailwind dentro de atributos class, token por token, con el HTML sin script
// ni style (el payload RSC no cuenta). Cualquier URL de BASE_URL con una coincidencia es FAIL.
//
// Control positivo obligatorio: la misma regex corre contra cuatro URLs de producción (home,
// stack, un post y servicios). Si alguna da 0, el script falla, porque entonces un 0 del
// preview no prueba nada (el 2026-11-10 producción dio de 74 a 237 por página).
//
// La comparación es por token completo y distingue mayúsculas, así que las clases de MUI
// (MuiGrid-container, css-1abc) no cuentan aunque contengan "container" o "grid".
//
// Modos:
//   --selftest          HTML sintético: coincidencias, MUI sin coincidencias, control que
//                       acepta un 0 y lista de rutas.
//   --report-fallback   Además dice cuántas URLs caen en el respaldo RenderBlocks de
//                       ServiceDetailPage y LocalLandingPage (clases del registro viejo:
//                       font-heading, text-heading, text-label, text-body, text-primary-text).
//   --out <archivo>     Escribe el resultado completo en JSON.
//   --limit N           Solo las N primeras URLs del sitemap (pruebas rápidas).
//
// Variables: BASE_URL (obligatoria sin --selftest), PROD_BASE (por defecto
// https://juan-tech.com). Solo GET, sin base de datos.

import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { decodeEntities, parseAttrs, pool } from './55-page-contract.mjs'
import { NEW_ROUTES } from './57-new-routes.mjs'

const SITE = 'https://juan-tech.com'

/** Rutas sin entrada en el sitemap, en es; el par en se arma con /en delante. */
export const OFF_SITEMAP = ['/esta-ruta-no-existe-57', '/search', '/search?q=seo', '/privacy', '/terms', '/contact', '/sobre-mi']

const SPACE = '(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|top|bottom|left|right)'
const SIZE = '(?:\\d+(?:\\.\\d+)?|px|auto|full|\\[[^\\]]+\\])'
/**
 * Un token de clase utilitaria, con variantes opcionales (md:, hover:, dark:) y signo negativo.
 * Deliberadamente amplia; la discrimina el control positivo.
 */
export const UTILITY_TOKEN = new RegExp(
  '^(?:[a-z0-9-]+:)*-?(?:' +
    [
      'flex',
      'inline-flex',
      'grid',
      'inline-grid',
      'container',
      'hidden',
      'items-(?:start|end|center|baseline|stretch)',
      'justify-(?:start|end|center|between|around|evenly)',
      `${SPACE}-${SIZE}`,
      'text-(?:xs|sm|base|lg|\\d?xl|muted-foreground|foreground|primary|primary-text|center|left|right|heading|body|label)',
      'bg-(?:background|muted|card|primary|secondary|accent|foreground|popover)(?:/\\d+)?',
      'rounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?',
      'font-(?:medium|semibold|bold|heading|mono)',
      'grid-cols-\\d+',
      'col-span-\\d+',
      '(?:w|h|size|min-h|max-w|min-w)-' + `(?:${SIZE}|screen|prose|\\d?xl|sm|md|lg)`,
      'shrink-0',
      'tracking-(?:tight|wide|wider|widest)',
      'leading-(?:none|tight|snug|normal|relaxed|loose|\\d+)',
      'border(?:-[btlrxy])?',
      'sr-only',
    ].join('|') +
    ')$',
)

/** Clases del registro viejo de bloques: señal del respaldo RenderBlocks. */
export const LEGACY_REGISTRY = new Set(['font-heading', 'text-heading', 'text-label', 'text-body', 'text-primary-text'])

const STRIP = /<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi

/** Tokens de clase de todos los elementos del HTML, sin script ni style. */
export function classTokens(html) {
  const out = []
  const clean = html.replace(STRIP, ' ')
  for (const m of clean.matchAll(/<[a-zA-Z][a-zA-Z0-9-]*\s[^>]*>/g)) {
    const cls = parseAttrs(m[0]).class
    if (cls) out.push(...decodeEntities(cls).split(/\s+/).filter(Boolean))
  }
  return out
}

/** Coincidencias utilitarias y del registro viejo en un HTML. */
export function sweep(html) {
  const tokens = classTokens(html)
  const hits = tokens.filter((t) => UTILITY_TOKEN.test(t))
  const legacy = tokens.filter((t) => LEGACY_REGISTRY.has(t.replace(/^(?:[a-z0-9-]+:)+/, '')))
  const sample = [...new Set(hits)].slice(0, 8)
  return { count: hits.length, legacy: legacy.length, sample }
}

/** Fallos del control positivo: una URL de producción con 0 coincidencias no discrimina. */
export function checkControl(results) {
  const failures = []
  if (results.length < 4) failures.push(`el control positivo necesita al menos 4 URLs de producción y tiene ${results.length}`)
  for (const r of results) {
    if (r.status !== 200) failures.push(`control ${r.path}: producción respondió ${r.status}`)
    else if (r.count === 0) failures.push(`control ${r.path}: 0 coincidencias en producción, la regex no discrimina`)
  }
  return failures
}

/** Lista de rutas del barrido: sitemap más las de fuera del sitemap y las nuevas, en es y en. */
export function sweepRoutes(sitemapPaths) {
  const enOf = (p) => (p === '/' ? '/en' : `/en${p}`)
  const extra = [...OFF_SITEMAP, ...NEW_ROUTES.map((r) => r.path).filter((p) => !p.startsWith('/en'))]
  const all = [...sitemapPaths]
  for (const p of extra) for (const q of [p, enOf(p)]) if (!all.includes(q)) all.push(q)
  return all
}

async function get(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(45000) })
      const html = await res.text()
      if (attempt === 0 && [500, 502, 503, 504].includes(res.status)) continue
      return { status: res.status, html }
    } catch (err) {
      if (attempt === 1) return { status: 0, html: '', error: err.message }
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  return { status: 0, html: '' }
}

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? SITE).replace(/\/$/, '')
  const sm = await get(`${prodBase}/sitemap.xml`)
  if (sm.status !== 200) {
    console.log(`FAIL sitemap.xml de producción respondió ${sm.status || sm.error}`)
    return 1
  }
  let sitemap = [...new Set([...sm.html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
    const u = new URL(decodeEntities(m[1]))
    return u.pathname + u.search
  }))]
  const li = args.indexOf('--limit')
  if (li >= 0) sitemap = sitemap.slice(0, Number(args[li + 1]))
  const routes = sweepRoutes(sitemap)

  // Control positivo contra producción.
  const post = sitemap.find((p) => /^\/blog\/[^/]+\/[^/]+$/.test(p)) ?? '/blog/seo/estrategia-seo'
  const controlPaths = ['/', '/stack', post, '/servicios']
  const control = await pool(controlPaths, 4, async (path) => {
    const r = await get(prodBase + path)
    return { path, status: r.status, ...sweep(r.html) }
  })
  for (const c of control) console.log(`CONTROL ${c.path} producción: ${c.count} coincidencias (${c.sample.join(' ')})`)
  const controlFailures = checkControl(control)
  for (const f of controlFailures) console.log(`FAIL ${f}`)

  const rows = await pool(routes, 4, async (path) => {
    const r = await get(base + path)
    return { path, status: r.status || r.error, ...sweep(r.html) }
  })
  let failed = 0
  for (const r of rows) {
    const bad = r.count > 0 || r.status === 0 || r.status >= 500
    if (bad) failed += 1
    console.log(`${bad ? 'FAIL' : 'PASS'} ${r.path} (${r.status}): ${r.count} coincidencias${r.count ? ` (${r.sample.join(' ')})` : ''}`)
  }
  const fallback = rows.filter((r) => r.legacy > 0)
  if (args.includes('--report-fallback')) {
    console.log(`Respaldo RenderBlocks: ${fallback.length} URL(s) con clases del registro viejo${fallback.length ? `: ${fallback.map((r) => r.path).join(', ')}` : ''}`)
  }
  const gate = failed === 0 && controlFailures.length === 0 ? 'PASS' : 'FAIL'
  console.log(`${gate} 57-legacy-render-sweep: ${rows.length - failed} de ${rows.length} URLs de ${base} sin clases utilitarias; control positivo ${controlFailures.length === 0 ? 'válido' : 'inválido'} (${control.map((c) => c.count).join(', ')})`)

  const oi = args.indexOf('--out')
  if (oi >= 0 && args[oi + 1]) {
    writeFileSync(args[oi + 1], `${JSON.stringify({ generado: new Date().toISOString(), base, produccion: prodBase, gate, control, controlFailures, urls: rows, respaldoRenderBlocks: fallback.map((r) => r.path) }, null, 2)}\n`)
    console.log(`Resultado: ${args[oi + 1]}`)
  }
  return gate === 'PASS' ? 0 : 1
}

function selftest() {
  let bad = 0
  const check = (name, ok, detail) => {
    if (ok) console.log(`PASS selftest ${name}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: ${detail}`)
    }
  }
  // Test 1: coincidencias.
  const tw = '<html><body><div class="flex px-4 text-muted-foreground"><p class="md:grid hover:bg-muted/50 mt-2">x</p></div></body></html>'
  const r1 = sweep(tw)
  check('Test 1 flex, px-4 y text-muted-foreground cuentan', r1.count === 6, JSON.stringify(r1))
  const mui = '<html><body><div class="MuiGrid-root MuiGrid-container MuiStack-root css-1abc mui-1s2t0kw"><p class="MuiTypography-root MuiTypography-body1">x</p></div><script>self.__next_f.push([1,"className\\":\\"flex px-4\\""])</script><script>document.body.className="flex"</script></body></html>'
  const r2 = sweep(mui)
  check('Test 1 HTML de MUI sin utilitarias cuenta 0 (y el payload RSC no cuenta)', r2.count === 0, JSON.stringify(r2))
  const legacy = sweep('<section class="py-12"><h2 class="font-heading text-heading">a</h2></section>')
  check('Test 1 clases del registro viejo se marcan como respaldo', legacy.legacy === 2 && legacy.count === 3, JSON.stringify(legacy))

  // Test 2: control positivo.
  const ctrl = (counts) => counts.map((count, i) => ({ path: `/p${i}`, status: 200, count }))
  check('Test 2 control con coincidencias en las 4 URLs es válido', checkControl(ctrl([237, 189, 125, 74])).length === 0, '')
  check('Test 2 control con un 0 en producción falla', checkControl(ctrl([237, 0, 125, 74])).length === 1, '')
  check('Test 2 control con menos de 4 URLs falla', checkControl(ctrl([237, 189])).length > 0, '')

  // Test 3: lista de rutas.
  const routes = sweepRoutes(['/', '/stack', '/en'])
  const need = ['/esta-ruta-no-existe-57', '/en/esta-ruta-no-existe-57', '/search', '/en/search', '/privacy', '/en/privacy', '/terms', '/en/terms', '/sobre-mi', '/en/sobre-mi', '/contact', '/en/contact']
  const missing = need.filter((p) => !routes.includes(p))
  check('Test 3 la lista incluye 404, búsqueda, privacidad, términos, Sobre mí, contacto y sus pares EN', missing.length === 0, `faltan ${missing.join(', ')}`)
  check('Test 3 sin duplicados', new Set(routes).size === routes.length, JSON.stringify(routes))

  console.log(bad === 0 ? 'PASS selftest 57-legacy-render-sweep' : `FAIL selftest 57-legacy-render-sweep (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  process.exit(args.includes('--selftest') ? selftest() : await live(args))
}
