/**
 * Autoprueba de render de las paginas legales con el global sombra (fase 56, plan 56-08).
 *
 * Sin red y sin base: casos sinteticos que repiten lo que hacen las rutas
 * /privacy y /terms (pickLegalSource, legalEffective y LegalView con el arnes de
 * servidor de la fase 54). Corre cada caso con la clave privacy y con la clave terms.
 *
 *   (a) legal vacio: cae al doc pages del mismo idioma y no hay linea de fecha;
 *   (b) legal con cuerpo y sin fecha: texto nuevo y ninguna linea de fecha;
 *   (c) legal con cuerpo y fecha: linea con <time dateTime>, 2026-11-30 sale como
 *       30 de noviembre en ES (UTC, no 29) y November 30 en EN;
 *   (d) un solo h1, ningun main, ids del indice sin repetir;
 *   (e) el texto no se inyecta como HTML;
 *   (f) la fecha nunca acompana al texto del doc pages, ni se usa updatedAt;
 *   (g) las dos rutas comparten el helper y no llaman extractLegalRichTexts por su cuenta.
 *
 *   node_modules/.bin/tsx scripts/verify/56-legal-ssr.ts
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

import { LegalView } from '../../src/components/pages/LegalView'
import {
  legalEffective,
  pickLegalSource,
  type LegalGlobalLike,
  type LegalKey,
} from '../../src/lib/legal-source'
import { countOf, renderToHtml, textOf, type HarnessLocale } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

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

type Messages = {
  common: { breadcrumbHome: string }
  legal: { eyebrow: string; tocLabel: string; effectiveOn: string }
}

function messages(locale: HarnessLocale): Messages {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', `${locale}.json`), 'utf8')) as Messages
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

/** Doc pages sintetico con un bloque content de una columna, como el de produccion. */
function pagesDoc(richText: SerializedEditorState) {
  return {
    title: 'Doc pages',
    updatedAt: '2031-01-02T03:04:05.000Z', // centinela: no debe aparecer jamas en el HTML
    content: { layout: [{ blockType: 'content', columns: [{ richText }] }] },
  }
}

const OLD_TEXT = 'Texto de siempre del doc pages'
const NEW_TEXT = 'Texto nuevo del global sombra'

/** Replica lo que hace cada ruta: pickLegalSource + legalEffective + LegalView. */
function renderRoute(
  locale: HarnessLocale,
  key: LegalKey,
  legal: LegalGlobalLike | null,
  doc = pagesDoc(state([heading('h2', 'Uno'), para(OLD_TEXT), heading('h2', 'Dos'), para('Segundo bloque')])),
): string {
  const m = messages(locale)
  const source = pickLegalSource(doc, legal, key)
  const effective = legalEffective(source.effectiveDate, locale)
  const label = effective ? m.legal.effectiveOn.replace('{date}', effective.formatted) : null
  return renderToHtml(
    createElement(LegalView, {
      title: doc.title,
      crumbs: [{ label: m.common.breadcrumbHome, href: '/' }, { label: doc.title }],
      richTexts: source.richTexts,
      eyebrow: m.legal.eyebrow,
      tocLabel: m.legal.tocLabel,
      effectiveLabel: label,
      effectiveDateIso: effective?.iso ?? null,
    }),
    locale,
  )
}

const NEW_BODY = state([heading('h2', 'Alcance'), para(NEW_TEXT), heading('h2', 'Datos'), para('Mas texto nuevo')])

function runKey(key: LegalKey): void {
  const tag = (s: string) => `${key} ${s}`

  // (a) legal vacio: respaldo al doc pages de siempre, sin fecha
  for (const legal of [null, undefined, { privacy: null, terms: null, effectiveDate: '2026-11-30T00:00:00.000Z' }]) {
    const html = renderRoute('es', key, legal ?? null)
    const flat = textOf(html)
    check(
      flat.includes(OLD_TEXT) && !flat.includes(NEW_TEXT),
      tag(`(a) cuerpo vacio o global ausente: cae al doc pages`),
      'no muestra el texto del doc pages',
    )
    check(
      countOf(html, /<time[\s>]/) === 0 && !/Vigente desde|Effective as of/.test(flat),
      tag('(a) sin texto del global no hay linea de fecha'),
      'la fecha viaja con el texto del doc pages',
    )
  }

  // (b) global con cuerpo y sin fecha: texto nuevo, sin linea de fecha
  const noDate = renderRoute('es', key, { privacy: NEW_BODY, terms: NEW_BODY, effectiveDate: null })
  check(
    textOf(noDate).includes(NEW_TEXT) && !textOf(noDate).includes(OLD_TEXT),
    tag('(b) texto nuevo sin fecha'),
    'no muestra el texto del global',
  )
  check(countOf(noDate, /<time[\s>]/) === 0 && !/Vigente desde/.test(textOf(noDate)), tag('(b) sin linea de fecha'), 'aparece una fecha sin dato')

  // (c) global con cuerpo y fecha: linea con time y dateTime, formato UTC
  for (const raw of ['2026-11-30T00:00:00.000Z', '2026-11-30']) {
    const es = renderRoute('es', key, { privacy: NEW_BODY, terms: NEW_BODY, effectiveDate: raw })
    check(
      countOf(es, /<time[\s>]/) === 1 && /<time[^>]*\bdatetime="2026-11-30"/i.test(es),
      tag(`(c) time con dateTime 2026-11-30 (${raw})`),
      'falta el elemento time o su dateTime',
    )
    check(
      textOf(es).includes('Vigente desde el 30 de noviembre de 2026'),
      tag(`(c) ES muestra 30 de noviembre, no 29 (${raw})`),
      `texto: ${textOf(es).match(/Vigente[^<]{0,50}/)?.[0] ?? 'sin linea'}`,
    )
  }
  const en = renderRoute('en', key, { privacy: NEW_BODY, terms: NEW_BODY, effectiveDate: '2026-11-30T00:00:00.000Z' })
  check(
    textOf(en).includes('Effective as of November 30, 2026'),
    tag('(c) EN muestra November 30'),
    `texto: ${textOf(en).match(/Effective[^<]{0,50}/)?.[0] ?? 'sin linea'}`,
  )
  check(/<p[^>]*>\s*<time/.test(en), tag('(c) la fecha va en un parrafo'), 'time fuera de un p')

  // (d) estructura: un h1, sin main, ids sin repetir
  const full = renderRoute('es', key, { privacy: NEW_BODY, terms: NEW_BODY, effectiveDate: '2026-11-30' })
  check(countOf(full, /<h1[\s>]/) === 1, tag('(d) un solo h1'), 'cantidad de h1 distinta de uno')
  check(countOf(full, /<main[\s>]/) === 0, tag('(d) sin main'), 'LegalView abre un main')
  const ids = [...full.matchAll(/\sid="([^"]*)"/g)].map((x) => x[1])
  check(new Set(ids).size === ids.length, tag('(d) ids sin repetir'), `ids: ${ids.join(', ')}`)
  const hrefs = [...full.matchAll(/\shref="#([^"]*)"/g)].map((x) => x[1])
  check(hrefs.length >= 2 && hrefs.every((h) => ids.includes(h)), tag('(d) cada href del indice apunta a un id'), `href: ${hrefs.join(', ')}`)

  // (e) HTML inyectado
  const evilBody = state([heading('h2', '<img src=x onerror=alert(1)>'), heading('h2', 'Otro'), para('<script>alert(1)</script>')])
  const evil = renderRoute('es', key, { privacy: evilBody, terms: evilBody, effectiveDate: '2026-11-30' })
  check(!/<img src=x/.test(evil) && !/<script>alert/.test(evil), tag('(e) sin HTML en crudo'), 'el texto salio sin escapar')

  // (f) updatedAt nunca se usa
  const withDate = renderRoute('es', key, { privacy: NEW_BODY, terms: NEW_BODY, effectiveDate: null })
  const pages = renderRoute('es', key, null)
  check(
    !/2031|enero de 2031|January 2/.test(textOf(withDate)) && !/2031/.test(withDate) && !/2031/.test(pages),
    tag('(f) updatedAt del doc no aparece'),
    'se pinto la fecha de modificacion',
  )
}

function checkHelpers(): void {
  check(legalEffective(null, 'es') === null && legalEffective('', 'es') === null, 'legalEffective: sin dato es null', 'devuelve algo sin dato')
  check(legalEffective('no-es-fecha', 'es') === null, 'legalEffective: texto invalido es null', 'acepta texto invalido')
  check(legalEffective('2026-02-31', 'es') === null, 'legalEffective: dia inexistente es null', 'acepta 31 de febrero')
  const e = legalEffective('2026-12-01T00:00:00.000Z', 'es')
  check(e?.iso === '2026-12-01' && /1 de diciembre de 2026/.test(e.formatted), 'legalEffective: 1 de diciembre en UTC', `devuelve ${JSON.stringify(e)}`)

  const doc = pagesDoc(state([para(OLD_TEXT)]))
  const g = pickLegalSource(doc, { privacy: NEW_BODY, terms: null, effectiveDate: '2026-11-30' }, 'privacy')
  check(g.source === 'global' && g.effectiveDate === '2026-11-30', 'pickLegalSource: global con fecha', JSON.stringify(g.source))
  const t = pickLegalSource(doc, { privacy: NEW_BODY, terms: null, effectiveDate: '2026-11-30' }, 'terms')
  check(t.source === 'pages' && t.effectiveDate === null && t.richTexts.length === 1, 'pickLegalSource: terms vacio cae a pages sin fecha', JSON.stringify(t.source))
  const none = pickLegalSource(null, null, 'privacy')
  check(none.source === 'pages' && none.richTexts.length === 0, 'pickLegalSource: sin doc ni global no truena', JSON.stringify(none))
}

function checkSharedHelper(): void {
  for (const key of ['privacy', 'terms']) {
    const file = path.join(ROOT, 'src', 'app', '(frontend)', '[locale]', key, 'page.tsx')
    if (!fs.existsSync(file)) {
      failures += 1
      console.log(`FAIL ${key} (g) ruta: no existe ${file}`)
      continue
    }
    const src = fs.readFileSync(file, 'utf8')
    check(
      src.includes(`pickLegalSource(doc, legal, '${key}')`) &&
        src.includes('getCachedLegalPages') &&
        src.includes('legalEffective') &&
        !src.includes('extractLegalRichTexts') &&
        !/updatedAt/.test(src),
      `${key} (g) la ruta usa el helper compartido y no updatedAt`,
      'la ruta no usa pickLegalSource, o llama extractLegalRichTexts, o lee updatedAt',
    )
    const metaBlock = src.slice(src.indexOf('export async function generateMetadata'), src.indexOf('export default'))
    check(
      !metaBlock.includes('legal') && metaBlock.includes('getPage(locale)'),
      `${key} (g) generateMetadata sigue saliendo del doc pages`,
      'generateMetadata toca el global',
    )
  }
}

function main(): void {
  checkHelpers()
  runKey('privacy')
  runKey('terms')
  checkSharedHelper()

  if (failures > 0) {
    console.log(`\n${failures} FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 56-legal-ssr: privacy y terms, respaldo, texto nuevo y fecha efectiva')
}

main()
