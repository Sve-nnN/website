/**
 * SOLO LECTURA. Verifica el esquema del campo `lessons` de CaseStudies (fase 55,
 * migración phase55_case_lessons) en la base a la que apunte DATABASE_URI.
 *
 * No contiene ninguna llamada de escritura. Imprime host, puerto y base (nunca
 * usuario ni contraseña), así que es seguro pegar la salida en el chat.
 *
 * Antes de abrir Payload llama assertSafeTarget (IN-06a de 54-REVIEW): aborta si
 * el host no es 127.0.0.1, localhost o shared-postgres, si es Neon o si la base
 * no se llama juantech.
 *
 * Se corre dos veces, con el usuario dueño (juantech_user) y con el rol de solo
 * lectura del preview (juantech_preview_ro), por el túnel a producción. Si el
 * rol del preview no puede leer las tablas nuevas, `permission denied` sale aquí
 * y no en una página rota del preview. Nunca se carga el .env local: la
 * DATABASE_URI sale del entorno del túnel.
 *
 *   DATABASE_URI=<túnel, rol> PAYLOAD_SECRET=<cualquiera> \
 *     node_modules/.bin/tsx scripts/db/24-phase55-verify-schema.ts
 *   node_modules/.bin/tsx scripts/db/24-phase55-verify-schema.ts --selftest
 */
import {
  evaluateLessonsState,
  FIXTURE_ALL_READABLE,
  FIXTURE_PERMISSION_DENIED,
  FIXTURE_TABLES_MISSING,
  FIXTURE_VERSIONS_FAIL,
  LESSONS_TABLES,
  type LessonsResult,
  type LessonsState,
} from './data/55-schema-lib'
import { assertSafeTarget, safeTarget } from './data/54-seed-lib'

const SELFTEST = process.argv.includes('--selftest')

function report(results: LessonsResult[]): number {
  let fails = 0
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}: ${r.why}`)
    if (!r.ok) fails++
  }
  return fails
}

function selftest(): never {
  let bad = 0
  const expect = (label: string, state: LessonsState, want: 'none' | 'some', mustMention?: string) => {
    const results = evaluateLessonsState(state)
    const failing = results.filter((r) => !r.ok)
    let good = want === 'none' ? failing.length === 0 : failing.length > 0
    if (good && mustMention) good = failing.some((r) => r.why.includes(mustMention))
    console.log(`${good ? 'PASS' : 'FAIL'} ${label} (${failing.length} resultado(s) en FAIL)`)
    if (!good) bad++
  }
  expect('todo legible, cero filas: válido', FIXTURE_ALL_READABLE, 'none')
  expect('tabla con permission denied falla con la nota de la migración', FIXTURE_PERMISSION_DENIED, 'some', 'GRANT SELECT')
  expect('tablas inexistentes (migración sin aplicar) fallan', FIXTURE_TABLES_MISSING, 'some')
  expect('lectura de versiones con error falla', FIXTURE_VERSIONS_FAIL, 'some')
  process.exit(bad > 0 ? 1 : 0)
}

function errText(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  return `${err.message} ${String((err as { cause?: unknown }).cause ?? '')}`.replace(/\s+/g, ' ').trim()
}

async function main() {
  if (SELFTEST) selftest()

  // IN-06a: la base equivocada se rechaza ANTES de abrir Payload.
  const target = assertSafeTarget(process.env.DATABASE_URI, false, false)

  console.log('=== Verificación de esquema de lessons, fase 55 (solo lectura) ===')
  console.log(`  host/base: ${safeTarget(process.env.DATABASE_URI)} (host ${target.host}, puerto ${target.port}, base ${target.database})`)

  const { getPayload } = await import('payload')
  const { sql } = await import('@payloadcms/db-postgres')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  async function attempt(fn: () => Promise<unknown>): Promise<boolean | string> {
    try {
      await fn()
      return true
    } catch (err) {
      return errText(err)
    }
  }

  const tablesReadable: Record<string, boolean | string> = {}
  for (const table of LESSONS_TABLES) {
    // Los nombres salen de la lista cerrada LESSONS_TABLES, no de entrada externa.
    tablesReadable[table] = await attempt(() =>
      (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle.execute(
        sql.raw(`SELECT 1 FROM "${table}" LIMIT 1`),
      ),
    )
  }

  const readLocale = (locale: 'es' | 'en') =>
    attempt(() =>
      payload.find({
        collection: 'case-studies',
        locale,
        fallbackLocale: false,
        depth: 0,
        limit: 0,
        pagination: false,
        select: { lessons: true },
      }),
    )
  const esRead = await readLocale('es')
  const enRead = await readLocale('en')
  const versionsRead = await attempt(() => payload.findVersions({ collection: 'case-studies', limit: 1, depth: 0 }))

  const state: LessonsState = { tablesReadable, esRead, enRead, versionsRead }
  const fails = report(evaluateLessonsState(state))
  console.log(fails === 0 ? '\nTodo en PASS' : `\n${fails} resultado(s) en FAIL`)
  process.exit(fails === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
