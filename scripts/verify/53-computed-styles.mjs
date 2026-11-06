/**
 * READ-ONLY. Comprobaciones de navegador (estilos computados) contra una página
 * servida de verdad. Complementa a 53-layer-check.mjs: aquel prueba la forma del
 * CSS compilado, este prueba que el navegador aplica el resultado correcto.
 *
 * Qué comprueba hoy (plan 53-01):
 *   - `body` tiene fondo `rgb(24, 24, 24)` (#181818, el tema oscuro de MUI gana
 *     al reset de Tailwind porque `tailwind` queda bajo `mui`).
 *   - El primer `.MuiButton-contained` tiene fondo `rgb(255, 122, 69)` (#FF7A45).
 *     Si no existe ninguno y REQUIRE_BUTTON=1, falla; si no se exige, imprime
 *     `SKIP botón` y sigue.
 *
 * Qué agregan los planes siguientes en este mismo archivo: las secciones de
 * comportamiento del shell (toggle de movimiento, selector de idioma, enlace de
 * salto, desborde horizontal, foco no oculto) las agrega el plan 05.
 *
 * Necesita una página con datos reales, así que no corre en el plan 01: lo
 * ejecutan los planes 05 y 06 contra un servidor levantado.
 *
 * Variables de entorno:
 *   BASE_URL        por defecto http://localhost:3000
 *   PATH_TO_CHECK   por defecto /
 *   REQUIRE_BUTTON  1 exige que exista un botón MUI contained
 *
 * Run:
 *   BASE_URL=http://localhost:3000 PATH_TO_CHECK=/ REQUIRE_BUTTON=1 \
 *     node scripts/verify/53-computed-styles.mjs
 */
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const PATH_TO_CHECK = process.env.PATH_TO_CHECK ?? '/'
const REQUIRE_BUTTON = process.env.REQUIRE_BUTTON === '1'

const EXPECTED_BODY_BG = 'rgb(24, 24, 24)'
const EXPECTED_BUTTON_BG = 'rgb(255, 122, 69)'

const failures = []

async function launch() {
  try {
    return await chromium.launch()
  } catch (err) {
    console.log(`chromium de Playwright no disponible (${err.message.split('\n')[0]}); pruebo Chrome del sistema`)
    return chromium.launch({ channel: 'chrome' })
  }
}

const browser = await launch()
try {
  const page = await browser.newPage()
  const url = new URL(PATH_TO_CHECK, BASE_URL).href
  const response = await page.goto(url, { waitUntil: 'networkidle' })
  if (!response || !response.ok()) {
    failures.push(`${url} respondió ${response ? response.status() : 'sin respuesta'}`)
  }

  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  if (bodyBg === EXPECTED_BODY_BG) {
    console.log(`OK body backgroundColor ${bodyBg}`)
  } else {
    failures.push(`body backgroundColor ${bodyBg} (se esperaba ${EXPECTED_BODY_BG})`)
  }

  const button = page.locator('.MuiButton-contained').first()
  if ((await button.count()) > 0) {
    const buttonBg = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
    if (buttonBg === EXPECTED_BUTTON_BG) {
      console.log(`OK .MuiButton-contained backgroundColor ${buttonBg}`)
    } else {
      failures.push(`.MuiButton-contained backgroundColor ${buttonBg} (se esperaba ${EXPECTED_BUTTON_BG})`)
    }
  } else if (REQUIRE_BUTTON) {
    failures.push('no existe ningún .MuiButton-contained y REQUIRE_BUTTON=1')
  } else {
    console.log('SKIP botón (no hay .MuiButton-contained en esta página)')
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  for (const f of failures) console.log(`FAIL: ${f}`)
  process.exit(1)
}
console.log('OK')
