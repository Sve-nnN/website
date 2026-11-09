// Contrato HTTP y de navegador de Sobre mi (fase 54, plan 54-13, PAG-06).
//
// Valida sobre el HTML servido (no sobre el codigo fuente):
//   - /sobre-mi y /en/sobre-mi: 200, un h1, un main, una foto (img con alt no
//     vacio), el timeline como lista (ul MuiTimeline-root con al menos un li).
//   - Con EXPECT_PREVIEW=1: cabecera x-robots-tag con noindex y el header trae el
//     enlace Sobre mi (/sobre-mi en espanol, /en/sobre-mi en ingles). El enlace se
//     inyecta solo con isPreviewReadonly(): en produccion no debe estar.
//   - A 320px de ancho no hay desborde horizontal (scrollWidth <= innerWidth), en
//     es y en (Playwright; --no-browser lo omite).
//   - El sitemap de produccion (PROD_BASE, por defecto https://juan-tech.com) no
//     contiene sobre-mi: la pagina vive en un global y no en pages, asi que no
//     puede entrar al sitemap antes del corte (T-54-52).
//
// Modos:
//   --selftest    Evalua los chequeos sobre fixtures validos (cero fallos) y
//                 defectuosos (sin img con alt, sin lista del timeline, con
//                 sobre-mi en un sitemap de prueba, sin enlace en el header del
//                 preview, doble h1, estado 500, desborde...; cada defectuoso debe
//                 dar al menos un fallo). Sale 0 solo si se comporta como se espera.
//   --no-browser  En modo vivo, omite el chequeo de desborde con Playwright.
//   (sin modo)    Corre contra BASE_URL (obligatoria).
//
// Variables: BASE_URL, EXPECT_PREVIEW=1, PROD_BASE (sitemap de produccion).
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL.
// Cuenta con expresiones globales sobre el HTML (llega en una sola linea, `grep -c`
// daria siempre 1; el conteo del sitemap equivale a `grep -o sobre-mi | wc -l`).
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

const ROUTES = [
  { path: '/sobre-mi', locale: 'es' },
  { path: '/en/sobre-mi', locale: 'en' },
]

/** Etiquetas de apertura de un elemento (sin cuerpo ni cierre). */
function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

/** Atributos de una etiqueta de apertura como mapa nombre -> valor. */
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

/** HTML sin las etiquetas style y script (el CSS de Emotion no cuenta como marcado). */
function stripStyles(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')
}

/**
 * Chequeos de una pagina de Sobre mi. `res` es { status, html, xRobotsTag }.
 * Devuelve la lista de fallos (vacia si todo cumple).
 */
export function checkAboutPage(res, { locale, expectPreview = false } = {}) {
  const failures = []
  if (res.status !== 200) {
    failures.push(`responde ${res.status} (se esperaba 200)`)
    return failures
  }
  const html = stripStyles(res.html)

  const h1 = openTags(html, 'h1').length
  if (h1 !== 1) failures.push(`hay ${h1} <h1> (se esperaba 1)`)
  const mains = openTags(html, 'main').length
  if (mains !== 1) failures.push(`hay ${mains} <main (se esperaba exactamente 1, el del layout)`)

  const photo = openTags(html, 'img').map(parseAttrs).filter((a) => (a.alt ?? '').trim() !== '')
  if (photo.length === 0) failures.push('no hay ninguna img con alt no vacio (la foto de Sobre mi)')

  const timeline = /<ul[^>]*MuiTimeline-root[^>]*>([\s\S]*?)<\/ul>/i.exec(html)
  if (!timeline) failures.push('el timeline no es una lista (no hay ul MuiTimeline-root)')
  else if (!/<li[\s>]/i.test(timeline[1])) failures.push('el timeline no tiene ningun li')

  if (expectPreview) {
    if (!/noindex/i.test(res.xRobotsTag ?? '')) failures.push(`falta x-robots-tag con noindex (cabecera: ${res.xRobotsTag})`)
    const header = /<header[\s\S]*?<\/header>/i.exec(html)
    const want = locale === 'en' ? '/en/sobre-mi' : '/sobre-mi'
    const links = header ? openTags(header[0], 'a').map(parseAttrs) : []
    if (!links.some((a) => a.href === want)) failures.push(`el header del preview no trae el enlace a ${want}`)
  }
  return failures
}

/** Cuantas veces aparece sobre-mi en el XML del sitemap (equivale a grep -o | wc -l). */
export function countAboutInSitemap(xml) {
  return (xml.match(/sobre-mi/g) ?? []).length
}

export function checkSitemap(res) {
  if (res.status !== 200) return [`el sitemap responde ${res.status} (se esperaba 200)`]
  const n = countAboutInSitemap(res.html)
  return n === 0 ? [] : [`el sitemap de produccion contiene sobre-mi ${n} vez/veces (debe ser 0)`]
}

/** Desborde horizontal medido en el navegador a 320px. */
export function checkOverflow(metrics) {
  return metrics.scrollWidth <= metrics.innerWidth
    ? []
    : [`desborde horizontal a 320px: scrollWidth ${metrics.scrollWidth} > innerWidth ${metrics.innerWidth}`]
}

// ---------------------------------------------------------------------- selftest

const LI = (n) => Array.from({ length: n }, (_, i) => `<li class="MuiTimelineItem-root">Etapa ${i + 1}</li>`).join('')

const page = ({
  h1 = '<h1>Juan Carlos Angulo</h1>',
  img = '<img src="/foto.jpg" alt="Retrato de la persona" width="1122" height="1402">',
  timeline = `<ul class="MuiTimeline-root css-x" aria-label="Recorrido profesional">${LI(5)}</ul>`,
  nav = '<a href="/sobre-mi">Sobre mí</a>',
  mains = 1,
} = {}) =>
  `<html lang="es"><head><style>.x{content:"<img alt=''> sobre-mi"}</style></head><body>` +
  `<header><nav><a href="/">Inicio</a>${nav}</nav></header>` +
  `${'<main id="main-content">'.repeat(mains)}<section>${h1}<figure>${img}</figure></section>${timeline}${'</main>'.repeat(mains)}` +
  `<footer></footer></body></html>`

function selftest() {
  let bad = 0
  const ok = (html, extra = {}) => ({ status: 200, html, ...extra })
  const clean = (name, list) => {
    if (list.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(list)}`)
    }
  }
  const broken = (name, list) => {
    if (list.length > 0) console.log(`PASS selftest ${name}: detecta ${list.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }
  const preview = { expectPreview: true }
  const noindex = { xRobotsTag: 'noindex, nofollow' }

  clean('valido es', checkAboutPage(ok(page()), { locale: 'es' }))
  clean('valido en preview es', checkAboutPage(ok(page(), noindex), { locale: 'es', ...preview }))
  clean(
    'valido en preview en',
    checkAboutPage(ok(page({ nav: '<a href="/en/sobre-mi">About me</a>' }), noindex), { locale: 'en', ...preview }),
  )
  clean('sitemap sin sobre-mi', checkSitemap(ok('<urlset><url><loc>https://juan-tech.com/stack</loc></url></urlset>')))
  clean('sin desborde', checkOverflow({ scrollWidth: 320, innerWidth: 320 }))

  broken('estado 500', checkAboutPage({ status: 500, html: page() }, { locale: 'es' }))
  broken('sin img con alt', checkAboutPage(ok(page({ img: '<img src="/foto.jpg" width="1" height="1">' })), { locale: 'es' }))
  broken('img con alt vacio', checkAboutPage(ok(page({ img: '<img src="/foto.jpg" alt="  ">' })), { locale: 'es' }))
  broken('sin lista del timeline', checkAboutPage(ok(page({ timeline: '<div class="MuiTimeline-root"><div>Etapa</div></div>' })), { locale: 'es' }))
  broken('timeline sin items', checkAboutPage(ok(page({ timeline: '<ul class="MuiTimeline-root"></ul>' })), { locale: 'es' }))
  broken('dos h1', checkAboutPage(ok(page({ h1: '<h1>Uno</h1><h1>Dos</h1>' })), { locale: 'es' }))
  broken('sin h1', checkAboutPage(ok(page({ h1: '' })), { locale: 'es' }))
  broken('dos main', checkAboutPage(ok(page({ mains: 2 })), { locale: 'es' }))
  broken('preview sin x-robots-tag', checkAboutPage(ok(page()), { locale: 'es', ...preview }))
  broken('preview sin enlace en el header', checkAboutPage(ok(page({ nav: '' }), noindex), { locale: 'es', ...preview }))
  broken('preview en con enlace sin prefijo', checkAboutPage(ok(page({ nav: '<a href="/sobre-mi">About me</a>' }), noindex), { locale: 'en', ...preview }))
  broken('sitemap con sobre-mi', checkSitemap(ok('<urlset><url><loc>https://juan-tech.com/sobre-mi</loc></url></urlset>')))
  broken('sitemap con 500', checkSitemap({ status: 500, html: '' }))
  broken('desborde a 320px', checkOverflow({ scrollWidth: 412, innerWidth: 320 }))

  if (countAboutInSitemap('sobre-mi sobre-mi') !== 2) {
    bad += 1
    console.log('FAIL selftest conteo: countAboutInSitemap no cuenta dos apariciones')
  }

  if (bad === 0) console.log('PASS selftest 54-about: fixtures validos sin fallos y defectuosos detectados')
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

const message = (error) => (error instanceof Error ? error.message.split('\n')[0] : String(error))

async function launch(chromium) {
  try {
    return await chromium.launch()
  } catch (err) {
    console.log(`chromium de Playwright no disponible (${message(err)}); pruebo Chrome del sistema`)
    return chromium.launch({ channel: 'chrome' })
  }
}

async function overflowMode(base) {
  const { chromium } = await import('playwright')
  const browser = await launch(chromium)
  try {
    for (const { path } of ROUTES) {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } })
      const page = await context.newPage()
      try {
        const response = await page.goto(new URL(path, base).href, { waitUntil: 'load' })
        if (!response || !response.ok()) throw new Error(`respondio ${response ? response.status() : 'sin respuesta'}`)
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }))
        report(`${path}: sin desborde horizontal a 320px`, checkOverflow(metrics))
      } catch (error) {
        report(`${path}: desborde a 320px`, [`error de navegador: ${message(error)}`])
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}

async function liveMode(base, { expectPreview, browser }) {
  for (const { path, locale } of ROUTES) {
    try {
      report(path, checkAboutPage(await fetchFinal(base, path), { locale, expectPreview }))
    } catch (error) {
      report(path, [`error de red: ${message(error)}`])
    }
  }

  const prod = process.env.PROD_BASE ?? 'https://juan-tech.com'
  try {
    report(`sitemap de ${prod}`, checkSitemap(await fetchFinal(prod, '/sitemap.xml')))
  } catch (error) {
    report(`sitemap de ${prod}`, [`error de red: ${message(error)}`])
  }

  if (browser) await overflowMode(base)
  else console.log('omitido: desborde a 320px (--no-browser)')
}

// -------------------------------------------------------------------------- main

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (args.includes('--selftest')) {
    process.exit(selftest())
  }
  const base = process.env.BASE_URL
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    process.exit(1)
  }
  await liveMode(base, { expectPreview: process.env.EXPECT_PREVIEW === '1', browser: !args.includes('--no-browser') })
  process.exit(failures > 0 ? 1 : 0)
}
