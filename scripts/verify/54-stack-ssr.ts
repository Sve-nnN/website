/**
 * Autoprueba de render de Stack (fase 54, plan 54-12).
 *
 * Descarga el doc real de `stack` de la API publica anonima (depth 2, locale
 * es), lo pasa por `buildStackViewData`, renderiza StackView con el arnes de
 * servidor y comprueba la estructura del HTML. Solo lee: no escribe en ninguna
 * base. Los casos de borde (logo, sin referencia, sin contra, una sola
 * herramienta) salen de variantes del mismo doc.
 *
 *   node_modules/.bin/tsx scripts/verify/54-stack-ssr.ts
 *
 * Variable opcional: STACK_API_BASE (por defecto https://juan-tech.com).
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { StackView } from '../../src/components/pages/StackView'
import { buildStackViewData, type StackViewData } from '../../src/lib/stack-data'
import type { ToolStackBlock } from '../../src/payload-types'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'
import { checkStackPage } from './54-stack-affiliate.mjs'

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

const API_BASE = (process.env.STACK_API_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')

async function fetchStackBlock(): Promise<{ title: string; block: ToolStackBlock }> {
  const url = `${API_BASE}/api/pages?where[slug][equals]=stack&depth=2&locale=es&limit=1`
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`${url} respondio ${res.status}`)
  const json = (await res.json()) as { docs?: Array<{ title?: string; content?: { layout?: ToolStackBlock[] } }> }
  const doc = json.docs?.[0]
  const block = doc?.content?.layout?.find((b) => b.blockType === 'toolStack')
  if (!doc || !block) throw new Error('el doc stack no trae bloque toolStack')
  return { title: doc.title ?? 'Mi stack', block }
}

function render(title: string, data: StackViewData | null, locale: 'es' | 'en' = 'es'): string {
  return renderToHtml(createElement(StackView, { title, data }), locale)
}

/** HTML sin las etiquetas style de Emotion. */
function markup(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, '')
}

/** Etiquetas `a` cuyo href cumple `test`. */
function anchors(html: string, test: (href: string) => boolean): string[] {
  return (markup(html).match(/<a\b[^>]*>/g) ?? []).filter((tag) => {
    const href = tag.match(/\shref="([^"]*)"/)?.[1] ?? ''
    return test(href)
  })
}

/** Reglas CSS (con sus @media) de una clase de Emotion, juntas en un string. */
function cssOf(html: string, className: string): string {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
  const rules = [...styles.matchAll(new RegExp(`(@media \\([^)]*\\)\\{)?\\.${className}\\{[^}]*\\}`, 'g'))]
  return rules.map((m) => m[0]).join('')
}

/** Apertura de la tarjeta de una herramienta o de un item del equipo (un li con clase de Card). */
const CARD_OPEN = '<li class="MuiPaper-root MuiPaper-outlined MuiPaper-rounded MuiCard-root'

/** HTML del nav de categorias (el otro nav de la pagina es el de las migas). */
function categoriesNav(html: string): string {
  return html.match(/<nav[^>]*aria-label="Categorías del stack"[\s\S]*?<\/nav>/)?.[0] ?? ''
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function main(): Promise<void> {
  let loaded: { title: string; block: ToolStackBlock }
  try {
    loaded = await fetchStackBlock()
  } catch (err) {
    console.log(`FAIL descarga del doc stack: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
  const { title, block } = loaded
  const data = buildStackViewData(block, 'es')

  const toolCount = data.categories.reduce((n, c) => n + c.tools.length, 0)
  const activeCount = data.categories.reduce((n, c) => n + c.tools.filter((t) => t.cta.kind === 'active').length, 0)
  const logoCount = data.categories.reduce((n, c) => n + c.tools.filter((t) => t.logoUrl).length, 0)

  check(data.categories.length > 0 && toolCount > 0, 'mapeo: el doc real trae categorias con herramientas', `categorias = ${data.categories.length}`)
  check(data.categories.every((c) => c.anchor !== '') && new Set(data.categories.map((c) => c.anchor)).size === data.categories.length, 'mapeo: anclas unicas y no vacias', JSON.stringify(data.categories.map((c) => c.anchor)))
  // STACK-02 (fase 48): cada narrativa de herramienta trae al menos 100 palabras. Cierra el hueco de deferred-items.md (54-14).
  const shortNarratives = data.categories.flatMap((c) =>
    c.tools
      .map((t) => ({ name: t.name, words: t.narrative.trim().split(/\s+/).filter(Boolean).length }))
      .filter((t) => t.words < 100),
  )
  check(shortNarratives.length === 0, 'mapeo: cada narrativa de herramienta trae al menos 100 palabras (STACK-02)', JSON.stringify(shortNarratives))
  check(data.gear.length > 0 && data.gear.every((g) => /^https:\/\//.test(g.href)), 'mapeo: el equipo trae enlaces absolutos https', 'falta equipo o un href no es https')

  // ---------------------------------------------------------------- doc real
  const raw = render(title, data)
  const html = markup(raw)
  const text = textOf(html)
  const levels = headingLevels(html)

  check(levels.filter((l) => l === 1).length === 1, 'real: un solo h1', `niveles = ${JSON.stringify(levels)}`)
  check(levels.every((l, i) => i === 0 || l - levels[i - 1] <= 1), 'real: encabezados sin saltos de nivel', `niveles = ${JSON.stringify(levels)}`)
  check(!/<main[\s>]/.test(html) && !/<\/main>/.test(html), 'real: ninguna apertura de main', 'la vista declara main')

  const noteAt = html.search(/role="note"/)
  const firstGoAt = html.search(/href="\/go\//)
  check(noteAt !== -1 && firstGoAt !== -1 && noteAt < firstGoAt, 'real: el aviso con role note aparece antes del primer enlace /go/', `note = ${noteAt}, primer /go = ${firstGoAt}`)
  check(!/role="alert"/.test(html), 'real: el aviso no usa role alert', 'hay un role alert')
  check(text.includes('Algunos enlaces de esta página son de afiliado') && text.includes('Afiliado de Amazon'), 'real: el aviso trae los dos textos de affiliateDisclosure', 'falta el texto del aviso')

  const goLinks = anchors(html, (h) => h.startsWith('/go/'))
  check(goLinks.length === activeCount && goLinks.length > 0, 'real: un enlace /go/ por herramienta con afiliado activo', `enlaces = ${goLinks.length}, activas = ${activeCount}`)
  check(
    goLinks.every((a) => /\starget="_blank"/.test(a) && /\srel="[^"]*\bsponsored\b[^"]*"/.test(a) && /\srel="[^"]*\bnoopener\b[^"]*"/.test(a)),
    'real: cada /go/ lleva target _blank y rel con sponsored y noopener',
    goLinks.find((a) => !/\srel="[^"]*\bsponsored\b/.test(a)) ?? 'falta target o noopener',
  )
  check(goLinks.every((a) => /\srel="sponsored nofollow noopener"/.test(a)), 'real: el rel es exactamente el de AFFILIATE_REL', 'rel distinto del valor de produccion')
  check(text.includes('se abre en otra pestaña, enlace de afiliado'), 'real: sufijo accesible de otra pestana y afiliado', 'falta el sufijo')

  const amazon = anchors(html, (h) => /^https?:\/\/[^/]*amazon\./i.test(h))
  check(amazon.length === data.gear.length && amazon.every((a) => /\srel="[^"]*\bsponsored\b/.test(a) && /\starget="_blank"/.test(a)), 'real: cada enlace a Amazon del equipo lleva sponsored y target _blank', `amazon = ${amazon.length}, equipo = ${data.gear.length}`)

  check(categoriesNav(html) !== '', 'real: el nav de categorias tiene aria-label', 'falta el nav con aria-label')
  const navLinks = (categoriesNav(html).match(/<a\b[^>]*href="#[^"]+"/g) ?? []).map((a) => a.match(/href="#([^"]+)"/)?.[1] ?? '')
  check(navLinks.length === data.categories.length + 1, 'real: el nav lista las categorias y Mi equipo personal', `enlaces = ${navLinks.length}`)
  check(navLinks.every((id) => new RegExp(`\\sid="${id}"`).test(html)), 'real: cada enlace del nav apunta a un id existente', `ids ausentes: ${navLinks.filter((id) => !new RegExp(`\\sid="${id}"`).test(html)).join(', ')}`)
  // El contrato HTTP de 54-stack-affiliate.mjs contra el render real de la vista (envuelto en un main minimo).
  for (const [label, locale] of [['es', 'es'], ['en', 'en']] as const) {
    const viewHtml = render(title, buildStackViewData(block, locale), locale)
    const failuresHttp = checkStackPage({ status: 200, html: `<html><body><main id="main-content">${viewHtml}</main></body></html>` })
    check(failuresHttp.length === 0, `real: ${label}: el contrato de 54-stack-affiliate.mjs pasa sobre el render de la vista`, failuresHttp.join('; '))
  }

  check(/scroll-margin-top:96px/.test(raw), 'real: las secciones ancladas llevan scroll-margin-top de 96px', 'falta scroll-margin-top')

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  check(new Set(ids).size === ids.length, 'real: ningun id repetido', `repetidos = ${ids.filter((v, i) => ids.indexOf(v) !== i).join(', ')}`)

  // Una tarjeta es un li con clase de Card; el tile de logo, si existe, va antes del h3.
  const cards = html.split(CARD_OPEN).slice(1)
  const toolCards = cards.filter((c) => c.includes('<h3'))
  check(toolCards.length === toolCount, 'real: una tarjeta por herramienta', `tarjetas = ${toolCards.length}, herramientas = ${toolCount}`)
  const withoutLogo = toolCards.filter((c) => !/<img/.test(c.slice(0, c.indexOf('<h3'))))
  check(withoutLogo.length === toolCount - logoCount, 'real: solo las herramientas con logo llevan imagen antes del nombre', `sin imagen = ${withoutLogo.length}, esperadas = ${toolCount - logoCount}`)
  check(
    withoutLogo.every((c) => {
      const before = c.slice(0, c.indexOf('<h3'))
      return textOf(before.replace(/^[^>]*>/, '')) === '' && !/<svg/.test(before)
    }),
    'real: sin logo no hay tile, letra ni icono inventados',
    'hay texto o icono antes del h3 de una herramienta sin logo',
  )
  check(countOf(html, /<img[^>]*\salt=""/) === logoCount, 'real: toda imagen de logo lleva alt vacio', `imagenes alt vacio = ${countOf(html, /<img[^>]*\salt=""/)}, logos = ${logoCount}`)

  // Una categoria de una herramienta usa una columna; las demas, dos desde md.
  for (const category of data.categories) {
    const tag = html.match(new RegExp(`<ul[^>]*aria-label="Herramientas de ${category.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`))?.[0]
    const cls = tag?.match(/css-[a-z0-9]+/)?.[0]
    const css = cls ? cssOf(raw, cls) : ''
    const single = category.tools.length === 1
    check(
      Boolean(tag) && css !== '' && (single ? !/repeat\(2/.test(css) : /@media \(min-width:900px\)\{\.[^}]*repeat\(2/.test(css)),
      `real: categoria "${category.heading}" con ${category.tools.length} herramienta(s) usa ${single ? 'una columna' : 'dos columnas desde md'}`,
      css === '' ? 'no se hallo la lista o su CSS' : css.slice(-160),
    )
  }

  // Textos fijos de cada tarjeta.
  check(countOf(html, /<h4[\s>]/) >= toolCount, 'real: cada herramienta lleva sus rotulos Lo bueno y Lo no tan bueno en h4', `h4 = ${countOf(html, /<h4[\s>]/)}`)
  check(data.categories.flatMap((c) => c.tools).filter((t) => !t.con).length === 0 || text.includes('Sin quejas reales hasta ahora'), 'real: un contra vacio usa rowConEmpty', 'falta el texto de contra vacio')

  // ---------------------------------------------------------------- variantes
  const variant = clone(block)
  const firstTools = variant.categoryGroups?.[0]?.tools ?? []
  firstTools[0].logo = { id: 99999, alt: 'Logo de prueba', url: 'https://res.cloudinary.com/demo/image/upload/logo-prueba.webp', updatedAt: '', createdAt: '' }
  firstTools[0].con = ''
  firstTools[0].referenceLink = { type: 'custom', url: '/case-studies' }
  if (firstTools[1]) {
    firstTools[1].referenceLink = { type: 'custom', url: 'javascript:alert(1)' }
    firstTools[1].affiliateLink = null
  }
  const vData = buildStackViewData(variant, 'es')
  const vHtml = markup(render(title, vData))
  const vCards = vHtml.split(CARD_OPEN).slice(1).filter((c) => c.includes('<h3'))

  check(/<img[^>]*src="https:\/\/res\.cloudinary\.com\/demo\/image\/upload\/logo-prueba\.webp"[^>]*>/.test(vCards[0] ?? ''), 'logo: con logo hay una imagen en la primera tarjeta', 'falta la imagen')
  check(/<img[^>]*\salt=""[^>]*>/.test(vCards[0] ?? ''), 'logo: la imagen del logo lleva alt vacio', 'el alt no esta vacio')
  check(/width="36"/.test(vCards[0] ?? '') && /height="36"/.test(vCards[0] ?? ''), 'logo: la imagen declara 36 x 36', 'faltan ancho y alto')
  check(vData.categories[0].tools[0].con === null && textOf(vHtml).includes('Sin quejas reales hasta ahora'), 'contra: un contra vacio muestra stackPage.rowConEmpty', 'falta el texto honesto de contra vacio')
  check(/href="\/case-studies"/.test(vCards[0] ?? '') && textOf(vCards[0] ?? '').includes('Dónde lo usé'), 'referencia: con referenceLink aparece la linea Donde lo use', 'falta la linea')
  if (firstTools[1]) {
    check(vData.categories[0].tools[1].reference === null, 'referencia: una url javascript: se descarta (T-54-51)', 'la url paso el saneado')
    check(!/javascript:/i.test(vHtml), 'referencia: ningun javascript: llega al HTML', 'hay un javascript: en el HTML')
    check(!/Dónde lo usé/.test(vCards[1] ?? ''), 'referencia: sin referencia valida no se dibuja Donde lo use', 'quedo la linea')
    check(/Sin programa de afiliados todavía/.test(vCards[1] ?? ''), 'afiliado: sin programa muestra el chip pendiente y ningun boton', 'falta el chip')
    check(!/href="\/go\//.test(vCards[1] ?? ''), 'afiliado: sin programa no hay enlace /go/', 'hay /go/ en una herramienta sin afiliado')
  }

  // Sin bloque toolStack: solo el hero.
  const heroOnly = markup(render(title, null))
  check(headingLevels(heroOnly).join(',') === '1', 'sin bloque: solo queda el h1', `niveles = ${headingLevels(heroOnly).join(',')}`)
  check(/role="note"/.test(heroOnly) && !/href="\/go\//.test(heroOnly) && categoriesNav(heroOnly) === '', 'sin bloque: aviso sin enlaces ni nav huerfano', 'quedo un nav o un /go/')

  // Una categoria con una sola herramienta y sin equipo.
  const solo = clone(block)
  solo.categoryGroups = [clone(block.categoryGroups![0])]
  solo.categoryGroups[0].tools = [solo.categoryGroups[0].tools![0]]
  solo.gearItems = []
  const soloHtml = markup(render(title, buildStackViewData(solo, 'es')))
  check(!/Mi equipo personal/.test(soloHtml), 'equipo: sin items no hay seccion ni enlace de Mi equipo personal', 'quedo el encabezado del equipo')
  check(countOf(soloHtml, /<h3[\s>]/) === 1, 'una herramienta: una sola tarjeta', `h3 = ${countOf(soloHtml, /<h3[\s>]/)}`)

  // EN: el mismo doc, mensajes en ingles.
  const enHtml = markup(render(title, buildStackViewData(block, 'en'), 'en'))
  const enNote = enHtml.search(/role="note"/)
  const enGo = enHtml.search(/href="\/go\//)
  check(enNote !== -1 && enNote < enGo, 'en: el aviso aparece antes del primer /go/', `note = ${enNote}, /go = ${enGo}`)
  check(anchors(enHtml, (h) => h.startsWith('/go/')).length === activeCount, 'en: la misma cantidad de enlaces /go/ (sin prefijo de idioma)', 'cambio la cantidad')
  check(headingLevels(enHtml).filter((l) => l === 1).length === 1, 'en: un solo h1', 'h1 repetido')

  if (failures > 0) {
    console.log(`\n${failures} comprobacion(es) fallaron`)
    process.exit(1)
  }
  console.log('\nPASS 54-stack-ssr')
}

main().catch((err) => {
  console.log(`FAIL excepcion no controlada: ${err instanceof Error ? err.stack : String(err)}`)
  process.exit(1)
})
