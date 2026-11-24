// Verificador del HTML servido de las cuatro rutas legales (fase 56, plan 56-05, CONT-03).
//
// Descarga /privacy, /terms, /en/privacy y /en/terms de BASE_URL (solo GET) y comprueba,
// sobre el texto visible (sin script ni style):
//   - respuesta 200;
//   - cero apariciones del hosting anterior, de la analitica anterior y de Cloudflare
//     Insights (T-56-15: el texto no puede declarar un tratamiento que no ocurre);
//   - privacy (es y en) nombra Resend, Cloudinary, Hetzner, Cloudflare, NEXT_LOCALE y
//     hello@juan-tech.com;
//   - cero marcadores de ranura;
//   - los h2 del contenido (dentro de main) sin punto, coma ni numero inicial (D-04);
//   - un solo h1.
// Con --expect-date exige ademas la linea de fecha efectiva con un elemento time cuyo
// datetime sea una fecha (lo usa el corte, D-09: la fecha se fija el dia del corte).
//
// Modos:
//   --selftest      Prueba el verificador con HTML sintetico bueno y malo; no usa la red.
//   --expect-date   Exige el elemento time con la fecha efectiva.
//   (sin modo)      Contra BASE_URL (obligatoria).
//
// Variables: BASE_URL (obligatoria fuera de --selftest). PROD_BASE se ignora aqui.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL. Los
// conteos usan expresiones globales sobre el HTML (llega en una sola linea). Nunca
// escribe en ninguna base ni envia correos: solo GET. Sin dependencias nuevas.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con NODE_OPTIONS="--require <scratchpad de la sesion>/dnsfix.cjs".

import { pathToFileURL } from 'node:url'

export const ROUTES = [
  { path: '/privacy', kind: 'privacy', locale: 'es' },
  { path: '/terms', kind: 'terms', locale: 'es' },
  { path: '/en/privacy', kind: 'privacy', locale: 'en' },
  { path: '/en/terms', kind: 'terms', locale: 'en' },
]

// Las cadenas prohibidas y el marcador se arman por codigo: este archivo no las escribe enteras.
const OLD_HOST = ['Host', 'inger'].join('')
const OLD_ANALYTICS = ['Google', ' ', 'Analytics'].join('')
const OLD_INSIGHTS = ['Cloudflare', ' ', 'Insights'].join('')
const SLOT = String.fromCharCode(123, 123)

export const FORBIDDEN = [
  { label: 'el hosting anterior', needle: OLD_HOST },
  { label: 'la analitica anterior', needle: OLD_ANALYTICS },
  { label: 'Cloudflare Insights', needle: OLD_INSIGHTS },
  { label: 'un marcador de ranura', needle: SLOT },
]

export const PRIVACY_REQUIRED = ['Resend', 'Cloudinary', 'Hetzner', 'Cloudflare', 'NEXT_LOCALE', 'hello@juan-tech.com']

// ----------------------------------------------------------------- utilidades HTML

export function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/** Texto visible: sin script, style ni noscript, sin etiquetas y con espacios colapsados. */
export function visibleText(html) {
  const noCode = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  return decodeEntities(noCode.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** Contenido de la primera etiqueta main, o la pagina entera si no hay. */
export function mainHtml(html) {
  const m = html.match(/<main(?=[\s>])[\s\S]*?<\/main>/i)
  return m ? m[0] : html
}

export function h1Count(html) {
  return (html.match(/<h1(?=[\s>/])/gi) ?? []).length
}

/** Textos de los h2 de un fragmento de HTML. */
export function h2Texts(html) {
  return [...html.matchAll(/<h2(?=[\s>/])[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) =>
    decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(),
  )
}

/** Valores del atributo datetime de los elementos time de un fragmento. */
export function timeDatetimes(html) {
  return [...html.matchAll(/<time(?=[\s>/])([^>]*)>/gi)]
    .map((m) => (m[1].match(/\sdatetime\s*=\s*(?:"([^"]*)"|'([^']*)')/i) ?? [])[1] ?? '')
    .filter(Boolean)
}

// ----------------------------------------------------------------- comprobacion

/**
 * Problemas de una pagina legal. `route` trae kind (privacy o terms) y locale.
 * Devuelve una lista de cadenas; vacia significa que la pagina cumple.
 */
export function checkLegalPage(route, { status, html }, { expectDate = false } = {}) {
  const problems = []
  if (status !== 200) {
    problems.push(`estado ${status}, se esperaba 200`)
    return problems
  }
  const text = visibleText(html)
  for (const f of FORBIDDEN) {
    if (text.toLowerCase().includes(f.needle.toLowerCase())) problems.push(`aparece ${f.label}`)
  }
  if (route.kind === 'privacy') {
    for (const r of PRIVACY_REQUIRED) if (!text.includes(r)) problems.push(`falta "${r}"`)
  }
  const h1s = h1Count(html)
  if (h1s !== 1) problems.push(`hay ${h1s} h1, se esperaba 1`)
  const heads = h2Texts(mainHtml(html))
  if (heads.length === 0) problems.push('no hay h2 en el contenido')
  for (const h of heads) {
    if (/[.,]/.test(h)) problems.push(`h2 con punto o coma: "${h}"`)
    if (/^\s*\d/.test(h)) problems.push(`h2 con numero inicial: "${h}"`)
  }
  if (expectDate) {
    const dates = timeDatetimes(html).filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d))
    if (dates.length === 0) problems.push('falta la linea de fecha efectiva con un elemento time y datetime')
  }
  return problems
}

// ----------------------------------------------------------------- red

async function getPage(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return { status: res.status, html: await res.text() }
  } catch (err) {
    if (retry) return getPage(url, false)
    return { status: 0, html: '', error: err.message }
  }
}

async function live(args) {
  const base = (process.env.BASE_URL ?? '').replace(/\/$/, '')
  if (!base) {
    console.log('FAIL BASE_URL es obligatoria (por ejemplo https://dev.juan-tech.com)')
    return 1
  }
  const expectDate = args.includes('--expect-date')
  let failed = 0
  for (const route of ROUTES) {
    const page = await getPage(`${base}${route.path}`)
    const problems = checkLegalPage(route, page, { expectDate })
    if (problems.length === 0) {
      console.log(`PASS ${route.path} (${route.kind}, ${route.locale})${expectDate ? ' con fecha efectiva' : ''}`)
    } else {
      failed += 1
      console.log(`FAIL ${route.path}: ${problems.join(' | ')}`)
    }
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 56-legal-live: ${ROUTES.length - failed} PASS, ${failed} FAIL en ${ROUTES.length} ruta(s)`)
  return failed === 0 ? 0 : 1
}

// ----------------------------------------------------------------- autoprueba

function page({ h1 = 1, heads = ['Quién soy', 'Qué datos recojo'], body = PRIVACY_REQUIRED.join(' '), time = '', extra = '' } = {}) {
  const h1s = Array.from({ length: h1 }, () => '<h1>Política de privacidad</h1>').join('')
  const h2s = heads.map((h) => `<h2 id="x">${h}</h2>`).join('')
  const t = time ? `<time datetime="${time}">fecha</time>` : ''
  return `<html><body><header><h2>Servicios.</h2></header><main>${h1s}${t}${h2s}<p>${body}</p>${extra}</main><script>var a="${OLD_HOST} ${OLD_ANALYTICS}"</script><style>.a{}</style></body></html>`
}

function selftest() {
  let failures = 0
  const priv = { path: '/privacy', kind: 'privacy', locale: 'es' }
  const terms = { path: '/terms', kind: 'terms', locale: 'es' }
  const ok = (html, route = priv, opts) => checkLegalPage(route, { status: 200, html }, opts)
  function expectGood(name, problems) {
    if (problems.length === 0) console.log(`PASS bueno: ${name}`)
    else {
      failures += 1
      console.log(`FAIL bueno: ${name}: ${problems.join(' | ')}`)
    }
  }
  function expectBad(name, problems, re) {
    if (problems.some((p) => re.test(p))) console.log(`PASS malo: ${name}`)
    else {
      failures += 1
      console.log(`FAIL malo: ${name}: ${problems.join(' | ') || 'no detecto nada'}`)
    }
  }

  expectGood('privacy completa (el script y el style con nombres viejos no cuentan, el h2 del encabezado fuera de main tampoco)', ok(page()))
  expectGood('terms sin proveedores', ok(page({ body: 'texto' }), terms))
  expectGood('privacy con fecha efectiva', ok(page({ time: '2026-11-20' }), priv, { expectDate: true }))

  expectBad('estado 404', checkLegalPage(priv, { status: 404, html: '' }), /estado 404/)
  expectBad('hosting anterior', ok(page({ extra: `<p>corre en ${OLD_HOST}</p>` })), /hosting anterior/)
  expectBad('analitica anterior', ok(page({ extra: `<p>uso ${OLD_ANALYTICS}</p>` })), /analitica anterior/)
  expectBad('Cloudflare Insights', ok(page({ extra: `<p>con ${OLD_INSIGHTS}</p>` })), /Cloudflare Insights/)
  expectBad('marcador de ranura', ok(page({ extra: `<p>${SLOT}pendiente}}</p>` })), /marcador/)
  expectBad('falta Hetzner en privacy', ok(page({ body: PRIVACY_REQUIRED.filter((r) => r !== 'Hetzner').join(' ') })), /falta "Hetzner"/)
  expectBad('falta NEXT_LOCALE en privacy', ok(page({ body: PRIVACY_REQUIRED.filter((r) => r !== 'NEXT_LOCALE').join(' ') })), /falta "NEXT_LOCALE"/)
  expectBad('h2 con numero', ok(page({ heads: ['1 Quién soy'] })), /numero inicial/)
  expectBad('h2 con punto', ok(page({ heads: ['Quién soy.'] })), /punto o coma/)
  expectBad('h2 con coma', ok(page({ heads: ['Datos, cookies'] })), /punto o coma/)
  expectBad('dos h1', ok(page({ h1: 2 })), /2 h1/)
  expectBad('sin h1', ok(page({ h1: 0 })), /0 h1/)
  expectBad('sin h2 en el contenido', ok(page({ heads: [] })), /no hay h2/)
  expectBad('sin fecha con --expect-date', ok(page(), priv, { expectDate: true }), /fecha efectiva/)
  expectBad('time sin fecha valida con --expect-date', ok(page({ time: 'hoy' }), priv, { expectDate: true }), /fecha efectiva/)

  console.log(`${failures === 0 ? 'PASS' : 'FAIL'} 56-legal-live --selftest`)
  return failures === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  process.exit(args.includes('--selftest') ? selftest() : await live(args))
}
