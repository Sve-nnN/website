// Paridad profunda de SEO contra produccion para las superficies de la fase 55
// (plan 55-02, SEO-01, D-04, D-32, T-55-05).
//
// A diferencia de 54-page-contract.mjs, que compara title, description, canonical,
// hreflang y solo los TIPOS de ld+json, este script exige igualdad profunda de:
//   - title, meta description, canonical y el conjunto de hreflang;
//   - todos los og:* y todos los twitter:* (clave y valor, sin importar el orden);
//   - meta robots (y googlebot) normalizado, y la cabecera x-robots-tag;
//   - cada bloque application/ld+json parseado, con @graph aplanado, @context omitido y
//     claves ordenadas de forma estable: se compara el objeto completo, no sus tipos.
// Una diferencia imprime FAIL con ruta, campo y ambos valores.
//
// Rutas: las de las superficies 55 (las mismas que 55-page-contract.mjs, construidas
// desde produccion en vivo) mas los 58 posts en es y en (la URL EN se deriva de la ES
// anteponiendo /en, nunca desde el sitemap EN, que solo lista 41; Pitfall 15).
//
// Con EXPECT_PREVIEW=1 se ignoran SOLO la meta robots y la cabecera x-robots-tag, que
// difieren a proposito (el preview es noindex). Todo lo demas debe ser identico.
//
// Modos:
//   --selftest      Fixture valido con cero fallos y defectuosos de un solo campo (title,
//                   og:image, twitter:card, un campo de ld+json, hreflang faltante, robots,
//                   x-robots-tag); cada uno debe dar al menos un fallo.
//   --routes a,b,c  Subconjunto de rutas (ruta exacta; con prefijo /en si es EN; admite
//                   la ruta de un post).
//   --no-posts      Omite los 58 posts en es y en (solo superficies).
//   (sin modo)      Paridad completa BASE_URL contra PROD_BASE.
//
// Variables: BASE_URL (obligatoria sin --selftest), PROD_BASE (por defecto
// https://juan-tech.com), EXPECT_PREVIEW=1. Probar con BASE_URL igual a PROD_BASE debe
// dar cero fallos: asi se valida el propio comparador antes de apuntarlo al preview.
//
// Nunca escribe en ninguna base ni envia correos: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

import { extractMeta } from './54-page-contract.mjs'
import {
  decodeEntities,
  enPath,
  fetchPostPaths,
  filterRoutes,
  getPage,
  liveSurfaceRoutes,
  openTags,
  parseAttrs,
  parseRoutesFlag,
  pool,
} from './55-page-contract.mjs'

// ------------------------------------------------------------------ extraccion

/** Copia con las claves de cada objeto en orden alfabetico, a cualquier profundidad. */
export function stableSort(node) {
  if (Array.isArray(node)) return node.map(stableSort)
  if (node && typeof node === 'object') {
    const out = {}
    for (const key of Object.keys(node).sort()) out[key] = stableSort(node[key])
    return out
  }
  return node
}

/** Directivas de un meta robots normalizadas: minusculas, sin espacios, ordenadas. */
function normalizeDirectives(content) {
  return decodeEntities(content)
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .sort()
    .join(',')
}

/**
 * Bloques ld+json: cada uno parseado, @graph aplanado en nodos sueltos, @context omitido
 * y claves ordenadas; la lista resultante va ordenada por su forma textual.
 */
export function extractJsonLd(html) {
  const items = []
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/application\/ld\+json/i.test(m[1])) continue
    let parsed
    try {
      parsed = JSON.parse(m[2])
    } catch {
      items.push({ __invalid_json__: m[2].trim().slice(0, 120) })
      continue
    }
    const push = (node) => {
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        const { '@context': _ctx, ...rest } = node
        items.push(stableSort(rest))
      } else {
        items.push(stableSort(node))
      }
    }
    const roots = Array.isArray(parsed) ? parsed : [parsed]
    for (const root of roots) {
      if (root && typeof root === 'object' && Array.isArray(root['@graph'])) root['@graph'].forEach(push)
      else push(root)
    }
  }
  return items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

/**
 * Todo lo que importa de SEO en una pagina. Reutiliza `extractMeta` de 54 para title,
 * description, canonical y hreflang, y agrega og:*, twitter:*, robots y el ld+json completo.
 */
export function extractSeo(html, headers = {}) {
  const base = extractMeta(html)
  const og = []
  const twitter = []
  const robots = {}
  for (const tag of openTags(html, 'meta')) {
    const a = parseAttrs(tag)
    const prop = (a.property ?? '').toLowerCase()
    const name = (a.name ?? '').toLowerCase()
    const content = decodeEntities(a.content ?? '').trim()
    if (prop.startsWith('og:')) og.push(`${prop}=${content}`)
    if (name.startsWith('og:')) og.push(`${name}=${content}`)
    if (name.startsWith('twitter:')) twitter.push(`${name}=${content}`)
    if (prop.startsWith('twitter:')) twitter.push(`${prop}=${content}`)
    if (name === 'robots' || name === 'googlebot') robots[name] = normalizeDirectives(a.content ?? '')
  }
  const xr = Object.entries(headers).find(([k]) => k.toLowerCase() === 'x-robots-tag')?.[1] ?? ''
  return {
    title: base.title,
    description: base.description,
    canonical: base.canonical,
    hreflang: base.hreflang,
    og: og.sort(),
    twitter: twitter.sort(),
    robots,
    xRobotsTag: normalizeDirectives(xr),
    jsonld: extractJsonLd(html),
  }
}

// ------------------------------------------------------------------ comparacion

/** Diferencias profundas entre dos valores JSON: lista de { path, a, b }. */
export function deepDiff(a, b, path = '') {
  if (a === b) return []
  const typeA = Array.isArray(a) ? 'array' : a === null ? 'null' : typeof a
  const typeB = Array.isArray(b) ? 'array' : b === null ? 'null' : typeof b
  if (typeA !== typeB || (typeA !== 'array' && typeA !== 'object')) return [{ path, a, b }]
  const diffs = []
  if (typeA === 'array') {
    if (a.length !== b.length) diffs.push({ path: `${path}.length`, a: a.length, b: b.length })
    for (let i = 0; i < Math.min(a.length, b.length); i++) diffs.push(...deepDiff(a[i], b[i], `${path}[${i}]`))
    // Elementos sobrantes de un solo lado: se muestran para no esconder la causa.
    for (let i = Math.min(a.length, b.length); i < Math.max(a.length, b.length); i++) {
      diffs.push({ path: `${path}[${i}]`, a: a[i], b: b[i] })
    }
    return diffs
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!(key in a)) diffs.push({ path: `${path}.${key}`, a: undefined, b: b[key] })
    else if (!(key in b)) diffs.push({ path: `${path}.${key}`, a: a[key], b: undefined })
    else diffs.push(...deepDiff(a[key], b[key], `${path}.${key}`))
  }
  return diffs
}

const show = (v) => {
  const s = v === undefined ? 'ausente' : JSON.stringify(v)
  return s.length > 220 ? `${s.slice(0, 220)}...` : s
}

/**
 * Paridad profunda entre el SEO del preview y el de produccion.
 * `ignoreRobots` ignora solo meta robots y x-robots-tag (preview noindex a proposito).
 * @returns {string[]} fallos, cada uno con campo y ambos valores
 */
export function compareSeo(preview, prod, { ignoreRobots = false } = {}) {
  const fields = ['title', 'description', 'canonical', 'hreflang', 'og', 'twitter', 'jsonld']
  if (!ignoreRobots) fields.push('robots', 'xRobotsTag')
  const failures = []
  for (const field of fields) {
    for (const d of deepDiff(preview[field], prod[field]).slice(0, 6)) {
      failures.push(`${field}${d.path} distinto: preview=${show(d.a)} produccion=${show(d.b)}`)
    }
  }
  return failures
}

// ------------------------------------------------------------------- selftest

const LD_ARTICLE = { '@type': 'BlogPosting', headline: 'Titulo', datePublished: '2026-01-02', author: { '@type': 'Person', name: 'Juan' } }

const FIXTURE = (o = {}) => {
  const {
    title = 'Pagina | Juan',
    description = 'Descripcion real',
    robots = 'index, follow',
    ogImage = 'https://juan-tech.com/og/a.png',
    twitterCard = 'summary_large_image',
    hreflang = true,
    ld = [{ '@type': 'WebSite', name: 'Juan' }, LD_ARTICLE],
    ldAsGraph = true,
  } = o
  const ldScripts = ldAsGraph
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld })}</script>`
    : ld.map((n) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...n })}</script>`).join('')
  return (
    '<!DOCTYPE html><html lang="es"><head>' +
    `<title>${title}</title>` +
    `<meta name="description" content="${description}"/>` +
    `<meta name="robots" content="${robots}"/>` +
    '<link rel="canonical" href="https://juan-tech.com/blog/seo/a"/>' +
    (hreflang ? '<link rel="alternate" hreflang="es" href="https://juan-tech.com/blog/seo/a"/><link rel="alternate" hreflang="en" href="https://juan-tech.com/en/blog/seo/a"/>' : '<link rel="alternate" hreflang="es" href="https://juan-tech.com/blog/seo/a"/>') +
    '<meta property="og:title" content="Pagina"/><meta property="og:type" content="article"/>' +
    `<meta property="og:image" content="${ogImage}"/>` +
    `<meta name="twitter:card" content="${twitterCard}"/><meta name="twitter:title" content="Pagina"/>` +
    ldScripts +
    '</head><body><main><h1>Titulo</h1></main></body></html>'
  )
}

const HEADERS = { 'x-robots-tag': '' }

function selftest() {
  let bad = 0
  const seo = (html, headers = {}) => extractSeo(html, headers)
  const none = (name, f) => {
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const some = (name, f, needle) => {
    if (f.length > 0 && (!needle || f.some((x) => x.includes(needle)))) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba un fallo${needle ? ` con "${needle}"` : ''} y dio ${JSON.stringify(f)}`)
    }
  }
  const ref = seo(FIXTURE(), HEADERS)

  none('fixture valido contra si mismo', compareSeo(seo(FIXTURE(), HEADERS), ref))
  some('title distinto', compareSeo(seo(FIXTURE({ title: 'Otro titulo' }), HEADERS), ref), 'title')
  some('description distinta', compareSeo(seo(FIXTURE({ description: 'Otra' }), HEADERS), ref), 'description')
  some('og:image distinto', compareSeo(seo(FIXTURE({ ogImage: 'https://dev.juan-tech.com/og/a.png' }), HEADERS), ref), 'og')
  some('twitter:card distinto', compareSeo(seo(FIXTURE({ twitterCard: 'summary' }), HEADERS), ref), 'twitter')
  some('hreflang faltante', compareSeo(seo(FIXTURE({ hreflang: false }), HEADERS), ref), 'hreflang')
  some(
    'JSON-LD con un campo distinto (mismos tipos)',
    compareSeo(seo(FIXTURE({ ld: [{ '@type': 'WebSite', name: 'Juan' }, { ...LD_ARTICLE, datePublished: '2026-01-03' }] }), HEADERS), ref),
    'jsonld',
  )
  some(
    'JSON-LD con un campo anidado distinto',
    compareSeo(seo(FIXTURE({ ld: [{ '@type': 'WebSite', name: 'Juan' }, { ...LD_ARTICLE, author: { '@type': 'Person', name: 'Otro' } }] }), HEADERS), ref),
    'jsonld',
  )
  some('JSON-LD con un nodo menos', compareSeo(seo(FIXTURE({ ld: [{ '@type': 'WebSite', name: 'Juan' }] }), HEADERS), ref), 'jsonld')
  some('robots distinto', compareSeo(seo(FIXTURE({ robots: 'noindex, follow' }), HEADERS), ref), 'robots')
  some('x-robots-tag distinto', compareSeo(seo(FIXTURE(), { 'x-robots-tag': 'noindex' }), ref), 'xRobotsTag')

  // Con EXPECT_PREVIEW solo robots y x-robots-tag se ignoran.
  const previewLike = seo(FIXTURE({ robots: 'noindex, nofollow' }), { 'x-robots-tag': 'noindex, nofollow' })
  none('preview noindex con ignoreRobots', compareSeo(previewLike, ref, { ignoreRobots: true }))
  some('preview noindex sin ignoreRobots', compareSeo(previewLike, ref))
  some('ignoreRobots no esconde un title distinto', compareSeo(seo(FIXTURE({ robots: 'noindex', title: 'X' }), { 'x-robots-tag': 'noindex' }), ref, { ignoreRobots: true }), 'title')

  // Estabilidad: orden de claves, @graph contra bloques sueltos y orden de las metas.
  const reordered = FIXTURE({ ld: [{ name: 'Juan', '@type': 'WebSite' }, { author: { name: 'Juan', '@type': 'Person' }, headline: 'Titulo', '@type': 'BlogPosting', datePublished: '2026-01-02' }] })
  none('claves de ld+json en otro orden', compareSeo(seo(reordered, HEADERS), ref))
  none('@graph aplanado contra bloques sueltos', compareSeo(seo(FIXTURE({ ldAsGraph: false }), HEADERS), ref))
  none(
    'metas og en otro orden',
    compareSeo(seo(FIXTURE().replace('<meta property="og:title" content="Pagina"/><meta property="og:type" content="article"/>', '<meta property="og:type" content="article"/><meta property="og:title" content="Pagina"/>'), HEADERS), ref),
  )
  none('robots con otro espaciado y orden', compareSeo(seo(FIXTURE({ robots: 'follow,index' }), HEADERS), ref))

  // Extraccion.
  const ld = extractJsonLd(FIXTURE())
  const okLd = ld.length === 2 && !ld.some((n) => '@context' in n) && ld.some((n) => n['@type'] === 'BlogPosting' && n.author?.name === 'Juan')
  if (okLd) console.log('PASS selftest extractJsonLd: aplana @graph, omite @context y conserva el objeto completo')
  else {
    bad += 1
    console.log(`FAIL selftest extractJsonLd: ${JSON.stringify(ld)}`)
  }
  const invalid = extractJsonLd('<script type="application/ld+json">{no es json</script>')
  if (invalid.length === 1 && '__invalid_json__' in invalid[0]) console.log('PASS selftest extractJsonLd: un bloque invalido se marca, no se descarta')
  else {
    bad += 1
    console.log(`FAIL selftest extractJsonLd invalido: ${JSON.stringify(invalid)}`)
  }
  if (ref.og.length === 3 && ref.twitter.length === 2 && ref.robots.robots === 'follow,index' && enPath('/blog') === '/en/blog' && enPath('/') === '/en') {
    console.log('PASS selftest extractSeo: lee og, twitter y robots; enPath antepone /en')
  } else {
    bad += 1
    console.log(`FAIL selftest extractSeo: ${JSON.stringify({ og: ref.og, twitter: ref.twitter, robots: ref.robots })}`)
  }

  console.log(bad === 0 ? 'PASS selftest 55-seo-parity: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 55-seo-parity (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function allRoutes(prodBase, { posts }) {
  const routes = await liveSurfaceRoutes(prodBase)
  if (!posts) return routes
  const paths = await fetchPostPaths(prodBase)
  for (const p of paths) routes.push({ path: p.path, lang: 'es' }, { path: enPath(p.path), lang: 'en' })
  return routes
}

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const ignoreRobots = process.env.EXPECT_PREVIEW === '1'

  const subset = parseRoutesFlag(args)
  let routes
  try {
    // Un --routes explicito puede nombrar un post, asi que con subconjunto siempre se arma la lista completa.
    routes = await allRoutes(prodBase, { posts: subset ? true : !args.includes('--no-posts') })
  } catch (err) {
    console.log(`FAIL no se pudo construir la lista de rutas desde produccion: ${err.message}`)
    return 1
  }
  if (subset) {
    routes = filterRoutes(routes, subset)
    if (!routes) {
      console.log(`FAIL --routes no coincide con ninguna ruta de la lista: ${[...subset].join(',')}`)
      return 1
    }
  }

  const results = await pool(routes, 4, async (route) => {
    const [page, prod] = await Promise.all([getPage(base + route.path), getPage(prodBase + route.path)])
    if (page.error || page.status !== 200) {
      return { out: [`FAIL ${route.path} paridad: ${base} responde ${page.error ?? page.status}`], f: 1, p: 0 }
    }
    if (prod.error || prod.status !== 200) {
      return { out: [`FAIL ${route.path} paridad: produccion responde ${prod.error ?? prod.status} y no hay con que comparar`], f: 1, p: 0 }
    }
    const diffs = compareSeo(extractSeo(page.html, page.headers), extractSeo(prod.html, prod.headers), { ignoreRobots })
    if (diffs.length === 0) return { out: [`PASS ${route.path} paridad profunda (title, description, canonical, hreflang, og, twitter, ld+json${ignoreRobots ? '' : ', robots'})`], f: 0, p: 1 }
    return { out: diffs.map((d) => `FAIL ${route.path} ${d}`), f: diffs.length, p: 0 }
  })

  let failed = 0
  let passed = 0
  for (const r of results) {
    for (const l of r.out) console.log(l)
    failed += r.f
    passed += r.p
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 55-seo-parity: ${passed} PASS, ${failed} FAIL en ${routes.length} ruta(s)`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  process.exit(args.includes('--selftest') ? selftest() : await live(args))
}
