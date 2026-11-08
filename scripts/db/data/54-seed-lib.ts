/**
 * Helpers puros de los scripts de siembra de la fase 54 (20, 21 y 22).
 *
 * Sin imports de Payload ni de Node de red: se pueden probar por autoprueba
 * (scripts/verify/54-seed-selftest.ts) sin tocar ninguna base.
 *
 * Por qué existe la guardia de base (incidente del 2026-08-17): el `.env` local
 * apuntaba a una Neon abandonada, cuatro escrituras se auto-verificaron OK y
 * producción seguía sirviendo los valores viejos. Aquí la base equivocada se
 * rechaza ANTES de abrir ninguna conexión.
 */

// Caracteres prohibidos en el copy, escritos por código para que este archivo
// no los contenga literales.
const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
// Apertura de marcador de ranura del sandbox, armada por código por la misma razón.
const PENDING_OPEN = '{' + '{'

export type TargetParts = { host: string; port: string; database: string }

/** Host, puerto y base de una URI. Nunca usuario ni contraseña. */
export function parseTarget(uri: string | undefined): TargetParts | null {
  if (!uri) return null
  try {
    const u = new URL(uri)
    return {
      host: u.hostname,
      port: u.port || '5432',
      database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    }
  } catch {
    return null
  }
}

/** Cadena imprimible `host:puerto/base`, igual que scripts/db/04-which-database.ts. */
export function safeTarget(uri: string | undefined): string {
  if (!uri) return '(DATABASE_URI no definida)'
  const t = parseTarget(uri)
  if (!t) return '(no parseable como URL)'
  return `${t.host}:${t.port}/${t.database}`
}

const ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'shared-postgres']
const PROD_DATABASE = 'juantech'

/**
 * Rechaza (lanza) toda base que no sea la de producción vía túnel o
 * shared-postgres. Con `apply` exige además `dbChecked`, que significa que Juan
 * corrió 04-which-database.ts y confirmó contra qué base apunta.
 */
export function assertSafeTarget(
  uri: string | undefined,
  apply: boolean,
  dbChecked: boolean,
): TargetParts {
  const t = parseTarget(uri)
  if (!t) {
    throw new Error('DATABASE_URI ausente o no parseable: no se escribe nada.')
  }
  if (t.host.toLowerCase().includes('neon.tech')) {
    throw new Error(
      `La base apunta a ${t.host}: es la Neon abandonada del incidente del 2026-08-17. Lo que se escriba ahí no llega al sitio.`,
    )
  }
  if (!ALLOWED_HOSTS.includes(t.host.toLowerCase())) {
    throw new Error(
      `Host no permitido (${t.host}). Solo se acepta 127.0.0.1, localhost o shared-postgres (túnel a producción).`,
    )
  }
  if (t.database !== PROD_DATABASE) {
    throw new Error(`La base se llama "${t.database}" y no "${PROD_DATABASE}": no se escribe nada.`)
  }
  if (apply && !dbChecked) {
    throw new Error(
      '--apply exige --db-checked: corre primero scripts/db/04-which-database.ts y confirma la base.',
    )
  }
  return t
}

// ---------------------------------------------------------------------------
// Comparación de datos
// ---------------------------------------------------------------------------

type Json = unknown

function isPlainObject(v: Json): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Rutas de campo donde `current` no coincide con `desired`. Solo se miran las
 * claves presentes en `desired`: lo que Payload agrega por su cuenta (id,
 * createdAt, claves de otros campos) no cuenta como diferencia.
 * Los arrays se comparan por índice y por longitud.
 */
export function buildDiff(current: Json, desired: Json, path = ''): string[] {
  if (Array.isArray(desired)) {
    if (!Array.isArray(current)) return [path || '(raíz)']
    const out: string[] = []
    if (current.length !== desired.length) out.push(`${path}.length`)
    const n = Math.min(current.length, desired.length)
    for (let i = 0; i < n; i++) out.push(...buildDiff(current[i], desired[i], `${path}[${i}]`))
    return out
  }
  if (isPlainObject(desired)) {
    if (!isPlainObject(current)) return [path || '(raíz)']
    const out: string[] = []
    for (const key of Object.keys(desired)) {
      out.push(...buildDiff(current[key], desired[key], path ? `${path}.${key}` : key))
    }
    return out
  }
  return current === desired ? [] : [path || '(raíz)']
}

/**
 * Fusiona `desired` sobre `current` conservando lo que ya existe (ids de fila,
 * relaciones, claves ajenas). Devuelve el grupo COMPLETO que hay que enviar:
 * nunca un grupo parcial.
 *
 * Los arrays se alinean por índice. Si `current` tiene más filas que `desired`
 * lanza: ese script nunca borra filas, hay que revisarlo a mano.
 */
export function mergeGroup(current: Json, desired: Json, path = ''): Json {
  if (Array.isArray(desired)) {
    const cur = Array.isArray(current) ? current : []
    if (cur.length > desired.length) {
      throw new Error(
        `${path || '(raíz)'}: la base tiene ${cur.length} filas y el copy ${desired.length}. Este script no borra filas, revisa a mano.`,
      )
    }
    return desired.map((d, i) => mergeGroup(cur[i], d, `${path}[${i}]`))
  }
  if (isPlainObject(desired)) {
    const cur = isPlainObject(current) ? current : {}
    const out: Record<string, Json> = { ...cur }
    for (const key of Object.keys(desired)) {
      out[key] = mergeGroup(cur[key], desired[key], path ? `${path}.${key}` : key)
    }
    return out
  }
  return desired
}

/**
 * Copia profunda sin las claves de `ignoreKeys`, en cualquier nivel. Sirve para
 * comparar el layout del doc `stack` antes y después de agregar solo `logo`.
 */
export function stripKeys(value: Json, ignoreKeys: readonly string[]): Json {
  if (Array.isArray(value)) return value.map((v) => stripKeys(v, ignoreKeys))
  if (isPlainObject(value)) {
    const out: Record<string, Json> = {}
    for (const key of Object.keys(value)) {
      if (ignoreKeys.includes(key)) continue
      out[key] = stripKeys(value[key], ignoreKeys)
    }
    return out
  }
  return value
}

/** Diferencias entre dos layouts ignorando solo las claves indicadas (por defecto `logo`). */
export function layoutDiffIgnoring(
  a: Json,
  b: Json,
  ignoreKeys: readonly string[] = ['logo'],
): string[] {
  const sa = stripKeys(a, ignoreKeys)
  const sb = stripKeys(b, ignoreKeys)
  const out = buildDiff(sa, sb)
  // buildDiff es unidireccional (mira las claves de `sb`): se revisa también la inversa.
  for (const p of buildDiff(sb, sa)) if (!out.includes(p)) out.push(p)
  return out
}

// ---------------------------------------------------------------------------
// Nombres
// ---------------------------------------------------------------------------

/** Minúsculas, sin acentos y sin caracteres no alfanuméricos: `money-com` y `Money.com` coinciden. */
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

// ---------------------------------------------------------------------------
// Chequeos de copy
// ---------------------------------------------------------------------------

function walkStrings(
  value: Json,
  visit: (text: string, pathWithIndexes: string, genericPath: string) => void,
  path = '',
  generic = '',
): void {
  if (typeof value === 'string') {
    visit(value, path, generic)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, visit, `${path}[${i}]`, `${generic}[]`))
    return
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      walkStrings(
        value[key],
        visit,
        path ? `${path}.${key}` : key,
        generic ? `${generic}.${key}` : key,
      )
    }
  }
}

/**
 * Falla ante guion largo, guion corto o la apertura de marcador de ranura.
 * `allowedPendingPaths` (rutas con `[]` como comodín de índice) exime SOLO el
 * marcador, nunca los guiones.
 */
export function assertNoForbiddenChars(obj: Json, allowedPendingPaths: readonly string[] = []): void {
  const problems: string[] = []
  walkStrings(obj, (text, path, generic) => {
    if (text.includes(EM_DASH)) problems.push(`${path}: guion largo`)
    if (text.includes(EN_DASH)) problems.push(`${path}: guion corto`)
    if (text.includes(PENDING_OPEN) && !allowedPendingPaths.includes(generic)) {
      problems.push(`${path}: marcador de ranura`)
    }
  })
  if (problems.length) throw new Error(`Copy con caracteres prohibidos:\n  ${problems.join('\n  ')}`)
}

/** Rutas genéricas donde aparece un marcador de ranura. */
export function findPendingMarkers(obj: Json): string[] {
  const found: string[] = []
  walkStrings(obj, (text, _path, generic) => {
    if (text.includes(PENDING_OPEN) && !found.includes(generic)) found.push(generic)
  })
  return found
}

/** Deja pasar el marcador de ranura solo en las rutas permitidas; en cualquier otra lanza. */
export function assertPendingMarkersOnlyIn(obj: Json, allowedPaths: readonly string[]): void {
  const outside = findPendingMarkers(obj).filter((p) => !allowedPaths.includes(p))
  if (outside.length) {
    throw new Error(`Marcador de ranura fuera de las rutas permitidas: ${outside.join(', ')}`)
  }
}

/** Presencia de las tres variables de Cloudinary, sin imprimir sus valores. */
export function missingCloudinaryVars(env: Record<string, string | undefined>): string[] {
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter(
    (k) => !env[k],
  )
}
