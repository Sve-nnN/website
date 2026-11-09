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

/** HTML con las etiquetas style de Emotion incluidas (para comprobar reglas de CSS). */
function renderRaw(data: HomeData, locale: 'es' | 'en' = 'es'): string {
  return renderToHtml(createElement(HomeView, { data, locale, fallbackTitle: FALLBACK_TITLE }), locale)
}

/** HTML sin las etiquetas style de Emotion, que viajan en el mismo string. */
function render(data: HomeData, locale: 'es' | 'en' = 'es'): string {
  return renderRaw(data, locale).replace(/<style[\s\S]*?<\/style>/g, '')
}

// El fixture trae el copy aprobado tal cual lo siembra el script 20.
const fixtureBase = mapHomeGlobal(HOME_COPY_ES as never, 'es', false)
// Seis logos de prueba con datos de forma distinta (con y sin dimensiones, uno claro).
const TEST_LOGOS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  src: `https://res.cloudinary.com/demo/image/upload/logo-${i + 1}.webp`,
  alt: `Cliente ${i + 1}`,
  width: i === 2 ? null : 200 + i * 10,
  height: i === 2 ? null : 60,
  onDark: i === 1,
}))
const MARQUEE_TITLE = 'Clientes que confiaron en mí'
const fixture: HomeData = { ...fixtureBase, clients: { title: MARQUEE_TITLE, logos: TEST_LOGOS } }
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
// Hero y marquesina (tarea 2)
// ---------------------------------------------------------------------------
{
  const raw = renderRaw(fixture)
  const html = render(fixture)
  check(countOf(html, /<h1[\s>]/) === 1, 'hero: exactamente un h1', `h1 encontrados: ${countOf(html, /<h1[\s>]/)}`)
  const h1 = html.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? ''
  check(
    countOf(h1, /<span[\s>]/) === 2 && !/<br/.test(h1),
    'hero: h1 con dos span y sin br',
    `spans: ${countOf(h1, /<span[\s>]/)}, br: ${/<br/.test(h1)}`,
  )
  check(
    textOf(h1) === `${HOME_COPY_ES.hero.titleLine1} ${HOME_COPY_ES.hero.titleLine2}`,
    'hero: h1 con titleLine1 y titleLine2 del fixture',
    `texto del h1: "${textOf(h1)}"`,
  )
  const spanClass = h1.match(/<span class="([^"]+)"/)?.[1]?.split(' ').find((c) => c.startsWith('css-')) ?? ''
  check(
    spanClass !== '' && new RegExp(`\\.${spanClass}\\{[^}]*display:block`).test(raw),
    'hero: cada linea del h1 es un span en bloque',
    `la clase ${spanClass || '(ninguna)'} no declara display:block`,
  )
  check(/<a[^>]*href="#contacto"[^>]*>[^<]*Pedir auditoría 360/.test(html), 'hero: CTA con href #contacto', 'falta el enlace al ancla #contacto')
  check(
    fixture.hero?.ctaHref === '#contacto' && mapHomeGlobal({ hero: { titleLine1: 'x', ctaLabel: 'y', ctaHref: 'javascript:alert(1)' } } as never, 'es', false).hero?.ctaHref === null,
    'hero: sanitizeHref rechaza javascript:',
    'el href peligroso no quedó en null',
  )
  const noCta = renderToHtml(
    createElement(HomeView, {
      data: mapHomeGlobal({ hero: { titleLine1: 'x', ctaLabel: 'y', ctaHref: 'javascript:alert(1)' } } as never, 'es', false),
      locale: 'es',
      fallbackTitle: FALLBACK_TITLE,
    }),
  )
  check(!/javascript:/.test(noCta) && !/<a[\s>]/.test(noCta), 'hero: href peligroso no llega al HTML', 'aparece javascript: o un enlace')
  check(/role="img"[^>]*aria-label="Retrato de Juan Carlos Angulo dibujado con caracteres ASCII"/.test(html) || /aria-label="Retrato de Juan Carlos Angulo dibujado con caracteres ASCII"[^>]*role="img"/.test(html), 'hero: retrato con aria-label de messages', 'falta el nombre accesible del retrato')
  check(html.includes(HOME_COPY_ES.hero.statValue) && html.includes(HOME_COPY_ES.hero.statCaption), 'hero: tarjeta de cifra', 'falta statValue o statCaption')

  // Marquesina con seis logos
  check(countOf(html, /id="clientes-t"/) === 1, 'marquesina: un encabezado de clientes', 'falta o se repite el encabezado')
  check(textOf(html).includes(MARQUEE_TITLE), 'marquesina: título de clientLogosBlock', 'no aparece el título de prueba')
  check(countOf(html, /<img[^>]*alt=""/) === 6, 'marquesina: una copia aria-hidden (alt vacío) por logo', `copias con alt vacío: ${countOf(html, /<img[^>]*alt=""/)}`)
  check(countOf(html, /<img[^>]*alt="Cliente \d"/) === 6, 'marquesina: seis logos visibles con alt', `visibles: ${countOf(html, /<img[^>]*alt="Cliente \d"/)}`)
  check(countOf(html, /aria-hidden="true"><img/) === 6, 'marquesina: cada copia envuelta en aria-hidden', `envolturas: ${countOf(html, /aria-hidden="true"><img/)}`)
  check(!/\/logos\//.test(html), 'marquesina: ninguna ruta del sandbox', 'aparece /logos/')

  // Lista vacía: sin encabezado huérfano
  const noLogos = render({ ...fixture, clients: null })
  check(!/id="clientes-t"/.test(noLogos) && !noLogos.includes(MARQUEE_TITLE), 'marquesina: sin logos no emite encabezado', 'quedó el encabezado de clientes')
  const noHero = render({ ...fixture, hero: null })
  check(countOf(noHero, /<h1[\s>]/) === 1 && textOf(noHero.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? '') === FALLBACK_TITLE, 'hero: sin hero hay un h1 oculto de respaldo', 'no hay un único h1 de respaldo')
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
