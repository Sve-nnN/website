/**
 * Autoprueba de render de las paginas legales (fase 54, plan 54-10).
 *
 * Descarga los docs REALES de privacy y terms de la API publica anonima de
 * produccion (solo lectura, en es y en), extrae los rich text de los bloques
 * `content` y renderiza LegalView con el arnes de servidor. No toca la base.
 *
 * Por cada doc y locale comprueba:
 *   - exactamente un h1;
 *   - cada id de extractHeadings aparece una vez en el HTML, ningun id se repite
 *     y el conjunto de href "#id" del indice es igual al conjunto de ids;
 *   - el texto de cada encabezado, parrafo y elemento de lista (primeros 60
 *     caracteres) esta en el HTML: el texto legal no se altera;
 *   - ninguna apertura de main y ninguna linea de fecha de actualizacion;
 *   - el indice es el unico nav con nombre propio ademas de las migas (los dos
 *     nombres son distintos) y aparece antes que el texto.
 * Casos sinteticos: con un solo h2 no hay indice y el texto sigue; un
 * encabezado con HTML no se inyecta en crudo.
 *
 *   node_modules/.bin/tsx scripts/verify/54-legal-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as React from 'react'
import { createElement } from 'react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import {
  extractHeadings,
  headingText,
  type LexicalNodeLike,
  type LexicalRootLike,
} from '../../src/components/mui/rich-text/lexical-toc'
import { combineRichTexts, extractLegalRichTexts, LegalView } from '../../src/components/pages/LegalView'
import { countOf, renderToHtml, textOf, type HarnessLocale } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

const BASE = process.env.LEGAL_SSR_BASE_URL ?? 'https://juan-tech.com'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

function messages(locale: HarnessLocale) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', `${locale}.json`), 'utf8')) as {
    common: { breadcrumbHome: string; breadcrumbsLabel: string }
    legal: { eyebrow: string; tocLabel: string }
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

type Doc = { title: string; slug: string; content?: { layout?: unknown[] } }

async function fetchDoc(slug: string, locale: HarnessLocale): Promise<Doc> {
  const json = await getJson<{ docs?: Doc[] }>(
    `${BASE}/api/pages?where[slug][equals]=${slug}&locale=${locale}&depth=0&limit=1`,
  )
  const doc = json.docs?.[0]
  if (!doc) throw new Error(`sin doc ${slug} ${locale}`)
  return doc
}

/** Sin espacios: tolera saltos de linea y <br> entre fragmentos de un mismo parrafo. */
function squash(text: string): string {
  return text.replace(/\s+/g, '')
}

/** Textos a buscar en el HTML: encabezados, parrafos y elementos de lista de primer nivel. */
function expectedTexts(root: LexicalRootLike): string[] {
  const out: string[] = []
  const take = (node: LexicalNodeLike) => {
    const text = squash(headingText(node)).slice(0, 60)
    if (text !== '') out.push(text)
  }
  for (const node of root.children ?? []) {
    if (node.type === 'heading' || node.type === 'paragraph') take(node)
    else if (node.type === 'list') for (const item of node.children ?? []) take(item)
  }
  return out
}

function render(
  locale: HarnessLocale,
  title: string,
  richTexts: Array<SerializedEditorState | null | undefined>,
): string {
  const m = messages(locale)
  return renderToHtml(
    createElement(LegalView, {
      title,
      crumbs: [{ label: m.common.breadcrumbHome, href: '/' }, { label: title }],
      richTexts,
      eyebrow: m.legal.eyebrow,
      tocLabel: m.legal.tocLabel,
    }),
    locale,
  )
}

function navNames(html: string): string[] {
  return [...html.matchAll(/<nav\b[^>]*\baria-label="([^"]*)"/g)].map((m) => m[1])
}

function checkDoc(slug: string, locale: HarnessLocale, doc: Doc): void {
  const tag = `${slug} ${locale}`
  const m = messages(locale)
  const richTexts = extractLegalRichTexts(doc.content?.layout)
  const combined = combineRichTexts(richTexts)

  check(richTexts.length > 0 && combined !== null, `${tag}: rich text`, 'el doc no trae rich text en bloques content')
  if (!combined) return
  const root = combined.root as unknown as LexicalRootLike
  const headings = extractHeadings(root)
  const html = render(locale, doc.title, richTexts)

  // Un solo h1
  const h1 = countOf(html, /<h1[\s>]/)
  check(h1 === 1, `${tag}: un h1`, `hay ${h1} h1`)

  // Ids del texto y del indice
  const idSet = new Set(headings.map((h) => h.id))
  check(headings.length >= 2, `${tag}: indice con encabezados`, `solo ${headings.length} encabezados h2 o h3`)
  check(idSet.size === headings.length, `${tag}: ids de extractHeadings unicos`, 'extractHeadings devolvio ids repetidos')
  const missing = headings.filter((h) => countOf(html, new RegExp(`\\sid="${h.id}"`)) !== 1).map((h) => h.id)
  check(missing.length === 0, `${tag}: cada id aparece una vez en el HTML`, `ids con conteo distinto de uno: ${missing.join(', ')}`)
  const allIds = [...html.matchAll(/\sid="([^"]*)"/g)].map((x) => x[1])
  const dup = allIds.filter((id, i) => allIds.indexOf(id) !== i)
  check(dup.length === 0, `${tag}: ningun id repetido en la pagina`, `ids repetidos: ${[...new Set(dup)].join(', ')}`)

  const hrefSet = new Set([...html.matchAll(/\shref="#([^"]*)"/g)].map((x) => x[1]))
  const sameSets = hrefSet.size === idSet.size && [...idSet].every((id) => hrefSet.has(id))
  check(
    sameSets,
    `${tag}: href del indice igual al conjunto de ids`,
    `href: [${[...hrefSet].join(', ')}] ids: [${[...idSet].join(', ')}]`,
  )

  // Texto intacto
  const haystack = squash(textOf(html))
  const absent = expectedTexts(root).filter((t) => !haystack.includes(t))
  check(absent.length === 0, `${tag}: texto del doc presente`, `${absent.length} fragmentos ausentes, por ejemplo "${absent[0]}"`)

  // Sin main ni fecha de actualizacion
  check(countOf(html, /<main[\s>]/) === 0, `${tag}: sin main`, 'LegalView abre un main')
  const chrome = textOf(render(locale, doc.title, []))
  check(
    countOf(html, /<time[\s>]/) === 0 && !/actualizaci|updated/i.test(chrome),
    `${tag}: sin linea de fecha de actualizacion`,
    'la vista pinta una fecha o una linea de ultima actualizacion',
  )

  // Un solo nav con nombre propio ademas de las migas, y el indice antes que el texto
  const names = navNames(html)
  const expected = [m.common.breadcrumbsLabel, m.legal.tocLabel].sort()
  check(
    names.length === 2 && JSON.stringify([...names].sort()) === JSON.stringify(expected) && names[0] !== names[1],
    `${tag}: navs con nombre`,
    `navs: [${names.join(' | ')}], se esperaba [${expected.join(' | ')}]`,
  )
  const first = headings[0]
  const hrefAt = html.indexOf(`href="#${first.id}"`)
  const textAt = html.indexOf(` id="${first.id}"`)
  check(hrefAt >= 0 && textAt >= 0 && hrefAt < textAt, `${tag}: indice antes que el texto`, `href en ${hrefAt}, texto en ${textAt}`)

  check(textOf(html).includes(m.legal.eyebrow), `${tag}: eyebrow`, `no aparece "${m.legal.eyebrow}"`)
}

function para(text: string) {
  return { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }
}
function heading(tag: string, text: string) {
  return { type: 'heading', tag, version: 1, children: [{ type: 'text', version: 1, text }] }
}
function state(children: unknown[]): SerializedEditorState {
  return {
    root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children },
  } as unknown as SerializedEditorState
}

function checkSynthetic(): void {
  const m = messages('es')

  // Un solo h2: no hay indice y el texto sigue presente
  const one = render('es', 'Documento corto', [state([heading('h2', 'Unico'), para('Texto sin indice que sigue presente')])])
  check(!one.includes(m.legal.tocLabel), 'sintetico un h2: sin indice', 'aparece el nombre del indice')
  check(navNames(one).length === 1, 'sintetico un h2: solo las migas como nav', `navs: [${navNames(one).join(' | ')}]`)
  check(textOf(one).includes('Texto sin indice que sigue presente'), 'sintetico un h2: el texto sigue', 'falta el texto')
  check(countOf(one, /\sid="unico"/) === 1, 'sintetico un h2: el encabezado conserva su id', 'falta el id')

  // Varias columnas: raiz combinada, ids deduplicados de forma global
  const two = render('es', 'Dos columnas', [
    state([heading('h2', 'Repetido'), para('Primera columna')]),
    state([heading('h2', 'Repetido'), para('Segunda columna')]),
  ])
  check(
    countOf(two, /\sid="repetido"/) === 1 && countOf(two, /\sid="repetido-2"/) === 1,
    'sintetico columnas: ids deduplicados entre columnas',
    'el deduplicado no es global',
  )
  const hrefs = new Set([...two.matchAll(/\shref="#([^"]*)"/g)].map((x) => x[1]))
  check(hrefs.has('repetido') && hrefs.has('repetido-2') && hrefs.size === 2, 'sintetico columnas: indice coincide', `href: ${[...hrefs].join(', ')}`)

  // T-54-40: el HTML de un encabezado no se inyecta
  const evil = render('es', 'Seguridad', [
    state([heading('h2', '<img src=x onerror=alert(1)>'), heading('h2', 'Otro'), para('<script>alert(1)</script>')]),
  ])
  check(!/<img src=x/.test(evil) && !/<script>alert/.test(evil), 'sintetico XSS: sin HTML en crudo', 'el HTML del CMS salio sin escapar')
  const evilIds = [...evil.matchAll(/\sid="([^"]*)"/g)].map((x) => x[1])
  check(
    evilIds.every((id) => /^[a-z0-9:_-]+$/i.test(id)),
    'sintetico XSS: ids solo con caracteres seguros',
    `ids: ${evilIds.join(', ')}`,
  )

  // Sin rich text no truena
  const none = render('es', 'Vacio', [])
  check(countOf(none, /<h1[\s>]/) === 1, 'sintetico vacio: un h1 sin texto', 'no renderiza el h1')
}

async function main(): Promise<void> {
  checkSynthetic()

  for (const slug of ['privacy', 'terms']) {
    for (const locale of ['es', 'en'] as const) {
      let doc: Doc
      try {
        doc = await fetchDoc(slug, locale)
      } catch (err) {
        failures += 1
        console.log(`FAIL ${slug} ${locale}: ${err instanceof Error ? err.message : String(err)}`)
        continue
      }
      checkDoc(slug, locale, doc)
    }
  }

  if (failures > 0) {
    console.log(`\n${failures} FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 54-legal-ssr: privacy y terms en es y en')
}

main().catch((err) => {
  console.log(`FAIL red o ejecucion: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
