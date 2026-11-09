/**
 * READ-ONLY. Comprobaciones de navegador contra una página servida de verdad.
 * Complementa a 53-layer-check.mjs (forma del CSS compilado) y a
 * 53-shell-contract.mjs (contrato del HTML): este arranca Chromium y prueba el
 * comportamiento real del shell.
 *
 * Secciones (variable CHECKS, lista separada por comas; por defecto todas):
 *   styles    `body` con fondo rgb(24, 24, 24) (#181818, el tema oscuro de MUI
 *             gana al reset de Tailwind porque `tailwind` queda bajo `mui`) y
 *             primer `.MuiButton-contained` con fondo rgb(255, 122, 69)
 *             (#FF7A45). Sin botón: falla solo con REQUIRE_BUTTON=1, si no
 *             imprime `SKIP botón`. (plan 53-01)
 *   motion    El botón "Pausar animaciones" / "Pause animations" fija
 *             data-motion="paused" en html, localStorage['jt-motion']="paused"
 *             y aria-pressed="true"; tras recargar sigue pausado; al pulsarlo
 *             otra vez vuelve a "running" y aria-pressed="false". Limpia
 *             localStorage al terminar. (D-15, D-16, D-17)
 *   skip      Tab deja el foco en el enlace con href="#main-content" y Enter
 *             deja el foco en el elemento con id "main-content". (D-13, SC 2.4.1)
 *   lang      En /servicios abre el selector de idioma, elige English y exige
 *             /en/services; desde ahí elige Español y exige /servicios.
 *   overflow  Para 320, 900, 1024 y 1280 px de ancho, scrollWidth no supera
 *             innerWidth en "/". (SC 1.4.10)
 *   drawer    A 375 px, el botón con aria-controls="menu-movil" abre el Drawer,
 *             Escape lo cierra y el foco vuelve a ese botón. (D-13, SC 2.1.2)
 *   focus     Con Tab recorre hasta 40 paradas de "/" y exige que cada elemento
 *             enfocado quede dentro del viewport y no tapado (elementFromPoint
 *             en su centro devuelve el elemento o un descendiente). (SC 2.4.11)
 *
 * Necesita una página con datos reales, así que no corre en el plan 05: lo
 * ejecuta el plan 06 contra el preview. Cada sección imprime PASS o
 * FAIL motivo; cualquier fallo sale con código 1.
 *
 * Variables de entorno:
 *   BASE_URL        por defecto http://localhost:3000
 *   PATH_TO_CHECK   por defecto /  (solo la sección styles)
 *   ENTRY_PATH      por defecto /  (página de entrada de motion, skip, overflow,
 *                   drawer y focus; sirve para probar con una página que no lea
 *                   la base de datos, p. ej. /en/search)
 *   REQUIRE_BUTTON  1 exige que exista un botón MUI contained (sección styles)
 *   CHECKS          p. ej. CHECKS=motion,skip
 *
 * Run:
 *   BASE_URL=http://localhost:3000 node scripts/verify/53-computed-styles.mjs
 */
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const PATH_TO_CHECK = process.env.PATH_TO_CHECK ?? '/'
const ENTRY_PATH = process.env.ENTRY_PATH ?? '/'
const REQUIRE_BUTTON = process.env.REQUIRE_BUTTON === '1'

const ALL_CHECKS = ['styles', 'motion', 'skip', 'lang', 'overflow', 'drawer', 'focus']
const CHECKS = (process.env.CHECKS ?? ALL_CHECKS.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const EXPECTED_BODY_BG = 'rgb(24, 24, 24)'
const EXPECTED_BUTTON_BG = 'rgb(255, 122, 69)'
const MOTION_KEY = 'jt-motion'
const MOTION_NAME = /^(Pausar animaciones|Pause animations)$/
const MAX_TAB_STOPS = 40

const failures = []
const url = (p) => new URL(p, BASE_URL).href
const pathnameOf = (page) => new URL(page.url()).pathname

async function launch() {
  try {
    return await chromium.launch()
  } catch (err) {
    console.log(`chromium de Playwright no disponible (${err.message.split('\n')[0]}); pruebo Chrome del sistema`)
    return chromium.launch({ channel: 'chrome' })
  }
}

/** Cada sección corre en un contexto limpio (sin localStorage heredado). */
async function inContext(browser, options, fn) {
  const context = await browser.newContext(options)
  try {
    const page = await context.newPage()
    return await fn(page)
  } finally {
    await context.close()
  }
}

/**
 * Espera `load` y luego una ventana corta de red en reposo para la hidratación.
 * Con `networkidle` a secas, los prefetch de enlaces que fallan o tardan
 * (p. ej. sin base de datos) mantienen la red activa y el goto expira.
 */
async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
}

async function open(page, path) {
  const response = await page.goto(url(path), { waitUntil: 'load' })
  if (!response || !response.ok()) {
    throw new Error(`${url(path)} respondió ${response ? response.status() : 'sin respuesta'}`)
  }
  await settle(page)
}

/** Ejecuta una sección; un error lanzado cuenta como FAIL de esa sección. */
async function section(name, fn) {
  const problems = []
  const fail = (why) => problems.push(why)
  try {
    await fn(fail)
  } catch (err) {
    problems.push(err.message.split('\n')[0])
  }
  if (problems.length === 0) console.log(`PASS ${name}`)
  else {
    for (const why of problems) {
      console.log(`FAIL ${name}: ${why}`)
      failures.push(`${name}: ${why}`)
    }
  }
}

const waitMotion = (page, value) =>
  page.waitForFunction(
    (v) => document.documentElement.getAttribute('data-motion') === v,
    value,
    { timeout: 5000 },
  )

const browser = await launch()
try {
  if (CHECKS.includes('styles')) {
    await section('styles', async (fail) => {
      await inContext(browser, {}, async (page) => {
        await open(page, PATH_TO_CHECK)
        const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
        if (bodyBg !== EXPECTED_BODY_BG) fail(`body backgroundColor ${bodyBg} (se esperaba ${EXPECTED_BODY_BG})`)

        const button = page.locator('.MuiButton-contained').first()
        if ((await button.count()) > 0) {
          const buttonBg = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
          if (buttonBg !== EXPECTED_BUTTON_BG) {
            fail(`.MuiButton-contained backgroundColor ${buttonBg} (se esperaba ${EXPECTED_BUTTON_BG})`)
          }
        } else if (REQUIRE_BUTTON) {
          fail('no existe ningún .MuiButton-contained y REQUIRE_BUTTON=1')
        } else {
          console.log('SKIP botón (no hay .MuiButton-contained en esta página)')
        }
      })
    })
  }

  if (CHECKS.includes('motion')) {
    await section('motion', async (fail) => {
      // reducedMotion "no-preference" garantiza que el valor inicial sea running.
      await inContext(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } }, async (page) => {
        await open(page, ENTRY_PATH)
        const toggle = () => page.getByRole('button', { name: MOTION_NAME })
        const state = () =>
          page.evaluate((key) => ({
            motion: document.documentElement.getAttribute('data-motion'),
            stored: window.localStorage.getItem(key),
          }), MOTION_KEY)

        try {
          await waitMotion(page, 'running')
          await toggle().click()
          await waitMotion(page, 'paused')
          const paused = await state()
          if (paused.stored !== 'paused') fail(`localStorage['${MOTION_KEY}'] es ${paused.stored} tras pausar (se esperaba paused)`)
          if ((await toggle().getAttribute('aria-pressed')) !== 'true') fail('aria-pressed no es "true" tras pausar')

          await page.reload({ waitUntil: 'load' })
          await settle(page)
          const reloaded = await state()
          if (reloaded.motion !== 'paused') fail(`tras recargar data-motion es ${reloaded.motion} (se esperaba paused)`)
          if ((await toggle().getAttribute('aria-pressed')) !== 'true') fail('aria-pressed no es "true" tras recargar')

          await toggle().click()
          await waitMotion(page, 'running')
          const resumed = await state()
          if (resumed.stored !== 'running') fail(`localStorage['${MOTION_KEY}'] es ${resumed.stored} tras reanudar (se esperaba running)`)
          if ((await toggle().getAttribute('aria-pressed')) !== 'false') fail('aria-pressed no es "false" tras reanudar')
        } finally {
          await page.evaluate(() => window.localStorage.clear())
        }
      })
    })
  }

  if (CHECKS.includes('skip')) {
    await section('skip', async (fail) => {
      await inContext(browser, { viewport: { width: 1280, height: 800 } }, async (page) => {
        await open(page, ENTRY_PATH)
        await page.keyboard.press('Tab')
        const first = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? null)
        if (first !== '#main-content') fail(`el primer Tab enfoca href=${first} y no #main-content`)
        await page.keyboard.press('Enter')
        const landed = await page.evaluate(() => document.activeElement?.id ?? null)
        if (landed !== 'main-content') fail(`Enter deja el foco en id=${landed} y no en main-content`)
      })
    })
  }

  if (CHECKS.includes('lang')) {
    await section('lang', async (fail) => {
      await inContext(browser, { viewport: { width: 1280, height: 800 } }, async (page) => {
        await open(page, '/servicios')
        const openMenu = async () => {
          await page.locator('button[aria-controls="menu-idioma"]').click()
          await page.locator('#menu-idioma').waitFor({ state: 'visible', timeout: 5000 })
        }

        await openMenu()
        await page.getByRole('menuitem', { name: 'English' }).click()
        await page.waitForURL((u) => u.pathname === '/en/services', { timeout: 10000 }).catch(() => {})
        if (pathnameOf(page) !== '/en/services') fail(`al elegir English la ruta es ${pathnameOf(page)} (se esperaba /en/services)`)

        await page.waitForLoadState('networkidle')
        await openMenu()
        await page.getByRole('menuitem', { name: 'Español' }).click()
        await page.waitForURL((u) => u.pathname === '/servicios', { timeout: 10000 }).catch(() => {})
        if (pathnameOf(page) !== '/servicios') fail(`al elegir Español la ruta es ${pathnameOf(page)} (se esperaba /servicios)`)
      })
    })
  }

  if (CHECKS.includes('overflow')) {
    await section('overflow', async (fail) => {
      for (const width of [320, 900, 1024, 1280]) {
        await inContext(browser, { viewport: { width, height: 800 } }, async (page) => {
          await open(page, ENTRY_PATH)
          const m = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          }))
          if (m.scrollWidth > m.innerWidth) fail(`a ${width} px scrollWidth ${m.scrollWidth} supera innerWidth ${m.innerWidth}`)
        })
      }
    })
  }

  if (CHECKS.includes('drawer')) {
    await section('drawer', async (fail) => {
      await inContext(browser, { viewport: { width: 375, height: 800 } }, async (page) => {
        await open(page, ENTRY_PATH)
        const trigger = page.locator('button[aria-controls="menu-movil"]')
        await trigger.click()
        const drawer = page.locator('#menu-movil')
        await drawer.waitFor({ state: 'visible', timeout: 5000 })
        await page.keyboard.press('Escape')
        await drawer.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => fail('Escape no cierra el Drawer'))
        const back = await page.evaluate(() => document.activeElement?.getAttribute('aria-controls') ?? null)
        if (back !== 'menu-movil') fail(`tras cerrar el Drawer el foco queda en aria-controls=${back} y no en el botón de menú`)
      })
    })
  }

  if (CHECKS.includes('focus')) {
    await section('focus', async (fail) => {
      // reducedMotion "reduce" deja data-motion en paused: el scroll al enfocar
      // es instantáneo y la medición no depende de una animación en curso.
      await inContext(browser, { reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } }, async (page) => {
        await open(page, ENTRY_PATH)
        let visited = 0
        for (let stop = 1; stop <= MAX_TAB_STOPS; stop += 1) {
          await page.keyboard.press('Tab')
          // Dos cuadros de animacion: con movimiento pausado las transiciones duran
          // 0.01 ms pero no terminan en el mismo tick, y el enlace de salto
          // (top -64 a 8 px al recibir el foco) se medía aun fuera de pantalla.
          await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const info = await page.evaluate(() => {
            const el = document.activeElement
            if (!el || el === document.body || el === document.documentElement) return { wrapped: true }
            const r = el.getBoundingClientRect()
            const label = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('href') ? ' href=' + el.getAttribute('href') : ''}`
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const inViewport = r.width > 0 && r.height > 0 && cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight
            const top = inViewport ? document.elementFromPoint(cx, cy) : null
            const visible = !!top && (top === el || el.contains(top) || top.contains(el))
            return { wrapped: false, label, inViewport, visible }
          })
          if (info.wrapped) break
          visited += 1
          if (!info.inViewport) fail(`parada ${stop} (${info.label}) queda fuera del viewport`)
          else if (!info.visible) fail(`parada ${stop} (${info.label}) queda tapada por otro elemento (SC 2.4.11)`)
        }
        console.log(`focus: ${visited} paradas de Tab medidas`)
        if (visited < 3) fail(`solo se midieron ${visited} paradas de Tab (se esperaban al menos 3)`)
      })
    })
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  console.log(`FAIL ${failures.length} comprobación(es)`)
  process.exit(1)
}
console.log('OK')
