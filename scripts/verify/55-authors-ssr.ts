/**
 * Arnes SSR de autores (fase 55, plan 55-12): indice y, luego, perfil.
 *
 * Renderiza las vistas con fixtures INVENTADOS por 54-ssr-harness y comprueba
 * estructura. No toca base ni red. Ningun texto sale del sandbox (D-02).
 *
 *   node_modules/.bin/tsx scripts/verify/55-authors-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { AuthorsIndexView } from '../../src/components/pages/authors/AuthorsIndexView'
import {
  toAuthorsIndexProps,
  type AuthorIndexDocLike,
  type AuthorIndexItem,
} from '../../src/lib/authors-data'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

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

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Autores', href: '/authors' },
]

// ---------------------------------------------------------------------------
// Indice
// ---------------------------------------------------------------------------

const INDEX_DOCS: AuthorIndexDocLike[] = [
  {
    id: 1,
    slug: 'ana-de-prueba',
    name: 'Ana de Prueba',
    jobTitle: 'Ingeniera de datos',
    bio: 'Primer parrafo de la bio de Ana.\n\nSegundo parrafo que no va en el extracto.',
    avatar: { url: 'https://res.example.test/ana.jpg', alt: 'Retrato de Ana de Prueba', width: 640, height: 640 },
    yearsExperience: 7,
  },
  {
    id: 2,
    slug: 'beto-sin-foto',
    name: 'Beto Sin Foto',
    jobTitle: null,
    bio: null,
    avatar: null,
    yearsExperience: null,
  },
  // Sin alt en Media: el alt cae al nombre del autor.
  {
    id: 3,
    slug: 'carla-de-ejemplo',
    name: 'Carla de Ejemplo',
    jobTitle: 'Editora',
    bio: 'Bio de Carla.',
    avatar: { url: 'https://res.example.test/carla.jpg', alt: null, width: null, height: null },
  },
]

/** Contrato estructural que el indice debe cumplir. Devuelve los motivos de fallo. */
function indexFailures(rawHtml: string, items: AuthorIndexItem[]): string[] {
  const reasons: string[] = []
  // Las reglas de Emotion (`<style>`) traen llaves y urls: no son marcado visible.
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const h1 = headingLevels(html).filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (const item of items) {
    const re = new RegExp(`href="(?:/en)?/authors/${item.slug}"`, 'g')
    if (countOf(html, re) !== 1) reasons.push(`se esperaba un enlace a /authors/${item.slug} y hay ${countOf(html, re)}`)
    if (item.avatar) {
      const img = new RegExp(`<img[^>]*src="${item.avatar.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`).exec(html)?.[0] ?? ''
      if (img === '') reasons.push(`falta la imagen de ${item.slug}`)
      else if (!/\salt="[^"]+"/.test(img)) reasons.push(`la imagen de ${item.slug} no tiene alt`)
    }
  }
  const withAvatar = items.filter((i) => i.avatar).length
  if (countOf(html, /<img\s/g) !== withAvatar) reasons.push(`se esperaban ${withAvatar} imagenes y hay ${countOf(html, /<img\s/g)}`)
  // Cada autor es un h2 (el h1 es el de la pagina).
  const h2 = headingLevels(html).filter((l) => l === 2).length
  if (items.length > 0 && h2 !== items.length) reasons.push(`se esperaban ${items.length} h2 de autor y hay ${h2}`)
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  return reasons
}

function renderIndex(items: AuthorIndexItem[], locale: 'es' | 'en'): string {
  return renderToHtml(createElement(AuthorsIndexView, { crumbs: CRUMBS, title: 'Autores', items }), locale)
}

function mainIndex(): void {
  const items = toAuthorsIndexProps(INDEX_DOCS, 'es')
  check(items.length === 3, 'indice props: tres autores con slug y nombre', `${items.length}`)
  check(items[0]?.excerpt === 'Primer parrafo de la bio de Ana.', 'indice props: el extracto es el primer parrafo', `${items[0]?.excerpt}`)
  check(items[1]?.avatar === null && items[1]?.excerpt === null, 'indice props: sin avatar ni bio queda null', JSON.stringify(items[1]))
  check(items[2]?.avatar?.alt === 'Carla de Ejemplo', 'indice props: sin alt en Media, el alt es el nombre', `${items[2]?.avatar?.alt}`)
  check(
    toAuthorsIndexProps([{ slug: '', name: 'Sin slug' }, { slug: 'sin-nombre', name: '  ' }], 'es').length === 0,
    'indice props: sin slug o sin nombre no hay tarjeta',
    'produjo una tarjeta',
  )

  for (const locale of ['es', 'en'] as const) {
    const html = renderIndex(items, locale)
    const reasons = indexFailures(html, items)
    check(reasons.length === 0, `indice ${locale}: contrato completo`, reasons.join('; '))
    check(/alt="Retrato de Ana de Prueba"/.test(html), `indice ${locale}: la imagen usa el alt de Media`, 'falta el alt de Media')
    check(/width="640"[^>]*height="640"|height="640"[^>]*width="640"/.test(html), `indice ${locale}: la imagen lleva ancho y alto de Media`, 'faltan las medidas')
  }

  // Lista vacia: estado vacio y un h1, sin lista.
  const emptyHtml = renderIndex([], 'es')
  check(
    /Próximamente/.test(textOf(emptyHtml)) && headingLevels(emptyHtml).filter((l) => l === 1).length === 1 && countOf(emptyHtml, /<ul[\s>]/) === 0,
    'indice vacio: estado vacio, un h1 y ninguna tarjeta',
    'falta el estado vacio o el h1',
  )

  // Fixtures defectuosos: deben fallar.
  const good = renderIndex(items, 'es')
  const twoH1 = good.replace('</section>', '<h1>otro</h1></section>')
  check(indexFailures(twoH1, items).some((r) => r.includes('h1')), 'defectuoso: dos h1 se detecta', 'el contrato no detecto dos h1')
  const missing = good.replace(/href="\/authors\/ana-de-prueba"/g, 'href="#"')
  check(indexFailures(missing, items).some((r) => r.includes('ana-de-prueba')), 'defectuoso: autor sin enlace se detecta', 'el contrato no detecto el enlace faltante')
  const noAlt = good.replace(/alt="Retrato de Ana de Prueba"/, 'alt=""')
  check(indexFailures(noAlt, items).some((r) => r.includes('alt')), 'defectuoso: imagen sin alt se detecta', 'el contrato no detecto la imagen sin alt')
}

mainIndex()

if (failures > 0) {
  console.log(`FAIL 55-authors-ssr (${failures})`)
  process.exit(1)
}
console.log('PASS 55-authors-ssr')
