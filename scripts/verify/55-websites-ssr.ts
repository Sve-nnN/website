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
import { WebsiteDetailView } from '../../src/components/pages/websites/WebsiteDetailView'
import {
  pickNeighbors,
  pickSuggested,
  toWebsiteDetailProps,
  toWebsiteIndexProps,
  type WebsiteDetailDocLike,
  type WebsiteDetailProps,
  type WebsiteDocLike,
  type WebsiteIndexItem,
} from '../../src/lib/websites-data'
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

// ---------------------------------------------------------------------------
// Detalle (plan 55-08)
// ---------------------------------------------------------------------------

const DETAIL_DOC: WebsiteDetailDocLike = {
  ...DOCS[1]!,
  highlights: [{ text: 'Arquitectura de contenido por temas' }, { text: 'Mediciones reales de rendimiento' }],
  challenges: [{ text: 'Migrar sin perder posiciones' }],
  relatedCaseStudy: { title: 'Caso de prueba', slug: 'caso-de-prueba' },
}

/** Cuatro sitios del indice: dos Next.js, uno WordPress y uno sin tipo conocido. */
const INDEX_ITEMS = toWebsiteIndexProps(
  [
    { ...DOCS[1]!, slug: 'a-com', title: 'Sitio A' },
    { ...DOCS[1]!, slug: 'b-com', title: 'Sitio B' },
    { ...DOCS[2]!, slug: 'c-com', title: 'Sitio C' },
    { ...DOCS[2]!, slug: 'd-com', title: 'Sitio D', stack: [{ tag: 'Astro' }] },
    { ...DOCS[1]!, slug: 'e-com', title: 'Sitio E' },
  ],
  'es',
)

function renderDetail(
  site: WebsiteDetailProps,
  locale: 'es' | 'en',
  extra: Partial<{
    neighbors: ReturnType<typeof pickNeighbors>
    suggested: WebsiteIndexItem[]
  }> = {},
): string {
  return renderToHtml(
    createElement(WebsiteDetailView, {
      crumbs: CRUMBS,
      site,
      neighbors: extra.neighbors ?? null,
      suggested: extra.suggested ?? [],
    }),
    locale,
  )
}

const MEASURE_TITLE = /Rendimiento medido|Measured performance/
const RELATED_TITLE = /Caso de éxito relacionado|Related case study/

/** Contrato estructural del detalle. Devuelve los motivos de fallo. */
function detailFailures(rawHtml: string, site: WebsiteDetailProps): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const levels = headingLevels(html)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }
  if (!html.includes(site.title)) reasons.push('falta el titulo en el h1')
  const highlights = site.highlights.filter((h) => html.includes(h)).length
  if (highlights !== site.highlights.length) reasons.push(`faltan aspectos destacados: ${highlights} de ${site.highlights.length}`)
  const challenges = site.challenges.filter((h) => html.includes(h)).length
  if (challenges !== site.challenges.length) reasons.push(`faltan retos: ${challenges} de ${site.challenges.length}`)
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  // Ninguna afirmacion de dispositivo ni marco de telefono.
  if (/m[oó]vil|mobile|phone/i.test(text) || /PhoneFrame|data-phone/i.test(html)) reasons.push('el HTML afirma un dispositivo o trae un marco de telefono')
  // Enlaces externos: solo el de "Visitar el sitio", solo si hay dominio, con rel noopener y el host exacto.
  const external = [...html.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g)]
  if (site.domain === null && external.length > 0) reasons.push('hay un enlace externo sin dominio seguro')
  if (site.domain !== null) {
    if (external.length !== 1) reasons.push(`se esperaba un enlace externo y hay ${external.length}`)
    const tag = external[0]?.[0] ?? ''
    if (external[0] && external[0][1] !== `https://${site.domain}`) reasons.push(`el enlace externo no es el host exacto: ${external[0][1]}`)
    if (external[0] && !/rel="noopener"/.test(tag)) reasons.push('el enlace externo no lleva rel="noopener"')
    if (external[0] && !/target="_blank"/.test(tag)) reasons.push('el enlace externo no abre en otra pestana')
  }
  // Seccion de puntajes solo si algun puntaje trae valor.
  const hasScore = Object.values(site.scores).some((v) => typeof v === 'number')
  if (hasScore !== MEASURE_TITLE.test(text)) reasons.push(hasScore ? 'faltan los puntajes' : 'aparece la seccion de puntajes sin ningun puntaje')
  if (!hasScore && /de 100|out of 100|medidos el|measured on/.test(text)) reasons.push('queda texto de puntajes sin puntajes')
  // Caso relacionado solo si existe.
  const rel = site.relatedCase
  if ((rel !== null) !== RELATED_TITLE.test(text)) reasons.push(rel ? 'falta la seccion del caso relacionado' : 'aparece el caso relacionado sin dato')
  if (rel && countOf(html, new RegExp(`href="(?:/en)?${rel.href}"`)) !== 1) reasons.push('falta el enlace al caso relacionado')
  // Una sola captura de escritorio: una imagen en el marco.
  return reasons
}

function mainDetail(): void {
  const site = toWebsiteDetailProps(DETAIL_DOC, 'es')
  check(site !== null, 'detalle props: el documento produce props', 'devolvio null')
  if (!site) return
  check(site.highlights.length === 2 && site.challenges.length === 1, 'detalle props: destacados y retos', `${site.highlights.length}, ${site.challenges.length}`)
  check(site.relatedCase?.href === '/case-studies/caso-de-prueba', 'detalle props: caso relacionado como titulo y href', JSON.stringify(site.relatedCase))
  check(site.clientName === 'Apturio', 'detalle props: nombre del cliente', `${site.clientName}`)
  check(
    toWebsiteDetailProps({ ...DETAIL_DOC, relatedCaseStudy: 12 }, 'es')?.relatedCase === null,
    'detalle props: un caso relacionado sin poblar no produce enlace',
    'devolvio un enlace',
  )

  const neighbors = pickNeighbors(INDEX_ITEMS, 'a-com')
  const suggested = pickSuggested(INDEX_ITEMS, { slug: 'a-com', kind: 'nextjs' })

  for (const locale of ['es', 'en'] as const) {
    const html = renderDetail(site, locale, { neighbors, suggested })
    const reasons = detailFailures(html, site)
    check(reasons.length === 0, `detalle ${locale}: contrato completo`, reasons.join('; '))
    check(/href="https:\/\/apturio\.com"/.test(html), `detalle ${locale}: enlace externo con el host exacto`, 'falta el enlace')
    check(
      locale === 'es' ? /14 de julio de 2026/.test(textOf(html)) : /July 14, 2026/.test(textOf(html)),
      `detalle ${locale}: la nota usa la fecha de lighthouseCapturedAt en UTC`,
      'no aparece la fecha formateada',
    )
    // Una captura en el hero y una por tarjeta sugerida, ninguna extra.
    check(countOf(html, COUNT_IMGS) === 1 + suggested.length, `detalle ${locale}: una sola captura de escritorio en el marco`, `hay ${countOf(html, COUNT_IMGS)} imagenes`)
    check(countOf(html, /<nav[^>]*aria-label="(?:Navegar entre proyectos|Navigate between projects)"/) === 1, `detalle ${locale}: navegacion anterior y siguiente`, 'falta la navegacion')
  }

  // Sin dominio seguro: ni dominio ni enlace externo, aunque la URL del cliente sea hostil.
  for (const hostile of [null, 'javascript:alert(1)']) {
    const doc: WebsiteDetailDocLike = { ...DETAIL_DOC, slug: 'proyecto-interno', client: hostile === null ? null : { websiteUrl: hostile, name: 'X' } }
    const s = toWebsiteDetailProps(doc, 'es')!
    const html = renderDetail(s, 'es')
    check(s.domain === null, `sin dominio (${hostile ?? 'sin cliente'}): props sin dominio`, `dio ${s.domain}`)
    const reasons = detailFailures(html, s)
    check(reasons.length === 0 && !/Visitar el sitio/.test(textOf(html)), `sin dominio (${hostile ?? 'sin cliente'}): sin enlace Visitar`, reasons.join('; ') || 'aparece Visitar el sitio')
  }

  // Sin cliente y slug terminado en -com: dominio derivado del slug.
  const own = toWebsiteDetailProps({ ...DETAIL_DOC, slug: 'juan-tech-com', client: null }, 'es')!
  const ownHtml = renderDetail(own, 'es')
  check(own.domain === 'juan-tech.com' && detailFailures(ownHtml, own).length === 0, 'sin cliente y slug -com: dominio derivado y enlace seguro', detailFailures(ownHtml, own).join('; ') || `dominio ${own.domain}`)

  // Puntajes todos null: sin seccion ni nota.
  const noScores = toWebsiteDetailProps({ ...DETAIL_DOC, lighthouse: { performance: null, accessibility: null, bestPractices: null, seo: null } }, 'es')!
  const noScoresHtml = renderDetail(noScores, 'es')
  check(detailFailures(noScoresHtml, noScores).length === 0 && !MEASURE_TITLE.test(textOf(noScoresHtml)), 'puntajes null: no hay seccion de rendimiento', detailFailures(noScoresHtml, noScores).join('; ') || 'aparece la seccion')
  // Solo un puntaje: solo un anillo.
  const oneScore = toWebsiteDetailProps({ ...DETAIL_DOC, lighthouse: { performance: 91, accessibility: null, bestPractices: null, seo: null } }, 'es')!
  check(countOf(renderDetail(oneScore, 'es'), /<b[^>]*>91/) === 1 && /Rendimiento medido/.test(textOf(renderDetail(oneScore, 'es'))), 'un puntaje: un solo anillo', 'no hay un anillo')

  // Caso relacionado ausente.
  const noRel = toWebsiteDetailProps({ ...DETAIL_DOC, relatedCaseStudy: null }, 'es')!
  const noRelHtml = renderDetail(noRel, 'es')
  check(detailFailures(noRelHtml, noRel).length === 0 && !/case-studies/.test(noRelHtml), 'sin caso relacionado: no hay seccion ni enlace', detailFailures(noRelHtml, noRel).join('; ') || 'queda el enlace')

  // Sin destacados ni retos: no hay seccion ni encabezado huerfano.
  const bare = toWebsiteDetailProps({ ...DETAIL_DOC, highlights: [], challenges: [] }, 'es')!
  check(!/Qué construí/.test(textOf(renderDetail(bare, 'es'))), 'sin destacados ni retos: no hay seccion', 'queda el encabezado')

  // Sin captura: no hay marco ni imagen.
  const noImg = toWebsiteDetailProps({ ...DETAIL_DOC, screenshots: [] }, 'es')!
  check(countOf(renderDetail(noImg, 'es'), COUNT_IMGS) === 0, 'sin captura: no hay imagen', 'queda una imagen')

  // pickSuggested: tres del mismo tipo, completa con otros, sin el actual ni repetidos.
  const same3 = pickSuggested(INDEX_ITEMS, { slug: 'a-com', kind: 'nextjs' })
  check(
    same3.length === 3 && same3.map((i) => i.slug).join() === 'b-com,e-com,c-com' && !same3.some((i) => i.slug === 'a-com'),
    'pickSuggested: mismo tipo primero y completa con otros, sin el actual',
    same3.map((i) => i.slug).join(),
  )
  const wp = pickSuggested(INDEX_ITEMS, { slug: 'c-com', kind: 'wordpress' })
  check(wp.length === 3 && wp[0]?.kind !== 'wordpress', 'pickSuggested: sin otro del mismo tipo todos son de respaldo', wp.map((i) => i.slug).join())
  check(pickSuggested(INDEX_ITEMS.slice(0, 2), { slug: 'a-com', kind: 'nextjs' }).length === 1, 'pickSuggested: con dos sitios en total devuelve uno', 'no devolvio uno')
  check(pickSuggested([], { slug: 'x', kind: 'other' }).length === 0, 'pickSuggested: lista vacia', 'no esta vacia')

  // pickNeighbors: orden del indice, circular, nulo si hay menos de dos.
  check(
    pickNeighbors(INDEX_ITEMS, 'a-com')?.prev.slug === 'e-com' && pickNeighbors(INDEX_ITEMS, 'a-com')?.next.slug === 'b-com',
    'pickNeighbors: el primero enlaza circularmente al ultimo',
    JSON.stringify(pickNeighbors(INDEX_ITEMS, 'a-com')),
  )
  check(pickNeighbors(INDEX_ITEMS.slice(0, 1), 'a-com') === null && pickNeighbors(INDEX_ITEMS, 'no-existe') === null, 'pickNeighbors: sin navegacion con un sitio o slug ausente', 'devolvio vecinos')

  // Fixtures defectuosos: deben fallar.
  const good = renderDetail(site, 'es', { neighbors, suggested })
  check(detailFailures(good.replace('</section>', '<h1>otro</h1></section>'), site).some((r) => r.includes('h1')), 'defectuoso detalle: dos h1 se detecta', 'no se detecto')
  check(detailFailures(good.replace(/ rel="noopener"/, ''), site).some((r) => r.includes('rel="noopener"')), 'defectuoso detalle: enlace sin rel noopener se detecta', 'no se detecto')
  check(detailFailures(good.replace('href="https://apturio.com"', 'href="https://otro.example.test"'), site).some((r) => r.includes('host exacto')), 'defectuoso detalle: host distinto se detecta', 'no se detecto')
  check(detailFailures(good.replace('</section>', '<a href="https://otro.example.test">x</a></section>'), site).some((r) => r.includes('enlace externo')), 'defectuoso detalle: segundo enlace externo se detecta', 'no se detecto')
  check(detailFailures(good.replace('Rendimiento medido', 'Rendimiento medido en móvil'), site).some((r) => r.includes('dispositivo')), 'defectuoso detalle: la palabra movil se detecta', 'no se detecto')
  check(detailFailures(good.replace('<h2', '<h4').replace('</h2>', '</h4>'), site).some((r) => r.includes('salto')), 'defectuoso detalle: salto de encabezado se detecta', 'no se detecto')
  check(detailFailures(good.replace(/Caso de éxito relacionado/g, 'Otra cosa'), site).some((r) => r.includes('caso relacionado')), 'defectuoso detalle: caso relacionado faltante se detecta', 'no se detecto')
  check(detailFailures(noScoresHtml.replace('</section>', '<h2>Rendimiento medido</h2></section>'), noScores).some((r) => r.includes('sin ningun puntaje')), 'defectuoso detalle: seccion de puntajes sin puntajes se detecta', 'no se detecto')
  const noList = renderDetail({ ...site, highlights: [] }, 'es')
  check(detailFailures(noList, site).some((r) => r.includes('destacados')), 'defectuoso detalle: aspectos destacados ausentes se detecta', 'no se detecto')
}

function main(): void {
  mainDetail()
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
