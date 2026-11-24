/**
 * Autoprueba de render en cliente del borrador del formulario (fase 57, plan 57-04, IN-02).
 *
 * Monta ContactForm con react-dom/client sobre happy-dom (sin navegador, sin red,
 * sin base) y comprueba:
 *   - Con status 'error' y un borrador en sessionStorage, los tres campos vuelven
 *     con lo escrito, la etiqueta de MUI queda arriba y el borrador se borra.
 *   - El fallo se sigue anunciando en un role="alert".
 *   - Con status 'success' el borrador se descarta.
 *   - Con status null el borrador no se toca ni se aplica.
 *   - Un borrador corrupto no rompe el render y deja los campos vacios.
 *
 * Nunca llama a la accion del servidor ni envia correo (D-08).
 *
 *   node_modules/.bin/tsx scripts/verify/57-contact-draft.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito: todo con createElement.
 */
import fs from 'node:fs'

import { Window } from 'happy-dom'

const win = new Window({ url: 'https://ejemplo.test/contact?sent=false' })
const g = globalThis as Record<string, unknown>
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLFormElement', 'Node', 'Element', 'getComputedStyle', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  Object.defineProperty(g, k, { value: (win as unknown as Record<string, unknown>)[k], configurable: true, writable: true })
}
g.self = win
g.IS_REACT_ACT_ENVIRONMENT = true

const React = await import('react')
g.React = React
const { act, createElement } = React
const { createRoot } = await import('react-dom/client')
const { NextIntlClientProvider } = await import('next-intl')
const { ThemeProvider } = await import('@mui/material/styles')
const { theme } = await import('../../src/theme/theme')
const { ContactForm, DRAFT_KEY } = await import('../../src/components/mui/ContactForm')

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) console.log(`PASS ${name}`)
  else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

type Status = 'error' | 'success' | null
const DRAFT = { name: 'Ana Prueba', email: 'ana@ejemplo.com', message: 'Linea uno\nLinea dos del mensaje' }

async function mount(status: Status, locale: 'es' | 'en' = 'es') {
  const messages = JSON.parse(fs.readFileSync(`messages/${locale}.json`, 'utf8'))
  const el = win.document.createElement('div')
  win.document.body.appendChild(el)
  const root = createRoot(el as never)
  await act(async () => {
    root.render(
      createElement(
        NextIntlClientProvider,
        { locale, messages, timeZone: 'UTC' },
        createElement(ThemeProvider, { theme }, createElement(ContactForm, { variant: status === null ? 'panel' : 'card', status, email: 'correo@ejemplo.com' })),
      ),
    )
  })
  const value = (n: string) => (el.querySelector(`[name="${n}"]`) as unknown as { value: string } | null)?.value ?? null
  const shrunk = (n: string) => {
    const input = el.querySelector(`[name="${n}"]`)
    const label = input?.id ? el.querySelector(`label[for="${input.id}"]`) : null
    return label?.getAttribute('data-shrink') === 'true'
  }
  const alerts = [...el.querySelectorAll('[role="alert"]')].map((a) => (a.textContent ?? '').trim()).filter(Boolean)
  const unmount = async () => {
    await act(async () => root.unmount())
    el.remove()
  }
  return { value, shrunk, alerts, unmount }
}

for (const locale of ['es', 'en'] as const) {
  win.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(DRAFT))
  const failed = await mount('error', locale)
  for (const field of ['name', 'email', 'message'] as const) {
    check(failed.value(field) === DRAFT[field], `${locale} error: ${field} vuelve con lo escrito`, `valor ${JSON.stringify(failed.value(field))}`)
    check(failed.shrunk(field), `${locale} error: la etiqueta de ${field} queda arriba`, 'data-shrink no es true')
  }
  check(win.sessionStorage.getItem(DRAFT_KEY) === null, `${locale} error: el borrador se borra al recuperarlo`, 'sigue en sessionStorage')
  check(failed.alerts.length > 0, `${locale} error: el fallo se anuncia en role alert`, 'sin role alert con texto')
  await failed.unmount()
}

win.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(DRAFT))
const ok = await mount('success')
check(win.sessionStorage.getItem(DRAFT_KEY) === null, 'success: el borrador se descarta', 'sigue en sessionStorage')
await ok.unmount()

win.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(DRAFT))
const idle = await mount(null)
check(idle.value('message') === '', 'sin estado: no aplica el borrador', `message = ${JSON.stringify(idle.value('message'))}`)
check(win.sessionStorage.getItem(DRAFT_KEY) !== null, 'sin estado: no borra el borrador', 'se borro')
await idle.unmount()

win.sessionStorage.setItem(DRAFT_KEY, '{no es json')
const broken = await mount('error')
check(broken.value('name') === '' && broken.value('message') === '', 'borrador corrupto: campos vacios sin romper', `name = ${JSON.stringify(broken.value('name'))}`)
await broken.unmount()

if (failures === 0) console.log('PASS 57-contact-draft: el mensaje sobrevive al fallo y se descarta tras el exito')
process.exit(failures > 0 ? 1 : 0)
