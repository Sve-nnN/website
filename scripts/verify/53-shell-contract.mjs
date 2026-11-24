// Contrato HTML del shell (fase 53, BASE-02 y BASE-03, D-06, D-13, D-15).
//
// Valida sobre el HTML servido (no sobre el codigo fuente) que el shell cumple
// el contrato de landmarks y de arranque:
//   - <html> con lang esperado.
//   - Exactamente un <main>, con id="main-content" y tabindex="-1".
//   - Exactamente un <header> y un <footer>, ambos con aria-label.
//   - Todo <nav> con aria-label no vacio y distinto entre si.
//   - El primer <a> del <body> es el enlace de salto (href="#main-content").
//   - La cadena jt-motion (script de movimiento del head).
//   - "@layer mui" (prueba de que enableCssLayer esta activo).
//   - Con expectPreview: meta robots con noindex.
//
// Modos:
//   --selftest  Evalua checkShellHtml sobre un fixture valido (cero fallos) y
//               sobre tres defectuosos (dos main, sin enlace de salto, dos nav
//               con el mismo nombre; cada uno debe dar al menos un fallo).
//               Sale con 0 solo si el comportamiento es el esperado.
//   (sin modo)  Descarga BASE_URL + '/' (lang es) y BASE_URL + '/en' (lang en).
//
// Variables: BASE_URL (por defecto http://localhost:3000), EXPECT_PREVIEW=1.
// Cada comprobacion imprime PASS o FAIL motivo; cualquier FAIL sale con 1.
// Cuenta con expresiones globales: el HTML llega en una sola linea, asi que
// `grep -c` daria siempre 1 (Pitfall 3 de 53-RESEARCH.md).

import { pathToFileURL } from 'node:url'

/** Lee los atributos de una etiqueta de apertura como mapa nombre -> valor. */
function parseAttrs(tag) {
  const attrs = {}
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  // Se salta el nombre de la etiqueta.
  const body = tag.replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '')
  let m
  while ((m = re.exec(body)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return attrs
}

/** Todas las etiquetas de apertura de un elemento (sin cuerpo ni cierre). */
function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

/**
 * @param {string} html
 * @param {{ lang: string, expectPreview?: boolean }} opts
 * @returns {string[]} lista de fallos (vacia si el HTML cumple el contrato)
 */
export function checkShellHtml(html, { lang, expectPreview = false }) {
  const failures = []

  const htmlTag = openTags(html, 'html')[0]
  if (!htmlTag) failures.push('no hay etiqueta <html>')
  else if (parseAttrs(htmlTag).lang !== lang) {
    failures.push(`<html lang="${parseAttrs(htmlTag).lang ?? ''}" (se esperaba "${lang}")`)
  }

  const mains = openTags(html, 'main')
  if (mains.length !== 1) failures.push(`hay ${mains.length} <main> (se esperaba 1)`)
  else {
    const a = parseAttrs(mains[0])
    if (a.id !== 'main-content') failures.push('el <main> no tiene id="main-content"')
    if (a.tabindex !== '-1') failures.push('el <main> no tiene tabindex="-1"')
  }

  for (const name of ['header', 'footer']) {
    const tags = openTags(html, name)
    if (tags.length !== 1) failures.push(`hay ${tags.length} <${name}> (se esperaba 1)`)
    else if (!(parseAttrs(tags[0])['aria-label'] ?? '').trim()) {
      failures.push(`el <${name}> no tiene aria-label`)
    }
  }

  const navNames = []
  for (const tag of openTags(html, 'nav')) {
    const label = (parseAttrs(tag)['aria-label'] ?? '').trim()
    if (!label) failures.push('hay un <nav> sin aria-label o con aria-label vacio')
    else navNames.push(label)
  }
  const seen = new Set()
  for (const label of navNames) {
    if (seen.has(label)) failures.push(`dos <nav> comparten el aria-label "${label}"`)
    seen.add(label)
  }

  const bodyStart = html.search(/<body[\s>]/i)
  const afterBody = bodyStart === -1 ? '' : html.slice(bodyStart)
  const firstAnchor = afterBody.match(/<a(?=[\s>/])[^>]*>/i)
  if (!firstAnchor) failures.push('no hay ningun <a> en el body')
  else if (parseAttrs(firstAnchor[0]).href !== '#main-content') {
    failures.push(`el primer <a> del body apunta a "${parseAttrs(firstAnchor[0]).href ?? ''}" y no a #main-content`)
  }

  if (!html.includes('jt-motion')) failures.push('falta la cadena jt-motion (script de movimiento del head)')
  if (!/@layer\s+mui\b/.test(html)) failures.push('falta "@layer mui" (enableCssLayer inactivo)')

  if (expectPreview) {
    const robots = openTags(html, 'meta').filter((t) => (parseAttrs(t).name ?? '').toLowerCase() === 'robots')
    if (!robots.some((t) => /noindex/i.test(parseAttrs(t).content ?? ''))) {
      failures.push('falta meta robots con noindex (EXPECT_PREVIEW=1)')
    }
  }

  return failures
}

// ------------------------------------------------------------------- selftest

const SHELL_OK = (extra = {}) => {
  const {
    mains = '<main id="main-content" tabindex="-1" aria-label="Contenido principal"><div>x</div></main>',
    skip = '<a href="#main-content" class="MuiLink-root">Saltar al contenido</a>',
    navs = '<nav aria-label="Principal"><a href="/a">a</a></nav><nav aria-label="Pie"><a href="/b">b</a></nav>',
  } = extra
  return (
    '<!DOCTYPE html><html lang="es" data-motion="running"><head>' +
    '<meta name="robots" content="noindex, nofollow"/>' +
    "<script>(function(){localStorage.getItem('jt-motion')})()</script>" +
    '<style>@layer mui{.a{color:red}}</style></head><body>' +
    skip +
    '<header aria-label="Cabecera">' +
    navs +
    '</header>' +
    mains +
    '<footer aria-label="Pie de pagina"></footer></body></html>'
  )
}

function selftest() {
  let bad = 0
  const expect = (name, ok, detail) => {
    if (ok) console.log(`PASS ${name}`)
    else {
      bad += 1
      console.log(`FAIL ${name}: ${detail}`)
    }
  }

  const valid = checkShellHtml(SHELL_OK(), { lang: 'es', expectPreview: true })
  expect('fixture valido da cero fallos', valid.length === 0, valid.join(' | '))

  const wrongLang = checkShellHtml(SHELL_OK(), { lang: 'en' })
  expect('lang distinto del esperado da fallo', wrongLang.length > 0, 'no detecto el lang')

  const twoMains = checkShellHtml(
    SHELL_OK({
      mains:
        '<main id="main-content" tabindex="-1"><main><div>x</div></main></main>',
    }),
    { lang: 'es' },
  )
  expect('dos main da fallo', twoMains.some((f) => f.includes('<main>')), twoMains.join(' | ') || 'sin fallos')

  const noSkip = checkShellHtml(
    SHELL_OK({ skip: '<a href="/inicio">Inicio</a>' }),
    { lang: 'es' },
  )
  expect('sin enlace de salto da fallo', noSkip.some((f) => f.includes('#main-content')), noSkip.join(' | ') || 'sin fallos')

  const dupNav = checkShellHtml(
    SHELL_OK({
      navs: '<nav aria-label="Principal"><a href="/a">a</a></nav><nav aria-label="Principal"><a href="/b">b</a></nav>',
    }),
    { lang: 'es' },
  )
  expect('dos nav con el mismo nombre da fallo', dupNav.some((f) => f.includes('comparten')), dupNav.join(' | ') || 'sin fallos')

  const noRobots = checkShellHtml(SHELL_OK().replace('noindex, nofollow', 'index, follow'), {
    lang: 'es',
    expectPreview: true,
  })
  expect('preview sin noindex da fallo', noRobots.some((f) => f.includes('noindex')), noRobots.join(' | ') || 'sin fallos')

  console.log(bad === 0 ? 'SELFTEST OK' : `SELFTEST FAIL (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function live() {
  const base = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const expectPreview = process.env.EXPECT_PREVIEW === '1'
  let failed = 0
  for (const [path, lang] of [
    ['/', 'es'],
    ['/en', 'en'],
  ]) {
    const url = base + path
    let html
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) {
        failed += 1
        console.log(`FAIL ${url}: respondio ${res.status}`)
        continue
      }
      html = await res.text()
    } catch (err) {
      failed += 1
      console.log(`FAIL ${url}: ${err.message}`)
      continue
    }
    const failures = checkShellHtml(html, { lang, expectPreview })
    if (failures.length === 0) console.log(`PASS ${url} cumple el contrato del shell (lang ${lang})`)
    else {
      failed += failures.length
      for (const f of failures) console.log(`FAIL ${url}: ${f}`)
    }
  }
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const code = process.argv.includes('--selftest') ? selftest() : await live()
  process.exit(code)
}
