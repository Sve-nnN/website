// Prueba en navegador de la busqueda del indice del blog (fase 55, plan 55-10, D-17).
//
// Con Playwright contra BASE_URL, en ES y EN:
//   1. Con JavaScript: escribe una consulta SOLO con teclado; la region
//      role="status" (aria-live polite) anuncia un numero N y la lista de
//      resultados trae exactamente N tarjetas; las secciones del servidor se
//      ocultan; Enter no navega.
//   2. Escape (o vaciar el campo) restaura las secciones y deja el anuncio vacio.
//   3. Una consulta sin coincidencias anuncia cero, no pinta lista y ofrece el
//      enlace a /search?q=<consulta>.
//   4. Sin JavaScript (contexto aparte): escribir y pulsar Enter navega a
//      /search?q=<consulta> (/en/search?q= en ingles): el control nunca queda muerto.
//
// Modos:
//   --selftest  Evalua readAnnouncedCount sobre fixtures validos y defectuosos. No usa red
//               ni navegador. Sale 0 solo si se comporta como se espera.
//   (sin modo)  Corre contra BASE_URL (obligatoria).
//
// Variables: BASE_URL, QUERY (por defecto "seo"), HEADLESS=0 para ver el navegador.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

const STATUS = 'form[role="search"] + [role="status"]'

/**
 * Numero que anuncia la region de estado: "3 resultados" y "3 results" dan 3,
 * "Sin resultados" y "No results" dan 0. Vacio o texto desconocido dan null.
 * @param {string | null | undefined} text
 * @returns {number | null}
 */
export function readAnnouncedCount(text) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (value === '') return null
  if (/^(sin resultados|no results)$/i.test(value)) return 0
  const m = /^(\d+) (?:resultados?|results?)$/i.exec(value)
  return m ? Number(m[1]) : null
}

// ---------------------------------------------------------------------- selftest

function selftest() {
  let bad = 0
  const cases = [
    ['3 resultados', 3],
    ['1 resultado', 1],
    ['Sin resultados', 0],
    ['12 results', 12],
    ['1 result', 1],
    ['No results', 0],
    ['  5   resultados  ', 5],
    ['', null],
    [null, null],
    ['abc', null],
    ['3 articulos', null],
    ['resultados 3', null],
  ]
  for (const [input, want] of cases) {
    const got = readAnnouncedCount(input)
    if (got === want) console.log(`PASS selftest readAnnouncedCount(${JSON.stringify(input)}) = ${want}`)
    else {
      bad += 1
      console.log(`FAIL selftest readAnnouncedCount(${JSON.stringify(input)}): se esperaba ${want} y dio ${got}`)
    }
  }
  // Defectuoso: una lectura que ignora el cero debe distinguirse del conteo real.
  const naive = (t) => Number((/\d+/.exec(String(t)) ?? [NaN])[0])
  if (Number.isNaN(naive('Sin resultados')) && readAnnouncedCount('Sin resultados') === 0) {
    console.log('PASS selftest una lectura ingenua que solo busca digitos pierde el cero y la funcion no')
  } else {
    bad += 1
    console.log('FAIL selftest la lectura ingenua deberia perder el cero')
  }
  if (bad > 0) {
    console.log(`FAIL selftest 55-blog-search: ${bad} caso(s) no se comportaron como se esperaba`)
    return 1
  }
  console.log('PASS selftest 55-blog-search: readAnnouncedCount lee el anuncio y distingue el cero')
  return 0
}

// ------------------------------------------------------------------------ main

let failures = 0
function check(ok, name, reason) {
  if (ok) console.log(`PASS ${name}`)
  else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

async function runLocale(browser, base, locale, query) {
  const prefix = locale === 'en' ? '/en' : ''
  const url = `${base}${prefix}/blog`
  const tag = `blog ${locale}`

  // 1 y 2 y 3: con JavaScript.
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })

  const input = page.locator('form[role="search"] input[name="q"]')
  check((await input.count()) === 1, `${tag}: hay un campo de busqueda`, `hay ${await input.count()}`)
  const sections = page.locator('[data-blog-sections]')
  check((await sections.count()) === 1, `${tag}: sin consulta las secciones del servidor estan visibles`, `hay ${await sections.count()}`)
  const status = page.locator(STATUS)
  check((await status.count()) === 1, `${tag}: hay una region de estado junto al campo`, `hay ${await status.count()}`)
  check(readAnnouncedCount(await status.textContent()) === null, `${tag}: sin consulta el anuncio esta vacio`, JSON.stringify(await status.textContent()))
  check((await status.getAttribute('aria-live')) === 'polite', `${tag}: la region de estado es aria-live polite`, String(await status.getAttribute('aria-live')))

  // Solo teclado: foco al campo y escritura con el teclado.
  await input.focus()
  await page.keyboard.type(query)
  try {
    await page.waitForFunction(
      (sel) => (document.querySelector(sel)?.textContent ?? '').trim() !== '',
      STATUS,
      { timeout: 5000 },
    )
  } catch {
    check(false, `${tag}: la consulta cambia el anuncio`, 'el anuncio sigue vacio (la pagina no hidrato o el filtro no corre)')
    await context.close()
    return
  }
  const announced = readAnnouncedCount(await status.textContent())
  const cards = await page.locator('[data-search-results] > li').count()
  check(announced !== null && announced > 0, `${tag}: la consulta "${query}" anuncia un numero positivo`, JSON.stringify(await status.textContent()))
  check(announced === cards, `${tag}: el anuncio (${announced}) coincide con las tarjetas visibles (${cards})`, `anuncio ${announced}, tarjetas ${cards}`)
  check((await sections.count()) === 0, `${tag}: con consulta las secciones del servidor se ocultan`, `hay ${await sections.count()}`)

  // Enter con JavaScript no navega.
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  check(new URL(page.url()).pathname === `${prefix}/blog`, `${tag}: Enter con JavaScript no navega`, page.url())

  // Escape restaura.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  check((await input.inputValue()) === '', `${tag}: Escape vacia el campo`, JSON.stringify(await input.inputValue()))
  check((await sections.count()) === 1, `${tag}: Escape restaura las secciones`, `hay ${await sections.count()}`)
  check(readAnnouncedCount(await status.textContent()) === null, `${tag}: tras Escape el anuncio vuelve a quedar vacio`, JSON.stringify(await status.textContent()))

  // Vaciar el campo con teclado tambien restaura.
  await page.keyboard.type(query)
  await page.waitForTimeout(150)
  for (let i = 0; i < query.length; i += 1) await page.keyboard.press('Backspace')
  await page.waitForTimeout(150)
  check((await sections.count()) === 1, `${tag}: vaciar el campo con Backspace restaura las secciones`, `hay ${await sections.count()}`)

  // Sin coincidencias.
  const nonsense = 'zzzzqxwv'
  await page.keyboard.type(nonsense)
  await page.waitForTimeout(200)
  check(readAnnouncedCount(await status.textContent()) === 0, `${tag}: una consulta sin coincidencias anuncia cero`, JSON.stringify(await status.textContent()))
  check((await page.locator('[data-search-results]').count()) === 0, `${tag}: sin coincidencias no hay lista de resultados`, 'hay lista')
  const outlet = page.locator(`a[href$="/search?q=${nonsense}"]`)
  check((await outlet.count()) === 1, `${tag}: sin coincidencias se ofrece /search?q=${nonsense}`, `hay ${await outlet.count()}`)
  await context.close()

  // 4: sin JavaScript.
  const bare = await browser.newContext({ javaScriptEnabled: false })
  const barePage = await bare.newPage()
  await barePage.goto(url, { waitUntil: 'load' })
  const bareInput = barePage.locator('form[role="search"] input[name="q"]')
  await bareInput.fill(query)
  await Promise.all([barePage.waitForURL(/\/search\?/, { timeout: 15000 }), bareInput.press('Enter')])
  const landed = new URL(barePage.url())
  check(landed.pathname === `${prefix}/search` && landed.searchParams.get('q') === query, `${tag}: sin JavaScript Enter llega a ${prefix}/search?q=${query}`, barePage.url())
  await bare.close()
}

async function main() {
  const base = (process.env.BASE_URL ?? '').replace(/\/$/, '')
  if (!base) {
    console.log('FAIL BASE_URL es obligatoria')
    return 1
  }
  const query = process.env.QUERY ?? 'seo'
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== '0' })
  try {
    for (const locale of ['es', 'en']) await runLocale(browser, base, locale, query)
  } finally {
    await browser.close()
  }
  if (failures > 0) {
    console.log(`FAIL 55-blog-search: ${failures} comprobacion(es) fallaron`)
    return 1
  }
  console.log('PASS 55-blog-search')
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const code = process.argv.includes('--selftest') ? selftest() : await main()
  process.exit(code)
}
