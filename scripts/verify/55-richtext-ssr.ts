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
import { createRequire } from 'node:module'

import * as React from 'react'
import { createElement, type ReactElement } from 'react'

// Debe instalarse antes de cargar los módulos que importan next-intl/server.
createRequire(import.meta.url)('./55-stub-next-intl-server.cjs')

const { MuiRichText } = await import('../../src/components/mui/rich-text/MuiRichText')
const { buildHeadingIdMap, extractHeadings, RESERVED_IDS } = await import(
  '../../src/components/mui/rich-text/lexical-toc'
)
const { buildRichTextConverters, richTextConverters } = await import(
  '../../src/components/richTextBlockConverters'
)
const { splitContentForOffer } = await import('../../src/lib/lexical-split')
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

// ---------------------------------------------------------------------------
// Ids sobre el cuerpo completo, h1 como nivel 2 y ids reservados (Pitfall 2)
// ---------------------------------------------------------------------------
const heading = (tag: string, t: string): Node => ({ type: 'heading', tag, version: 1, children: [text(t)] })
const p = (t: string): Node => para(text(t))

/** Cuántos elementos llevan exactamente ese id. */
function idCount(html: string, id: string): number {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return countOf(html, new RegExp(`\\sid="${escaped}"`))
}

/** Todos los ids de encabezado (h2/h3) presentes en el HTML, con repeticiones. */
function headingIdsIn(html: string): string[] {
  return [...html.matchAll(/<h[23]\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1] as string)
}

/** Motivo de fallo si hay ids repetidos o un id del índice no resuelve, o null. */
function idProblem(html: string, tocIds: string[]): string | null {
  const ids = headingIdsIn(html)
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dup.length > 0) return `ids repetidos: ${[...new Set(dup)].join(', ')}`
  for (const id of tocIds) if (!ids.includes(id)) return `el id del índice "${id}" no existe en el cuerpo`
  return null
}

{
  // h1, h2 y h3; un h2 repetido; "Contacto" (reservado) y suficientes bloques para partir el cuerpo.
  const data = doc([
    heading('h1', 'Titulo en el cuerpo'),
    p('uno'),
    heading('h2', 'Repetido'),
    p('dos'),
    heading('h3', 'Detalle'),
    p('tres'),
    heading('h2', 'Contacto'),
    p('cuatro'),
    heading('h2', 'Repetido'),
    p('cinco'),
    heading('h2', 'Repetido'),
    p('seis'),
  ])
  const root = (data as { root: never }).root
  const entries = extractHeadings(root)
  const ids = entries.map((e) => e.id)

  check(
    'el h1 del cuerpo entra al índice como nivel 2 con id',
    entries[0]?.id === 'titulo-en-el-cuerpo' && entries[0]?.level === 2,
    `entradas = ${JSON.stringify(entries)}`,
  )
  check(
    'dos h2 con el mismo texto reciben ids con sufijo -2 y -3',
    ids.includes('repetido') && ids.includes('repetido-2') && ids.includes('repetido-3'),
    `ids = ${JSON.stringify(ids)}`,
  )
  check(
    'un h2 titulado Contacto no usa el id reservado contacto',
    !ids.includes('contacto') && ids.includes('contacto-2') && [...RESERVED_IDS].every((r) => !ids.includes(r)),
    `ids = ${JSON.stringify(ids)}`,
  )

  const html = renderToHtml(createElement(MuiRichText, { data }), 'es')
  check(
    'el h1 del cuerpo se renderiza como h2 con id y no queda ningún h1',
    countOf(html, /<h1[\s>]/) === 0 && idCount(html, 'titulo-en-el-cuerpo') === 1 && /<h2[^>]*id="titulo-en-el-cuerpo"/.test(html),
    `h1=${countOf(html, /<h1[\s>]/)} id=${idCount(html, 'titulo-en-el-cuerpo')}`,
  )
  check('cuerpo completo: ids únicos y todos los del índice resuelven', idProblem(html, ids) === null, String(idProblem(html, ids)))
  check(
    'la regla vieja (extractHeadings con [2, 3] explícito) sigue excluyendo el h1',
    extractHeadings(root, [2, 3]).every((e) => e.text !== 'Titulo en el cuerpo'),
    'el filtro explícito dejó pasar el h1',
  )

  // Cuerpo partido por la oferta inline: las dos mitades comparten UN mapa.
  const { before, after } = splitContentForOffer(data as never)
  check('el cuerpo del fixture se parte en dos mitades', Boolean(before && after), 'splitContentForOffer no partió el cuerpo')
  const shared = buildHeadingIdMap(root) as Map<object, string>
  const halves = (withMap: boolean) =>
    [before, after]
      .map((half) =>
        renderToHtml(createElement(MuiRichText, { data: half as never, ...(withMap ? { headingIds: shared } : {}) }), 'es'),
      )
      .join('\n')
  const joined = halves(true)
  check('dos mitades con el mismo headingIds: ids únicos y sin huecos', idProblem(joined, ids) === null, String(idProblem(joined, ids)))
  check(
    'las mitades reproducen los ids del índice del cuerpo completo (mismo orden)',
    JSON.stringify(headingIdsIn(joined)) === JSON.stringify(ids),
    `HTML = ${JSON.stringify(headingIdsIn(joined))} índice = ${JSON.stringify(ids)}`,
  )
  // Fixture defectuoso: sin headingIds cada mitad numera por su cuenta y choca con el índice.
  check(
    'fixture defectuoso (mitades sin headingIds) falla la comprobación de ids',
    idProblem(halves(false), ids) !== null,
    'la comprobación dejó pasar mitades con ids repetidos o desalineados',
  )
}

// ---------------------------------------------------------------------------
// Bloque email-capture (Pitfall 3)
// ---------------------------------------------------------------------------
{
  const block: Node = { type: 'block', version: 2, format: '', fields: { id: 'fixture-captura', blockType: 'email-capture' } }
  const data = doc([p('antes'), block, p('despues')])
  const args = { defaultConverters: {} } as never
  const withCtx = (buildRichTextConverters({ postPath: '/blog/fixture', subscribedState: undefined })(args) as {
    blocks?: Record<string, (a: never) => ReactElement>
  }).blocks?.['email-capture']
  const withoutCtx = (richTextConverters(args) as { blocks?: Record<string, unknown> }).blocks?.['email-capture']

  check('el conjunto estático no trae convertidor email-capture (como hoy)', withoutCtx === undefined, 'el estático ya trae email-capture')
  check('buildRichTextConverters(ctx) trae el convertidor email-capture', typeof withCtx === 'function', 'falta el convertidor con ctx')

  if (typeof withCtx === 'function') {
    const el = withCtx({} as never) as ReactElement<{ postPath: string }>
    const card = el.type as unknown as (props: unknown) => Promise<ReactElement>
    const tree = await card(el.props)
    const formHtml = renderToHtml(tree, 'es')
    check('el bloque con ctx produce el input name="email"', /name="email"/.test(formHtml), 'falta name="email"')
    check('el bloque con ctx produce el honeypot name="company_website"', /name="company_website"/.test(formHtml), 'falta company_website')
    check(
      'el bloque con ctx lleva los ocultos postPath y locale',
      /name="postPath"[^>]*value="\/blog\/fixture"|value="\/blog\/fixture"[^>]*name="postPath"/.test(formHtml) &&
        /name="locale"[^>]*value="es"|value="es"[^>]*name="locale"/.test(formHtml),
      'faltan postPath o locale',
    )
  }

  // Por MuiRichText: sin ctx el bloque no se pinta (y Payload avisa); con ctx el
  // render llega al componente asíncrono de captura, que renderToString no puede
  // resolver (solo un Server Component asíncrono suspende así).
  const logged: string[] = []
  const origLog = console.log
  const origWarn = console.warn
  const origError = console.error
  const capture = (...a: unknown[]) => {
    logged.push(a.map(String).join(' '))
  }
  console.log = capture
  console.warn = capture
  console.error = capture
  let noCtxHtml = ''
  let withCtxThrew = ''
  try {
    noCtxHtml = renderToHtml(createElement(MuiRichText, { data }), 'es')
    try {
      renderToHtml(createElement(MuiRichText, { data, ctx: { postPath: '/blog/fixture' } }), 'es')
    } catch (err) {
      withCtxThrew = String((err as Error).message)
    }
  } finally {
    console.log = origLog
    console.warn = origWarn
    console.error = origError
  }
  check('MuiRichText sin ctx no pinta el formulario de captura', !/name="email"/.test(noCtxHtml), 'apareció el formulario sin ctx')
  check(
    'MuiRichText sin ctx deja el aviso de "no converter" (el bloque se pierde sin ctx)',
    logged.some((l) => /no converter is provided/.test(l)),
    'no apareció el aviso de Payload',
  )
  check(
    'MuiRichText con ctx llega al componente de captura (async) y no registra "no converter"',
    /suspended/.test(withCtxThrew) && logged.filter((l) => /no converter is provided/.test(l)).length === 1,
    `error = ${withCtxThrew.slice(0, 80)} avisos = ${logged.filter((l) => /no converter is provided/.test(l)).length}`,
  )
}

if (failed > 0) {
  console.log(`\n${failed} comprobación(es) con FAIL`)
  process.exit(1)
}
console.log('\nPASS 55-richtext-ssr')
