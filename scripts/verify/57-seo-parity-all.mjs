// Paridad SEO de toda la superficie contra producción (plan 57-02, SEO-01, SEO-02, SEO-03,
// D-01, D-04 F4 y F5, GO-03).
//
// Fuente de URLs: SIEMPRE el sitemap de producción (el del preview se reescribe a una página
// bloqueada), más las rutas que producción sirve con 200 fuera del sitemap (EXTRA_PATHS) y los
// orígenes de la colección pública de redirects. Las rutas nuevas del rediseño
// (57-new-routes.mjs) se validan contra su contrato propio y nunca contra un 404 de producción.
//
// Por cada URL y entorno extrae, con el mismo extractor de 55-seo-parity.mjs (importado, sin
// modificar 55): title, meta description, canonical, hreflang, og:*, twitter:*, robots y cada
// bloque JSON-LD parseado (@graph aplanado, claves ordenadas). Además cuenta los h1, los
// saltos de nivel entre encabezados, las palabras visibles del contenido indexable y los
// enlaces internos.
//
// Una URL del preview pasa cuando:
//   - title, description, canonical, hreflang, og, twitter y JSON-LD son idénticos a producción
//     (con EXPECT_PREVIEW=1 se ignoran solo meta robots y x-robots-tag, como en 55);
//   - tiene exactamente un h1 y ningún salto de encabezado hacia abajo (h2 a h4);
//   - las palabras del contenido indexable no bajan más de WORDS_TOLERANCE (0.02 por defecto)
//     respecto de producción. Se cuentan dentro de <main> cuando ambos entornos tienen uno; si
//     no, en todo el body. Siempre sin script, style, noscript, svg ni template. Se cuenta en
//     <main> porque el rediseño cambió la cabecera y el pie: contar el body entero mediría el
//     menú y no el contenido. El total del body queda en el JSON como dato;
//   - ningún enlace interno apunta a un gemelo EN noindex de EN_TRANSLATION_INCOMPLETE
//     (src/lib/translation-gaps.ts) ni a una URL que responde 3xx o 4xx (F4 y F12);
//   - si es un perfil de autor, su HTML sin comprimir pesa 500 KB (500.000 bytes) o menos (F5).
// El peso del HTML de cada plantilla, en ambos entornos, queda en el reporte (Pitfall 10).
//
// Modos:
//   --selftest                         Casos válidos y defectuosos de un solo campo.
//   (sin modo)                         Preview (BASE_URL) contra producción (PROD_BASE).
//   --snapshot <archivo>               Guarda el estado de producción: estado y location de cada
//                                      URL, campos de head, JSON-LD y su hash, palabras, h1,
//                                      sitemap.xml, robots.txt, llms.txt, llms-full.txt y los
//                                      redirects.
//   --live-prod --vs-snapshot <arch.>  Compara producción de ahora contra ese snapshot (GO-03,
//                                      57-11 y monitoreo). --skip-new-routes omite el contrato de
//                                      las rutas nuevas (útil antes del corte, cuando dan 404).
//   --out <archivo.json>               Escribe el resultado completo en JSON y un resumen
//                                      legible en español en el mismo nombre con .md.
//   --limit N                          Solo las N primeras URLs (pruebas rápidas).
//
// Variables: BASE_URL (preview; en el modo por defecto también vale PREVIEW_BASE), PROD_BASE
// (por defecto https://juan-tech.com), EXPECT_PREVIEW=1, WORDS_TOLERANCE.
//
// Seguridad: solo GET. No guarda cookies ni cabeceras de respuesta salvo estado, location y
// x-robots-tag normalizado. No lee variables de conexión a ninguna base.
//
// DNS: si esta máquina falla con ENOTFOUND dev.juan-tech.com por caché negativa de DNS, corre
// el script con NODE_OPTIONS="--require <scratchpad de la sesión>/dnsfix.cjs" (nunca entra al
// repo), igual que 55 y 56.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { decodeEntities, headingLevels, openTags, parseAttrs, pool } from './55-page-contract.mjs'
import { compareSeo, extractSeo } from './55-seo-parity.mjs'
import { NEW_ROUTES, aboutFixture, checkNewRoute, isNewRoute } from './57-new-routes.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SITE = 'https://juan-tech.com'
const CONCURRENCY = 4
export const AUTHOR_HTML_BUDGET = 500_000
export const DEFAULT_WORDS_TOLERANCE = 0.02

/** Rutas que producción sirve con 200 fuera del sitemap (salen de `57-new-routes --derive`). */
export const EXTRA_PATHS = ['/search', '/en/search', '/blog/confirm', '/en/blog/confirm', '/services', '/en/servicios']

// ------------------------------------------------------------ gemelos noindex (F4)

/**
 * Slugs de EN_TRANSLATION_INCOMPLETE leídos del archivo TypeScript (un .mjs no importa .ts):
 * se quitan los comentarios de línea y se toman las cadenas entre comillas simples del Set.
 */
export function loadIncompleteSlugs(file = join(HERE, '..', '..', 'src', 'lib', 'translation-gaps.ts')) {
  const src = readFileSync(file, 'utf8')
  const m = src.match(/EN_TRANSLATION_INCOMPLETE[^=]*=\s*new Set\(\[([\s\S]*?)\]\)/)
  if (!m) throw new Error('no encontré EN_TRANSLATION_INCOMPLETE en translation-gaps.ts')
  const body = m[1].replace(/\/\/[^\n]*/g, '')
  return new Set([...body.matchAll(/'([^']+)'/g)].map((x) => x[1]))
}

/** ¿La ruta es el gemelo EN noindex de un post de la lista? */
export function isNoindexTwin(path, slugs) {
  const m = path.match(/^\/en\/blog\/[^/?#]+\/([^/?#]+)\/?(?:[?#].*)?$/)
  return !!m && slugs.has(m[1])
}

// ------------------------------------------------------------------- extracción

const STRIP = /<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi

/** Palabras visibles de un fragmento: sin script, style, noscript, svg ni template. */
export function countWords(fragment) {
  const text = decodeEntities(fragment.replace(STRIP, ' ').replace(/<[^>]+>/g, ' '))
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

/** Fragmento entre la primera apertura de main y el último cierre; null si no hay main. */
export function mainFragment(html) {
  const start = html.search(/<main(?=[\s>])/i)
  const end = html.toLowerCase().lastIndexOf('</main>')
  return start >= 0 && end > start ? html.slice(start, end) : null
}

function bodyFragment(html) {
  const start = html.search(/<body(?=[\s>])/i)
  return start >= 0 ? html.slice(start) : html
}

/** Saltos de encabezado hacia abajo, como "h2>h4". */
export function headingSkips(html) {
  const levels = headingLevels(html.replace(STRIP, ' '))
  const out = []
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) out.push(`h${levels[i - 1]}>h${levels[i]}`)
  return out
}

const INTERNAL_HOSTS = new Set(['juan-tech.com', 'www.juan-tech.com', 'dev.juan-tech.com'])

/** Rutas internas enlazadas con <a href>: sin hash, con query, sin /admin, /api ni /_next. */
export function internalLinks(html, pageUrl = `${SITE}/`) {
  const out = new Set()
  for (const tag of openTags(html.replace(STRIP, ' '), 'a')) {
    const raw = decodeEntities(parseAttrs(tag).href ?? '').trim()
    if (!raw || raw.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(raw)) continue
    let url
    try {
      url = new URL(raw, pageUrl)
    } catch {
      continue
    }
    if (!/^https?:$/.test(url.protocol) || !INTERNAL_HOSTS.has(url.hostname)) continue
    if (/^\/(admin|api|_next)(\/|$)/.test(url.pathname)) continue
    out.add(url.pathname + url.search)
  }
  return [...out].sort()
}

/** Todo lo que el gate necesita de una página. */
export function pageFacts(html, { xRobotsTag = '', pageUrl } = {}) {
  const main = mainFragment(html)
  return {
    bytes: Buffer.byteLength(html, 'utf8'),
    seo: extractSeo(html, { 'x-robots-tag': xRobotsTag }),
    h1: headingLevels(html.replace(STRIP, ' ')).filter((l) => l === 1).length,
    skips: headingSkips(html),
    words: { main: main === null ? null : countWords(main), body: countWords(bodyFragment(html)) },
    links: internalLinks(html, pageUrl),
  }
}

const hash = (v) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex').slice(0, 16)

// ------------------------------------------------------------------- comparación

const FIELD_RE = /^(title|description|canonical|hreflang|og|twitter|jsonld|robots|xRobotsTag)/

/** Palabras comparables: main si ambos lo tienen, si no body. */
function comparableWords(a, b) {
  if (a.words.main !== null && b.words.main !== null) return { scope: 'main', a: a.words.main, b: b.words.main }
  return { scope: 'body', a: a.words.body, b: b.words.body }
}

/**
 * Diferencias de una página contra su referencia.
 * @returns {{ field: string, message: string }[]}
 */
export function comparePage(cur, ref, { ignoreRobots = false, wordsTolerance = DEFAULT_WORDS_TOLERANCE, label = 'producción', relative = false } = {}) {
  const out = []
  for (const msg of compareSeo(cur.seo, ref.seo, { ignoreRobots })) {
    out.push({ field: msg.match(FIELD_RE)?.[1] ?? 'seo', message: msg.replace(/produccion=/g, `${label}=`) })
  }
  // Absoluto (preview): un h1 y ningún salto. Relativo (producción contra su snapshot): solo
  // falla lo que empeoró, para que una producción vieja con dos h1 no ensucie el monitoreo.
  const h1Bad = relative ? cur.h1 !== 1 && cur.h1 !== ref.h1 : cur.h1 !== 1
  if (h1Bad) out.push({ field: 'h1', message: `hay ${cur.h1} h1 (se esperaba 1; ${label} tiene ${ref.h1})` })
  const newSkips = relative ? cur.skips.filter((s) => !ref.skips.includes(s)) : cur.skips
  if (newSkips.length > 0) out.push({ field: 'encabezados', message: `salto de nivel ${newSkips.join(', ')} (${label}: ${ref.skips.join(', ') || 'sin saltos'})` })
  const w = comparableWords(cur, ref)
  if (w.b > 0 && w.a < w.b * (1 - wordsTolerance)) {
    const pct = (((w.b - w.a) / w.b) * 100).toFixed(1)
    out.push({ field: 'palabras', message: `palabras en ${w.scope}: ${w.a} contra ${w.b} en ${label} (${pct}% menos; tolerancia ${(wordsTolerance * 100).toFixed(0)}%)` })
  }
  return out
}

/** Presupuesto del HTML del perfil de autor (F5). */
export const isAuthorProfile = (path) => /^(\/en)?\/authors\/[^/?#]+\/?$/.test(path)
export function checkAuthorBudget(path, bytes, budget = AUTHOR_HTML_BUDGET) {
  if (!isAuthorProfile(path) || bytes <= budget) return []
  return [{ field: 'peso-autor', message: `HTML del autor ${bytes} bytes sin comprimir, presupuesto ${budget}` }]
}

/**
 * Fallos de enlaces internos (F4 y F12).
 * @param {Map<string,string[]>} linkedFrom  destino -> páginas que lo enlazan
 * @param {Set<string>} slugs                EN_TRANSLATION_INCOMPLETE
 * @param {Map<string,{status:number, location?:string}>} statusOf  respuesta sin seguir redirecciones
 */
export function checkLinks(linkedFrom, slugs, statusOf) {
  const out = []
  for (const [target, from] of linkedFrom) {
    const where = `${from.slice(0, 3).join(', ')}${from.length > 3 ? ` y ${from.length - 3} más` : ''}`
    if (isNoindexTwin(target, slugs)) out.push({ target, from, field: 'enlace-gemelo-noindex', message: `enlace a ${target}, gemelo EN noindex, desde ${where}` })
    const s = statusOf.get(target)
    if (!s) continue
    if (s.status >= 300 && s.status < 400) out.push({ target, from, field: 'enlace-redirect', message: `enlace a ${target}, que redirige ${s.status} a ${s.location}, desde ${where}` })
    else if (s.status >= 400 || s.status === 0) out.push({ target, from, field: 'enlace-roto', message: `enlace a ${target}, que responde ${s.status || s.error}, desde ${where}` })
  }
  return out
}

/** Plantilla de una ruta, para el peso de HTML por plantilla. */
export function templateOf(path) {
  const p = path.replace(/[?#].*$/, '').replace(/^\/en(?=\/|$)/, '').replace(/\/$/, '') || '/'
  const rules = [
    [/^\/$/, 'home'],
    [/^\/(servicios|services)$/, 'servicios'],
    [/^\/(servicios|services)\/[^/]+$/, 'servicio'],
    [/^\/seo-tecnico-[^/]+$/, 'landing-local'],
    [/^\/blog$/, 'blog'],
    [/^\/blog\/confirm$/, 'blog-confirmacion'],
    [/^\/blog\/[^/]+$/, 'blog-categoria'],
    [/^\/blog\/[^/]+\/[^/]+$/, 'post'],
    [/^\/case-studies$/, 'casos'],
    [/^\/case-studies\/[^/]+$/, 'caso'],
    [/^\/websites$/, 'sitios'],
    [/^\/websites\/[^/]+$/, 'sitio'],
    [/^\/authors$/, 'autores'],
    [/^\/authors\/[^/]+$/, 'autor'],
    [/^\/(privacy|terms)$/, 'legal'],
    [/^\/stack$/, 'stack'],
    [/^\/contact$/, 'contacto'],
    [/^\/search$/, 'busqueda'],
    [/^\/sobre-mi$/, 'sobre-mi'],
  ]
  return rules.find(([re]) => re.test(p))?.[1] ?? 'otra'
}

/**
 * Evalúa una URL ya descargada. Las rutas nuevas van contra su contrato y nunca contra
 * producción; el resto exige que producción responda 200 para tener con qué comparar.
 * @returns {{ kind: 'nueva'|'paridad', failures: {field:string,message:string}[] }}
 */
export function evaluateUrl({ path, preview, prod, expectPreview = false, wordsTolerance = DEFAULT_WORDS_TOLERANCE }) {
  if (isNewRoute(path)) {
    const contract = NEW_ROUTES.find((r) => r.path === path)
    const failures = checkNewRoute(preview.html ?? '', contract, {
      status: preview.status,
      headers: { 'x-robots-tag': preview.xRobotsTag ?? '' },
      expectPreview,
    }).map((message) => ({ field: 'contrato-ruta-nueva', message }))
    return { kind: 'nueva', failures }
  }
  if (preview.status !== 200) return { kind: 'paridad', failures: [{ field: 'estado', message: `el preview responde ${preview.status || preview.error} (producción ${prod.status || prod.error})` }] }
  if (prod.status !== 200) return { kind: 'paridad', failures: [{ field: 'estado', message: `producción responde ${prod.status || prod.error} y no hay con qué comparar` }] }
  const a = pageFacts(preview.html, { xRobotsTag: preview.xRobotsTag })
  const b = pageFacts(prod.html, { xRobotsTag: prod.xRobotsTag })
  return {
    kind: 'paridad',
    facts: { preview: a, prod: b },
    failures: [...comparePage(a, b, { ignoreRobots: expectPreview, wordsTolerance }), ...checkAuthorBudget(path, a.bytes)],
  }
}

// ---------------------------------------------------- clasificación de diferencias

/**
 * Diferencias conocidas de la primera corrida contra el preview (57-02, tarea 3), por clase:
 *   a  corrección en el plan 57-06;
 *   b  diferencia legítima del rediseño que Juan acepta por escrito en 57-09;
 *   c  falso positivo del extractor (se corrige en el script y no debería aparecer).
 * No cambian el resultado PASS o FAIL: solo anotan cada diferencia en el JSON y el resumen.
 * Una diferencia sin regla queda como "sin-clasificar" y el resumen la cuenta aparte.
 */
export const KNOWN_DIFFERENCES = [
  {
    field: 'enlace-gemelo-noindex',
    clase: 'a',
    motivo:
      'F4: enlace interno a un gemelo EN noindex de EN_TRANSLATION_INCOMPLETE. Producción tiene los mismos (pie EN con estrategia-seo y technical-seo-guide en 80 páginas, listado y relacionados del blog EN). 57-06 los apunta a la versión ES o los quita',
  },
  {
    path: /^\/en\/sitemap\.html$/,
    field: 'enlace-roto',
    clase: 'a',
    motivo: 'El pie EN enlaza /en/sitemap.html, que da 404 también en producción. Debe apuntar a /sitemap.html (57-06)',
  },
  {
    path: /^\/en\/llms(-full)?\.txt$/,
    field: 'enlace-roto',
    clase: 'a',
    motivo: 'Regresión del preview: el texto enriquecido EN antepone /en a /llms.txt y /llms-full.txt; producción enlaza la ruta sin prefijo (57-06)',
  },
  {
    path: /^(\/en)?\/blog\/general$/,
    field: 'palabras',
    clase: 'b',
    motivo:
      'Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09',
  },
]

export function classify(path, failure, rules = KNOWN_DIFFERENCES) {
  const rule = rules.find((r) => (!r.path || r.path.test(path)) && (!r.field || r.field === failure.field) && (!r.message || r.message.test(failure.message)))
  return rule ? { clase: rule.clase, motivo: rule.motivo } : { clase: 'sin-clasificar', motivo: '' }
}

// ------------------------------------------------------------------------- red

/** GET con plazo y un reintento ante error de red o 5xx de reinicio. Sin cookies. */
export async function fetchPage(url, { follow = true, retry = true } = {}) {
  try {
    const res = await fetch(url, { redirect: follow ? 'follow' : 'manual', signal: AbortSignal.timeout(45000) })
    const html = await res.text()
    if (retry && [500, 502, 503, 504].includes(res.status)) {
      await new Promise((r) => setTimeout(r, 3000))
      return fetchPage(url, { follow, retry: false })
    }
    return {
      status: res.status,
      html,
      location: res.headers.get('location') ?? '',
      xRobotsTag: res.headers.get('x-robots-tag') ?? '',
      finalUrl: res.url,
    }
  } catch (err) {
    if (retry) {
      await new Promise((r) => setTimeout(r, 3000))
      return fetchPage(url, { follow, retry: false })
    }
    return { status: 0, html: '', location: '', xRobotsTag: '', error: err.message }
  }
}

const pathOfLocation = (loc, base) => {
  if (!loc) return ''
  try {
    const u = new URL(loc, base)
    return INTERNAL_HOSTS.has(u.hostname) || u.origin === new URL(base).origin ? u.pathname + u.search : u.href
  } catch {
    return loc
  }
}

export function sitemapPaths(xml) {
  const out = []
  const seen = new Set()
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    let u
    try {
      u = new URL(decodeEntities(m[1]))
    } catch {
      continue
    }
    const p = u.pathname + u.search
    if (!seen.has(p)) {
      seen.add(p)
      out.push(p)
    }
  }
  return out
}

async function loadRedirectSources(prodBase) {
  const r = await fetchPage(`${prodBase}/api/redirects?limit=0&depth=0`)
  if (r.status !== 200) return { error: `api/redirects respondió ${r.status || r.error}`, items: [] }
  const body = JSON.parse(r.html)
  return { items: (body.docs ?? []).map((d) => ({ from: d.from, to: d.to?.url ?? '' })).filter((d) => typeof d.from === 'string') }
}

async function buildUrlList(prodBase) {
  const sm = await fetchPage(`${prodBase}/sitemap.xml`)
  if (sm.status !== 200) throw new Error(`sitemap.xml de producción respondió ${sm.status || sm.error}`)
  const sitemap = sitemapPaths(sm.html)
  const extras = EXTRA_PATHS.filter((p) => !sitemap.includes(p))
  const fresh = NEW_ROUTES.map((r) => r.path).filter((p) => !sitemap.includes(p))
  return { sitemap, extras, fresh, sitemapXml: sm.html }
}

/**
 * Destinos que no se sondean:
 *   - /go/<herramienta>: enlaces de afiliado que redirigen 302 a propósito hacia fuera del sitio
 *     (robots.txt los excluye con Disallow: /go). Un 302 ahí es el diseño, no un hallazgo;
 *   - /sitemap.xml y /sitemap.html en el preview: next.config.mjs los reescribe a
 *     /preview-blocked (404) solo en el preview; en producción sí se sondean.
 */
export function skipProbe(target, { preview = false } = {}) {
  if (/^\/go\//.test(target)) return true
  return preview && /^\/sitemap\.(xml|html)$/.test(target.replace(/[?#].*$/, ''))
}

/** Sondea cada destino de enlace sin seguir redirecciones. */
async function probeLinks(base, targets, { preview = false } = {}) {
  const statusOf = new Map()
  await pool(targets.filter((t) => !skipProbe(t, { preview })), CONCURRENCY, async (t) => {
    const r = await fetchPage(base + t, { follow: false })
    statusOf.set(t, { status: r.status, location: pathOfLocation(r.location, base), error: r.error })
  })
  return statusOf
}

// ------------------------------------------------------------------ resumen .md

function writeOutputs(outFile, result, mdLines) {
  writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`)
  const md = outFile.replace(/\.json$/i, '') + '.md'
  writeFileSync(md, `${mdLines.join('\n')}\n`)
  console.log(`Resultado: ${outFile}`)
  console.log(`Resumen: ${md}`)
}

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')

// -------------------------------------------------------------- modo por defecto

async function compareRun(args) {
  const base = (process.env.BASE_URL ?? process.env.PREVIEW_BASE)?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL (o PREVIEW_BASE) es obligatoria')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? SITE).replace(/\/$/, '')
  const expectPreview = process.env.EXPECT_PREVIEW === '1'
  const wordsTolerance = Number(process.env.WORDS_TOLERANCE ?? DEFAULT_WORDS_TOLERANCE)
  const slugs = loadIncompleteSlugs()

  const list = await buildUrlList(prodBase)
  let paths = [...list.sitemap, ...list.extras, ...list.fresh]
  const li = args.indexOf('--limit')
  if (li >= 0) paths = paths.slice(0, Number(args[li + 1]))
  const origin = (p) => (list.sitemap.includes(p) ? 'sitemap' : list.extras.includes(p) ? 'fuera-del-sitemap' : 'nueva')

  const rows = await pool(paths, CONCURRENCY, async (path) => {
    const [preview, prod] = await Promise.all([fetchPage(base + path), isNewRoute(path) ? fetchPage(prodBase + path, { follow: false }) : fetchPage(prodBase + path)])
    const ev = evaluateUrl({ path, preview, prod, expectPreview, wordsTolerance })
    const facts = ev.facts
    const pf = facts?.preview ?? (preview.html ? pageFacts(preview.html, { xRobotsTag: preview.xRobotsTag }) : null)
    return {
      path,
      origen: origin(path),
      plantilla: templateOf(path),
      estado: { preview: preview.status || preview.error, produccion: prod.status || prod.error },
      bytes: { preview: pf?.bytes ?? 0, produccion: facts?.prod.bytes ?? Buffer.byteLength(prod.html ?? '', 'utf8') },
      palabras: { preview: pf?.words ?? null, produccion: facts?.prod.words ?? null },
      h1: pf?.h1 ?? null,
      saltos: pf?.skips ?? [],
      fallos: ev.failures.map((f) => ({ ...f, ...classify(path, f) })),
      _links: { preview: pf?.links ?? [], prod: facts?.prod.links ?? [] },
    }
  })

  // Enlaces internos del preview: gemelos noindex, redirects y rotos (F4, F12).
  const linkedFrom = new Map()
  const prodTwinLinks = new Map()
  for (const r of rows) {
    for (const t of r._links.preview) linkedFrom.set(t, [...(linkedFrom.get(t) ?? []), r.path])
    for (const t of r._links.prod) if (isNoindexTwin(t, slugs)) prodTwinLinks.set(t, [...(prodTwinLinks.get(t) ?? []), r.path])
  }
  const statusOf = await probeLinks(base, [...linkedFrom.keys()], { preview: expectPreview })
  const linkFailures = checkLinks(linkedFrom, slugs, statusOf).map((f) => ({ ...f, ...classify(f.target, f) }))

  // Redirects de la colección: mismo estado y destino en ambos entornos.
  const redirects = await loadRedirectSources(prodBase)
  const redirectRows = await pool(redirects.items, CONCURRENCY, async (d) => {
    const [a, b] = await Promise.all([fetchPage(base + d.from, { follow: false }), fetchPage(prodBase + d.from, { follow: false })])
    const pa = { status: a.status || a.error, location: pathOfLocation(a.location, base) }
    const pb = { status: b.status || b.error, location: pathOfLocation(b.location, prodBase) }
    const ok = pa.status === pb.status && pa.location === pb.location
    return { from: d.from, preview: pa, produccion: pb, ok }
  })
  const redirectFailures = redirectRows
    .filter((r) => !r.ok)
    .map((r) => {
      const f = { field: 'redirect', message: `${r.from}: preview ${r.preview.status} ${r.preview.location}, producción ${r.produccion.status} ${r.produccion.location}` }
      return { from: r.from, ...f, ...classify(r.from, f) }
    })

  // Peso de HTML por plantilla (Pitfall 10).
  const weights = {}
  for (const r of rows) {
    const w = (weights[r.plantilla] ??= { urls: 0, previewMax: 0, produccionMax: 0, previewTotal: 0, produccionTotal: 0 })
    w.urls += 1
    w.previewMax = Math.max(w.previewMax, r.bytes.preview)
    w.produccionMax = Math.max(w.produccionMax, r.bytes.produccion)
    w.previewTotal += r.bytes.preview
    w.produccionTotal += r.bytes.produccion
  }
  for (const w of Object.values(weights)) {
    w.previewMedio = Math.round(w.previewTotal / w.urls)
    w.produccionMedio = Math.round(w.produccionTotal / w.urls)
    delete w.previewTotal
    delete w.produccionTotal
  }
  const authorRows = rows.filter((r) => isAuthorProfile(r.path)).map((r) => ({ path: r.path, bytes: r.bytes.preview, produccion: r.bytes.produccion, presupuesto: AUTHOR_HTML_BUDGET, ok: r.bytes.preview > 0 && r.bytes.preview <= AUTHOR_HTML_BUDGET }))

  // Consola.
  let failedUrls = 0
  for (const r of rows) {
    if (r.fallos.length === 0) console.log(`PASS ${r.path}`)
    else {
      failedUrls += 1
      for (const f of r.fallos) console.log(`FAIL ${r.path} [${f.field}] ${f.message}`)
    }
  }
  for (const f of linkFailures) console.log(`FAIL enlaces [${f.field}] ${f.message}`)
  for (const f of redirectFailures) console.log(`FAIL redirects ${f.message}`)
  for (const a of authorRows) console.log(`${a.ok ? 'PASS' : 'FAIL'} presupuesto de autor ${a.path}: ${a.bytes} bytes (producción ${a.produccion}, límite ${a.presupuesto})`)

  const allDiffs = [...rows.flatMap((r) => r.fallos.map((f) => ({ path: r.path, ...f }))), ...linkFailures.map((f) => ({ path: f.target, field: f.field, message: f.message, clase: f.clase, motivo: f.motivo })), ...redirectFailures.map((f) => ({ path: f.from, field: f.field, message: f.message, clase: f.clase, motivo: f.motivo }))]
  const byClass = allDiffs.reduce((acc, d) => ((acc[d.clase] = (acc[d.clase] ?? 0) + 1), acc), {})
  const total = {
    urlsRevisadas: rows.length,
    delSitemap: list.sitemap.length,
    fueraDelSitemap: list.extras.length,
    rutasNuevas: list.fresh.length,
    urlsPass: rows.length - failedUrls,
    urlsFail: failedUrls,
    enlacesInternosRevisados: linkedFrom.size,
    enlacesFail: linkFailures.length,
    redirectsRevisados: redirectRows.length,
    redirectsFail: redirectFailures.length,
    diferencias: allDiffs.length,
    porClase: byClass,
  }
  const gate = allDiffs.length === 0 ? 'PASS' : 'FAIL'
  console.log(
    `${gate} 57-seo-parity-all: ${total.urlsPass} de ${total.urlsRevisadas} URLs sin diferencias (${total.delSitemap} del sitemap, ${total.fueraDelSitemap} fuera, ${total.rutasNuevas} nuevas); ${total.enlacesFail} fallos de enlaces en ${total.enlacesInternosRevisados} destinos; ${total.redirectsFail} redirects distintos de ${total.redirectsRevisados}`,
  )

  const oi = args.indexOf('--out')
  if (oi >= 0 && args[oi + 1]) {
    const result = {
      generado: new Date().toISOString(),
      modo: 'preview-contra-produccion',
      preview: base,
      produccion: prodBase,
      expectPreview,
      toleranciaPalabras: wordsTolerance,
      presupuestoAutorBytes: AUTHOR_HTML_BUDGET,
      gate,
      total,
      diferencias: allDiffs,
      urls: rows.map(({ _links, ...r }) => ({ ...r, enlacesInternos: _links.preview.length })),
      enlaces: { fallos: linkFailures, gemelosNoindexEnProduccion: [...prodTwinLinks].map(([target, from]) => ({ target, from })) },
      redirects: { error: redirects.error, filas: redirectRows },
      pesoPorPlantilla: weights,
      presupuestoAutor: authorRows,
    }
    const md = [
      '# Paridad SEO del preview contra producción',
      '',
      `Generado ${result.generado} con \`scripts/verify/57-seo-parity-all.mjs\`. Preview ${base}, producción ${prodBase}.`,
      '',
      `Resultado: **${gate}**. ${total.urlsPass} de ${total.urlsRevisadas} URLs sin diferencias (${total.delSitemap} del sitemap de producción, ${total.fueraDelSitemap} fuera del sitemap, ${total.rutasNuevas} rutas nuevas). Diferencias totales: ${total.diferencias} (${Object.entries(byClass).map(([k, v]) => `${k}: ${v}`).join(', ') || 'ninguna'}).`,
      '',
      'Clases: **a** se corrige en 57-06; **b** diferencia legítima del rediseño que Juan acepta por escrito en 57-09; **c** falso positivo del extractor, corregido en el script.',
      '',
      '## Diferencias por URL',
      '',
      '| URL | Campo | Detalle | Clase | Motivo |',
      '|---|---|---|---|---|',
      ...allDiffs.map((d) => `| ${esc(d.path)} | ${d.field} | ${esc(d.message.slice(0, 300))} | ${d.clase} | ${esc(d.motivo)} |`),
      '',
      '## Presupuesto del autor (F5)',
      '',
      ...authorRows.map((a) => `- ${a.path}: ${a.bytes} bytes en el preview, ${a.produccion} en producción, límite ${a.presupuesto}: ${a.ok ? 'PASS' : 'FAIL'}`),
      '',
      '## Enlaces internos (F4 y F12)',
      '',
      `Destinos revisados en el preview: ${total.enlacesInternosRevisados}. Fallos: ${total.enlacesFail}. Enlaces a gemelos noindex en producción (referencia): ${prodTwinLinks.size}.`,
      '',
      '## Peso de HTML por plantilla (bytes sin comprimir)',
      '',
      '| Plantilla | URLs | Preview medio | Producción medio | Preview máximo | Producción máximo |',
      '|---|---|---|---|---|---|',
      ...Object.entries(weights).map(([k, w]) => `| ${k} | ${w.urls} | ${w.previewMedio} | ${w.produccionMedio} | ${w.previewMax} | ${w.produccionMax} |`),
      '',
      '## Todas las URLs',
      '',
      '| URL | Origen | Estado preview | Palabras main preview / producción | Resultado |',
      '|---|---|---|---|---|',
      ...rows.map((r) => `| ${esc(r.path)} | ${r.origen} | ${r.estado.preview} | ${r.palabras.preview?.main ?? '-'} / ${r.palabras.produccion?.main ?? '-'} | ${r.fallos.length === 0 ? 'PASS' : `FAIL (${r.fallos.map((f) => f.field).join(', ')})`} |`),
    ]
    writeOutputs(args[oi + 1], result, md)
  }
  return gate === 'PASS' ? 0 : 1
}

// ---------------------------------------------------------- snapshot de producción

async function textFile(base, name) {
  const r = await fetchPage(`${base}/${name}`, { follow: false })
  return { status: r.status || r.error, bytes: Buffer.byteLength(r.html ?? '', 'utf8'), sha: hash(r.html ?? ''), text: name === 'llms-full.txt' ? undefined : r.html }
}

/** Estado de producción: lo que guarda --snapshot y lo que recalcula --vs-snapshot. */
async function captureProd(prodBase, paths) {
  const pages = {}
  await pool(paths, CONCURRENCY, async (path) => {
    const nf = await fetchPage(prodBase + path, { follow: false })
    const entry = { status: nf.status || nf.error, location: pathOfLocation(nf.location, prodBase) }
    if (nf.status === 200) {
      const f = pageFacts(nf.html, { xRobotsTag: nf.xRobotsTag })
      Object.assign(entry, { bytes: f.bytes, seo: f.seo, jsonldHash: hash(f.seo.jsonld), words: f.words, h1: f.h1, skips: f.skips, links: f.links })
    }
    pages[path] = entry
  })
  const sm = await fetchPage(`${prodBase}/sitemap.xml`, { follow: false })
  const redirects = await loadRedirectSources(prodBase)
  const redirectState = {}
  await pool(redirects.items, CONCURRENCY, async (d) => {
    const r = await fetchPage(prodBase + d.from, { follow: false })
    redirectState[d.from] = { status: r.status || r.error, location: pathOfLocation(r.location, prodBase) }
  })
  return {
    pages,
    files: {
      'sitemap.xml': { status: sm.status || sm.error, sha: hash(sm.html ?? ''), locs: sitemapPaths(sm.html ?? '') },
      'robots.txt': await textFile(prodBase, 'robots.txt'),
      'llms.txt': await textFile(prodBase, 'llms.txt'),
      'llms-full.txt': await textFile(prodBase, 'llms-full.txt'),
    },
    redirects: redirectState,
  }
}

async function snapshotRun(args, file) {
  const prodBase = (process.env.PROD_BASE ?? SITE).replace(/\/$/, '')
  const list = await buildUrlList(prodBase)
  let paths = [...list.sitemap, ...list.extras, ...list.fresh]
  const li = args.indexOf('--limit')
  if (li >= 0) paths = paths.slice(0, Number(args[li + 1]))
  const state = await captureProd(prodBase, paths)
  const snap = { generado: new Date().toISOString(), produccion: prodBase, paths, ...state }
  writeFileSync(file, `${JSON.stringify(snap, null, 2)}\n`)
  const ok = Object.values(state.pages).filter((p) => p.status === 200).length
  console.log(`PASS snapshot de ${prodBase}: ${paths.length} URLs (${ok} con 200), sitemap ${state.files['sitemap.xml'].locs.length} locs, ${Object.keys(state.redirects).length} redirects -> ${file}`)
  return 0
}

/** Diferencias entre producción de ahora y el snapshot (pura, para el selftest). */
export function diffSnapshot(now, snap, { wordsTolerance = DEFAULT_WORDS_TOLERANCE } = {}) {
  const out = []
  for (const path of snap.paths) {
    const a = now.pages[path]
    const b = snap.pages[path]
    if (!a) {
      out.push({ path, field: 'estado', message: 'sin respuesta en la corrida actual' })
      continue
    }
    if (a.status !== b.status || a.location !== b.location) {
      out.push({ path, field: 'estado', message: `ahora ${a.status} ${a.location}, snapshot ${b.status} ${b.location}` })
      continue
    }
    if (a.status !== 200) continue
    for (const f of comparePage(a, b, { wordsTolerance, label: 'snapshot', relative: true })) out.push({ path, ...f })
  }
  const nl = new Set(now.files['sitemap.xml'].locs)
  const sl = new Set(snap.files['sitemap.xml'].locs)
  const added = [...nl].filter((x) => !sl.has(x))
  const removed = [...sl].filter((x) => !nl.has(x))
  if (added.length || removed.length) out.push({ path: '/sitemap.xml', field: 'sitemap', message: `${added.length} URL(s) nuevas (${added.slice(0, 5).join(', ')}), ${removed.length} fuera (${removed.slice(0, 5).join(', ')})` })
  for (const name of ['robots.txt', 'llms.txt', 'llms-full.txt']) {
    const a = now.files[name]
    const b = snap.files[name]
    if (a.status !== b.status || a.sha !== b.sha) out.push({ path: `/${name}`, field: name, message: `ahora ${a.status}, ${a.bytes} bytes; snapshot ${b.status}, ${b.bytes} bytes (contenido distinto)` })
  }
  for (const [from, b] of Object.entries(snap.redirects)) {
    const a = now.redirects[from]
    if (!a) out.push({ path: from, field: 'redirect', message: 'el redirect ya no está en la colección' })
    else if (a.status !== b.status || a.location !== b.location) out.push({ path: from, field: 'redirect', message: `ahora ${a.status} ${a.location}, snapshot ${b.status} ${b.location}` })
  }
  return out
}

async function vsSnapshotRun(args, file) {
  const prodBase = (process.env.PROD_BASE ?? SITE).replace(/\/$/, '')
  const wordsTolerance = Number(process.env.WORDS_TOLERANCE ?? DEFAULT_WORDS_TOLERANCE)
  const snap = JSON.parse(readFileSync(file, 'utf8'))
  const comparable = snap.paths.filter((p) => !isNewRoute(p))
  const now = await captureProd(prodBase, comparable)
  const diffs = diffSnapshot(now, { ...snap, paths: comparable }, { wordsTolerance })

  // Rutas nuevas: tras el corte deben cumplir su contrato en producción.
  if (!args.includes('--skip-new-routes')) {
    for (const r of NEW_ROUTES) {
      const p = await fetchPage(prodBase + r.path)
      for (const message of checkNewRoute(p.html ?? '', r, { status: p.status, headers: { 'x-robots-tag': p.xRobotsTag } })) diffs.push({ path: r.path, field: 'contrato-ruta-nueva', message })
    }
  }
  // Enlaces internos de producción hacia gemelos noindex, redirects o 404 (F4 y F12 tras el corte).
  const slugs = loadIncompleteSlugs()
  const linkedFrom = new Map()
  for (const path of comparable) {
    for (const t of now.pages[path]?.links ?? []) linkedFrom.set(t, [...(linkedFrom.get(t) ?? []), path])
  }
  const statusOf = await probeLinks(prodBase, [...linkedFrom.keys()])
  for (const f of checkLinks(linkedFrom, slugs, statusOf)) diffs.push({ path: f.target, field: f.field, message: f.message })

  for (const d of diffs) console.log(`FAIL ${d.path} [${d.field}] ${d.message}`)
  const gate = diffs.length === 0 ? 'PASS' : 'FAIL'
  console.log(`${gate} 57-seo-parity-all --live-prod: ${diffs.length} diferencia(s) contra el snapshot del ${snap.generado} en ${comparable.length} URLs, sitemap, robots, llms y ${Object.keys(snap.redirects).length} redirects`)
  const oi = args.indexOf('--out')
  if (oi >= 0 && args[oi + 1]) {
    const result = { generado: new Date().toISOString(), modo: 'produccion-contra-snapshot', produccion: prodBase, snapshot: file, snapshotGenerado: snap.generado, gate, diferencias: diffs.map((d) => ({ ...d, ...classify(d.path, d) })) }
    const md = [
      '# Producción contra snapshot',
      '',
      `Generado ${result.generado}. Producción ${prodBase} contra el snapshot ${file} (${snap.generado}).`,
      '',
      `Resultado: **${gate}**, ${diffs.length} diferencia(s).`,
      '',
      '| URL | Campo | Detalle |',
      '|---|---|---|',
      ...diffs.map((d) => `| ${esc(d.path)} | ${d.field} | ${esc(d.message.slice(0, 300))} |`),
    ]
    writeOutputs(args[oi + 1], result, md)
  }
  return gate === 'PASS' ? 0 : 1
}

// ------------------------------------------------------------------- selftest

const LD = [{ '@type': 'WebSite', name: 'Juan' }, { '@type': 'BlogPosting', headline: 'Titulo', datePublished: '2026-01-02', author: { '@type': 'Person', name: 'Juan' } }]

function fixture(o = {}) {
  const {
    title = 'Post | Juan',
    description = 'Descripcion',
    canonical = `${SITE}/blog/development/react-19`,
    hreflangEn = true,
    ogImage = `${SITE}/og/a.png`,
    ld = LD,
    ldRaw = null,
    h1s = 1,
    skip = false,
    words = 400,
    links = ['/blog', '/servicios', '/blog/development/hidratacion-web'],
    pad = 0,
  } = o
  const ldScripts = ldRaw ?? ld.map((n) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...n })}</script>`).join('')
  return (
    '<!DOCTYPE html><html lang="es"><head>' +
    `<title>${title}</title><meta name="description" content="${description}"/>` +
    `<link rel="canonical" href="${canonical}"/>` +
    `<link rel="alternate" hrefLang="es" href="${SITE}/blog/development/react-19"/>` +
    (hreflangEn ? `<link rel="alternate" hrefLang="en" href="${SITE}/en/blog/development/react-19"/>` : '') +
    `<meta property="og:title" content="Post"/><meta property="og:image" content="${ogImage}"/>` +
    '<meta name="twitter:card" content="summary_large_image"/>' +
    ldScripts +
    '</head><body><header><a href="/">Inicio</a><nav>menu menu menu</nav></header><main>' +
    '<h1>Titulo</h1>'.repeat(h1s) +
    (skip ? '<h2>Uno</h2><h4>Dos</h4>' : '<h2>Uno</h2><h3>Dos</h3>') +
    `<p>${Array.from({ length: words }, (_, i) => `palabra${i}`).join(' ')}</p>` +
    '<script>self.__next_f.push([1,"muchas palabras del payload que no cuentan"])</script>' +
    links.map((l) => `<a href="${l}">enlace</a>`).join('') +
    '</main>' +
    `<footer>${'x'.repeat(pad)}</footer></body></html>`
  )
}

function selftest() {
  let bad = 0
  const pass = (name) => console.log(`PASS selftest ${name}`)
  const fail = (name, detail) => {
    bad += 1
    console.log(`FAIL selftest ${name}: ${detail}`)
  }
  const facts = (html) => pageFacts(html, { pageUrl: `${SITE}/blog/development/react-19` })
  const ref = facts(fixture())
  const none = (name, diffs) => (diffs.length === 0 ? pass(`${name}: sin diferencias`) : fail(name, JSON.stringify(diffs)))
  const some = (name, diffs, field) => (diffs.some((d) => d.field === field) ? pass(`${name}: FAIL en ${field}`) : fail(name, `se esperaba FAIL en ${field} y dio ${JSON.stringify(diffs)}`))

  // Test 1: un campo distinto a la vez.
  console.log('Test 1: documentos idénticos y defectos de un solo campo')
  none('Test 1 documentos idénticos', comparePage(facts(fixture()), ref))
  some('Test 1 title', comparePage(facts(fixture({ title: 'Otro' })), ref), 'title')
  some('Test 1 description', comparePage(facts(fixture({ description: 'Otra' })), ref), 'description')
  some('Test 1 canonical', comparePage(facts(fixture({ canonical: `${SITE}/blog` })), ref), 'canonical')
  some('Test 1 un hreflang', comparePage(facts(fixture({ hreflangEn: false })), ref), 'hreflang')
  some('Test 1 og:image', comparePage(facts(fixture({ ogImage: 'https://dev.juan-tech.com/og/a.png' })), ref), 'og')
  some('Test 1 un bloque JSON-LD', comparePage(facts(fixture({ ld: [LD[0], { ...LD[1], datePublished: '2026-01-03' }] })), ref), 'jsonld')
  some('Test 1 un h1 extra', comparePage(facts(fixture({ h1s: 2 })), ref), 'h1')
  some('Test 1 salto h2 a h4', comparePage(facts(fixture({ skip: true })), ref), 'encabezados')
  some('Test 1 30% menos de palabras', comparePage(facts(fixture({ words: 280 })), ref), 'palabras')
  none('Test 1 1% menos de palabras dentro de la tolerancia', comparePage(facts(fixture({ words: 396 })), ref))
  none('Test 1 el script RSC no suma palabras', comparePage(facts(fixture()), facts(fixture().replace('muchas palabras', 'otras y otras y otras palabras'))))
  if (ref.words.main === 406 && ref.words.body === 410) pass(`Test 1 conteo de palabras: main ${ref.words.main}, body ${ref.words.body}`)
  else fail('Test 1 conteo de palabras', JSON.stringify(ref.words))

  // Test 2: JSON-LD parseado por bloques.
  console.log('Test 2: JSON-LD por bloques, no por cadena')
  const reordered = LD.map((n) => Object.fromEntries(Object.entries(n).reverse()))
  none('Test 2 claves en otro orden', comparePage(facts(fixture({ ld: reordered })), ref))
  const asGraph = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': LD })}</script>`
  none('Test 2 @graph contra bloques sueltos', comparePage(facts(fixture({ ldRaw: asGraph })), ref))
  const stringOnly = fixture().replace('</main>', '<script>self.__next_f.push([1,"application/ld+json application/ld+json"])</script></main>')
  none('Test 2 la cadena application/ld+json en el payload RSC no cuenta', comparePage(facts(stringOnly), ref))

  // Test 3: enlaces a gemelos noindex y a redirects.
  console.log('Test 3: enlaces internos')
  const real = loadIncompleteSlugs()
  if (real.size === 0) pass('Test 3 EN_TRANSLATION_INCOMPLETE leído del .ts: lista vacía')
  else fail('Test 3 lectura de EN_TRANSLATION_INCOMPLETE', JSON.stringify([...real]))
  // La regla se prueba con un conjunto fijo: la lista real puede estar vacía.
  const slugs = new Set(['react-19', 'que-es-css'])
  const linkMap = (html, page) => new Map(facts(html).links.map((l) => [l, [page]]))
  const ok200 = (m) => new Map([...m.keys()].map((k) => [k, { status: 200 }]))
  const react = linkMap(fixture(), '/blog/development/react-19')
  none('Test 3 post react-19 sin enlaces a /en/blog', checkLinks(react, slugs, ok200(react)))
  const twin = linkMap(fixture({ links: ['/blog', `${SITE}/en/blog/development/react-19`] }), '/blog/development/react-19')
  some('Test 3 enlace a gemelo EN noindex', checkLinks(twin, slugs, ok200(twin)), 'enlace-gemelo-noindex')
  const redir = linkMap(fixture({ links: ['/blog/cs-fundamentals/big-o-notation'] }), '/blog')
  some('Test 3 enlace a una URL que redirige', checkLinks(redir, slugs, new Map([['/blog/cs-fundamentals/big-o-notation', { status: 308, location: '/blog/cs-fundamentals/complejidad-algoritmica' }]])), 'enlace-redirect')
  if (!isNoindexTwin('/en/blog/seo/guia-eeat', slugs) && isNoindexTwin('/en/blog/development/que-es-css', slugs) && !isNoindexTwin('/blog/development/react-19', slugs)) pass('Test 3 isNoindexTwin solo marca /en/blog/<cat>/<slug> de la lista')
  else fail('Test 3 isNoindexTwin', 'clasificación incorrecta')
  const ext = facts(fixture({ links: ['https://github.com/x', 'mailto:a@b.c', '#top', '/api/x', 'https://dev.juan-tech.com/stack'] })).links
  if (JSON.stringify(ext) === JSON.stringify(['/', '/stack'])) pass('Test 3 internalLinks ignora externos, mailto, anclas y /api; normaliza el host del preview')
  else fail('Test 3 internalLinks', JSON.stringify(ext))

  if (skipProbe('/go/ahrefs') && skipProbe('/sitemap.html', { preview: true }) && !skipProbe('/sitemap.html') && !skipProbe('/en/sitemap.html', { preview: true })) pass('Test 3 skipProbe: /go/ siempre, sitemaps solo en el preview, /en/sitemap.html nunca')
  else fail('Test 3 skipProbe', 'exclusiones incorrectas')

  // Test 4: presupuesto del autor.
  console.log('Test 4: presupuesto de HTML del autor')
  const big = facts(fixture({ pad: 600_000 })).bytes
  const small = facts(fixture({ pad: 366_000 })).bytes
  some('Test 4 autor de 600 KB', checkAuthorBudget('/authors/juan-carlos-angulo', big), 'peso-autor')
  none('Test 4 autor de 366 KB', checkAuthorBudget('/authors/juan-carlos-angulo', small))
  none('Test 4 un post de 600 KB no entra en el presupuesto del autor', checkAuthorBudget('/blog/seo/a', big))
  some('Test 4 autor EN de 600 KB', checkAuthorBudget('/en/authors/juan-carlos-angulo', big), 'peso-autor')

  // Test 5: ruta nueva contra su contrato, no contra producción.
  console.log('Test 5: rutas nuevas')
  const prod404 = { status: 404, html: '<html><body>404</body></html>' }
  const ev = evaluateUrl({ path: '/sobre-mi', preview: { status: 200, html: aboutFixture(), xRobotsTag: 'noindex' }, prod: prod404, expectPreview: true })
  if (ev.kind === 'nueva' && ev.failures.length === 0) pass('Test 5 /sobre-mi válida contra su contrato aunque producción dé 404')
  else fail('Test 5 /sobre-mi', JSON.stringify(ev))
  const evBad = evaluateUrl({ path: '/sobre-mi', preview: { status: 200, html: aboutFixture({ title: 'Otro' }), xRobotsTag: 'noindex' }, prod: prod404, expectPreview: true })
  some('Test 5 /sobre-mi con title fuera de contrato', evBad.failures, 'contrato-ruta-nueva')
  const evOld = evaluateUrl({ path: '/stack', preview: { status: 200, html: fixture() }, prod: prod404 })
  some('Test 5 una ruta vieja con producción 404 sí falla', evOld.failures, 'estado')

  // Snapshot: misma producción da cero diferencias y un cambio de un campo se detecta.
  console.log('Snapshot: --live-prod --vs-snapshot')
  const page = (html) => {
    const f = facts(html)
    return { status: 200, location: '', bytes: f.bytes, seo: f.seo, jsonldHash: hash(f.seo.jsonld), words: f.words, h1: f.h1, skips: f.skips }
  }
  const state = (html, extra = {}) => ({
    paths: ['/blog/development/react-19'],
    pages: { '/blog/development/react-19': page(html) },
    files: {
      'sitemap.xml': { status: 200, sha: 'a', locs: ['/', '/blog'] },
      'robots.txt': { status: 200, sha: 'r', bytes: 10 },
      'llms.txt': { status: 200, sha: 'l', bytes: 10 },
      'llms-full.txt': { status: 200, sha: 'f', bytes: 10 },
    },
    redirects: { '/blog/x': { status: 308, location: '/blog/y' } },
    ...extra,
  })
  const snap = state(fixture())
  none('snapshot igual a producción', diffSnapshot(state(fixture()), snap))
  some('snapshot con title distinto', diffSnapshot(state(fixture({ title: 'Nuevo' })), snap), 'title')
  some('snapshot con robots.txt distinto', diffSnapshot({ ...state(fixture()), files: { ...snap.files, 'robots.txt': { status: 200, sha: 'z', bytes: 11 } } }, snap), 'robots.txt')
  some('snapshot con un redirect perdido', diffSnapshot({ ...state(fixture()), redirects: { '/blog/x': { status: 404, location: '' } } }, snap), 'redirect')
  some('snapshot con una URL fuera del sitemap', diffSnapshot({ ...state(fixture()), files: { ...snap.files, 'sitemap.xml': { status: 200, sha: 'b', locs: ['/'] } } }, snap), 'sitemap')

  const c1 = classify('/en/blog/development/react-19', { field: 'enlace-gemelo-noindex', message: 'x' })
  const c2 = classify('/stack', { field: 'title', message: 'x' })
  if (c1.clase === 'a' && c2.clase === 'sin-clasificar') pass('classify anota la clase conocida y deja sin clasificar lo nuevo')
  else fail('classify', JSON.stringify([c1, c2]))

  if (templateOf('/en/blog/seo/a') === 'post' && templateOf('/servicios/seo-consulting') === 'servicio' && templateOf('/en/authors/x') === 'autor' && templateOf('/') === 'home') pass('templateOf agrupa por plantilla')
  else fail('templateOf', 'plantilla incorrecta')

  console.log(bad === 0 ? 'PASS selftest 57-seo-parity-all: los cinco casos y el snapshot se comportan como se espera' : `FAIL selftest 57-seo-parity-all (${bad})`)
  return bad === 0 ? 0 : 1
}

// ------------------------------------------------------------------------ main

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const val = (flag) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  let code
  if (args.includes('--selftest')) code = selftest()
  else if (args.includes('--snapshot')) code = await snapshotRun(args, val('--snapshot'))
  else if (args.includes('--live-prod')) {
    const file = val('--vs-snapshot')
    if (!file) {
      console.error('FAIL --live-prod necesita --vs-snapshot <archivo>')
      code = 1
    } else code = await vsSnapshotRun(args, file)
  } else code = await compareRun(args)
  process.exit(code)
}
