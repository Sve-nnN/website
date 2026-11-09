/**
 * Autoprueba de render de la busqueda (fase 54, plan 54-11).
 *
 * Renderiza SearchView con el arnes de servidor (tema, next-intl y mensajes
 * reales) y fixtures, sin base de datos. Casos:
 *   - sin consulta: un h1, un form role="search" con name="q", ninguna region role="status";
 *   - con consulta y tres resultados: region status con el conteo, tres h2 con el href
 *     correcto, un Chip por resultado;
 *   - con consulta y cero resultados: h2 de sin resultados y enlaces a /blog y /case-studies;
 *   - con falla: role="alert" y sin region de estado ni resultados;
 *   - la consulta con HTML no se inyecta en crudo;
 *   - en ingles el prefijo /en y las cadenas de messages/en.json;
 *   - ninguna salida abre un main.
 *
 * Limite de largo de la consulta (T-54-43): lo recorta la RUTA
 * (`q?.slice(0, MAX_QUERY_LENGTH)`) y un archivo de ruta de Next no puede exportar
 * una funcion auxiliar, asi que aqui solo se comprueba que la ruta conserva la
 * constante y el recorte (lectura del archivo); el efecto real sobre el
 * `defaultValue` se mide en el preview con scripts/verify/54-search.mjs
 * (consulta de 300 caracteres, el campo llega con 200).
 *
 *   node_modules/.bin/tsx scripts/verify/54-search-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as React from 'react'
import { createElement } from 'react'

import { SearchView, type SearchResult } from '../../src/components/pages/SearchView'
import { countOf, headingLevels, renderToHtml, textOf, type HarnessLocale } from './54-ssr-harness'

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

function messages(locale: HarnessLocale) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', `${locale}.json`), 'utf8')) as {
    search: {
      title: string
      submit: string
      noResultsBody: string
      errorHeading: string
      blogLink: string
      casesLink: string
      typeLabels: Record<string, string>
    }
  }
}

const THREE: SearchResult[] = [
  {
    id: 'a',
    type: 'posts',
    title: 'Auditoria SEO tecnica paso a paso',
    description: 'Descripcion larga '.repeat(30),
    href: '/blog/seo/auditoria-seo-tecnica',
  },
  { id: 'b', type: 'case-studies', title: 'Caso de crecimiento organico', description: null, href: '/case-studies/crecimiento' },
  { id: 'c', type: 'authors', title: 'Juan Carlos Angulo', description: 'Ingeniero de software', href: '/authors/juan' },
]

function render(props: { query: string | null; results: SearchResult[] | null; failed: boolean }, locale: HarnessLocale = 'es') {
  return renderToHtml(createElement(SearchView, props), locale)
}

function noMain(html: string): boolean {
  return countOf(html, /<main[\s>]/) === 0
}

function checkCommon(html: string, name: string) {
  check(countOf(html, /<h1[\s>]/) === 1, `${name}: un h1`, `h1 = ${countOf(html, /<h1[\s>]/)}`)
  check(countOf(html, /<form[^>]*role="search"/) === 1, `${name}: un form role=search`, 'no hay exactamente un form role="search"')
  check(countOf(html, /<input[^>]*name="q"/) === 1, `${name}: un campo name=q`, 'no hay exactamente un input name="q"')
  check(/<input[^>]*type="search"/.test(html), `${name}: el campo es type=search`, 'falta type="search"')
  check(/<label[^>]*for="search-q"/.test(html), `${name}: label visible asociado`, 'falta label for="search-q"')
  check(/autoComplete|autocomplete="off"/.test(html), `${name}: autocomplete off`, 'falta autocomplete="off"')
  check(noMain(html), `${name}: sin main`, 'la vista abre un main')
}

// 1. Sin consulta
{
  const html = render({ query: null, results: null, failed: false })
  checkCommon(html, 'sin consulta')
  check(countOf(html, /role="status"/) === 0, 'sin consulta: ninguna region status', 'aparece una region role="status"')
  check(countOf(html, /role="alert"/) === 0, 'sin consulta: sin alerta', 'aparece un role="alert"')
  check(countOf(html, /<h2[\s>]/) === 0, 'sin consulta: sin h2', 'aparece un h2')
  check(countOf(html, /<ul[\s>]/) === 0, 'sin consulta: sin lista de resultados', 'aparece una lista')
  check(textOf(html).includes(messages('es').search.submit), 'sin consulta: boton "Buscar en el sitio"', 'falta el texto del boton')
  check(/<button[^>]*type="submit"/.test(html), 'sin consulta: boton submit', 'falta button type="submit"')
}

// 2. Con consulta y tres resultados
{
  const html = render({ query: 'seo', results: THREE, failed: false })
  const m = messages('es')
  checkCommon(html, 'con resultados')
  check(
    /<p[^>]*role="status"[^>]*aria-live="polite"|<p[^>]*aria-live="polite"[^>]*role="status"/.test(html),
    'con resultados: region status con aria-live polite',
    'falta la region role="status" aria-live="polite"',
  )
  check(/role="status"[^>]*>3 resultados</.test(html), 'con resultados: conteo plural "3 resultados"', 'el conteo no dice "3 resultados"')
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((x) => x[1])
  check(h2s.length === 3, 'con resultados: tres h2', `h2 = ${h2s.length}`)
  for (const r of THREE) {
    const h2 = h2s.find((x) => x.includes(r.title))
    check(Boolean(h2) && h2!.includes(`href="${r.href}"`), `con resultados: h2 de "${r.title}" enlaza a ${r.href}`, 'el h2 no contiene el enlace esperado')
  }
  check(countOf(html, /<div class="[^"]*MuiChip-root/) === 3, 'con resultados: un Chip por resultado', `chips = ${countOf(html, /<div class="[^"]*MuiChip-root/)}`)
  for (const label of Object.values(m.search.typeLabels)) {
    check(textOf(html).includes(label), `con resultados: etiqueta de tipo "${label}"`, 'falta la etiqueta de tipo')
  }
  check(countOf(html, /<ul[^>]*role="list"/) === 1, 'con resultados: una lista ul role=list', 'falta la lista con role="list"')
  const listHtml = /<ul[^>]*role="list"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? ''
  check(countOf(listHtml, /<li[\s>]/) === 3, 'con resultados: tres li en la lista', `li = ${countOf(listHtml, /<li[\s>]/)}`)
  check(html.includes('Descripcion larga '.repeat(30).trim()), 'con resultados: la descripcion completa queda en el DOM', 'la descripcion aparece recortada en el HTML')
  check(html.includes('-webkit-line-clamp:3') || html.includes('-webkit-line-clamp: 3'), 'con resultados: line-clamp de 3 lineas', 'no hay -webkit-line-clamp: 3')
  check(html.includes(':has(a:focus-visible)'), 'con resultados: foco en la tarjeta con :has', 'falta el selector :has(a:focus-visible)')
  check(countOf(html, /role="alert"/) === 0, 'con resultados: sin alerta', 'aparece un role="alert"')
  check(!textOf(html).includes(m.search.noResultsBody), 'con resultados: sin estado vacio', 'aparece el cuerpo de sin resultados')
  check(/<input[^>]*value="seo"/.test(html), 'con resultados: defaultValue = consulta', 'el campo no trae value="seo"')
}

// 3. Un solo resultado: plural ICU en singular
{
  const html = render({ query: 'seo', results: THREE.slice(0, 1), failed: false })
  check(/role="status"[^>]*>1 resultado</.test(html), 'un resultado: conteo singular "1 resultado"', 'el conteo no dice "1 resultado"')
}

// 4. Con consulta y cero resultados
{
  const html = render({ query: 'zzzzqx', results: [], failed: false })
  const m = messages('es')
  checkCommon(html, 'sin resultados')
  check(/role="status"[^>]*>0 resultados</.test(html), 'sin resultados: region status con "0 resultados"', 'falta el conteo en cero')
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((x) => textOf(x[1]))
  check(h2s.length === 1 && h2s[0] === 'Sin resultados para "zzzzqx"', 'sin resultados: un h2 con noResultsHeading', `h2 = ${JSON.stringify(h2s)}`)
  check(textOf(html).includes(m.search.noResultsBody), 'sin resultados: cuerpo noResultsBody', 'falta el cuerpo')
  check(/href="\/blog"/.test(html) && textOf(html).includes(m.search.blogLink), 'sin resultados: enlace a /blog', 'falta el enlace a /blog')
  check(/href="\/case-studies"/.test(html) && textOf(html).includes(m.search.casesLink), 'sin resultados: enlace a /case-studies', 'falta el enlace a /case-studies')
  check(countOf(html, /<a class="[^"]*MuiButton-outlined/) === 2, 'sin resultados: dos botones outlined', `outlined = ${countOf(html, /<a class="[^"]*MuiButton-outlined/)}`)
  check(countOf(html, /<ul[\s>]/) === 0, 'sin resultados: sin lista', 'aparece una lista')
}

// 5. Falla de la consulta
{
  const html = render({ query: 'seo', results: null, failed: true })
  const m = messages('es')
  checkCommon(html, 'falla')
  check(countOf(html, /role="alert"/) === 1, 'falla: un role=alert', `alert = ${countOf(html, /role="alert"/)}`)
  check(textOf(html).includes(m.search.errorHeading), 'falla: texto errorHeading', 'falta el texto del error')
  check(countOf(html, /role="status"/) === 0, 'falla: sin region status', 'aparece la region de estado')
  check(countOf(html, /<h2[\s>]/) === 0, 'falla: sin h2 de resultados ni de vacio', 'aparece un h2')
  check(/MuiAlert-colorError|MuiAlert-standardError|MuiAlert-outlinedError|MuiAlert-filledError/.test(html), 'falla: severity error', 'el Alert no es de severidad error')
}

// 6. Escape de la consulta
{
  const evil = '"><script>alert(1)</script>'
  const html = render({ query: evil, results: [], failed: false })
  check(!html.includes('<script>alert(1)</script>'), 'escape: el HTML de la consulta no se inyecta en crudo', 'aparece el script en crudo')
  check(html.includes('&lt;script&gt;'), 'escape: la consulta sale escapada', 'no aparece la consulta escapada')
}

// 7. Ingles
{
  const html = render({ query: 'seo', results: [], failed: false }, 'en')
  const m = messages('en')
  check(textOf(html).includes('Search the site') && textOf(html).includes(m.search.noResultsBody), 'en: cadenas de messages/en.json', 'faltan las cadenas en ingles')
  check(/href="\/en\/blog"/.test(html) && /href="\/en\/case-studies"/.test(html), 'en: enlaces con prefijo /en', 'faltan los hrefs /en/blog y /en/case-studies')
  check(/role="status"[^>]*>0 results</.test(html), 'en: conteo "0 results"', 'el conteo no dice "0 results"')
  check(/Search/.test(textOf(html)) && JSON.stringify(headingLevels(html)) === '[1,2]', 'en: encabezados h1 y h2', `niveles = ${JSON.stringify(headingLevels(html))}`)

  const withResults = render({ query: 'seo', results: THREE, failed: false }, 'en')
  check(/href="\/en\/case-studies\/crecimiento"/.test(withResults), 'en: href de resultado con prefijo /en', 'falta /en/case-studies/crecimiento')
}

// 8. Limite de largo conservado en la ruta (se mide el efecto en el preview)
{
  const route = fs.readFileSync(path.join(ROOT, 'src/app/(frontend)/[locale]/search/page.tsx'), 'utf8')
  check(/const MAX_QUERY_LENGTH = 200/.test(route), 'limite: MAX_QUERY_LENGTH = 200 en la ruta', 'falta la constante')
  check(/q\?\.slice\(0, MAX_QUERY_LENGTH\)/.test(route), 'limite: la ruta recorta la consulta', 'falta q?.slice(0, MAX_QUERY_LENGTH)')
}

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nPASS 54-search-ssr: todos los casos')
