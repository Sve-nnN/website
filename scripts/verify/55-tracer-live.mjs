// Contrato en vivo del indice de Websites (fase 55, plan 55-01, PAG-04, T-55-04).
//
// Para /websites y /en/websites sobre el preview comprueba:
//   - estado 200, lang correcto, una apertura de h1, una de main y encabezados sin
//     saltos (reutiliza `checkContract` de 54-page-contract.mjs);
//   - con EXPECT_PREVIEW=1: meta robots con noindex y cabecera x-robots-tag con noindex;
//   - que el numero de enlaces DISTINTOS con href /websites/<slug> (o /en/websites/<slug>)
//     iguale el total de sitios que devuelve la API publica de PRODUCCION
//     (`PROD_BASE/api/websites?locale=<es|en>&limit=100&depth=0`). El contador de
//     referencia viene de otro origen que el que renderiza: asi un indice que lee mal
//     no se da por bueno contra si mismo (T-55-04);
//   - que cada sitio con captura en produccion tenga su imagen en el indice (`<img>` con
//     alt no vacio dentro de main). Un `populate` que pierde el `url` de Media (el adaptador
//     de Cloudinary lo genera desde `filename`) deja tarjetas sin captura y todo lo demas
//     en verde: lo detecto en el primer despliegue de 55-01;
//   - paridad de title, description, canonical, hreflang y tipos de JSON-LD contra la
//     misma ruta en produccion (`extractMeta` y `compareMeta` de 54-page-contract.mjs).
//
// Variables: BASE_URL (obligatoria sin --selftest), PROD_BASE (por defecto
// https://juan-tech.com), EXPECT_PREVIEW=1.
//
// Modos:
//   --selftest   Fixture valido sin fallos y defectuosos (dos h1, un enlace menos, sin
//                noindex, title distinto) que DEBEN fallar. Sale 0 solo si el
//                comportamiento es el esperado.
//   (sin modo)   Contra BASE_URL.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL. Los
// conteos usan expresiones globales sobre el HTML (llega en una sola linea; `grep -c`
// daria siempre 1).
//
// Nunca escribe en ninguna base ni envia correos: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

import { checkContract, compareMeta, extractMeta } from './54-page-contract.mjs'

const ROUTES = [
  { path: '/websites', locale: 'es', lang: 'es', apiLocale: 'es', linkPrefix: '/websites/' },
  { path: '/en/websites', locale: 'en', lang: 'en', apiLocale: 'en', linkPrefix: '/en/websites/' },
]

/** Enlaces internos distintos de la forma <prefijo><slug>, sin barra final ni consulta. */
export function distinctSiteLinks(html, linkPrefix) {
  const found = new Set()
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/gi)) {
    const href = m[1].replace(/&amp;/g, '&')
    if (!href.startsWith(linkPrefix)) continue
    const slug = href.slice(linkPrefix.length)
    if (slug && !/[/?#]/.test(slug)) found.add(href)
  }
  return found
}

/** Imagenes con alt no vacio dentro del main (las capturas; el avatar del cierre es decorativo). */
export function screenshotImages(html) {
  const main = html.match(/<main\b[\s\S]*<\/main>/i)?.[0] ?? ''
  return (main.match(/<img\b[^>]*\salt="[^"]+"/gi) ?? []).length
}

/**
 * Comprobacion pura de una pagina del indice.
 * @returns {string[]} motivos de fallo
 */
export function checkIndexPage(html, { route, status = 200, headers = {}, expectPreview = false, prodCount, prodWithImage }) {
  const { failures } = checkContract(html, {
    lang: route.lang,
    path: route.path,
    status,
    headers,
    expectPreview,
  })
  const links = distinctSiteLinks(html, route.linkPrefix)
  if (typeof prodCount !== 'number') {
    failures.push('no hay recuento de sitios de produccion contra el que comparar')
  } else if (links.size !== prodCount) {
    failures.push(`el indice lista ${links.size} sitios distintos y produccion tiene ${prodCount}`)
  }
  if (typeof prodWithImage === 'number') {
    const imgs = screenshotImages(html)
    if (imgs !== prodWithImage) {
      failures.push(`el indice trae ${imgs} capturas y produccion tiene ${prodWithImage} sitios con captura`)
    }
  }
  return failures
}

// ------------------------------------------------------------------- selftest

function fixtureHtml({ h1 = 1, links = 3, imgs = links, robots = 'noindex, nofollow', title = 'Sitios web | Juan', prefix = '/websites/' } = {}) {
  const head =
    '<!DOCTYPE html><html lang="es"><head>' +
    `<title>${title}</title>` +
    '<meta name="description" content="Descripcion real"/>' +
    (robots ? `<meta name="robots" content="${robots}"/>` : '') +
    '<link rel="canonical" href="https://juan-tech.com/websites"/>' +
    '<link rel="alternate" hreflang="es" href="https://juan-tech.com/websites"/>' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>' +
    '<style>@layer mui{.a{color:red}}</style></head>'
  const heads = Array.from({ length: h1 }, () => '<h1>Sitios web</h1>').join('')
  const anchors = Array.from({ length: links }, (_, i) => `<li><a href="${prefix}sitio-${i}">Sitio ${i}</a>${i < imgs ? `<img src="https://res.example.test/${i}.png" alt="Captura ${i}"/>` : ''}</li>`).join('')
  return `${head}<body><main id="main-content">${heads}<h2>Proyectos</h2><ul>${anchors}</ul></main></body></html>`
}

function selftest() {
  let bad = 0
  const route = ROUTES[0]
  const opts = { route, expectPreview: true, headers: { 'x-robots-tag': 'noindex, nofollow' }, prodCount: 3, prodWithImage: 3 }

  const valid = checkIndexPage(fixtureHtml(), opts)
  if (valid.length === 0) console.log('PASS selftest: fixture valido sin fallos')
  else {
    bad += 1
    console.log(`FAIL selftest: el fixture valido dio fallos: ${valid.join('; ')}`)
  }

  const cases = [
    ['dos h1', checkIndexPage(fixtureHtml({ h1: 2 }), opts), /2 h1/],
    ['un enlace menos que produccion', checkIndexPage(fixtureHtml({ links: 2 }), opts), /produccion tiene 3/],
    ['sin noindex en el meta', checkIndexPage(fixtureHtml({ robots: '' }), opts), /noindex/],
    ['sin x-robots-tag', checkIndexPage(fixtureHtml(), { ...opts, headers: {} }), /x-robots-tag/],
    ['estado distinto de 200', checkIndexPage(fixtureHtml(), { ...opts, status: 500 }), /500/],
    ['tarjetas sin captura', checkIndexPage(fixtureHtml({ imgs: 0 }), opts), /0 capturas/],
    ['sin recuento de produccion', checkIndexPage(fixtureHtml(), { ...opts, prodCount: undefined }), /recuento/],
  ]
  for (const [name, failures, expected] of cases) {
    if (failures.some((f) => expected.test(f))) console.log(`PASS selftest: ${name} se detecta`)
    else {
      bad += 1
      console.log(`FAIL selftest: ${name} no se detecta (fallos: ${failures.join('; ') || 'ninguno'})`)
    }
  }

  // Enlaces repetidos no inflan el conteo: dos anclas al mismo href cuentan una vez.
  const dup = fixtureHtml({ links: 3 }).replace('</ul>', '<li><a href="/websites/sitio-0">otra vez</a></li></ul>')
  if (checkIndexPage(dup, opts).length === 0) console.log('PASS selftest: un enlace repetido cuenta una sola vez')
  else {
    bad += 1
    console.log('FAIL selftest: un enlace repetido inflo el conteo')
  }

  // Paridad: un title distinto debe aparecer en compareMeta.
  const diff = compareMeta(extractMeta(fixtureHtml({ title: 'Otro titulo' })), extractMeta(fixtureHtml()))
  if (diff.some((d) => d.startsWith('title distinto'))) console.log('PASS selftest: title distinto se detecta en la paridad')
  else {
    bad += 1
    console.log('FAIL selftest: title distinto no se detecta en la paridad')
  }
  const same = compareMeta(extractMeta(fixtureHtml()), extractMeta(fixtureHtml()))
  if (same.length === 0) console.log('PASS selftest: metadatos iguales no dan diferencias')
  else {
    bad += 1
    console.log(`FAIL selftest: metadatos iguales dieron diferencias: ${same.join('; ')}`)
  }

  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function get(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const body = await res.text()
    const headers = {}
    res.headers.forEach((v, k) => {
      headers[k] = v
    })
    return { status: res.status, body, headers }
  } catch (err) {
    if (retry) return get(url, false)
    return { status: 0, body: '', headers: {}, error: err.message }
  }
}

async function prodSites(prodBase, apiLocale) {
  const res = await get(`${prodBase}/api/websites?locale=${apiLocale}&limit=100&depth=0`)
  if (res.status !== 200) throw new Error(`la API de produccion respondio ${res.status}${res.error ? ` (${res.error})` : ''}`)
  const json = JSON.parse(res.body)
  if (!Array.isArray(json.docs)) throw new Error('la API de produccion no devolvio docs')
  return {
    total: json.docs.length,
    withImage: json.docs.filter((d) => Array.isArray(d.screenshots) && d.screenshots.length > 0).length,
  }
}

async function live() {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  const prodBase = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const expectPreview = process.env.EXPECT_PREVIEW === '1'

  let failed = 0
  for (const route of ROUTES) {
    const failures = []
    let prodCount
    let prodWithImage
    try {
      const prodInfo = await prodSites(prodBase, route.apiLocale)
      prodCount = prodInfo.total
      prodWithImage = prodInfo.withImage
    } catch (err) {
      failures.push(`recuento de produccion: ${err.message}`)
    }

    const preview = await get(base + route.path)
    if (preview.error) failures.push(`${base + route.path}: ${preview.error}`)
    else {
      failures.push(
        ...checkIndexPage(preview.body, {
          route,
          status: preview.status,
          headers: preview.headers,
          expectPreview,
          prodCount,
          prodWithImage,
        }),
      )
      const prod = await get(prodBase + route.path)
      if (prod.status !== 200) failures.push(`produccion respondio ${prod.status} en ${route.path}`)
      else failures.push(...compareMeta(extractMeta(preview.body), extractMeta(prod.body)))
      const links = distinctSiteLinks(preview.body, route.linkPrefix)
      console.log(
        `INFO ${route.path}: ${links.size} tarjetas con enlace y ${screenshotImages(preview.body)} capturas en el preview, ${prodCount ?? '?'} sitios (${prodWithImage ?? '?'} con captura) en produccion`,
      )
    }

    if (failures.length === 0) console.log(`PASS ${route.path}`)
    else {
      failed += 1
      for (const f of failures) console.log(`FAIL ${route.path}: ${f}`)
    }
  }
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false
if (isMain) {
  const code = process.argv.includes('--selftest') ? selftest() : await live()
  process.exit(code)
}
