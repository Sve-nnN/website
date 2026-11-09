/**
 * Arnes SSR del indice de Websites (fase 55, plan 55-01) y, luego, del detalle.
 *
 * Renderiza la vista con fixtures por 54-ssr-harness y comprueba estructura:
 * un solo h1, un enlace a /websites/<slug> por fixture, ningun texto del
 * sandbox y el dominio solo cuando el fixture lo trae. Incluye fixtures
 * defectuosos (dos h1, enlace faltante) que DEBEN fallar. No toca base ni red.
 *
 *   node_modules/.bin/tsx scripts/verify/55-websites-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { WebsitesIndexView } from '../../src/components/pages/websites/WebsitesIndexView'
import { toWebsiteIndexProps, type WebsiteDocLike, type WebsiteIndexItem } from '../../src/lib/websites-data'
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

const media = (name: string) => ({ url: `https://res.example.test/${name}.png`, width: 1280, height: 5622, alt: null })

const DOCS: WebsiteDocLike[] = [
  {
    slug: 'juan-tech-com',
    title: 'Sitio de Juan',
    role: 'Diseno y desarrollo',
    industry: 'Servicios',
    year: 2025,
    stack: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }],
    screenshots: [{ image: media('juan') }],
    lighthouse: { performance: null, accessibility: null, bestPractices: null, seo: null },
    lighthouseCapturedAt: '2026-07-14T17:31:00.000Z',
    client: null,
  },
  {
    slug: 'apturio-com',
    title: 'Apturio',
    role: 'Producto web',
    industry: 'Software',
    year: 2025,
    stack: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }],
    screenshots: [{ image: media('apturio') }],
    lighthouse: { performance: 83, accessibility: 90, bestPractices: 73, seo: 100 },
    lighthouseCapturedAt: '2026-07-14T17:30:38.000Z',
    client: { websiteUrl: 'https://apturio.com', name: 'Apturio' },
  },
  {
    slug: 'estylopia-com',
    title: 'Estylopia',
    role: 'Sitio de contenido',
    industry: 'Moda',
    year: 2023,
    stack: [{ tag: 'WordPress' }, { tag: 'Elementor' }],
    screenshots: [{ image: media('estylopia') }],
    lighthouse: { performance: 67, accessibility: 88, bestPractices: 77, seo: 100 },
    lighthouseCapturedAt: '2026-07-14T17:29:27.000Z',
    client: { websiteUrl: 'https://estylopia.com/', name: 'Estylopia' },
  },
]

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Sitios web', href: '/websites' },
]

/** Contrato estructural que el indice debe cumplir. Devuelve los motivos de fallo. */
function contractFailures(html: string, items: WebsiteIndexItem[]): string[] {
  const reasons: string[] = []
  const h1 = headingLevels(html).filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (const item of items) {
    const re = new RegExp(`href="(?:/en)?/websites/${item.slug}"`, 'g')
    if (countOf(html, re) < 1) reasons.push(`falta el enlace a /websites/${item.slug}`)
  }
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  return reasons
}

function main(): void {
  const items = toWebsiteIndexProps(DOCS, 'es')
  check(items.length === 3, 'props: tres tarjetas', `hay ${items.length}`)
  check(items[0]?.domain === 'juan-tech.com', 'props: dominio del sitio propio derivado del slug', `dio ${items[0]?.domain}`)
  check(items[1]?.domain === 'apturio.com', 'props: dominio del cliente', `dio ${items[1]?.domain}`)
  check(items[2]?.domain === 'estylopia.com', 'props: dominio sin barra final', `dio ${items[2]?.domain}`)
  check(items[0]?.kind === 'nextjs' && items[2]?.kind === 'wordpress', 'props: tipo derivado de stack', `${items[0]?.kind}, ${items[2]?.kind}`)

  for (const locale of ['es', 'en'] as const) {
    const html = renderToHtml(
      createElement(WebsitesIndexView, { crumbs: CRUMBS, title: 'Sitios web', items }),
      locale,
    )
    const reasons = contractFailures(html, items)
    check(reasons.length === 0, `indice ${locale}: contrato`, reasons.join('; '))
  }

  // Fixtures defectuosos: deben fallar.
  const good = renderToHtml(createElement(WebsitesIndexView, { crumbs: CRUMBS, title: 'Sitios web', items }), 'es')
  const twoH1 = good.replace('</section>', '<h1>otro</h1></section>')
  check(contractFailures(twoH1, items).some((r) => r.includes('h1')), 'defectuoso: dos h1 se detecta', 'el contrato no detecto dos h1')
  const missing = good.replace(/href="\/websites\/apturio-com"/g, 'href="#"')
  check(
    contractFailures(missing, items).some((r) => r.includes('apturio-com')),
    'defectuoso: enlace faltante se detecta',
    'el contrato no detecto el enlace faltante',
  )

  if (failures > 0) process.exit(1)
  console.log('PASS 55-websites-ssr')
}

main()
