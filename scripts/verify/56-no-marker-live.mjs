// Verificador vivo de "cero marcadores" (fase 56, plan 56-12, criterio 1 de la fase, CONT-01).
//
// Descarga de BASE_URL (solo GET) la home, Sobre mi, contacto, servicios, stack, privacy,
// terms, casos y websites en es y en, y exige:
//   - estado 200;
//   - cero marcadores de ranura en el texto visible Y en el payload RSC de los scripts del
//     HTML (el marcador se arma por codigo; este archivo no lo escribe entero);
//   - que /en y /en/sobre-mi NO muestren el aviso de traduccion ("not available in English"):
//     si aparece, el global sombra no tiene el centinela EN sembrado y la pagina cae al espanol;
//   - que /api/testimonials de PROD_BASE tenga exactamente un documento (Patricia Ibarra, D-20);
//   - que la home de BASE_URL en es y en muestre ese nombre.
// Ignora [PLACEHOLDER] de las landings de Lima y Madrid (fuera de alcance): esas rutas no
// estan en la lista y la cadena [PLACEHOLDER] no es un marcador de ranura.
//
// El texto visible sale del HTML sin script ni style: los mensajes de next-intl viajan en el
// payload RSC de todas las paginas, asi que cada lugar se revisa por separado y el motivo
// del fallo dice donde estaba el marcador.
//
// Importante: se verifica contra el HTML servido, nunca contra lo que escribio un script de
// siembra (el unstable_cache tarda hasta 60 s en caducar).
//
// Variables: BASE_URL (obligatoria fuera de --selftest), PROD_BASE (por defecto
// https://juan-tech.com).
//
// Modos:
//   --selftest   HTML sintetico bueno y malo; no usa la red. Sale 0 solo si el comportamiento
//                es el esperado.
//   (sin modo)   Contra BASE_URL.
// Opcion:
//   --allow-en-notice   No exige la ausencia del aviso de traduccion en /en y /en/sobre-mi.
//                       Solo para cuando el EN todavia no se sembro a proposito (espera la
//                       aprobacion de Juan). Los marcadores y los testimonios se siguen exigiendo.
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun FAIL. Nunca
// escribe en ninguna base ni envia correos: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con NODE_OPTIONS="--require <scratchpad de la sesion>/dnsfix.cjs".

import { pathToFileURL } from 'node:url'

/** Apertura de marcador de ranura, armada por codigo. */
const SLOT = String.fromCharCode(123, 123)
/** Marcador completo con su cierre, para el payload RSC (evita falsos positivos de codigo minificado). */
const SLOT_FULL = new RegExp(`${SLOT.replace(/[{]/g, '\\{')}[^{}\\n]{0,80}\\}\\}`)

export const TESTIMONIAL_NAME = 'Patricia Ibarra'
const NOTICE_NEEDLE = 'not available in english'

/** Rutas a revisar. `notice` marca las que no pueden mostrar el aviso de traduccion. */
export const ROUTES = [
  { path: '/', locale: 'es', home: true },
  { path: '/sobre-mi', locale: 'es' },
  { path: '/contact', locale: 'es' },
  { path: '/servicios', locale: 'es' },
  { path: '/stack', locale: 'es' },
  { path: '/privacy', locale: 'es' },
  { path: '/terms', locale: 'es' },
  { path: '/case-studies', locale: 'es' },
  { path: '/websites', locale: 'es' },
  { path: '/en', locale: 'en', home: true, notice: true },
  { path: '/en/sobre-mi', locale: 'en', notice: true },
  { path: '/en/contact', locale: 'en' },
  { path: '/en/services', locale: 'en' },
  { path: '/en/stack', locale: 'en' },
  { path: '/en/privacy', locale: 'en' },
  { path: '/en/terms', locale: 'en' },
  { path: '/en/case-studies', locale: 'en' },
  { path: '/en/websites', locale: 'en' },
]

// ----------------------------------------------------------------- utilidades HTML

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
}

/** Texto visible: sin script, style ni noscript, sin etiquetas, con entidades resueltas. */
export function visibleText(html) {
  const noCode = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
  return decodeEntities(noCode.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** Contenido de todos los script, que es donde viaja el payload RSC. */
export function scriptsText(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n')
}

// ----------------------------------------------------------------- comprobaciones puras

/** Motivos de fallo de una pagina. Lista vacia significa que cumple. */
export function checkPage(route, { status, html }, { allowEnNotice = false } = {}) {
  const problems = []
  if (status !== 200) return [`estado ${status}, se esperaba 200`]
  const text = visibleText(html)
  if (text.includes(SLOT)) problems.push('marcador de ranura en el texto visible')
  if (SLOT_FULL.test(scriptsText(html))) problems.push('marcador de ranura en el payload RSC')
  if (route.notice && !allowEnNotice && text.toLowerCase().includes(NOTICE_NEEDLE)) {
    problems.push('muestra el aviso de traduccion: el global sombra no tiene el EN sembrado y cae al espanol')
  }
  return problems
}

/** La home debe nombrar al unico testimonio. */
export function checkHomeTestimonial(html) {
  return visibleText(html).includes(TESTIMONIAL_NAME) ? [] : [`la home no muestra el testimonio de ${TESTIMONIAL_NAME}`]
}

/** Respuesta de /api/testimonials de produccion: un solo documento, el de Patricia Ibarra. */
export function checkTestimonialsApi(json) {
  const problems = []
  const docs = Array.isArray(json?.docs) ? json.docs : []
  const total = typeof json?.totalDocs === 'number' ? json.totalDocs : docs.length
  if (total !== 1 || docs.length !== 1) problems.push(`hay ${total} testimonios en produccion y se esperaba 1`)
  else if (docs[0]?.name !== TESTIMONIAL_NAME) problems.push(`el unico testimonio es de "${String(docs[0]?.name)}" y se esperaba ${TESTIMONIAL_NAME}`)
  return problems
}

// ----------------------------------------------------------------- autoprueba

function fixture({ visible = '', script = '', title = 'Pagina' } = {}) {
  return `<!DOCTYPE html><html><head><title>${title}</title><style>.a{color:red}</style></head><body><main><h1>${title}</h1><p>${visible}</p></main><script>self.__next_f.push([1,"${script}"])</script></body></html>`
}

function selftest() {
  let bad = 0
  const expectEmpty = (label, list) => {
    if (list.length === 0) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}: ${list.join('; ')}`)
    }
  }
  const expectFail = (label, list, re) => {
    if (list.some((p) => re.test(p))) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}: no se detecto (${list.join('; ') || 'sin fallos'})`)
    }
  }
  const es = { path: '/', locale: 'es' }
  const en = { path: '/en', locale: 'en', notice: true }

  expectEmpty('pagina limpia', checkPage(es, { status: 200, html: fixture({ visible: 'Texto normal' }) }))
  expectEmpty('un [PLACEHOLDER] no es marcador de ranura', checkPage(es, { status: 200, html: fixture({ visible: '[PLACEHOLDER] de Lima' }) }))
  expectEmpty('codigo minificado con llaves dobles sin cierre de marcador no es marcador', checkPage(es, { status: 200, html: fixture({ script: 'if(a){{b()}c}' }) }))
  expectFail('marcador en el texto visible', checkPage(es, { status: 200, html: fixture({ visible: `Hola ${SLOT}fecha}} adios` }) }), /texto visible/)
  expectFail('marcador solo en el payload RSC', checkPage(es, { status: 200, html: fixture({ visible: 'limpio', script: `{\\"a\\":\\"${SLOT}fecha}}\\"}` }) }), /payload RSC/)
  expectFail('aviso de traduccion en /en', checkPage(en, { status: 200, html: fixture({ visible: 'This page is not available in English yet. You are viewing the Spanish content.' }) }), /aviso de traduccion/)
  expectEmpty('el aviso no se exige fuera de las rutas marcadas', checkPage({ path: '/en/stack', locale: 'en' }, { status: 200, html: fixture({ visible: 'This page is not available in English yet.' }) }))
  expectEmpty('/en sin aviso', checkPage(en, { status: 200, html: fixture({ visible: 'Technical SEO consultant' }) }))
  expectEmpty('--allow-en-notice deja pasar el aviso (EN sin sembrar a proposito)', checkPage(en, { status: 200, html: fixture({ visible: 'This page is not available in English yet.' }) }, { allowEnNotice: true }))
  expectFail('--allow-en-notice sigue exigiendo cero marcadores', checkPage(en, { status: 200, html: fixture({ visible: `x ${SLOT}f}}` }) }, { allowEnNotice: true }), /texto visible/)
  expectFail('estado distinto de 200', checkPage(es, { status: 500, html: '' }), /estado 500/)

  expectEmpty('home con el testimonio', checkHomeTestimonial(fixture({ visible: 'Patricia Ibarra, CEO' })))
  expectFail('home sin el testimonio', checkHomeTestimonial(fixture({ visible: 'Otra persona' })), /testimonio/)
  expectEmpty('un testimonio de Patricia Ibarra', checkTestimonialsApi({ totalDocs: 1, docs: [{ name: 'Patricia Ibarra' }] }))
  expectFail('cero testimonios', checkTestimonialsApi({ totalDocs: 0, docs: [] }), /hay 0/)
  expectFail('dos testimonios', checkTestimonialsApi({ totalDocs: 2, docs: [{ name: 'Patricia Ibarra' }, { name: 'Otro' }] }), /hay 2/)
  expectFail('un testimonio de otra persona', checkTestimonialsApi({ totalDocs: 1, docs: [{ name: 'Otro' }] }), /Otro/)
  expectFail('respuesta sin docs', checkTestimonialsApi({}), /hay 0/)

  console.log(bad === 0 ? 'PASS selftest 56-no-marker-live' : `FAIL selftest 56-no-marker-live (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------------- red

async function getText(url, retry = true) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return { status: res.status, body: await res.text() }
  } catch (err) {
    if (retry) return getText(url, false)
    return { status: 0, body: '', error: err.message }
  }
}

async function live() {
  const base = (process.env.BASE_URL ?? '').replace(/\/$/, '')
  if (!base) {
    console.log('FAIL BASE_URL es obligatoria (por ejemplo https://dev.juan-tech.com)')
    return 1
  }
  const prod = (process.env.PROD_BASE ?? 'https://juan-tech.com').replace(/\/$/, '')
  const allowEnNotice = process.argv.includes('--allow-en-notice')
  let fails = 0
  const report = (label, problems) => {
    if (problems.length === 0) console.log(`PASS ${label}`)
    else {
      fails += problems.length
      for (const p of problems) console.log(`FAIL ${label}: ${p}`)
    }
  }

  console.log(`56-no-marker-live: ${base} (testimonios de ${prod})`)
  for (const route of ROUTES) {
    const { status, body, error } = await getText(`${base}${route.path}`)
    if (error) {
      report(`${route.path}`, [`no se pudo descargar: ${error}`])
      continue
    }
    const problems = checkPage(route, { status, html: body }, { allowEnNotice })
    if (route.home && status === 200) problems.push(...checkHomeTestimonial(body))
    report(`${route.path} (${route.locale}) sin marcadores${route.notice && !allowEnNotice ? ' y sin aviso de traduccion' : ''}`, problems)
  }

  const api = await getText(`${prod}/api/testimonials?limit=100&depth=0`)
  let json = null
  try {
    json = JSON.parse(api.body)
  } catch {
    json = null
  }
  report('/api/testimonials de produccion', api.status === 200 && json ? checkTestimonialsApi(json) : [`respuesta invalida (estado ${api.status})`])

  console.log(fails === 0 ? 'PASS 56-no-marker-live: ES y EN sin marcadores y un solo testimonio' : `FAIL 56-no-marker-live (${fails})`)
  return fails === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const code = process.argv.includes('--selftest') ? selftest() : await live()
  process.exit(code)
}
