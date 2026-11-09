/**
 * Autoprueba de render del indice de servicios (fase 54, plan 54-15).
 *
 * Descarga de la API publica anonima de produccion (solo lectura) el doc del
 * indice (`slug=services`) y los cuatro docs de servicio, arma tarjetas y filas
 * con las funciones puras de `services-index-data` y renderiza la vista con el
 * arnes de servidor. No toca la base.
 *
 *   node_modules/.bin/tsx scripts/verify/54-index-ssr.ts
 *
 * Con DNS roto hacia juan-tech.com, precargar el arreglo de la sesion con
 * NODE_OPTIONS="--require <scratchpad>/dnsfix.cjs" (ese archivo no entra al repo).
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { ServicesIndexView } from '../../src/components/pages/ServicesIndexView'
import { headingText } from '../../src/components/mui/rich-text/lexical-toc'
import { buildTrail } from '../../src/lib/breadcrumbs'
import { SERVICE_SLUGS, buildServiceHref } from '../../src/lib/service-slugs'
import {
  buildCompareRows,
  buildIndexCards,
  type IndexDocLike,
  type ServiceDocLike,
} from '../../src/lib/services-index-data'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

const BASE = process.env.SERVICE_SLOTS_BASE_URL ?? 'https://juan-tech.com'

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

async function getJson<T>(url: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
    }
  }
  throw new Error(`red: ${url} fallo dos veces (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`)
}

type Doc = IndexDocLike & ServiceDocLike

async function fetchDoc(slug: string, locale: 'es' | 'en'): Promise<Doc> {
  const json = await getJson<{ docs?: Doc[] }>(
    `${BASE}/api/pages?where[slug][equals]=${slug}&locale=${locale}&depth=0&limit=1`,
  )
  const doc = json.docs?.[0]
  if (!doc) throw new Error(`sin doc ${slug} ${locale}`)
  return doc
}

const noStyle = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '')

type Block = { blockType: string; columns?: Array<{ richText?: unknown }>; subtitle?: string | null }

/** Parrafo de cada columna del primer content del indice, a mano, para comparar con la derivacion. */
function columnParagraphs(doc: Doc): string[] {
  const content = ((doc.content?.layout ?? []) as Block[]).find((b) => b.blockType === 'content')
  return (content?.columns ?? []).map((c) => {
    const nodes = (c.richText as { root?: { children?: Array<{ type?: string }> } })?.root?.children ?? []
    const p = nodes.find((n) => n.type === 'paragraph')
    return p ? headingText(p as never).trim() : ''
  })
}

function render(locale: 'es' | 'en', cards: ReturnType<typeof buildIndexCards>, rows: ReturnType<typeof buildCompareRows>) {
  const crumbs = buildTrail(locale).map((c) => ({ label: c.label, href: c.url }))
  return noStyle(
    renderToHtml(
      createElement(ServicesIndexView, {
        crumbs,
        title: locale === 'es' ? 'Servicios' : 'Services',
        lead: 'Lead de prueba',
        cards,
        rows,
        contactHref: locale === 'es' ? '/#contacto' : '/en#contacto',
      }),
      locale,
    ),
  )
}

async function runLocale(locale: 'es' | 'en'): Promise<void> {
  const tag = `indice ${locale}`
  const indexDoc = await fetchDoc('services', locale)
  const servicePages = await Promise.all(SERVICE_SLUGS.map((s) => fetchDoc(s, locale)))

  const cards = buildIndexCards(indexDoc, servicePages, locale)
  const rows = buildCompareRows(servicePages, locale)
  const html = render(locale, cards, rows)

  // ---- Tarjetas ----
  check(cards.length === 4, `${tag}: cuatro tarjetas`, `tarjetas: ${cards.length}`)
  const listStart = html.indexOf('<ul')
  const listEnd = html.indexOf('</ul>')
  const listHtml = listStart >= 0 && listEnd > listStart ? html.slice(listStart, listEnd) : ''
  check(countOf(listHtml, /<h2[\s>]/) === 4, `${tag}: cuatro h2 en la lista de tarjetas`, `h2 en lista: ${countOf(listHtml, /<h2[\s>]/)}`)
  const hrefs = SERVICE_SLUGS.map((s) => buildServiceHref(locale, s))
  const missing = hrefs.filter((h) => !new RegExp(`<a[^>]*href="${h}"`).test(listHtml))
  check(missing.length === 0, `${tag}: cada tarjeta enlaza a su servicio`, `sin enlace: ${missing.join(', ')}`)
  if (locale === 'es') {
    check(
      SERVICE_SLUGS.every((s) => listHtml.includes(`href="/servicios/${s}"`)),
      `${tag}: href /servicios/<slug>`,
      'algun href no es /servicios/<slug>',
    )
  }

  const paragraphs = columnParagraphs(indexDoc)
  const fromColumns = paragraphs.length === 4 && paragraphs.every((p) => p !== '')
  check(fromColumns, `${tag}: el doc real trae cuatro columnas con parrafo`, `parrafos: ${JSON.stringify(paragraphs.map((p) => p.length))}`)
  check(
    cards.every((c, i) => c.description !== null && c.description === paragraphs[i]),
    `${tag}: descripcion de cada tarjeta = parrafo de la columna i (por posicion, no vacia)`,
    'alguna descripcion no coincide con la columna de su posicion',
  )
  check(
    cards.every((c) => c.timeline !== null),
    `${tag}: cada tarjeta trae duracion`,
    'tarjeta sin timeline',
  )

  // ---- Tabla ----
  check(rows.length === 4, `${tag}: cuatro filas de comparacion`, `filas: ${rows.length}`)
  check(
    rows.every((r) => r.fitsIf && r.achieves && r.time),
    `${tag}: cada fila trae te sirve si, logro y tiempo`,
    JSON.stringify(rows.map((r) => [!!r.fitsIf, !!r.achieves, !!r.time])),
  )
  check(countOf(html, /<th[^>]*scope="col"/) === 4, `${tag}: cuatro encabezados de columna scope col`, `th col: ${countOf(html, /<th[^>]*scope="col"/)}`)
  check(countOf(html, /<th[^>]*scope="row"/) === 4, `${tag}: cuatro encabezados de fila scope row`, `th row: ${countOf(html, /<th[^>]*scope="row"/)}`)
  const bodyRows = countOf(html.slice(html.indexOf('<tbody')), /<tr[\s>]/)
  check(bodyRows === 4, `${tag}: cuatro filas en tbody`, `tr en tbody: ${bodyRows}`)
  const container = html.match(/<div[^>]*role="region"[^>]*>/)?.[0] ?? ''
  check(
    /tabindex="0"/.test(container) && /aria-label="[^"]+"/.test(container),
    `${tag}: contenedor de la tabla con tabindex 0, role region y aria-label`,
    `contenedor: ${container || 'no hay role=region'}`,
  )
  const text = textOf(html)
  check(
    rows.every((r) => text.includes(r.fitsIf as string)) && rows.every((r) => text.includes(r.achieves as string)),
    `${tag}: el texto de la tabla sale del HTML servido`,
    'falta texto de alguna celda',
  )

  // ---- Estructura ----
  check(!/<main[\s>]/.test(html), `${tag}: ninguna apertura de main`, 'la vista emite main')
  check(countOf(html, /<h1[\s>]/) === 1, `${tag}: un solo h1`, `h1: ${countOf(html, /<h1[\s>]/)}`)
  const levels = headingLevels(html)
  let jump = ''
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] - levels[i - 1] > 1) jump = `${levels[i - 1]} a ${levels[i]}`
  }
  check(jump === '', `${tag}: niveles de encabezado sin saltos`, `salto ${jump}`)
  check(!/\{\{|\[PLACEHOLDER\]/.test(html), `${tag}: sin llaves dobles ni marcadores`, 'hay {{ o [PLACEHOLDER]')
}

function runSynthetic(): void {
  const tag = 'caso sintetico'
  const mk = (title: string, subtitle: string): ServiceDocLike => ({
    title,
    content: {
      layout: [
        { blockType: 'hero', title, subtitle },
        { blockType: 'serviceScopeCard', scope: 's', outcome: 'o', timeline: 't' },
      ],
    } as never,
  })
  const pages = SERVICE_SLUGS.map((s, i) => mk(`Servicio ${i + 1}`, `Subtitulo ${i + 1}`))
  const col = (head: string, para: string) => ({
    richText: {
      root: {
        children: [
          { type: 'heading', tag: 'h2', children: [{ type: 'text', text: head }] },
          { type: 'paragraph', children: [{ type: 'text', text: para }] },
        ],
      },
    },
  })
  const four = { content: { layout: [{ blockType: 'content', columns: [1, 2, 3, 4].map((n) => col(`H${n}`, `P${n}`)) }] } }
  const three = { content: { layout: [{ blockType: 'content', columns: [1, 2, 3].map((n) => col(`H${n}`, `P${n}`)) }] } }
  const noPara = {
    content: {
      layout: [
        {
          blockType: 'content',
          columns: [1, 2, 3, 4].map((n) => ({
            richText: { root: { children: [{ type: 'heading', tag: 'h2', children: [{ type: 'text', text: `H${n}` }] }] } },
          })),
        },
      ],
    },
  }

  const byColumn = buildIndexCards(four as never, pages, 'es')
  check(
    byColumn.map((c) => c.description).join('|') === 'P1|P2|P3|P4',
    `${tag}: cuatro columnas dan la descripcion por posicion`,
    byColumn.map((c) => c.description).join('|'),
  )
  const fallback = buildIndexCards(three as never, pages, 'es')
  check(
    fallback.map((c) => c.description).join('|') === 'Subtitulo 1|Subtitulo 2|Subtitulo 3|Subtitulo 4',
    `${tag}: tres columnas caen al subtitulo del hero`,
    fallback.map((c) => c.description).join('|'),
  )
  const fallback2 = buildIndexCards(noPara as never, pages, 'es')
  check(
    fallback2[0]?.description === 'Subtitulo 1',
    `${tag}: columnas sin parrafo caen al subtitulo del hero`,
    String(fallback2[0]?.description),
  )
  const noIndex = buildIndexCards(null, pages, 'es')
  check(noIndex[0]?.description === 'Subtitulo 1', `${tag}: sin doc de indice cae al subtitulo`, String(noIndex[0]?.description))
  const omitted = buildIndexCards(four as never, [pages[0], null, pages[2], undefined], 'en')
  check(
    omitted.length === 2 && omitted[1]?.href === '/en/services/fullstack-development',
    `${tag}: un servicio que no resuelve se omite sin desplazar las demas descripciones`,
    JSON.stringify(omitted.map((c) => [c.slug, c.description])),
  )
  check(omitted[1]?.description === 'P3', `${tag}: la descripcion sigue a su posicion aunque otro servicio falte`, String(omitted[1]?.description))

  const html = render('es', byColumn, buildCompareRows(pages, 'es'))
  check(countOf(html, /<h2[\s>]/) >= 5, `${tag}: la vista pinta con datos sinteticos`, `h2: ${countOf(html, /<h2[\s>]/)}`)
  const empty = render('es', [], [])
  check(!/role="region"/.test(empty) && /<h1/.test(empty), `${tag}: sin filas no hay tabla vacia`, 'region presente sin filas')
}

async function main(): Promise<void> {
  runSynthetic()
  for (const locale of ['es', 'en'] as const) {
    try {
      await runLocale(locale)
    } catch (err) {
      check(false, `indice ${locale}`, err instanceof Error ? err.message : String(err))
    }
  }

  if (failures > 0) {
    console.log(`\n${failures} caso(s) en FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 54-index-ssr')
}

main().catch((err) => {
  console.log(`FAIL inesperado: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
