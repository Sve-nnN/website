// Contrato del preview de solo lectura (fase 53, BASE-01, D-04 y D-05).
//
// Modos:
//   --config-check  Importa next.config.mjs en dos procesos hijo (con y sin
//                   PREVIEW_READONLY) y exige que la produccion quede intacta.
//   --spawn         Arranca .next/standalone/server.js con la bandera, corre las
//                   comprobaciones sin paginas que lean la base y mata el servidor.
//   (sin modo)      Corre las comprobaciones contra BASE_URL (obligatoria).
//
// Variables: BASE_URL, SKIP_DB_PAGES=1 (omite las paginas que leen Postgres),
//            EXPECT_PREVIEW (reservada, el contrato siempre espera preview).
// Cada comprobacion imprime PASS o FAIL motivo; cualquier FAIL sale con codigo 1.

import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)

let failures = 0
const pass = (name) => console.log(`PASS ${name}`)
const fail = (name, why) => {
  failures += 1
  console.log(`FAIL ${name}: ${why}`)
}
const check = (name, ok, why) => (ok ? pass(name) : fail(name, why))

// ---------------------------------------------------------------- config-check

function loadConfigIn(previewFlag) {
  const script = `
    const url = ${JSON.stringify(pathToFileURL(path.join(root, 'next.config.mjs')).href)}
    const mod = await import(url)
    let cfg = mod.default
    if (typeof cfg === 'function') cfg = await cfg('phase-production-build', { defaultConfig: {} })
    const headers = cfg.headers ? await cfg.headers() : []
    const rewrites = cfg.rewrites ? await cfg.rewrites() : []
    process.stdout.write('@@JSON@@' + JSON.stringify({ headers, rewrites }))
  `
  const env = { ...process.env }
  delete env.PREVIEW_READONLY
  if (previewFlag) env.PREVIEW_READONLY = 'true'
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: root,
    env,
    encoding: 'utf8',
  })
  if (res.status !== 0) {
    throw new Error(`no se pudo importar next.config.mjs (flag=${previewFlag}): ${res.stderr}`)
  }
  const marker = res.stdout.indexOf('@@JSON@@')
  if (marker === -1) throw new Error('el proceso hijo no devolvio JSON')
  return JSON.parse(res.stdout.slice(marker + '@@JSON@@'.length))
}

function allHeaderKeys(headers) {
  return headers.flatMap((entry) => entry.headers.map((h) => h.key))
}

function configCheck() {
  const on = loadConfigIn(true)
  const off = loadConfigIn(false)

  const onRobots = on.headers.flatMap((e) => e.headers).find((h) => h.key === 'X-Robots-Tag')
  check(
    'config con bandera: X-Robots-Tag noindex',
    Boolean(onRobots && /noindex/.test(onRobots.value) && /nofollow/.test(onRobots.value)),
    'falta X-Robots-Tag con noindex, nofollow',
  )

  const before = Array.isArray(on.rewrites) ? [] : (on.rewrites.beforeFiles ?? [])
  check(
    'config con bandera: rewrites beforeFiles hacia /preview-blocked',
    before.length > 0 && before.every((r) => r.destination === '/preview-blocked'),
    'faltan reglas beforeFiles o apuntan a otro destino',
  )
  for (const source of ['/admin', '/admin/:path*', '/api', '/sitemap.xml', '/sitemap.html']) {
    check(
      `config con bandera: regla ${source}`,
      before.some((r) => r.source === source),
      'regla ausente',
    )
  }
  check(
    'config con bandera: comodin /api excluye redirects-lookup y newsletter',
    before.some(
      (r) =>
        r.source.startsWith('/api/:path(') &&
        r.source.includes('redirects-lookup') &&
        r.source.includes('newsletter'),
    ),
    'regla comodin /api sin la lista permitida',
  )
  check(
    'config con bandera: conserva Strict-Transport-Security',
    allHeaderKeys(on.headers).includes('Strict-Transport-Security'),
    'se perdio HSTS',
  )

  check(
    'config sin bandera: sin X-Robots-Tag',
    !allHeaderKeys(off.headers).includes('X-Robots-Tag'),
    'aparece X-Robots-Tag en produccion',
  )
  check(
    'config sin bandera: conserva Strict-Transport-Security',
    allHeaderKeys(off.headers).includes('Strict-Transport-Security'),
    'se perdio HSTS',
  )
  const offEmpty = Array.isArray(off.rewrites)
    ? off.rewrites.length === 0
    : Object.values(off.rewrites).every((list) => list.length === 0)
  check('config sin bandera: rewrites() vacio', offEmpty, 'produccion tiene rewrites')

  const offKeys = allHeaderKeys(off.headers).sort().join(',')
  const onKeys = allHeaderKeys(on.headers).filter((k) => k !== 'X-Robots-Tag').sort().join(',')
  check('config: las demas cabeceras son identicas con y sin bandera', offKeys === onKeys, 'difieren')
}

// ------------------------------------------------------------------ comprobaciones HTTP

async function get(base, route, init = {}) {
  return fetch(new URL(route, base), { redirect: 'manual', ...init })
}

async function httpChecks(base, skipDbPages) {
  const robotsRes = await get(base, '/robots.txt')
  const robotsBody = await robotsRes.text()
  check('/robots.txt responde 200', robotsRes.status === 200, `status ${robotsRes.status}`)
  check('/robots.txt contiene Disallow: /', /Disallow:\s*\/\s*(\n|$)/.test(robotsBody), robotsBody)
  check('/robots.txt no contiene Sitemap:', !/sitemap:/i.test(robotsBody), robotsBody)
  check(
    '/robots.txt trae x-robots-tag noindex',
    /noindex/i.test(robotsRes.headers.get('x-robots-tag') ?? ''),
    `cabecera: ${robotsRes.headers.get('x-robots-tag')}`,
  )

  for (const route of [
    '/sitemap.xml',
    '/sitemap.html',
    '/admin',
    '/admin/login',
    '/api/users',
    '/api/graphql',
    '/preview-blocked',
  ]) {
    const res = await get(base, route)
    check(`${route} responde 404`, res.status === 404, `status ${res.status}`)
  }

  const lookup = await get(base, '/api/redirects-lookup?from=/__x')
  check(
    '/api/redirects-lookup deja pasar (no 404)',
    lookup.status !== 404,
    `status ${lookup.status} (la regla comodin lo esta bloqueando)`,
  )

  const confirm = await get(base, '/api/newsletter/confirm')
  check(
    '/api/newsletter/confirm sin token redirige (3xx, no 404)',
    confirm.status >= 300 && confirm.status < 400,
    `status ${confirm.status}`,
  )

  if (skipDbPages) {
    console.log('SKIP paginas con base de datos (SKIP_DB_PAGES=1)')
    return
  }

  for (const route of ['/', '/en']) {
    const res = await get(base, route)
    const html = await res.text()
    check(`${route} responde 200`, res.status === 200, `status ${res.status}`)
    check(
      `${route} trae x-robots-tag noindex`,
      /noindex/i.test(res.headers.get('x-robots-tag') ?? ''),
      `cabecera: ${res.headers.get('x-robots-tag')}`,
    )
    check(
      `${route} trae meta robots noindex, nofollow`,
      /<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/.test(html),
      'meta robots ausente',
    )
  }

  const stack = await get(base, '/stack')
  const stackHtml = await stack.text()
  const goHref = stackHtml.match(/href="(\/go\/[^"#?]+)"/)?.[1]
  if (!goHref) {
    fail('/stack tiene un enlace /go/', 'no se encontro ninguno')
  } else {
    const res = await get(base, goHref)
    check(`${goHref} responde 302 o 307`, [302, 307].includes(res.status), `status ${res.status}`)
  }
}

// ------------------------------------------------------------------------ spawn

async function waitForServer(base, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(new URL('/robots.txt', base), { redirect: 'manual' })
      if (res.status === 200) return true
    } catch {
      // el servidor aun no escucha
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return false
}

async function spawnMode() {
  const port = '3055'
  const base = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['.next/standalone/server.js'], {
    cwd: root,
    env: {
      ...process.env,
      PREVIEW_READONLY: 'true',
      PORT: port,
      HOSTNAME: '127.0.0.1',
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
    const up = await waitForServer(base, 60_000)
    if (!up) {
      fail('servidor standalone arranca', `no respondio /robots.txt en 60 s\n${log.slice(-1500)}`)
      return
    }
    pass('servidor standalone arranca')
    await httpChecks(base, true)
  } finally {
    child.kill('SIGTERM')
  }
}

// ------------------------------------------------------------------------- main

if (args.includes('--config-check')) {
  configCheck()
} else if (args.includes('--spawn')) {
  await spawnMode()
} else {
  const base = process.env.BASE_URL
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria sin modo (o usa --config-check / --spawn)')
    process.exit(1)
  }
  await httpChecks(base, process.env.SKIP_DB_PAGES === '1')
}

process.exit(failures > 0 ? 1 : 0)
