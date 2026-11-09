/**
 * Autoprueba de render de la segunda mitad de la home (fase 54, plan 54-14).
 *
 * Alimenta los mapeadores puros de src/lib/home-data-b.ts con el copy sembrado
 * (HOME_COPY_ES) y datos de prueba, renderiza cada seccion con el arnes de
 * servidor y comprueba la estructura del HTML. No toca ninguna base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-home-b-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { Cases } from '../../src/components/home/Cases'
import { Process } from '../../src/components/home/Process'
import { assembleCases, mapFeaturedCases, mapHomeGlobalB } from '../../src/lib/home-data-b'
import { HOME_COPY_ES } from '../db/data/54-home-copy'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

/** HTML sin las etiquetas style de Emotion, que viajan en el mismo string. */
function strip(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, '')
}

// Las rayas se escriben por codigo: ningun literal de raya larga o corta en este archivo.
const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)

const globalB = mapHomeGlobalB(HOME_COPY_ES as never, 'es')

// ---------------------------------------------------------------------------
// Proceso (tarea 1)
// ---------------------------------------------------------------------------
{
  check(globalB.process?.steps.length === 4, 'mapper: proceso con cuatro pasos', `pasos: ${globalB.process?.steps.length}`)
  const proc = globalB.process
  if (proc) {
    const html = strip(renderToHtml(createElement(Process, { process: proc })))
    check(/<ol[\s>]/.test(html) && countOf(html, /<li[\s>]/) === 4, 'proceso: cuatro li dentro de una lista ordenada', `li: ${countOf(html, /<li[\s>]/)}`)
    check(countOf(html, /<h3[\s>]/) === 4, 'proceso: cuatro h3', `h3: ${countOf(html, /<h3[\s>]/)}`)
    check(/<h2[^>]*id="proceso-t"/.test(html) && textOf(html).includes(HOME_COPY_ES.process.title), 'proceso: h2 con el titulo del global', 'falta el h2 proceso-t')
    check(/Paso 1/.test(html) && /Paso 4/.test(html), 'proceso: rotulo Paso n desde messages', 'falta Paso 1 o Paso 4')
    check(HOME_COPY_ES.process.steps.every((s) => html.includes(s.title)), 'proceso: titulos de los cuatro pasos', 'falta el titulo de un paso')
    check(!/\{\{|\{n\}/.test(html), 'proceso: sin llaves de plantilla', 'quedan llaves')
    check(!/<main[\s>]/.test(html), 'proceso: sin main', 'abre un main')
  }
  const emptyProcess = renderToHtml(createElement(Process, { process: { title: 'T', steps: [] } }))
  check(!/<section/.test(emptyProcess) && !/<h2/.test(emptyProcess), 'proceso: con cero pasos no deja encabezado', 'pinto una seccion vacia')
  const noTitle = mapHomeGlobalB({ process: { steps: [{ title: 'x' }] } } as never, 'es')
  check(noTitle.process === null, 'mapper: proceso sin titulo se omite', 'devolvio una seccion sin titulo')
  const badIcon = mapHomeGlobalB({ process: { title: 'T', steps: [{ title: 'x', icon: 'no-existe' }] } } as never, 'es')
  check(badIcon.process?.steps[0]?.icon === null, 'mapper: icono invalido a null', JSON.stringify(badIcon.process))
}

// ---------------------------------------------------------------------------
// Casos (tarea 1)
// ---------------------------------------------------------------------------
const CASE_DOCS = [
  { id: 1, slug: 'caso-salud', title: 'Clinica de urologia', sector: `Salud ${EM} Urologia`, heroMetric: '+406% clics interanuales' },
  { id: 2, slug: 'caso-ecommerce', title: 'Tienda de moda', sector: `E-commerce${EN}Moda`, heroMetric: '+68%' },
  { id: 3, slug: 'caso-b2b', title: 'Software B2B', sector: 'SaaS', heroMetric: '0 → 56 clics' },
  { id: 4, slug: 'caso-extra', title: 'Cuarto caso', sector: 'Otro', heroMetric: '+10%' },
]
{
  const items = mapFeaturedCases(CASE_DOCS)
  check(items.length === 3, 'casos: como maximo tres', `casos: ${items.length}`)
  check(items[0]?.metric === '+406 %' && items[0]?.label === 'clics interanuales', 'casos: cifra separada de su etiqueta', JSON.stringify(items[0]))
  check(items[1]?.metric === '+68 %' && items[1]?.label === null, 'casos: sin etiqueta en el dato queda null', JSON.stringify(items[1]))
  check(items[2]?.metric === '0 → 56 clics' && items[2]?.label === null, 'casos: texto que no calza queda entero como cifra', JSON.stringify(items[2]))
  check(items.every((i) => !i.tag?.includes(EM) && !i.tag?.includes(EN)), 'casos: sector sin raya larga ni corta', JSON.stringify(items.map((i) => i.tag)))
  check(items[0]?.tag === 'Salud, urologia', 'casos: la raya entre sector y subsector pasa a coma', `tag: ${items[0]?.tag}`)

  const sparse = mapFeaturedCases([
    7,
    null,
    { id: 5, slug: '', title: 'Sin slug', heroMetric: '+1%' },
    { id: 6, slug: 'sin-titulo', title: '  ', heroMetric: '+1%' },
    { id: 8, slug: 'sin-cifra', title: 'Sin cifra' },
    { id: 9, slug: 'ok', title: 'Completo', heroMetric: '+5%' },
  ])
  check(sparse.length === 1 && sparse[0]?.href === '/case-studies/ok', 'casos: omite ids sin poblar y entradas sin slug, titulo o cifra', JSON.stringify(sparse))

  const cases = assembleCases(globalB.casesText, items)
  check(cases !== null && cases.items[1]?.label === HOME_COPY_ES.cases.metricSuffix, 'casos: la etiqueta ausente cae a metricSuffix', JSON.stringify(cases?.items[1]))
  if (cases) {
    const raw = renderToHtml(createElement(Cases, { cases }))
    const html = strip(raw)
    check(countOf(html, /<h3[\s>]/) === 3, 'casos: tres h3', `h3: ${countOf(html, /<h3[\s>]/)}`)
    const links = [...html.matchAll(/<h3[^>]*><a[^>]*href="([^"]+)"/g)].map((m) => m[1])
    check(
      JSON.stringify(links) === JSON.stringify(items.map((i) => i.href)),
      'casos: cada h3 envuelve un enlace con el href del caso',
      JSON.stringify(links),
    )
    // La cifra va en su propio parrafo de 72px (4.5rem), separada de la etiqueta.
    const metricClass = html.match(/<p class="([^"]+)">\+406 %<\/p>/)?.[1]?.split(' ').find((c) => c.startsWith('css-')) ?? ''
    check(
      metricClass !== '' && new RegExp(`\\.${metricClass}\\{[^}]*font-size:4\\.5rem`).test(raw),
      'casos: la cifra va sola en un parrafo de 72px',
      `clase ${metricClass || '(ninguna)'} sin font-size:4.5rem`,
    )
    check(/clics interanuales<\/p>/.test(html) && !/\+406 % clics/.test(textOf(html)), 'casos: la etiqueta va aparte de la cifra', 'la etiqueta quedo pegada a la cifra')
    check(textOf(html).includes('Salud, urologia') && !textOf(html).includes(EM) && !textOf(html).includes(EN), 'casos: sector sin raya en el HTML', 'aparece una raya')
    check(
      new RegExp(`<a[^>]*href="/case-studies"[^>]*>${HOME_COPY_ES.cases.ctaLabel}</a>`).test(html),
      'casos: boton de pie hacia /case-studies',
      'falta el boton Ver todos los casos',
    )
    check(textOf(html).includes(HOME_COPY_ES.cases.note), 'casos: nota del pie', 'falta la nota')
    check(!/<main[\s>]/.test(html) && !/\{\{/.test(html), 'casos: sin main ni llaves dobles', 'main o llaves')
    check(JSON.stringify(headingLevels(html)) === '[2,3,3,3]', 'casos: encabezados h2 y tres h3', JSON.stringify(headingLevels(html)))
  }
  check(assembleCases(globalB.casesText, []) === null, 'casos: con cero casos no hay seccion', 'devolvio una seccion')
  check(assembleCases(globalB.casesText, null) === null, 'casos: con lectura fallida (null) no hay seccion', 'devolvio una seccion')
  check(assembleCases(null, items) === null, 'casos: sin titulo del global no hay seccion', 'devolvio una seccion')
  const emptyCases = renderToHtml(createElement(Cases, { cases: { title: 'T', lead: null, note: null, ctaLabel: null, items: [] } }))
  check(!/<section/.test(emptyCases) && !/<h2/.test(emptyCases), 'casos: el componente con cero casos no deja encabezado', 'pinto una seccion vacia')
}

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nPASS 54-home-b-ssr')
