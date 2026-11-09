// Paridad de contenido por post contra produccion (plan 55-02, PAG-05, D-16, D-32,
// Pitfall 4, T-55-06): el rediseno cambia el arbol visual, nunca el contenido.
//
// Por cada uno de los 58 posts, en es y en (la URL EN se deriva de la ES anteponiendo
// /en), descarga BASE_URL y PROD_BASE y exige, sobre el cuerpo del post:
//   - el texto visible (sin script ni style) no baja de produccion mas de 2 por ciento
//     (en palabras); el texto que se agrega no falla;
//   - el mismo numero de h2 y de h3 (el h1 del cuerpo se degrada a h2 en ambos; los
//     encabezados dentro de nav y aside, como el rotulo del TOC, no cuentan);
//   - el mismo numero de pre (bloques de codigo) y de table;
//   - cada pregunta de los bloques faq (se leen del Lexical que devuelve la API publica
//     de produccion) aparece como texto en el HTML de BASE_URL;
//   - el conjunto de enlaces internos, tras quitar el origen y el prefijo /en (el
//     diseno nuevo prefija /en los enlaces relativos de las paginas EN y produccion no;
//     Pitfall 4): ningun enlace de produccion puede faltar (FAIL). Un enlace de mas se
//     imprime como WARN: agregar un enlace no pierde SEO.
// "Cuerpo del post" es el article con id="post-body" si existe, si no el primer article
// y si no el main. Cada FAIL nombra el post, el locale y la medida.
//
// Modos:
//   --selftest   Fixture valido y defectuosos (texto 10 por ciento menor, tabla ausente,
//                bloque de codigo ausente, h2 de menos, pregunta de FAQ ausente, enlace
//                perdido); cada uno debe dar al menos un fallo.
//   --limit N    Solo los primeros N posts del sitemap (pruebas rapidas).
//
// Variables: BASE_URL (obligatoria sin --selftest), PROD_BASE (por defecto
// https://juan-tech.com). Probar con BASE_URL igual a PROD_BASE debe dar cero fallos.
// Nunca escribe en ninguna base: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

import { decodeEntities, enPath, fetchPostPaths, getPage, openTags, parseAttrs, pool } from './55-page-contract.mjs'

const TEXT_TOLERANCE = 0.02

// ----------------------------------------------------------------- medicion

/** Cuerpo del post: article#post-body, el primer article o el main. */
export function bodyScope(html) {
  const byId = html.match(/<article\b[^>]*\sid\s*=\s*["']post-body["'][^>]*>[\s\S]*?<\/article>/i)
  if (byId) return byId[0]
  const article = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)
  if (article) return article[0]
  const main = html.match(/<main\b[^>]*>[\s\S]*<\/main>/i)
  return main ? main[0] : html
}

function stripNonContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
}

/** Texto visible normalizado: sin etiquetas, entidades decodificadas, espacios colapsados. */
export function visibleText(html) {
  return decodeEntities(stripNonContent(html).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

const wordCount = (text) => (text ? text.split(' ').length : 0)

/** Enlace interno normalizado (sin origen, sin /en, sin barra final ni hash) o null. */
export function normalizeInternalLink(href, hosts) {
  if (!href) return null
  let value = decodeEntities(href).trim()
  if (value === '' || value.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(value)) return null
  if (/^https?:\/\//i.test(value)) {
    let u
    try {
      u = new URL(value)
    } catch {
      return null
    }
    if (!hosts.has(u.host.toLowerCase())) return null
    value = u.pathname + u.search
  } else if (!value.startsWith('/')) {
    return null
  }
  value = value.replace(/#.*$/, '')
  if (value === '/en') value = '/'
  else if (value.startsWith('/en/') || value.startsWith('/en?')) value = value.slice(3)
  if (value.length > 1) value = value.replace(/\/(?=\?|$)/, '')
  return value || '/'
}

/** Medidas de una pagina de post. `hosts` son los host que cuentan como internos. */
export function measure(html, hosts) {
  const scope = bodyScope(html)
  const clean = stripNonContent(scope)
  const headingScope = clean.replace(/<(nav|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const links = new Set()
  for (const tag of openTags(clean, 'a')) {
    const n = normalizeInternalLink(parseAttrs(tag).href, hosts)
    if (n) links.add(n)
  }
  return {
    words: wordCount(visibleText(scope)),
    h2: (headingScope.match(/<h2(?=[\s>/])/gi) ?? []).length,
    h3: (headingScope.match(/<h3(?=[\s>/])/gi) ?? []).length,
    pre: (clean.match(/<pre(?=[\s>/])/gi) ?? []).length,
    table: (clean.match(/<table(?=[\s>/])/gi) ?? []).length,
    links,
    pageText: visibleText(html).toLowerCase(),
  }
}

/** Preguntas de los bloques faq del Lexical de un post. */
export function faqQuestions(lexical) {
  const out = []
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    if (node.type === 'block' && node.fields?.blockType === 'faq') {
      for (const f of node.fields.faqs ?? []) if (typeof f?.question === 'string' && f.question.trim()) out.push(f.question.trim())
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v)
  }
  walk(lexical)
  return out
}

// --------------------------------------------------------------- comparacion

/**
 * Compara las medidas del preview con las de produccion.
 * @returns {{ failures: string[], warnings: string[] }}
 */
export function compareMeasures(base, prod, questions = []) {
  const failures = []
  const warnings = []
  if (base.words < prod.words * (1 - TEXT_TOLERANCE)) {
    const pct = (((prod.words - base.words) / prod.words) * 100).toFixed(1)
    failures.push(`texto visible ${base.words} palabras contra ${prod.words} de produccion (${pct}% menos, tolerancia ${TEXT_TOLERANCE * 100}%)`)
  }
  for (const key of ['h2', 'h3', 'pre', 'table']) {
    if (base[key] !== prod[key]) failures.push(`${key}: ${base[key]} contra ${prod[key]} de produccion`)
  }
  for (const q of questions) {
    if (!base.pageText.includes(visibleText(q).toLowerCase())) failures.push(`falta la pregunta de FAQ: ${q.slice(0, 80)}`)
  }
  const lost = [...prod.links].filter((l) => !base.links.has(l))
  if (lost.length > 0) failures.push(`${lost.length} enlace(s) interno(s) de produccion ausente(s): ${lost.slice(0, 3).join(', ')}`)
  const added = [...base.links].filter((l) => !prod.links.has(l))
  if (added.length > 0) warnings.push(`${added.length} enlace(s) interno(s) que produccion no tiene: ${added.slice(0, 3).join(', ')}`)
  return { failures, warnings }
}

// ------------------------------------------------------------------- selftest

const HOSTS = new Set(['juan-tech.com', 'www.juan-tech.com', 'dev.juan-tech.com'])

const para = (n) => `<p>${Array.from({ length: n }, (_, i) => `palabra${i}`).join(' ')}</p>`

const FIXTURE = (o = {}) => {
  const { words = 200, h2 = 2, h3 = 1, pre = 1, table = 1, faq = true, links = ['/blog/seo/otro', 'https://juan-tech.com/servicios'], extra = '' } = o
  return (
    '<!DOCTYPE html><html lang="es"><body><header><a href="/">Inicio</a></header><main>' +
    '<article id="post-body"><h1>Titulo</h1>' +
    para(words) +
    '<h2>Uno</h2>'.repeat(h2) +
    '<h3>Sub</h3>'.repeat(h3) +
    '<pre><code>x = 1</code></pre>'.repeat(pre) +
    '<table><tr><td>a</td></tr></table>'.repeat(table) +
    (faq ? '<div><h4>1. ¿Por qué importa?</h4><p>Porque si.</p></div>' : '') +
    links.map((l) => `<a href="${l}">enlace</a>`).join('') +
    extra +
    '</article><aside><h2>Relacionados</h2></aside></main></body></html>'
  )
}

function selftest() {
  let bad = 0
  const prodHtml = FIXTURE()
  const prod = measure(prodHtml, HOSTS)
  const questions = ['1. ¿Por qué importa?']
  const run = (html, qs = questions, ref = prod) => compareMeasures(measure(html, HOSTS), ref, qs)
  const none = (name, r) => {
    if (r.failures.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(r.failures)}`)
    }
  }
  const some = (name, r, needle) => {
    if (r.failures.length > 0 && (!needle || r.failures.some((x) => x.includes(needle)))) console.log(`PASS selftest ${name}: detecta ${r.failures.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba un fallo${needle ? ` con "${needle}"` : ''} y dio ${JSON.stringify(r.failures)}`)
    }
  }

  none('fixture valido contra si mismo', run(FIXTURE()))
  none('texto 1 por ciento menor entra en la tolerancia', run(FIXTURE({ words: 198 })))
  none('texto mayor que produccion', run(FIXTURE({ words: 260 })))
  none('encabezados dentro de aside no cuentan', run(FIXTURE({ extra: '<nav><h2>Indice</h2></nav>' })))
  none(
    'enlaces con /en y origen distinto',
    run(FIXTURE({ links: ['/en/blog/seo/otro', 'https://dev.juan-tech.com/servicios/'] })),
  )

  some('texto 10 por ciento menor', run(FIXTURE({ words: 180 })), 'texto visible')
  some('tabla ausente', run(FIXTURE({ table: 0 })), 'table')
  some('bloque de codigo ausente', run(FIXTURE({ pre: 0 })), 'pre')
  some('h2 de menos', run(FIXTURE({ h2: 1 })), 'h2')
  some('h3 de mas', run(FIXTURE({ h3: 2 })), 'h3')
  some('pregunta de FAQ ausente', run(FIXTURE({ faq: false })), 'FAQ')
  some('enlace interno perdido', run(FIXTURE({ links: ['/blog/seo/otro'] })), 'ausente')

  const extra = run(FIXTURE({ links: ['/blog/seo/otro', '/servicios', '/authors/x'] }))
  if (extra.failures.length === 0 && extra.warnings.length === 1) console.log('PASS selftest enlace de mas: un WARN y ningun fallo')
  else {
    bad += 1
    console.log(`FAIL selftest enlace de mas: ${JSON.stringify(extra)}`)
  }

  const n = (h) => normalizeInternalLink(h, HOSTS)
  const normOk =
    n('https://juan-tech.com/en/blog/a/') === '/blog/a' &&
    n('/en') === '/' &&
    n('/en/blog/a#x') === '/blog/a' &&
    n('/blog/a?x=1') === '/blog/a?x=1' &&
    n('https://otro.com/x') === null &&
    n('#toc') === null &&
    n('mailto:a@b.c') === null &&
    n('/engineering') === '/engineering'
  if (normOk) console.log('PASS selftest normalizeInternalLink: quita origen, /en, barra y hash; ignora externos y /engineering se conserva')
  else {
    bad += 1
    console.log('FAIL selftest normalizeInternalLink')
  }

  const faq = faqQuestions({
    root: { children: [{ type: 'block', fields: { blockType: 'faq', faqs: [{ question: 'P1' }, { question: 'P2' }] } }, { type: 'block', fields: { blockType: 'code-block' } }] },
  })
  if (faq.length === 2 && faq[1] === 'P2') console.log('PASS selftest faqQuestions: lee solo los bloques faq')
  else {
    bad += 1
    console.log(`FAIL selftest faqQuestions: ${JSON.stringify(faq)}`)
  }
  const scoped = bodyScope('<main><p>fuera</p><article><p>dentro</p></article></main>')
  if (scoped.includes('dentro') && !scoped.includes('fuera') && enPath('/blog/x') === '/en/blog/x') console.log('PASS selftest bodyScope: toma el article; enPath antepone /en')
  else {
    bad += 1
    console.log(`FAIL selftest bodyScope: ${scoped}`)
  }

  console.log(bad === 0 ? 'PASS selftest 55-content-parity: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 55-content-parity (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function fetchFaqMap(prodBase, locale) {
  const url = `${prodBase}/api/posts?locale=${locale}&limit=100&depth=0&select[slug]=true&select[content]=true`
  const res = await getPage(url)
  if (res.status !== 200) throw new Error(`${url} respondio ${res.status || res.error}`)
  const map = new Map()
  for (const d of JSON.parse(res.html).docs ?? []) map.set(d.slug, faqQuestions(d.content))
  return map
}

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const li = args.indexOf('--limit')
  const limit = li >= 0 ? Number(args[li + 1]) : Infinity
  const hosts = new Set(['juan-tech.com', 'www.juan-tech.com', new URL(base).host.toLowerCase(), new URL(prodBase).host.toLowerCase()])

  let posts
  let faq
  try {
    posts = (await fetchPostPaths(prodBase)).slice(0, Number.isFinite(limit) ? limit : undefined)
    faq = { es: await fetchFaqMap(prodBase, 'es'), en: await fetchFaqMap(prodBase, 'en') }
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
    const [page, prod] = await Promise.all([getPage(base + job.url), getPage(prodBase + job.url)])
    const tag = `${job.url} (${job.locale})`
    if (page.error || page.status !== 200) return { out: [`FAIL ${tag} paridad de contenido: ${base} responde ${page.error ?? page.status}`], f: 1, p: 0 }
    if (prod.error || prod.status !== 200) return { out: [`FAIL ${tag} paridad de contenido: produccion responde ${prod.error ?? prod.status}`], f: 1, p: 0 }
    const { failures, warnings } = compareMeasures(measure(page.html, hosts), measure(prod.html, hosts), faq[job.locale].get(job.slug) ?? [])
    const out = warnings.map((w) => `WARN ${tag} ${w}`)
    if (failures.length === 0) {
      out.push(`PASS ${tag} paridad de contenido`)
      return { out, f: 0, p: 1 }
    }
    return { out: [...out, ...failures.map((x) => `FAIL ${tag} ${x}`)], f: failures.length, p: 0 }
  })

  let failed = 0
  let passed = 0
  for (const r of results) {
    for (const l of r.out) console.log(l)
    failed += r.f
    passed += r.p
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 55-content-parity: ${passed} PASS, ${failed} FAIL en ${posts.length} posts x 2 locales`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  process.exit(args.includes('--selftest') ? selftest() : await live(args))
}
