/**
 * Autoprueba de las primitivas de layout de la fase 54 (plan 54-05).
 *
 * Renderiza cada primitiva con el arnés de servidor del plan 54-03
 * (tema real, next-intl y mensajes reales) y comprueba estructura: un solo h1,
 * nombres accesibles desde messages, ids que resuelven, texto de paneles
 * cerrados presente en el HTML. Sin JSX (tsconfig fija `jsx: preserve`).
 *
 * Uso:
 *   node_modules/.bin/tsx scripts/verify/54-primitives-ssr.ts
 * Imprime PASS o FAIL con el motivo por caso y sale con 1 ante cualquier FAIL.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as React from 'react'
import { createElement } from 'react'

import { Crumbs } from '../../src/components/mui/Crumbs'
import { FaqAccordion } from '../../src/components/mui/FaqAccordion'
import { IconTile } from '../../src/components/mui/IconTile'
import { PageHero } from '../../src/components/mui/PageHero'
import { ScoreRing } from '../../src/components/mui/ScoreRing'
import { TechChips } from '../../src/components/mui/TechChips'
import { TranslationNotice } from '../../src/components/mui/TranslationNotice'
import { CONTACT_ICON_NAMES, SERVICE_ICON_NAMES } from '../../src/lib/shadow-icons'
import { Section } from '../../src/components/mui/Section'
import { countOf, hasId, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx no transforma JSX con `jsx: preserve` y cae al runtime clasico, que busca
// `React` global al renderizar los componentes .tsx. Solo se usa en esta autoprueba.
;(globalThis as { React?: typeof React }).React = React

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const es = JSON.parse(fs.readFileSync(path.join(root, 'messages', 'es.json'), 'utf8'))
const en = JSON.parse(fs.readFileSync(path.join(root, 'messages', 'en.json'), 'utf8'))

let failed = 0
function check(name: string, ok: boolean, reason: string) {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failed += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

/** HTML sin las etiquetas style que Emotion inyecta con el CSS global del tema. */
function markup(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, '')
}

/** Valores de aria-labelledby y aria-controls del HTML y si cada uno resuelve a un id existente. */
function dangling(html: string, attr: 'aria-labelledby' | 'aria-controls'): string[] {
  const out: string[] = []
  for (const m of html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) {
    for (const id of m[1].split(/\s+/)) if (!hasId(html, id)) out.push(id)
  }
  return out
}

// ---------------------------------------------------------------------------
// Tarea 1: PageHero, Crumbs y Section
// ---------------------------------------------------------------------------
{
  const crumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Auditoría SEO técnica' },
  ]
  const html = renderToHtml(
    createElement(PageHero, {
      crumbs,
      eyebrow: 'Servicio',
      title: 'Auditoría SEO técnica',
      lead: 'Lead de prueba',
    }),
    'es',
  )

  check('PageHero: exactamente un h1', countOf(html, /<h1[\s>]/) === 1, `h1 = ${countOf(html, /<h1[\s>]/)}`)
  check(
    'PageHero: nav con el nombre accesible de messages',
    new RegExp(`<nav[^>]*aria-label="${es.common.breadcrumbsLabel}"`).test(html),
    `no hay un <nav> con aria-label="${es.common.breadcrumbsLabel}"`,
  )
  check(
    'PageHero: una sola miga con aria-current page y es la ultima',
    countOf(html, /aria-current="page"/) === 1 && /aria-current="page"[^>]*>Auditoría SEO técnica</.test(html),
    'falta aria-current="page" en la ultima miga o hay mas de una',
  )
  check('PageHero: enlace a /', /href="\/"[^>]*>Inicio</.test(html), 'no hay enlace href="/" con Inicio')
  check('PageHero: enlace a /servicios', /href="\/servicios"[^>]*>Servicios</.test(html), 'no hay enlace href="/servicios"')
  const danglingHero = dangling(html, 'aria-labelledby')
  check(
    'PageHero: aria-labelledby resuelve a un id existente',
    /aria-labelledby="page-title"/.test(html) && hasId(html, 'page-title') && danglingHero.length === 0,
    `ids colgando: ${danglingHero.join(', ') || '(aria-labelledby="page-title" ausente)'}`,
  )
  check('PageHero: lead presente', textOf(html).includes('Lead de prueba'), 'el lead no esta en el HTML')

  // Miga en ingles: las rutas ya prefijadas no deben recibir un segundo prefijo.
  const htmlEn = renderToHtml(
    createElement(Crumbs, {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/en/services' },
        { label: 'Audit' },
      ],
    }),
    'en',
  )
  check(
    'Crumbs: nombre accesible en ingles y sin doble prefijo',
    htmlEn.includes(`aria-label="${en.common.breadcrumbsLabel}"`) &&
      /href="\/en\/services"/.test(htmlEn) &&
      !/href="\/en\/en\//.test(htmlEn),
    `breadcrumbsLabel EN o prefijo incorrecto: ${htmlEn.slice(0, 200)}`,
  )

  const sec = renderToHtml(
    createElement(
      Section,
      { id: 'prueba', title: 'Titulo de seccion', lead: 'Lead de seccion' },
      createElement('p', null, 'Cuerpo'),
    ),
    'es',
  )
  check('Section: un h2 con id prueba-t', countOf(sec, /<h2[\s>]/) === 1 && hasId(sec, 'prueba-t'), 'falta h2 o id prueba-t')
  check(
    'Section: aria-labelledby resuelve',
    /aria-labelledby="prueba-t"/.test(sec) && dangling(sec, 'aria-labelledby').length === 0,
    `ids colgando: ${dangling(sec, 'aria-labelledby').join(', ')}`,
  )
  check('Section: encabezados h2 solamente', JSON.stringify(headingLevels(sec)) === '[2]', `niveles ${JSON.stringify(headingLevels(sec))}`)

  const all = html + htmlEn + sec
  check('Ninguna salida abre o cierra un main', !/<\/?main[\s>]/.test(all), 'una salida contiene <main>')
}

// ---------------------------------------------------------------------------
// Tarea 2: IconTile, TechChips, ScoreRing, TranslationNotice y FaqAccordion
// ---------------------------------------------------------------------------
{
  const faq = renderToHtml(
    createElement(FaqAccordion, {
      idPrefix: 'faq',
      items: [
        { question: 'Pregunta uno', answer: 'RESPUESTA_ABIERTA_UNO' },
        { question: 'Pregunta dos', answer: 'RESPUESTA_CERRADA_DOS' },
        { question: 'Pregunta tres', answer: 'RESPUESTA_CERRADA_TRES' },
      ],
    }),
    'es',
  )
  check(
    'FaqAccordion: el texto de los tres paneles esta en el HTML aunque dos esten cerrados',
    ['RESPUESTA_ABIERTA_UNO', 'RESPUESTA_CERRADA_DOS', 'RESPUESTA_CERRADA_TRES'].every((x) => faq.includes(x)),
    'falta el texto de algun panel en el HTML servido (Pitfall 7)',
  )
  const summaryIds = [0, 1, 2].map((i) => `faq-${i}-h`)
  const panelIds = [0, 1, 2].map((i) => `faq-${i}-c`)
  check(
    'FaqAccordion: resumenes con id y aria-controls que apuntan a paneles existentes',
    summaryIds.every((id) => hasId(faq, id)) &&
      panelIds.every((id) => hasId(faq, id) && new RegExp(`aria-controls="${id}"`).test(faq)) &&
      dangling(faq, 'aria-controls').length === 0,
    `ids ausentes o aria-controls colgando: ${dangling(faq, 'aria-controls').join(', ')}`,
  )
  const faqIds = [...faq.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  check(
    'FaqAccordion: ningun id repetido (el panel recibe su id de MUI desde aria-controls)',
    faqIds.every((id, i) => faqIds.indexOf(id) === i),
    `ids repetidos: ${faqIds.filter((id, i) => faqIds.indexOf(id) !== i).join(', ')}`,
  )
  check(
    'FaqAccordion: los encabezados de resumen son h3',
    JSON.stringify(headingLevels(faq)) === '[3,3,3]',
    `niveles ${JSON.stringify(headingLevels(faq))}`,
  )
  check(
    'FaqAccordion: solo el primero abierto por defecto',
    countOf(faq, /aria-expanded="true"/) === 1 && /id="faq-0-h"[^>]*aria-expanded="true"|aria-expanded="true"[^>]*id="faq-0-h"/.test(faq),
    'el estado abierto inicial no es solo el primer panel',
  )
  const faqH2 = renderToHtml(
    createElement(FaqAccordion, { idPrefix: 'toc', headingLevel: 2, items: [{ question: 'Indice', answer: 'x' }] }),
    'es',
  )
  check('FaqAccordion: headingLevel 2 emite h2', JSON.stringify(headingLevels(faqH2)) === '[2]', `niveles ${JSON.stringify(headingLevels(faqH2))}`)

  const ringNull = renderToHtml(createElement(ScoreRing, { value: null, label: 'Rendimiento', srSuffix: 'de 100', as: 'div' }), 'es')
  check('ScoreRing: con null no produce marcado', markup(ringNull).trim() === '', `salida: ${markup(ringNull).slice(0, 120)}`)
  const ring = renderToHtml(createElement(ScoreRing, { value: 96, label: 'Rendimiento', srSuffix: 'de 100', as: 'div' }), 'es')
  const ringText = textOf(ring)
  check('ScoreRing: con 96 produce el numero y el sufijo', ringText.includes('96') && ringText.includes('de 100'), `texto: ${ringText}`)
  check('ScoreRing: la leyenda no usa 11px', !/0\.6875rem|11px/.test(markup(ring)), 'la leyenda sigue en 11px')

  const names = [...SERVICE_ICON_NAMES, ...CONTACT_ICON_NAMES]
  const badNames = names.filter((n) => {
    const h = renderToHtml(createElement(IconTile, { name: n }), 'es')
    return !/<svg[^>]*aria-hidden="true"/.test(h)
  })
  check('IconTile: resuelve los 11 nombres de shadow-icons con svg aria-hidden', names.length === 11 && badNames.length === 0, `sin svg: ${badNames.join(', ')} (total nombres ${names.length})`)
  check('IconTile: un nombre desconocido produce cadena vacia', markup(renderToHtml(createElement(IconTile, { name: 'no-existe' }), 'es')).trim() === '', 'el nombre desconocido produjo marcado')

  const notice = renderToHtml(createElement(TranslationNotice, { esHref: '/sobre-mi' }), 'en')
  check('TranslationNotice: role note', /role="note"/.test(notice), 'falta role="note"')
  check('TranslationNotice: texto en un span lang en', /<span lang="en">This page is not available in English yet/.test(notice), 'falta el span lang="en" con el texto de messages')
  check(
    'TranslationNotice: enlace con lang es y hreflang es',
    /<a [^>]*lang="es"[^>]*>Ver en español<\/a>/.test(notice) && /hrefLang="es"|hreflang="es"/.test(notice),
    'falta el enlace Ver en español con lang="es" y hreflang="es"',
  )
  check('TranslationNotice: el enlace va a la ruta en espanol sin prefijo en', /href="\/sobre-mi"/.test(notice), `enlace: ${(notice.match(/<a [^>]*>/) ?? [''])[0]}`)

  const chips = renderToHtml(createElement(TechChips, { items: ['Next.js', 'Payload'], label: 'Temas' }), 'es')
  check('TechChips: un ul con aria-label', /<ul[^>]*aria-label="Temas"/.test(chips) && countOf(chips, /<li[\s>]/) === 2, 'falta el ul etiquetado o los dos li')
}

// ---------------------------------------------------------------------------
process.exit(failed > 0 ? 1 : 0)
