// Contrato de URLs duales de servicios y de landings locales (fase 54, plan 54-15,
// PAG-02, PAG-12, SEO-01).
//
// Servicios es la unica seccion cuyo segmento de URL cambia por idioma
// (`/servicios` en espanol, `/en/services` en ingles). Las carpetas fisicas son
// cuatro por pagina (es y en por servicios y services), pero el canonical se
// calcula por IDIOMA, no por carpeta: las combinaciones cruzadas
// (`/services`, `/en/servicios`) tienen que responder 200 y apuntar su canonical
// al segmento correcto de su idioma, no a su propia carpeta. Las landings Lima y
// Madrid no cambian de segmento: solo el prefijo `/en`.
//
// Valida sobre el HTML servido (no sobre el codigo fuente), por cada URL:
//   - estado 200 y exactamente un h1;
//   - un `link rel="canonical"` al segmento del idioma de la URL;
//   - los tres `link rel="alternate"` hreflang (es, en y x-default) con el href
//     esperado (x-default apunta a la URL en espanol);
//   - con EXPECT_PREVIEW=1, noindex tambien en la cabecera x-robots-tag.
//
// URLs: /servicios, /en/services y las cuatro rutas de servicio en las dos formas
// (/servicios/<slug>, /en/services/<slug>); las variantes cruzadas /services,
// /en/servicios, /services/<slug> y /en/servicios/<slug>; y las landings
// /seo-tecnico-lima, /en/seo-tecnico-lima, /seo-tecnico-madrid y
// /en/seo-tecnico-madrid (canonical a su propia URL).
//
// Modos:
//   --selftest  Evalua checkPage sobre un fixture valido (cero fallos) y sobre
//               defectuosos (canonical con el segmento equivocado, sin hreflang,
//               hreflang con el href equivocado, dos h1, estado 404, sin noindex
//               con EXPECT_PREVIEW; cada defectuoso debe dar al menos un fallo) y
//               comprueba la tabla de casos. Sale 0 solo si se comporta asi.
//   (sin modo)  Corre contra BASE_URL (obligatoria).
//
// Variables:
//   BASE_URL        sitio a revisar (https://dev.juan-tech.com para el preview).
//   SITE_BASE       base canonica esperada en canonical y hreflang; por defecto
//                   https://juan-tech.com (el preview declara la base de produccion).
//   EXPECT_PREVIEW  1 exige tambien noindex en x-robots-tag.
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

const SITE_BASE = (process.env.SITE_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')

/** Tabla de casos: ruta pedida y rutas canonicas en espanol e ingles. */
export function buildCases() {
  const cases = []
  const add = (route, esPath, enPath, locale) => cases.push({ route, esPath, enPath, locale })

  // Indice de servicios: las dos rutas propias y las dos cruzadas.
  add('/servicios', '/servicios', '/en/services', 'es')
  add('/en/services', '/servicios', '/en/services', 'en')
  add('/services', '/servicios', '/en/services', 'es')
  add('/en/servicios', '/servicios', '/en/services', 'en')

  for (const slug of SERVICE_SLUGS) {
    const es = `/servicios/${slug}`
    const en = `/en/services/${slug}`
    add(es, es, en, 'es')
    add(en, es, en, 'en')
    add(`/services/${slug}`, es, en, 'es')
    add(`/en/servicios/${slug}`, es, en, 'en')
  }

  // Landings locales: el segmento no cambia por idioma.
  for (const slug of LOCAL_SLUGS) {
    add(`/${slug}`, `/${slug}`, `/en/${slug}`, 'es')
    add(`/en/${slug}`, `/${slug}`, `/en/${slug}`, 'en')
  }
  return cases
}

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

/**
 * Comprueba una respuesta contra el caso. Devuelve la lista de fallos (vacia si pasa).
 * `siteBase` es la base canonica esperada, sin barra final.
 */
export function checkPage({ status, html, xRobotsTag = null }, kase, { expectPreview = false, siteBase = SITE_BASE } = {}) {
  const failures = []
  if (status !== 200) failures.push(`estado ${status} (se esperaba 200)`)

  const h1 = (html.match(/<h1(?=[\s>])/gi) ?? []).length
  if (h1 !== 1) failures.push(`${h1} h1 (se esperaba 1)`)

  const links = openTags(html, 'link').map(parseAttrs)
  const expectedCanonical = `${siteBase}${kase.locale === 'es' ? kase.esPath : kase.enPath}`

  const canonicals = links.filter((l) => (l.rel ?? '').toLowerCase() === 'canonical')
  if (canonicals.length !== 1) {
    failures.push(`${canonicals.length} canonical (se esperaba 1)`)
  } else if (canonicals[0].href !== expectedCanonical) {
    failures.push(`canonical ${canonicals[0].href} (se esperaba ${expectedCanonical})`)
  }

  const alternates = links.filter((l) => (l.rel ?? '').toLowerCase() === 'alternate' && l.hreflang)
  const expectedHreflang = {
    es: `${siteBase}${kase.esPath}`,
    en: `${siteBase}${kase.enPath}`,
    'x-default': `${siteBase}${kase.esPath}`,
  }
  for (const [lang, href] of Object.entries(expectedHreflang)) {
    const found = alternates.filter((l) => l.hreflang.toLowerCase() === lang)
    if (found.length !== 1) failures.push(`${found.length} hreflang ${lang} (se esperaba 1)`)
    else if (found[0].href !== href) failures.push(`hreflang ${lang} ${found[0].href} (se esperaba ${href})`)
  }

  if (expectPreview && !/noindex/i.test(xRobotsTag ?? '')) {
    failures.push(`x-robots-tag sin noindex (${xRobotsTag ?? 'ausente'})`)
  }
  return failures
}

// ---------------------------------------------------------------------- selftest

function fixture(kase, overrides = {}) {
  const base = overrides.siteBase ?? SITE_BASE
  const canonical = overrides.canonical ?? `${base}${kase.locale === 'es' ? kase.esPath : kase.enPath}`
  const alternates =
    overrides.alternates ??
    `<link rel="alternate" hreflang="es" href="${base}${kase.esPath}"/>` +
      `<link rel="alternate" hreflang="en" href="${base}${kase.enPath}"/>` +
      `<link rel="alternate" hreflang="x-default" href="${base}${kase.esPath}"/>`
  const h1 = overrides.h1 ?? '<h1 id="page-title">Titulo</h1>'
  return `<!DOCTYPE html><html lang="${kase.locale}"><head><link rel="canonical" href="${canonical}"/>${alternates}</head><body><div><h2>x</h2>${h1}</div></body></html>`
}

function selftest() {
  let bad = 0
  const cases = buildCases()

  // Tabla de casos
  const expectedCount = 4 + SERVICE_SLUGS.length * 4 + LOCAL_SLUGS.length * 2
  if (cases.length === expectedCount) console.log(`PASS selftest buildCases: ${expectedCount} casos`)
  else {
    bad += 1
    console.log(`FAIL selftest buildCases: ${cases.length} casos (se esperaban ${expectedCount})`)
  }
  const crossed = cases.filter((c) => c.route === '/services' || c.route === '/en/servicios')
  if (crossed.length === 2 && crossed.every((c) => c.route !== (c.locale === 'es' ? c.esPath : c.enPath))) {
    console.log('PASS selftest buildCases: las variantes cruzadas esperan el canonical del idioma, no el de su carpeta')
  } else {
    bad += 1
    console.log('FAIL selftest buildCases: las variantes cruzadas no esperan el canonical del idioma')
  }
  const local = cases.filter((c) => c.route.includes('seo-tecnico'))
  if (local.length === 4 && local.every((c) => c.route === (c.locale === 'es' ? c.esPath : c.enPath))) {
    console.log('PASS selftest buildCases: las landings esperan su propia URL en los dos idiomas')
  } else {
    bad += 1
    console.log('FAIL selftest buildCases: las landings no esperan su propia URL')
  }

  const expectOk = (name, res, kase, opts) => {
    const f = checkPage(res, kase, opts)
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const expectBad = (name, res, kase, opts) => {
    const f = checkPage(res, kase, opts)
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }

  const esIndex = cases.find((c) => c.route === '/servicios')
  const enIndex = cases.find((c) => c.route === '/en/services')
  const cross = cases.find((c) => c.route === '/en/servicios/seo-consulting')
  const lima = cases.find((c) => c.route === '/en/seo-tecnico-lima')

  for (const k of [esIndex, enIndex, cross, lima]) {
    expectOk(`valido ${k.route}`, { status: 200, html: fixture(k), xRobotsTag: 'noindex, nofollow' }, k, { expectPreview: true })
  }
  expectOk('valido sin preview', { status: 200, html: fixture(esIndex) }, esIndex)

  expectBad(
    'canonical con el segmento de la carpeta, no del idioma',
    { status: 200, html: fixture(cross, { canonical: `${SITE_BASE}/en/servicios/seo-consulting` }) },
    cross,
  )
  expectBad(
    'canonical al otro idioma',
    { status: 200, html: fixture(enIndex, { canonical: `${SITE_BASE}/servicios` }) },
    enIndex,
  )
  expectBad('sin hreflang', { status: 200, html: fixture(esIndex, { alternates: '' }) }, esIndex)
  expectBad(
    'sin x-default',
    {
      status: 200,
      html: fixture(esIndex, {
        alternates: `<link rel="alternate" hreflang="es" href="${SITE_BASE}/servicios"/><link rel="alternate" hreflang="en" href="${SITE_BASE}/en/services"/>`,
      }),
    },
    esIndex,
  )
  expectBad(
    'hreflang en con el segmento equivocado',
    {
      status: 200,
      html: fixture(esIndex, {
        alternates: `<link rel="alternate" hreflang="es" href="${SITE_BASE}/servicios"/><link rel="alternate" hreflang="en" href="${SITE_BASE}/en/servicios"/><link rel="alternate" hreflang="x-default" href="${SITE_BASE}/servicios"/>`,
      }),
    },
    esIndex,
  )
  expectBad('dos h1', { status: 200, html: fixture(esIndex, { h1: '<h1>a</h1><h1>b</h1>' }) }, esIndex)
  expectBad('sin h1', { status: 200, html: fixture(esIndex, { h1: '' }) }, esIndex)
  expectBad('estado 404', { status: 404, html: fixture(esIndex) }, esIndex)
  expectBad('sin noindex con EXPECT_PREVIEW', { status: 200, html: fixture(esIndex), xRobotsTag: null }, esIndex, { expectPreview: true })
  expectBad(
    'landing con canonical al otro idioma',
    { status: 200, html: fixture(lima, { canonical: `${SITE_BASE}/seo-tecnico-lima` }) },
    lima,
  )
  expectBad(
    'base canonica distinta de SITE_BASE',
    { status: 200, html: fixture(esIndex, { siteBase: 'https://otro.example' }) },
    esIndex,
  )

  if (bad === 0) console.log('PASS selftest 54-dual-urls: fixture valido sin fallos y defectuosos detectados')
  return bad === 0 ? 0 : 1
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
  for (const kase of buildCases()) {
    try {
      const res = await fetchFinal(base, kase.route)
      report(kase.route, checkPage(res, kase, { expectPreview }))
    } catch (error) {
      report(kase.route, [`error de red: ${error instanceof Error ? error.message : String(error)}`])
    }
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
