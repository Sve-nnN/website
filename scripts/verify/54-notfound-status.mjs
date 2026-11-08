// Contrato de estado 404 (fase 54, plan 01, PAG-11, supuesto A2 de 54-RESEARCH.md).
//
// Una URL sin pagina tiene que responder 404 REAL (no un 200 con cuerpo de
// "no encontrada"), dentro del shell, con un solo main, un solo h1, header,
// footer y noindex en el meta robots.
//
// Modos:
//   --selftest  Evalua checkNotFound sobre un fixture valido (cero fallos) y
//               sobre cuatro defectuosos (estado 200, sin main, dos h1, sin
//               noindex; cada uno debe dar al menos un fallo). Sale 0 solo si
//               el comportamiento es el esperado.
//   --spawn     Arranca .next/standalone/server.js con PREVIEW_READONLY=true,
//               DATABASE_URI falsa y un puerto libre; corre las URLs que no
//               leen la base (/pagina-inexistente, /en/foo, /blog/x/y/z,
//               /index.html) y mata el servidor.
//   --wait      Repite el chequeo contra BASE_URL cada 15 s hasta pasar o
//               agotar WAIT_SECONDS (por defecto 1200).
//   (sin modo)  Corre contra BASE_URL (obligatoria) las seis URLs, incluidas
//               /servicios/nope y /en/services/nope.
//
// Variables: BASE_URL, WAIT_SECONDS, EXPECT_PREVIEW=1 (exige tambien la
// cabecera x-robots-tag con noindex).
//
// Cada comprobacion imprime PASS o FAIL motivo y se sale con 1 si hay algun
// FAIL. Cuenta con expresiones globales sobre el HTML (llega en una sola linea,
// `grep -c` daria siempre 1).
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa
// de DNS, corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const LOCAL_URLS = ['/pagina-inexistente', '/en/foo', '/blog/x/y/z', '/index.html']
const LIVE_URLS = [...LOCAL_URLS, '/servicios/nope', '/en/services/nope']

/** Etiquetas de apertura de un elemento (sin cuerpo ni cierre). */
function openTags(html, name) {
  const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'gi')
  return html.match(re) ?? []
}

/**
 * @param {{ status: number, html: string, xRobotsTag?: string|null }} res
 * @param {{ expectPreview?: boolean }} opts
 * @returns {string[]} lista de fallos (vacia si cumple el contrato)
 */
export function checkNotFound({ status, html, xRobotsTag = null }, { expectPreview = false } = {}) {
  const failures = []

  if (status !== 404) failures.push(`estado ${status} (se esperaba 404)`)

  for (const [name, expected] of [
    ['main', 1],
    ['h1', 1],
    ['header', 1],
    ['footer', 1],
  ]) {
    const n = openTags(html, name).length
    if (n !== expected) failures.push(`hay ${n} <${name}> (se esperaba ${expected})`)
  }

  const robots = openTags(html, 'meta').find((tag) => /name\s*=\s*["']robots["']/i.test(tag))
  if (!robots) failures.push('no hay meta robots')
  else if (!/content\s*=\s*["'][^"']*noindex/i.test(robots)) failures.push('meta robots sin noindex')

  if (expectPreview && !/noindex/i.test(xRobotsTag ?? '')) {
    failures.push(`falta x-robots-tag con noindex (cabecera: ${xRobotsTag})`)
  }

  return failures
}

// ---------------------------------------------------------------------- selftest

const VALID_HTML =
  '<html lang="es"><head><meta name="robots" content="noindex, nofollow"/></head><body>' +
  '<header aria-label="Cabecera"></header><main id="main-content"><h1>Esta página no existe</h1></main>' +
  '<footer aria-label="Pie"></footer></body></html>'

function selftest() {
  let bad = 0
  const expectClean = (name, res, opts) => {
    const f = checkNotFound(res, opts)
    if (f.length === 0) console.log(`PASS selftest ${name}: sin fallos`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba cero fallos y dio ${JSON.stringify(f)}`)
    }
  }
  const expectBroken = (name, res, opts) => {
    const f = checkNotFound(res, opts)
    if (f.length > 0) console.log(`PASS selftest ${name}: detecta ${f.length} fallo(s)`)
    else {
      bad += 1
      console.log(`FAIL selftest ${name}: se esperaba al menos un fallo y no dio ninguno`)
    }
  }

  expectClean('fixture valido', { status: 404, html: VALID_HTML })
  expectClean(
    'fixture valido con preview',
    { status: 404, html: VALID_HTML, xRobotsTag: 'noindex, nofollow' },
    { expectPreview: true },
  )
  expectBroken('estado 200', { status: 200, html: VALID_HTML })
  expectBroken('sin main', {
    status: 404,
    html: VALID_HTML.replace('<main id="main-content">', '<div>').replace('</main>', '</div>'),
  })
  expectBroken('dos h1', { status: 404, html: VALID_HTML.replace('</main>', '<h1>otro</h1></main>') })
  expectBroken('sin noindex', { status: 404, html: VALID_HTML.replace('noindex, nofollow', 'index, follow') })
  expectBroken('preview sin x-robots-tag', { status: 404, html: VALID_HTML }, { expectPreview: true })

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

/** Corre el chequeo sobre una lista de rutas. Devuelve la cantidad de fallos. */
async function runUrls(base, routes, expectPreview) {
  let local = 0
  for (const route of routes) {
    try {
      const res = await fetchFinal(base, route)
      const f = checkNotFound(res, { expectPreview })
      if (f.length === 0) console.log(`PASS ${route}`)
      else {
        local += f.length
        console.log(`FAIL ${route}: ${f.join('; ')}`)
      }
    } catch (error) {
      local += 1
      console.log(`FAIL ${route}: error de red: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return local
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

async function waitForServer(base, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(new URL('/robots.txt', base), { redirect: 'manual' })
      if (res.status === 200) return true
    } catch {
      // el servidor aun no escucha
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

async function spawnMode() {
  const port = String(await freePort())
  const base = `http://localhost:${port}`
  const child = spawn(process.execPath, ['.next/standalone/server.js'], {
    cwd: root,
    env: {
      ...process.env,
      PREVIEW_READONLY: 'true',
      PORT: port,
      // `localhost` y no `127.0.0.1`: con el servidor ligado a 127.0.0.1 el
      // middleware ve la URL reescrita (/es/...) como entrante y responde un
      // 308 a si mismo en toda ruta sin prefijo. Es un artefacto del bind local
      // (la linea base sin cambios lo reproduce), no del sitio desplegado.
      HOSTNAME: 'localhost',
      NEXT_PUBLIC_SERVER_URL: 'https://juan-tech.com',
      PAYLOAD_SECRET: 'contract-test-only',
      DATABASE_URI: 'postgresql://build:build@127.0.0.1:5432/build',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))

  try {
    if (!(await waitForServer(base, 60_000))) {
      failures += 1
      console.log(`FAIL servidor standalone arranca: no respondio /robots.txt en 60 s\n${log.slice(-1500)}`)
      return
    }
    console.log('PASS servidor standalone arranca')
    // Con PREVIEW_READONLY=true el preview exige x-robots-tag.
    failures += await runUrls(base, LOCAL_URLS, true)
  } finally {
    child.kill('SIGTERM')
  }
}

async function waitMode(base, expectPreview) {
  const seconds = Number(process.env.WAIT_SECONDS ?? 1200)
  const deadline = Date.now() + seconds * 1000
  let attempt = 0
  for (;;) {
    attempt += 1
    // Sondeo silencioso: solo se imprime el resultado del intento final.
    const origLog = console.log
    const lines = []
    console.log = (...a) => lines.push(a.join(' '))
    let n
    try {
      n = await runUrls(base, LIVE_URLS, expectPreview)
    } finally {
      console.log = origLog
    }
    if (n === 0) {
      lines.forEach((l) => console.log(l))
      console.log(`PASS despliegue nuevo visible tras ${attempt} intento(s)`)
      return
    }
    if (Date.now() >= deadline) {
      lines.forEach((l) => console.log(l))
      failures += n
      console.log(`FAIL agotados ${seconds} s esperando la 404 nueva`)
      return
    }
    console.log(`... intento ${attempt}: ${n} fallo(s), reintento en 15 s`)
    await new Promise((r) => setTimeout(r, 15_000))
  }
}

// -------------------------------------------------------------------------- main

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const expectPreview = process.env.EXPECT_PREVIEW === '1'

  if (args.includes('--selftest')) {
    process.exit(selftest())
  } else if (args.includes('--spawn')) {
    await spawnMode()
  } else {
    const base = process.env.BASE_URL
    if (!base) {
      console.error('FAIL BASE_URL es obligatoria sin --selftest ni --spawn')
      process.exit(1)
    }
    if (args.includes('--wait')) await waitMode(base, expectPreview)
    else failures += await runUrls(base, LIVE_URLS, expectPreview)
  }
  process.exit(failures > 0 ? 1 : 0)
}
