/**
 * Arnes SSR del post del blog (fase 55, plan 55-11): cabecera, cuerpo con ids de
 * cuerpo completo, TOC, progreso de lectura, divulgacion de afiliados, captura de
 * email, relacionados, anterior y siguiente, cierre y aviso de traduccion.
 *
 * Renderiza PostView con fixtures Lexical INVENTADOS (nunca copiados de
 * produccion) por 54-ssr-harness. No toca base ni red.
 *
 *   node_modules/.bin/tsx scripts/verify/55-post-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Incluye fixtures defectuosos que DEBEN fallar (T-55-04: nada de falsos verdes).
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

import * as React from 'react'
import { createElement } from 'react'

// Debe instalarse antes de cargar los modulos que importan next-intl/server
// (el bloque email-capture llega por la accion de suscripcion).
createRequire(import.meta.url)('./55-stub-next-intl-server.cjs')

const { PostView } = await import('../../src/components/pages/blog/PostView')
const { MuiRichText } = await import('../../src/components/mui/rich-text/MuiRichText')
const { Toc } = await import('../../src/components/mui/rich-text/Toc')
const { buildHeadingIdMap } = await import('../../src/components/mui/rich-text/lexical-toc')
const { splitContentForOffer } = await import('../../src/lib/lexical-split')
const { buildArticleJsonLd, toPostViewProps } = await import('../../src/lib/blog-data')
const { countOf, headingLevels, renderToHtml, textOf } = await import('./54-ssr-harness')

import type { PostViewProps } from '../../src/lib/blog-data'

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

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)

// ---------------------------------------------------------------------------
// Fixtures Lexical inventados
// ---------------------------------------------------------------------------

type Node = Record<string, unknown>
const text = (t: string): Node => ({ type: 'text', text: t, version: 1, format: 0 })
const p = (t: string): Node => ({ type: 'paragraph', version: 1, children: [text(t)] })
const heading = (tag: string, t: string): Node => ({ type: 'heading', tag, version: 1, children: [text(t)] })
const codeBlock = (code: string): Node => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { id: `code-${code.length}`, blockType: 'code-block', language: 'typescript', code },
})
const doc = (children: Node[]) =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }) as never

/** Cuerpo con h1, h2 repetido, h3 y un bloque de codigo; sobra de bloques para partirlo. */
const BODY = doc([
  heading('h1', 'Titulo dentro del cuerpo'),
  p('Parrafo uno inventado'),
  heading('h2', 'Seccion repetida'),
  p('Parrafo dos inventado'),
  heading('h3', 'Detalle inventado'),
  codeBlock('const x = 1'),
  p('Parrafo tres inventado'),
  heading('h2', 'Seccion repetida'),
  p('Parrafo cuatro inventado'),
  heading('h2', 'Cierre del cuerpo'),
  p('Parrafo cinco inventado'),
  p('Parrafo seis inventado'),
])

/** Cuerpo sin ningun h2 (solo h3): no debe pintar TOC. Un h3 tras el h1 de pagina es un salto: se ignora en esa prueba. */
const BODY_NO_H2 = doc([
  p('Uno'),
  heading('h3', 'Detalle uno'),
  p('Dos'),
  heading('h3', 'Detalle dos'),
  p('Tres'),
  p('Cuatro'),
  p('Cinco'),
  p('Seis'),
])

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Categoria inventada', href: '/blog/categoria-inventada' },
  { label: 'Post inventado' },
]

const AUTHOR = {
  name: 'Autor Inventado',
  slug: 'autor-inventado',
  jobTitle: 'Cargo inventado',
  bio: 'Biografia inventada del autor',
  yearsExperience: 9,
  credentials: [{ label: 'Credencial inventada' }],
  avatar: { url: 'https://example.invalid/avatar.jpg', alt: 'Retrato inventado' },
}

function fixtureDoc(content: unknown, extra: Record<string, unknown> = {}) {
  return {
    id: 1,
    slug: 'post-inventado',
    title: 'Post inventado',
    excerpt: 'Resumen inventado',
    publishedAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z',
    categories: [{ id: 1, slug: 'categoria-inventada', title: 'Categoria inventada' }],
    author: AUTHOR,
    heroImage: null,
    content,
    ...extra,
  } as Parameters<typeof toPostViewProps>[0]
}

type RenderOpts = {
  locale?: 'es' | 'en'
  slug?: string
  extra?: Record<string, unknown>
}

/** Renderiza PostView como lo hace la ruta: un mapa de ids sobre el cuerpo completo y dos mitades. */
function renderPost(content: unknown, o: RenderOpts = {}): { html: string; view: PostViewProps } {
  const locale = o.locale ?? 'es'
  const d = fixtureDoc(content, { slug: o.slug ?? 'post-inventado', ...(o.extra ?? {}) })
  const view = toPostViewProps(d, { locale, routeSlug: o.slug ?? 'post-inventado' })
  const body = splitContentForOffer(d.content as never)
  const headingIds = buildHeadingIdMap((d.content as { root: never }).root) as Map<object, string>
  const html = renderToHtml(
    createElement(PostView, {
      post: view,
      crumbs: CRUMBS,
      tocLabel: locale === 'es' ? 'Tabla de contenidos' : 'Table of contents',
      before: body.before as never,
      after: body.after as never,
      headingIds,
      ctx: { subscribedState: undefined, postPath: '/blog/categoria-inventada/post-inventado' },
    }),
    locale,
  )
  return { html, view }
}

/** Todos los id="..." del HTML, con repeticiones. */
function allIds(html: string): string[] {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1] as string)
}

/** Hrefs de ancla (#x) del HTML. */
function anchorHrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\shref="#([^"]+)"/g)].map((m) => m[1] as string)
}

/** Hay una lista ol con al menos un enlace de ancla (el TOC). */
function hasTocList(html: string): boolean {
  return /<ol\b[^>]*>(?:(?!<\/ol>)[\s\S])*?<a\b[^>]*\shref="#[^"]+"/i.test(html)
}

// ---------------------------------------------------------------------------
// Contrato estructural del post (cabecera, cuerpo, TOC)
// ---------------------------------------------------------------------------

type Contract = { expectToc: boolean }

/** Motivos de fallo del HTML de un post. Vacio = correcto. */
function postFailures(rawHtml: string, c: Contract): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<(style|script)[\s\S]*?<\/\1>/g, '')

  const levels = headingLevels(html)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un solo h1 de pagina y hay ${h1}`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }

  const ids = allIds(html)
  const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
  if (dup.length > 0) reasons.push(`ids repetidos: ${dup.join(', ')}`)
  const known = new Set(ids)
  const dangling = [...new Set(anchorHrefs(html).filter((a) => !known.has(a) && !known.has(decodeURIComponent(a))))]
  if (dangling.length > 0) reasons.push(`anclas sin destino: ${dangling.join(', ')}`)

  const toc = hasTocList(html)
  if (c.expectToc && !toc) reasons.push('falta la lista del TOC')
  if (!c.expectToc && toc) reasons.push('hay TOC en un cuerpo sin h2')

  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  if (countOf(html, /<article\b[^>]*\sid="post-body"/) !== 1) reasons.push('falta el article con id post-body')
  const visible = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(visible)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  if (visible.includes(EM_DASH) || visible.includes(EN_DASH)) reasons.push('el texto visible trae un guion largo o corto')
  return reasons
}

// ---- Funciones puras de datos ---------------------------------------------
{
  const view = toPostViewProps(fixtureDoc(BODY), { locale: 'es', routeSlug: 'post-inventado' })
  check(
    view.headings[0]?.text === 'Titulo dentro del cuerpo' && view.headings[0]?.level === 2,
    'toPostViewProps: el h1 del cuerpo entra al indice como nivel 2',
    JSON.stringify(view.headings[0]),
  )
  check(
    view.headings.length === 5 && view.headings.some((h) => h.level === 3),
    'toPostViewProps: headings trae h1, h2 y h3 del cuerpo completo',
    `hay ${view.headings.length}`,
  )
  check(
    view.headings.map((h) => h.id).join('|') ===
      [...(buildHeadingIdMap((BODY as { root: never }).root) as Map<object, string>).values()].join('|'),
    'toPostViewProps: los ids del indice son los del mapa del cuerpo',
    'los ids difieren',
  )
  check(view.readingMinutes === 1, 'toPostViewProps: tiempo de lectura minimo 1', String(view.readingMinutes))
  check(view.categorySlug === 'categoria-inventada' && view.categories[0]?.href === '/blog/categoria-inventada', 'toPostViewProps: categoria primaria y enlace', JSON.stringify(view.categories))
  check(view.author?.href === '/authors/autor-inventado' && view.author?.avatar?.url === AUTHOR.avatar.url, 'toPostViewProps: autor con perfil y avatar', JSON.stringify(view.author))
  check(view.translationNotice === null, 'toPostViewProps: ES no lleva aviso de traduccion', JSON.stringify(view.translationNotice))
  const sin = toPostViewProps(fixtureDoc(BODY, { author: null, categories: [] }), { locale: 'es', routeSlug: 'x' })
  check(sin.author === null && sin.categorySlug === 'general', 'toPostViewProps: sin autor ni categoria no revienta y usa general', JSON.stringify({ a: sin.author, c: sin.categorySlug }))
}

// ---- Render: cuerpo completo, un solo h1, ids unicos, TOC ------------------
for (const locale of ['es', 'en'] as const) {
  const { html, view } = renderPost(BODY, { locale })
  const reasons = postFailures(html, { expectToc: true })
  check(reasons.length === 0, `post ${locale}: contrato con h1, h2, h3 y codigo`, reasons.join('; '))
  check(countOf(html, /<h1[\s>]/) === 1, `post ${locale}: un solo h1 (el del hero) aunque el cuerpo traiga uno`, `hay ${countOf(html, /<h1[\s>]/)}`)
  check(/<h2[^>]*id="titulo-dentro-del-cuerpo"/.test(html), `post ${locale}: el h1 del cuerpo se pinta como h2 con id`, 'sin h2 con id')
  const ids = allIds(html)
  check(
    ['seccion-repetida', 'seccion-repetida-2'].every((id) => ids.includes(id)),
    `post ${locale}: las dos mitades comparten numeracion (repetido y repetido-2)`,
    JSON.stringify(ids.filter((i) => i.startsWith('seccion'))),
  )
  const tocHrefs = anchorHrefs(html)
  check(
    view.headings.every((h) => tocHrefs.includes(h.id) && ids.filter((i) => i === h.id).length === 1),
    `post ${locale}: cada href del TOC resuelve a un id unico`,
    `toc=${JSON.stringify(tocHrefs)}`,
  )
  check(countOf(html, /<pre\b/) === 1, `post ${locale}: el bloque de codigo no se pierde`, `hay ${countOf(html, /<pre\b/)} pre`)
  check(/<time\b[^>]*datetime="2026-03-15T10:00:00.000Z"/i.test(html), `post ${locale}: la fecha va en un time con datetime`, 'sin time')
  check(
    locale === 'es' ? /1 min de lectura/.test(html) : /1 min read/.test(html),
    `post ${locale}: tiempo de lectura localizado`,
    'sin tiempo de lectura',
  )
  check(/href="\/authors\/autor-inventado"/.test(html.replace(/href="\/en\/authors/g, 'href="/authors')), `post ${locale}: el autor enlaza a su perfil`, 'sin enlace al autor')
  check(/href="(?:\/en)?\/blog\/categoria-inventada"/.test(html), `post ${locale}: la categoria es un enlace real`, 'sin enlace a la categoria')
}

// ---- Sin h2: no hay TOC ----------------------------------------------------
{
  const { html } = renderPost(BODY_NO_H2)
  const reasons = postFailures(html, { expectToc: false }).filter((r) => !r.startsWith('salto de nivel'))
  check(reasons.length === 0, 'post sin h2 (solo h3): no pinta TOC y el resto del contrato se cumple', reasons.join('; '))
  const plain = renderPost(doc([p('Uno'), p('Dos'), p('Tres'), p('Cuatro'), p('Cinco'), p('Seis')]))
  const plainReasons = postFailures(plain.html, { expectToc: false })
  check(plainReasons.length === 0, 'post sin encabezados: sin TOC y sin fallos', plainReasons.join('; '))
}

// ---- Aviso de traduccion (D-31) --------------------------------------------
{
  const incomplete = renderPost(BODY, { locale: 'en', slug: 'recursividad' })
  check(/role="note"/.test(incomplete.html) && /not available in English yet/.test(incomplete.html), 'EN incompleto: muestra TranslationNotice', 'sin aviso')
  check(/href="\/blog\/categoria-inventada\/recursividad"/.test(incomplete.html), 'EN incompleto: el aviso enlaza a la ruta ES sin prefijo', 'enlace mal formado')
  const complete = renderPost(BODY, { locale: 'en', slug: 'post-inventado' })
  check(!/role="note"/.test(complete.html), 'EN completo: sin aviso', 'mostro el aviso')
  const es = renderPost(BODY, { locale: 'es', slug: 'recursividad' })
  check(!/role="note"/.test(es.html), 'ES con el mismo slug: sin aviso', 'mostro el aviso en ES')
}

// ---- JSON-LD Article extraido sin cambios (D-04, T-55-39) --------------------
{
  const refs = {
    siteUrl: 'https://sitio.invalid',
    sitePersonSlug: 'autor-inventado',
    personRef: { '@id': 'https://sitio.invalid/#person', url: 'https://sitio.invalid/sobre-mi' },
    websiteRef: { '@id': 'https://sitio.invalid/#website' },
  }
  const base = fixtureDoc(BODY)
  const got = buildArticleJsonLd(base as never, {
    locale: 'en',
    routeSlug: 'post-inventado',
    localizedPostPath: '/en/blog/categoria-inventada/post-inventado',
    categoryTitle: 'Categoria inventada',
    refs,
  })
  const fallbackImage = (got.image as string)
  const expected = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Post inventado',
    description: 'Resumen inventado',
    datePublished: '2026-03-15T10:00:00.000Z',
    dateModified: '2026-03-20T10:00:00.000Z',
    author: { '@type': 'Person', name: 'Autor Inventado', ...refs.personRef },
    publisher: { '@type': 'Person', name: 'Juan Carlos Angulo', url: 'https://sitio.invalid' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://sitio.invalid/en/blog/categoria-inventada/post-inventado' },
    image: fallbackImage,
    articleSection: 'Categoria inventada',
    inLanguage: 'en',
    isPartOf: refs.websiteRef,
  }
  let same = true
  let why = ''
  try {
    assert.deepStrictEqual(got, expected)
  } catch (err) {
    same = false
    why = (err as Error).message.split('\n').slice(0, 4).join(' ')
  }
  check(same, 'buildArticleJsonLd: mismos campos y valores que la ruta anterior', why)
  check(/^https?:\/\//.test(fallbackImage), 'buildArticleJsonLd: la imagen es absoluta', fallbackImage)
  const trimmed = buildArticleJsonLd(fixtureDoc(BODY, { excerpt: '', updatedAt: null, author: { name: 'Otra Persona', slug: 'otra' } }) as never, {
    locale: 'es',
    routeSlug: 'post-inventado',
    localizedPostPath: '/blog/categoria-inventada/post-inventado',
    categoryTitle: 'Categoria inventada',
    refs,
  })
  check(!('description' in trimmed) && !('dateModified' in trimmed), 'buildArticleJsonLd: sin resumen ni updatedAt se omiten (no se inventan)', JSON.stringify(Object.keys(trimmed)))
  check(
    JSON.stringify(trimmed.author) === JSON.stringify({ '@type': 'Person', name: 'Otra Persona' }) && trimmed.inLanguage === 'es',
    'buildArticleJsonLd: otro autor no hereda el @id del sitio y ES marca inLanguage es',
    JSON.stringify(trimmed.author),
  )
}

// ---- Fixtures defectuosos: deben fallar --------------------------------------
{
  const { html } = renderPost(BODY)
  const toc = (items: Array<{ id: string; text: string; level: number }>) =>
    renderToHtml(createElement(Toc, { items, label: 'Tabla de contenidos' }), 'es')

  check(postFailures(html.replace('</section>', '<h1>otro</h1></section>'), { expectToc: true }).some((r) => r.includes('h1')), 'defectuoso: dos h1 se detecta', 'no se detecto')
  check(
    postFailures(html.replace('<h2', '<h4'), { expectToc: true }).some((r) => r.includes('salto')),
    'defectuoso: un salto de h1 a h4 se detecta',
    'no se detecto',
  )

  // Mitades sin el mapa compartido: cada una numera por su cuenta (ids repetidos).
  const d = fixtureDoc(BODY)
  const body = splitContentForOffer(d.content as never)
  const view = toPostViewProps(d, { locale: 'es', routeSlug: 'post-inventado' })
  const broken = renderToHtml(
    createElement(
      'div',
      null,
      createElement('h1', null, 'Titulo'),
      createElement('article', { id: 'post-body' }, createElement(MuiRichText, { data: body.before as never }), createElement(MuiRichText, { data: body.after as never })),
      createElement(Toc, { items: view.headings, label: 'Tabla de contenidos' }),
    ),
    'es',
  )
  check(postFailures(broken, { expectToc: true }).some((r) => r.includes('ids repetidos')), 'defectuoso: mitades sin mapa compartido (ids repetidos) se detecta', JSON.stringify(postFailures(broken, { expectToc: true })))

  const dangling = renderToHtml(
    createElement('div', null, createElement('h1', null, 'T'), createElement('article', { id: 'post-body' }, createElement('h2', { id: 'a' }, 'A')), createElement('div', null, '')),
    'es',
  ) + toc([{ id: 'a', text: 'A', level: 2 }, { id: 'no-existe', text: 'B', level: 2 }])
  check(postFailures(dangling, { expectToc: true }).some((r) => r.includes('anclas sin destino')), 'defectuoso: ancla del TOC sin destino se detecta', JSON.stringify(postFailures(dangling, { expectToc: true })))

  const withToc = postFailures(html, { expectToc: false })
  check(withToc.some((r) => r.includes('hay TOC')), 'defectuoso: TOC en un cuerpo sin h2 se detecta', JSON.stringify(withToc))
  check(postFailures(html.replace(/id="post-body"/, 'id="otro"'), { expectToc: true }).some((r) => r.includes('post-body')), 'defectuoso: sin article post-body se detecta', 'no se detecto')
  check(postFailures(html.replace('Parrafo uno inventado', `Texto ${EM_DASH} con raya`), { expectToc: true }).some((r) => r.includes('guion')), 'defectuoso: guion largo se detecta', 'no se detecto')
}

if (failures > 0) {
  console.log(`FAIL 55-post-ssr: ${failures} comprobacion(es) fallida(s)`)
  process.exit(1)
}
console.log('PASS 55-post-ssr')
