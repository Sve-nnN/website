// Estado de despliegue y de contenedores de una app de Dokploy, solo lectura (plan 57-01, D-12).
//
// Uso:
//   node scripts/verify/57-dokploy-status.mjs --app preview          (o --app web)
//   node scripts/verify/57-dokploy-status.mjs --app preview --json
//   node scripts/verify/57-dokploy-status.mjs --app preview --wait 1200
//   node scripts/verify/57-dokploy-status.mjs --selftest
//
// Credenciales: lee DOKPLOY_URL y DOKPLOY_TOKEN del archivo ~/.config/juantech/dokploy.env
// (ruta ajustable con DOKPLOY_ENV_FILE) parseando linea por linea, sin shell ni dotenv. Si
// existe ~/.config/juantech/preview-app.env, usa PREVIEW_APP_ID como respaldo para ubicar el
// preview. Nunca imprime el token, la URL de Dokploy ni las cabeceras: toda salida pasa por
// redact(), que reemplaza cualquier aparicion del token o del host.
//
// Llamadas (todas GET, cabecera x-api-key):
//   project.all            ubica el applicationId por nombre (proyecto juantech: web y juantech-preview)
//   application.one        applicationStatus y appName
//   deployment.all         se ordena por createdAt descendente y se toma el mas reciente
//   docker.getContainers   estado real del contenedor (un done puede ser un bucle de reinicios)
//
// No existe ninguna rama de escritura contra la API: el despliegue lo dispara el push o el
// merge, nunca este script.
//
// Salida: 0 si el ultimo despliegue esta en done y hay un contenedor running sin bucle de
// reinicios; 1 si el ultimo despliegue esta en error o cancelled (Dokploy cancela despliegues
// sin avisar cuando el disco llega a 100%), si no hay contenedor running o si hay bucle;
// 2 si el ultimo despliegue sigue en curso (queued o running). Con --wait <segundos> vuelve a
// consultar cada 20 s mientras el estado sea 2, hasta el plazo.

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PROJECT = 'juantech'
const APPS = { web: 'web', preview: 'juantech-preview' }
const POLL_MS = 20_000
const CRASH_WINDOW_MIN = 10
const CRASH_MIN_EXITS = 3

/** Parsea un archivo KEY=valor (con o sin export) sin ejecutar nada. */
export function parseEnvFile(text) {
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    out[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

/** Reemplaza el token, la URL y el host de Dokploy por marcadores antes de imprimir. */
export function makeRedactor(secrets) {
  const needles = []
  for (const s of secrets) {
    if (!s || s.length < 4) continue
    needles.push(s)
    try {
      const u = new URL(s)
      needles.push(u.host, u.hostname)
    } catch {}
  }
  needles.sort((a, b) => b.length - a.length)
  return (value) => {
    let text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    for (const n of needles) text = text.split(n).join('[redactado]')
    return text
  }
}

/** Devuelve el despliegue mas reciente por createdAt, sin confiar en el orden de la lista. */
export function latestDeployment(deployments) {
  if (!Array.isArray(deployments) || deployments.length === 0) return null
  return [...deployments].sort((a, b) => Date.parse(b.createdAt ?? 0) - Date.parse(a.createdAt ?? 0))[0]
}

/** Minutos aproximados desde un status de docker como "Exited (1) 9 minutes ago" o "Up 2 hours". */
export function ageMinutes(status) {
  const s = String(status ?? '').toLowerCase()
  if (/less than a second|seconds?\b/.test(s) && !/minute|hour|day|week|month/.test(s)) return 0
  if (/about a minute/.test(s)) return 1
  if (/about an hour/.test(s)) return 60
  const m = s.match(/(\d+)\s*(minute|hour|day|week|month)/)
  if (!m) return Number.POSITIVE_INFINITY
  const mult = { minute: 1, hour: 60, day: 1440, week: 10080, month: 43200 }[m[2]]
  return Number(m[1]) * mult
}

/** Resume los contenedores de la app y detecta bucle de reinicios. */
export function containerHealth(containers, appName) {
  const mine = (Array.isArray(containers) ? containers : []).filter((c) =>
    String(c.name ?? '').startsWith(`${appName}.`) || String(c.name ?? '') === appName,
  )
  const running = mine.filter((c) => c.state === 'running' && !/restarting/i.test(c.status ?? ''))
  const recentExits = mine.filter((c) => c.state === 'exited' && ageMinutes(c.status) <= CRASH_WINDOW_MIN)
  const crashLoop = recentExits.length >= CRASH_MIN_EXITS
  return {
    total: mine.length,
    running: running.map((c) => ({ name: c.name, state: c.state, status: c.status })),
    recentExits: recentExits.length,
    crashLoop,
    healthy: running.length > 0 && !crashLoop,
  }
}

/** Calcula el veredicto y el codigo de salida. */
export function verdict(deployment, health) {
  const status = deployment?.status ?? 'sin despliegues'
  if (status === 'error' || status === 'cancelled') return { code: 1, reason: `ultimo despliegue en ${status}` }
  if (status === 'queued' || status === 'running') return { code: 2, reason: `ultimo despliegue en curso (${status})` }
  if (status !== 'done') return { code: 1, reason: `estado de despliegue inesperado: ${status}` }
  if (!health.healthy) {
    return { code: 1, reason: health.crashLoop ? 'contenedor en bucle de reinicios' : 'ningun contenedor running' }
  }
  return { code: 0, reason: 'despliegue done y contenedor running' }
}

/** Crea un cliente GET contra la API. fetchImpl se inyecta en el selftest. */
export function makeClient({ url, token, fetchImpl = fetch }) {
  const base = url.replace(/\/+$/, '')
  return async (procedure, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const res = await fetchImpl(`${base}/api/${procedure}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'x-api-key': token, accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`${procedure} respondio ${res.status}`)
    return res.json()
  }
}

/** Busca el applicationId de una app por nombre dentro del proyecto. */
export function findApplicationId(projects, appLabel, fallbackId) {
  const wanted = APPS[appLabel]
  for (const p of Array.isArray(projects) ? projects : []) {
    if (p.name !== PROJECT) continue
    const groups = Array.isArray(p.environments) ? p.environments : [{ applications: p.applications }]
    for (const env of groups) {
      for (const a of env.applications ?? []) if (a.name === wanted) return a.applicationId
    }
  }
  return fallbackId ?? null
}

/** Una consulta completa: proyecto, app, despliegues y contenedores. */
export async function readStatus(get, appLabel, fallbackId) {
  const projects = await get('project.all')
  const applicationId = findApplicationId(projects, appLabel, fallbackId)
  if (!applicationId) throw new Error(`no encontre la app ${APPS[appLabel]} en el proyecto ${PROJECT}`)
  const app = await get('application.one', { applicationId })
  const deployments = await get('deployment.all', { applicationId })
  const latest = latestDeployment(deployments)
  const containers = await get('docker.getContainers', app.serverId ? { serverId: app.serverId } : {})
  const health = containerHealth(containers, app.appName)
  const v = verdict(latest, health)
  return {
    app: app.name,
    appName: app.appName,
    applicationStatus: app.applicationStatus,
    branch: app.branch,
    deployment: latest
      ? {
          id: latest.deploymentId,
          status: latest.status,
          createdAt: latest.createdAt,
          title: String(latest.title ?? '').split('\n')[0].slice(0, 120),
        }
      : null,
    containers: health,
    verdict: v.code === 0 ? 'PASS' : v.code === 2 ? 'PENDIENTE' : 'FAIL',
    reason: v.reason,
    code: v.code,
  }
}

function loadCredentials() {
  const dir = join(homedir(), '.config', 'juantech')
  const file = process.env.DOKPLOY_ENV_FILE ?? join(dir, 'dokploy.env')
  if (!existsSync(file)) throw new Error('falta el archivo de credenciales de Dokploy')
  const env = parseEnvFile(readFileSync(file, 'utf8'))
  if (!env.DOKPLOY_URL || !env.DOKPLOY_TOKEN) throw new Error('el archivo de credenciales no define DOKPLOY_URL y DOKPLOY_TOKEN')
  const previewFile = join(dir, 'preview-app.env')
  const preview = existsSync(previewFile) ? parseEnvFile(readFileSync(previewFile, 'utf8')) : {}
  return { url: env.DOKPLOY_URL, token: env.DOKPLOY_TOKEN, previewAppId: preview.PREVIEW_APP_ID }
}

function printHuman(r, redact) {
  const d = r.deployment
  console.log(redact(`app ${r.app} (${r.appName}), rama ${r.branch}, applicationStatus ${r.applicationStatus}`))
  console.log(redact(d ? `ultimo despliegue ${d.id} ${d.status} ${d.createdAt} "${d.title}"` : 'sin despliegues'))
  for (const c of r.containers.running) console.log(redact(`contenedor ${c.name} ${c.state} (${c.status})`))
  console.log(`contenedores de la app: ${r.containers.total}, running: ${r.containers.running.length}, salidas en ${CRASH_WINDOW_MIN} min: ${r.containers.recentExits}`)
  console.log(redact(`${r.verdict} ${r.reason}`))
}

async function main(argv) {
  const json = argv.includes('--json')
  const appIdx = argv.indexOf('--app')
  const appLabel = appIdx >= 0 ? argv[appIdx + 1] : 'preview'
  if (!APPS[appLabel]) {
    console.error('FAIL --app debe ser preview o web')
    return 1
  }
  const waitIdx = argv.indexOf('--wait')
  const waitSeconds = waitIdx >= 0 ? Number(argv[waitIdx + 1] ?? 0) : 0

  let creds
  try {
    creds = loadCredentials()
  } catch (error) {
    console.error(`FAIL ${error.message}`)
    return 1
  }
  const redact = makeRedactor([creds.token, creds.url])
  const get = makeClient({ url: creds.url, token: creds.token })
  const deadline = Date.now() + waitSeconds * 1000

  for (;;) {
    let r
    try {
      r = await readStatus(get, appLabel, appLabel === 'preview' ? creds.previewAppId : undefined)
    } catch (error) {
      console.error(redact(`FAIL ${error instanceof Error ? error.message : String(error)}`))
      return 1
    }
    if (r.code === 2 && Date.now() + POLL_MS < deadline) {
      console.error(redact(`espera: ${r.reason}, vuelvo a consultar en ${POLL_MS / 1000} s`))
      await new Promise((resolve) => setTimeout(resolve, POLL_MS))
      continue
    }
    if (json) console.log(redact(r))
    else printHuman(r, redact)
    return r.code
  }
}

async function selftest() {
  const fails = []
  const check = (name, ok) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
    if (!ok) fails.push(name)
  }
  const TOKEN = 'tok_selftest_ABC123xyz'
  const URL_ = 'https://dokploy.example.test'

  // Parseo del archivo de credenciales
  const env = parseEnvFile(`# c\nexport DOKPLOY_URL="${URL_}"\nDOKPLOY_TOKEN='${TOKEN}'\n`)
  check('parseo de env con export y comillas', env.DOKPLOY_URL === URL_ && env.DOKPLOY_TOKEN === TOKEN)

  // Orden por createdAt: el primero de la lista NO es el mas reciente
  const deps = [
    { deploymentId: 'viejo', status: 'done', createdAt: '2026-11-10T00:00:00Z' },
    { deploymentId: 'nuevo', status: 'cancelled', createdAt: '2026-11-17T00:00:00Z' },
    { deploymentId: 'medio', status: 'done', createdAt: '2026-11-15T00:00:00Z' },
  ]
  check('toma el mas reciente por createdAt', latestDeployment(deps).deploymentId === 'nuevo')

  const healthy = containerHealth(
    [
      { name: 'app-x.1.aaa', state: 'running', status: 'Up 9 minutes' },
      { name: 'app-x.1.bbb', state: 'exited', status: 'Exited (1) 9 minutes ago' },
      { name: 'otra.1.ccc', state: 'exited', status: 'Exited (1) 1 minute ago' },
    ],
    'app-x',
  )
  check('contenedor running sano', healthy.healthy && healthy.total === 2)

  const loop = containerHealth(
    [
      { name: 'app-x.1.a', state: 'running', status: 'Up 5 seconds' },
      { name: 'app-x.1.b', state: 'exited', status: 'Exited (1) 30 seconds ago' },
      { name: 'app-x.1.c', state: 'exited', status: 'Exited (1) About a minute ago' },
      { name: 'app-x.1.d', state: 'exited', status: 'Exited (1) 2 minutes ago' },
    ],
    'app-x',
  )
  check('detecta bucle de reinicios', loop.crashLoop && !loop.healthy)

  check('cancelled sale 1', verdict({ status: 'cancelled' }, healthy).code === 1)
  check('error sale 1', verdict({ status: 'error' }, healthy).code === 1)
  check('running sale 2', verdict({ status: 'running' }, healthy).code === 2)
  check('done con contenedor sano sale 0', verdict({ status: 'done' }, healthy).code === 0)
  check('done sin contenedor sale 1', verdict({ status: 'done' }, containerHealth([], 'app-x')).code === 1)

  // Fetch simulado de punta a punta: solo GET, orden por createdAt, cancelled y redaccion
  const methods = []
  const fakeFetch = async (url, init) => {
    methods.push(init?.method)
    if (init?.headers?.['x-api-key'] !== TOKEN) return { ok: false, status: 401, json: async () => ({}) }
    const path = new URL(url).pathname.replace('/api/', '')
    const body = {
      'project.all': [
        { name: 'otro', environments: [{ applications: [{ name: 'juantech-preview', applicationId: 'mal' }] }] },
        { name: 'juantech', environments: [{ applications: [{ name: 'juantech-preview', applicationId: 'prev-1' }, { name: 'web', applicationId: 'web-1' }] }] },
      ],
      'application.one': { name: 'juantech-preview', appName: 'app-x', applicationStatus: 'done', branch: 'feat/x', serverId: null },
      'deployment.all': deps.map((d) => ({ ...d, title: `deploy con ${TOKEN} en ${URL_}` })),
      'docker.getContainers': [{ name: 'app-x.1.aaa', state: 'running', status: 'Up 1 hour' }],
    }[path]
    return { ok: true, status: 200, json: async () => body }
  }
  const get = makeClient({ url: URL_, token: TOKEN, fetchImpl: fakeFetch })
  const r = await readStatus(get, 'preview')
  check('fetch simulado: solo GET', methods.length === 4 && methods.every((m) => m === 'GET'))
  check('fetch simulado: ubica la app del proyecto correcto', r.deployment && r.app === 'juantech-preview')
  check('fetch simulado: ultimo despliegue cancelled sale 1', r.deployment.id === 'nuevo' && r.code === 1)

  const redact = makeRedactor([TOKEN, URL_])
  const printed = redact(r)
  check('redaccion: el token no aparece', !printed.includes(TOKEN))
  check('redaccion: el host no aparece', !printed.includes('dokploy.example.test'))
  check('redaccion: error con URL redactado', !redact(`fallo ${URL_}/api/x?k=${TOKEN}`).includes(TOKEN))

  console.log(fails.length ? `FAIL selftest: ${fails.length} fallas` : 'OK selftest')
  return fails.length ? 1 : 0
}

const argv = process.argv.slice(2)
process.exitCode = argv.includes('--selftest') ? await selftest() : await main(argv)
