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

import { CaseDetailView } from '../../src/components/pages/cases/CaseDetailView'
import { CaseStudiesIndexView } from '../../src/components/pages/cases/CaseStudiesIndexView'
import {
  buildCaseStudyJsonLd,
  lexicalOrNull,
  parseMetricNumber,
  pickRelatedCases,
  toCaseDetailProps,
  toCaseIndexProps,
  type CaseDetailDocLike,
  type CaseDetailProps,
  type CaseDocLike,
  type CaseIndexItem,
} from '../../src/lib/case-study-data'
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

// ---------------------------------------------------------------------------
// Detalle (tarea 2)
// ---------------------------------------------------------------------------

const lexical = (value: string) => ({
  root: {
    type: 'root',
    direction: null,
    format: '',
    indent: 0,
    version: 1,
    children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: value }] }],
  },
})

const emptyLexical = {
  root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [] }] },
}

const DETAIL_DOC: CaseDetailDocLike = {
  slug: 'caso-alfa',
  title: 'Caso Alfa de prueba',
  heroMetric: '+406% clics interanuales',
  heroSubtitle: 'Subtitulo inventado del caso alfa',
  client: { name: 'Cliente inventado' },
  sector: `Salud ${EM_DASH} Clinicas`,
  period: 'Todo 2025',
  kpis: [
    { label: 'KPI uno inventado', value: '12K' },
    { label: 'KPI dos inventado', value: '3.4s' },
  ],
  clientContext: lexical('Texto de contexto inventado'),
  challenge: [{ text: 'Reto uno inventado' }, { text: 'Reto dos inventado' }],
  solution: [
    { title: 'Paso uno inventado', description: 'Descripcion uno inventada' },
    { title: 'Paso dos inventado', description: 'Descripcion dos inventada' },
  ],
  testimonialSection: [{ quote: 'Cita inventada del cliente', authorName: 'Persona Inventada', authorRole: 'Rol inventado' }],
  results: {
    periodBefore: 'Periodo previo inventado',
    periodAfter: 'Periodo medido inventado',
    metrics: [
      { label: 'Clics orgánicos anuales', before: '47,108', after: '533K' },
      { label: 'Posición media', before: '36.3', after: '19.2' },
      { label: 'Cobertura inventada', before: '-', after: '80%' },
    ],
  },
  conclusion: lexical('Conclusion inventada del caso'),
  author: {
    name: 'Autor Inventado',
    slug: 'autor-inventado',
    jobTitle: 'Cargo inventado',
    bio: 'Biografia inventada',
    avatar: { url: 'https://res.example.test/autor.png', width: 96, height: 96, alt: null },
  },
}

const INDEX_ITEMS = toCaseIndexProps(DOCS, 'es')

type DetailExtra = { related?: CaseIndexItem[] }

function renderDetail(c: CaseDetailProps, locale: 'es' | 'en', extra: DetailExtra = {}): string {
  return renderToHtml(
    createElement(CaseDetailView, {
      crumbs: CRUMBS,
      caseStudy: c,
      clientContent: c.clientContext ? createElement('p', null, 'Texto de contexto inventado') : null,
      conclusionContent: c.conclusion ? createElement('p', null, 'Conclusion inventada del caso') : null,
      related: extra.related ?? [],
    }),
    locale,
  )
}

const T = {
  stats: /Los números del caso|The numbers behind the case/,
  context: /El cliente y el reto|The client and the challenge/,
  solution: /La solución|The solution/,
  results: /<h2[^>]*>(?:Resultados|Results)<\/h2>/,
  conclusion: /Conclusiones|Conclusions/,
  more: /Más casos de éxito|More case studies/,
  author: /Sobre el autor|About the author/,
}

/**
 * Encabezados huerfanos: un encabezado sin texto antes del siguiente encabezado
 * de igual o menor nivel, o antes del final del documento. Un h2 seguido de un h3
 * no es huerfano (el h3 es su contenido).
 */
function orphanHeadings(html: string): string[] {
  const out: string[] = []
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g
  const heads = [...html.matchAll(re)]
  heads.forEach((m, i) => {
    const level = Number(m[1])
    const end = (m.index ?? 0) + m[0].length
    const next = heads[i + 1]
    const segment = html.slice(end, next ? next.index : html.length)
    const hasText = textOf(segment).length > 0
    const nextLevel = next ? Number(next[1]) : 0
    if (!hasText && (!next || nextLevel <= level)) out.push(textOf(m[2] ?? ''))
  })
  return out
}

/** Contrato estructural del detalle. Devuelve los motivos de fallo. */
function detailFailures(rawHtml: string, c: CaseDetailProps): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const text = textOf(html)
  const levels = headingLevels(html)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }
  if (!html.includes(c.title)) reasons.push('falta el titulo en el h1')
  const orphans = orphanHeadings(html)
  if (orphans.length > 0) reasons.push(`encabezado huerfano: ${orphans.join(', ')}`)

  // Cada seccion aparece solo si tiene datos.
  const expectSection = (re: RegExp, wanted: boolean, name: string) => {
    if ((re.test(text) || re.test(html)) !== wanted) reasons.push(wanted ? `falta la seccion ${name}` : `aparece la seccion ${name} sin datos`)
  }
  expectSection(T.stats, c.kpis.length > 0, 'de numeros')
  expectSection(T.context, c.clientContext !== null && c.challenge.length > 0, 'de contexto y reto')
  expectSection(T.solution, c.solution.length > 0, 'de solucion')
  expectSection(T.results, c.results.length > 0, 'de resultados')
  expectSection(T.conclusion, c.conclusion !== null, 'de conclusiones')
  expectSection(T.author, c.author !== null, 'del autor')
  if ((c.testimonial !== null) !== /<blockquote/.test(html)) reasons.push(c.testimonial ? 'falta el testimonio' : 'aparece un testimonio sin dato')
  if (c.testimonial && !html.includes(c.testimonial.authorName)) reasons.push('falta el autor del testimonio')

  // KPIs: etiqueta y valor verbatim, dt antes que dd.
  for (const k of c.kpis) {
    if (!html.includes(k.label) || !html.includes(k.value)) reasons.push(`falta el KPI ${k.label}`)
  }
  if (c.kpis.length > 0 && !/<dt[\s>][\s\S]*?<dd[\s>]/.test(html)) reasons.push('los KPIs no usan dt antes de dd')

  // Resultados: etiqueta verbatim, tabla con caption y scope.
  if (c.results.length > 0) {
    for (const r of c.results) if (!html.includes(r.label)) reasons.push(`falta la etiqueta ${r.label}`)
    const table = /<table[\s\S]*?<\/table>/.exec(html)?.[0] ?? ''
    if (!table) reasons.push('falta la tabla de resultados')
    if (table && !/<caption[\s>]/.test(table)) reasons.push('la tabla de resultados no tiene caption')
    if (table && !/scope="col"/.test(table)) reasons.push('la tabla de resultados no tiene scope col')
    if (table && !/scope="row"/.test(table)) reasons.push('la tabla de resultados no tiene scope row')
    if (!/aria-hidden="true"/.test(html)) reasons.push('las barras no estan aria-hidden')
  }

  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  if (/\bnull\b|\bundefined\b|NaN/.test(text)) reasons.push('aparece null, undefined o NaN en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) reasons.push('el texto visible trae un guion largo o corto')
  return reasons
}

function mainDetail(): void {
  const c = toCaseDetailProps(DETAIL_DOC, 'es')
  check(c !== null, 'detalle props: el documento produce props', 'devolvio null')
  if (!c) return
  check(c.sector === 'Salud, clinicas' && c.metric === '+406 %' && c.metricLabel === 'clics interanuales', 'detalle props: hero con cifra separada y sector sin guion largo', `${c.sector} | ${c.metric}`)
  check(c.kpis.length === 2 && c.challenge.length === 2 && c.solution.length === 2, 'detalle props: kpis, retos y soluciones', JSON.stringify([c.kpis.length, c.challenge.length, c.solution.length]))
  check(c.testimonial?.authorName === 'Persona Inventada' && c.testimonial.authorRole === 'Rol inventado', 'detalle props: testimonio embebido', JSON.stringify(c.testimonial))
  check(c.author?.href === '/authors/autor-inventado' && c.author.avatar?.url === 'https://res.example.test/autor.png', 'detalle props: autor con ruta y avatar', JSON.stringify(c.author))
  check(toCaseDetailProps({ ...DETAIL_DOC, slug: '' }, 'es') === null && toCaseDetailProps({ ...DETAIL_DOC, title: ' ' }, 'es') === null, 'detalle props: sin slug o sin titulo devuelve null', 'no devolvio null')

  // Resultados: cambio calculado, barras y filas sin base.
  const [clicks, position, coverage] = c.results
  check(Math.abs((clicks?.pct ?? 0) - (533000 - 47108) / 47108) < 1e-9, 'resultados: 47,108 a 533K interpreta separador de miles y sufijo K', `${clicks?.pct}`)
  check(clicks?.afterShare === 1 && Math.abs((clicks?.beforeShare ?? 0) - 47108 / 533000) < 1e-9, 'resultados: la barra mayor ocupa todo el ancho', `${clicks?.beforeShare}, ${clicks?.afterShare}`)
  check(Math.abs((position?.pct ?? 0) - (19.2 - 36.3) / 36.3) < 1e-9, 'resultados: una posicion que baja da cambio negativo', `${position?.pct}`)
  check(coverage?.pct === null && coverage.beforeShare === null && coverage.afterShare === null, 'resultados: un guion no es numero (NaN) y no produce porcentaje ni barras', JSON.stringify(coverage))
  check(
    toCaseDetailProps({ ...DETAIL_DOC, results: { metrics: [{ label: 'Cero', before: '0', after: '56' }] } }, 'es')?.results[0]?.pct === null,
    'resultados: before 0 no produce porcentaje',
    'produjo porcentaje',
  )
  check(
    Number.isNaN(parseMetricNumber('-')) && Number.isNaN(parseMetricNumber('')) && parseMetricNumber('1.25M') === 1250000 && parseMetricNumber('4.2s') === 4.2,
    'parseMetricNumber: guion y vacio dan NaN, 1.25M y 4.2s se interpretan',
    `${parseMetricNumber('-')}, ${parseMetricNumber('1.25M')}, ${parseMetricNumber('4.2s')}`,
  )

  // Un Lexical sin texto no cuenta como contenido.
  check(lexicalOrNull(emptyLexical) === null && lexicalOrNull(null) === null && lexicalOrNull(lexical('x')) !== null, 'lexicalOrNull: un parrafo vacio no abre seccion', 'devolvio contenido para un parrafo vacio')

  const related = pickRelatedCases(INDEX_ITEMS, 'caso-alfa')
  check(related.length === 2 && !related.some((r) => r.slug === 'caso-alfa'), 'pickRelatedCases: sin el actual y en el orden del indice', related.map((r) => r.slug).join())
  check(pickRelatedCases([], 'x').length === 0, 'pickRelatedCases: lista vacia', 'no esta vacia')

  for (const locale of ['es', 'en'] as const) {
    const html = renderDetail(c, locale, { related })
    const reasons = detailFailures(html, c)
    check(reasons.length === 0, `detalle ${locale}: contrato completo`, reasons.join('; '))
    check(/<aside[^>]*aria-labelledby="autor-t"/.test(html) && /href="(?:\/en)?\/authors\/autor-inventado"/.test(html), `detalle ${locale}: aside de autor con enlace al perfil`, 'falta el aside o el enlace')
    check(countOf(html, /href="(?:\/en)?\/case-studies\/caso-(?:beta|gamma)"/) === 2, `detalle ${locale}: mas casos con enlace por caso`, 'faltan enlaces de casos relacionados')
  }

  // Secciones vacias: ninguna deja encabezado huerfano.
  const bare = toCaseDetailProps(
    {
      ...DETAIL_DOC,
      kpis: [],
      clientContext: emptyLexical,
      challenge: [],
      solution: [],
      testimonialSection: [],
      results: { metrics: [] },
      conclusion: null,
      author: null,
    },
    'es',
  )!
  const bareHtml = renderDetail(bare, 'es')
  check(detailFailures(bareHtml, bare).length === 0, 'detalle sin secciones: solo hero, sin encabezados huerfanos', detailFailures(bareHtml, bare).join('; '))
  check(!/<aside/.test(bareHtml) && !/<table/.test(bareHtml) && !/<blockquote/.test(bareHtml) && !/<dl[\s>]/.test(bareHtml), 'detalle sin secciones: no queda aside, tabla, cita ni lista de KPIs', 'queda marcado de una seccion vacia')

  // Solo cliente o solo reto: el titulo de la seccion nombra lo que hay y no repite h3.
  const onlyChallenge = toCaseDetailProps({ ...DETAIL_DOC, clientContext: null }, 'es')!
  const onlyChallengeHtml = renderDetail(onlyChallenge, 'es')
  check(detailFailures(onlyChallengeHtml, onlyChallenge).length === 0 && /El reto/.test(textOf(onlyChallengeHtml)) && !/El cliente y el reto/.test(textOf(onlyChallengeHtml)), 'detalle solo con reto: la seccion se titula El reto', detailFailures(onlyChallengeHtml, onlyChallenge).join('; ') || 'titulo equivocado')
  const onlyClient = toCaseDetailProps({ ...DETAIL_DOC, challenge: [] }, 'es')!
  const onlyClientHtml = renderDetail(onlyClient, 'es')
  check(detailFailures(onlyClientHtml, onlyClient).length === 0 && /El cliente/.test(textOf(onlyClientHtml)) && !/El cliente y el reto/.test(textOf(onlyClientHtml)), 'detalle solo con cliente: la seccion se titula El cliente', detailFailures(onlyClientHtml, onlyClient).join('; ') || 'titulo equivocado')

  // Sin testimonio, sin avatar y sin metrica de cabeza.
  const noQuote = toCaseDetailProps({ ...DETAIL_DOC, testimonialSection: null }, 'es')!
  check(detailFailures(renderDetail(noQuote, 'es'), noQuote).length === 0, 'detalle sin testimonio: no hay cita', detailFailures(renderDetail(noQuote, 'es'), noQuote).join('; '))
  const noAvatar = toCaseDetailProps({ ...DETAIL_DOC, author: { ...(DETAIL_DOC.author as object), avatar: null } }, 'es')!
  check(detailFailures(renderDetail(noAvatar, 'es'), noAvatar).length === 0 && !/<img/.test(renderDetail(noAvatar, 'es')), 'detalle sin avatar: aside sin imagen', 'queda una imagen')
  const noMetric = toCaseDetailProps({ ...DETAIL_DOC, heroMetric: null }, 'es')!
  check(detailFailures(renderDetail(noMetric, 'es'), noMetric).length === 0, 'detalle sin cifra de cabeza: hero sin cifra', detailFailures(renderDetail(noMetric, 'es'), noMetric).join('; '))

  // JSON-LD extraido: mismo objeto que la ruta (T-55-33).
  const ld = buildCaseStudyJsonLd(
    {
      title: 'Caso Alfa de prueba',
      slug: 'caso-alfa',
      heroSubtitle: 'Subtitulo inventado',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
      author: { name: 'Autor Inventado', slug: 'otro-autor' },
      client: { name: 'Cliente inventado' },
      kpis: [{ label: 'KPI', value: '1' }],
    },
    'en',
    'caso-alfa',
  ) as Record<string, any>
  check(
    ld['@type'] === 'CreativeWork' &&
      ld.name === 'Caso Alfa de prueba' &&
      ld.url.endsWith('/en/case-studies/caso-alfa') &&
      ld.author?.name === 'Autor Inventado' &&
      ld.creator?.name === 'Cliente inventado' &&
      ld.dateCreated === '2026-01-01T00:00:00.000Z' &&
      ld.about?.name === 'Subtitulo inventado' &&
      ld.additionalProperty?.[0]?.name === 'KPI' &&
      !('datePublished' in ld) &&
      typeof ld.image === 'string' &&
      ld.image.startsWith('http'),
    'JSON-LD: CreativeWork con autor nombrado, cliente, kpis, imagen absoluta y sin datePublished',
    JSON.stringify(ld),
  )
  const ldOwn = buildCaseStudyJsonLd({ title: 'X', slug: 'x', author: { name: 'Juan', slug: 'juan-carlos-angulo' } }, 'es', 'x') as Record<string, any>
  check(typeof ldOwn.author?.['@id'] === 'string' && ldOwn.url.includes('/case-studies/x') && !ldOwn.url.includes('/en/'), 'JSON-LD: el autor del sitio referencia la entidad Person por @id', JSON.stringify(ldOwn.author))

  // Fixtures defectuosos: deben fallar.
  const good = renderDetail(c, 'es', { related })
  check(detailFailures(good.replace('</section>', '<h1>otro</h1></section>'), c).some((r) => r.includes('h1')), 'defectuoso detalle: dos h1 se detecta', 'no se detecto')
  check(detailFailures(good.replace(/<caption[\s\S]*?<\/caption>/, ''), c).some((r) => r.includes('caption')), 'defectuoso detalle: tabla sin caption se detecta', 'no se detecto')
  check(detailFailures(good.replace(/scope="row"/g, ''), c).some((r) => r.includes('scope row')), 'defectuoso detalle: tabla sin scope row se detecta', 'no se detecto')
  check(detailFailures(good.replace(/<blockquote[\s\S]*?<\/blockquote>/, ''), c).some((r) => r.includes('testimonio')), 'defectuoso detalle: testimonio ausente se detecta', 'no se detecto')
  const orphan = renderDetail({ ...c, kpis: [] }, 'es', { related }).replace('<section', '<section><h2>Los números del caso</h2></section><section')
  check(detailFailures(orphan, { ...c, kpis: [] }).some((r) => r.includes('huerfano') || r.includes('sin datos')), 'defectuoso detalle: encabezado sin contenido se detecta', 'no se detecto')
  check(orphanHeadings('<h1>a</h1><h2>Titulo</h2><h2>Otro</h2><p>x</p>').join() === 'Titulo', 'defectuoso detalle: orphanHeadings encuentra un h2 sin cuerpo', 'no lo encontro')
  check(detailFailures(good.replace('Texto de contexto inventado', `Texto ${EM_DASH} con guion`), c).some((r) => r.includes('guion')), 'defectuoso detalle: guion largo en el texto se detecta', 'no se detecto')
}

function main(): void {
  mainIndex()
  mainDetail()
  if (failures > 0) process.exit(1)
  console.log('PASS 55-cases-ssr')
}

main()
