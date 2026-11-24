// Contrato HTML por ruta y locale de las superficies de la fase 55 (plan 55-02,
// PAG-03, PAG-04, PAG-05, PAG-10, D-26, D-32).
//
// Superficies: /case-studies, /websites, /blog, /authors, cada slug de las APIs
// publicas case-studies, websites y authors, /blog/<categoria> para las cinco
// categorias (incluida general) y /authors/<slug>, todo en es y en (prefijo /en).
// La lista se construye desde PRODUCCION en vivo (solo lectura), asi un preview
// que no ha sembrado un caso no recorta la lista contra la que se compara.
//
// A cada ruta se le aplica `checkContract` de 54-page-contract.mjs (estado 200, lang,
// un h1, sin saltos de encabezado, un main, noindex del preview con EXPECT_PREVIEW=1,
// sin llaves dobles de marcadores, sin [PLACEHOLDER] ni lorem) y la comprobacion de
// activos del sandbox sin archivo. Los posts individuales los cubre
// 55-post-contract.mjs, no este script.
//
// Modos:
//   --selftest               Fixture valido con cero fallos y defectuosos (dos h1, salto
//                            de nivel, sin noindex, sin id casos, sin id sitios, lista de
//                            rutas incompleta); cada uno debe dar al menos un fallo.
//   --routes a,b,c           Subconjunto de rutas (la ruta exacta, con prefijo /en si es EN).
//   --require-home-sections  Agrega / y /en y exige id="casos" e id="sitios" en ambas
//                            (cierra el residuo de PAG-01, D-26). Producciones previas a
//                            la fase no los traen: solo tiene sentido contra el preview.
//   (sin modo)               Contrato completo contra BASE_URL (obligatoria).
//
// Variables: BASE_URL (obligatoria), PROD_BASE (por defecto https://juan-tech.com),
// EXPECT_PREVIEW=1.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL. Los
// conteos usan expresiones globales sobre el HTML (llega en una sola linea, `grep -c`
// daria siempre 1). Nunca escribe en ninguna base ni envia correos: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

import { checkContract, sandboxAssetPaths } from './54-page-contract.mjs'

/** Las cinco categorias del blog; general es la de respaldo y responde 200 vacia. */
export const CATEGORIES = ['tech-seo', 'seo', 'development', 'cs-fundamentals', 'general']

// ----------------------------------------------------------------- utilidades HTML

/** Lee los atributos de una etiqueta de apertura como mapa nombre -> valor. */
export function parseAttrs(tag) {
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
export function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

export function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/** Todos los valores del atributo id de la pagina, en orden de aparicion. */
export function allIds(html) {
  const ids = []
  for (const m of html.matchAll(/<[a-zA-Z][^>]*?\sid\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/g)) ids.push(m[1] ?? m[2] ?? '')
  return ids
}

/** Niveles de encabezado en orden de aparicion. */
export function headingLevels(html) {
  return [...html.matchAll(/<h([1-6])(?=[\s>/])/gi)].map((m) => Number(m[1]))
}

// ------------------------------------------------------------------------- red

export async function getPage(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const html = await res.text()
    const headers = {}
    res.headers.forEach((v, k) => {
      headers[k] = v
    })
    return { status: res.status, html, headers, finalUrl: res.url }
  } catch (err) {
    if (retry) return getPage(url, false)
    return { status: 0, html: '', headers: {}, error: err.message }
  }
}

/** GET sin seguir redirecciones: estado y cabecera Location. */
export async function getNoFollow(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'manual' })
    await res.arrayBuffer()
    return { status: res.status, location: res.headers.get('location') ?? '' }
  } catch (err) {
    if (retry) return getNoFollow(url, false)
    return { status: 0, location: '', error: err.message }
  }
}

async function headStatus(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    await res.arrayBuffer()
    return res.status
  } catch {
    return 0
  }
}

/** Ejecuta `fn` sobre cada elemento con N trabajos a la vez; conserva el orden. */
export async function pool(items, concurrency, fn) {
  let next = 0
  const results = new Array(items.length)
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await fn(items[i], i)
      }
    }),
  )
  return results
}

/** Slugs de una coleccion de la API publica de produccion (solo lectura). */
export async function fetchSlugs(prodBase, collection, locale) {
  const url = `${prodBase}/api/${collection}?locale=${locale}&limit=100&depth=0`
  const res = await getPage(url)
  if (res.status !== 200) throw new Error(`${url} respondio ${res.status || res.error}`)
  const body = JSON.parse(res.html)
  return (body.docs ?? []).map((d) => d.slug).filter((s) => typeof s === 'string' && s.length > 0)
}

/**
 * Los posts ES del sitemap de produccion: { path, category, slug }. Las URLs EN se
 * derivan despues anteponiendo /en, nunca desde las entradas EN del sitemap, que solo
 * lista los posts completos (Pitfall 15).
 */
export async function fetchPostPaths(prodBase) {
  const res = await getPage(`${prodBase}/sitemap.xml`)
  if (res.status !== 200) throw new Error(`sitemap.xml respondio ${res.status || res.error}`)
  return postPathsFromSitemap(res.html)
}

export function postPathsFromSitemap(xml) {
  const out = []
  const seen = new Set()
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    let pathname
    try {
      pathname = new URL(decodeEntities(m[1])).pathname
    } catch {
      continue
    }
    const p = pathname.match(/^\/blog\/([^/]+)\/([^/]+)\/?$/)
    if (p && !seen.has(pathname)) {
      seen.add(pathname)
      out.push({ path: pathname.replace(/\/$/, ''), category: p[1], slug: p[2] })
    }
  }
  return out
}

/** Prefijo /en de una ruta ES. */
export const enPath = (path) => (path === '/' ? '/en' : `/en${path}`)

// -------------------------------------------------------------------- rutas

/** Lista de rutas de las superficies 55 a partir de los slugs vivos. */
export function surfaceRoutes({ cases = [], websites = [], authors = [], homeSections = false } = {}) {
  const es = []
  if (homeSections) es.push('/')
  es.push('/case-studies', '/websites', '/blog', '/authors')
  for (const s of cases) es.push(`/case-studies/${s}`)
  for (const s of websites) es.push(`/websites/${s}`)
  for (const c of CATEGORIES) es.push(`/blog/${c}`)
  for (const s of authors) es.push(`/authors/${s}`)
  return [...es.map((path) => ({ path, lang: 'es' })), ...es.map((path) => ({ path: enPath(path), lang: 'en' }))]
}

/** Rutas completas desde produccion en vivo. */
export async function liveSurfaceRoutes(prodBase, { homeSections = false } = {}) {
  const [cases, websites, authors] = await Promise.all(
    ['case-studies', 'websites', 'authors'].map((c) => fetchSlugs(prodBase, c, 'es')),
  )
  return surfaceRoutes({ cases, websites, authors, homeSections })
}

/** Aplica --routes a una lista; devuelve null si ninguna coincide. */
export function filterRoutes(routes, subset) {
  if (!subset) return routes
  const picked = routes.filter((r) => subset.has(r.path))
  return picked.length > 0 ? picked : null
}

export function parseRoutesFlag(args) {
  const i = args.indexOf('--routes')
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null
}

// ------------------------------------------------------------ comprobaciones

/** Fallos de la comprobacion de secciones de la home: id casos e id sitios. */
export function checkHomeSections(html) {
  const ids = new Set(allIds(html))
  const failures = []
  for (const id of ['casos', 'sitios']) {
    if (!ids.has(id)) failures.push(`falta el elemento con id="${id}" en la home (D-26)`)
  }
  return failures
}

/**
 * Contrato de una ruta: el de 54 mas, en `/` y `/en` con `homeSections`, los id de la home.
 * @returns {{ failures: string[], warnings: string[] }}
 */
export function checkRoute(html, { route, status = 200, headers = {}, expectPreview = false, homeSections = false }) {
  const { failures, warnings } = checkContract(html, { lang: route.lang, path: route.path, status, headers, expectPreview })
  if (homeSections && (route.path === '/' || route.path === '/en')) failures.push(...checkHomeSections(html))
  return { failures, warnings }
}

// ------------------------------------------------------------------- selftest

const FIXTURE = ({ body = '<h1>Titulo</h1><h2>Seccion</h2><h3>Detalle</h3>', robots = 'noindex, nofollow' } = {}) =>
  '<!DOCTYPE html><html lang="es"><head><title>Pagina</title>' +
  `<meta name="robots" content="${robots}"/></head>` +
  `<body><header></header><main id="main-content">${body}</main><footer></footer></body></html>`

const HOME_BODY = '<h1>Inicio</h1><section id="casos"><h2>Casos</h2></section><section id="sitios"><h2>Sitios</h2></section>'
const OK_HEADERS = { 'x-robots-tag': 'noindex, nofollow' }

function selftest() {
  let bad = 0
  const none = (name, f) => {
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const some = (name, f) => {
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }
  const base = { route: { path: '/websites', lang: 'es' }, headers: OK_HEADERS, expectPreview: true }
  const home = { route: { path: '/', lang: 'es' }, headers: OK_HEADERS, expectPreview: true, homeSections: true }

  none('fixture valido', checkRoute(FIXTURE(), base).failures)
  some('dos h1', checkRoute(FIXTURE({ body: '<h1>a</h1><h1>b</h1>' }), base).failures)
  some('salto de h2 a h4', checkRoute(FIXTURE({ body: '<h1>a</h1><h2>b</h2><h4>c</h4>' }), base).failures)
  some('sin noindex', checkRoute(FIXTURE({ robots: 'index, follow' }), base).failures)
  some('sin x-robots-tag', checkRoute(FIXTURE(), { ...base, headers: {} }).failures)
  some('estado 404', checkRoute(FIXTURE(), { ...base, status: 404 }).failures)
  some('lang equivocado', checkRoute(FIXTURE(), { ...base, route: { path: '/websites', lang: 'en' } }).failures)

  none('home con id casos e id sitios', checkRoute(FIXTURE({ body: HOME_BODY }), home).failures)
  some('home sin id casos', checkRoute(FIXTURE({ body: HOME_BODY.replace('id="casos"', 'id="otro"') }), home).failures)
  some('home sin id sitios', checkRoute(FIXTURE({ body: HOME_BODY.replace('id="sitios"', 'id="otro"') }), home).failures)
  none('home sin la bandera no exige ids', checkRoute(FIXTURE({ body: '<h1>Inicio</h1>' }), { ...home, homeSections: false }).failures)
  none(
    'ids solo se exigen en la home',
    checkRoute(FIXTURE(), { ...base, homeSections: true }).failures,
  )

  const ids = allIds('<div id="a"></div><section id=\'b\'></section><p data-id="c"></p>')
  if (ids.length === 2 && ids[0] === 'a' && ids[1] === 'b') console.log('PASS selftest allIds: lee id y no data-id')
  else {
    bad += 1
    console.log(`FAIL selftest allIds: ${JSON.stringify(ids)}`)
  }

  // Lista de rutas: 4 indices + slugs + 5 categorias + autores, por 2 idiomas.
  const routes = surfaceRoutes({ cases: ['c1', 'c2'], websites: ['w1'], authors: ['a1'] })
  const expected = (4 + 2 + 1 + 5 + 1) * 2
  const has = (p) => routes.some((r) => r.path === p)
  const listOk =
    routes.length === expected &&
    has('/blog/general') &&
    has('/en/blog/general') &&
    has('/case-studies/c2') &&
    has('/en/websites/w1') &&
    has('/authors/a1') &&
    routes.filter((r) => r.lang === 'en').every((r) => r.path.startsWith('/en/'))
  if (listOk) console.log(`PASS selftest surfaceRoutes: ${routes.length} rutas en es y en, con las cinco categorias`)
  else {
    bad += 1
    console.log(`FAIL selftest surfaceRoutes: ${routes.length} rutas (se esperaban ${expected})`)
  }
  const withHome = surfaceRoutes({ homeSections: true })
  if (withHome.some((r) => r.path === '/') && withHome.some((r) => r.path === '/en')) console.log('PASS selftest surfaceRoutes: homeSections agrega / y /en')
  else {
    bad += 1
    console.log('FAIL selftest surfaceRoutes: homeSections no agrego / y /en')
  }
  some('lista de rutas vacia con --routes ajeno', filterRoutes(routes, new Set(['/no-existe'])) === null ? ['null'] : [])

  const xml =
    '<urlset><url><loc>https://juan-tech.com/blog/seo/a</loc></url><url><loc>https://juan-tech.com/en/blog/seo/a</loc></url>' +
    '<url><loc>https://juan-tech.com/blog/seo</loc></url><url><loc>https://juan-tech.com/blog/dev/b</loc></url></urlset>'
  const posts = postPathsFromSitemap(xml)
  if (posts.length === 2 && posts[0].slug === 'a' && posts[1].category === 'dev') console.log('PASS selftest postPathsFromSitemap: solo posts ES, sin categorias ni EN')
  else {
    bad += 1
    console.log(`FAIL selftest postPathsFromSitemap: ${JSON.stringify(posts)}`)
  }

  console.log(bad === 0 ? 'PASS selftest 55-page-contract: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 55-page-contract (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const expectPreview = process.env.EXPECT_PREVIEW === '1'
  const homeSections = args.includes('--require-home-sections')

  let routes
  try {
    routes = await liveSurfaceRoutes(prodBase, { homeSections })
  } catch (err) {
    console.log(`FAIL no se pudo construir la lista de rutas desde produccion: ${err.message}`)
    return 1
  }
  const subset = parseRoutesFlag(args)
  if (subset) {
    // Con --routes se aceptan tambien rutas de la home aunque no se pidiera la bandera.
    const all = subset.has('/') || subset.has('/en') ? await liveSurfaceRoutes(prodBase, { homeSections: true }) : routes
    routes = filterRoutes(all, subset)
    if (!routes) {
      console.log(`FAIL --routes no coincide con ninguna ruta de la lista: ${[...subset].join(',')}`)
      return 1
    }
  }

  const results = await pool(routes, 4, async (route) => {
    const out = []
    let f = 0
    let p = 0
    let w = 0
    const page = await getPage(base + route.path)
    if (page.error) return { out: [`FAIL ${route.path}: ${page.error}`], f: 1, p: 0, w: 0 }
    const { failures, warnings } = checkRoute(page.html, { route, status: page.status, headers: page.headers, expectPreview, homeSections })
    for (const x of failures) {
      out.push(`FAIL ${route.path} contrato: ${x}`)
      f += 1
    }
    for (const x of warnings) {
      out.push(`WARN ${route.path}: ${x}`)
      w += 1
    }
    for (const a of sandboxAssetPaths(page.html)) {
      const st = await headStatus(base + a)
      if (st === 404 || st === 0) {
        out.push(`FAIL ${route.path} activo del sandbox sin archivo: ${a} responde ${st}`)
        f += 1
      }
    }
    if (f === 0) {
      out.push(`PASS ${route.path} contrato (lang ${route.lang}, un h1, un main, sin marcadores)`)
      p += 1
    }
    return { out, f, p, w }
  })

  let failed = 0
  let passed = 0
  let warned = 0
  for (const r of results) {
    for (const l of r.out) console.log(l)
    failed += r.f
    passed += r.p
    warned += r.w
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 55-page-contract: ${passed} PASS, ${failed} FAIL, ${warned} WARN en ${routes.length} ruta(s)`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  process.exit(args.includes('--selftest') ? selftest() : await live(args))
}
