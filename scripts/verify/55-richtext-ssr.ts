/**
 * Prueba SSR del motor de prosa compartido (plan 55-05).
 *
 * Fixtures Lexical inventados (nunca copiados de producción) que ejercitan los
 * huecos de MuiRichText medidos en el corpus del blog: enlaces del propio sitio,
 * ids de encabezados sobre el cuerpo completo, h1 del cuerpo y bloque de captura
 * de email. Incluye fixtures defectuosos que DEBEN fallar, para probar que la
 * comprobación detecta el defecto (T-55-04: nada de falsos verdes).
 *
 * Uso:
 *   node_modules/.bin/tsx scripts/verify/55-richtext-ssr.ts
 * Imprime PASS o FAIL con el motivo y sale con 1 ante cualquier FAIL.
 */
import * as React from 'react'
import { createElement } from 'react'

import { MuiRichText } from '../../src/components/mui/rich-text/MuiRichText'
import { countOf, renderToHtml } from './54-ssr-harness'

// tsx no transforma JSX con `jsx: preserve` y cae al runtime clasico, que busca
// `React` global al renderizar los componentes .tsx. Solo se usa en esta prueba.
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
const para = (...children: Node[]): Node => ({ type: 'paragraph', version: 1, children })
const doc = (children: Node[]) =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }) as never
const link = (url: string, label: string, newTab = false): Node => ({
  type: 'link',
  version: 1,
  fields: { linkType: 'custom', url, newTab },
  children: [text(label)],
})

/** Devuelve la etiqueta <a ...> que contiene `href` exacto, o null. */
function anchorFor(html: string, href: string): string | null {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = html.match(new RegExp(`<a\\b[^>]*\\shref="${escaped}"[^>]*>`))
  return m ? m[0] : null
}

/** Motivo de fallo de un enlace del sitio, o null si es correcto (misma pestaña, sin sufijo). */
function siteLinkProblem(html: string, href: string): string | null {
  const a = anchorFor(html, href)
  if (!a) return `no aparece <a href="${href}">`
  if (/target="_blank"/.test(a)) return 'lleva target _blank'
  if (/rel="noopener noreferrer"/.test(a)) return 'lleva rel noopener noreferrer'
  return null
}

// ---------------------------------------------------------------------------
// Enlaces del propio sitio (Pitfall 1)
// ---------------------------------------------------------------------------
{
  const data = doc([
    para(
      link('https://juan-tech.com/blog/x', 'sitio-sin-www'),
      text(' '),
      link('https://www.juan-tech.com/', 'sitio-con-www'),
      text(' '),
      link('https://example.org/', 'externo'),
      text(' '),
      link('javascript:alert(1)', 'peligroso'),
      text(' '),
      link('https://juan-tech.com.evil.com/x', 'subdominio-falso'),
      text(' '),
      link('https://juan-tech.com/pestana', 'sitio-nueva-pestana', true),
    ),
  ])
  const html = renderToHtml(createElement(MuiRichText, { data }), 'es')

  check(
    'enlace a juan-tech.com: misma pestaña, href intacto, sin target ni rel',
    siteLinkProblem(html, 'https://juan-tech.com/blog/x') === null,
    String(siteLinkProblem(html, 'https://juan-tech.com/blog/x')),
  )
  check(
    'enlace a www.juan-tech.com: misma pestaña, href intacto, sin target ni rel',
    siteLinkProblem(html, 'https://www.juan-tech.com/') === null,
    String(siteLinkProblem(html, 'https://www.juan-tech.com/')),
  )
  const external = anchorFor(html, 'https://example.org/')
  check(
    'enlace externo: target _blank y rel noopener noreferrer',
    Boolean(external && /target="_blank"/.test(external) && /rel="noopener noreferrer"/.test(external)),
    `ancla = ${external}`,
  )
  check(
    'enlace externo conserva el sufijo accesible de pestaña nueva',
    html.includes('(se abre en otra pestaña)'),
    'falta el sufijo de messages',
  )
  check(
    'href javascript: queda como texto sin enlace',
    !/href="javascript:/i.test(html) && html.includes('peligroso'),
    'el href javascript: llegó al HTML o se perdió el texto',
  )
  const fake = anchorFor(html, 'https://juan-tech.com.evil.com/x')
  check(
    'host juan-tech.com.evil.com se trata como externo (T-55-17)',
    Boolean(fake && /target="_blank"/.test(fake)),
    `ancla = ${fake}`,
  )
  const newTab = anchorFor(html, 'https://juan-tech.com/pestana')
  check(
    'fields.newTab sobre un enlace del sitio abre pestaña nueva',
    Boolean(newTab && /target="_blank"/.test(newTab)),
    `ancla = ${newTab}`,
  )
  check(
    'solo 3 enlaces con target _blank (externo, subdominio falso y newTab)',
    countOf(html, /target="_blank"/) === 3,
    `target _blank = ${countOf(html, /target="_blank"/)}`,
  )

  // Fixture defectuoso: un enlace del sitio con target _blank DEBE detectarse.
  const defective = '<p><a href="https://juan-tech.com/blog/x" target="_blank" rel="noopener noreferrer">x</a></p>'
  check(
    'fixture defectuoso (enlace del sitio con target _blank) falla la comprobación',
    siteLinkProblem(defective, 'https://juan-tech.com/blog/x') !== null,
    'la comprobación dejó pasar un enlace del sitio con target _blank',
  )
}

if (failed > 0) {
  console.log(`\n${failed} comprobación(es) con FAIL`)
  process.exit(1)
}
console.log('\nPASS 55-richtext-ssr')
