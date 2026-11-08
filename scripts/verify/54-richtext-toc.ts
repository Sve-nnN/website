/**
 * Autoprueba de MuiRichText y del módulo de ids de encabezado (plan 54-06, tarea 1).
 *
 * Comprueba que el índice (extractHeadings) y el render (MuiRichText) sacan los
 * ids de la misma función: ids deduplicados, válidos, presentes una sola vez en
 * el HTML, y lo mismo sobre el documento real de Privacy de producción
 * (API pública anónima, solo lectura).
 *
 * Uso:
 *   node_modules/.bin/tsx scripts/verify/54-richtext-toc.ts
 * Imprime PASS o FAIL con el motivo por caso y sale con 1 ante cualquier FAIL.
 */
import * as React from 'react'
import { createElement } from 'react'

import { MuiRichText } from '../../src/components/mui/rich-text/MuiRichText'
import { buildHeadingIdMap, extractHeadings, slugify } from '../../src/components/mui/rich-text/lexical-toc'
import { countOf, renderToHtml } from './54-ssr-harness'

// tsx no transforma JSX con `jsx: preserve` y cae al runtime clasico, que busca
// `React` global al renderizar los componentes .tsx. Solo se usa en esta autoprueba.
;(globalThis as { React?: typeof React }).React = React

let failed = 0
function check(name: string, ok: boolean, reason: string) {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failed += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

type Node = Record<string, unknown>
const text = (t: string, format = 0): Node => ({ type: 'text', text: t, version: 1, format })
const heading = (tag: string, t: string): Node => ({ type: 'heading', tag, version: 1, children: [text(t)] })
const para = (t: string): Node => ({ type: 'paragraph', version: 1, children: [text(t)] })
const doc = (children: Node[]) =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }) as never

/** Cuantos elementos llevan exactamente ese id como atributo. */
function idCount(html: string, id: string): number {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return countOf(html, new RegExp(`\\sid="${escaped}"`))
}

// ---------------------------------------------------------------------------
// Caso 1: documento sintético con dos h2 iguales y un h3
// ---------------------------------------------------------------------------
{
  const data = doc([heading('h2', 'X'), para('uno'), heading('h2', 'X'), heading('h3', 'Otro tema'), para('dos')])
  const items = extractHeadings((data as { root: never }).root)
  const ids = items.map((i) => i.id)
  check(
    'sintetico: ids x, x-2 y otro distinto',
    JSON.stringify(ids) === JSON.stringify(['x', 'x-2', 'otro-tema']),
    `ids = ${JSON.stringify(ids)}`,
  )
  check(
    'sintetico: niveles 2, 2 y 3',
    JSON.stringify(items.map((i) => i.level)) === '[2,2,3]',
    `niveles = ${JSON.stringify(items.map((i) => i.level))}`,
  )

  const html = renderToHtml(createElement(MuiRichText, { data }), 'es')
  for (const id of ids) {
    const n = idCount(html, id)
    check(`sintetico: id "${id}" aparece una vez en el HTML`, n === 1, `aparece ${n} veces`)
  }
  check('sintetico: el h2 sale como h2 y el h3 como h3', countOf(html, /<h2[\s>]/) === 2 && countOf(html, /<h3[\s>]/) === 1, `h2=${countOf(html, /<h2[\s>]/)} h3=${countOf(html, /<h3[\s>]/)}`)
  check('sintetico: los encabezados llevan scroll-margin-top de 96px', /scroll-margin-top:\s*96px/.test(html), 'falta scroll-margin-top: 96px en el CSS emitido')
  check('sintetico: no hay HTML inyectado en crudo', !/dangerouslySetInnerHTML/.test(html), 'aparece dangerouslySetInnerHTML')
}

// ---------------------------------------------------------------------------
// Caso 2: acentos y signos, texto vacio, mapa por referencia
// ---------------------------------------------------------------------------
{
  const id = slugify('¿Qué es el SEO técnico? Año 2024 (guía)')
  check('acentos y signos: id valido', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id), `id = "${id}"`)
  check('acentos y signos: sin acentos ni signos', id === 'que-es-el-seo-tecnico-ano-2024-guia', `id = "${id}"`)

  const data = doc([heading('h2', '   '), heading('h2', '???'), heading('h2', 'x'), heading('h2', 'x'), heading('h2', 'x-2')])
  const root = (data as { root: never }).root
  const ids = extractHeadings(root).map((i) => i.id)
  check(
    'texto vacio usa "seccion" y los ids nunca chocan',
    JSON.stringify(ids) === JSON.stringify(['seccion', 'seccion-2', 'x', 'x-2', 'x-2-2']),
    `ids = ${JSON.stringify(ids)}`,
  )
  const map = buildHeadingIdMap(root)
  const children = (root as { children: never[] }).children
  check('el mapa se indexa por la referencia del nodo', map.get(children[0]) === 'seccion' && map.get(children[3]) === 'x-2', 'el mapa no devolvio los ids por referencia')

  // h1 y h4 no entran al indice ni reciben id
  const mixed = doc([heading('h1', 'Titulo'), heading('h4', 'Menor'), heading('h2', 'Seccion')])
  const mixedIds = extractHeadings((mixed as { root: never }).root).map((i) => i.id)
  check('h1 y h4 no entran al indice', JSON.stringify(mixedIds) === '["seccion"]', `ids = ${JSON.stringify(mixedIds)}`)
}

// ---------------------------------------------------------------------------
// Caso 3: enlaces (esquema peligroso, externo, interno)
// ---------------------------------------------------------------------------
{
  const link = (url: string, label: string, newTab = false): Node => ({
    type: 'link',
    version: 1,
    fields: { linkType: 'custom', url, newTab },
    children: [text(label)],
  })
  const data = doc([
    {
      type: 'paragraph',
      version: 1,
      children: [link('javascript:alert(1)', 'peligroso'), link('https://example.com/x', 'externo'), link('/servicios', 'interno')],
    },
  ])
  const html = renderToHtml(createElement(MuiRichText, { data }), 'es')
  check('enlace con javascript: queda como texto sin href', !/href="javascript:/i.test(html) && html.includes('peligroso'), 'el href javascript: llego al HTML o se perdio el texto')
  check('enlace externo: target _blank, rel noopener noreferrer y sufijo accesible', /target="_blank"/.test(html) && /rel="noopener noreferrer"/.test(html) && html.includes('se abre en otra pestaña'), 'falta target, rel o el sufijo de messages')
  check('enlace interno: href /servicios', /href="\/servicios"/.test(html), 'no aparece href="/servicios"')
  const htmlEn = renderToHtml(createElement(MuiRichText, { data }), 'en')
  check('enlace externo en EN: sufijo en ingles', htmlEn.includes('opens in a new tab'), 'no aparece el sufijo en ingles')
}

// ---------------------------------------------------------------------------
// Caso 4: documento real de Privacy (API publica anonima de produccion)
// ---------------------------------------------------------------------------
async function fetchPrivacy(): Promise<unknown> {
  const url = 'https://juan-tech.com/api/pages?where%5Bslug%5D%5Bequals%5D=privacy&locale=es&depth=0&limit=1'
  let lastError = ''
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        continue
      }
      return await res.json()
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }
  throw new Error(`red: no se pudo descargar Privacy de produccion (${lastError})`)
}

async function realCase() {
  let json: { docs?: Array<{ content?: { layout?: Array<{ blockType?: string; columns?: Array<{ richText?: unknown }> }> } }> }
  try {
    json = (await fetchPrivacy()) as typeof json
  } catch (err) {
    check('real Privacy: descarga', false, err instanceof Error ? err.message : String(err))
    return
  }
  const layout = json.docs?.[0]?.content?.layout ?? []
  const block = layout.find((b) => b.blockType === 'content') ?? layout[0]
  const data = block?.columns?.[0]?.richText as { root?: { children?: unknown[] } } | undefined
  if (!data?.root) {
    check('real Privacy: rich text del primer bloque content', false, 'la respuesta no trae columns[0].richText')
    return
  }
  const items = extractHeadings(data.root as never)
  check('real Privacy: al menos dos encabezados h2 o h3', items.length >= 2, `encontró ${items.length}`)

  const html = renderToHtml(createElement(MuiRichText, { data: data as never }), 'es')
  const bad = items.filter((i) => idCount(html, i.id) !== 1).map((i) => i.id)
  check(
    `real Privacy: cada uno de los ${items.length} ids aparece una vez en el HTML`,
    bad.length === 0,
    `ids con conteo distinto de 1: ${JSON.stringify(bad)}`,
  )
  check('real Privacy: los ids son unicos', new Set(items.map((i) => i.id)).size === items.length, 'hay ids repetidos en el indice')
}

realCase()
  .then(() => {
    if (failed > 0) {
      console.log(`\n${failed} caso(s) con FAIL`)
      process.exit(1)
    }
    console.log('\nPASS 54-richtext-toc: todos los casos')
  })
  .catch((err) => {
    console.log(`FAIL 54-richtext-toc: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  })
