/**
 * Arnés de render de servidor para las vistas de la fase 54.
 *
 * Envuelve cualquier elemento con el tema real de MUI, next-intl y los
 * mensajes reales de messages/{es,en}.json, y devuelve el HTML con
 * renderToString. Las vistas se prueban así sin base de datos, solo para
 * comprobar estructura (encabezados, ids, texto de paneles cerrados).
 *
 * Sin JSX a propósito: el tsconfig fija `jsx: preserve` y tsx no lo transforma,
 * así que todo se arma con React.createElement.
 *
 * Uso desde otro script:
 *   import { renderToHtml, countOf, hasId, headingLevels, textOf } from './54-ssr-harness'
 *
 * Autoprueba:
 *   node_modules/.bin/tsx scripts/verify/54-ssr-harness.ts --selftest
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createElement, type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { ThemeProvider } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import { NextIntlClientProvider, useTranslations } from 'next-intl'

import { Link } from '../../src/i18n/navigation'
import { theme } from '../../src/theme/theme'

export type HarnessLocale = 'es' | 'en'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function loadMessages(locale: HarnessLocale) {
  return JSON.parse(fs.readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8'))
}

/** Renderiza `element` con tema, next-intl y mensajes reales. Devuelve HTML. */
export function renderToHtml(element: ReactElement, locale: HarnessLocale = 'es'): string {
  const messages = loadMessages(locale)
  return renderToString(
    createElement(
      NextIntlClientProvider,
      { locale, messages, timeZone: 'UTC' },
      createElement(ThemeProvider, { theme, defaultMode: 'dark' }, element),
    ),
  )
}

/** Cuenta coincidencias con una expresion global (nunca grep -c, que cuenta lineas). */
export function countOf(html: string, regex: RegExp): number {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`
  return (html.match(new RegExp(regex.source, flags)) ?? []).length
}

/** True si algun elemento lleva exactamente ese id. */
export function hasId(html: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\sid="${escaped}"`).test(html)
}

/** Niveles de encabezado (1 a 6) en orden de aparicion. */
export function headingLevels(html: string): number[] {
  return [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
}

/** Texto visible aproximado: sin etiquetas, con entidades basicas decodificadas y espacios colapsados. */
export function textOf(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

function Probe() {
  const t = useTranslations('common')
  return createElement(
    'div',
    null,
    createElement('p', { id: 'inicio' }, t('breadcrumbHome')),
    createElement(Button, { component: Link, href: '/servicios' }, 'Ir'),
    createElement(
      Accordion,
      { expanded: false },
      createElement(AccordionSummary, { id: 'p-h', 'aria-controls': 'p-c' }, 'Pregunta'),
      createElement(AccordionDetails, { id: 'p-c' }, 'TEXTO_DEL_PANEL_CERRADO'),
    ),
  )
}

function Headings() {
  return createElement(
    'div',
    null,
    createElement('h1', null, 'Uno'),
    createElement('h2', null, 'Dos'),
    createElement('h3', null, 'Tres'),
  )
}

function selftest(): number {
  const failures: string[] = []
  const check = (ok: boolean, reason: string) => {
    if (!ok) failures.push(reason)
  }

  const es = loadMessages('es')
  const en = loadMessages('en')

  const htmlEs = renderToHtml(createElement(Probe), 'es')
  const htmlEn = renderToHtml(createElement(Probe), 'en')

  check(textOf(htmlEs).includes(es.common.breadcrumbHome), `es: no aparece "${es.common.breadcrumbHome}" de messages/es.json`)
  check(es.common.breadcrumbHome === 'Inicio', 'es: common.breadcrumbHome deberia ser "Inicio"')
  check(textOf(htmlEn).includes(en.common.breadcrumbHome), `en: no aparece "${en.common.breadcrumbHome}" de messages/en.json`)
  check(en.common.breadcrumbHome !== es.common.breadcrumbHome, 'en: breadcrumbHome es igual al de es')

  check(/href="\/servicios"/.test(htmlEs), 'es: el Link no renderizo href="/servicios"')
  check(/href="\/en\/servicios"/.test(htmlEn), 'en: el Link no renderizo href="/en/servicios" (prefijo de idioma)')

  check(htmlEs.includes('TEXTO_DEL_PANEL_CERRADO'), 'es: el texto del panel cerrado no esta en el HTML')
  check(htmlEn.includes('TEXTO_DEL_PANEL_CERRADO'), 'en: el texto del panel cerrado no esta en el HTML')

  check(hasId(htmlEs, 'inicio') && hasId(htmlEs, 'p-c') && !hasId(htmlEs, 'no-existe'), 'hasId no distingue ids presentes y ausentes')
  const headingsHtml = renderToHtml(createElement(Headings), 'es')
  check(JSON.stringify(headingLevels(headingsHtml)) === '[1,2,3]', `headingLevels dio ${JSON.stringify(headingLevels(headingsHtml))}, se esperaba [1,2,3]`)
  check(countOf(headingsHtml, /<h[1-6]/) === 3, 'countOf no conto 3 encabezados')
  // El resumen de un Accordion de MUI ya viene envuelto en un h3: las vistas lo cuentan como encabezado.
  check(JSON.stringify(headingLevels(htmlEs)) === '[3]', `el Accordion deberia aportar un h3, dio ${JSON.stringify(headingLevels(htmlEs))}`)
  check(countOf('aaa\naaa', /aaa/) === 2, 'countOf no cuenta coincidencias multiples en lineas distintas')

  if (failures.length > 0) {
    for (const reason of failures) console.log(`FAIL ${reason}`)
    return 1
  }
  console.log('PASS 54-ssr-harness selftest (useTranslations resuelve claves reales en es y en, Link, Accordion y helpers)')
  return 0
}

const isMain = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false
if (isMain && process.argv.includes('--selftest')) {
  process.exit(selftest())
}
