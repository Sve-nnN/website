/**
 * Autoprueba de render de la home (fase 54, plan 54-08).
 *
 * Pasa el copy sembrado (HOME_COPY_ES) por `mapHomeGlobal`, renderiza HomeView
 * con el arnés de servidor y comprueba la estructura del HTML. No toca ninguna
 * base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-home-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a propósito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { HomeView } from '../../src/components/home/HomeView'
import { mapHomeGlobal, type HomeData } from '../../src/lib/home-data'
import { HOME_COPY_ES } from '../db/data/54-home-copy'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clásico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

// --dump imprime el HTML del fixture sin etiquetas style, para inspeccionarlo a mano.
if (process.argv.includes('--dump')) {
  const dumped = renderToHtml(
    createElement(HomeView, {
      data: mapHomeGlobal(HOME_COPY_ES as never, 'es', false),
      locale: 'es',
      fallbackTitle: 'respaldo',
    }),
    'es',
  )
  console.log(dumped.replace(/<style[\s\S]*?<\/style>/g, ''))
  process.exit(0)
}

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

const FALLBACK_TITLE = 'Juan Carlos Angulo | Ingeniero de Software y SEO Técnico'

/** HTML sin las etiquetas style de Emotion, que viajan en el mismo string. */
function render(data: HomeData, locale: 'es' | 'en' = 'es'): string {
  return renderToHtml(createElement(HomeView, { data, locale, fallbackTitle: FALLBACK_TITLE }), locale).replace(
    /<style[\s\S]*?<\/style>/g,
    '',
  )
}

// El fixture trae el copy aprobado tal cual lo siembra el script 20.
const fixture = mapHomeGlobal(HOME_COPY_ES as never, 'es', false)
const empty = mapHomeGlobal(null, 'es', false)

// ---------------------------------------------------------------------------
// Tagline (tarea 1)
// ---------------------------------------------------------------------------
{
  const html = render(fixture)
  check(fixture.tagline === HOME_COPY_ES.tagline, 'mapper: tagline', 'mapHomeGlobal no devolvió la tagline del fixture')
  check(textOf(html).includes(HOME_COPY_ES.tagline), 'tagline: frase completa en el HTML', 'la frase completa no aparece en el HTML')
  check(
    countOf(html, /aria-hidden="true"><span[^>]*data-w/) === 1 && countOf(html, /data-w/) === HOME_COPY_ES.tagline.split(/\s+/).length,
    'tagline: una palabra por data-w en span aria-hidden',
    'las palabras no están en el span aria-hidden o el conteo no coincide',
  )
  check(/aria-label="Lo que prometo"/.test(html), 'tagline: aria-label desde messages', 'falta el aria-label de messages home.taglineLabel')
  check(!/\{\{/.test(html), 'sin llaves dobles', 'la salida contiene llaves dobles')
  check(!/<main[\s>]/.test(html), 'sin main', 'la vista abre un main')
}

// ---------------------------------------------------------------------------
// Datos vacíos: un h1 oculto de respaldo y sin lanzar
// ---------------------------------------------------------------------------
{
  let html = ''
  let threw = false
  try {
    html = render(empty)
  } catch {
    threw = true
  }
  check(!threw, 'vacío: no lanza', 'HomeView lanzó con todas las secciones en null')
  check(countOf(html, /<h1[\s>]/) === 1, 'vacío: exactamente un h1', `h1 encontrados: ${countOf(html, /<h1[\s>]/)}`)
  check(textOf(html) === FALLBACK_TITLE, 'vacío: el h1 lleva el título de respaldo y nada más', `texto: "${textOf(html)}"`)
  check(JSON.stringify(headingLevels(html)) === '[1]', 'vacío: solo encabezados [1]', JSON.stringify(headingLevels(html)))
}

// ---------------------------------------------------------------------------
// Respaldo de idioma
// ---------------------------------------------------------------------------
{
  const fb = mapHomeGlobal(HOME_COPY_ES as never, 'en', true)
  const html = render(fb, 'en')
  check(/role="note"/.test(html), 'EN fallback: TranslationNotice presente', 'falta el aviso de traducción')
  check(/lang="es"/.test(html), 'EN fallback: contenedor lang es', 'falta el contenedor con lang es')
  const esHtml = render(fixture, 'es')
  check(!/role="note"/.test(esHtml), 'ES: sin aviso de traducción', 'el aviso aparece en español')
}

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nPASS 54-home-ssr')
