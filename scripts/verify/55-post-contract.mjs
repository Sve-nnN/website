// Contrato de los 58 posts en es y en (plan 55-02, PAG-05, D-16, D-32, Pitfalls 14 y 15,
// T-55-06).
//
// Las 58 URLs ES salen del sitemap de produccion; las EN se derivan de ellas anteponiendo
// /en, NUNCA desde las entradas EN del sitemap, que solo lista 41 (los 17 posts EN
// incompletos responden 200 pero van noindex y fuera del sitemap).
//
// Por cada URL y locale exige:
//   - estado 200 sin redireccion (la URL final es la pedida) y html lang correcto;
//   - exactamente un h1 y encabezados sin salto hacia abajo mayor a uno;
//   - todos los id unicos en la pagina;
//   - cada href="#x" con un elemento cuyo id sea x (FAIL con --preview-only; contra produccion
//     es WARN porque sus encabezados no llevan id y un post EN tiene enlaces de ancla a mano
//     que no resuelven alli: el diseno nuevo los resuelve);
//   - para los slugs de EN_TRANSLATION_INCOMPLETE (la lista se lee de
//     src/lib/translation-gaps.ts por expresion): en EN, meta robots con noindex y follow
//     y, en la pagina ES del mismo post, ausencia de hreflang en; los demas posts no
//     llevan noindex y su pagina ES si trae hreflang en.
// Con EXPECT_PREVIEW=1 exige ademas meta robots y x-robots-tag con noindex (el preview
// lo impone); en ese modo la directiva follow de los EN incompletos no se exige, porque
// el robots del layout del preview manda; el follow se prueba contra produccion.
//
// Redirecciones (Pitfall 14), sin seguirlas y comparando el pathname de Location:
//   - /blog/<slugDePost> (URL heredada) -> 308 a /blog/<categoriaPrimaria>/<slug>;
//   - /blog/<otraCategoria>/<slug> (categoria no primaria) -> 308 a la primaria.
// Se prueban con el primer post en es y en en (los posts de hoy tienen una sola
// categoria, asi que la no primaria es cualquiera de las otras cuatro).
//
// --preview-only agrega las comprobaciones del diseno nuevo que produccion no cumple:
//   - role="progressbar" en cada post;
//   - una lista ol con enlaces de ancla (el TOC) cuando el cuerpo tiene h2 y al menos dos
//     encabezados h1, h2 o h3 (un h1 del cuerpo cuenta como h2, Pitfall 2; un post sin h2
//     no tiene TOC y eso es valido). El cuerpo se lee de la API publica de produccion.
//
// Modos:
//   --selftest     Fixture valido y defectuosos (dos h1, salto de nivel, ancla del TOC sin
//                  destino, id repetido, EN incompleto sin noindex, ES incompleto con
//                  hreflang en, sin progressbar, sin TOC, redireccion mala); cada uno debe
//                  dar al menos un fallo.
//   --limit N      Solo los primeros N posts del sitemap (pruebas rapidas).
//   --preview-only Agrega las comprobaciones del diseno nuevo (ver arriba).
//
// Variables: BASE_URL (obligatoria sin --selftest), PROD_BASE (por defecto
// https://juan-tech.com), EXPECT_PREVIEW=1. Nunca escribe en ninguna base: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  CATEGORIES,
  allIds,
  enPath,
  fetchPostPaths,
  getNoFollow,
  getPage,
  headingLevels,
  openTags,
  parseAttrs,
  pool,
} from './55-page-contract.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// ---------------------------------------------------------- slugs incompletos

/** Slugs del Set EN_TRANSLATION_INCOMPLETE a partir del texto de translation-gaps.ts. */
export function parseIncompleteSlugs(source) {
  const block = source.match(/EN_TRANSLATION_INCOMPLETE[^=]*=\s*new Set\(\s*\[([\s\S]*?)\]\s*\)/)
  if (!block) return []
  const slugs = []
  for (const line of block[1].split('\n')) {
    const code = line.replace(/\/\/.*$/, '')
    for (const m of code.matchAll(/'([a-z0-9][a-z0-9-]*)'/g)) slugs.push(m[1])
  }
  return slugs
}

export function readIncompleteSlugs() {
  return new Set(parseIncompleteSlugs(readFileSync(join(ROOT, 'src', 'lib', 'translation-gaps.ts'), 'utf8')))
}

// ------------------------------------------------------------ comprobaciones

/** Directivas del meta robots de la pagina, en minusculas. */
function robotsDirectives(html) {
  const out = new Set()
  for (const tag of openTags(html, 'meta')) {
    const a = parseAttrs(tag)
    if ((a.name ?? '').toLowerCase() !== 'robots') continue
    for (const d of (a.content ?? '').toLowerCase().split(',')) if (d.trim()) out.add(d.trim())
  }
  return out
}

function hasHreflang(html, lang) {
  return openTags(html, 'link').some((t) => {
    const a = parseAttrs(t)
    return (a.rel ?? '').toLowerCase() === 'alternate' && (a.hreflang ?? '').toLowerCase() === lang
  })
}

/** Hay una lista ol con al menos un enlace de ancla (el TOC). */
export function hasTocList(html) {
  return /<ol\b[^>]*>(?:(?!<\/ol>)[\s\S])*?<a\b[^>]*\shref="#[^"]+"/i.test(html)
}

/**
 * Contrato de una pagina de post.
 * @param {string} html
 * @param {{ locale: 'es'|'en', incomplete?: boolean, status?: number, headers?: Record<string,string>,
 *           expectPreview?: boolean, previewOnly?: boolean, expectToc?: boolean,
 *           requestedPath?: string, finalPath?: string }} o
 * @returns {string[]} motivos de fallo
 */
export function checkPost(html, o) {
  const { locale, incomplete = false, status = 200, headers = {}, expectPreview = false, previewOnly = false, expectToc = false, requestedPath, finalPath, warnings = [] } = o
  const failures = []

  if (status !== 200) failures.push(`respondio ${status} (se esperaba 200)`)
  if (requestedPath && finalPath && requestedPath.replace(/\/$/, '') !== finalPath.replace(/\/$/, '')) {
    failures.push(`redirigio de ${requestedPath} a ${finalPath}`)
  }

  const htmlTag = openTags(html, 'html')[0]
  if (!htmlTag) failures.push('no hay etiqueta <html>')
  else if (parseAttrs(htmlTag).lang !== locale) failures.push(`<html lang="${parseAttrs(htmlTag).lang ?? ''}" (se esperaba "${locale}")`)

  const levels = headingLevels(html)
  const h1s = levels.filter((l) => l === 1).length
  if (h1s !== 1) failures.push(`hay ${h1s} h1 (se esperaba 1)`)
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      failures.push(`salto de encabezado de h${levels[i - 1]} a h${levels[i]} (posicion ${i + 1})`)
      break
    }
  }

  const ids = allIds(html)
  const seen = new Set()
  const dup = new Set()
  for (const id of ids) {
    if (id === '') continue
    if (seen.has(id)) dup.add(id)
    seen.add(id)
  }
  if (dup.size > 0) failures.push(`${dup.size} id repetido(s): ${[...dup].slice(0, 3).join(', ')}`)

  const missing = new Set()
  for (const tag of openTags(html, 'a')) {
    const href = parseAttrs(tag).href
    if (!href || !href.startsWith('#') || href === '#') continue
    const raw = href.slice(1)
    let decoded = raw
    try {
      decoded = decodeURIComponent(raw)
    } catch {
      // se queda con el valor crudo
    }
    if (!seen.has(raw) && !seen.has(decoded)) missing.add(raw)
  }
  if (missing.size > 0) {
    const msg = `${missing.size} ancla(s) sin elemento de destino: ${[...missing].slice(0, 3).map((x) => `#${x}`).join(', ')}`
    // Los encabezados de produccion no llevan id, asi que un enlace de ancla escrito a mano
    // en el cuerpo (medido: 7 en /en/blog/cs-fundamentals/recursividad) no resuelve alli. Es
    // un defecto del sitio actual, no del diseno nuevo: contra produccion se avisa (WARN) y
    // con --preview-only, donde los encabezados ya tienen id, es FAIL.
    if (previewOnly) failures.push(msg)
    else warnings.push(msg)
  }

  const robots = robotsDirectives(html)
  const noindex = robots.has('noindex')
  if (expectPreview) {
    if (!noindex) failures.push('falta meta robots con noindex (EXPECT_PREVIEW=1)')
    const xr = Object.entries(headers).find(([k]) => k.toLowerCase() === 'x-robots-tag')?.[1] ?? ''
    if (!/noindex/i.test(xr)) failures.push('falta x-robots-tag con noindex (EXPECT_PREVIEW=1)')
  }
  if (locale === 'en' && incomplete) {
    if (!noindex) failures.push('EN incompleto sin noindex en meta robots')
    if (!expectPreview && !robots.has('follow')) failures.push('EN incompleto sin follow en meta robots')
    if (!expectPreview && robots.has('nofollow')) failures.push('EN incompleto con nofollow (debe ser noindex, follow)')
  } else if (!expectPreview && noindex) {
    failures.push(`${locale === 'en' ? 'EN completo' : 'pagina ES'} con noindex en meta robots`)
  }
  if (locale === 'es') {
    const en = hasHreflang(html, 'en')
    if (incomplete && en) failures.push('la pagina ES de un post con EN incompleto anuncia hreflang en')
    if (!incomplete && !en) failures.push('la pagina ES de un post con EN completo no anuncia hreflang en')
  }

  if (previewOnly) {
    if (!/\srole\s*=\s*["']progressbar["']/i.test(html)) failures.push('falta role="progressbar" (diseno nuevo)')
    if (expectToc && !hasTocList(html)) failures.push('el cuerpo tiene h2 y falta la lista del TOC (ol con enlaces de ancla)')
  }
  return failures
}

/**
 * Una redireccion permanente a `expectedPath`; compara el pathname de Location.
 * La primera respuesta de una URL heredada que no esta en la cache de ruta de Next llega
 * con el mismo Location repetido ("/x, /x"; medido en produccion el 2026-11-09). Los
 * navegadores lo aceptan porque los valores son identicos, asi que se deduplica; dos
 * valores distintos si fallan.
 */
export function checkRedirect({ status, location }, expectedPath) {
  const failures = []
  if (status !== 308) failures.push(`respondio ${status} (se esperaba 308)`)
  const values = [...new Set(String(location ?? '').split(/,\s*/).filter(Boolean))]
  if (values.length > 1) {
    failures.push(`Location ambiguo, ${values.length} valores distintos: ${values.join(' | ')}`)
    return failures
  }
  let got = values[0] ?? ''
  try {
    got = new URL(got, 'https://x.invalid').pathname
  } catch {
    // se compara tal cual
  }
  if (got !== expectedPath) failures.push(`Location apunta a ${values[0] ?? '(vacio)'} (se esperaba ${expectedPath})`)
  return failures
}

// ------------------------------------------------------------- TOC esperado

/**
 * Encabezados del cuerpo en el Lexical de la API: h1 cuenta como h2 (el sitio lo degrada).
 * @returns {{ headings: number, hasH2: boolean }}
 */
export function bodyHeadingStats(lexical) {
  let headings = 0
  let hasH2 = false
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    if (node.type === 'heading' && ['h1', 'h2', 'h3'].includes(node.tag)) {
      headings += 1
      if (node.tag === 'h1' || node.tag === 'h2') hasH2 = true
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v)
  }
  walk(lexical)
  return { headings, hasH2 }
}

export const tocExpected = (stats) => stats.hasH2 && stats.headings >= 2

async function fetchTocMap(prodBase, locale) {
  const url = `${prodBase}/api/posts?locale=${locale}&limit=100&depth=0&select[slug]=true&select[content]=true`
  const res = await getPage(url)
  if (res.status !== 200) throw new Error(`${url} respondio ${res.status || res.error}`)
  const map = new Map()
  for (const d of JSON.parse(res.html).docs ?? []) map.set(d.slug, tocExpected(bodyHeadingStats(d.content)))
  return map
}

// ------------------------------------------------------------------- selftest

const LONG_BODY = '<h1>Titulo</h1><article><h2 id="a">A</h2><p>x</p><h3 id="b">B</h3><h2 id="c">C</h2></article>'
const TOC = '<nav><ol><li><a href="#a">A</a></li><li><a href="#c">C</a></li></ol></nav>'

const FIXTURE = (o = {}) => {
  const { lang = 'es', robots = '', hreflangEn = true, body = LONG_BODY, extra = '' } = o
  return (
    `<!DOCTYPE html><html lang="${lang}"><head><title>Post</title>` +
    (robots ? `<meta name="robots" content="${robots}"/>` : '') +
    '<link rel="alternate" hreflang="es" href="https://juan-tech.com/blog/seo/p"/>' +
    (hreflangEn ? '<link rel="alternate" hreflang="en" href="https://juan-tech.com/en/blog/seo/p"/>' : '') +
    `</head><body><main id="main-content">${body}${extra}</main></body></html>`
  )
}

const PREVIEW = { expectPreview: true, headers: { 'x-robots-tag': 'noindex, nofollow' } }

function selftest() {
  let bad = 0
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
  const es = { locale: 'es' }
  const en = { locale: 'en', robots: '' }

  none('ES completo valido', checkPost(FIXTURE(), es))
  none('EN completo valido', checkPost(FIXTURE({ lang: 'en' }), { locale: 'en' }))
  none('EN incompleto con noindex, follow', checkPost(FIXTURE({ lang: 'en', robots: 'noindex, follow' }), { locale: 'en', incomplete: true }))
  none('ES incompleto sin hreflang en', checkPost(FIXTURE({ hreflangEn: false }), { ...es, incomplete: true }))
  none('preview valido', checkPost(FIXTURE({ robots: 'noindex, nofollow' }), { ...es, ...PREVIEW }))
  none('preview-only valido con TOC y progressbar', checkPost(FIXTURE({ robots: 'noindex, nofollow', extra: `${TOC}<div role="progressbar" aria-valuenow="0"></div>` }), { ...es, ...PREVIEW, previewOnly: true, expectToc: true }))
  none('preview-only sin h2 no exige TOC', checkPost(FIXTURE({ robots: 'noindex, nofollow', body: '<h1>T</h1><p>x</p>', extra: '<div role="progressbar"></div>' }), { ...es, ...PREVIEW, previewOnly: true, expectToc: false }))

  some('dos h1', checkPost(FIXTURE({ body: '<h1>a</h1><h1>b</h1>' }), es), 'h1')
  some('salto de h2 a h4', checkPost(FIXTURE({ body: '<h1>a</h1><h2>b</h2><h4>c</h4>' }), es), 'salto')
  const strictEs = { ...es, previewOnly: true }
  const dangling = FIXTURE({ extra: '<nav><ol><li><a href="#no-existe">x</a></li></ol></nav><div role="progressbar"></div>' })
  some('ancla del TOC sin destino con --preview-only', checkPost(dangling, strictEs), 'ancla')
  const warns = []
  none('ancla sin destino contra produccion no es FAIL', checkPost(dangling, { ...es, warnings: warns }))
  if (warns.length === 1 && warns[0].includes('#no-existe')) console.log('PASS selftest ancla sin destino contra produccion: un WARN')
  else {
    bad += 1
    console.log(`FAIL selftest ancla sin destino contra produccion: ${JSON.stringify(warns)}`)
  }
  some('id repetido', checkPost(FIXTURE({ extra: '<h2 id="a">dup</h2>' }), es), 'id repetido')
  some('estado 404', checkPost(FIXTURE(), { ...es, status: 404 }), '404')
  some('redireccion en vez de 200', checkPost(FIXTURE(), { ...es, requestedPath: '/blog/seo/p', finalPath: '/blog/otra/p' }), 'redirigio')
  some('lang equivocado', checkPost(FIXTURE({ lang: 'en' }), es), 'lang')
  some('EN incompleto sin noindex', checkPost(FIXTURE({ lang: 'en' }), { ...en, incomplete: true }), 'noindex')
  some('EN incompleto con noindex pero sin follow', checkPost(FIXTURE({ lang: 'en', robots: 'noindex' }), { ...en, incomplete: true }), 'follow')
  some('EN incompleto con nofollow', checkPost(FIXTURE({ lang: 'en', robots: 'noindex, nofollow' }), { ...en, incomplete: true }), 'nofollow')
  some('ES incompleto con hreflang en', checkPost(FIXTURE(), { ...es, incomplete: true }), 'hreflang')
  some('ES completo sin hreflang en', checkPost(FIXTURE({ hreflangEn: false }), es), 'hreflang')
  some('EN completo con noindex en produccion', checkPost(FIXTURE({ lang: 'en', robots: 'noindex, follow' }), { locale: 'en' }), 'noindex')
  some('preview sin noindex', checkPost(FIXTURE(), { ...es, ...PREVIEW }), 'noindex')
  some('preview sin x-robots-tag', checkPost(FIXTURE({ robots: 'noindex' }), { ...es, expectPreview: true, headers: {} }), 'x-robots-tag')
  some('preview-only sin progressbar', checkPost(FIXTURE({ robots: 'noindex, nofollow', extra: TOC }), { ...es, ...PREVIEW, previewOnly: true, expectToc: true }), 'progressbar')
  some('preview-only sin TOC con h2', checkPost(FIXTURE({ robots: 'noindex, nofollow', extra: '<div role="progressbar"></div>' }), { ...es, ...PREVIEW, previewOnly: true, expectToc: true }), 'TOC')

  none('redireccion 308 correcta', checkRedirect({ status: 308, location: 'https://juan-tech.com/blog/seo/p' }, '/blog/seo/p'))
  none('redireccion 308 con Location relativo', checkRedirect({ status: 308, location: '/en/blog/seo/p' }, '/en/blog/seo/p'))
  none('redireccion 308 con Location repetido e identico', checkRedirect({ status: 308, location: '/blog/seo/p, /blog/seo/p' }, '/blog/seo/p'))
  some('redireccion con dos Location distintos', checkRedirect({ status: 308, location: '/blog/seo/p, /blog/otra/p' }, '/blog/seo/p'), 'ambiguo')
  some('redireccion con 301', checkRedirect({ status: 301, location: '/blog/seo/p' }, '/blog/seo/p'), '308')
  some('redireccion a otra categoria', checkRedirect({ status: 308, location: '/blog/otra/p' }, '/blog/seo/p'), 'Location')
  some('sin redireccion', checkRedirect({ status: 200, location: '' }, '/blog/seo/p'), '308')

  const slugs = parseIncompleteSlugs(
    "export const EN_TRANSLATION_INCOMPLETE: ReadonlySet<string> = new Set([\n  'a-b', // 22%  ('no cuenta')\n  // 'comentado',\n  'c',\n  'd-e', // x\n])\n",
  )
  if (JSON.stringify(slugs) === JSON.stringify(['a-b', 'c', 'd-e'])) console.log('PASS selftest parseIncompleteSlugs: ignora comentarios y toma los slugs del Set')
  else {
    bad += 1
    console.log(`FAIL selftest parseIncompleteSlugs: ${JSON.stringify(slugs)}`)
  }
  const real = readIncompleteSlugs()
  if (real.size === 17 && real.has('recursividad') && real.has('mejores-cursos-seo-espanol')) console.log('PASS selftest translation-gaps.ts: 17 slugs leidos del archivo real')
  else {
    bad += 1
    console.log(`FAIL selftest translation-gaps.ts: ${real.size} slugs (se esperaban 17)`)
  }

  const stats = bodyHeadingStats({ root: { children: [{ type: 'heading', tag: 'h1' }, { type: 'heading', tag: 'h3' }, { type: 'heading', tag: 'h4' }] } })
  const noH2 = bodyHeadingStats({ root: { children: [{ type: 'heading', tag: 'h3' }, { type: 'heading', tag: 'h3' }] } })
  if (stats.headings === 2 && stats.hasH2 && tocExpected(stats) && !tocExpected(noH2) && !tocExpected({ headings: 1, hasH2: true })) {
    console.log('PASS selftest bodyHeadingStats: h1 cuenta como h2; sin h2 o con un solo encabezado no hay TOC')
  } else {
    bad += 1
    console.log(`FAIL selftest bodyHeadingStats: ${JSON.stringify({ stats, noH2 })}`)
  }
  if (enPath('/blog/seo/p') === '/en/blog/seo/p') console.log('PASS selftest URLs EN derivadas con el prefijo /en')
  else {
    bad += 1
    console.log('FAIL selftest URLs EN derivadas con el prefijo /en')
  }

  console.log(bad === 0 ? 'PASS selftest 55-post-contract: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 55-post-contract (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const expectPreview = process.env.EXPECT_PREVIEW === '1'
  const previewOnly = args.includes('--preview-only')
  const li = args.indexOf('--limit')
  const limit = li >= 0 ? Number(args[li + 1]) : Infinity

  let posts
  let incomplete
  let toc = { es: new Map(), en: new Map() }
  try {
    posts = (await fetchPostPaths(prodBase)).slice(0, Number.isFinite(limit) ? limit : undefined)
    incomplete = readIncompleteSlugs()
    if (previewOnly) toc = { es: await fetchTocMap(prodBase, 'es'), en: await fetchTocMap(prodBase, 'en') }
  } catch (err) {
    console.log(`FAIL no se pudo preparar la lista de posts desde produccion: ${err.message}`)
    return 1
  }
  if (posts.length === 0) {
    console.log('FAIL el sitemap de produccion no lista posts')
    return 1
  }

  const jobs = posts.flatMap((p) => [
    { ...p, locale: 'es', url: p.path },
    { ...p, locale: 'en', url: enPath(p.path) },
  ])

  const results = await pool(jobs, 6, async (job) => {
    const page = await getPage(base + job.url)
    if (page.error) return { out: [`FAIL ${job.url}: ${page.error}`], f: 1, p: 0 }
    let finalPath = job.url
    try {
      finalPath = new URL(page.finalUrl).pathname
    } catch {
      // se queda con la pedida
    }
    const warnings = []
    const failures = checkPost(page.html, {
      warnings,
      locale: job.locale,
      incomplete: incomplete.has(job.slug),
      status: page.status,
      headers: page.headers,
      expectPreview,
      previewOnly,
      expectToc: toc[job.locale].get(job.slug) === true,
      requestedPath: job.url,
      finalPath,
    })
    const warnLines = warnings.map((x) => `WARN ${job.url} contrato: ${x}`)
    if (failures.length === 0) return { out: [...warnLines, `PASS ${job.url} contrato de post`], f: 0, p: 1 }
    return { out: [...warnLines, ...failures.map((x) => `FAIL ${job.url} contrato: ${x}`)], f: failures.length, p: 0 }
  })

  // Redirecciones: URL heredada y categoria no primaria, en es y en.
  const first = posts[0]
  const other = CATEGORIES.find((c) => c !== first.category && c !== 'general') ?? 'general'
  const redirectJobs = []
  for (const locale of ['es', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const target = `${prefix}${first.path}`
    redirectJobs.push({ label: `URL heredada ${prefix}/blog/${first.slug}`, url: `${prefix}/blog/${first.slug}`, target })
    redirectJobs.push({ label: `categoria no primaria ${prefix}/blog/${other}/${first.slug}`, url: `${prefix}/blog/${other}/${first.slug}`, target })
  }
  const redirects = await pool(redirectJobs, 4, async (j) => {
    const r = await getNoFollow(base + j.url)
    if (r.error) return { out: [`FAIL ${j.label}: ${r.error}`], f: 1, p: 0 }
    const f = checkRedirect(r, j.target)
    if (f.length === 0) return { out: [`PASS ${j.label} responde 308 a ${j.target}`], f: 0, p: 1 }
    return { out: f.map((x) => `FAIL ${j.label}: ${x}`), f: f.length, p: 0 }
  })

  let failed = 0
  let passed = 0
  for (const r of [...results, ...redirects]) {
    for (const l of r.out) console.log(l)
    failed += r.f
    passed += r.p
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 55-post-contract: ${passed} PASS, ${failed} FAIL en ${posts.length} posts x 2 locales mas ${redirects.length} redirecciones${previewOnly ? ' (con --preview-only)' : ''}`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  process.exit(args.includes('--selftest') ? selftest() : await live(args))
}
