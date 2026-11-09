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
import { Services } from '../../src/components/home/Services'
import { Vitals } from '../../src/components/home/Vitals'
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
// Vitals y Servicios (tarea 3)
// ---------------------------------------------------------------------------
{
  const html = render(fixture)
  const vitalsHtml = html.slice(html.indexOf('id="medicion"'), html.indexOf('id="servicios"'))

  // Vitals: cuatro tarjetas con h3, cuatro barras con nombre accesible y la cifra de cada una
  check(fixture.vitals?.items.length === 4, 'vitals: el mapper trae cuatro lecturas', `items: ${fixture.vitals?.items.length}`)
  check(countOf(vitalsHtml, /<h3[\s>]/) === 4, 'vitals: cuatro tarjetas con h3', `h3: ${countOf(vitalsHtml, /<h3[\s>]/)}`)
  check(countOf(vitalsHtml, /<li[\s>]/) === 4, 'vitals: cuatro li dentro de una lista', `li: ${countOf(vitalsHtml, /<li[\s>]/)}`)
  const bars = [...vitalsHtml.matchAll(/role="img"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1])
  const expected = HOME_COPY_ES.vitals.items.map((v) => `${v.name} de juan-tech.com: ${v.label}, dentro del rango bueno`)
  check(
    bars.length === 4 && expected.every((e, i) => bars[i] === e),
    'vitals: cuatro role=img con el nombre accesible armado desde messages',
    `barras: ${JSON.stringify(bars)}`,
  )
  check(
    HOME_COPY_ES.vitals.items.every((v) => vitalsHtml.includes(`>${v.value}<`) && vitalsHtml.includes(v.note)),
    'vitals: la cifra y la nota de cada lectura están en texto',
    'falta una cifra o una nota',
  )
  check(vitalsHtml.includes(HOME_COPY_ES.vitals.measurementNote), 'vitals: nota de medición', 'falta la nota de medición')
  check(!/\{\{|\{name\}|\{label\}/.test(html), 'vitals: la plantilla ariaLabel quedó sin variables sueltas', 'quedan llaves de plantilla')

  // Servicios: cinco resúmenes, el texto de los cinco paneles en el HTML, Ver servicio solo donde hay página
  check(countOf(html, /id="srv-\d-h"/) === 5, 'servicios: cinco resúmenes', `resúmenes: ${countOf(html, /id="srv-\d-h"/)}`)
  check(
    HOME_COPY_ES.services.items.every((it) => html.includes(it.body.replace(/&/g, '&amp;'))),
    'servicios: el texto de los cinco paneles está en el HTML aunque cuatro estén cerrados',
    'falta el cuerpo de algún panel',
  )
  check(countOf(html, /aria-expanded="true"/) === 1, 'servicios: solo el primer panel abierto', `abiertos: ${countOf(html, /aria-expanded="true"/)}`)
  check(/id="srv-0-h"[^>]*aria-expanded="true"|aria-expanded="true"[^>]*id="srv-0-h"/.test(html), 'servicios: el abierto es el primero', 'el primero no está abierto')
  check(countOf(html, /Ver servicio/g) === 3, 'servicios: Ver servicio solo en los tres con página', `apariciones: ${countOf(html, /Ver servicio/g)}`)
  check(countOf(html, /href="\/servicios\/[a-z-]+"/) === 3, 'servicios ES: tres hrefs /servicios/<slug>', `hrefs: ${countOf(html, /href="\/servicios\/[a-z-]+"/)}`)
  const htmlEn = render(fixture, 'en')
  check(countOf(htmlEn, /href="\/en\/services\/[a-z-]+"/) === 3 && !/href="\/servicios\//.test(htmlEn), 'servicios EN: tres hrefs /en/services/<slug>', 'los hrefs EN no llevan /en/services/')
  check(countOf(htmlEn, /View service/g) === 3, 'servicios EN: rótulo View service desde messages', `apariciones: ${countOf(htmlEn, /View service/g)}`)
  check(countOf(html, /aria-label="Temas"/g) === 5, 'servicios: lista de temas con aria-label desde messages (los cinco traen tags)', `listas Temas: ${countOf(html, /aria-label="Temas"/g)}`)
  check(/position:sticky/.test(renderRaw(fixture)) && /top:112px/.test(renderRaw(fixture)), 'servicios: columna izquierda sticky con top 112px', 'falta sticky o top 112px')
  check(/<section[^>]*id="servicios"[^>]*aria-labelledby="servicios-t"/.test(html) && /<h2[^>]*id="servicios-t"/.test(html), 'servicios: sección con h2 servicios-t', 'falta el h2 o el aria-labelledby')

  // Ids únicos y aria-controls resueltos en toda la home
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  check(dupes.length === 0, 'home: ningún id repetido', `repetidos: ${JSON.stringify(dupes)}`)
  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1])
  check(controls.length >= 5 && controls.every((c) => ids.includes(c)), 'home: cada aria-controls resuelve a un id', `sin resolver: ${JSON.stringify(controls.filter((c) => !ids.includes(c)))}`)

  // Encabezados en orden razonable: un h1, h2 de secciones, h3 de tarjetas y acordeón
  const levels = headingLevels(html)
  check(levels.filter((l) => l === 1).length === 1 && levels[0] === 1, 'home: un solo h1 y es el primer encabezado', JSON.stringify(levels))

  // Estados vacíos
  const emptyVitals = { ...fixture, vitals: mapHomeGlobal({ vitals: { title: 'T', items: [] } } as never, 'es', false).vitals }
  const emptyServices = { ...fixture, services: mapHomeGlobal({ services: { title: 'T', items: [] } } as never, 'es', false).services }
  check(emptyVitals.vitals === null && !/id="medicion"/.test(render(emptyVitals)) && !render(emptyVitals).includes('Medición antes'), 'vitals: sin items no deja encabezado', 'quedó la sección')
  check(emptyServices.services === null && !/id="servicios"/.test(render(emptyServices)) && !/servicios-t/.test(render(emptyServices)), 'servicios: sin items no deja encabezado', 'quedó la sección')
  const directVitals = renderToHtml(createElement(Vitals, { vitals: { title: 'T', lead: null, measurementNote: null, items: [] } }))
  const directServices = renderToHtml(createElement(Services, { services: { title: 'T', lead: null, ctaLabel: null, items: [] }, locale: 'es' }))
  check(!/<section/.test(directVitals) && !/<section/.test(directServices), 'vitals y servicios: el componente con items vacíos no pinta nada', 'pintó una sección vacía')
  const sparse = mapHomeGlobal(
    { vitals: { title: 'T', items: [{ name: 'LCP' }] }, services: { title: 'S', items: [{ title: 'X', icon: 'no-existe', servicePage: 'no-existe' }] } } as never,
    'es',
    false,
  )
  check(
    sparse.vitals?.items[0].goodPct === 0 && sparse.vitals?.items[0].markerPct === 0 && sparse.services?.items[0].icon === null && sparse.services?.items[0].servicePage === null,
    'mapper: números faltantes a 0, icono y página inválidos a null',
    JSON.stringify(sparse),
  )
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
