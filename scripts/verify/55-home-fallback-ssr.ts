/**
 * Prueba del respaldo de solo lectura de la home (fase 55, plan 55-08, D-26).
 *
 * Tres bloques, sin base ni red:
 *   1. La decision pura (`selectCasesOrFallback`, `selectSitesOrFallback`):
 *      curado vacio usa el respaldo, curado con datos lo ignora, respaldo vacio
 *      devuelve vacio.
 *   2. El render de Cases y Sites con el respaldo: contenedor con id casos o
 *      sitios y el numero esperado de tarjetas.
 *   3. Auditoria estatica de src/lib/home-data-b.ts: toda lectura con
 *      overrideAccess false y select, tags de coleccion, filename junto a url
 *      en media y cero escrituras.
 * Incluye fixtures defectuosos (respaldo usado con datos curados, lectura sin
 * overrideAccess, escritura en el global) que DEBEN fallar.
 *
 *   node_modules/.bin/tsx scripts/verify/55-home-fallback-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as React from 'react'
import { createElement } from 'react'

import { Cases } from '../../src/components/home/Cases'
import { Sites } from '../../src/components/home/Sites'
import {
  assembleCases,
  assembleSites,
  mapFeaturedCases,
  mapHomeGlobalB,
  mapWebsite,
  selectCasesOrFallback,
  selectSitesOrFallback,
  type HomeCaseItem,
  type HomeSiteItem,
} from '../../src/lib/home-data-b'
import { HOME_COPY_ES } from '../db/data/54-home-copy'
import { countOf, headingLevels, renderToHtml } from './54-ssr-harness'

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

function strip(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, '')
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CASE_DOCS = [
  { id: 11, slug: 'respaldo-a', title: 'Caso de respaldo A', sector: 'Salud', heroMetric: '+83% clics interanuales' },
  { id: 12, slug: 'respaldo-b', title: 'Caso de respaldo B', sector: 'Legal', heroMetric: '+143% clics interanuales' },
  { id: 13, slug: 'respaldo-c', title: 'Caso de respaldo C', sector: 'Moda', heroMetric: '+309% clics interanuales' },
  { id: 14, slug: 'respaldo-d', title: 'Caso de respaldo D', sector: 'Otro', heroMetric: '+10%' },
]
const CURATED_CASE: HomeCaseItem = {
  id: 1,
  href: '/case-studies/curado',
  tag: 'Curado',
  metric: '+999 %',
  label: null,
  title: 'Caso curado por Juan',
}

const SHOT = (n: number) => ({ id: n, alt: `Pagina de inicio del sitio ${n}`, url: `https://res.example.test/s-${n}.webp`, width: 1280, height: 800 })
const SITE_DOCS = Array.from({ length: 6 }, (_, i) => ({
  id: 100 + i,
  slug: `respaldo-${i + 1}`,
  title: `Sitio de respaldo ${i + 1}`,
  industry: 'Servicios',
  stack: [{ tag: 'Next.js' }],
  screenshots: [{ image: SHOT(i + 1) }],
  lighthouse: { performance: 90, accessibility: 90, bestPractices: 90, seo: 100 },
  lighthouseCapturedAt: '2026-07-14T10:00:00.000Z',
  client: { id: i + 1, websiteUrl: `https://sitio${i + 1}.example.test/` },
}))
const CURATED_SITE = mapWebsite({ ...SITE_DOCS[0]!, id: 1, slug: 'curado', title: 'Sitio curado por Juan' }) as HomeSiteItem

const globalB = mapHomeGlobalB(HOME_COPY_ES as never, 'es')

// ---------------------------------------------------------------------------
// 1. Decision pura
// ---------------------------------------------------------------------------

/** Contrato de la seleccion: devuelve los motivos de fallo de una funcion candidata. */
function selectionFailures<T extends { title?: string; name?: string }>(
  select: (curated: ReadonlyArray<T>, fallback: ReadonlyArray<T>) => T[],
  curatedItem: T,
  fallbackItems: T[],
): string[] {
  const reasons: string[] = []
  const emptyCurated = select([], fallbackItems)
  if (emptyCurated.length !== fallbackItems.length) reasons.push('con curado vacio no usa el respaldo')
  const withCurated = select([curatedItem], fallbackItems)
  if (withCurated.length !== 1 || withCurated[0] !== curatedItem) reasons.push('con curado usa el respaldo en vez del curado')
  if (select([], []).length !== 0) reasons.push('con respaldo vacio no devuelve vacio')
  return reasons
}

const fallbackCases = mapFeaturedCases(CASE_DOCS)
const fallbackSites = SITE_DOCS.map((d) => mapWebsite(d)).filter((x): x is HomeSiteItem => x !== null).slice(0, 5)

{
  check(fallbackCases.length === 3, 'casos: el respaldo se limita a tres tarjetas', `hay ${fallbackCases.length}`)
  check(fallbackSites.length === 5, 'sitios: el respaldo se limita a cinco tarjetas', `hay ${fallbackSites.length}`)

  const casesReasons = selectionFailures(selectCasesOrFallback, CURATED_CASE, fallbackCases)
  check(casesReasons.length === 0, 'casos: seleccion curado o respaldo', casesReasons.join('; '))
  const sitesReasons = selectionFailures(selectSitesOrFallback, CURATED_SITE, fallbackSites)
  check(sitesReasons.length === 0, 'sitios: seleccion curado o respaldo', sitesReasons.join('; '))

  // Defectuoso: un selector que siempre usa el respaldo DEBE fallar el contrato.
  const alwaysFallback = (_curated: ReadonlyArray<HomeCaseItem>, fallback: ReadonlyArray<HomeCaseItem>) => [...fallback]
  check(
    selectionFailures(alwaysFallback, CURATED_CASE, fallbackCases).some((r) => r.includes('en vez del curado')),
    'defectuoso: respaldo usado cuando hay curado se detecta',
    'el contrato no lo detecto',
  )
  const neverFallback = (curated: ReadonlyArray<HomeCaseItem>, _fallback: ReadonlyArray<HomeCaseItem>) => [...curated]
  check(
    selectionFailures(neverFallback, CURATED_CASE, fallbackCases).some((r) => r.includes('no usa el respaldo')),
    'defectuoso: respaldo ignorado cuando no hay curado se detecta',
    'el contrato no lo detecto',
  )
}

// ---------------------------------------------------------------------------
// 2. Render con el respaldo
// ---------------------------------------------------------------------------

{
  const items = selectCasesOrFallback([], fallbackCases)
  const cases = assembleCases(globalB.casesText, items)
  check(cases !== null, 'casos: el respaldo ensambla la seccion', 'devolvio null')
  if (cases) {
    const html = strip(renderToHtml(createElement(Cases, { cases })))
    check(/<section[^>]*id="casos"/.test(html), 'casos: contenedor con id casos', 'falta id="casos"')
    check(countOf(html, /<h3[\s>]/) === 3, 'casos: tres tarjetas', `h3: ${countOf(html, /<h3[\s>]/)}`)
    check(
      ['respaldo-a', 'respaldo-b', 'respaldo-c'].every((s) => html.includes(`href="/case-studies/${s}"`)) && !html.includes('respaldo-d'),
      'casos: enlaces a los tres mas recientes y a ningun otro',
      'faltan enlaces o sobra el cuarto',
    )
    check(JSON.stringify(headingLevels(html)) === '[2,3,3,3]', 'casos: encabezados h2 y tres h3', JSON.stringify(headingLevels(html)))
  }
  // Con curado, la seccion muestra lo curado y no el respaldo.
  const curated = assembleCases(globalB.casesText, selectCasesOrFallback([CURATED_CASE], fallbackCases))
  const curatedHtml = curated ? strip(renderToHtml(createElement(Cases, { cases: curated }))) : ''
  check(
    countOf(curatedHtml, /<h3[\s>]/) === 1 && curatedHtml.includes('Caso curado por Juan') && !curatedHtml.includes('respaldo-a'),
    'casos: con datos curados el respaldo no aparece',
    'aparece el respaldo junto al curado',
  )
  // Sin nada, no hay seccion.
  check(assembleCases(globalB.casesText, selectCasesOrFallback([], [])) === null, 'casos: sin curado ni respaldo no hay seccion', 'devolvio una seccion')
}

{
  const items = selectSitesOrFallback([], fallbackSites)
  const sites = assembleSites(globalB.sitesText, items)
  check(sites !== null, 'sitios: el respaldo ensambla la seccion', 'devolvio null')
  if (sites) {
    const html = strip(renderToHtml(createElement(Sites, { sites })))
    check(/<section[^>]*id="sitios"/.test(html), 'sitios: contenedor con id sitios', 'falta id="sitios"')
    const hrefs = new Set([...html.matchAll(/href="(\/websites\/respaldo-\d)"/g)].map((m) => m[1]))
    check(hrefs.size === 5, 'sitios: cinco tarjetas con su enlace', `hay ${hrefs.size}`)
    check(countOf(html, /<img\s/g) >= 5, 'sitios: cada tarjeta trae su captura', `hay ${countOf(html, /<img\s/g)} imagenes`)
    check(!html.includes('respaldo-6'), 'sitios: el sexto no entra', 'aparece el sexto')
  }
  const curated = assembleSites(globalB.sitesText, selectSitesOrFallback([CURATED_SITE], fallbackSites))
  const curatedHtml = curated ? strip(renderToHtml(createElement(Sites, { sites: curated }))) : ''
  check(
    curatedHtml.includes('Sitio curado por Juan') && !curatedHtml.includes('respaldo-1'),
    'sitios: con datos curados el respaldo no aparece',
    'aparece el respaldo junto al curado',
  )
  check(assembleSites(globalB.sitesText, selectSitesOrFallback([], [])) === null, 'sitios: sin curado ni respaldo no hay seccion', 'devolvio una seccion')
}

// ---------------------------------------------------------------------------
// 3. Auditoria estatica de home-data-b.ts
// ---------------------------------------------------------------------------

/** Quita comentarios para que una palabra en un comentario no cuente como codigo. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
}

/** Motivos por los que el codigo de lectura incumple el respaldo de solo lectura. */
function sourceFailures(rawSource: string): string[] {
  const reasons: string[] = []
  const source = stripComments(rawSource)
  if (/updateGlobal|payload\.(create|update|delete)\b/.test(source)) reasons.push('hay una llamada de escritura (updateGlobal, create, update o delete)')
  const finds = source.match(/payload\.find\(\{[\s\S]*?\n\s{6,8}\}\)/g) ?? []
  if (finds.length < 3) reasons.push(`se esperaban al menos tres lecturas find y hay ${finds.length}`)
  for (const f of finds) {
    if (!/overrideAccess: false/.test(f)) reasons.push('una lectura find no lleva overrideAccess: false')
    if (!/select:/.test(f)) reasons.push('una lectura find no lleva select')
  }
  const latest = finds.filter((f) => /sort: '-createdAt'/.test(f))
  if (latest.length !== 2) reasons.push(`se esperaban dos lecturas de respaldo ordenadas por -createdAt y hay ${latest.length}`)
  if (!/CACHE_TAGS\.caseStudies\(\)/.test(source)) reasons.push('falta CACHE_TAGS.caseStudies() en la cache del respaldo de casos')
  if (!/CACHE_TAGS\.websites\(\)/.test(source)) reasons.push('falta CACHE_TAGS.websites() en la cache del respaldo de sitios')
  if (!/media:\s*\{[^}]*url: true[^}]*filename: true/.test(source)) reasons.push('el populate de media no pide filename junto a url')
  // El try y catch queda fuera de unstable_cache: getHomeCases y getHomeSites capturan.
  for (const fn of ['getHomeCases', 'getHomeSites']) {
    const body = source.match(new RegExp(`export async function ${fn}\\([\\s\\S]*?\\n\\}`))?.[0] ?? ''
    if (!/catch \(err\)/.test(body)) reasons.push(`${fn} no captura el error fuera de la cache`)
    if (/unstable_cache/.test(body)) reasons.push(`${fn} abre unstable_cache dentro del try (el fallo se fijaria)`)
  }
  return reasons
}

{
  const real = fs.readFileSync(path.join(root, 'src/lib/home-data-b.ts'), 'utf8')
  const reasons = sourceFailures(real)
  check(reasons.length === 0, 'fuente: respaldo de solo lectura con acceso, select, tags y filename', reasons.join('; '))

  check(
    sourceFailures(real.replace(/overrideAccess: false,\n(\s+select: \{ title: true, slug: true, sector)/, '$1')).some((r) => r.includes('overrideAccess')),
    'defectuoso: lectura sin overrideAccess se detecta',
    'la auditoria no lo detecto',
  )
  check(
    sourceFailures(`${real}\nawait payload.updateGlobal({ slug: 'featured-content', data: {} })\n`).some((r) => r.includes('escritura')),
    'defectuoso: escritura en el global se detecta',
    'la auditoria no lo detecto',
  )
  check(
    sourceFailures(real.replace('media: { url: true, filename: true,', 'media: { url: true,')).some((r) => r.includes('filename')),
    'defectuoso: populate de media sin filename se detecta',
    'la auditoria no lo detecto',
  )
  check(
    sourceFailures(real.replace(', CACHE_TAGS.websites()]', ']')).some((r) => r.includes('CACHE_TAGS.websites()')),
    'defectuoso: cache de sitios sin el tag de la coleccion se detecta',
    'la auditoria no lo detecto',
  )

  // Desborde a 320 px (hallado en el preview al activar el respaldo de la home en
  // 55-10): una tarjeta de caso con un sector largo en el Chip (nowrap) sacaba el
  // documento a 443 px. La tarjeta debe poder encogerse y el rotulo envolver.
  const card = fs.readFileSync(path.join(root, 'src/components/mui/CaseMetricCard.tsx'), 'utf8')
  const cardFailures = (src: string): string[] => {
    const out: string[] = []
    if (!/gridTemplateColumns: 'minmax\(0,1fr\)'/.test(src)) out.push('la tarjeta no fija su columna a minmax(0,1fr)')
    if (!/minWidth: 0/.test(src)) out.push('la tarjeta no declara minWidth 0')
    if (!/'& \.MuiChip-label': \{ whiteSpace: 'normal'/.test(src)) out.push('el rotulo del sector no envuelve')
    return out
  }
  check(cardFailures(card).length === 0, 'fuente: CaseMetricCard se encoge y el sector envuelve (sin desborde a 320 px)', cardFailures(card).join('; '))
  check(cardFailures(card.replace("minWidth: 0,", '')).some((r) => r.includes('minWidth')), 'defectuoso: tarjeta sin minWidth 0 se detecta', 'la auditoria no lo detecto')
  check(cardFailures(card.replace("whiteSpace: 'normal'", "whiteSpace: 'nowrap'")).some((r) => r.includes('envuelve')), 'defectuoso: sector que no envuelve se detecta', 'la auditoria no lo detecto')
}

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nPASS 55-home-fallback-ssr')
