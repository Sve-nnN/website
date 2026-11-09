// Contrato de afiliados de Stack (fase 54, plan 54-12, PAG-08).
//
// Valida sobre el HTML servido de /stack y /en/stack (no sobre el codigo fuente):
//   - La cantidad de enlaces con href que empieza por /go/ es igual a la cantidad
//     de ellos cuyo rel contiene sponsored y noopener, y todos llevan target _blank.
//   - El aviso de afiliados (role="note") aparece ANTES del primer /go/ en el
//     orden del HTML (T-54-49).
//   - Todo enlace a Amazon con href absoluto lleva sponsored (T-54-48).
//   - Hay un solo h1 y exactamente un <main (el del layout; la vista no declara
//     el suyo).
//   - Con EXPECT_PREVIEW=1, la cabecera x-robots-tag trae noindex.
//
// Modos:
//   --selftest  Evalua checkStackPage sobre un fixture valido (cero fallos) y sobre
//               defectuosos (un /go sin sponsored, el aviso despues del primer /go,
//               un enlace de Amazon del equipo sin sponsored, ...; cada defectuoso
//               debe dar al menos un fallo). Sale 0 solo si se comporta como se espera.
//   (sin modo)  Corre contra BASE_URL (obligatoria).
//
// Variables: BASE_URL, EXPECT_PREVIEW=1.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL.
// Cuenta con expresiones globales sobre el HTML (llega en una sola linea, `grep -c`
// daria siempre 1).
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

/** Etiquetas de apertura de un elemento (sin cuerpo ni cierre). */
function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

/** Atributos de una etiqueta de apertura como mapa nombre -> valor. */
function parseAttrs(tag) {
  const attrs = {}
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  const body = tag.replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '')
  let m
  while ((m = re.exec(body)) !== null) {
    const raw = m[2] ?? m[3] ?? m[4] ?? ''
    attrs[m[1].toLowerCase()] = raw.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  }
  return attrs
}

/** Quita las etiquetas style y script: sus textos no son marcado de la pagina. */
function markup(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')
}

/** Posicion de la primera etiqueta `a` con href /go/ en el HTML, o -1. */
function firstGoPosition(html) {
  const re = /<a(?=[\s>/])[^>]*>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    if ((parseAttrs(m[0]).href ?? '').startsWith('/go/')) return m.index
  }
  return -1
}

/** Posicion del primer elemento con role="note", o -1. */
function firstNotePosition(html) {
  const re = /<[a-z0-9]+(?=[\s>/])[^>]*>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    if (parseAttrs(m[0]).role === 'note') return m.index
  }
  return -1
}

const hasToken = (rel, token) => (rel ?? '').split(/\s+/).includes(token)

/**
 * @param {{ status: number, html: string, xRobotsTag?: string|null }} res
 * @param {{ expectPreview?: boolean }} opts
 * @returns {string[]} lista de fallos (vacia si cumple el contrato)
 */
export function checkStackPage({ status, html: rawHtml, xRobotsTag = null }, { expectPreview = false } = {}) {
  const failures = []
  const html = markup(rawHtml)

  if (status !== 200) failures.push(`estado ${status} (se esperaba 200)`)

  const anchors = openTags(html, 'a').map(parseAttrs)

  const goLinks = anchors.filter((a) => (a.href ?? '').startsWith('/go/'))
  if (goLinks.length === 0) failures.push('no hay ningun enlace /go/')
  const goWithRel = goLinks.filter((a) => hasToken(a.rel, 'sponsored') && hasToken(a.rel, 'noopener'))
  if (goLinks.length !== goWithRel.length) {
    failures.push(
      `${goLinks.length} enlaces /go/ pero solo ${goWithRel.length} con rel sponsored y noopener (` +
        `${goLinks.filter((a) => !goWithRel.includes(a)).map((a) => `${a.href} rel="${a.rel ?? ''}"`).join(', ')})`,
    )
  }
  const goNoTarget = goLinks.filter((a) => a.target !== '_blank')
  if (goNoTarget.length > 0) failures.push(`${goNoTarget.length} enlace(s) /go/ sin target _blank`)

  const notePos = firstNotePosition(html)
  const goPos = firstGoPosition(html)
  if (notePos === -1) failures.push('no hay aviso de afiliados con role="note"')
  else if (goPos !== -1 && notePos > goPos) failures.push('el aviso role="note" aparece despues del primer enlace /go/')

  const amazon = anchors.filter((a) => /^https?:\/\/[^/]*amazon\./i.test(a.href ?? ''))
  const amazonBad = amazon.filter((a) => !hasToken(a.rel, 'sponsored'))
  if (amazonBad.length > 0) failures.push(`${amazonBad.length} enlace(s) a Amazon sin sponsored: ${amazonBad.map((a) => a.href).join(', ')}`)

  const h1 = openTags(html, 'h1').length
  if (h1 !== 1) failures.push(`hay ${h1} <h1> (se esperaba 1)`)
  const mains = openTags(html, 'main').length
  if (mains !== 1) failures.push(`hay ${mains} <main (se esperaba exactamente 1, el del layout)`)

  if (expectPreview && !/noindex/i.test(xRobotsTag ?? '')) {
    failures.push(`falta x-robots-tag con noindex (cabecera: ${xRobotsTag})`)
  }
  return failures
}

// ---------------------------------------------------------------------- selftest

const GO = (slug, rel = 'sponsored nofollow noopener', target = ' target="_blank"') =>
  `<a href="/go/${slug}"${target} rel="${rel}">Probar ${slug}</a>`
const AMAZON = (id, rel = 'sponsored nofollow noopener') =>
  `<a href="https://www.amazon.com/dp/${id}?tag=juantech02-20" target="_blank" rel="${rel}">Ver en Amazon</a>`
const NOTE = '<div role="note"><p>Algunos enlaces de esta página son de afiliado.</p></div>'

const page = ({ note = NOTE, go = [GO('dinorank'), GO('ahrefs')], amazon = [AMAZON('B0DKFMSMYK')], h1 = '<h1>Mi stack</h1>', mains = 1 } = {}) =>
  `<html lang="es"><head><style>.x{content:"/go/ role=note"}</style></head><body><header></header>` +
  `${'<main id="main-content">'.repeat(mains)}<section>${h1}${note}</section>` +
  `<ul>${go.map((g) => `<li>${g}</li>`).join('')}</ul><ul>${amazon.map((a) => `<li>${a}</li>`).join('')}</ul>` +
  `${'</main>'.repeat(mains)}<footer></footer></body></html>`

function selftest() {
  let bad = 0
  const ok = (html, extra = {}) => ({ status: 200, html, ...extra })
  const expectClean = (name, res, opts) => {
    const f = checkStackPage(res, opts)
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const expectBroken = (name, res, opts) => {
    const f = checkStackPage(res, opts)
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }

  expectClean('valido', ok(page()))
  expectClean('valido en preview', ok(page(), { xRobotsTag: 'noindex, nofollow' }), { expectPreview: true })
  expectClean('valido con rel en otro orden', ok(page({ go: [GO('dinorank', 'noopener sponsored nofollow')] })))

  expectBroken('estado 500', { status: 500, html: page() })
  expectBroken('un /go sin sponsored', ok(page({ go: [GO('dinorank'), GO('ahrefs', 'nofollow noopener')] })))
  expectBroken('un /go sin noopener', ok(page({ go: [GO('dinorank', 'sponsored nofollow')] })))
  expectBroken('un /go sin target _blank', ok(page({ go: [GO('dinorank', 'sponsored nofollow noopener', '')] })))
  expectBroken('sin ningun /go', ok(page({ go: [] })))
  expectBroken('sin aviso role note', ok(page({ note: '' })))
  expectBroken('aviso con role alert en vez de note', ok(page({ note: NOTE.replace('role="note"', 'role="alert"') })))
  expectBroken('el aviso despues del primer /go', ok(page({ note: '' }).replace('</main>', `${NOTE}</main>`)))
  expectBroken('enlace de Amazon del equipo sin sponsored', ok(page({ amazon: [AMAZON('B0DKFMSMYK'), AMAZON('B0BHJJ9Y77', 'noopener')] })))
  expectBroken('dos h1', ok(page({ h1: '<h1>Uno</h1><h1>Dos</h1>' })))
  expectBroken('sin h1', ok(page({ h1: '' })))
  expectBroken('dos main', ok(page({ mains: 2 })))
  expectBroken('preview sin x-robots-tag', ok(page()), { expectPreview: true })
  expectBroken('preview con x-robots-tag sin noindex', ok(page(), { xRobotsTag: 'index' }), { expectPreview: true })

  if (bad === 0) console.log('PASS selftest 54-stack-affiliate: fixture valido sin fallos y defectuosos detectados')
  return bad > 0 ? 1 : 0
}

// -------------------------------------------------------------------------- HTTP

let failures = 0

async function fetchFinal(base, route) {
  // Sigue redirecciones a mano para quedarse con el estado final.
  let url = new URL(route, base)
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, { redirect: 'manual' })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url)
      continue
    }
    return { status: res.status, html: await res.text(), xRobotsTag: res.headers.get('x-robots-tag') }
  }
  return { status: 310, html: '', xRobotsTag: null }
}

function report(name, list) {
  if (list.length === 0) console.log(`PASS ${name}`)
  else {
    failures += list.length
    console.log(`FAIL ${name}: ${list.join('; ')}`)
  }
}

async function liveMode(base, expectPreview) {
  for (const route of ['/stack', '/en/stack']) {
    try {
      const res = await fetchFinal(base, route)
      report(route, checkStackPage(res, { expectPreview }))
    } catch (error) {
      report(route, [`error de red: ${error instanceof Error ? error.message : String(error)}`])
    }
  }
}

// -------------------------------------------------------------------------- main

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const expectPreview = process.env.EXPECT_PREVIEW === '1'

  if (args.includes('--selftest')) {
    process.exit(selftest())
  }
  const base = process.env.BASE_URL
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    process.exit(1)
  }
  await liveMode(base, expectPreview)
  process.exit(failures > 0 ? 1 : 0)
}
