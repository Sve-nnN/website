// Lectura del disco del VPS antes de cada build, solo lectura (plan 57-01, D-12).
//
// Uso:
//   node scripts/verify/57-vps-disk-check.mjs                    lee por SSH
//   node scripts/verify/57-vps-disk-check.mjs --from-file <ruta> analiza la salida pegada por Juan
//   node scripts/verify/57-vps-disk-check.mjs --selftest
//
// Por SSH corre, con la llave ~/.ssh/sapling_ed25519 y el usuario juan:
//   df -h /; sudo docker system df; los cinco json.log mas grandes de /var/lib/docker/containers
// Todo es lectura. El script nunca ejecuta nada que escriba en el VPS: si el disco no cumple,
// imprime las dos limpiezas permitidas para que Juan decida, sin correrlas.
//
// Umbral (supuesto A9 hasta que Juan lo confirme en 57-05): menos de 80% de uso y mas de
// 15 GB libres. Ajustable con DISK_MAX_PCT y DISK_MIN_FREE_GB.
//
// Salida: 0 si cumple el umbral, 1 si no cumple o si no hay lectura de df.

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const HOST = 'juan@116.203.79.125'
const KEY = join(homedir(), '.ssh', 'sapling_ed25519')
const REMOTE =
  "df -h /; echo '--- docker system df'; sudo -n docker system df; echo '--- json.log mas grandes'; " +
  "sudo -n find /var/lib/docker/containers -name '*-json.log' -printf '%s %p\\n' | sort -rn | head -5"

export const SSH_COMMAND = `ssh -i ~/.ssh/sapling_ed25519 ${HOST} "${REMOTE.replace(/"/g, '\\"')}"`

const CLEANUP = [
  'sudo docker builder prune -af   (cache de build, 12 GB liberados el 2026-11-10 junto con la siguiente)',
  'sudo docker image prune -a      (imagenes sin contenedor)',
]

/** Convierte un tamano de df -h (19G, 512M, 1.2T) a GB. */
export function toGB(size) {
  const m = String(size ?? '').trim().match(/^([\d.]+)\s*([KMGTP]?)i?B?$/i)
  if (!m) return Number.NaN
  const n = Number(m[1])
  const exp = { '': -3, K: -2, M: -1, G: 0, T: 1, P: 2 }[m[2].toUpperCase()]
  return n * 1024 ** exp
}

/** Busca la fila de df del punto de montaje / y devuelve uso y espacio libre. */
export function parseDf(text) {
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/)
    if (cols.length < 6 || cols[cols.length - 1] !== '/') continue
    const pct = Number(cols[4].replace('%', ''))
    const availGB = toGB(cols[3])
    if (Number.isFinite(pct) && Number.isFinite(availGB)) {
      return { filesystem: cols[0], size: cols[1], used: cols[2], avail: cols[3], pct, availGB }
    }
  }
  return null
}

/** Devuelve las lineas de json.log grandes en formato legible. */
export function parseLogs(text) {
  const out = []
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const m = line.trim().match(/^(\d+)\s+(\/var\/lib\/docker\/containers\/(\w{12})\w*\/.*-json\.log)$/)
    if (m) out.push({ mb: Math.round(Number(m[1]) / 1024 / 1024), container: m[3] })
  }
  return out
}

export function thresholds(env = process.env) {
  return {
    maxPct: Number(env.DISK_MAX_PCT ?? 80),
    minFreeGB: Number(env.DISK_MIN_FREE_GB ?? 15),
    assumed: env.DISK_MAX_PCT === undefined && env.DISK_MIN_FREE_GB === undefined,
  }
}

/** Veredicto contra el umbral. Sin lectura de df, falla. */
export function evaluate(text, t = thresholds()) {
  const df = parseDf(text)
  if (!df) return { ok: false, df: null, reason: 'no hay lectura de df para /' }
  const reasons = []
  if (!(df.pct < t.maxPct)) reasons.push(`uso ${df.pct}% no es menor a ${t.maxPct}%`)
  if (!(df.availGB > t.minFreeGB)) reasons.push(`${df.availGB.toFixed(1)} GB libres no supera ${t.minFreeGB} GB`)
  return { ok: reasons.length === 0, df, reason: reasons.join('; ') || 'dentro del umbral' }
}

function readViaSsh() {
  const res = spawnSync(
    'ssh',
    ['-i', KEY, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', HOST, REMOTE],
    { encoding: 'utf8', timeout: 60_000 },
  )
  if (res.error || res.status !== 0) {
    const why = res.error ? res.error.message : (res.stderr || '').trim().split('\n').pop()
    return { ok: false, why }
  }
  return { ok: true, text: res.stdout }
}

function main(argv) {
  const fromIdx = argv.indexOf('--from-file')
  let text
  let source
  if (fromIdx >= 0) {
    const file = argv[fromIdx + 1]
    if (!file) {
      console.error('FAIL --from-file necesita una ruta')
      return 1
    }
    text = readFileSync(file, 'utf8')
    source = `archivo ${file}`
  } else {
    const r = readViaSsh()
    if (!r.ok) {
      console.error(`FAIL no pude leer el disco por SSH (${r.why ?? 'sin detalle'})`)
      console.error('Corre este comando en tu terminal, guarda la salida fuera del repo y pasa la ruta con --from-file:')
      console.error(`  ${SSH_COMMAND}`)
      return 1
    }
    text = r.text
    source = `ssh ${HOST}`
  }

  const t = thresholds()
  const v = evaluate(text, t)
  console.log(`lectura: ${source}, ${new Date().toISOString()}`)
  if (v.df) {
    console.log(`disco /: ${v.df.size} total, ${v.df.used} usados, ${v.df.avail} libres, ${v.df.pct}% de uso`)
  }
  const dockerDf = text.split('--- docker system df')[1]?.split('--- json.log')[0]?.trim()
  if (dockerDf) console.log(`docker system df:\n${dockerDf}`)
  const logs = parseLogs(text)
  if (logs.length) console.log(`json.log mas grandes: ${logs.map((l) => `${l.container} ${l.mb} MB`).join(', ')}`)
  console.log(`umbral: uso menor a ${t.maxPct}% y mas de ${t.minFreeGB} GB libres${t.assumed ? ' (supuesto A9, Juan lo confirma en 57-05)' : ''}`)
  console.log('recordatorio: el interruptor de limpieza diaria de Dokploy debe seguir apagado (puede borrar volumenes)')

  if (v.ok) {
    console.log(`PASS ${v.reason}`)
    return 0
  }
  console.log(`FAIL ${v.reason}`)
  console.log('Limpiezas permitidas, las decide y corre Juan (este script no las ejecuta):')
  for (const c of CLEANUP) console.log(`  ${c}`)
  return 1
}

function selftest() {
  const fails = []
  const check = (name, ok) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
    if (!ok) fails.push(name)
  }
  const t = { maxPct: 80, minFreeGB: 15, assumed: true }
  const df = (used, avail, pct) =>
    `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        75G   ${used}   ${avail}  ${pct}% /\n`

  check('toGB entiende G, M y T', toGB('19G') === 19 && toGB('512M') === 0.5 && toGB('1T') === 1024)
  check('disco al 95% falla', evaluate(df('71G', '3.8G', 95), t).ok === false)
  check('disco al 60% con 30 GB libres pasa', evaluate(df('45G', '30G', 60), t).ok === true)
  check('salida vacia falla', evaluate('', t).ok === false)
  check('70% con 10 GB libres falla por espacio', evaluate(df('50G', '10G', 70), t).ok === false)
  check('ignora otros puntos de montaje', parseDf('tmpfs 1G 0 1G 0% /dev/shm\n') === null)
  check(
    'parsea json.log',
    parseLogs('94873607 /var/lib/docker/containers/99dad6c471ba8412/99dad6c471ba8412-json.log')[0]?.mb === 90,
  )
  check('el comando remoto no escribe', !/prune|\brm\b|volume|>\s*\//.test(REMOTE))
  console.log(fails.length ? `FAIL selftest: ${fails.length} fallas` : 'OK selftest')
  return fails.length ? 1 : 0
}

const argv = process.argv.slice(2)
process.exitCode = argv.includes('--selftest') ? selftest() : main(argv)
