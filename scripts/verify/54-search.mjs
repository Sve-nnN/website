// Contrato HTTP de la busqueda (fase 54, plan 54-11, PAG-12).
//
// Valida sobre el HTML servido (no sobre el codigo fuente):
//   - /search y /en/search sin consulta: 200, un h1, un main, un form role="search"
//     con un campo name="q", ninguna region role="status".
//   - /search?q=seo: al menos un resultado (enlace dentro de un h2 de la lista),
//     la region role="status" con el conteo, y los primeros tres href responden 200
//     contra BASE_URL siguiendo redirecciones.
//   - /search?q=zzzzqx (y la version en ingles): region de estado con cero, un h2 de
//     sin resultados y los dos enlaces de salida (blog y casos de exito).
//   - /search?q=<300 caracteres>: 200 y el campo llega con 200 caracteres (T-54-43,
//     la ruta recorta con MAX_QUERY_LENGTH).
//   - Todas llevan meta robots con noindex y follow (SEO-46); con EXPECT_PREVIEW=1
//     tambien la cabecera x-robots-tag con noindex.
//
// Modos:
//   --selftest  Evalua checkSearchPage sobre fixtures validos (cero fallos) y
//               defectuosos (sin form de busqueda, sin resultados con la consulta de
//               prueba, sin noindex, con region de estado sin consulta...; cada
//               defectuoso debe dar al menos un fallo). Sale 0 solo si se comporta
//               como se espera.
//   (sin modo)  Corre contra BASE_URL (obligatoria).
//
// Variables: BASE_URL, EXPECT_PREVIEW=1.
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

const MAX_QUERY_LENGTH = 200

/** Etiquetas de apertura de un elemento (sin cuerpo ni cierre). */
function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

/** Atributos de una etiqueta de apertura como mapa nombre -> valor (entidades basicas decodificadas). */
function parseAttrs(tag) {
  const attrs = {}
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  const body = tag.replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '')
  let m
  while ((m = re.exec(body)) !== null) {
    const raw = m[2] ?? m[3] ?? m[4] ?? ''
    attrs[m[1].toLowerCase()] = raw.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  }
  return attrs
}

/** Texto visible aproximado de un fragmento de HTML. */
function textOf(fragment) {
  return fragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Campo de busqueda (input name="q"), o null. */
function searchInput(html) {
  const inputs = openTags(html, 'input').filter((tag) => parseAttrs(tag).name === 'q')
  return inputs.length === 1 ? parseAttrs(inputs[0]) : null
}

/**
 * Datos de la zona de resultados: lo que hay entre la region de estado y el pie.
 * Devuelve null cuando no hay region de estado.
 */
function resultsZone(html) {
  const statusMatch = /<[a-z0-9]+[^>]*role="status"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/i.exec(html)
  if (!statusMatch) return null
  const start = statusMatch.index
  const footer = html.indexOf('<footer', start)
  return { statusText: textOf(statusMatch[1]), zone: html.slice(start, footer === -1 ? undefined : footer) }
}

/** Href de los enlaces dentro de los h2 de la primera lista de la zona de resultados. */
function resultHrefs(zone) {
  const list = /<ul[^>]*>[\s\S]*?<\/ul>/i.exec(zone)?.[0] ?? ''
  const hrefs = []
  for (const h2 of list.match(/<h2[\s>][\s\S]*?<\/h2>/gi) ?? []) {
    for (const a of openTags(h2, 'a')) {
      const href = parseAttrs(a).href
      if (href) hrefs.push(href)
    }
  }
  return hrefs
}

/**
 * @param {{ status: number, html: string, xRobotsTag?: string|null }} res
 * @param {'empty'|'results'|'none'} kind  sin consulta, con resultados o sin resultados
 * @param {{ expectPreview?: boolean }} opts
 * @returns {string[]} lista de fallos (vacia si cumple el contrato)
 */
export function checkSearchPage({ status, html, xRobotsTag = null }, kind, { expectPreview = false } = {}) {
  const failures = []

  if (status !== 200) failures.push(`estado ${status} (se esperaba 200)`)

  for (const [name, expected] of [
    ['h1', 1],
    ['main', 1],
  ]) {
    const n = openTags(html, name).length
    if (n !== expected) failures.push(`hay ${n} <${name}> (se esperaba ${expected})`)
  }

  const forms = openTags(html, 'form').filter((tag) => parseAttrs(tag).role === 'search')
  if (forms.length !== 1) failures.push(`hay ${forms.length} form role="search" (se esperaba 1)`)
  if (!searchInput(html)) failures.push('no hay exactamente un campo name="q"')

  const robots = openTags(html, 'meta').find((tag) => parseAttrs(tag).name === 'robots')
  if (!robots) failures.push('no hay meta robots')
  else {
    const content = parseAttrs(robots).content ?? ''
    if (!/noindex/i.test(content)) failures.push(`meta robots sin noindex (${content})`)
    if (!/(^|[\s,])follow/i.test(content)) failures.push(`meta robots sin follow (${content})`)
  }
  if (expectPreview && !/noindex/i.test(xRobotsTag ?? '')) {
    failures.push(`falta x-robots-tag con noindex (cabecera: ${xRobotsTag})`)
  }

  const zone = resultsZone(html)
  if (kind === 'empty') {
    if (zone) failures.push('hay region role="status" sin consulta')
    return failures
  }

  if (!zone) {
    failures.push('falta la region role="status" con el conteo')
    return failures
  }
  const count = /\d+/.exec(zone.statusText)
  if (!count) failures.push(`la region de estado no trae un conteo (${JSON.stringify(zone.statusText)})`)

  const hrefs = resultHrefs(zone.zone)
  if (kind === 'results') {
    if (hrefs.length === 0) failures.push('la consulta de prueba no trae ningun resultado (enlace dentro de un h2 de la lista)')
    if (count && Number(count[0]) === 0) failures.push('el conteo dice 0 con la consulta de prueba')
  } else {
    if (hrefs.length > 0) failures.push(`la consulta sin coincidencias trae ${hrefs.length} resultado(s)`)
    if (count && Number(count[0]) !== 0) failures.push(`el conteo dice ${count[0]} (se esperaba 0)`)
    const h2s = zone.zone.match(/<h2[\s>][\s\S]*?<\/h2>/gi) ?? []
    if (h2s.length !== 1) failures.push(`hay ${h2s.length} h2 en la zona de resultados (se esperaba 1, el de sin resultados)`)
    const outlets = openTags(zone.zone, 'a')
      .map((a) => parseAttrs(a).href ?? '')
      .map((h) => h.replace(/^\/en(?=\/)/, ''))
    for (const wanted of ['/blog', '/case-studies']) {
      if (!outlets.includes(wanted)) failures.push(`falta el enlace de salida a ${wanted}`)
    }
  }
  return failures
}

// ---------------------------------------------------------------------- selftest

const HEAD =
  '<html lang="es"><head><meta name="robots" content="noindex, follow"/></head><body><header></header><main id="main-content">'
const HERO = '<section><h1 id="page-title">Buscar</h1></section>'
const FORM =
  '<form role="search" method="get" action="" aria-label="Búsqueda"><input type="search" name="q" value="seo"/><button type="submit">Buscar en el sitio</button></form>'
const TAIL = '</main><footer><h2><a href="/blog">pie</a></h2></footer></body></html>'

const page = (body) => `${HEAD}${HERO}${FORM}${body}${TAIL}`
const RESULTS = page(
  '<p role="status" aria-live="polite">3 resultados</p><ul role="list">' +
    '<li><h2><a href="/blog/seo/uno">Uno</a></h2></li><li><h2><a href="/case-studies/dos">Dos</a></h2></li>' +
    '<li><h2><a href="/authors/tres">Tres</a></h2></li></ul>',
)
const NONE = page(
  '<p role="status" aria-live="polite">0 resultados</p><h2>Sin resultados para &quot;zzzzqx&quot;</h2><p>Prueba otro</p>' +
    '<a href="/blog">Blog</a><a href="/case-studies">Casos de éxito</a>',
)
const NONE_EN = NONE.replace('href="/blog"', 'href="/en/blog"').replace('href="/case-studies"', 'href="/en/case-studies"')
const EMPTY = `${HEAD}${HERO}${FORM}${TAIL}`

function selftest() {
  let bad = 0
  const ok = (html, extra = {}) => ({ status: 200, html, ...extra })
  const expectClean = (name, res, kind, opts) => {
    const f = checkSearchPage(res, kind, opts)
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const expectBroken = (name, res, kind, opts) => {
    const f = checkSearchPage(res, kind, opts)
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }

  expectClean('vacio valido', ok(EMPTY), 'empty')
  expectClean('resultados validos', ok(RESULTS), 'results')
  expectClean('sin resultados valido', ok(NONE), 'none')
  expectClean('sin resultados valido en ingles', ok(NONE_EN), 'none')
  expectClean('preview valido', ok(EMPTY, { xRobotsTag: 'noindex, nofollow' }), 'empty', { expectPreview: true })

  expectBroken('estado 500', { status: 500, html: EMPTY }, 'empty')
  expectBroken('sin form de busqueda', ok(EMPTY.replace('role="search"', '')), 'empty')
  expectBroken('sin campo q', ok(EMPTY.replace('name="q"', 'name="s"')), 'empty')
  expectBroken('dos h1', ok(EMPTY.replace(HERO, `${HERO}<h1>otro</h1>`)), 'empty')
  expectBroken('sin noindex', ok(EMPTY.replace('noindex, follow', 'index, follow')), 'empty')
  expectBroken('sin follow', ok(EMPTY.replace('noindex, follow', 'noindex, nofollow')), 'empty')
  expectBroken('preview sin x-robots-tag', ok(EMPTY), 'empty', { expectPreview: true })
  expectBroken('region de estado sin consulta', ok(page('<p role="status">0 resultados</p>')), 'empty')
  expectBroken('con consulta de prueba pero sin region de estado', ok(page('<ul role="list"><li><h2><a href="/a">A</a></h2></li></ul>')), 'results')
  expectBroken(
    'sin resultados con la consulta de prueba',
    ok(page('<p role="status">0 resultados</p><ul role="list"></ul>')),
    'results',
  )
  expectBroken(
    'resultados con enlace fuera de un h2',
    ok(page('<p role="status">1 resultado</p><ul role="list"><li><p><a href="/a">A</a></p></li></ul>')),
    'results',
  )
  expectBroken('region de estado sin conteo', ok(page('<p role="status">listo</p><ul role="list"><li><h2><a href="/a">A</a></h2></li></ul>')), 'results')
  expectBroken('sin resultados pero con resultados', ok(RESULTS), 'none')
  expectBroken('sin resultados sin enlace a /case-studies', ok(NONE.replace('<a href="/case-studies">Casos de éxito</a>', '')), 'none')
  expectBroken('sin resultados sin h2', ok(NONE.replace(/<h2>[\s\S]*?<\/h2>/, '')), 'none')

  // Funciones de apoyo del modo en vivo.
  const hrefs = resultHrefs(resultsZone(RESULTS).zone)
  if (hrefs.join('|') === '/blog/seo/uno|/case-studies/dos|/authors/tres') console.log('PASS selftest resultHrefs: tres href en orden')
  else {
    bad += 1
    console.log(`FAIL selftest resultHrefs: dio ${JSON.stringify(hrefs)}`)
  }
  if (searchInput(EMPTY)?.value === 'seo') console.log('PASS selftest searchInput: lee el value del campo')
  else {
    bad += 1
    console.log('FAIL selftest searchInput: no leyo el value del campo')
  }

  if (bad === 0) console.log('PASS selftest 54-search: fixtures validos sin fallos y defectuosos detectados')
  return bad > 0 ? 1 : 0
}

// -------------------------------------------------------------------------- HTTP

let failures = 0

async function fetchFinal(base, route) {
  // Sigue redirecciones a mano para quedarse con el estado final.
  let url = new URL(route, base)
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { redirect: 'manual' })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url)
      continue
    }
    return { status: res.status, html: await res.text(), xRobotsTag: res.headers.get('x-robots-tag') }
  }
  return { status: 310, html: '', xRobotsTag: null }
}

function report(name, list) {
  if (list.length === 0) console.log(`PASS ${name}`)
  else {
    failures += list.length
    console.log(`FAIL ${name}: ${list.join('; ')}`)
  }
}

async function liveMode(base, expectPreview) {
  const cases = [
    ['/search', 'empty'],
    ['/en/search', 'empty'],
    ['/search?q=seo', 'results'],
    ['/search?q=zzzzqx', 'none'],
    ['/en/search?q=zzzzqx', 'none'],
  ]
  for (const [route, kind] of cases) {
    try {
      const res = await fetchFinal(base, route)
      report(route, checkSearchPage(res, kind, { expectPreview }))
      if (route === '/search?q=seo') {
        const zone = resultsZone(res.html)
        const hrefs = zone ? resultHrefs(zone.zone).slice(0, 3) : []
        for (const href of hrefs) {
          try {
            const r = await fetch(new URL(href, base), { redirect: 'follow' })
            report(`resultado ${href} responde 200`, r.status === 200 ? [] : [`estado ${r.status}`])
          } catch (error) {
            report(`resultado ${href} responde 200`, [`error de red: ${error instanceof Error ? error.message : String(error)}`])
          }
        }
      }
    } catch (error) {
      report(route, [`error de red: ${error instanceof Error ? error.message : String(error)}`])
    }
  }

  // T-54-43: la ruta recorta la consulta a 200 caracteres.
  try {
    const res = await fetchFinal(base, `/search?q=${'a'.repeat(300)}`)
    const length = searchInput(res.html)?.value?.length
    const list = []
    if (res.status !== 200) list.push(`estado ${res.status} (se esperaba 200)`)
    if (length !== MAX_QUERY_LENGTH) list.push(`el campo llega con ${length} caracteres (se esperaban ${MAX_QUERY_LENGTH})`)
    report('consulta de 300 caracteres llega recortada a 200', list)
  } catch (error) {
    report('consulta de 300 caracteres llega recortada a 200', [`error de red: ${error instanceof Error ? error.message : String(error)}`])
  }
}

// -------------------------------------------------------------------------- main

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const expectPreview = process.env.EXPECT_PREVIEW === '1'

  if (args.includes('--selftest')) {
    process.exit(selftest())
  }
  const base = process.env.BASE_URL
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    process.exit(1)
  }
  await liveMode(base, expectPreview)
  process.exit(failures > 0 ? 1 : 0)
}
