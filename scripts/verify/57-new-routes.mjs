// Rutas nuevas del rediseño: existen en el preview y producción no las tiene (plan 57-02,
// SEO-01, Pitfall 8 de 57-RESEARCH.md).
//
// El crawl de paridad de 57-seo-parity-all.mjs se arma desde el sitemap de producción, así
// que una ruta que producción no tiene quedaría fuera, o peor, se compararía contra un 404.
// Estas rutas se validan contra un contrato propio y nunca contra producción:
//   - estado 200, lang, un solo h1, sin saltos de encabezado y un solo main (checkContract de
//     54-page-contract.mjs, el mismo contrato de página de la fase 54);
//   - title exacto;
//   - canonical propio: https://juan-tech.com + la ruta;
//   - hreflang es, en y x-default con las URLs del par;
//   - los tipos de JSON-LD esperados (Sobre mí no emite JSON-LD nuevo por decisión de la
//     fase 54: ver el comentario de src/app/(frontend)/[locale]/sobre-mi/page.tsx).
//
// Cómo se deriva la lista: `--derive` recorre src/app/(frontend)/[locale]/ y saca las rutas
// estáticas (sin segmentos dinámicos) en es y en. Cada una se clasifica contra producción
// (solo GET, sin seguir redirecciones): está en el sitemap, responde 200 fuera del sitemap,
// redirige, o responde 404. Una ruta que el preview sirve con 200 y producción con 404 tiene
// que figurar en NEW_ROUTES; si no figura, `--derive` sale con 1 y la nombra.
//
// Modos:
//   --selftest   Valida checkNewRoute con un caso válido y defectuosos de un solo campo, y
//                la derivación de rutas estáticas sobre el árbol real del repo.
//   --derive     Deriva y clasifica contra PROD_BASE y BASE_URL (solo GET).
//   (sin modo)   Imprime la lista de rutas nuevas con su contrato.
//
// Variables: BASE_URL (preview, obligatoria con --derive), PROD_BASE (por defecto
// https://juan-tech.com). Nunca escribe en ninguna base: solo GET.

import { readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { checkContract, extractMeta } from './54-page-contract.mjs'

const SITE = 'https://juan-tech.com'
const HERE = dirname(fileURLToPath(import.meta.url))
export const APP_LOCALE_DIR = join(HERE, '..', '..', 'src', 'app', '(frontend)', '[locale]')

/** Par es/en de Sobre mí: misma ruta en ambos idiomas, con /en delante en inglés. */
const aboutAlternates = [`en=${SITE}/en/sobre-mi`, `es=${SITE}/sobre-mi`, `x-default=${SITE}/sobre-mi`]

/**
 * Rutas nuevas con su contrato. `ldTypes` es la lista exacta de tipos de JSON-LD (vacía si la
 * página no debe emitir ninguno) y `hreflang` el conjunto exacto, ordenado.
 */
export const NEW_ROUTES = [
  { path: '/sobre-mi', lang: 'es', title: 'Juan Carlos Angulo', hreflang: aboutAlternates, ldTypes: [] },
  { path: '/en/sobre-mi', lang: 'en', title: 'Juan Carlos Angulo', hreflang: aboutAlternates, ldTypes: [] },
]

/** ¿La ruta es una de las nuevas del rediseño? */
export const isNewRoute = (path) => NEW_ROUTES.some((r) => r.path === path)

/**
 * Valida una ruta nueva contra su contrato. Nunca mira producción.
 * @param {string} html
 * @param {{ path: string, lang: string, title: string, hreflang: string[], ldTypes: string[] }} contract
 * @param {{ status?: number, headers?: Record<string,string>, expectPreview?: boolean }} opts
 * @returns {string[]} fallos
 */
export function checkNewRoute(html, contract, { status = 200, headers = {}, expectPreview = false } = {}) {
  const { failures } = checkContract(html, { lang: contract.lang, path: contract.path, status, headers, expectPreview })
  const meta = extractMeta(html)
  const expectedCanonical = `${SITE}${contract.path}`
  if (meta.title !== contract.title) failures.push(`title distinto del contrato: ${JSON.stringify(meta.title)} (se esperaba ${JSON.stringify(contract.title)})`)
  if (!meta.description) failures.push('meta description vacía')
  if (meta.canonical !== expectedCanonical) failures.push(`canonical ${JSON.stringify(meta.canonical)} (se esperaba ${expectedCanonical})`)
  const hreflang = [...meta.hreflang].sort()
  const expected = [...contract.hreflang].sort()
  if (JSON.stringify(hreflang) !== JSON.stringify(expected)) {
    failures.push(`hreflang ${JSON.stringify(hreflang)} (se esperaba ${JSON.stringify(expected)})`)
  }
  if (JSON.stringify(meta.ldTypes) !== JSON.stringify([...contract.ldTypes].sort())) {
    failures.push(`tipos de JSON-LD ${JSON.stringify(meta.ldTypes)} (se esperaba ${JSON.stringify(contract.ldTypes)})`)
  }
  return failures
}

// ------------------------------------------------------------------ derivación

/**
 * Rutas estáticas del árbol [locale]: cada carpeta con page.tsx cuyo camino no tiene
 * segmentos dinámicos ([x]). Los grupos (x) no suman segmento. Devuelve rutas ES sin prefijo.
 */
export function staticRoutesFromTree(dir = APP_LOCALE_DIR) {
  const out = []
  const walk = (abs, segments) => {
    let entries
    try {
      entries = readdirSync(abs)
    } catch {
      return
    }
    if (entries.includes('page.tsx') && !segments.some((s) => s.startsWith('['))) {
      out.push(`/${segments.filter((s) => !/^\(.*\)$/.test(s)).join('/')}`)
    }
    for (const name of entries) {
      const child = join(abs, name)
      if (statSync(child).isDirectory()) walk(child, [...segments, name])
    }
  }
  walk(dir, [])
  return out.sort()
}

const enOf = (p) => (p === '/' ? '/en' : `/en${p}`)

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) })
    await res.arrayBuffer()
    return { status: res.status, location: res.headers.get('location') ?? '' }
  } catch (err) {
    return { status: 0, location: '', error: err.message }
  }
}

async function derive() {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  const prodBase = (process.env.PROD_BASE ?? SITE).replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria con --derive')
    return 1
  }
  const sm = await fetch(`${prodBase}/sitemap.xml`, { signal: AbortSignal.timeout(30000) })
  const xml = await sm.text()
  const inSitemap = new Set(
    [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
      const p = new URL(m[1]).pathname.replace(/\/$/, '')
      return p || '/'
    }),
  )
  const routes = staticRoutesFromTree().flatMap((p) => [p, enOf(p)])
  let bad = 0
  for (const path of routes) {
    const [prev, prod] = await Promise.all([probe(base + path), probe(prodBase + path)])
    let kind
    if (inSitemap.has(path)) kind = 'en el sitemap de producción'
    else if (prod.status === 200) kind = 'producción 200 fuera del sitemap'
    else if (prod.status >= 300 && prod.status < 400) kind = `producción redirige a ${prod.location}`
    else kind = `producción ${prod.status || prod.error}`
    const isNew = prev.status === 200 && prod.status === 404
    if (isNew && !isNewRoute(path)) {
      bad += 1
      console.log(`FAIL ${path}: preview 200 y producción 404, pero no figura en NEW_ROUTES`)
    } else {
      console.log(`${isNew ? 'NUEVA' : 'OK   '} ${path}: preview ${prev.status || prev.error}, ${kind}`)
    }
  }
  console.log(bad === 0 ? 'PASS 57-new-routes --derive: toda ruta nueva figura en NEW_ROUTES' : `FAIL 57-new-routes --derive (${bad})`)
  return bad === 0 ? 0 : 1
}

// ------------------------------------------------------------------- selftest

export function aboutFixture(o = {}) {
  const {
    title = 'Juan Carlos Angulo',
    canonical = `${SITE}/sobre-mi`,
    hreflang = true,
    h1s = 1,
    ld = false,
    skip = false,
  } = o
  return (
    '<!DOCTYPE html><html lang="es"><head>' +
    `<title>${title}</title><meta name="description" content="Ingeniero de software"/>` +
    '<meta name="robots" content="noindex, nofollow"/>' +
    `<link rel="canonical" href="${canonical}"/>` +
    (hreflang
      ? `<link rel="alternate" hrefLang="es" href="${SITE}/sobre-mi"/><link rel="alternate" hrefLang="en" href="${SITE}/en/sobre-mi"/><link rel="alternate" hrefLang="x-default" href="${SITE}/sobre-mi"/>`
      : `<link rel="alternate" hrefLang="es" href="${SITE}/sobre-mi"/>`) +
    (ld ? '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Juan"}</script>' : '') +
    '</head><body><main>' +
    '<h1>Juan</h1>'.repeat(h1s) +
    (skip ? '<h2>a</h2><h4>b</h4>' : '<h2>a</h2><h3>b</h3>') +
    '</main></body></html>'
  )
}

function selftest() {
  let bad = 0
  const c = NEW_ROUTES[0]
  const expect = (name, failures, wantFail, needle) => {
    const ok = wantFail ? failures.length > 0 && (!needle || failures.some((f) => f.includes(needle))) : failures.length === 0
    if (ok) console.log(`PASS selftest ${name}${wantFail ? `: detecta ${failures.length} fallo(s)` : ': sin fallos'}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: ${JSON.stringify(failures)}`)
    }
  }
  expect('contrato válido de /sobre-mi', checkNewRoute(aboutFixture(), c), false)
  expect('title distinto', checkNewRoute(aboutFixture({ title: 'Sobre mí' }), c), true, 'title')
  expect('canonical ajeno', checkNewRoute(aboutFixture({ canonical: `${SITE}/` }), c), true, 'canonical')
  expect('hreflang incompleto', checkNewRoute(aboutFixture({ hreflang: false }), c), true, 'hreflang')
  expect('dos h1', checkNewRoute(aboutFixture({ h1s: 2 }), c), true, 'h1')
  expect('salto h2 a h4', checkNewRoute(aboutFixture({ skip: true }), c), true, 'salto')
  expect('JSON-LD no previsto', checkNewRoute(aboutFixture({ ld: true }), c), true, 'JSON-LD')
  expect('estado 404', checkNewRoute(aboutFixture(), c, { status: 404 }), true, '404')

  const tree = staticRoutesFromTree()
  const okTree = tree.includes('/sobre-mi') && tree.includes('/') && tree.includes('/contact') && !tree.some((p) => p.includes('['))
  if (okTree) console.log(`PASS selftest derivación del árbol: ${tree.length} rutas estáticas, incluye /sobre-mi y ninguna dinámica`)
  else {
    bad += 1
    console.log(`FAIL selftest derivación del árbol: ${JSON.stringify(tree)}`)
  }
  const pairs = NEW_ROUTES.every((r) => r.lang === 'es' || NEW_ROUTES.some((x) => x.path === r.path.replace(/^\/en/, '')))
  if (pairs && isNewRoute('/en/sobre-mi')) console.log('PASS selftest NEW_ROUTES trae cada ruta con su par EN')
  else {
    bad += 1
    console.log('FAIL selftest NEW_ROUTES sin par EN')
  }
  console.log(bad === 0 ? 'PASS selftest 57-new-routes' : `FAIL selftest 57-new-routes (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  if (args.includes('--selftest')) process.exit(selftest())
  else if (args.includes('--derive')) process.exit(await derive())
  else {
    for (const r of NEW_ROUTES) console.log(`${r.path} (${r.lang}): title ${JSON.stringify(r.title)}, hreflang ${r.hreflang.join(' ')}, JSON-LD ${JSON.stringify(r.ldTypes)}`)
  }
}
