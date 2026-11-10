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
const { ReadingProgress } = await import('../../src/components/mui/ReadingProgress')
const { categoryItems, pickPrevNext, pickRelated, toClosingProps, toInlineOffer, toRailOffer } = await import('../../src/lib/blog-data')
const { postHasAffiliateInline, postHasAmazonAffiliateInline } = await import('../../src/lib/post-affiliate-scan')
const { buildHeadingIdMap } = await import('../../src/components/mui/rich-text/lexical-toc')
const { splitContentForOffer } = await import('../../src/lib/lexical-split')
const { buildArticleJsonLd, toPostViewProps } = await import('../../src/lib/blog-data')
const { countOf, headingLevels, renderToHtml, textOf } = await import('./54-ssr-harness')

import type { BlogClosingData, BlogPostItem, PostViewProps } from '../../src/lib/blog-data'

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
  inline?: Parameters<typeof toInlineOffer>[0]
  rail?: Parameters<typeof toRailOffer>[0]
  related?: BlogPostItem[]
  prevNext?: { previous: BlogPostItem | null; next: BlogPostItem | null }
  closing?: BlogClosingData | null
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
      progressLabel: locale === 'es' ? 'Progreso de lectura' : 'Reading progress',
      // Igual que la ruta: el escaneo cubre el contenido ENTERO, nunca las mitades.
      disclosure: postHasAffiliateInline(d.content as never)
        ? { amazon: postHasAmazonAffiliateInline(d.content as never) }
        : null,
      inlineOffer: toInlineOffer(o.inline),
      railOffer: toRailOffer(o.rail),
      related: o.related ?? [],
      prevNext: o.prevNext ?? { previous: null, next: null },
      closing: o.closing ?? null,
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
  check(!/not available in English yet/.test(complete.html), 'EN completo: sin aviso', 'mostro el aviso')
  const es = renderPost(BODY, { locale: 'es', slug: 'recursividad' })
  check(!/todavía no está disponible en inglés/.test(es.html), 'ES con el mismo slug: sin aviso', 'mostro el aviso en ES')
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

// ===========================================================================
// Tarea 2: progreso de lectura, divulgacion de afiliados y ofertas MUI
// ===========================================================================

const AFFILIATE_LINK = { id: 7, name: 'Herramienta inventada', tagline: 'Una linea inventada', program: 'otro', active: true, slug: 'herramienta-inventada', ctaLabel: 'Probar la herramienta' }
const affiliateBlock = (): Node => ({ type: 'block', version: 2, format: '', fields: { id: 'afiliado-fixture', blockType: 'affiliate-inline', affiliateLink: AFFILIATE_LINK } })

/** Cuerpo con el bloque de afiliado en la SEGUNDA mitad: ninguna mitad por separado lo vera completo. */
const BODY_AFFILIATE = doc([
  p('Apertura inventada'),
  heading('h2', 'Primera seccion'),
  p('Parrafo uno'),
  p('Parrafo dos'),
  p('Parrafo tres'),
  heading('h2', 'Segunda seccion'),
  p('Parrafo cuatro'),
  p('Parrafo cinco'),
  affiliateBlock(),
  p('Parrafo seis'),
  p('Parrafo siete'),
  p('Parrafo ocho'),
])

const REL_OK = 'rel="sponsored nofollow noopener"'

/** Posicion del primer enlace de afiliado y de la divulgacion en el HTML. */
function affiliateOrder(html: string): { disclosure: number; firstLink: number } {
  return { disclosure: html.indexOf('id="post-disclosure"'), firstLink: html.indexOf('href="/go/') }
}

/** Motivos de fallo de la divulgacion de afiliados de un post que SI trae afiliado inline. */
function disclosureFailures(html: string): string[] {
  const reasons: string[] = []
  const { disclosure, firstLink } = affiliateOrder(html)
  if (firstLink === -1) reasons.push('no hay enlace de afiliado en el HTML')
  if (disclosure === -1) reasons.push('falta la divulgacion de afiliados')
  if (disclosure !== -1 && firstLink !== -1 && disclosure > firstLink) reasons.push('la divulgacion aparece despues del primer enlace de afiliado')
  const a = /<a\b[^>]*\shref="\/go\/[^"]*"[^>]*>/.exec(html)?.[0] ?? ''
  if (a && !a.includes(REL_OK)) reasons.push(`el enlace de afiliado no lleva ${REL_OK}`)
  if (countOf(html, /id="post-disclosure"/) > 1) reasons.push('la divulgacion se repite')
  return reasons
}

/** Motivos de fallo de la barra de progreso. */
function progressFailures(html: string): string[] {
  const reasons: string[] = []
  const tag = /<[a-z]+\b[^>]*\srole="progressbar"[^>]*>/i.exec(html)?.[0] ?? ''
  if (!tag) return ['falta role="progressbar"']
  if (!/\saria-label="[^"]+"/.test(tag)) reasons.push('falta aria-label')
  if (!/\saria-valuemin="0"/.test(tag)) reasons.push('falta aria-valuemin 0')
  if (!/\saria-valuemax="100"/.test(tag)) reasons.push('falta aria-valuemax 100')
  if (!/\saria-valuenow="\d+"/.test(tag)) reasons.push('aria-valuenow no es un entero')
  if (countOf(html, /role="progressbar"/) !== 1) reasons.push('hay mas de una barra de progreso')
  if (/\stabindex=/.test(tag)) reasons.push('la barra recibe foco')
  return reasons
}

// ---- Progreso de lectura ----------------------------------------------------
for (const locale of ['es', 'en'] as const) {
  const html = renderToHtml(createElement(ReadingProgress, { targetId: 'post-body', label: locale === 'es' ? 'Progreso de lectura' : 'Reading progress' }), locale)
  check(progressFailures(html).length === 0, `ReadingProgress ${locale}: role, aria-label, min, max y valuenow entero`, progressFailures(html).join('; '))
}
{
  const { html } = renderPost(BODY)
  check(progressFailures(html).length === 0, 'post: la barra de progreso va en la vista y apunta al article', progressFailures(html).join('; '))
  check(/aria-label="Progreso de lectura"/.test(html), 'post es: el nombre de la barra sale de messages', 'sin etiqueta')
  const good = renderToHtml(createElement(ReadingProgress, { targetId: 'post-body', label: 'Reading progress' }), 'en')
  check(progressFailures(good.replace(/\saria-valuenow="\d+"/, '')).some((r) => r.includes('valuenow')), 'defectuoso: sin aria-valuenow se detecta', 'no se detecto')
  check(progressFailures(good.replace(/\saria-valuemax="100"/, '')).some((r) => r.includes('valuemax')), 'defectuoso: sin aria-valuemax se detecta', 'no se detecto')
  check(progressFailures(good.replace(/\saria-label="[^"]*"/, '')).some((r) => r.includes('aria-label')), 'defectuoso: sin aria-label se detecta', 'no se detecto')
  check(progressFailures(good.replace('role="progressbar"', 'aria-hidden="true"')).some((r) => r.includes('progressbar')), 'defectuoso: barra decorativa aria-hidden se detecta', 'no se detecto')
}

// ---- Divulgacion de afiliados (D-20, T-55-40) ---------------------------------
{
  const whole = (BODY_AFFILIATE as { root: { children: unknown[] } }).root
  const split = splitContentForOffer(BODY_AFFILIATE as never)
  check(
    postHasAffiliateInline(BODY_AFFILIATE as never) && !postHasAffiliateInline(split.before as never),
    'fixture de afiliado: solo el contenido completo lo ve (la primera mitad no)',
    `entero=${postHasAffiliateInline(BODY_AFFILIATE as never)} mitad1=${postHasAffiliateInline(split.before as never)}`,
  )
  check(whole.children.length >= 6 && split.after !== null, 'fixture de afiliado: el cuerpo se parte en dos mitades', 'no se partio')

  for (const locale of ['es', 'en'] as const) {
    const { html } = renderPost(BODY_AFFILIATE, { locale })
    const reasons = disclosureFailures(html)
    check(reasons.length === 0, `afiliado ${locale}: divulgacion antes del primer enlace y rel exacto`, reasons.join('; '))
    check(
      locale === 'es' ? /Algunos enlaces de esta página son de afiliado/.test(html) : /Some of the links on this page are affiliate links/.test(html),
      `afiliado ${locale}: el texto sale del namespace affiliateDisclosure`,
      'sin texto de divulgacion',
    )
    check(!/Como Afiliado de Amazon|As an Amazon Associate/.test(html), `afiliado ${locale}: sin programa Amazon no hay leyenda de Amazon`, 'mostro la leyenda de Amazon')
  }
  const amazon = renderPost(BODY_AFFILIATE, { locale: 'es' }).html
  check(amazon.indexOf('id="post-disclosure"') < amazon.indexOf('href="/go/'), 'afiliado: la divulgacion precede al cuerpo entero', 'orden incorrecto')

  const none = renderPost(BODY)
  check(!/id="post-disclosure"/.test(none.html) && !/href="\/go\//.test(none.html), 'sin afiliado: no hay divulgacion ni enlace /go', 'aparecio divulgacion sin afiliado')

  // Defectuosos: la divulgacion despues del enlace, ausente o con rel flojo.
  const good = renderPost(BODY_AFFILIATE).html
  const disclosureHtml = /<div\b[^>]*\sid="post-disclosure"[\s\S]*?<\/div>/.exec(good)?.[0] ?? ''
  const moved = good.replace(disclosureHtml, '').replace('</article>', `${disclosureHtml}</article>`)
  check(disclosureFailures(moved).some((r) => r.includes('despues')), 'defectuoso: divulgacion despues del primer enlace se detecta', JSON.stringify(disclosureFailures(moved)))
  check(disclosureFailures(good.replace(disclosureHtml, '')).some((r) => r.includes('falta la divulgacion')), 'defectuoso: sin divulgacion se detecta', 'no se detecto')
  check(disclosureFailures(good.replace(REL_OK, 'rel="noopener"')).some((r) => r.includes('rel')), 'defectuoso: afiliado sin sponsored nofollow se detecta', 'no se detecto')
}

// ---- Ofertas MUI --------------------------------------------------------------
{
  const inline = { title: 'Oferta inline inventada', text: 'Texto inventado de la oferta inline', linkLabel: 'Accion inline inventada', linkUrl: '/contacto' }
  const rail = { title: 'Tarjeta de riel inventada', body: 'Cuerpo inventado del riel', linkLabel: 'Accion de riel inventada', linkUrl: '/servicios' }

  for (const locale of ['es', 'en'] as const) {
    const { html } = renderPost(BODY, { locale, inline, rail })
    const at = (needle: string) => html.indexOf(needle)
    check(countOf(html, /Texto inventado de la oferta inline/) === 1, `oferta inline ${locale}: aparece una vez`, `hay ${countOf(html, /Texto inventado de la oferta inline/)}`)
    // El corte cae entre dos secciones: la oferta queda dentro del article, entre dos encabezados del cuerpo.
    const articleStart = at('id="post-body"')
    const firstH2 = html.indexOf('Seccion repetida', articleStart)
    const offer = at('Texto inventado de la oferta inline')
    const lastH2 = html.lastIndexOf('Cierre del cuerpo')
    check(articleStart < firstH2 && firstH2 < offer && offer < lastH2, `oferta inline ${locale}: va entre las dos mitades del cuerpo`, `posiciones ${articleStart}, ${firstH2}, ${offer}, ${lastH2}`)
    check(countOf(html, /Tarjeta de riel inventada/) === 1, `riel ${locale}: la tarjeta aparece una vez`, `hay ${countOf(html, /Tarjeta de riel inventada/)}`)
    check(at('Tarjeta de riel inventada') < articleStart, `riel ${locale}: va en la columna del indice, antes del article en el DOM`, 'orden incorrecto')
    // La autoria (post-author-t) es otro aside, con su propia prueba en la tarea 3.
    const asides = [...html.matchAll(/<aside\b[^>]*>/g)].map((m) => m[0]).filter((a) => !a.includes('post-author-t'))
    check(asides.length === 2 && asides.every((a) => /aria-label(?:ledby)?=/.test(a)), `ofertas ${locale}: dos aside con nombre accesible`, JSON.stringify(asides))
    const ids = allIds(html)
    check(new Set(ids).size === ids.length, `ofertas ${locale}: ids unicos con el indice y las ofertas`, 'hay ids repetidos')
    check(/href="(?:\/en)?\/contacto"/.test(html) && /href="(?:\/en)?\/servicios"/.test(html), `ofertas ${locale}: los enlaces de las ofertas existen`, 'faltan enlaces')
    check(postFailures(html, { expectToc: true }).length === 0, `ofertas ${locale}: el contrato del post se mantiene`, postFailures(html, { expectToc: true }).join('; '))
  }
  const noOffers = renderPost(BODY, { inline: null, rail: null, extra: { author: null } }).html
  check(!/<aside\b/.test(noOffers), 'sin promo: no hay aside vacio', 'aparecio un aside')
  const noText = renderPost(BODY, { inline: { title: 'Solo titulo', text: '' }, rail: { title: '' }, extra: { author: null } }).html
  check(!/Solo titulo/.test(noText) && !/<aside\b/.test(noText), 'oferta sin texto y riel sin titulo no se pintan (igual que la version anterior)', 'pinto una oferta vacia')
  const short = renderPost(doc([p('a'), p('b'), p('c')]), { inline, rail })
  check(!/Texto inventado de la oferta inline/.test(short.html), 'cuerpo corto (no se parte): la oferta inline se omite', 'pinto la oferta inline')
  check(/Tarjeta de riel inventada/.test(short.html), 'cuerpo corto sin TOC: el riel conserva su columna', 'se perdio el riel')
  check(toInlineOffer({ title: 'T', text: 'x', linkLabel: 'L', linkUrl: '' })?.link === null, 'toInlineOffer: una accion sin url se descarta', 'conservo la accion')
  check(toRailOffer({ title: 'T', body: ' ' })?.body === null, 'toRailOffer: cuerpo vacio queda null', 'conservo el cuerpo')
}

// ===========================================================================
// Tarea 3: relacionados, anterior y siguiente, autoria, cierre, captura y enlaces
// ===========================================================================

const CLOSING: BlogClosingData = {
  heading: 'Cierre inventado del blog',
  body: 'Cuerpo inventado del cierre',
  points: ['Punto uno inventado'],
  primary: { label: 'Accion principal inventada', url: '/contacto' },
  secondary: null,
}

/** Posts inventados de una categoria, del mas reciente al mas antiguo. */
function listDocs(): Array<Parameters<typeof pickRelated>[0][number]> {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    slug: `lista-post-${i + 1}`,
    title: `Entrada inventada ${i + 1}`,
    excerpt: `Resumen inventado ${i + 1}`,
    publishedAt: `2026-0${9 - i}-10T10:00:00.000Z`,
    categories: [{ id: i < 6 ? 1 : 2, slug: i < 6 ? 'categoria-inventada' : 'otra-inventada', title: i < 6 ? 'Categoria inventada' : 'Otra inventada' }],
    heroImage: null,
  }))
}

// ---- Funciones puras: anterior, siguiente, relacionados --------------------
{
  const posts = listDocs()
  const inCategory = categoryItems(posts, 'categoria-inventada')
  check(inCategory.length === 6 && inCategory.every((i) => i.categorySlug === 'categoria-inventada'), 'categoryItems: solo las entradas de la categoria', `hay ${inCategory.length}`)

  const middle = pickPrevNext(inCategory, 'lista-post-3')
  check(middle.previous?.slug === 'lista-post-4' && middle.next?.slug === 'lista-post-2', 'pickPrevNext: anterior es la publicada antes y siguiente la publicada despues', JSON.stringify([middle.previous?.slug, middle.next?.slug]))
  const first = pickPrevNext(inCategory, 'lista-post-1')
  check(first.next === null && first.previous?.slug === 'lista-post-2', 'pickPrevNext: la mas reciente no tiene siguiente', JSON.stringify([first.previous?.slug, first.next?.slug]))
  const last = pickPrevNext(inCategory, 'lista-post-6')
  check(last.previous === null && last.next?.slug === 'lista-post-5', 'pickPrevNext: la mas antigua no tiene anterior', JSON.stringify([last.previous?.slug, last.next?.slug]))
  const missing = pickPrevNext(inCategory, 'no-esta')
  check(missing.previous === null && missing.next === null, 'pickPrevNext: un slug que no esta en la lista no devuelve vecinos', JSON.stringify(missing))
  check(pickPrevNext([], 'x').previous === null, 'pickPrevNext: lista vacia', 'devolvio un vecino')

  const related = pickRelated(posts, { slug: 'lista-post-2', categorySlugs: ['categoria-inventada'] })
  check(related.length === 3, 'pickRelated: hasta 3', `hay ${related.length}`)
  check(related.every((r) => r.slug !== 'lista-post-2'), 'pickRelated: excluye el actual', JSON.stringify(related.map((r) => r.slug)))
  check(related.every((r) => r.categorySlug === 'categoria-inventada'), 'pickRelated: solo la misma categoria', JSON.stringify(related.map((r) => r.categorySlug)))
  check(pickRelated(posts, { slug: 'x', categorySlugs: [] }).length === 0, 'pickRelated: sin categorias no hay relacionados', 'devolvio entradas')
  check(pickRelated(posts, { slug: 'lista-post-8', categorySlugs: ['otra-inventada'] }).map((r) => r.slug).join() === 'lista-post-7', 'pickRelated: una categoria con una sola entrada mas devuelve esa', 'resultado inesperado')
  check(toClosingProps(CLOSING)?.heading === CLOSING.heading, 'toClosingProps: el cierre del post usa el mismo formato que el de categoria', 'no convirtio')
}

// ---- Render: relacionados, anterior y siguiente, autoria y cierre -----------
{
  const posts = listDocs()
  const items = categoryItems(posts, 'categoria-inventada')
  const current = 'lista-post-3'
  const relatedItems = pickRelated(posts, { slug: current, categorySlugs: ['categoria-inventada'] })
  const prevNext = pickPrevNext(items, current)

  for (const locale of ['es', 'en'] as const) {
    const { html } = renderPost(BODY, { locale, related: relatedItems, prevNext, closing: CLOSING, slug: current })
    const reasons = postFailures(html, { expectToc: true })
    check(reasons.length === 0, `post completo ${locale}: el contrato se mantiene con autoria, relacionados y cierre`, reasons.join('; '))

    const section = /<section\b[^>]*aria-labelledby="post-related-t"[^>]*>([\s\S]*?)<\/section>/.exec(html)?.[1] ?? ''
    check(section !== '', `relacionados ${locale}: seccion nombrada por su h2`, 'sin seccion post-related-t')
    check(/<h2\b[^>]*id="post-related-t"/.test(section), `relacionados ${locale}: el titulo es un h2`, 'sin h2')
    const cards = countOf(section, /<li[\s>]/)
    check(cards === 3, `relacionados ${locale}: tres tarjetas`, `hay ${cards}`)
    check(!new RegExp(`href="(?:/en)?/blog/categoria-inventada/${current}"`).test(section), `relacionados ${locale}: el actual no aparece`, 'aparece el post actual')
    check(countOf(section, /<h3\b/) === 3, `relacionados ${locale}: cada tarjeta lleva un h3 (sin saltos)`, `h3=${countOf(section, /<h3\b/)}`)

    const nav = new RegExp(`<nav\\b[^>]*aria-label="${locale === 'es' ? 'Entrada anterior y siguiente' : 'Previous and next post'}"[^>]*>([\\s\\S]*?)</nav>`).exec(html)?.[1] ?? ''
    check(nav !== '', `anterior y siguiente ${locale}: nav etiquetada`, 'sin nav')
    check(countOf(nav, /<a\b/) === 2, `anterior y siguiente ${locale}: dos enlaces reales`, `hay ${countOf(nav, /<a\b/)}`)
    check(nav.includes('/blog/categoria-inventada/lista-post-4') && nav.includes('/blog/categoria-inventada/lista-post-2'), `anterior y siguiente ${locale}: apuntan a los vecinos de la categoria`, 'enlaces equivocados')

    const author = /<aside\b[^>]*aria-labelledby="post-author-t"[^>]*>([\s\S]*?)<\/aside>/.exec(html)?.[1] ?? ''
    check(author !== '', `autoria ${locale}: aside nombrado por su h2`, 'sin aside de autor')
    check(/<h2\b[^>]*id="post-author-t"/.test(author), `autoria ${locale}: el nombre accesible sale de un h2`, 'sin h2')
    check(/Autor Inventado/.test(author) && /Biografia inventada/.test(author) && /Credencial inventada/.test(author) && /Cargo inventado/.test(author), `autoria ${locale}: nombre, cargo, bio y credenciales`, 'faltan datos')
    check(/href="(?:\/en)?\/authors\/autor-inventado"/.test(author), `autoria ${locale}: enlace al perfil`, 'sin enlace al perfil')
    check(/9\+ (años de experiencia|years of experience)/.test(author), `autoria ${locale}: anos de experiencia localizados`, 'sin anos')
    check(countOf(html, /Cierre inventado del blog/) === 1, `cierre ${locale}: un solo cierre`, `hay ${countOf(html, /Cierre inventado del blog/)}`)
    check(html.indexOf('Cierre inventado del blog') > html.indexOf('post-related-t'), `cierre ${locale}: despues de los relacionados`, 'orden incorrecto')
  }

  // Extremos: primera entrada sin siguiente; sin autor, sin relacionados y sin cierre.
  const newest = pickPrevNext(items, 'lista-post-1')
  const edge = renderPost(BODY, { prevNext: newest, slug: 'lista-post-1' }).html
  const edgeNav = /<nav\b[^>]*aria-label="Entrada anterior y siguiente"[^>]*>([\s\S]*?)<\/nav>/.exec(edge)?.[1] ?? ''
  check(countOf(edgeNav, /<a\b/) === 1, 'la entrada mas reciente solo ofrece anterior', `enlaces=${countOf(edgeNav, /<a\b/)}`)
  const bare = renderPost(BODY, { extra: { author: null } }).html
  check(!/post-author-t|post-related-t|Entrada anterior y siguiente|Cierre inventado/.test(bare), 'sin autor, relacionados, vecinos ni cierre: no se pinta ninguno de esos bloques', 'aparecio un bloque vacio')
  check(postFailures(bare, { expectToc: true }).length === 0, 'post sin autor: el contrato se mantiene', postFailures(bare, { expectToc: true }).join('; '))

  // Fixtures defectuosos.
  const withRelated = renderPost(BODY, { related: relatedItems, closing: CLOSING, slug: current }).html
  const selfIncluded = pickRelated(posts, { slug: 'otro-slug', categorySlugs: ['categoria-inventada'] })
  const badRelated = renderPost(BODY, { related: selfIncluded, slug: current }).html
  const badSection = /<section\b[^>]*aria-labelledby="post-related-t"[^>]*>([\s\S]*?)<\/section>/.exec(badRelated)?.[1] ?? ''
  check(new RegExp(`href="(?:/en)?/blog/categoria-inventada/${current}"`).test(badSection), 'defectuoso: relacionados que incluyen al actual se detectan', 'la comprobacion no lo distingue')
  check(countOf(withRelated.replace('</section>', '</section>' + (/Cierre inventado[\s\S]*?<\/section>/.exec(withRelated)?.[0] ?? '')), /Cierre inventado del blog/) !== 1, 'defectuoso: dos cierres se detectan', 'no se detecto')
}

// ---- Captura de email y enlaces del propio sitio (D-21, Pitfall 1) ----------
{
  const capture: Node = { type: 'block', version: 2, format: '', fields: { id: 'captura-fixture', blockType: 'email-capture' } }
  const link = (url: string, label: string): Node => ({ type: 'link', version: 1, fields: { linkType: 'custom', url, newTab: false }, children: [text(label)] })
  const BODY_MIXED = doc([
    p('Apertura'),
    heading('h2', 'Primera'),
    p('Uno'),
    p('Dos'),
    { type: 'paragraph', version: 1, children: [text('Mira '), link('https://juan-tech.com/blog/seo/otro', 'el articulo del sitio'), text(' y '), link('https://otro-sitio.invalid/x', 'un sitio externo')] },
    heading('h2', 'Segunda'),
    capture,
    p('Cinco'),
    p('Seis'),
    p('Siete'),
  ])

  /** Motivo de fallo del formulario de captura en la ruta del post. */
  function captureFailures(html: string, postPath: string, locale: string): string[] {
    const reasons: string[] = []
    if (!/<form\b/.test(html)) reasons.push('falta el form de captura')
    if (!/name="email"/.test(html)) reasons.push('falta el campo name email')
    if (!/name="company_website"/.test(html)) reasons.push('falta el campo name company_website')
    const hidden = (name: string, value: string) => new RegExp(`name="${name}"[^>]*value="${value}"|value="${value}"[^>]*name="${name}"`).test(html)
    if (!hidden('postPath', postPath)) reasons.push('falta el oculto postPath')
    if (!hidden('locale', locale)) reasons.push('falta el oculto locale')
    return reasons
  }

  for (const locale of ['es', 'en'] as const) {
    const { html } = renderPost(BODY_MIXED, { locale })
    const reasons = captureFailures(html, '/blog/categoria-inventada/post-inventado', locale)
    check(reasons.length === 0, `captura ${locale}: campos name email y company_website y ocultos postPath y locale`, reasons.join('; '))
    // El texto del namespace emailCapture (oferta del checklist) ya traia guiones largos antes de esta
    // fase y es copy de Juan (fase 56): aqui no se mide su guion, solo la estructura.
    const structural = postFailures(html, { expectToc: true }).filter((r) => !r.includes('guion largo'))
    check(structural.length === 0, `captura ${locale}: el contrato del post se mantiene con el bloque`, structural.join('; '))

    const site = /<a\b[^>]*\shref="https:\/\/juan-tech\.com\/blog\/seo\/otro"[^>]*>/.exec(html)?.[0] ?? ''
    check(site !== '' && !/target=/.test(site) && !/rel=/.test(site), `enlace del sitio ${locale}: href identico a produccion, misma pestana y sin rel`, site || 'no aparece el enlace')
    const ext = /<a\b[^>]*\shref="https:\/\/otro-sitio\.invalid\/x"[^>]*>/.exec(html)?.[0] ?? ''
    check(/target="_blank"/.test(ext) && /rel="noopener noreferrer"/.test(ext), `enlace externo ${locale}: abre pestana nueva con rel`, ext || 'no aparece el enlace')
  }
  const pending = renderToHtml(
    createElement(PostView, {
      post: toPostViewProps(fixtureDoc(BODY_MIXED), { locale: 'es', routeSlug: 'post-inventado' }),
      crumbs: CRUMBS,
      tocLabel: 'Tabla de contenidos',
      progressLabel: 'Progreso de lectura',
      disclosure: null,
      inlineOffer: null,
      railOffer: null,
      related: [],
      prevNext: { previous: null, next: null },
      closing: null,
      before: splitContentForOffer(BODY_MIXED as never).before as never,
      after: splitContentForOffer(BODY_MIXED as never).after as never,
      headingIds: buildHeadingIdMap((BODY_MIXED as { root: never }).root) as Map<object, string>,
      ctx: { subscribedState: 'pending', postPath: '/blog/categoria-inventada/post-inventado' },
    }),
    'es',
  )
  check(!/<form\b/.test(pending) && /Revisa tu correo/.test(pending), 'captura con ?subscribed=pending: el formulario cede al mensaje (inerte en el preview)', 'sigue el formulario o falta el mensaje')

  const good = renderPost(BODY_MIXED).html
  check(captureFailures(good.replace('name="company_website"', 'name="otro"'), '/blog/categoria-inventada/post-inventado', 'es').some((r) => r.includes('company_website')), 'defectuoso: captura sin honeypot se detecta', 'no se detecto')
  check(captureFailures(good.replace(/name="postPath"/g, 'name="x"'), '/blog/categoria-inventada/post-inventado', 'es').some((r) => r.includes('postPath')), 'defectuoso: captura sin postPath se detecta', 'no se detecto')
  check(/target=/.test(/<a\b[^>]*\shref="https:\/\/juan-tech\.com[^"]*"[^>]*>/.exec(good.replace('href="https://juan-tech.com/blog/seo/otro"', 'href="https://juan-tech.com/blog/seo/otro" target="_blank"'))?.[0] ?? ''), 'defectuoso: enlace del sitio con target se distingue del correcto', 'no se distingue')
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
