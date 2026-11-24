/**
 * Helper puro de la verificación de esquema de la fase 55 (script 24).
 *
 * Sin imports de Payload ni de red: se prueba con fixtures (selftest del script
 * 24 y scripts/verify/55-schema-selftest.ts) sin tocar ninguna base.
 *
 * Contexto: la migración phase55_case_lessons crea cuatro tablas nuevas para el
 * campo `lessons` de CaseStudies. El preview lee con juantech_preview_ro (solo
 * SELECT). Si ese rol no puede leer las tablas nuevas, el error `permission
 * denied` debe salir aquí y no en una página rota del preview.
 */

/** Las cuatro tablas que crea phase55_case_lessons. */
export const LESSONS_TABLES = [
  'case_studies_lessons',
  'case_studies_lessons_locales',
  '_case_studies_v_version_lessons',
  '_case_studies_v_version_lessons_locales',
] as const

/**
 * Estado leído de la base. En `tablesReadable`, `true` significa que el SELECT
 * respondió; un string es el mensaje de error del SELECT. `esRead`, `enRead` y
 * `versionsRead` valen `true` si la lectura respondió (aunque con cero filas) o
 * el mensaje de error si falló.
 */
export type LessonsState = {
  tablesReadable: Record<string, boolean | string>
  esRead: boolean | string
  enRead: boolean | string
  versionsRead: boolean | string
}

export type LessonsResult = { name: string; ok: boolean; why: string }

const PERMISSION_NOTE =
  'permission denied: el rol conectado no puede leer las tablas nuevas. La causa probable es que la migración no la aplicó juantech_user, así que el rol de solo lectura no heredó SELECT (Pitfall 22, supuesto A2 de RESEARCH). Remedio de D-06: agregar GRANT SELECT dentro de la migración.'

function isPermissionDenied(v: boolean | string): boolean {
  return typeof v === 'string' && v.toLowerCase().includes('permission denied')
}

function describe(v: boolean | string): string {
  if (v === true) return 'lectura sin error'
  if (isPermissionDenied(v)) return PERMISSION_NOTE
  if (typeof v === 'string') return `error de lectura: ${v.slice(0, 200)}`
  return 'sin lectura'
}

/**
 * Evalúa el estado del esquema de lessons. Cero filas es válido: el campo queda
 * vacío hasta la fase 56 (D-10). Lo que se exige es que las lecturas no fallen.
 */
export function evaluateLessonsState(state: LessonsState): LessonsResult[] {
  const results: LessonsResult[] = []

  for (const table of LESSONS_TABLES) {
    const v = state.tablesReadable[table]
    results.push({
      name: `tabla ${table}`,
      ok: v === true,
      why: v === undefined ? 'no se intentó leer' : describe(v),
    })
  }

  results.push({
    name: 'lectura case-studies lessons (es, fallbackLocale false)',
    ok: state.esRead === true,
    why: describe(state.esRead),
  })
  results.push({
    name: 'lectura case-studies lessons (en, fallbackLocale false)',
    ok: state.enRead === true,
    why: describe(state.enRead),
  })
  results.push({
    name: 'lectura de versiones de case-studies (findVersions)',
    ok: state.versionsRead === true,
    why: describe(state.versionsRead),
  })

  return results
}

// ---------------------------------------------------------------------------
// Fixtures compartidos por la autoprueba del script 24 y 55-schema-selftest.ts
// ---------------------------------------------------------------------------

const allReadable = (): Record<string, boolean | string> =>
  Object.fromEntries(LESSONS_TABLES.map((t) => [t, true]))

/** Todo legible, cero filas: válido (lessons vacío hasta la fase 56). */
export const FIXTURE_ALL_READABLE: LessonsState = {
  tablesReadable: allReadable(),
  esRead: true,
  enRead: true,
  versionsRead: true,
}

/** Una tabla nueva con permission denied: debe fallar con la nota de la migración. */
export const FIXTURE_PERMISSION_DENIED: LessonsState = {
  tablesReadable: {
    ...allReadable(),
    case_studies_lessons_locales: 'permission denied for table case_studies_lessons_locales',
  },
  esRead: true,
  enRead: true,
  versionsRead: true,
}

/** Las tablas no existen (migración sin aplicar): debe fallar. */
export const FIXTURE_TABLES_MISSING: LessonsState = {
  tablesReadable: Object.fromEntries(
    LESSONS_TABLES.map((t) => [t, `relation "${t}" does not exist`]),
  ),
  esRead: 'column "lessons" does not exist',
  enRead: 'column "lessons" does not exist',
  versionsRead: 'relation "_case_studies_v_version_lessons" does not exist',
}

/** Las tablas responden pero la lectura de versiones falla: debe fallar. */
export const FIXTURE_VERSIONS_FAIL: LessonsState = {
  ...FIXTURE_ALL_READABLE,
  versionsRead: 'permission denied for table _case_studies_v_version_lessons',
}
