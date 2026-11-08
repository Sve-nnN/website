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
import { PageHero } from '../../src/components/mui/PageHero'
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
process.exit(failed > 0 ? 1 : 0)
