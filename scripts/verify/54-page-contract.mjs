// Contrato HTML por ruta y locale con paridad de SEO contra produccion (fase 54,
// plan 54-16, PAG-01, PAG-02, PAG-06, PAG-07, PAG-08, PAG-09, PAG-11, PAG-12, SEO-01).
//
// Valida sobre el HTML servido (no sobre el codigo fuente), en cada ruta y locale:
//   - estado 200;
//   - el atributo lang de html coincide con el idioma de la ruta;
//   - exactamente una apertura de h1;
//   - los niveles de encabezado, en orden de aparicion, nunca saltan mas de un
//     nivel hacia abajo (h2 a h4 es un salto);
//   - exactamente una apertura de main;
//   - con EXPECT_PREVIEW=1: meta robots con noindex y cabecera x-robots-tag con noindex;
//   - ausencia de la secuencia de llaves dobles de los marcadores, de [PLACEHOLDER]
//     y de lorem en el HTML visible (se ignoran script y style salvo ld+json);
//   - ningun src que apunte a /img/ o /logos/ y responda 404 (rutas del sandbox sin
//     activo en el repo).
// Los h2 y h3 con punto o coma se imprimen como WARN para la revision de la fase 56 y
// solo fallan con --strict-headings.
//
// Paridad contra produccion (PROD_BASE) para cada ruta que ya existe alli (todas
// salvo /sobre-mi y /en/sobre-mi): title, meta description, canonical, el conjunto de
// hreflang y el conjunto de tipos de application/ld+json (aplana @graph) del preview
// deben ser iguales a los de produccion. Una diferencia imprime FAIL con ambos valores.
//
// Modos:
//   --selftest       Fixture valido con cero fallos y defectuosos (dos h1, salto de h2
//                    a h4, sin noindex, marcador pendiente, dos main, title distinto
//                    del de produccion simulada); cada uno debe dar al menos un fallo.
//                    Sale 0 solo si el comportamiento es el esperado.
//   --parity-only    Solo la paridad de metadatos (sin las comprobaciones de contrato).
//   --routes a,b,c   Subconjunto de rutas (la ruta exacta como esta en la lista).
//   --strict-headings  Los h2 y h3 con punto o coma pasan de WARN a FAIL.
//   (sin modo)       Contrato completo mas paridad contra BASE_URL (obligatoria).
//
// Variables: BASE_URL (obligatoria), PROD_BASE (por defecto https://juan-tech.com),
// EXPECT_PREVIEW=1.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL.
// Cuenta con expresiones globales sobre el HTML (llega en una sola linea, `grep -c`
// daria siempre 1).
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

// Misma lista que SERVICE_SLUGS de src/lib/service-slugs.ts (un .mjs no importa TypeScript).
const SERVICE_SLUGS = ['seo-technical-audit', 'seo-consulting', 'fullstack-development', 'ai-seo-geo']
const LOCAL_SLUGS = ['seo-tecnico-lima', 'seo-tecnico-madrid']

/** Rutas que todavia no existen en produccion: sin paridad posible. */
const NEW_ROUTES = new Set(['/sobre-mi', '/en/sobre-mi'])

/**
 * Marcadores pendientes que CONTEXT permite renderizar tal como llegan de Payload
 * hasta que la fase 56 los cierre (no se inventa copy). Se anotan como WARN y solo en
 * la ruta indicada; cualquier otro marcador, o este en otra ruta, es FAIL.
 */
const KNOWN_PENDING = {
  '/sobre-mi': ['{{pendiente}} fecha del cambio de nombre'],
  '/en/sobre-mi': ['{{pendiente}} fecha del cambio de nombre'],
}

/** Lista por defecto de rutas, en es y en. */
export function buildRoutes() {
  const routes = []
  const add = (path, lang) => routes.push({ path, lang })
  add('/', 'es')
  add('/servicios', 'es')
  for (const s of SERVICE_SLUGS) add(`/servicios/${s}`, 'es')
  for (const l of LOCAL_SLUGS) add(`/${l}`, 'es')
  for (const p of ['/search', '/search?q=seo', '/sobre-mi', '/contact', '/stack', '/privacy', '/terms']) add(p, 'es')
  add('/en', 'en')
  add('/en/services', 'en')
  for (const s of SERVICE_SLUGS) add(`/en/services/${s}`, 'en')
  for (const l of LOCAL_SLUGS) add(`/en/${l}`, 'en')
  for (const p of ['/search', '/search?q=seo', '/sobre-mi', '/contact', '/stack', '/privacy', '/terms']) add(`/en${p}`, 'en')
  return routes
}

// ------------------------------------------------------------------- parseo

/** Lee los atributos de una etiqueta de apertura como mapa nombre -> valor. */
function parseAttrs(tag) {
  const attrs = {}
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  const body = tag.replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '')
  let m
  while ((m = re.exec(body)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return attrs
}

/** Todas las etiquetas de apertura de un elemento (sin cuerpo ni cierre). */
function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
}

/** Quita script y style, salvo los bloques ld+json. */
function visibleHtml(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (all, attrs) => (/application\/ld\+json/i.test(attrs) ? all : ' '))
}

/** Niveles de encabezado en orden de aparicion. */
function headingLevels(html) {
  return [...html.matchAll(/<h([1-6])(?=[\s>/])/gi)].map((m) => Number(m[1]))
}

/** Textos de los h2 y h3 con punto o coma. */
export function punctuatedHeadings(html) {
  const out = []
  for (const m of html.matchAll(/<h([23])(?=[\s>/])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
    if (/[.,]/.test(text)) out.push(`h${m[1]}: ${text}`)
  }
  return out
}

/** Rutas /img/ y /logos/ referenciadas por src, srcset o por el parametro url de next/image. */
export function sandboxAssetPaths(html) {
  const found = new Set()
  const add = (raw) => {
    let value = decodeEntities(raw).trim()
    try {
      value = decodeURIComponent(value)
    } catch {
      // se queda con el valor crudo
    }
    const m = value.match(/(?:^|[\s,=])(\/(?:img|logos)\/[^\s,?#&"'<>)]+)/)
    if (m) found.add(m[1])
  }
  for (const tag of [...openTags(html, 'img'), ...openTags(html, 'source'), ...openTags(html, 'video')]) {
    const a = parseAttrs(tag)
    if (a.src) add(a.src)
    if (a.srcset) {
      for (const part of a.srcset.split(',')) add(part.trim().split(/\s+/)[0])
    }
  }
  return [...found]
}

/** Metadatos de SEO: title, description, canonical, hreflang y tipos ld+json. */
export function extractMeta(html) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim() : ''

  let description = ''
  for (const tag of openTags(html, 'meta')) {
    const a = parseAttrs(tag)
    if ((a.name ?? '').toLowerCase() === 'description') {
      description = decodeEntities(a.content ?? '').trim()
      break
    }
  }

  let canonical = ''
  const hreflang = []
  for (const tag of openTags(html, 'link')) {
    const a = parseAttrs(tag)
    const rel = (a.rel ?? '').toLowerCase()
    if (rel === 'canonical' && !canonical) canonical = a.href ?? ''
    if (rel === 'alternate' && a.hreflang) hreflang.push(`${a.hreflang}=${a.href ?? ''}`)
  }
  hreflang.sort()

  const types = new Set()
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect)
    if (!node || typeof node !== 'object') return
    const t = node['@type']
    if (typeof t === 'string') types.add(t)
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x))
    if (Array.isArray(node['@graph'])) collect(node['@graph'])
  }
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/application\/ld\+json/i.test(m[1])) continue
    try {
      collect(JSON.parse(m[2]))
    } catch {
      types.add('__JSON_INVALIDO__')
    }
  }
  return { title, description, canonical, hreflang, ldTypes: [...types].sort() }
}

// ----------------------------------------------------------------- comprobaciones

/**
 * Contrato de una pagina.
 * @param {string} html
 * @param {{ lang: string, path?: string, status?: number, headers?: Record<string,string>, expectPreview?: boolean }} opts
 * @returns {{ failures: string[], warnings: string[] }}
 */
export function checkContract(html, { lang, path = '', status = 200, headers = {}, expectPreview = false }) {
  const failures = []
  const warnings = []

  if (status !== 200) failures.push(`respondio ${status} (se esperaba 200)`)

  const htmlTag = openTags(html, 'html')[0]
  if (!htmlTag) failures.push('no hay etiqueta <html>')
  else if (parseAttrs(htmlTag).lang !== lang) {
    failures.push(`<html lang="${parseAttrs(htmlTag).lang ?? ''}" (se esperaba "${lang}")`)
  }

  const levels = headingLevels(html)
  const h1s = levels.filter((l) => l === 1).length
  if (h1s !== 1) failures.push(`hay ${h1s} h1 (se esperaba 1)`)
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      failures.push(`salto de encabezado de h${levels[i - 1]} a h${levels[i]} (posicion ${i + 1})`)
      break
    }
  }

  const mains = openTags(html, 'main').length
  if (mains !== 1) failures.push(`hay ${mains} <main> (se esperaba 1)`)

  if (expectPreview) {
    const robots = openTags(html, 'meta').filter((t) => (parseAttrs(t).name ?? '').toLowerCase() === 'robots')
    if (!robots.some((t) => /noindex/i.test(parseAttrs(t).content ?? ''))) {
      failures.push('falta meta robots con noindex (EXPECT_PREVIEW=1)')
    }
    const xr = Object.entries(headers).find(([k]) => k.toLowerCase() === 'x-robots-tag')?.[1] ?? ''
    if (!/noindex/i.test(xr)) failures.push('falta x-robots-tag con noindex (EXPECT_PREVIEW=1)')
  }

  let visible = visibleHtml(html)
  for (const known of KNOWN_PENDING[path] ?? []) {
    const n = visible.split(known).length - 1
    if (n > 0) {
      warnings.push(`marcador pendiente conocido x${n} (${known}); lo cierra la fase 56`)
      visible = visible.split(known).join(' ')
    }
  }
  const braces = (visible.match(/\{\{/g) ?? []).length
  if (braces > 0) failures.push(`${braces} aparicion(es) de la secuencia de llaves dobles de marcadores`)
  const ph = (visible.match(/\[PLACEHOLDER\]/g) ?? []).length
  if (ph > 0) failures.push(`${ph} aparicion(es) de [PLACEHOLDER]`)
  const lorem = (visible.match(/\blorem\b/gi) ?? []).length
  if (lorem > 0) failures.push(`${lorem} aparicion(es) de lorem`)

  for (const h of punctuatedHeadings(html)) warnings.push(`encabezado con punto o coma (${h})`)

  return { failures, warnings }
}

/**
 * Paridad de metadatos entre preview y produccion.
 * @returns {string[]} fallos, cada uno con ambos valores
 */
export function compareMeta(preview, prod) {
  const failures = []
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  for (const key of ['title', 'description', 'canonical', 'hreflang', 'ldTypes']) {
    if (!same(preview[key], prod[key])) {
      failures.push(`${key} distinto: preview=${JSON.stringify(preview[key])} produccion=${JSON.stringify(prod[key])}`)
    }
  }
  return failures
}

// ------------------------------------------------------------------- selftest

const FIXTURE_HEAD = (extra = {}) => {
  const { title = 'Inicio | Juan', robots = 'noindex, nofollow' } = extra
  return (
    '<!DOCTYPE html><html lang="es"><head>' +
    `<title>${title}</title>` +
    '<meta name="description" content="Descripcion real"/>' +
    `<meta name="robots" content="${robots}"/>` +
    '<link rel="canonical" href="https://juan-tech.com/"/>' +
    '<link rel="alternate" hreflang="es" href="https://juan-tech.com/"/>' +
    '<link rel="alternate" hreflang="en" href="https://juan-tech.com/en"/>' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite"},{"@type":["Person","Thing"]}]}</script>' +
    '<style>@layer mui{.a{color:red}}</style></head>'
  )
}

const FIXTURE = (extra = {}) => {
  const { body = '<h1>Titulo</h1><h2>Seccion uno</h2><h3>Detalle</h3><h2>Seccion dos</h2>', main = 'main' } = extra
  const open = main === 'main' ? '<main id="main-content">' : '<main id="main-content"><main>'
  const close = main === 'main' ? '</main>' : '</main></main>'
  return FIXTURE_HEAD(extra) + `<body><header></header>${open}${body}${close}<footer></footer></body></html>`
}

const OK_HEADERS = { 'x-robots-tag': 'noindex, nofollow' }

function selftest() {
  let bad = 0
  const expectNone = (name, f) => {
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const expectSome = (name, f) => {
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }
  const opts = { lang: 'es', headers: OK_HEADERS, expectPreview: true }

  expectNone('fixture valido', checkContract(FIXTURE(), opts).failures)
  expectSome('dos h1', checkContract(FIXTURE({ body: '<h1>a</h1><h1>b</h1>' }), opts).failures)
  expectSome('salto de h2 a h4', checkContract(FIXTURE({ body: '<h1>a</h1><h2>b</h2><h4>c</h4>' }), opts).failures)
  expectSome('sin noindex en meta', checkContract(FIXTURE({ robots: 'index, follow' }), opts).failures)
  expectSome('sin x-robots-tag', checkContract(FIXTURE(), { ...opts, headers: {} }).failures)
  expectSome('marcador pendiente', checkContract(FIXTURE({ body: '<h1>a</h1><p>[PLACEHOLDER] pendiente</p>' }), opts).failures)
  expectSome('llaves dobles', checkContract(FIXTURE({ body: '<h1>a</h1><p>{{nombre}}</p>' }), opts).failures)
  expectSome('lorem', checkContract(FIXTURE({ body: '<h1>a</h1><p>Lorem ipsum</p>' }), opts).failures)
  expectSome('dos main', checkContract(FIXTURE({ main: 'dos' }), opts).failures)
  expectSome('estado 404', checkContract(FIXTURE(), { ...opts, status: 404 }).failures)
  expectSome('lang equivocado', checkContract(FIXTURE(), { ...opts, lang: 'en' }).failures)

  // Un marcador dentro de un script que no es ld+json no es HTML visible.
  const inScript = FIXTURE({ body: '<h1>a</h1><script>var x = {{1}}</script>' })
  expectNone('llaves dobles dentro de un script ajeno', checkContract(inScript, opts).failures)

  // Marcador pendiente permitido solo en su ruta y como WARN.
  const pend = FIXTURE({ body: '<h1>a</h1><p>{{pendiente}} fecha del cambio de nombre</p>' })
  const pendOk = checkContract(pend, { ...opts, path: '/sobre-mi' })
  if (pendOk.failures.length === 0 && pendOk.warnings.length === 1) console.log('PASS selftest marcador pendiente conocido en /sobre-mi: un WARN y ningun fallo')
  else {
    bad += 1
    console.log(`FAIL selftest marcador pendiente conocido en /sobre-mi: ${JSON.stringify(pendOk)}`)
  }
  expectSome('marcador pendiente conocido en otra ruta', checkContract(pend, { ...opts, path: '/contact' }).failures)
  expectSome(
    'otro marcador pendiente en /sobre-mi',
    checkContract(FIXTURE({ body: '<h1>a</h1><p>{{pendiente}} otra cosa</p>' }), { ...opts, path: '/sobre-mi' }).failures,
  )

  // Encabezados con punto o coma: WARN, no fallo.
  const punct = checkContract(FIXTURE({ body: '<h1>a</h1><h2>Hola, mundo.</h2><h3>Limpio</h3>' }), opts)
  if (punct.failures.length === 0 && punct.warnings.length === 1) console.log('PASS selftest encabezado con punto o coma: un WARN y ningun fallo')
  else {
    bad += 1
    console.log(`FAIL selftest encabezado con punto o coma: ${JSON.stringify(punct)}`)
  }

  // Paridad.
  const base = extractMeta(FIXTURE())
  expectNone('paridad con la misma pagina', compareMeta(base, extractMeta(FIXTURE())))
  expectSome('title distinto del de produccion', compareMeta(base, extractMeta(FIXTURE({ title: 'Otro titulo' }))))
  expectSome(
    'canonical distinto',
    compareMeta(base, extractMeta(FIXTURE().replace('href="https://juan-tech.com/"/><link rel="alternate" hreflang="es"', 'href="https://dev.juan-tech.com/"/><link rel="alternate" hreflang="es"'))),
  )
  expectSome('hreflang distinto', compareMeta(base, extractMeta(FIXTURE().replace('hreflang="en" href="https://juan-tech.com/en"', 'hreflang="en" href="https://juan-tech.com/en/x"'))))
  expectSome('tipos ld+json distintos', compareMeta(base, extractMeta(FIXTURE().replace('{"@type":"WebSite"},', ''))))

  const m = extractMeta(FIXTURE())
  const typesOk = JSON.stringify(m.ldTypes) === JSON.stringify(['Person', 'Thing', 'WebSite']) && m.hreflang.length === 2
  if (typesOk) console.log('PASS selftest extractMeta: aplana @graph y lee hreflang')
  else {
    bad += 1
    console.log(`FAIL selftest extractMeta: ${JSON.stringify(m)}`)
  }

  // Activos del sandbox.
  const assets = sandboxAssetPaths(
    '<img src="/img/a.png"/><img src="/_next/image?url=%2Flogos%2Fb.svg&w=64&q=75" srcset="/_next/image?url=%2Flogos%2Fb.svg&w=32 1x"/><img src="/media/ok.png"/>',
  )
  if (assets.length === 2 && assets.includes('/img/a.png') && assets.includes('/logos/b.svg')) {
    console.log('PASS selftest sandboxAssetPaths: lee src y el parametro url de next/image')
  } else {
    bad += 1
    console.log(`FAIL selftest sandboxAssetPaths: ${JSON.stringify(assets)}`)
  }

  // Lista de rutas.
  const routes = buildRoutes()
  const hasAll =
    routes.some((r) => r.path === '/servicios/seo-technical-audit') &&
    routes.some((r) => r.path === '/en/services/ai-seo-geo') &&
    routes.some((r) => r.path === '/seo-tecnico-madrid') &&
    routes.some((r) => r.path === '/en/search?q=seo') &&
    routes.length === 30
  if (hasAll) console.log('PASS selftest buildRoutes: 30 rutas en es y en')
  else {
    bad += 1
    console.log(`FAIL selftest buildRoutes: ${routes.length} rutas`)
  }

  console.log(bad === 0 ? 'PASS selftest 54-page-contract: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 54-page-contract (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function get(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const html = await res.text()
    const headers = {}
    res.headers.forEach((v, k) => {
      headers[k] = v
    })
    return { status: res.status, html, headers }
  } catch (err) {
    if (retry) return get(url, false)
    return { status: 0, html: '', headers: {}, error: err.message }
  }
}

async function head(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    await res.arrayBuffer()
    return res.status
  } catch {
    return 0
  }
}

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const expectPreview = process.env.EXPECT_PREVIEW === '1'
  const parityOnly = args.includes('--parity-only')
  const strict = args.includes('--strict-headings')
  const ri = args.indexOf('--routes')
  const subset = ri >= 0 && args[ri + 1] ? new Set(args[ri + 1].split(',')) : null

  let routes = buildRoutes()
  if (subset) {
    routes = routes.filter((r) => subset.has(r.path))
    if (routes.length === 0) {
      console.log(`FAIL --routes no coincide con ninguna ruta de la lista: ${[...subset].join(',')}`)
      return 1
    }
  }

  let failed = 0
  let passed = 0
  let warned = 0
  const report = (lines) => {
    for (const l of lines) console.log(l)
  }

  const checkRoute = async (route) => {
    const out = []
    let f = 0
    let p = 0
    let w = 0
    const url = base + route.path
    const page = await get(url)
    if (page.error) {
      return { out: [`FAIL ${route.path}: ${page.error}`], f: 1, p: 0, w: 0 }
    }

    if (!parityOnly) {
      const { failures, warnings } = checkContract(page.html, { lang: route.lang, path: route.path, status: page.status, headers: page.headers, expectPreview })
      for (const x of failures) {
        out.push(`FAIL ${route.path} contrato: ${x}`)
        f += 1
      }
      for (const x of warnings) {
        if (strict) {
          out.push(`FAIL ${route.path} contrato: ${x}`)
          f += 1
        } else {
          out.push(`WARN ${route.path}: ${x}`)
          w += 1
        }
      }
      const fBefore = f
      const assets = sandboxAssetPaths(page.html)
      for (const a of assets) {
        const st = await head(base + a)
        if (st === 404 || st === 0) {
          out.push(`FAIL ${route.path} activo del sandbox sin archivo: ${a} responde ${st}`)
          f += 1
        }
      }
      if (f === fBefore && failures.length === 0 && !(strict && warnings.length)) {
        out.push(`PASS ${route.path} contrato (lang ${route.lang}, un h1, un main, sin marcadores)`)
        p += 1
      }
    }

    if (NEW_ROUTES.has(route.path)) {
      out.push(`PASS ${route.path} paridad omitida: la ruta es nueva y no existe en produccion`)
      p += 1
    } else {
      const prod = await get(prodBase + route.path)
      if (prod.status !== 200) {
        out.push(`FAIL ${route.path} paridad: produccion responde ${prod.status || prod.error} y no hay con que comparar`)
        f += 1
      } else {
        const diffs = compareMeta(extractMeta(page.html), extractMeta(prod.html))
        if (diffs.length === 0) {
          out.push(`PASS ${route.path} paridad de title, description, canonical, hreflang y ld+json con produccion`)
          p += 1
        } else {
          for (const d of diffs) {
            out.push(`FAIL ${route.path} paridad ${d}`)
            f += 1
          }
        }
      }
    }
    return { out, f, p, w }
  }

  const CONCURRENCY = 4
  let next = 0
  const results = new Array(routes.length)
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, routes.length) }, async () => {
      while (next < routes.length) {
        const i = next++
        results[i] = await checkRoute(routes[i])
      }
    }),
  )
  for (const r of results) {
    report(r.out)
    failed += r.f
    passed += r.p
    warned += r.w
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 54-page-contract: ${passed} PASS, ${failed} FAIL, ${warned} WARN en ${routes.length} ruta(s)`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const code = args.includes('--selftest') ? selftest() : await live(args)
  process.exit(code)
}
