// Contrato del formulario de Contacto en navegador (fase 54, plan 54-12, PAG-07).
//
// Abre /contact y /en/contact con Chromium (Playwright de devDependencies) y comprueba:
//   - Existen los campos name, email y message, cada uno con etiqueta visible.
//   - El campo oculto `locale` lleva el idioma de la pagina (es o en).
//   - El honeypot `company_website` esta dentro de un contenedor aria-hidden, con
//     tabindex -1 y fuera de pantalla.
//   - No existen campos de servicio ni de sitio web (la accion no los lee).
//   - Con ?sent=true hay un role="status" con texto y ningun formulario; con
//     ?sent=false hay un role="alert" con texto (y el formulario sigue).
//   - Validacion cliente: enviar vacio no sale de la pagina, marca los tres campos
//     como invalidos, muestra el resumen en role="alert" y mueve el foco al primer
//     campo invalido.
//   - Con --submit (explicito) y todos los campos validos, el envio termina en la
//     URL con sent=true. En el preview el envio es simulado por la compuerta de
//     solo lectura (isPreviewReadonly). El envio REAL con Resend se prueba una sola
//     vez contra produccion en la fase 57.
//
// SEGURIDAD (T-54-47): sin --submit el script NUNCA envia el formulario con datos
// validos. Con --submit contra una base que no es el preview, exige ALLOW_REAL_SEND=1
// porque enviaria un correo real.
//
// Modos:
//   --selftest  Evalua checkFormSnapshot, checkSentSnapshot y checkValidationSnapshot
//               sobre fixtures de DOM serializado, sin abrir navegador: uno valido y
//               defectuosos (sin campo locale, honeypot visible, sin etiqueta visible,
//               ...; cada defectuoso debe dar al menos un fallo).
//   (sin modo)  Corre contra BASE_URL (obligatoria).
//   --submit    Agrega el envio con datos validos (ver SEGURIDAD).
//
// Variables: BASE_URL, EXPECT_PREVIEW=1, ALLOW_REAL_SEND=1.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

const REQUIRED_FIELDS = ['name', 'email', 'message']
const FORBIDDEN_FIELDS = ['service', 'website', 'url', 'site', 'company', 'sitio']

// ------------------------------------------------------------ chequeos puros

/**
 * @typedef {{ name: string, type: string, tag: string, labelText: string, labelVisible: boolean,
 *   offscreen: boolean, inAriaHidden: boolean, tabindex: string|null, value: string|null,
 *   required: boolean, invalid: boolean }} Control
 * @typedef {{ hasForm: boolean, controls: Control[], statusTexts: string[], alertTexts: string[],
 *   activeName: string|null }} Snapshot
 */

/**
 * Formulario en estado inicial.
 * @param {Snapshot} snap
 * @param {'es'|'en'} locale
 * @returns {string[]}
 */
export function checkFormSnapshot(snap, locale) {
  const failures = []
  if (!snap.hasForm) return ['no hay formulario de contacto']

  for (const name of REQUIRED_FIELDS) {
    const c = snap.controls.find((x) => x.name === name)
    if (!c) {
      failures.push(`falta el campo ${name}`)
      continue
    }
    if (!c.labelText) failures.push(`el campo ${name} no tiene etiqueta`)
    else if (!c.labelVisible) failures.push(`la etiqueta del campo ${name} no esta visible`)
    if (!c.required) failures.push(`el campo ${name} no es required`)
  }

  const loc = snap.controls.find((x) => x.name === 'locale')
  if (!loc) failures.push('falta el campo oculto locale')
  else {
    if (loc.type !== 'hidden') failures.push(`locale no es hidden (${loc.type})`)
    if (loc.value !== locale) failures.push(`locale vale ${JSON.stringify(loc.value)} (se esperaba ${locale})`)
  }

  const hp = snap.controls.find((x) => x.name === 'company_website')
  if (!hp) failures.push('falta el honeypot company_website')
  else {
    if (!hp.inAriaHidden) failures.push('el honeypot no esta dentro de un contenedor aria-hidden')
    if (hp.tabindex !== '-1') failures.push(`el honeypot no tiene tabindex -1 (${hp.tabindex})`)
    if (!hp.offscreen) failures.push('el honeypot no esta fuera de pantalla')
  }

  const forbidden = snap.controls.filter(
    (x) => x.name !== 'company_website' && FORBIDDEN_FIELDS.some((f) => x.name.toLowerCase().includes(f)),
  )
  if (forbidden.length > 0) failures.push(`hay campos que la accion no lee: ${forbidden.map((x) => x.name).join(', ')}`)

  return failures
}

/**
 * Pagina con ?sent=true o ?sent=false.
 * @param {Snapshot} snap
 * @param {'success'|'error'} kind
 * @returns {string[]}
 */
export function checkSentSnapshot(snap, kind) {
  const failures = []
  if (kind === 'success') {
    if (snap.statusTexts.length === 0) failures.push('con sent=true no hay role="status" con texto')
    if (snap.hasForm) failures.push('con sent=true el formulario sigue en pantalla')
  } else {
    if (snap.alertTexts.length === 0) failures.push('con sent=false no hay role="alert" con texto')
    if (snap.statusTexts.length > 0) failures.push('con sent=false hay un role="status"')
  }
  return failures
}

/**
 * Estado despues de enviar el formulario vacio.
 * @param {Snapshot} snap
 * @param {{ navigated: boolean, urlAfter: string }} nav
 * @returns {string[]}
 */
export function checkValidationSnapshot(snap, nav) {
  const failures = []
  if (nav.navigated) failures.push(`enviar vacio salio de la pagina (${nav.urlAfter})`)
  if (/[?&]sent=/.test(nav.urlAfter)) failures.push(`enviar vacio llego a la accion del servidor (${nav.urlAfter})`)
  const invalid = snap.controls.filter((c) => c.invalid).map((c) => c.name)
  for (const name of REQUIRED_FIELDS) {
    if (!invalid.includes(name)) failures.push(`el campo ${name} no quedo marcado como invalido (aria-invalid)`)
  }
  if (snap.alertTexts.length === 0) failures.push('falta el resumen en role="alert"')
  if (snap.activeName !== 'name') failures.push(`el foco esta en ${JSON.stringify(snap.activeName)} (se esperaba el primer campo invalido, name)`)
  return failures
}

// ---------------------------------------------------------------------- selftest

/** @returns {Control} */
const control = (over) => ({
  name: '',
  type: 'text',
  tag: 'input',
  labelText: 'Etiqueta',
  labelVisible: true,
  offscreen: false,
  inAriaHidden: false,
  tabindex: null,
  value: null,
  required: true,
  invalid: false,
  ...over,
})

/** @returns {Snapshot} */
const validForm = (locale = 'es') => ({
  hasForm: true,
  controls: [
    control({ name: 'locale', type: 'hidden', labelText: '', labelVisible: false, value: locale, required: false }),
    control({ name: 'company_website', labelText: 'Sitio web de la empresa', labelVisible: false, offscreen: true, inAriaHidden: true, tabindex: '-1', required: false }),
    control({ name: 'name' }),
    control({ name: 'email', type: 'email' }),
    control({ name: 'message', tag: 'textarea' }),
  ],
  statusTexts: [],
  alertTexts: [],
  activeName: null,
})

const without = (snap, name) => ({ ...snap, controls: snap.controls.filter((c) => c.name !== name) })
const patch = (snap, name, over) => ({ ...snap, controls: snap.controls.map((c) => (c.name === name ? { ...c, ...over } : c)) })

function selftest() {
  let bad = 0
  const expectClean = (name, failures) => {
    if (failures.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(failures)}`)
    }
  }
  const expectBroken = (name, failures) => {
    if (failures.length > 0) console.log(`PASS selftest ${name}: detecta ${failures.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }

  expectClean('formulario valido es', checkFormSnapshot(validForm('es'), 'es'))
  expectClean('formulario valido en', checkFormSnapshot(validForm('en'), 'en'))
  expectBroken('sin formulario', checkFormSnapshot({ ...validForm(), hasForm: false, controls: [] }, 'es'))
  expectBroken('sin campo locale', checkFormSnapshot(without(validForm(), 'locale'), 'es'))
  expectBroken('locale con el idioma equivocado', checkFormSnapshot(validForm('es'), 'en'))
  expectBroken('locale visible', checkFormSnapshot(patch(validForm(), 'locale', { type: 'text' }), 'es'))
  expectBroken('sin honeypot', checkFormSnapshot(without(validForm(), 'company_website'), 'es'))
  expectBroken('honeypot visible', checkFormSnapshot(patch(validForm(), 'company_website', { offscreen: false }), 'es'))
  expectBroken('honeypot sin aria-hidden', checkFormSnapshot(patch(validForm(), 'company_website', { inAriaHidden: false }), 'es'))
  expectBroken('honeypot enfocable', checkFormSnapshot(patch(validForm(), 'company_website', { tabindex: null }), 'es'))
  expectBroken('sin etiqueta visible', checkFormSnapshot(patch(validForm(), 'email', { labelVisible: false }), 'es'))
  expectBroken('sin etiqueta', checkFormSnapshot(patch(validForm(), 'message', { labelText: '' }), 'es'))
  expectBroken('campo sin required', checkFormSnapshot(patch(validForm(), 'name', { required: false }), 'es'))
  expectBroken('sin campo message', checkFormSnapshot(without(validForm(), 'message'), 'es'))
  expectBroken('campo de servicio', checkFormSnapshot({ ...validForm(), controls: [...validForm().controls, control({ name: 'service' })] }, 'es'))
  expectBroken('campo website', checkFormSnapshot({ ...validForm(), controls: [...validForm().controls, control({ name: 'website' })] }, 'es'))

  expectClean('sent=true valido', checkSentSnapshot({ hasForm: false, controls: [], statusTexts: ['Mensaje enviado'], alertTexts: [], activeName: null }, 'success'))
  expectBroken('sent=true sin status', checkSentSnapshot({ hasForm: false, controls: [], statusTexts: [], alertTexts: [], activeName: null }, 'success'))
  expectBroken('sent=true con formulario', checkSentSnapshot({ ...validForm(), statusTexts: ['Mensaje enviado'] }, 'success'))
  expectClean('sent=false valido', checkSentSnapshot({ ...validForm(), alertTexts: ['Algo salio mal'] }, 'error'))
  expectBroken('sent=false sin alert', checkSentSnapshot(validForm(), 'error'))
  expectBroken('sent=false con status', checkSentSnapshot({ ...validForm(), alertTexts: ['x'], statusTexts: ['y'] }, 'error'))

  const afterEmpty = () => {
    let snap = validForm()
    for (const n of REQUIRED_FIELDS) snap = patch(snap, n, { invalid: true })
    return { ...snap, alertTexts: ['Revisa los campos marcados.'], activeName: 'name' }
  }
  expectClean('validacion vacia valida', checkValidationSnapshot(afterEmpty(), { navigated: false, urlAfter: 'https://x.test/contact' }))
  expectBroken('validacion: sale de la pagina', checkValidationSnapshot(afterEmpty(), { navigated: true, urlAfter: 'https://x.test/contact' }))
  expectBroken('validacion: llego a la accion', checkValidationSnapshot(afterEmpty(), { navigated: false, urlAfter: 'https://x.test/contact?sent=false' }))
  expectBroken('validacion: sin resumen', checkValidationSnapshot({ ...afterEmpty(), alertTexts: [] }, { navigated: false, urlAfter: 'https://x.test/contact' }))
  expectBroken('validacion: foco en otro campo', checkValidationSnapshot({ ...afterEmpty(), activeName: 'message' }, { navigated: false, urlAfter: 'https://x.test/contact' }))
  expectBroken('validacion: un campo sin marcar', checkValidationSnapshot(patch(afterEmpty(), 'email', { invalid: false }), { navigated: false, urlAfter: 'https://x.test/contact' }))

  if (bad === 0) console.log('PASS selftest 54-contact-form: fixtures validos sin fallos y defectuosos detectados')
  return bad > 0 ? 1 : 0
}

// ------------------------------------------------------------------- navegador

/**
 * Se serializa y corre DENTRO de la pagina (page.evaluate): no puede usar nada
 * del modulo. Devuelve el Snapshot del formulario de contacto (el que contiene
 * name="message"), no otro formulario del shell.
 */
export function collectSnapshot() {
  // Emotion puede dejar etiquetas style dentro del arbol: su CSS no es texto visible.
  const textOf = (el) => {
    const copy = el.cloneNode(true)
    copy.querySelectorAll('style, script').forEach((n) => n.remove())
    return (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
  }
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  const form = [...document.forms].find((f) => f.querySelector('[name="message"]')) ?? null
  const controls = form
    ? [...form.querySelectorAll('input, textarea, select')].map((el) => {
        const r = el.getBoundingClientRect()
        const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null
        return {
          name: el.getAttribute('name') ?? '',
          type: el.getAttribute('type') ?? el.tagName.toLowerCase(),
          tag: el.tagName.toLowerCase(),
          labelText: (label ? textOf(label) : (el.getAttribute('aria-label') ?? '')).replace(/\s*\*$/, '').trim(),
          labelVisible: label ? visible(label) : false,
          offscreen: r.right <= 0 || r.bottom <= 0 || r.left < -1000 || r.top < -1000,
          inAriaHidden: el.closest('[aria-hidden="true"]') !== null,
          tabindex: el.getAttribute('tabindex'),
          value: el.getAttribute('type') === 'hidden' ? el.value : null,
          required: el.required,
          invalid: el.getAttribute('aria-invalid') === 'true',
        }
      })
    : []
  // El anunciador de rutas de Next tiene role="alert" y se llena al navegar: no cuenta.
  const live = (role) =>
    [...document.querySelectorAll(`[role="${role}"]`)]
      .filter((el) => el.id !== '__next-route-announcer__')
      .map((el) => textOf(el))
      .filter(Boolean)
  return {
    hasForm: form !== null,
    controls,
    statusTexts: live('status'),
    alertTexts: live('alert'),
    activeName: document.activeElement?.getAttribute?.('name') ?? null,
  }
}

async function launch(chromium) {
  try {
    return await chromium.launch()
  } catch (err) {
    console.log(`chromium de Playwright no disponible (${String(err.message).split('\n')[0]}); pruebo Chrome del sistema`)
    return chromium.launch({ channel: 'chrome' })
  }
}

let failures = 0
function report(name, list) {
  if (list.length === 0) console.log(`PASS ${name}`)
  else {
    failures += list.length
    console.log(`FAIL ${name}: ${list.join('; ')}`)
  }
}
const message = (error) => (error instanceof Error ? error.message.split('\n')[0] : String(error))

/** Espera a que React hidrate el formulario: sin eso, un clic haria un envio nativo a la accion. */
async function waitHydrated(page) {
  await page.waitForFunction(
    () => {
      const form = [...document.forms].find((f) => f.querySelector('[name="message"]'))
      return form !== undefined && Object.keys(form).some((k) => k.startsWith('__reactProps'))
    },
    undefined,
    { timeout: 20000 },
  )
}

async function visit(page, base, path) {
  const response = await page.goto(new URL(path, base).href, { waitUntil: 'load' })
  if (!response || !response.ok()) throw new Error(`${path} respondio ${response ? response.status() : 'sin respuesta'}`)
}

async function liveMode(base, { submit, expectPreview }) {
  if (submit && !expectPreview && process.env.ALLOW_REAL_SEND !== '1') {
    console.log('FAIL --submit enviaria un correo real: usa EXPECT_PREVIEW=1 contra el preview o ALLOW_REAL_SEND=1 si de verdad quieres enviarlo')
    return
  }
  const { chromium } = await import('playwright')
  const browser = await launch(chromium)
  try {
    for (const [prefix, locale] of [['', 'es'], ['/en', 'en']]) {
      const path = `${prefix}/contact`

      // Estado inicial y validacion cliente.
      {
        const context = await browser.newContext()
        const page = await context.newPage()
        try {
          await visit(page, base, path)
          await waitHydrated(page)
          report(`${path}: campos, etiquetas, locale y honeypot`, checkFormSnapshot(await page.evaluate(collectSnapshot), locale))

          await page.evaluate(() => {
            window.__contactMarker = 'sin-recarga'
          })
          await page.locator('form button[type="submit"]').first().click()
          await page.waitForTimeout(600)
          const survived = await page.evaluate(() => window.__contactMarker === 'sin-recarga').catch(() => false)
          const snap = await page.evaluate(collectSnapshot).catch(() => null)
          report(
            `${path}: enviar vacio valida en el cliente y mueve el foco`,
            snap
              ? checkValidationSnapshot(snap, { navigated: !survived, urlAfter: page.url() })
              : ['la pagina se recargo al enviar vacio'],
          )

          if (submit) {
            await page.goto(new URL(path, base).href, { waitUntil: 'load' })
            await waitHydrated(page)
            await page.locator('input[name="name"]').fill('Prueba de contrato')
            await page.locator('input[name="email"]').fill('contract-test@example.com')
            await page.locator('textarea[name="message"]').fill('Mensaje de prueba del contrato 54-contact-form.')
            await Promise.all([
              page.waitForURL(/[?&]sent=/, { timeout: 30000 }),
              page.locator('form button[type="submit"]').first().click(),
            ])
            const finalUrl = page.url()
            report(`${path}: --submit termina en sent=true`, /[?&]sent=true(?:&|$)/.test(finalUrl) ? [] : [`URL final ${finalUrl}`])
            if (/[?&]sent=true(?:&|$)/.test(finalUrl)) {
              await waitHydrated(page).catch(() => {})
              report(`${path}: tras --submit hay role status`, checkSentSnapshot(await page.evaluate(collectSnapshot), 'success'))
            }
          }
        } catch (error) {
          report(path, [`error: ${message(error)}`])
        } finally {
          await context.close()
        }
      }

      // Estados que llegan por ?sent=.
      for (const [value, kind] of [['true', 'success'], ['false', 'error']]) {
        const context = await browser.newContext()
        const page = await context.newPage()
        try {
          await visit(page, base, `${path}?sent=${value}`)
          await page.waitForTimeout(500)
          report(`${path}?sent=${value}: ${kind === 'success' ? 'role status y sin formulario' : 'role alert'}`, checkSentSnapshot(await page.evaluate(collectSnapshot), kind))
        } catch (error) {
          report(`${path}?sent=${value}`, [`error: ${message(error)}`])
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }
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
  await liveMode(base, { submit: args.includes('--submit'), expectPreview: process.env.EXPECT_PREVIEW === '1' })
  process.exit(failures > 0 ? 1 : 0)
}
