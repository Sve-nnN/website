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

const { CategoryPageView } = await import('../../src/components/pages/blog/CategoryPageView')
const {
  listableCategories,
  toCategoryProps,
  toClosingProps,
  toNavItems,
  toPostItem,
} = await import('../../src/lib/blog-data')
const { countOf, headingLevels, renderToHtml, textOf } = await import('./54-ssr-harness')

import type { BlogClosingData, BlogPostDocLike, CategoryPageProps } from '../../src/lib/blog-data'

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
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
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

if (failures > 0) {
  console.log(`\nFAIL 55-blog-ssr: ${failures} comprobacion(es) fallaron`)
  process.exit(1)
}
console.log('\nPASS 55-blog-ssr')
