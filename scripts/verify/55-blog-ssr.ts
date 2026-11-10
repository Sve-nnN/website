/**
 * Arnes SSR del blog (fase 55, plan 55-10): pagina de categoria, indice,
 * newsletter, cierre y busqueda.
 *
 * Renderiza las vistas con fixtures INVENTADOS por 54-ssr-harness y comprueba
 * estructura. No toca base ni red. Ningun texto sale del sandbox (D-02).
 *
 *   node_modules/.bin/tsx scripts/verify/55-blog-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Incluye fixtures defectuosos que DEBEN fallar (T-55-04: nada de falsos verdes).
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import { createRequire } from 'node:module'

import * as React from 'react'
import { createElement } from 'react'

// Debe instalarse antes de cargar los modulos que importan next-intl/server
// (la accion de suscripcion llega por el formulario de newsletter).
createRequire(import.meta.url)('./55-stub-next-intl-server.cjs')

const { BlogClosingMui } = await import('../../src/components/pages/blog/BlogClosingMui')
const { BlogIndexView } = await import('../../src/components/pages/blog/BlogIndexView')
const { CategoryPageView } = await import('../../src/components/pages/blog/CategoryPageView')
const {
  POSTS_PER_CATEGORY,
  filterPosts,
  listableCategories,
  normalizeQuery,
  parseNewsletterNotice,
  toBlogIndexProps,
  toCategoryProps,
  toClosingProps,
  toNavItems,
  toPostItem,
} = await import('../../src/lib/blog-data')
const { countOf, headingLevels, renderToHtml, textOf } = await import('./54-ssr-harness')

import type {
  BlogClosingData,
  BlogIndexProps,
  BlogPageDocLike,
  BlogPostDocLike,
  CategoryPageProps,
  NewsletterNotice,
} from '../../src/lib/blog-data'

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
// Fixtures inventados
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 1, slug: 'tech-inventada', title: 'Tecnica inventada', description: 'Descripcion inventada de la categoria tecnica' },
  { id: 2, slug: 'estrategia-inventada', title: 'Estrategia inventada', description: 'Descripcion inventada de estrategia' },
  { id: 9, slug: 'general', title: 'General', description: null },
]

const pad = (n: number) => String(n).padStart(2, '0')

/** n posts inventados de una categoria, del mas reciente al mas antiguo. */
function fixturePosts(slug: string, title: string, n: number, prefix: string): BlogPostDocLike[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i}`,
    slug: `${prefix}-post-${pad(i + 1)}`,
    title: `Post inventado ${prefix} ${pad(i + 1)}`,
    excerpt: `Resumen inventado ${prefix} ${pad(i + 1)}`,
    publishedAt: `2026-0${(i % 9) + 1}-15T10:00:00.000Z`,
    categories: [{ id: slug === 'tech-inventada' ? 1 : 2, slug, title }],
    heroImage: null,
  }))
}

const TECH_POSTS = fixturePosts('tech-inventada', 'Tecnica inventada', 20, 'tec')
const STRAT_POSTS = fixturePosts('estrategia-inventada', 'Estrategia inventada', 3, 'est')
const ALL_POSTS: BlogPostDocLike[] = [...TECH_POSTS, ...STRAT_POSTS]

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Tecnica inventada' },
]

const CLOSING: BlogClosingData = {
  heading: 'Cierre inventado del blog',
  body: 'Cuerpo inventado del cierre',
  points: ['Punto uno inventado', 'Punto dos inventado'],
  primary: { label: 'Accion principal inventada', url: '/contacto' },
  secondary: { label: 'Accion secundaria inventada', url: '/servicios' },
}

// ---------------------------------------------------------------------------
// Pagina de categoria (tarea 1)
// ---------------------------------------------------------------------------

/** Contrato estructural de la categoria. Devuelve los motivos de fallo. */
function categoryFailures(rawHtml: string, props: CategoryPageProps, expected: number): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<(style|script)[\s\S]*?<\/\1>/g, '')
  const levels = headingLevels(html)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }
  const postLinks = countOf(html, /href="(?:\/en)?\/blog\/[a-z-]+\/[a-z0-9-]+-post-\d+"/)
  if (postLinks !== expected) reasons.push(`se esperaban ${expected} enlaces a posts y hay ${postLinks}`)
  const current = countOf(html, /aria-current="page"/)
  // Las migas llevan su propio aria-current (la pagina actual); la nav lleva el suyo.
  if (current < 1) reasons.push('falta aria-current en la navegacion')
  const nav = /<nav[^>]*aria-label="(?:Categorías del blog|Blog categories)"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? ''
  if (nav === '') reasons.push('falta la navegacion de categorias')
  if (countOf(nav, /aria-current="page"/) !== 1) reasons.push(`la nav debe tener un aria-current y tiene ${countOf(nav, /aria-current="page"/)}`)
  const activeAnchor = [...nav.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]).find((a) => a.includes('aria-current="page"')) ?? ''
  if (!new RegExp(`href="(?:/en)?/blog/${props.category.slug}"`).test(activeAnchor)) {
    reasons.push(`la categoria activa (${props.category.slug}) no es la que marca aria-current`)
  }
  if (/href="(?:\/en)?\/blog\/general"/.test(nav)) reasons.push('general aparece en la navegacion')
  if (/\buseState\b|slice\(0/.test(html)) reasons.push('el HTML trae codigo de revelado')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) reasons.push('el texto visible trae un guion largo o corto')
  return reasons
}

function renderCategory(props: CategoryPageProps, locale: 'es' | 'en', closing: BlogClosingData | null = CLOSING): string {
  return renderToHtml(createElement(CategoryPageView, { ...props, crumbs: CRUMBS, closing }), locale)
}

function mainCategory(): void {
  // Funciones puras.
  const nav = toNavItems(CATEGORIES)
  check(nav.length === 2 && nav.every((n) => n.slug !== 'general'), 'nav props: general no entra en las pestañas', JSON.stringify(nav.map((n) => n.slug)))
  check(nav[0]?.href === '/blog/tech-inventada', 'nav props: la ruta de la categoria no lleva prefijo de idioma', String(nav[0]?.href))
  check(listableCategories(CATEGORIES).length === 2, 'listableCategories: excluye general', 'no excluye general')
  check(listableCategories([{ id: 5, slug: null, title: 'Sin slug' }, { id: 6, slug: 'x', title: '' }]).length === 0, 'listableCategories: sin slug o sin titulo no entra', 'entro')

  const props = toCategoryProps(CATEGORIES[0]!, ALL_POSTS, CATEGORIES, 'es')
  check(props.items.length === 20, 'categoria props: lista TODAS las entradas de la categoria', `hay ${props.items.length}`)
  check(props.items.every((i) => i.categorySlug === 'tech-inventada'), 'categoria props: ninguna entrada de otra categoria', 'se coló otra categoria')
  check(props.items[0]?.href === '/blog/tech-inventada/tec-post-01', 'categoria props: la URL usa la categoria primaria', String(props.items[0]?.href))
  check(props.category.title === 'Tecnica inventada' && props.category.description === 'Descripcion inventada de la categoria tecnica', 'categoria props: nombre y descripcion salen de Payload', JSON.stringify(props.category))
  const general = toCategoryProps(CATEGORIES[2]!, ALL_POSTS, CATEGORIES, 'es')
  check(general.items.length === 0 && general.category.description === null, 'general props: sin entradas ni descripcion', JSON.stringify(general.category))
  check(toPostItem({ slug: 'a', title: '' }) === null && toPostItem({ slug: '', title: 'a' }) === null, 'toPostItem: sin slug o titulo no hay tarjeta', 'devolvio una tarjeta')
  const noCat = toPostItem({ slug: 'sin-cat', title: 'Sin categoria', categories: [] })
  check(noCat?.href === '/blog/general/sin-cat', 'toPostItem: sin categoria usa el segmento general', String(noCat?.href))
  check(Boolean(noCat?.image?.url), 'toPostItem: sin portada hay imagen de respaldo estable', 'sin imagen')

  // Render: 20 enlaces, un h1, nav con aria-current.
  for (const locale of ['es', 'en'] as const) {
    const html = renderCategory(props, locale)
    const reasons = categoryFailures(html, props, 20)
    check(reasons.length === 0, `categoria ${locale}: contrato con 20 entradas`, reasons.join('; '))
    const list = /<ul[^>]*aria-label="(?:Lista de artículos de la categoría|List of posts in the category)"[^>]*>([\s\S]*?)<\/ul>/.exec(html)?.[1] ?? ''
    check(countOf(list, /<li[\s>]/) === 20, `categoria ${locale}: una tarjeta por entrada en una sola lista`, `hay ${countOf(list, /<li[\s>]/)} li`)
    if (locale === 'en') {
      check(/href="\/en\/blog\/tech-inventada\/tec-post-01"/.test(html), 'categoria en: los enlaces llevan el prefijo /en', 'sin prefijo')
    }
  }

  // general: estado vacio y fuera de la navegacion.
  for (const locale of ['es', 'en'] as const) {
    const html = renderCategory(general, locale)
    const text = textOf(html)
    const empty = locale === 'es' ? /Todavía no hay artículos en esta categoría/ : /No posts in this category yet/
    check(empty.test(text), `general ${locale}: muestra el estado vacio`, 'falta el estado vacio')
    check(headingLevels(html).filter((l) => l === 1).length === 1, `general ${locale}: un h1`, 'no hay un h1')
    check(!/href="(?:\/en)?\/blog\/general"/.test(html), `general ${locale}: no se ofrece como enlace`, 'aparece un enlace a general')
    const back = locale === 'es' ? /Ver todo el blog/ : /Browse the whole blog/
    check(back.test(text), `general ${locale}: ofrece volver al blog`, 'sin el enlace de volver')
  }

  // Cierre unico y presente.
  const htmlWithClosing = renderCategory(props, 'es')
  check(countOf(htmlWithClosing, /Cierre inventado del blog/) === 1, 'categoria: un solo cierre', `hay ${countOf(htmlWithClosing, /Cierre inventado del blog/)}`)
  const htmlNoClosing = renderCategory(props, 'es', null)
  check(!/Cierre inventado del blog/.test(htmlNoClosing), 'categoria: sin cierre no pinta nada', 'pinto un cierre')
  check(toClosingProps({ heading: '', body: 'x' }) === null && toClosingProps(null) === null, 'toClosingProps: sin titulo no hay cierre', 'devolvio un cierre')
  const closingProps = toClosingProps({ heading: 'H', points: [{ item: ' ' }, { item: 'a' }], primaryLabel: 'P', primaryUrl: '', secondaryLabel: 'S', secondaryUrl: '/x' })
  check(closingProps?.points.length === 1 && closingProps?.primary === null && closingProps?.secondary?.url === '/x', 'toClosingProps: puntos vacios y accion sin url se descartan', JSON.stringify(closingProps))

  // Fixtures defectuosos: deben fallar.
  const good = renderCategory(props, 'es')
  const cut = toCategoryProps(CATEGORIES[0]!, TECH_POSTS.slice(0, 9), CATEGORIES, 'es')
  check(categoryFailures(renderCategory(cut, 'es'), props, 20).some((r) => r.includes('enlaces a posts')), 'defectuoso categoria: listado recortado a 9 se detecta', 'no se detecto')
  check(categoryFailures(good.replace(/aria-current="page"/g, ''), props, 20).some((r) => r.includes('aria-current')), 'defectuoso categoria: sin aria-current se detecta', 'no se detecto')
  check(categoryFailures(good.replace('</section>', '<h1>otro</h1></section>'), props, 20).some((r) => r.includes('h1')), 'defectuoso categoria: dos h1 se detecta', 'no se detecto')
  const withGeneral = { ...props, nav: [...props.nav, { slug: 'general', title: 'General', href: '/blog/general' }] }
  check(categoryFailures(renderCategory(withGeneral, 'es'), props, 20).some((r) => r.includes('general')), 'defectuoso categoria: general en la navegacion se detecta', 'no se detecto')
  check(categoryFailures(good.replace('Descripcion inventada de la categoria tecnica', `Texto ${EM_DASH} con raya`), props, 20).some((r) => r.includes('guion')), 'defectuoso categoria: guion largo se detecta', 'no se detecto')
  check(categoryFailures(good.replace('<main', '<div'), props, 20).length === 0 && categoryFailures(good.replace('</section>', '</section><main>'), props, 20).some((r) => r.includes('main')), 'defectuoso categoria: un main en la vista se detecta', 'no se detecto')
}

mainCategory()

// ---------------------------------------------------------------------------
// Indice del blog (tarea 2)
// ---------------------------------------------------------------------------

const DOC_TITLE = 'Titulo del documento inventado'
const DOC_LEAD = 'Subtitulo del documento inventado'

const PAGE_DOC: BlogPageDocLike = {
  title: 'Blog (titulo del doc)',
  content: {
    layout: [
      { blockType: 'hero', title: DOC_TITLE, subtitle: DOC_LEAD } as { blockType: string },
      // El orden del CMS manda: estrategia antes que tecnica. `general` se pide y no debe aparecer.
      { blockType: 'blogCategoryRows', postsPerCategory: 3, categoryOrder: [{ category: 2 }, { category: { id: 1 } }, { category: 9 }], viewAllLabel: null } as { blockType: string },
      {
        blockType: 'newsletterBlock',
        title: 'Franja inventada de suscripcion',
        description: 'Descripcion inventada de la franja',
        emailLabel: null,
        submitLabel: null,
        consentText: 'Consentimiento inventado de la franja',
      } as { blockType: string },
    ],
  },
}

const STRAT_8 = fixturePosts('estrategia-inventada', 'Estrategia inventada', 8, 'est')
const INDEX_POSTS: BlogPostDocLike[] = [...TECH_POSTS, ...STRAT_8]

function renderIndex(props: BlogIndexProps, locale: 'es' | 'en', notice: NewsletterNotice | null = null, closing: BlogClosingData | null = CLOSING): string {
  return renderToHtml(
    createElement(BlogIndexView, { ...props, crumbs: [{ label: 'Inicio', href: '/' }, { label: 'Blog' }], newsletterNotice: notice, closing }),
    locale,
  )
}

const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Contrato estructural del indice. Devuelve los motivos de fallo. */
function indexFailures(rawHtml: string, props: BlogIndexProps, perSection: number, closingHeading: string | null = CLOSING.heading): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<(style|script)[\s\S]*?<\/\1>/g, '')
  const levels = headingLevels(html)
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
  if (h1s.length !== 1) reasons.push(`se esperaba un h1 y hay ${h1s.length}`)
  else if (textOf(h1s[0]![1]!) !== props.title) reasons.push(`el h1 "${textOf(h1s[0]![1]!)}" no es el del documento "${props.title}"`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }
  for (const section of props.sections) {
    const re = new RegExp(`<ul[^>]*aria-label="(?:Artículos de|Posts about) ${escapeRe(section.title)}"[^>]*>([\\s\\S]*?)</ul>`)
    const list = re.exec(html)?.[1]
    if (list === undefined) {
      reasons.push(`falta la lista de ${section.slug}`)
      continue
    }
    const cards = countOf(list, /<li[\s>]/)
    if (cards !== perSection) reasons.push(`la categoria ${section.slug} debe tener ${perSection} tarjetas y tiene ${cards}`)
    const more = new RegExp(`<a\\s[^>]*href="(?:/en)?/blog/${escapeRe(section.slug)}"[^>]*>\\s*(?:Ver más|View more)`).test(html)
    if (section.hasMore && !more) reasons.push(`falta el enlace real Ver mas a /blog/${section.slug}`)
    if (!section.hasMore && more) reasons.push(`sobra el enlace Ver mas de ${section.slug}`)
  }
  if (/href="(?:\/en)?\/blog\/general"/.test(html)) reasons.push('general aparece como enlace')
  if (/<h2[^>]*>\s*General\s*<\/h2>/.test(html)) reasons.push('general tiene seccion')
  if (closingHeading !== null && countOf(html, new RegExp(escapeRe(closingHeading))) !== 1) {
    reasons.push(`el cierre debe aparecer una vez y aparece ${countOf(html, new RegExp(escapeRe(closingHeading)))}`)
  }
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) reasons.push('el texto visible trae un guion largo o corto')
  return reasons
}

function mainIndex(): void {
  const props = toBlogIndexProps(PAGE_DOC, CATEGORIES, INDEX_POSTS, 'es')

  // Funciones puras.
  check(props.title === DOC_TITLE && props.lead === DOC_LEAD, 'indice props: h1 y subtitulo salen del documento Pages blog', `${props.title} | ${props.lead}`)
  check(toBlogIndexProps({ title: 'Solo titulo' }, CATEGORIES, [], 'es').title === 'Solo titulo', 'indice props: sin bloque hero usa el titulo del documento', 'no lo uso')
  check(toBlogIndexProps(null, CATEGORIES, [], 'es').title === 'Blog', 'indice props: sin documento el titulo es Blog', 'no es Blog')
  check(props.latest?.slug === 'tec-post-01', 'indice props: la entrada mas reciente es la destacada', String(props.latest?.slug))
  check(props.sections.map((x) => x.slug).join() === 'estrategia-inventada,tech-inventada', 'indice props: orden de categoryOrder y sin general', props.sections.map((x) => x.slug).join())
  check(props.sections.every((x) => x.items.length === POSTS_PER_CATEGORY && POSTS_PER_CATEGORY === 6), 'indice props: seis entradas por categoria', props.sections.map((x) => x.items.length).join())
  const tech = props.sections.find((x) => x.slug === 'tech-inventada')!
  check(tech.total === 20 && tech.hasMore && tech.href === '/blog/tech-inventada', 'indice props: total, hasMore y ruta de Ver mas', JSON.stringify({ t: tech.total, m: tech.hasMore, h: tech.href }))
  check(!tech.items.some((i) => i.slug === 'tec-post-01'), 'indice props: la destacada no se repite en su categoria', 'se repite')
  check(props.sections[0]!.title === 'Estrategia inventada' && props.sections[0]!.description === 'Descripcion inventada de estrategia', 'indice props: nombre y descripcion salen de Payload', JSON.stringify(props.sections[0]))
  check(props.newsletter?.title === 'Franja inventada de suscripcion' && props.newsletter?.emailLabel === null && props.newsletter?.consentText === 'Consentimiento inventado de la franja', 'indice props: textos del bloque newsletter del doc', JSON.stringify(props.newsletter))
  const few = toBlogIndexProps(PAGE_DOC, CATEGORIES, [...TECH_POSTS.slice(0, 5), ...fixturePosts('estrategia-inventada', 'Estrategia inventada', 2, 'est')], 'es')
  check(few.sections.every((x) => !x.hasMore), 'indice props: con pocas entradas no hay Ver mas', JSON.stringify(few.sections.map((x) => x.hasMore)))
  const noOrder = toBlogIndexProps({ content: { layout: [{ blockType: 'blogCategoryRows' }] } }, CATEGORIES, INDEX_POSTS, 'es')
  check(noOrder.sections.map((x) => x.slug).join() === 'tech-inventada,estrategia-inventada', 'indice props: sin categoryOrder usa el orden de las categorias', noOrder.sections.map((x) => x.slug).join())
  check(toBlogIndexProps(PAGE_DOC, CATEGORIES, [], 'es').sections.length === 0, 'indice props: sin posts no hay secciones', 'hay secciones')
  check(toBlogIndexProps({ content: { layout: [{ blockType: 'newsletterBlock', title: ' ' } as { blockType: string }] } }, CATEGORIES, [], 'es').newsletter === null, 'indice props: newsletter sin titulo se omite', 'no se omitio')

  check(parseNewsletterNotice('confirmed') === 'confirmed' && parseNewsletterNotice('unsubscribed') === 'unsubscribed' && parseNewsletterNotice('invalid') === 'invalid', 'parseNewsletterNotice: estados conocidos', 'no los reconoce')
  check(parseNewsletterNotice('<script>') === null && parseNewsletterNotice(['confirmed']) === null && parseNewsletterNotice(undefined) === null, 'parseNewsletterNotice: valores desconocidos se descartan', 'no descarto')

  // Render ES y EN.
  for (const locale of ['es', 'en'] as const) {
    const html = renderIndex(props, locale)
    const reasons = indexFailures(html, props, 6)
    check(reasons.length === 0, `indice ${locale}: contrato con seis tarjetas por categoria`, reasons.join('; '))
    const latestLinks = countOf(html, /href="(?:\/en)?\/blog\/tech-inventada\/tec-post-01"/)
    check(latestLinks === 1, `indice ${locale}: la destacada tiene un solo enlace`, `hay ${latestLinks}`)
    check(/<h2[^>]*>(?:Lo más reciente|Latest)<\/h2>/.test(html), `indice ${locale}: seccion de la entrada destacada`, 'falta')
    if (locale === 'en') {
      check(/href="\/en\/blog\/tech-inventada"/.test(html), 'indice en: Ver mas lleva el prefijo /en', 'sin prefijo')
    }
    const newsletter = (notice: NewsletterNotice | null) => renderIndex(props, locale, notice)
    const form = newsletter(null)
    check(['email', 'locale', 'source', 'company_website'].every((n) => new RegExp(`name="${n}"`).test(form)), `newsletter ${locale}: campos email, locale, source y company_website`, 'falta un campo')
    check(new RegExp(`name="locale" value="${locale}"`).test(form) || new RegExp(`value="${locale}"[^>]*name="locale"`).test(form), `newsletter ${locale}: el campo locale lleva el idioma`, 'valor incorrecto')
    check(!/role="alert"/.test(form) && countOf(form, /id="newsletter-status"/) === 1, `newsletter ${locale}: sin estado hay formulario y region de estado`, 'estado inesperado')
    const confirmed = newsletter('confirmed')
    check(/role="status"[^>]*>(?:Listo, tu correo|Confirmed)/.test(confirmed) && !/name="email"/.test(confirmed), `newsletter ${locale}: confirmed muestra aviso y oculta el formulario`, 'no coincide')
    const unsub = newsletter('unsubscribed')
    check(/role="status"[^>]*>(?:Te diste de baja|You are unsubscribed)/.test(unsub) && !/name="email"/.test(unsub), `newsletter ${locale}: unsubscribed muestra aviso y oculta el formulario`, 'no coincide')
    const invalid = newsletter('invalid')
    check(/role="alert"[^>]*>(?:Ese enlace ya no sirve|That link is no longer valid)/.test(invalid) && /name="email"/.test(invalid), `newsletter ${locale}: invalid avisa y deja el formulario`, 'no coincide')
    check(!/Franja inventada/.test(renderIndex({ ...props, newsletter: null }, locale)), `newsletter ${locale}: sin bloque no se pinta la franja`, 'pinto la franja')
  }
  const formEs = renderIndex(props, 'es')
  check(/Tu correo/.test(formEs) && /Suscribirme/.test(formEs), 'newsletter es: etiquetas por omision de messages', 'faltan')
  check(/Consentimiento inventado de la franja/.test(formEs), 'newsletter es: el consentimiento del doc va antes de enviar', 'falta')
  const formEn = renderIndex(props, 'en')
  check(/Your email/.test(formEn) && /Subscribe/.test(formEn), 'newsletter en: etiquetas por omision de messages', 'faltan')

  // Cierre unico.
  check(!/Cierre inventado del blog/.test(renderIndex(props, 'es', null, null)), 'indice: sin cierre no pinta nada', 'pinto un cierre')

  // Fixtures defectuosos: deben fallar.
  const good = renderIndex(props, 'es')
  const seven = { ...props, sections: props.sections.map((x) => ({ ...x, items: [...x.items, x.items[0]!].map((it, i) => ({ ...it, href: `${it.href}${i === x.items.length ? '-extra' : ''}` })) })) }
  check(indexFailures(renderIndex(seven, 'es'), props, 6).some((r) => r.includes('tarjetas')), 'defectuoso indice: siete tarjetas por categoria se detecta', 'no se detecto')
  check(indexFailures(good.replace(/href="\/blog\/tech-inventada"/g, 'href="#"'), props, 6).some((r) => r.includes('Ver mas')), 'defectuoso indice: Ver mas sin enlace real se detecta', 'no se detecto')
  check(indexFailures(good.replace(DOC_TITLE, 'Otro titulo'), props, 6).some((r) => r.includes('h1')), 'defectuoso indice: h1 distinto del documento se detecta', 'no se detecto')
  const twice = renderToHtml(
    createElement(React.Fragment, null, createElement(BlogIndexView, { ...props, crumbs: [{ label: 'Inicio', href: '/' }], newsletterNotice: null, closing: CLOSING }), createElement(BlogClosingMui, { closing: CLOSING })),
    'es',
  )
  check(indexFailures(twice, props, 6).some((r) => r.includes('cierre')), 'defectuoso indice: cierre duplicado se detecta', 'no se detecto')
  const withGeneral = { ...props, sections: [...props.sections, { slug: 'general', title: 'General', description: null, href: '/blog/general', total: 1, hasMore: false, items: props.sections[0]!.items.slice(0, 6) }] }
  check(indexFailures(renderIndex(withGeneral, 'es'), props, 6).some((r) => r.includes('general')), 'defectuoso indice: seccion general se detecta', 'no se detecto')
  check(indexFailures(good.replace('Descripcion inventada de estrategia', `Texto ${EN_DASH} con raya`), props, 6).some((r) => r.includes('guion')), 'defectuoso indice: guion corto se detecta', 'no se detecto')
}

mainIndex()

// ---------------------------------------------------------------------------
// Busqueda del indice (tarea 3)
// ---------------------------------------------------------------------------

/** Contrato del campo de busqueda en el HTML del servidor, sin consulta. */
function searchFailures(rawHtml: string, locale: 'es' | 'en', expectedLinks: string[]): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<(style|script)[\s\S]*?<\/\1>/g, '')
  const form = /<form\s[^>]*role="search"[^>]*>([\s\S]*?)<\/form>/.exec(html)
  if (!form) return ['falta el form role="search"']
  const tag = /<form\s[^>]*role="search"[^>]*>/.exec(html)![0]
  const action = locale === 'en' ? '/en/search' : '/search'
  if (!new RegExp(`action="${action}"`).test(tag)) reasons.push(`el form no apunta a action="${action}"`)
  if (!/method="get"/i.test(tag)) reasons.push('el form no usa method="get"')
  if (!/aria-label="[^"]+"/.test(tag)) reasons.push('el form role="search" no tiene nombre accesible')
  const input = /<input\s[^>]*name="q"[^>]*>/.exec(form[1]!)?.[0]
  if (!input) reasons.push('falta el campo name="q"')
  else {
    const id = /\sid="([^"]+)"/.exec(input)?.[1]
    if (!id) reasons.push('el campo no tiene id')
    else if (!new RegExp(`<label[^>]*for="${escapeRe(id)}"[^>]*>[^<]*(?:Buscar artículos|Search posts)`).test(form[1]!)) {
      reasons.push('el campo no tiene etiqueta visible asociada')
    }
  }
  if (!/<button[^>]*type="submit"/.test(form[1]!)) reasons.push('falta el boton de enviar')
  // El anuncio de estado esta en el DOM y vacio sin consulta.
  const after = html.slice(html.indexOf(form[0]) + form[0].length)
  const status = /<[a-z0-9]+[^>]*role="status"[^>]*aria-live="polite"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/.exec(after)
  if (!status) reasons.push('falta la region role="status" con aria-live="polite" tras el campo')
  else if (textOf(status[1]!) !== '') reasons.push(`el anuncio de estado no esta vacio sin consulta (${JSON.stringify(textOf(status[1]!))})`)
  if (/data-search-results/.test(html)) reasons.push('hay una lista de resultados sin consulta')
  if (!/data-blog-sections/.test(html)) reasons.push('las secciones del servidor no estan sin consulta')
  for (const href of expectedLinks) {
    if (countOf(html, new RegExp(`href="(?:/en)?${escapeRe(href)}"`)) < 1) reasons.push(`falta el enlace ${href} sin consulta`)
  }
  return reasons
}

function mainSearch(): void {
  // Funciones puras.
  check(normalizeQuery('  Optimización   SEO ') === 'optimizacion seo', 'normalizeQuery: minusculas, sin tildes y espacios colapsados', normalizeQuery('  Optimización   SEO '))
  check(normalizeQuery('') === '' && normalizeQuery('   ') === '', 'normalizeQuery: vacio y solo espacios dan vacio', 'no es vacio')
  const list = [
    { title: 'Optimización de imágenes', excerpt: 'Cómo reducir el peso', slug: 'a' },
    { title: 'Core Web Vitals', excerpt: 'LCP, INP y CLS explicados', slug: 'b' },
    { title: 'Rutas de React', excerpt: null, slug: 'c' },
  ]
  check(filterPosts(list, 'optimizacion').map((x) => x.slug).join() === 'a', 'filterPosts: ignora tildes en el titulo', filterPosts(list, 'optimizacion').map((x) => x.slug).join())
  check(filterPosts(list, 'IMAGENES peso').map((x) => x.slug).join() === 'a', 'filterPosts: cada palabra puede estar en titulo o resumen', filterPosts(list, 'IMAGENES peso').map((x) => x.slug).join())
  check(filterPosts(list, 'inp').map((x) => x.slug).join() === 'b', 'filterPosts: busca en el resumen', filterPosts(list, 'inp').map((x) => x.slug).join())
  check(filterPosts(list, 'rutas').map((x) => x.slug).join() === 'c', 'filterPosts: resumen null no rompe', filterPosts(list, 'rutas').map((x) => x.slug).join())
  check(filterPosts(list, '').length === 0 && filterPosts(list, '   ').length === 0, 'filterPosts: consulta vacia no filtra', 'devolvio resultados')
  check(filterPosts(list, 'zzzzqx').length === 0, 'filterPosts: sin coincidencias da lista vacia', 'devolvio resultados')
  check(filterPosts(list, '<script>alert(1)</script>').length === 0, 'filterPosts: una consulta con HTML es solo texto', 'devolvio resultados')

  const props = toBlogIndexProps(PAGE_DOC, CATEGORIES, INDEX_POSTS, 'es')
  check(props.searchList.length === 28 && props.searchList.every((x) => !('image' in x)), 'busqueda props: lista ligera de todos los posts y sin imagen', `${props.searchList.length}`)
  const links = props.sections.flatMap((x) => x.items.map((i) => i.href))

  for (const locale of ['es', 'en'] as const) {
    const html = renderIndex(props, locale)
    const reasons = searchFailures(html, locale, links)
    check(reasons.length === 0, `busqueda ${locale}: sin consulta el HTML trae el campo, el anuncio vacio y todos los enlaces`, reasons.join('; '))
  }

  // Fixtures defectuosos: deben fallar.
  const good = renderIndex(props, 'es')
  check(searchFailures(good.replace('role="search"', ''), 'es', links).length > 0, 'defectuoso busqueda: sin role search se detecta', 'no se detecto')
  check(searchFailures(good.replace(/for="blog-search-q"/g, 'for="otro"'), 'es', links).some((r) => r.includes('etiqueta')), 'defectuoso busqueda: sin etiqueta asociada se detecta', 'no se detecto')
  check(searchFailures(good.replace('action="/search"', 'action="/otra"'), 'es', links).some((r) => r.includes('action')), 'defectuoso busqueda: action distinto de /search se detecta', 'no se detecto')
  check(searchFailures(good.replace('method="get"', 'method="post"'), 'es', links).some((r) => r.includes('method')), 'defectuoso busqueda: method post se detecta', 'no se detecto')
  const announced = good.replace(/(role="search"[\s\S]*?role="status"[^>]*aria-live="polite"[^>]*>)(<\/)/, '$13 resultados$2')
  check(searchFailures(announced, 'es', links).some((r) => r.includes('anuncio')), 'defectuoso busqueda: anuncio con texto sin consulta se detecta', 'no se detecto')
  check(searchFailures(good.replace(`href="${links[0]}"`, 'href="#"'), 'es', links).some((r) => r.includes(links[0]!)), 'defectuoso busqueda: un enlace menos sin consulta se detecta', 'no se detecto')
  check(searchFailures(good.replace('data-blog-sections', 'data-otro'), 'es', links).some((r) => r.includes('secciones')), 'defectuoso busqueda: secciones del servidor ausentes se detecta', 'no se detecto')
}

mainSearch()

if (failures > 0) {
  console.log(`\nFAIL 55-blog-ssr: ${failures} comprobacion(es) fallaron`)
  process.exit(1)
}
console.log('\nPASS 55-blog-ssr')
