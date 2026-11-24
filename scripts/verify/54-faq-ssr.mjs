// Texto de los paneles cerrados de cada acordeon de FAQ en el HTML servido, sin
// ejecutar JavaScript (fase 54, plan 54-16, SEO-03, Pitfall 7 y supuesto A6).
//
// Para `/`, `/en`, `/contact`, `/en/contact` y las cuatro landings de servicio en los
// dos idiomas, descarga el HTML tal cual lo sirve el servidor y, por cada resumen de
// acordeon MUI (clase MuiAccordionSummary-root) con `aria-controls`, exige:
//   - que exista en el HTML un elemento con ese `id`;
//   - que su texto, sin etiquetas, no este vacio;
//   - que el id aparezca una sola vez (el id duplicado rompe aria-controls).
// Cada pagina debe traer al menos un acordeon (un FAQ que desaparece del HTML es la
// regresion que este script existe para atrapar).
//
// Modos:
//   --selftest  Evalua checkFaqHtml sobre un fixture valido (cero fallos) y sobre
//               defectuosos (panel ausente, panel vacio, id duplicado, sin acordeones);
//               cada defectuoso debe dar al menos un fallo. Sale 0 solo si se comporta asi.
//   (sin modo)  Corre contra BASE_URL (obligatoria).
//
// Variable: BASE_URL. Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si
// hay algun FAIL. Cuenta con expresiones globales sobre el HTML (llega en una sola
// linea, `grep -c` daria siempre 1).
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de
// DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { pathToFileURL } from 'node:url'

// Misma lista que SERVICE_SLUGS de src/lib/service-slugs.ts (un .mjs no importa TypeScript).
const SERVICE_SLUGS = ['seo-technical-audit', 'seo-consulting', 'fullstack-development', 'ai-seo-geo']

export const PATHS = [
  '/',
  '/en',
  '/contact',
  '/en/contact',
  ...SERVICE_SLUGS.map((s) => `/servicios/${s}`),
  ...SERVICE_SLUGS.map((s) => `/en/services/${s}`),
]

function parseAttrs(tag) {
  const attrs = {}
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  const body = tag.replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '')
  let m
  while ((m = re.exec(body)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return attrs
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

/** Todas las etiquetas de apertura con su posicion. */
function allOpenTags(html) {
  const out = []
  const re = /<([a-zA-Z][a-zA-Z0-9]*)(?=[\s>/])[^>]*>/g
  let m
  while ((m = re.exec(html)) !== null) out.push({ name: m[1].toLowerCase(), tag: m[0], index: m.index, end: m.index + m[0].length })
  return out
}

/** Contenido de un elemento abierto en `open`, contando anidados del mismo nombre. */
function elementInner(html, open) {
  if (VOID.has(open.name)) return ''
  const re = new RegExp(`<(/?)${open.name}(?=[\\s>/])[^>]*>`, 'gi')
  re.lastIndex = open.end
  let depth = 1
  let m
  while ((m = re.exec(html)) !== null) {
    if (m[1] === '/') depth -= 1
    else if (!/\/>$/.test(m[0])) depth += 1
    if (depth === 0) return html.slice(open.end, m.index)
  }
  return html.slice(open.end)
}

function textOf(fragment) {
  return fragment
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * @param {string} html
 * @returns {{ failures: string[], accordions: number }}
 */
export function checkFaqHtml(html) {
  const failures = []
  const opens = allOpenTags(html)
  const summaries = opens.filter((o) => /MuiAccordionSummary-root/.test(parseAttrs(o.tag).class ?? '') && parseAttrs(o.tag)['aria-controls'])

  if (summaries.length === 0) failures.push('no hay ningun resumen de acordeon con aria-controls')

  for (const s of summaries) {
    const id = parseAttrs(s.tag)['aria-controls']
    const withId = opens.filter((o) => parseAttrs(o.tag).id === id)
    if (withId.length === 0) {
      failures.push(`el resumen apunta a "${id}" y ese id no existe en el HTML servido`)
      continue
    }
    if (withId.length > 1) failures.push(`el id "${id}" aparece ${withId.length} veces (debe ser unico)`)
    const text = textOf(elementInner(html, withId[0]))
    if (!text) failures.push(`el panel "${id}" existe pero no tiene texto`)
  }
  return { failures, accordions: summaries.length }
}

// ------------------------------------------------------------------- selftest

const SUMMARY = (id, panel) =>
  `<h3 class="MuiAccordion-heading"><button class="MuiButtonBase-root MuiAccordionSummary-root" type="button" id="${id}-h" aria-expanded="false" aria-controls="${panel}">Pregunta</button></h3>`
const PANEL = (id, text) =>
  `<div class="MuiCollapse-root MuiCollapse-hidden"><div class="MuiCollapse-wrapper"><div class="MuiCollapse-wrapperInner"><div id="${id}" role="region"><div class="MuiAccordionDetails-root"><p>${text}</p></div></div></div></div></div>`
const PAGE = (inner) => `<!DOCTYPE html><html lang="es"><body><main>${inner}<button aria-controls="menu-movil">Menu</button></main></body></html>`

function selftest() {
  let bad = 0
  const none = (name, f) => {
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const some = (name, f) => {
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }

  const valid = PAGE(SUMMARY('f-0', 'f-0-c') + PANEL('f-0-c', 'Respuesta uno') + SUMMARY('f-1', 'f-1-c') + PANEL('f-1-c', 'Respuesta <strong>dos</strong>'))
  const r = checkFaqHtml(valid)
  none('fixture valido', r.failures)
  if (r.accordions === 2) console.log('PASS selftest conteo: dos acordeones (el boton del menu no cuenta)')
  else {
    bad += 1
    console.log(`FAIL selftest conteo: ${r.accordions}`)
  }
  some('panel ausente', checkFaqHtml(PAGE(SUMMARY('f-0', 'f-0-c'))).failures)
  some('panel vacio', checkFaqHtml(PAGE(SUMMARY('f-0', 'f-0-c') + PANEL('f-0-c', ' '))).failures)
  some('id duplicado', checkFaqHtml(PAGE(SUMMARY('f-0', 'f-0-c') + PANEL('f-0-c', 'uno') + PANEL('f-0-c', 'dos'))).failures)
  some('sin acordeones', checkFaqHtml(PAGE('<p>nada</p>')).failures)

  console.log(bad === 0 ? 'PASS selftest 54-faq-ssr: fixture valido sin fallos y defectuosos detectados' : `FAIL selftest 54-faq-ssr (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- live

async function live() {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest')
    return 1
  }
  let failed = 0
  let passed = 0
  for (const path of PATHS) {
    const url = base + path
    let html
    try {
      let res = await fetch(url, { redirect: 'follow' }).catch(() => fetch(url, { redirect: 'follow' }))
      if (!res.ok) {
        failed += 1
        console.log(`FAIL ${path}: respondio ${res.status}`)
        continue
      }
      html = await res.text()
    } catch (err) {
      failed += 1
      console.log(`FAIL ${path}: ${err.message}`)
      continue
    }
    const { failures, accordions } = checkFaqHtml(html)
    if (failures.length === 0) {
      passed += 1
      console.log(`PASS ${path}: ${accordions} acordeon(es) con texto de panel en el HTML servido`)
    } else {
      for (const f of failures) {
        failed += 1
        console.log(`FAIL ${path}: ${f}`)
      }
    }
  }
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 54-faq-ssr: ${passed} PASS, ${failed} FAIL en ${PATHS.length} rutas`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(process.argv.includes('--selftest') ? selftest() : await live())
