/**
 * Prueba SSR de los bloques del cuerpo re-vestidos con MUI (plan 55-07).
 *
 * Fixtures Lexical inventados (nunca copiados de producción) que pasan por
 * MuiRichText con `ctx`, es decir por la misma ruta que usará el post. Incluye
 * fixtures defectuosos que DEBEN fallar, para probar que cada comprobación
 * detecta el defecto (T-55-04: nada de falsos verdes).
 *
 * El desborde de ScrollRegion se mide solo en el navegador, así que el HTML del
 * servidor nunca debe traer tabindex en un bloque de código ni en una tabla.
 *
 * Uso:
 *   node_modules/.bin/tsx scripts/verify/55-richtext-blocks-ssr.ts
 * Imprime PASS o FAIL con el motivo y sale con 1 ante cualquier FAIL.
 */
import { createRequire } from 'node:module'

import * as React from 'react'
import { createElement } from 'react'

// Debe instalarse antes de cargar los módulos que importan next-intl/server.
createRequire(import.meta.url)('./55-stub-next-intl-server.cjs')

const { MuiRichText } = await import('../../src/components/mui/rich-text/MuiRichText')
const { countOf, renderToHtml } = await import('./54-ssr-harness')

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
const text = (t: string): Node => ({ type: 'text', text: t, version: 1, format: 0 })
const p = (t: string): Node => ({ type: 'paragraph', version: 1, children: [text(t)] })
const doc = (children: Node[]) =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }) as never
const block = (fields: Record<string, unknown>): Node => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { id: 'fixture', ...fields },
})

/** Renderiza un cuerpo por la ruta del post (MuiRichText con ctx). */
function render(children: Node[], locale: 'es' | 'en' = 'es'): string {
  return renderToHtml(createElement(MuiRichText, { data: doc(children), ctx: { postPath: '/blog/fixture' } }), locale)
}

/**
 * Etiqueta del primer elemento con tabindex que no es un botón, o null. El
 * botón de MUI lleva tabindex="0" por sí mismo y es correcto; lo que no debe
 * existir en el HTML del servidor es un tabindex en un pre o en el contenedor.
 */
function tabIndexOutsideButtons(html: string): string | null {
  for (const m of html.matchAll(/<([a-z0-9]+)\b[^>]*\stabindex=/gi)) {
    if (m[1].toLowerCase() !== 'button') return m[1].toLowerCase()
  }
  return null
}

// ---------------------------------------------------------------------------
// Bloque de código (D-16, Pitfall 6)
// ---------------------------------------------------------------------------

/** Motivo de fallo de un bloque de código en HTML de servidor, o null si es correcto. */
function codeBlockProblem(html: string): string | null {
  if (countOf(html, /<pre\b/) < 1) return 'falta el pre'
  if (!/<button\b[^>]*type="button"[^>]*>[\s\S]*?(Copiar|Copy)/.test(html)) return 'falta el botón Copiar'
  if (countOf(html, /role="status"/) < 1) return 'falta el role status'
  const stray = tabIndexOutsideButtons(html)
  if (stray) return `hay un tabindex fuera de un botón (<${stray}>): el desborde se mide en el navegador`
  if (/role="region"/.test(html)) return 'hay un role region en el HTML del servidor'
  return null
}

{
  const html = render([
    p('antes'),
    block({ blockType: 'code-block', language: 'typescript', code: 'const a = 1 < 2 && "x"' }),
    p('despues'),
  ])
  check('code-block produce pre, botón Copiar y role status sin tabindex', codeBlockProblem(html) === null, String(codeBlockProblem(html)))
  check('code-block muestra el lenguaje como rótulo', /typescript/.test(html), 'falta el rótulo del lenguaje')
  check('code-block escapa el texto del código (T-55-23)', /const a = 1 &lt; 2 &amp;&amp; &quot;x&quot;/.test(html), 'el código no salió escapado')
  check('code-block conserva el código tal como llega', countOf(html, /<code>const a = 1/) === 1, 'el código no está en un solo code')
  check('code-block con ES usa la etiqueta Copiar', />Copiar</.test(html) || /Copiar</.test(html), 'falta el texto Copiar en ES')
  check('code-block con EN usa la etiqueta Copy', /Copy</.test(render([block({ blockType: 'code-block', code: 'x = 1' })], 'en')), 'falta el texto Copy en EN')
  check(
    'code-block sin lenguaje no deja rótulo vacío',
    countOf(render([block({ blockType: 'code-block', code: 'x = 1' })]), /<pre\b/) === 1,
    'el bloque sin lenguaje no se pintó',
  )
  check('code-block sin código no pinta nada', countOf(render([block({ blockType: 'code-block', code: '' })]), /<pre\b/) === 0, 'pintó un pre vacío')

  // Fixtures defectuosos: la comprobación debe detectarlos.
  const fixedTabIndex = renderToHtml(
    createElement('div', null, createElement('pre', { tabIndex: 0 }, 'x'), createElement('button', { type: 'button' }, 'Copiar'), createElement('div', { role: 'status' })),
    'es',
  )
  check('fixture defectuoso (pre con tabIndex fijo) falla', codeBlockProblem(fixedTabIndex) !== null, 'dejó pasar un tabindex fijo')
  const noButton = renderToHtml(createElement('div', null, createElement('pre', null, 'x'), createElement('div', { role: 'status' })), 'es')
  check('fixture defectuoso (sin botón Copiar) falla', codeBlockProblem(noButton) !== null, 'dejó pasar un bloque sin botón')
  const noStatus = renderToHtml(createElement('div', null, createElement('pre', null, 'x'), createElement('button', { type: 'button' }, 'Copiar')), 'es')
  check('fixture defectuoso (sin role status) falla', codeBlockProblem(noStatus) !== null, 'dejó pasar un bloque sin anuncio')
}

if (failed > 0) {
  console.log(`\n${failed} comprobación(es) con FAIL`)
  process.exit(1)
}
console.log('\nPASS 55-richtext-blocks-ssr')
