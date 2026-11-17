/**
 * READ-ONLY. Barrido de accesibilidad por plantilla (CAL-01, D-02).
 *
 * Por cada plantilla en ES y EN, y en 375 y 1280 px de ancho:
 *   1. axe-core 4.12.1 inyectado desde node_modules (sin paquete nuevo) con las
 *      etiquetas wcag2a, wcag2aa, wcag21a, wcag21aa y wcag22aa.
 *   2. Recorrido de teclado: pulsa Tab desde el inicio hasta cerrar el ciclo o
 *      llegar al tope. En cada parada registra el elemento activo, si tiene un
 *      indicador de foco detectable (outline o box-shadow calculado distinto de
 *      ninguno, en el elemento, sus pseudoelementos o un ancestro marcado como
 *      enfocado) y su nombre accesible (el que calcula Chromium por CDP).
 *      Falla si la primera parada no es el enlace de salto, si una parada no
 *      tiene nombre, si una parada no muestra foco o si el foco queda atrapado
 *      (Tab no avanza o vuelve a un elemento ya visitado antes de cerrar).
 *
 * Límite honesto: axe detecta una parte de WCAG. El contraste sobre degradados
 * y capturas, el orden de lectura y el significado de cada alt los revisa Juan
 * con 57-A11Y-MANUAL.md.
 *
 * Solo lee páginas públicas con GET. No toca ninguna base de datos.
 *
 * Uso:
 *   node scripts/verify/57-a11y-sweep.mjs --selftest
 *   BASE_URL=https://dev.juan-tech.com node scripts/verify/57-a11y-sweep.mjs --out evidence/57-a11y.json
 *
 * Opciones:
 *   --selftest        servidor http local con cuatro páginas de prueba
 *   --out <archivo>   guarda el resultado completo en JSON
 *   --only <texto>    solo las plantillas cuyo id contiene el texto
 *   --widths 375,1280 anchos a revisar
 *   --no-keyboard     solo axe
 *
 * Variables:
 *   BASE_URL   sitio a revisar (por defecto https://dev.juan-tech.com)
 *   PROD_BASE  de dónde sale el sitemap para los slugs de detalle
 *              (por defecto https://juan-tech.com; el preview bloquea su sitemap)
 *   MAX_TABS   tope de paradas por recorrido (por defecto 300)
 */
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const AXE_PATH = require.resolve('axe-core')
const AXE_VERSION = require('axe-core/package.json').version

export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const MAX_TABS = Number(process.env.MAX_TABS ?? 300)
const SKIP_NAME = /(saltar|ir al contenido|skip)/i

/**
 * Plantillas (supuesto A12 de la investigación). Las rutas de detalle llevan un
 * patrón que se resuelve contra el sitemap de producción; el valor `fallback`
 * se usa si el sitemap no responde.
 */
export const TEMPLATES = [
  { id: 'home', es: '/', en: '/en' },
  { id: 'servicios-indice', es: '/servicios', en: '/en/services' },
  {
    id: 'servicios-detalle',
    es: { re: /^\/servicios\/[^/]+$/, fallback: '/servicios/seo-consulting' },
    en: { re: /^\/en\/services\/[^/]+$/, fallback: '/en/services/seo-consulting' },
  },
  { id: 'landing-lima', es: '/seo-tecnico-lima', en: '/en/seo-tecnico-lima' },
  { id: 'landing-madrid', es: '/seo-tecnico-madrid', en: '/en/seo-tecnico-madrid' },
  { id: 'blog-indice', es: '/blog', en: '/en/blog' },
  { id: 'blog-categoria', es: '/blog/seo', en: '/en/blog/seo' },
  {
    id: 'blog-post',
    es: '/blog/seo/estrategia-seo',
    en: { re: /^\/en\/blog\/seo\/[^/]+$/, fallback: '/en/blog/seo/seo-strategy' },
  },
  { id: 'casos-indice', es: '/case-studies', en: '/en/case-studies' },
  {
    id: 'casos-detalle',
    es: { re: /^\/case-studies\/[^/]+$/, fallback: '/case-studies/immigration-law-atlanta-seo' },
    en: { re: /^\/en\/case-studies\/[^/]+$/, fallback: '/en/case-studies/immigration-law-atlanta-seo' },
  },
  { id: 'websites-indice', es: '/websites', en: '/en/websites' },
  {
    id: 'websites-detalle',
    es: { re: /^\/websites\/[^/]+$/, fallback: '/websites/juan-tech-com' },
    en: { re: /^\/en\/websites\/[^/]+$/, fallback: '/en/websites/juan-tech-com' },
  },
  { id: 'autores-indice', es: '/authors', en: '/en/authors' },
  {
    id: 'autores-perfil',
    es: { re: /^\/authors\/[^/]+$/, fallback: '/authors/juan-carlos-angulo' },
    en: { re: /^\/en\/authors\/[^/]+$/, fallback: '/en/authors/juan-carlos-angulo' },
  },
  // Ruta nueva del rediseño: no existe en el sitemap de producción.
  { id: 'sobre-mi', es: '/sobre-mi', en: '/en/sobre-mi' },
  { id: 'contacto', es: '/contact', en: '/en/contact' },
  { id: 'stack', es: '/stack', en: '/en/stack' },
  { id: 'busqueda', es: '/search', en: '/en/search' },
  { id: 'privacidad', es: '/privacy', en: '/en/privacy' },
  { id: 'terminos', es: '/terms', en: '/en/terms' },
  { id: '404', es: '/no-existe-57-a11y', en: '/en/no-existe-57-a11y', expectStatus: 404 },
]

// ---------------------------------------------------------------------------
// Utilidades puras
// ---------------------------------------------------------------------------

export function sitemapPaths(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
    try {
      const p = new URL(m[1]).pathname.replace(/\/+$/, '')
      return p === '' ? '/' : p
    } catch {
      return null
    }
  }).filter(Boolean)
}

export function resolveTemplates(templates, paths) {
  const out = []
  for (const t of templates) {
    for (const locale of ['es', 'en']) {
      const spec = t[locale]
      if (!spec) continue
      let path = spec
      let source = 'fija'
      if (typeof spec === 'object') {
        const hit = paths.find((p) => spec.re.test(p))
        path = hit ?? spec.fallback
        source = hit ? 'sitemap' : 'respaldo'
      }
      out.push({ id: t.id, locale, path, source, expectStatus: t.expectStatus ?? 200 })
    }
  }
  return out
}

/** Decide el resultado del recorrido de teclado a partir de las paradas. */
export function judgeKeyboard(stops, { closed, maxReached }) {
  const problems = []
  if (stops.length === 0) {
    problems.push('Tab no enfoca ningún elemento')
    return problems
  }
  const first = stops[0]
  const firstIsSkip = first.tag === 'a' && /^#./.test(first.href ?? '') && first.targetExists && SKIP_NAME.test(first.name ?? '')
  if (!firstIsSkip) {
    problems.push(`la primera parada no es el enlace de salto (${describe(first)})`)
  }
  const seen = new Map()
  for (const [i, s] of stops.entries()) {
    if (seen.has(s.key)) {
      problems.push(`trampa de foco: la parada ${i + 1} vuelve a ${describe(s)} (ya visitado en la ${seen.get(s.key) + 1}) sin cerrar el ciclo`)
      break
    }
    seen.set(s.key, i)
  }
  for (const [i, s] of stops.entries()) {
    if (!s.name || !s.name.trim()) problems.push(`parada ${i + 1} sin nombre accesible (${describe(s)})`)
  }
  for (const [i, s] of stops.entries()) {
    if (!s.focusVisible) problems.push(`parada ${i + 1} sin anillo de foco de 2 px detectable${s.weak ? `, ${s.weak}` : ''} (${describe(s)})`)
  }
  if (!closed && maxReached && !problems.some((p) => p.startsWith('trampa'))) {
    problems.push(`aviso: tope de ${stops.length} paradas sin cerrar el ciclo`)
  }
  return problems
}

const describe = (s) => `${s.tag}${s.id ? '#' + s.id : ''}${s.href ? ` href="${s.href}"` : ''}${s.name ? ` "${s.name.slice(0, 40)}"` : ''}`

const isFailure = (problem) => !problem.startsWith('aviso:')

// ---------------------------------------------------------------------------
// Navegador
// ---------------------------------------------------------------------------

async function launch() {
  try {
    return await chromium.launch()
  } catch (err) {
    console.log(`Chromium de Playwright no disponible (${err.message.split('\n')[0]}); pruebo Chrome del sistema`)
    return chromium.launch({ channel: 'chrome' })
  }
}

async function runAxe(page) {
  await page.addScriptTag({ path: AXE_PATH })
  const res = await page.evaluate(async (tags) => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      tags: v.tags.filter((t) => t.startsWith('wcag')),
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    }))
  }, AXE_TAGS)
  return res
}

/** Datos del elemento activo, con una clave estable para detectar repeticiones. */
async function activeInfo(page) {
  return page.evaluate(() => {
    let el = document.activeElement
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement
    if (!el || el === document.body || el === document.documentElement) return null
    if (!el.dataset.a11y57) el.dataset.a11y57 = String((window.__a11y57 = (window.__a11y57 ?? 0) + 1))
    const visibleStyle = (cs) =>
      (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || (cs.boxShadow && cs.boxShadow !== 'none')
    let focusVisible =
      visibleStyle(getComputedStyle(el)) ||
      visibleStyle(getComputedStyle(el, '::before')) ||
      visibleStyle(getComputedStyle(el, '::after'))
    // Ancestros que marcan el foco de su hijo (MUI pone Mui-focused en el contenedor del input).
    let a = el.parentElement
    for (let i = 0; !focusVisible && a && i < 3; i++, a = a.parentElement) {
      if (!/(^|\s)(Mui-focused|Mui-focusVisible)(\s|$)/.test(a.className || '')) continue
      if (visibleStyle(getComputedStyle(a))) focusVisible = true
      // OutlinedInput dibuja el anillo en el fieldset hermano: cuenta si el borde llega a 2 px.
      const notch = a.querySelector(':scope > .MuiOutlinedInput-notchedOutline')
      if (notch && parseFloat(getComputedStyle(notch).borderTopWidth) >= 2) focusVisible = true
    }
    // Diagnóstico: ButtonBase de MUI fija outline 0 y solo deja ripple o cambio de fondo.
    const weak = !focusVisible && /(^|\s)Mui-focusVisible(\s|$)/.test(el.className || '') ? 'solo ripple o fondo de MUI, ButtonBase anula el outline' : null
    const href = el.getAttribute('href')
    const targetExists = href && href.startsWith('#') && href.length > 1 ? !!document.getElementById(decodeURIComponent(href.slice(1))) : false
    return {
      key: el.dataset.a11y57,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      href,
      targetExists,
      focusVisible: !!focusVisible,
      weak,
    }
  })
}

/** Nombre accesible calculado por Chromium (árbol de accesibilidad por CDP). */
async function accessibleName(cdp) {
  try {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: '(() => { let e = document.activeElement; while (e && e.shadowRoot && e.shadowRoot.activeElement) e = e.shadowRoot.activeElement; return e })()',
    })
    if (!result.objectId) return ''
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })
    const node = nodes.find((n) => !n.ignored) ?? nodes[0]
    return String(node?.name?.value ?? '').trim()
  } catch {
    return ''
  }
}

async function keyboardWalk(page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Accessibility.enable')
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur()
    window.scrollTo(0, 0)
  })
  const stops = []
  let closed = false
  let maxReached = false
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press('Tab')
    const info = await activeInfo(page)
    if (!info) {
      // El foco salió del documento: el ciclo se cerró.
      if (stops.length > 0) {
        closed = true
        break
      }
      continue
    }
    if (stops.length > 0 && info.key === stops[0].key) {
      closed = true
      break
    }
    info.name = await accessibleName(cdp)
    const revisit = stops.some((s) => s.key === info.key)
    stops.push(info)
    // Vuelta a una parada ya visitada sin pasar por la primera: trampa, no hace falta seguir.
    if (revisit) break
    if (i === MAX_TABS - 1) maxReached = true
  }
  await cdp.detach().catch(() => {})
  return { stops, closed, maxReached }
}

async function checkPage(browser, url, width, { keyboard = true, expectStatus = 200 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 812 : 900 } })
  const page = await context.newPage()
  const result = { url, width, status: null, violations: [], keyboard: null, problems: [] }
  try {
    const res = await page.goto(url, { waitUntil: 'load', timeout: 60000 })
    result.status = res?.status() ?? null
    if (result.status !== expectStatus) result.problems.push(`estado ${result.status}, se esperaba ${expectStatus}`)
    await page.waitForTimeout(500)
    result.violations = await runAxe(page)
    if (keyboard) {
      // Recarga para que el recorrido parta de un documento sin axe ni marcas.
      await page.goto(url, { waitUntil: 'load', timeout: 60000 })
      await page.waitForTimeout(300)
      const walk = await keyboardWalk(page)
      const kbProblems = judgeKeyboard(walk.stops, walk)
      result.keyboard = {
        stops: walk.stops.length,
        closed: walk.closed,
        firstStop: walk.stops[0] ? describe(walk.stops[0]) : null,
        problems: kbProblems,
        detail: walk.stops.map((s) => ({ tag: s.tag, href: s.href, name: s.name, focusVisible: s.focusVisible })),
      }
      result.problems.push(...kbProblems.filter(isFailure))
    }
  } catch (err) {
    result.problems.push(`error: ${err.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
  result.pass = result.violations.length === 0 && result.problems.length === 0
  return result
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------

function report(results) {
  const byRule = new Map()
  for (const r of results) {
    for (const v of r.violations) {
      const entry = byRule.get(v.id) ?? { help: v.help, impact: v.impact, urls: new Set(), nodes: 0 }
      entry.urls.add(`${r.url} @${r.width}`)
      entry.nodes += v.nodes
      byRule.set(v.id, entry)
    }
  }
  console.log('\n== Violaciones de axe por regla ==')
  if (byRule.size === 0) console.log('ninguna')
  for (const [id, e] of byRule) {
    console.log(`- ${id} (${e.impact}) ${e.help}: ${e.nodes} nodos en ${e.urls.size} páginas`)
  }
  console.log('\n== Resultado por URL ==')
  for (const r of results) {
    const kb = r.keyboard ? ` teclado ${r.keyboard.stops} paradas${r.keyboard.closed ? ', ciclo cerrado' : ''}` : ''
    console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.url} @${r.width}px estado ${r.status} axe ${r.violations.length}${kb}`)
    for (const v of r.violations) console.log(`   axe ${v.id}: ${v.nodes} nodos, p. ej. ${v.targets[0] ?? ''}`)
    for (const p of r.problems) console.log(`   ${p}`)
    for (const p of r.keyboard?.problems.filter((x) => !isFailure(x)) ?? []) console.log(`   ${p}`)
  }
  console.log(
    '\nNota: axe detecta solo una parte de WCAG. El contraste sobre degradados y capturas, el orden de lectura y el significado de cada texto alternativo los revisa Juan (57-A11Y-MANUAL.md).',
  )
}

function writeOut(file, data) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log(`JSON escrito en ${file}`)
}

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

const CSS = `
  body { font: 16px/1.5 system-ui, sans-serif; color: #111; background: #fff; margin: 0; padding: 1rem; }
  a, button, input { color: #0b3d91; }
  a:focus-visible, button:focus-visible, input:focus-visible { outline: 3px solid #0b3d91; outline-offset: 2px; }
`
const page = (title, body) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>${CSS}</style></head><body>${body}</body></html>`
const SKIP = '<a href="#main-content">Saltar al contenido</a>'
const MAIN = (inner) => `<main id="main-content" tabindex="-1"><h1>Prueba</h1>${inner}</main>`

export const SELFTEST_PAGES = {
  // Test 1: botón sin nombre accesible, axe debe marcarlo.
  '/sin-nombre': page('Botón sin nombre', `${SKIP}<header><nav aria-label="Principal"><a href="/a">Inicio</a></nav></header>${MAIN('<button type="button"></button><p>Texto.</p>')}`),
  // Test 2: página limpia.
  '/limpia': page('Página limpia', `${SKIP}<header><nav aria-label="Principal"><a href="/a">Inicio</a> <a href="/b">Servicios</a></nav></header>${MAIN('<p>Texto.</p><label for="q">Buscar</label> <input id="q" type="search"> <button type="submit">Enviar</button>')}<footer><a href="/c">Contacto</a></footer>`),
  // Test 3: trampa de foco, Tab siempre vuelve al mismo campo.
  '/trampa': page('Trampa de foco', `${SKIP}${MAIN('<label for="t">Nombre</label> <input id="t" type="text"><a href="/x">Siguiente</a>')}<script>document.getElementById('t').addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault() })</script>`),
  // Test 4: la primera parada no es el enlace de salto.
  '/sin-salto': page('Sin enlace de salto', `<header><nav aria-label="Principal"><a href="/a">Inicio</a></nav></header>${SKIP}${MAIN('<p>Texto.</p>')}`),
}

async function selftest() {
  const server = createServer((req, res) => {
    const body = SELFTEST_PAGES[req.url]
    res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' })
    res.end(body ?? page('No encontrada', `${SKIP}${MAIN('<p>404</p>')}`))
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await launch()
  let failed = 0
  const check = (ok, label, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${extra ? ` (${extra})` : ''}`)
    if (!ok) failed++
  }
  try {
    console.log(`axe-core ${AXE_VERSION} desde ${AXE_PATH}`)
    const bad = await checkPage(browser, base + '/sin-nombre', 1280)
    check(
      bad.violations.some((v) => v.id === 'button-name') && !bad.pass,
      'test 1: botón sin nombre produce violación de axe y el barrido falla',
      bad.violations.map((v) => v.id).join(',') || 'sin violaciones',
    )
    const clean = await checkPage(browser, base + '/limpia', 1280)
    check(clean.pass, 'test 2: página limpia pasa axe y teclado', [...clean.violations.map((v) => v.id), ...clean.problems].join('; '))
    const clean375 = await checkPage(browser, base + '/limpia', 375)
    check(clean375.pass, 'test 2b: la misma página limpia pasa a 375 px', [...clean375.violations.map((v) => v.id), ...clean375.problems].join('; '))
    const trap = await checkPage(browser, base + '/trampa', 1280)
    check(
      !trap.pass && trap.problems.some((p) => p.startsWith('trampa')),
      'test 3: trampa de foco falla el recorrido',
      trap.problems.join('; ') || 'sin problemas',
    )
    const noskip = await checkPage(browser, base + '/sin-salto', 1280)
    check(
      !noskip.pass && noskip.problems.some((p) => p.includes('enlace de salto')),
      'test 4: primera parada distinta del enlace de salto falla',
      noskip.problems.join('; ') || 'sin problemas',
    )
    // Lógica pura: plantillas y sitemap.
    const paths = sitemapPaths('<urlset><url><loc>https://juan-tech.com/servicios/seo-x</loc></url><url><loc>https://juan-tech.com/</loc></url></urlset>')
    const resolved = resolveTemplates(TEMPLATES, paths)
    check(
      resolved.find((r) => r.id === 'servicios-detalle' && r.locale === 'es')?.path === '/servicios/seo-x' &&
        resolved.find((r) => r.id === 'servicios-detalle' && r.locale === 'en')?.source === 'respaldo' &&
        resolved.filter((r) => r.locale === 'es').length === TEMPLATES.length,
      'test 5: slugs de detalle salen del sitemap y cada plantilla tiene ES y EN',
    )
  } finally {
    await browser.close()
    server.close()
  }
  console.log(failed ? `\nSELFTEST FAIL (${failed})` : '\nSELFTEST PASS')
  process.exit(failed ? 1 : 0)
}

// ---------------------------------------------------------------------------
// Barrido real
// ---------------------------------------------------------------------------

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest()
  const base = (process.env.BASE_URL ?? 'https://dev.juan-tech.com').replace(/\/+$/, '')
  const prod = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/+$/, '')
  const widths = (argValue('--widths') ?? '375,1280').split(',').map(Number).filter(Boolean)
  const only = argValue('--only')
  const out = argValue('--out')
  const keyboard = !process.argv.includes('--no-keyboard')

  let paths = []
  try {
    const xml = await (await fetch(`${prod}/sitemap.xml`, { signal: AbortSignal.timeout(30000) })).text()
    paths = sitemapPaths(xml)
  } catch (err) {
    console.log(`aviso: sitemap de producción no disponible (${err.message}); uso slugs de respaldo`)
  }
  const targets = resolveTemplates(TEMPLATES, paths).filter((t) => !only || t.id.includes(only))
  console.log(`Barrido de accesibilidad: ${base}, ${targets.length} URLs x ${widths.join(' y ')} px, axe-core ${AXE_VERSION} (${AXE_TAGS.join(', ')})`)

  const browser = await launch()
  const results = []
  try {
    for (const t of targets) {
      for (const w of widths) {
        const r = await checkPage(browser, base + t.path, w, { keyboard, expectStatus: t.expectStatus })
        r.template = t.id
        r.locale = t.locale
        r.pathSource = t.source
        results.push(r)
        console.log(`${r.pass ? 'PASS' : 'FAIL'} ${t.id}/${t.locale} ${t.path} @${w}px`)
      }
    }
  } finally {
    await browser.close()
  }
  report(results)
  const failedCount = results.filter((r) => !r.pass).length
  if (out) {
    writeOut(out, {
      measuredAt: new Date().toISOString(),
      base,
      axe: { version: AXE_VERSION, tags: AXE_TAGS },
      widths,
      summary: { urls: results.length, fail: failedCount },
      limits: 'axe detecta solo una parte de WCAG; contraste sobre degradados, orden de lectura y significado de los alt los revisa Juan',
      results,
    })
  }
  console.log(failedCount ? `\nFAIL: ${failedCount} de ${results.length} revisiones con problemas` : `\nPASS: ${results.length} revisiones sin problemas`)
  process.exit(failedCount ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
