// Verificador vivo de los CTAs aprobados por Juan (fase 56, plan 56-10, D-15, CONT-02).
//
// Lee el inventario scripts/db/data/56-cta-map.json (se regenera con --export desde CTA_MAP) y,
// contra el HTML servido por BASE_URL (nunca contra la base escrita), exige:
//   - cada CTA con texto aprobado y carga `ahora` aparece en el texto VISIBLE de sus rutas, en
//     el idioma correcto (ES en las rutas es, EN en las rutas en);
//   - la frase retirada del cierre ("empiezo por mirar qué ve Google hoy") no aparece en
//     ninguna ruta.
// El texto visible se saca del HTML sin <script> ni <style>: los mensajes de next-intl viajan
// en el payload RSC de TODAS las paginas y un grep sobre el HTML crudo da falsos positivos.
//
// Las filas con carga `corte` (las que lee master: encabezado, bloques) solo se exigen con
// --cut (plan 56-14). Las filas pendientes, fuera del lote o sin ruta visible no se exigen.
//
// Modos:
//   --selftest      HTML sintetico bueno y malo; ademas comprueba que el JSON esta al dia con CTA_MAP.
//   --export        Regenera scripts/db/data/56-cta-map.json con tsx desde CTA_MAP.
//   --messages      Estatico: las claves de messages de cada fila aprobada tienen exactamente el
//                   texto aprobado en es y en, y las de filas pendientes conservan el vigente.
//   (sin modo)      Contra BASE_URL (obligatoria). Opciones: --only <id>, --cut.
//
// Solo HTTP de lectura. Nunca escribe en ninguna base ni envia correos.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MAP_JSON = join(ROOT, 'scripts', 'db', 'data', '56-cta-map.json')
const MAP_TS = 'scripts/db/data/56-cta-map.ts'
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx')

/** Rutas extra donde la frase retirada no puede aparecer aunque ningun CTA las liste. */
const EXTRA_RETIRED_ROUTES = {
  es: ['/', '/sobre-mi', '/case-studies', '/websites', '/servicios', '/contact', '/stack'],
  en: ['/en', '/en/sobre-mi', '/en/case-studies', '/en/websites', '/en/services', '/en/contact', '/en/stack'],
}

// ------------------------------------------------------------------ texto visible

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
}

/** Texto visible del HTML: sin script, style ni etiquetas, con entidades resueltas y espacios colapsados. */
export function visibleText(html) {
  const noCode = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  const text = decodeEntities(noCode.replace(/<[^>]+>/g, ' '))
  return text.replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()
}

function norm(s) {
  return s.replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** ¿El texto esperado aparece en el texto visible? `{tool}` y `{herramienta}` se leen como un nombre de herramienta. */
export function hasText(text, expected) {
  const exp = norm(expected)
  if (!/\{[a-z]+\}/i.test(exp)) return text.includes(exp)
  const pattern = exp
    .split(/(\{[a-z]+\})/i)
    .map((part) => (/^\{[a-z]+\}$/i.test(part) ? "(?!(?:el|the)\\b)[^\\s<>]+" : escapeRe(part)))
    .join('')
  return new RegExp(pattern).test(text)
}

/** `lang` del <html>, en minuscula, o null. */
export function htmlLang(html) {
  return html.match(/<html\b[^>]*\slang="([^"]+)"/i)?.[1]?.toLowerCase() ?? null
}

// ------------------------------------------------------------------ comprobaciones puras

/**
 * Comprobacion de una pagina.
 * @param {string} html
 * @param {{ lang: 'es'|'en', expect: {id: string, text: string}[], retired: string[], status?: number }} opts
 * @returns {string[]} motivos de fallo
 */
export function checkPage(html, { lang, expect, retired, status = 200 }) {
  const failures = []
  if (status !== 200) {
    failures.push(`estado ${status}`)
    return failures
  }
  const got = htmlLang(html)
  if (got && !got.startsWith(lang)) failures.push(`lang del html ${got} y se esperaba ${lang}`)
  const text = visibleText(html)
  for (const phrase of retired) {
    if (text.includes(norm(phrase))) failures.push(`aparece la frase retirada "${phrase}"`)
  }
  for (const e of expect) {
    if (!hasText(text, e.text)) failures.push(`${e.id}: falta "${e.text}"`)
  }
  return failures
}

/**
 * Arma lo que se exige por ruta a partir del inventario.
 * @returns {Map<string, { lang: 'es'|'en', expect: {id: string, text: string}[] }>}
 */
export function buildExpectations(data, { cut = false, only = null } = {}) {
  const byRoute = new Map()
  const add = (route, lang) => {
    if (!byRoute.has(route)) byRoute.set(route, { lang, expect: [] })
    return byRoute.get(route)
  }
  // Rutas donde la frase retirada no puede estar, aunque no se exija ningun CTA ahi.
  if (!only) {
    for (const r of EXTRA_RETIRED_ROUTES.es) add(r, 'es')
    for (const r of EXTRA_RETIRED_ROUTES.en) add(r, 'en')
  }
  for (const e of data.entries) {
    if (only && e.id !== only) continue
    if (e.estado !== 'aprobado') continue
    if (e.loadAt === 'excluido') continue
    if (e.loadAt === 'corte' && !cut) continue
    for (const r of e.routes.es) add(r, 'es').expect.push({ id: e.id, text: e.es })
    if (e.en) for (const r of e.routes.en) add(r, 'en').expect.push({ id: e.id, text: e.en })
  }
  return byRoute
}

/** Estatico: claves de messages contra el inventario. Devuelve los problemas. */
export function checkMessages(data, messages) {
  const problems = []
  const lookup = (locale, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), messages[locale])
  for (const e of data.entries) {
    for (const key of e.messageKeys) {
      const es = lookup('es', key)
      const en = lookup('en', key)
      if (typeof es !== 'string') problems.push(`${e.id}: falta messages.es ${key}`)
      if (typeof en !== 'string') problems.push(`${e.id}: falta messages.en ${key}`)
      if (e.estado === 'aprobado') {
        if (typeof es === 'string' && es !== e.es) problems.push(`${e.id}: messages.es ${key} dice "${es}" y lo aprobado es "${e.es}"`)
        if (typeof en === 'string' && en !== e.en) problems.push(`${e.id}: messages.en ${key} dice "${en}" y lo aprobado es "${e.en}"`)
      } else if (e.estado === 'pendiente') {
        if (typeof es === 'string' && es !== e.vigenteEs) problems.push(`${e.id}: messages.es ${key} cambio ("${es}") y la fila esta pendiente (vigente "${e.vigenteEs}")`)
      }
    }
  }
  return problems
}

// ------------------------------------------------------------------ inventario

function loadMap() {
  return JSON.parse(readFileSync(MAP_JSON, 'utf8'))
}

function exportFromTs() {
  const code = `import('./${MAP_TS}').then((m) => process.stdout.write(JSON.stringify(m.toLiveExport(), null, 2) + '\\n'))`
  return execFileSync(TSX, ['-e', code], { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
}

function doExport() {
  const out = exportFromTs()
  writeFileSync(MAP_JSON, out, 'utf8')
  const data = JSON.parse(out)
  console.log(`PASS export: ${data.entries.length} filas escritas en scripts/db/data/56-cta-map.json`)
  return 0
}

// ------------------------------------------------------------------ selftest

function fixture({ lang = 'es', body = '', rscMessages = '' } = {}) {
  return (
    `<!DOCTYPE html><html lang="${lang}"><head><title>t</title><style>.a{content:"Hablemos"}</style></head>` +
    `<body><main>${body}</main><script>self.__next_f.push(["${rscMessages}"])</script></body></html>`
  )
}

function selftest() {
  let bad = 0
  const ok = (name, cond, detail = '') => {
    if (cond) console.log(`PASS selftest: ${name}`)
    else {
      bad += 1
      console.log(`FAIL selftest: ${name}${detail ? ` (${detail})` : ''}`)
    }
  }

  const retired = ['empiezo por mirar qué ve Google hoy']
  const esExpect = [
    { id: 'cierre-titulo', text: 'Hablemos de tu sitio' },
    { id: 'cierre-lead', text: '¿Tienes un proyecto en mente? Cuéntame de qué se trata.' },
  ]
  const enExpect = [
    { id: 'cierre-titulo', text: "Let's talk about your site" },
    { id: 'cierre-lead', text: 'Have a project in mind? Tell me what it is about.' },
  ]
  const goodEs = fixture({
    lang: 'es',
    body: '<h2>Hablemos de tu sitio</h2><p>¿Tienes un proyecto en mente? Cuéntame de qué se trata.</p>',
  })
  const goodEn = fixture({
    lang: 'en',
    body: '<h2>Let&#x27;s talk about your site</h2><p>Have a project in mind? Tell me what it is about.</p>',
  })

  ok('ES bueno sin fallos', checkPage(goodEs, { lang: 'es', expect: esExpect, retired }).length === 0)
  ok('EN bueno sin fallos (apostrofo como entidad)', checkPage(goodEn, { lang: 'en', expect: enExpect, retired }).length === 0)

  const withRetired = fixture({
    lang: 'es',
    body: '<h2>Hablemos de tu sitio</h2><p>¿Tienes un proyecto en mente? Cuéntame de qué se trata y empiezo por mirar qué ve Google hoy.</p>',
  })
  const r1 = checkPage(withRetired, { lang: 'es', expect: esExpect, retired })
  ok('rechaza el HTML que conserva la frase retirada', r1.some((f) => /frase retirada/.test(f)), r1.join('; '))
  ok('el lead viejo tampoco satisface el lead aprobado', r1.some((f) => /cierre-lead/.test(f)))

  const spanishOnEn = fixture({
    lang: 'en',
    body: '<h2>Hablemos de tu sitio</h2><p>¿Tienes un proyecto en mente? Cuéntame de qué se trata.</p>',
  })
  const r2 = checkPage(spanishOnEn, { lang: 'en', expect: enExpect, retired })
  ok('rechaza el espanol en una ruta EN', r2.length === 2, r2.join('; '))

  ok('rechaza el lang equivocado', checkPage(goodEn.replace('lang="en"', 'lang="es"'), { lang: 'en', expect: enExpect, retired }).some((f) => /lang/.test(f)))

  // El texto que solo vive en el payload RSC o en un <style> no cuenta como visible.
  const onlyInScript = fixture({
    lang: 'es',
    body: '<h2>Otra cosa</h2>',
    rscMessages: 'Hablemos de tu sitio ¿Tienes un proyecto en mente? Cuéntame de qué se trata.',
  })
  const r3 = checkPage(onlyInScript, { lang: 'es', expect: esExpect, retired })
  ok('el texto de script y style no cuenta como visible', r3.length === 2, r3.join('; '))

  const retiredInScript = fixture({ lang: 'es', body: '<h2>Hablemos de tu sitio</h2><p>¿Tienes un proyecto en mente? Cuéntame de qué se trata.</p>', rscMessages: 'empiezo por mirar qué ve Google hoy' })
  ok('la frase retirada solo en un script no cuenta', checkPage(retiredInScript, { lang: 'es', expect: esExpect, retired }).length === 0)

  ok('estado distinto de 200 falla', checkPage(goodEs, { lang: 'es', expect: esExpect, retired, status: 500 }).some((f) => /500/.test(f)))

  // Marcador {tool}.
  const stack = fixture({ lang: 'es', body: '<a>Probar DinoRANK</a><a>Probar el auditor</a>' })
  ok('{tool} acepta un nombre de herramienta', hasText(visibleText(stack), 'Probar {tool}'))
  ok('{tool} no se conforma con "Probar el auditor"', !hasText(visibleText(fixture({ lang: 'es', body: '<a>Probar el auditor</a>' })), 'Probar {tool}'))

  // Construccion de expectativas desde el inventario.
  const data = {
    retired,
    entries: [
      { id: 'a', estado: 'aprobado', loadAt: 'ahora', es: 'Uno', en: 'One', routes: { es: ['/'], en: ['/en'] }, messageKeys: [] },
      { id: 'b', estado: 'aprobado', loadAt: 'corte', es: 'Dos', en: 'Two', routes: { es: ['/'], en: ['/en'] }, messageKeys: [] },
      { id: 'c', estado: 'pendiente', loadAt: 'ahora', es: 'Tres', routes: { es: ['/'], en: ['/en'] }, messageKeys: [] },
      { id: 'd', estado: 'aprobado', loadAt: 'excluido', es: 'Cuatro', en: 'Four', routes: { es: ['/'], en: ['/en'] }, messageKeys: [] },
      { id: 'e', estado: 'aprobado', loadAt: 'ahora', es: 'Cinco', en: 'Five', routes: { es: [], en: [] }, messageKeys: [] },
    ],
  }
  const exp = buildExpectations(data)
  ok('solo se exige lo aprobado con carga ahora y ruta', JSON.stringify(exp.get('/').expect.map((x) => x.id)) === '["a"]', JSON.stringify(exp.get('/').expect))
  ok('con --cut entra la fila de corte', buildExpectations(data, { cut: true }).get('/').expect.some((x) => x.id === 'b'))
  ok('la frase retirada se revisa en las rutas extra', exp.has('/servicios') && exp.has('/en/contact'))
  ok('--only deja solo esa fila y sin rutas extra', buildExpectations(data, { only: 'a' }).size === 2)

  // messages.
  const msgData = {
    entries: [
      { id: 'ok', estado: 'aprobado', es: 'Hola', en: 'Hello', vigenteEs: 'Hola', messageKeys: ['x.y'] },
      { id: 'pend', estado: 'pendiente', es: 'Viejo', en: null, vigenteEs: 'Viejo', messageKeys: ['x.z'] },
    ],
  }
  const msgGood = { es: { x: { y: 'Hola', z: 'Viejo' } }, en: { x: { y: 'Hello', z: 'Old' } } }
  ok('messages bueno sin problemas', checkMessages(msgData, msgGood).length === 0)
  ok('messages: detecta un aprobado distinto', checkMessages(msgData, { ...msgGood, en: { x: { y: 'Hi', z: 'Old' } } }).some((p) => /messages\.en x\.y/.test(p)))
  ok('messages: detecta una fila pendiente cambiada', checkMessages(msgData, { ...msgGood, es: { x: { y: 'Hola', z: 'Nuevo' } } }).some((p) => /pendiente/.test(p)))
  ok('messages: detecta una clave que falta', checkMessages(msgData, { es: { x: { y: 'Hola' } }, en: msgGood.en }).some((p) => /falta/.test(p)))

  // El JSON del repo esta al dia con CTA_MAP y cumple D-15.
  try {
    const fresh = JSON.parse(exportFromTs())
    const committed = loadMap()
    ok('56-cta-map.json esta al dia con CTA_MAP (corre --export si falla)', JSON.stringify(fresh) === JSON.stringify(committed))
    const cierre = committed.entries.find((e) => e.id === 'cierre-lead')
    ok('el cierre de la home coincide con D-15', cierre?.es === '¿Tienes un proyecto en mente? Cuéntame de qué se trata.' && cierre?.en === 'Have a project in mind? Tell me what it is about.')
    ok('ninguna fila de master queda con carga ahora', committed.entries.every((e) => !(e.origen === 'header' || e.origen === 'landing' || e.origen === 'bloque') || e.loadAt !== 'ahora'))
    ok('todas las filas tienen origen y momento de carga', committed.entries.every((e) => e.origen && e.loadAt))
    ok('la frase retirada esta en el inventario', committed.retired.includes('empiezo por mirar qué ve Google hoy'))
  } catch (err) {
    bad += 1
    console.log(`FAIL selftest: no se pudo comparar con CTA_MAP (${err.message})`)
  }

  console.log(`${bad === 0 ? 'PASS' : 'FAIL'} 56-cta-live --selftest`)
  return bad === 0 ? 0 : 1
}

// ------------------------------------------------------------------ modo estatico y vivo

function runMessages() {
  const data = loadMap()
  const messages = {
    es: JSON.parse(readFileSync(join(ROOT, 'messages', 'es.json'), 'utf8')),
    en: JSON.parse(readFileSync(join(ROOT, 'messages', 'en.json'), 'utf8')),
  }
  const problems = checkMessages(data, messages)
  for (const p of problems) console.log(`FAIL ${p}`)
  const keys = data.entries.reduce((n, e) => n + e.messageKeys.length, 0)
  console.log(`${problems.length === 0 ? 'PASS' : 'FAIL'} 56-cta-live --messages: ${keys} claves de messages revisadas`)
  return problems.length === 0 ? 0 : 1
}

async function get(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return { status: res.status, body: await res.text() }
  } catch (err) {
    if (retry) return get(url, false)
    return { status: 0, body: '', error: err.message }
  }
}

async function live(args) {
  const base = process.env.BASE_URL?.replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin --selftest, --export ni --messages')
    return 1
  }
  const onlyIdx = args.indexOf('--only')
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null
  const cut = args.includes('--cut')
  const data = loadMap()
  if (only && !data.entries.some((e) => e.id === only)) {
    console.error(`FAIL --only ${only}: no existe en el inventario`)
    return 1
  }
  const expectations = buildExpectations(data, { cut, only })
  let failed = 0
  for (const [route, { lang, expect }] of expectations) {
    const res = await get(base + route)
    const failures = res.error ? [`${base + route}: ${res.error}`] : checkPage(res.body, { lang, expect, retired: data.retired, status: res.status })
    if (failures.length === 0) console.log(`PASS ${route} (${expect.length} CTA${expect.length === 1 ? '' : 's'}, frase retirada ausente)`)
    else {
      failed += 1
      for (const f of failures) console.log(`FAIL ${route}: ${f}`)
    }
  }
  const pend = data.entries.filter((e) => e.estado === 'pendiente').length
  const skipped = data.entries.filter((e) => e.estado === 'aprobado' && e.loadAt === 'corte' && !cut).length
  console.log(`INFO ${pend} fila(s) pendientes sin exigir, ${skipped} aprobada(s) de corte sin exigir${cut ? '' : ' (usa --cut en 56-14)'}`)
  console.log(`${failed === 0 ? 'PASS' : 'FAIL'} 56-cta-live: ${expectations.size} ruta(s) revisadas contra ${base}`)
  return failed === 0 ? 0 : 1
}

const isMain = process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false
if (isMain) {
  const args = process.argv.slice(2)
  let code
  if (args.includes('--selftest')) code = selftest()
  else if (args.includes('--export')) code = doExport()
  else if (args.includes('--messages')) code = runMessages()
  else code = await live(args)
  process.exit(code)
}
