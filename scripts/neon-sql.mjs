/**
 * Minimal SQL runner over Neon's HTTP endpoint (port 443), for when direct
 * Postgres (TCP 5432) is unreachable from the current network.
 *
 * Usage: node --env-file=.env scripts/neon-sql.mjs "select 1"
 * Or import { sql } from this module.
 */

const raw = process.env.DATABASE_URI
if (!raw) throw new Error('DATABASE_URI missing')

const host = new URL(raw).hostname

export async function sql(query, params = []) {
  const res = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': raw,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'false',
    },
    body: JSON.stringify({ query, params }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Neon HTTP ${res.status}: ${text.slice(0, 500)}`)
  return JSON.parse(text).rows
}

if (process.argv[2]) {
  const rows = await sql(process.argv[2])
  console.log(JSON.stringify(rows, null, 2))
}
