/**
 * Arnes SSR del indice de Websites (fase 55, plan 55-01) y, luego, del detalle.
 *
 * Renderiza la vista con fixtures por 54-ssr-harness y comprueba estructura:
 * un solo h1, un enlace a /websites/<slug> por fixture, ningun texto del
 * sandbox y el dominio solo cuando el fixture lo trae. Incluye fixtures
 * defectuosos (dos h1, enlace faltante) que DEBEN fallar. No toca base ni red.
 *
 *   node_modules/.bin/tsx scripts/verify/55-websites-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import * as Frames from '../../src/components/mui/Frames'
import { WebsitesIndexView } from '../../src/components/pages/websites/WebsitesIndexView'
import { toWebsiteIndexProps, type WebsiteDocLike, type WebsiteIndexItem } from '../../src/lib/websites-data'
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

const media = (name: string) => ({ url: `https://res.example.test/${name}.png`, width: 1280, height: 5622, alt: null })

const DOCS: WebsiteDocLike[] = [
  {
    slug: 'juan-tech-com',
    title: 'Sitio de Juan',
    role: 'Diseno y desarrollo',
    industry: 'Servicios',
    year: 2025,
    stack: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }],
    screenshots: [{ image: media('juan') }],
    lighthouse: { performance: null, accessibility: null, bestPractices: null, seo: null },
    lighthouseCapturedAt: '2026-07-14T17:31:00.000Z',
    client: null,
  },
  {
    slug: 'apturio-com',
    title: 'Apturio',
    role: 'Producto web',
    industry: 'Software',
    year: 2025,
    stack: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }],
    screenshots: [{ image: media('apturio') }],
    lighthouse: { performance: 83, accessibility: 90, bestPractices: 73, seo: 100 },
    lighthouseCapturedAt: '2026-07-14T17:30:38.000Z',
    client: { websiteUrl: 'https://apturio.com', name: 'Apturio' },
  },
  {
    slug: 'estylopia-com',
    title: 'Estylopia',
    role: 'Sitio de contenido',
    industry: 'Moda',
    year: 2023,
    stack: [{ tag: 'WordPress' }, { tag: 'Elementor' }],
    screenshots: [{ image: media('estylopia') }],
    lighthouse: { performance: 67, accessibility: 88, bestPractices: 77, seo: 100 },
    lighthouseCapturedAt: '2026-07-14T17:29:27.000Z',
    client: { websiteUrl: 'https://estylopia.com/', name: 'Estylopia' },
  },
]

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Sitios web', href: '/websites' },
]

/** Contrato estructural que el indice debe cumplir. Devuelve los motivos de fallo. */
function contractFailures(rawHtml: string, items: WebsiteIndexItem[]): string[] {
  const reasons: string[] = []
  // Las reglas de Emotion (`<style>`) traen llaves y urls: no son marcado visible.
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const h1 = headingLevels(html).filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (const item of items) {
    const re = new RegExp(`href="(?:/en)?/websites/${item.slug}"`, 'g')
    if (countOf(html, re) < 1) reasons.push(`falta el enlace a /websites/${item.slug}`)
  }
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  // El dominio aparece solo cuando el fixture lo trae.
  const domains = items.map((i) => i.domain).filter((d): d is string => d !== null)
  for (const d of domains) if (!html.includes(d)) reasons.push(`falta el dominio ${d}`)
  const foreign = [...html.matchAll(/\b([a-z0-9-]+\.com)\b/g)].map((m) => m[1]).filter((d) => !domains.includes(d))
  const foreignClean = foreign.filter((d) => d !== 'juan-tech.com')
  if (domains.length === 0 && foreign.length > 0) reasons.push(`aparece un dominio sin fixture que lo traiga: ${foreign[0]}`)
  if (domains.length > 0 && foreignClean.length > 0) reasons.push(`aparece un dominio ajeno a los fixtures: ${foreignClean[0]}`)
  // El indice no tiene enlaces externos: cada enlace es interno.
  if (/<a\s[^>]*href="https?:\/\//.test(html)) reasons.push('el indice trae un enlace externo')
  // La nota de medicion no afirma el dispositivo.
  if (/m[o\u00f3]vil|mobile/i.test(text)) reasons.push('el texto afirma un dispositivo (movil o mobile)')
  return reasons
}

const COUNT_BUTTONS = /<button[^>]*aria-pressed=/g
const COUNT_IMGS = /<img\s/g
const COUNT_RINGS_LISTS = /aria-label="(?:Puntajes de PageSpeed Insights|PageSpeed Insights scores)"/g

function render(items: WebsiteIndexItem[], locale: 'es' | 'en'): string {
  return renderToHtml(createElement(WebsitesIndexView, { crumbs: CRUMBS, title: 'Sitios web', items }), locale)
}

function main(): void {
  const items = toWebsiteIndexProps(DOCS, 'es')
  check(items.length === 3, 'props: tres tarjetas', `hay ${items.length}`)
  check(items[0]?.domain === 'juan-tech.com', 'props: dominio del sitio propio derivado del slug', `dio ${items[0]?.domain}`)
  check(items[1]?.domain === 'apturio.com', 'props: dominio del cliente', `dio ${items[1]?.domain}`)
  check(items[2]?.domain === 'estylopia.com', 'props: dominio sin barra final', `dio ${items[2]?.domain}`)
  check(items[0]?.kind === 'nextjs' && items[2]?.kind === 'wordpress', 'props: tipo derivado de stack', `${items[0]?.kind}, ${items[2]?.kind}`)
  check(
    toWebsiteIndexProps([{ slug: 'x', title: 'X', client: { websiteUrl: 'javascript:alert(1)' } }], 'es')[0]?.domain === null,
    'props: una URL que no es http ni https no produce dominio',
    'devolvio un dominio',
  )
  check(
    toWebsiteIndexProps([{ slug: 'sin-cliente', title: 'X', client: null }], 'es')[0]?.domain === null,
    'props: sin cliente y sin sufijo -com no hay dominio',
    'devolvio un dominio',
  )

  for (const locale of ['es', 'en'] as const) {
    const html = render(items, locale)
    const reasons = contractFailures(html, items)
    check(reasons.length === 0, `indice ${locale}: contrato`, reasons.join('; '))
    check(countOf(html, COUNT_IMGS) === 3, `indice ${locale}: una captura por sitio, ninguna de movil`, `hay ${countOf(html, COUNT_IMGS)} imagenes`)
    check(countOf(html, COUNT_BUTTONS) === 3, `indice ${locale}: dos tipos dan dos filtros mas "todos"`, `hay ${countOf(html, COUNT_BUTTONS)} botones de filtro`)
    check(
      locale === 'es' ? /14 de julio de 2026/.test(textOf(html)) : /July 14, 2026/.test(textOf(html)),
      `indice ${locale}: la nota usa la fecha de lighthouseCapturedAt en UTC`,
      'no aparece la fecha formateada',
    )
    check(html.includes('loading="eager"') && countOf(html, /loading="eager"/) === 1, `indice ${locale}: solo el destacado carga sin diferir`, `hay ${countOf(html, /loading="eager"/)}`)
  }

  // Sitio sin cliente (y sin sufijo -com): sin dominio y sin enlace externo.
  const noClient = toWebsiteIndexProps(
    [{ ...DOCS[1]!, slug: 'proyecto-interno', title: 'Proyecto interno', client: null }],
    'es',
  )
  const noClientHtml = render(noClient, 'es')
  check(contractFailures(noClientHtml, noClient).length === 0, 'sitio sin cliente: sin dominio ni enlace externo', contractFailures(noClientHtml, noClient).join('; '))
  check(/Captura de Proyecto interno/.test(noClientHtml), 'sitio sin cliente: el alt usa el titulo', 'el alt no usa el titulo')

  // Puntajes null: sin anillos ni lista ni nota.
  const nullScores = toWebsiteIndexProps([DOCS[0]!], 'es')
  const nullHtml = render(nullScores, 'es')
  check(
    countOf(nullHtml, COUNT_RINGS_LISTS) === 0 && !/de 100/.test(textOf(nullHtml)) && !/medidos el/.test(textOf(nullHtml)),
    'puntajes null: no hay anillos, lista ni nota de medicion',
    'queda algo de la seccion de puntajes',
  )
  const someScores = toWebsiteIndexProps([DOCS[1]!], 'es')
  check(countOf(render(someScores, 'es'), COUNT_RINGS_LISTS) === 1, 'puntajes presentes: la lista de anillos aparece una vez', 'no aparece la lista')

  // Un solo tipo: el filtro no se ofrece. Todos los enlaces siguen en el HTML.
  const oneKind = toWebsiteIndexProps([DOCS[0]!, DOCS[1]!], 'es')
  check(countOf(render(oneKind, 'es'), COUNT_BUTTONS) === 0, 'un solo tipo: no hay filtro', 'aparece el filtro')

  // Una sola captura: no existe marco de movil.
  check(!('PhoneFrame' in Frames), 'una captura: Frames no exporta PhoneFrame', 'Frames exporta PhoneFrame')

  // Lista vacia: estado vacio con texto de messages.
  const emptyHtml = render([], 'es')
  check(/Próximamente/.test(textOf(emptyHtml)) && headingLevels(emptyHtml).filter((l) => l === 1).length === 1, 'lista vacia: estado vacio y un h1', 'falta el estado vacio o el h1')

  // Fixtures defectuosos: deben fallar.
  const good = render(items, 'es')
  const twoH1 = good.replace('</section>', '<h1>otro</h1></section>')
  check(contractFailures(twoH1, items).some((r) => r.includes('h1')), 'defectuoso: dos h1 se detecta', 'el contrato no detecto dos h1')
  const missing = good.replace(/href="\/websites\/apturio-com"/g, 'href="#"')
  check(
    contractFailures(missing, items).some((r) => r.includes('apturio-com')),
    'defectuoso: enlace faltante se detecta',
    'el contrato no detecto el enlace faltante',
  )
  const mobile = good.replace('Puntajes de PageSpeed Insights, medidos', 'Puntajes de PageSpeed Insights en móvil, medidos')
  check(contractFailures(mobile, items).some((r) => r.includes('dispositivo')), 'defectuoso: la palabra movil se detecta', 'el contrato no detecto movil')
  const external = good.replace('</section>', '<a href="https://otro.example.test">x</a></section>')
  check(contractFailures(external, items).some((r) => r.includes('externo')), 'defectuoso: enlace externo se detecta', 'el contrato no detecto el enlace externo')

  if (failures > 0) process.exit(1)
  console.log('PASS 55-websites-ssr')
}

main()
