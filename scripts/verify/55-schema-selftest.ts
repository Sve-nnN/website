/**
 * Autoprueba de la verificación de esquema de la fase 55 (plan 55-03).
 *
 * Corre los mismos fixtures que `24-phase55-verify-schema.ts --selftest` sobre
 * evaluateLessonsState y confirma que assertSafeTarget rechaza un host de Neon,
 * un host desconocido y una base distinta de juantech. No toca ninguna base ni
 * la red.
 *
 *   node_modules/.bin/tsx scripts/verify/55-schema-selftest.ts
 */
import { assertSafeTarget } from '../db/data/54-seed-lib'
import {
  evaluateLessonsState,
  FIXTURE_ALL_READABLE,
  FIXTURE_PERMISSION_DENIED,
  FIXTURE_TABLES_MISSING,
  FIXTURE_VERSIONS_FAIL,
  LESSONS_TABLES,
  type LessonsState,
} from '../db/data/55-schema-lib'

let bad = 0
const check = (label: string, good: boolean) => {
  console.log(`${good ? 'PASS' : 'FAIL'} ${label}`)
  if (!good) bad++
}

const failsOf = (s: LessonsState) => evaluateLessonsState(s).filter((r) => !r.ok)

check('la lista cerrada tiene exactamente cuatro tablas', LESSONS_TABLES.length === 4)
check('todo legible y cero filas es válido', failsOf(FIXTURE_ALL_READABLE).length === 0)
check(
  'permission denied falla y nombra el GRANT SELECT de D-06',
  failsOf(FIXTURE_PERMISSION_DENIED).some((r) => r.why.includes('GRANT SELECT') && r.why.includes('juantech_user')),
)
check('tablas inexistentes fallan en las cuatro tablas y en las lecturas', failsOf(FIXTURE_TABLES_MISSING).length === 7)
check('versiones con error fallan', failsOf(FIXTURE_VERSIONS_FAIL).length === 1)
check(
  'una tabla sin intentar leer falla',
  failsOf({ ...FIXTURE_ALL_READABLE, tablesReadable: {} }).length === 4,
)

const rejects = (uri: string | undefined) => {
  try {
    assertSafeTarget(uri, false, false)
    return false
  } catch {
    return true
  }
}
const accepts = (uri: string) => !rejects(uri)

check('assertSafeTarget rechaza un host de Neon', rejects('postgresql://u:p@ep-hidden-heart-atc1vys8.us-east-2.aws.neon.tech/juantech'))
check('assertSafeTarget rechaza un host desconocido', rejects('postgresql://u:p@db.ejemplo.com:5432/juantech'))
check('assertSafeTarget rechaza una base distinta de juantech', rejects('postgresql://u:p@127.0.0.1:5432/neondb'))
check('assertSafeTarget rechaza DATABASE_URI ausente', rejects(undefined))
check('assertSafeTarget acepta el túnel a juantech', accepts('postgresql://u:p@127.0.0.1:5433/juantech'))
check('assertSafeTarget acepta shared-postgres', accepts('postgresql://u:p@shared-postgres:5432/juantech'))

process.exit(bad > 0 ? 1 : 0)
