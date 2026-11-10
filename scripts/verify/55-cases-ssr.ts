/**
 * Arnes SSR de casos de exito (fase 55, plan 55-09): indice, detalle,
 * comparacion y lecciones.
 *
 * Renderiza las vistas con fixtures INVENTADOS por 54-ssr-harness y comprueba
 * estructura. No toca base ni red. Ningun texto sale del sandbox (D-02, Pitfall 8).
 *
 *   node_modules/.bin/tsx scripts/verify/55-cases-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { CaseStudiesIndexView } from '../../src/components/pages/cases/CaseStudiesIndexView'
import { toCaseIndexProps, type CaseDocLike, type CaseIndexItem } from '../../src/lib/case-study-data'
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

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Casos de éxito', href: '/case-studies' },
]

// ---------------------------------------------------------------------------
// Fixtures inventados
// ---------------------------------------------------------------------------

const metrics = (clicksBefore: string, clicksAfter: string) => [
  { label: 'Clics orgánicos anuales', before: clicksBefore, after: clicksAfter },
  { label: 'Posición media', before: '36.3', after: '19.2' },
]

const DOCS: CaseDocLike[] = [
  {
    slug: 'caso-alfa',
    title: 'Caso Alfa de prueba',
    heroMetric: '+406% clics interanuales',
    heroSubtitle: 'Subtitulo inventado del caso alfa',
    sector: `Salud ${EM_DASH} Clinicas`,
    period: 'Jul 2024 a Jun 2025',
    results: { periodBefore: 'Año previo', periodAfter: 'Año medido', metrics: metrics('47,108', '533K') },
  },
  {
    slug: 'caso-beta',
    title: 'Caso Beta de prueba',
    heroMetric: '0 → 56 clics',
    heroSubtitle: 'Subtitulo inventado del caso beta',
    sector: `Servicios ${EN_DASH} Talleres`,
    period: null,
    results: { periodBefore: 'Año previo', periodAfter: 'Año medido', metrics: metrics('0', '1.25M') },
  },
  {
    slug: 'caso-gamma',
    title: 'Caso Gamma de prueba',
    heroMetric: '+68%',
    heroSubtitle: null,
    sector: 'Comercio',
    period: 'Todo 2025',
    results: { periodBefore: 'Año previo', periodAfter: 'Año medido', metrics: metrics('1,200', '2,016') },
  },
  { slug: 'sin-titulo', title: '', heroMetric: '+1%' },
  { slug: '', title: 'Sin slug', heroMetric: '+1%' },
]

/** Contrato estructural del indice. Devuelve los motivos de fallo. */
function indexFailures(rawHtml: string, items: CaseIndexItem[]): string[] {
  const reasons: string[] = []
  // Las reglas de Emotion (`<style>`) traen llaves y urls: no son marcado visible.
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const levels = headingLevels(html)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }
  for (const item of items) {
    const re = new RegExp(`href="(?:/en)?/case-studies/${item.slug}"`, 'g')
    if (countOf(html, re) !== 1) reasons.push(`se esperaba un enlace a /case-studies/${item.slug} y hay ${countOf(html, re)}`)
    if (item.metric && !html.includes(item.metric)) reasons.push(`falta la cifra ${item.metric} de ${item.slug}`)
    if (item.sector && !html.includes(item.sector)) reasons.push(`falta el sector ${item.sector} de ${item.slug}`)
  }
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) reasons.push('el texto visible trae un guion largo o corto')
  return reasons
}

function renderIndex(items: CaseIndexItem[], locale: 'es' | 'en'): string {
  return renderToHtml(
    createElement(CaseStudiesIndexView, { crumbs: CRUMBS, title: 'Casos de éxito', lead: 'Lead de prueba', items }),
    locale,
  )
}

function mainIndex(): void {
  const items = toCaseIndexProps(DOCS, 'es')
  check(items.length === 3, 'indice props: sin titulo o sin slug no hay tarjeta', `hay ${items.length}`)
  check(items[0]?.metric === '+406 %' && items[0]?.metricLabel === 'clics interanuales', 'indice props: la cifra se separa de su etiqueta', `${items[0]?.metric} | ${items[0]?.metricLabel}`)
  check(items[1]?.metric === '0 → 56 clics' && items[1]?.metricLabel === null, 'indice props: una cifra que no calza llega entera', `${items[1]?.metric} | ${items[1]?.metricLabel}`)
  check(items[0]?.sector === 'Salud, clinicas' && items[1]?.sector === 'Servicios, talleres', 'indice props: el sector sale sin raya larga ni corta', `${items[0]?.sector} | ${items[1]?.sector}`)
  check(items[2]?.subtitle === null && items[1]?.period === null, 'indice props: subtitulo y periodo ausentes son null', 'no son null')

  for (const locale of ['es', 'en'] as const) {
    const html = renderIndex(items, locale)
    const reasons = indexFailures(html, items)
    check(reasons.length === 0, `indice ${locale}: contrato`, reasons.join('; '))
    const list = /<ul[^>]*aria-label="(?:Lista de casos de éxito|Case study list)"[^>]*>([\s\S]*?)<\/ul>/.exec(html)?.[1] ?? ''
    check(countOf(list, /<li[\s>]/) === 3, `indice ${locale}: una tarjeta por caso en una sola lista`, `hay ${countOf(list, /<li[\s>]/)} li en la lista`)
    check(locale === 'es' ? /Ver el caso completo/.test(textOf(html)) : /View the full case study/.test(textOf(html)), `indice ${locale}: etiqueta de lectura de messages`, 'falta la etiqueta')
  }

  // Estado vacio: texto de messages y un h1.
  const emptyHtml = renderIndex([], 'es')
  check(/Próximamente/.test(textOf(emptyHtml)) && headingLevels(emptyHtml).filter((l) => l === 1).length === 1, 'indice vacio: estado vacio y un h1', 'falta el estado vacio o el h1')

  // Fixtures defectuosos: deben fallar.
  const good = renderIndex(items, 'es')
  check(indexFailures(good.replace('</section>', '<h1>otro</h1></section>'), items).some((r) => r.includes('h1')), 'defectuoso indice: dos h1 se detecta', 'no se detecto')
  check(indexFailures(good.replace(/href="\/case-studies\/caso-beta"/g, 'href="#"'), items).some((r) => r.includes('caso-beta')), 'defectuoso indice: enlace faltante se detecta', 'no se detecto')
  check(indexFailures(good.replace('+406 %', '+406'), items).some((r) => r.includes('cifra')), 'defectuoso indice: cifra mal dividida se detecta', 'no se detecto')
  check(indexFailures(good.replace('Salud, clinicas', `Salud ${EM_DASH} clinicas`), items).some((r) => r.includes('sector') || r.includes('guion')), 'defectuoso indice: sector con guion largo se detecta', 'no se detecto')
  check(indexFailures(good.replace('Lead de prueba', 'designs/design-system-mui'), items).some((r) => r.includes('designs')), 'defectuoso indice: texto de designs se detecta', 'no se detecto')
}

function main(): void {
  mainIndex()
  if (failures > 0) process.exit(1)
  console.log('PASS 55-cases-ssr')
}

main()
