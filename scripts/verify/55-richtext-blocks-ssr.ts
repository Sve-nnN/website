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
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as React from 'react'
import { createElement } from 'react'

// Debe instalarse antes de cargar los módulos que importan next-intl/server.
createRequire(import.meta.url)('./55-stub-next-intl-server.cjs')

const { MuiRichText } = await import('../../src/components/mui/rich-text/MuiRichText')
const { countOf, renderToHtml } = await import('./54-ssr-harness')
const { FaqAccordion } = await import('../../src/components/mui/FaqAccordion')

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

// ---------------------------------------------------------------------------
// Tabla (Pitfall 6, D-29)
// ---------------------------------------------------------------------------
const cell = (t: string, extra: Record<string, unknown> = {}): Node => ({
  type: 'tablecell',
  version: 1,
  headerState: undefined,
  children: [p(t)],
  ...extra,
})
const row = (...cells: Node[]): Node => ({ type: 'tablerow', version: 1, children: cells })
const table = (...rows: Node[]): Node => ({ type: 'table', version: 1, children: rows })

/** Motivo de fallo de una tabla en HTML de servidor, o null si es correcta. */
function tableProblem(html: string, cols: number): string | null {
  if (countOf(html, /<table\b/) !== 1) return 'no hay exactamente una tabla'
  if (countOf(html, /<th\b[^>]*scope="col"/) !== cols) return `se esperaban ${cols} encabezados th con scope col`
  if (countOf(html, /<thead\b/) !== 1) return 'falta el thead'
  const stray = tabIndexOutsideButtons(html)
  if (stray) return `hay un tabindex fuera de un botón (<${stray}>)`
  if (/role="region"/.test(html)) return 'hay un role region en el HTML del servidor'
  return null
}

{
  const html = render([
    table(row(cell('Metrica'), cell('Antes'), cell('Despues')), row(cell('Clics'), cell('10'), cell('40')), row(cell('Posicion'), cell('9'), cell('3'))),
  ])
  check('table sin headerState: primera fila como encabezado con scope col', tableProblem(html, 3) === null, String(tableProblem(html, 3)))
  check('table conserva todas las celdas de datos', countOf(html, /<td\b/) === 6, `td = ${countOf(html, /<td\b/)}`)
  check('table conserva el texto de las celdas', /Posicion/.test(html) && />40</.test(html), 'falta texto de una celda')
  check('table no pone la etiqueta de región en el HTML del servidor', !/Tabla con desplazamiento/.test(html), 'la etiqueta apareció sin desborde')

  const declared = render([
    table(
      row(cell('A1', { headerState: 2 }), cell('B1')),
      row(cell('A2', { headerState: 2 }), cell('B2')),
    ),
  ])
  check('table con headerState declarado respeta el dato (th scope row, sin thead inventado)', countOf(declared, /<th\b[^>]*scope="row"/) === 2 && countOf(declared, /<td\b/) === 2, 'no respetó headerState')

  // Fixture defectuoso: una tabla sin encabezados.
  const noHeaders = renderToHtml(
    createElement('table', null, createElement('tbody', null, createElement('tr', null, createElement('td', null, 'a'), createElement('td', null, 'b')))),
    'es',
  )
  check('fixture defectuoso (tabla sin th) falla', tableProblem(noHeaders, 2) !== null, 'dejó pasar una tabla sin encabezados')
}

// ---------------------------------------------------------------------------
// FAQ (Pitfall 18)
// ---------------------------------------------------------------------------

/** Ids repetidos en el HTML, o []. */
function duplicateIds(html: string): string[] {
  const seen = new Map<string, number>()
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1)
  return [...seen].filter(([, n]) => n > 1).map(([id]) => id)
}

const faqBlock = (id: string, title: string | null, items: Array<[string, string]>): Node =>
  block({
    blockType: 'faq',
    id,
    title,
    faqs: items.map(([q, a], i) => ({ id: `${id}-q${i}`, question: q, answer: doc([p(a)]) })),
  })

{
  const html = render([
    faqBlock('aaa', 'Preguntas del tema', [['Pregunta uno inventada', 'Respuesta uno inventada'], ['Pregunta dos inventada', 'Respuesta dos inventada']]),
    p('entre medias'),
    faqBlock('bbb', null, [['Otra pregunta inventada', 'Otra respuesta inventada']]),
  ])
  check('faq pinta las preguntas y las respuestas en el HTML del servidor', ['Pregunta uno inventada', 'Respuesta uno inventada', 'Pregunta dos inventada', 'Respuesta dos inventada', 'Otra pregunta inventada', 'Otra respuesta inventada'].every((t) => html.includes(t)), 'falta una pregunta o respuesta')
  check('faq con dos bloques no repite ids', duplicateIds(html).length === 0, `ids repetidos: ${duplicateIds(html).join(', ')}`)
  check('faq usa un h2 para el título y h3 para las preguntas', countOf(html, /<h2\b/) === 1 && countOf(html, /<h3\b/) === 3, `h2 = ${countOf(html, /<h2\b/)} h3 = ${countOf(html, /<h3\b/)}`)
  check('faq sin título no deja un h2 vacío', !/<h2[^>]*><\/h2>/.test(html), 'h2 vacío')

  // Fixture defectuoso: dos acordeones con el mismo prefijo.
  const dup = renderToHtml(
    createElement(
      'div',
      null,
      createElement(FaqAccordion, { idPrefix: 'faq-x', items: [{ question: 'q', answer: 'a' }] }),
      createElement(FaqAccordion, { idPrefix: 'faq-x', items: [{ question: 'q', answer: 'a' }] }),
    ),
    'es',
  )
  check('fixture defectuoso (FAQ con id repetido) falla', duplicateIds(dup).length > 0, 'dejó pasar ids repetidos')
}

// ---------------------------------------------------------------------------
// Afiliado inline (Pitfall 19, T-55-24)
// ---------------------------------------------------------------------------
const AFFILIATE_REL = 'sponsored nofollow noopener'
const affiliate = (link: unknown): Node => block({ blockType: 'affiliate-inline', affiliateLink: link })

/** Etiqueta <a> del enlace /go/..., o null. */
function goAnchor(html: string): string | null {
  return html.match(/<a\b[^>]*\shref="\/go\/[^"]*"[^>]*>/)?.[0] ?? null
}

function affiliateRelProblem(html: string): string | null {
  const a = goAnchor(html)
  if (!a) return 'no hay enlace /go/'
  if (!new RegExp(`rel="${AFFILIATE_REL}"`).test(a)) return `el rel no es exactamente "${AFFILIATE_REL}"`
  if (!/target="_blank"/.test(a)) return 'falta target _blank'
  return null
}

{
  const active = render([affiliate({ id: 1, name: 'Herramienta inventada', tagline: 'Una linea inventada', program: 'otro', active: true, slug: 'herramienta-inventada', ctaLabel: 'Probar la herramienta' })])
  check('afiliado activo: enlace /go con rel exacto sponsored nofollow noopener', affiliateRelProblem(active) === null, String(affiliateRelProblem(active)))
  check('afiliado activo muestra nombre, descripción y la etiqueta del CTA', ['Herramienta inventada', 'Una linea inventada', 'Probar la herramienta'].every((t) => active.includes(t)), 'falta nombre, tagline o CTA')
  check('afiliado activo avisa que abre otra pestaña y que es de afiliado', /otra pestaña, enlace de afiliado/.test(active), 'falta el aviso accesible')
  check('afiliado activo no renderiza la divulgación (la pone el post, Pitfall 19)', !/divulgaci|disclosure|afiliados? /i.test(active.replace(/enlace de afiliado/g, '')), 'apareció texto de divulgación')

  const pending = render([affiliate({ id: 2, name: 'Otra herramienta', program: 'otro', active: false, slug: 'otra' })])
  check('afiliado pendiente: sin enlace y con la insignia', goAnchor(pending) === null && /Sin programa de afiliados todavía/.test(pending), 'tiene enlace o falta la insignia')

  const none = render([affiliate({ id: 3, name: 'Consola inventada', program: 'google-search-console', active: true, slug: 'gsc' })])
  check('afiliado ninguno (GSC): sin enlace y sin insignia', goAnchor(none) === null && !/Sin programa de afiliados todavía/.test(none) && /Consola inventada/.test(none), 'mostró enlace o insignia')

  const unpopulated = render([affiliate(5)])
  check('afiliado con id sin poblar no pinta nada ni un id crudo', !/Herramienta|>5</.test(unpopulated) && goAnchor(unpopulated) === null, 'pintó algo sin documento')

  // Fixture defectuoso: rel sin nofollow.
  const badRel = renderToHtml(createElement('a', { href: '/go/x', target: '_blank', rel: 'sponsored noopener' }, 'x'), 'es')
  check('fixture defectuoso (afiliado con rel sin nofollow) falla', affiliateRelProblem(badRel) !== null, 'dejó pasar un rel sin nofollow')
}

// ---------------------------------------------------------------------------
// Captura de email (Pitfall 20, T-55-25, T-55-26)
// ---------------------------------------------------------------------------

/** Motivo de fallo del formulario de captura, o null. */
function emailFormProblem(html: string, postPath: string): string | null {
  if (!/<form\b/.test(html)) return 'falta el form'
  if (!/name="email"/.test(html)) return 'falta el campo email'
  if (!/name="company_website"/.test(html)) return 'falta el honeypot company_website'
  const hidden = (name: string, value: string) =>
    new RegExp(`name="${name}"[^>]*value="${value}"|value="${value}"[^>]*name="${name}"`).test(html)
  if (!hidden('postPath', postPath)) return 'falta el oculto postPath'
  if (!hidden('locale', 'es')) return 'falta el oculto locale'
  return null
}

{
  const capture = block({ blockType: 'email-capture' })
  const html = render([p('antes'), capture, p('despues')])
  check('email-capture trae los cuatro campos (postPath, locale, email, company_website)', emailFormProblem(html, '/blog/fixture') === null, String(emailFormProblem(html, '/blog/fixture')))
  check('email-capture trae el botón de envío y la etiqueta visible del correo', /<button\b[^>]*type="submit"/.test(html) && /<label\b[^>]*>Correo electr/.test(html), 'falta el submit o la etiqueta')
  check('email-capture enlaza la política de privacidad', /href="\/privacy"/.test(html), 'falta el enlace a /privacy')
  check('email-capture no deja ids repetidos', duplicateIds(html).length === 0, `ids repetidos: ${duplicateIds(html).join(', ')}`)

  const stateHtml = (state: string) =>
    renderToHtml(createElement(MuiRichText, { data: doc([capture]), ctx: { postPath: '/blog/fixture', subscribedState: state } }), 'es')
  const pending = stateHtml('pending')
  check('email-capture con ?subscribed=pending cambia el formulario por el mensaje', !/<form\b/.test(pending) && /Revisa tu correo/.test(pending), 'sigue el formulario o falta el mensaje')
  check('email-capture con ?subscribed=already muestra el mensaje', /Ya estás suscrito/.test(stateHtml('already')), 'falta el mensaje already')
  check('email-capture con ?subscribed=error muestra el mensaje', /Algo salió mal/.test(stateHtml('error')), 'falta el mensaje error')
  check('email-capture ignora un valor de subscribed desconocido y no lo interpola (T-49-08)', /<form\b/.test(stateHtml('<script>')) && !/&lt;script/.test(stateHtml('<script>')), 'interpoló o ocultó el formulario')

  const bad = renderToHtml(createElement('form', null, createElement('input', { name: 'email' })), 'es')
  check('fixture defectuoso (formulario sin honeypot ni ocultos) falla', emailFormProblem(bad, '/blog/fixture') !== null, 'dejó pasar un formulario incompleto')
}

// ---------------------------------------------------------------------------
// Auditoría estática del archivo de bloques (T-55-18, T-55-23)
// ---------------------------------------------------------------------------
{
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
  const src = fs.readFileSync(path.join(root, 'src/components/mui/rich-text/blocks.tsx'), 'utf8')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  check('blocks.tsx no importa RichTextRenderer, AffiliateDisclosure ni el FAQ viejo', !/RichTextRenderer|AffiliateDisclosure|blocks\/FAQ|AffiliateInlineCard/.test(code), 'importa un módulo del ciclo prohibido')
  check('blocks.tsx no usa dangerouslySetInnerHTML', !/dangerouslySetInnerHTML/.test(code), 'usa HTML en crudo')
  check('blocks.tsx no fija tabIndex 0', !/tabIndex=\{0\}/.test(code), 'fija tabIndex 0')
}

if (failed > 0) {
  console.log(`\n${failed} comprobación(es) con FAIL`)
  process.exit(1)
}
console.log('\nPASS 55-richtext-blocks-ssr')
