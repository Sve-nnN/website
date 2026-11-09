/**
 * Verificacion estatica de hooks y tags de cache (fase 55, plan 55-04, IN-05).
 *
 * Comprueba, sin tocar base ni red:
 *   1. Que cada coleccion que toca la fase expone `hooks.afterChange` y
 *      `hooks.afterDelete` no vacios (CaseStudies, Websites, Authors, Posts,
 *      Categories, SpeakingEvents).
 *   2. Que ninguna cadena con forma de tag (`algo:all`) aparece como literal en
 *      src/lib/*.ts fuera de cache-tags.ts (los comentarios no cuentan).
 *   3. Que cada `unstable_cache` de person.ts, cta-data.ts y about-data.ts lleva
 *      `tags`, y que las de autores y eventos llevan el tag correcto.
 *   4. Que cache-tags.ts no importa `payload` ni `@payload-config` fuera de
 *      `import type` (ciclo T-55-14).
 *
 * LIMITE (T-55-15): esto es estatico. Los hooks corren en el proceso del admin
 * (produccion); la revalidacion en vivo se comprueba a mano en la fase 57.
 *
 *   node_modules/.bin/tsx scripts/verify/55-cache-tags.ts            todo
 *   node_modules/.bin/tsx scripts/verify/55-cache-tags.ts --only websites
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const LIB = join(ROOT, 'src', 'lib')

// ---------------------------------------------------------------------------
// Funciones puras (se prueban abajo con fixtures defectuosos)
// ---------------------------------------------------------------------------

type HookShape = { slug?: string; hooks?: { afterChange?: unknown[]; afterDelete?: unknown[] } }

/** Devuelve el motivo del fallo, o null si la coleccion expone ambos hooks. */
export function hookProblem(config: HookShape): string | null {
  const change = config.hooks?.afterChange
  const del = config.hooks?.afterDelete
  if (!Array.isArray(change) || change.length === 0) return 'sin hooks.afterChange'
  if (!Array.isArray(del) || del.length === 0) return 'sin hooks.afterDelete'
  return null
}

/** Quita comentarios de linea y de bloque (no toca el contenido de las cadenas). */
export function stripComments(src: string): string {
  let out = ''
  let i = 0
  let quote: string | null = null
  while (i < src.length) {
    const c = src[i]
    const n = src[i + 1]
    if (quote) {
      out += c
      if (c === '\\') {
        out += n ?? ''
        i += 2
        continue
      }
      if (c === quote) quote = null
      i += 1
      continue
    }
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i += 1
      continue
    }
    if (c === '/' && n === '*') {
      i += 2
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i += 1
      i += 2
      continue
    }
    // Literal de regex (`.replace(/'/g, ...)`): sin saltarlo, la comilla de
    // adentro abre una cadena falsa y se pierde el resto del archivo.
    if (c === '/' && /[(,=:[!&|?{};]\s*$/.test(out.slice(-20)) || (c === '/' && out.trim() === '')) {
      let j = i + 1
      let inClass = false
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') j += 1
        else if (src[j] === '[') inClass = true
        else if (src[j] === ']') inClass = false
        else if (src[j] === '/' && !inClass) break
        j += 1
      }
      out += src.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
    out += c
    i += 1
  }
  return out
}

/** Literales con forma de tag de coleccion (`websites:all`, `speaking-events:all`). */
export function looseTagLiterals(src: string): string[] {
  const code = stripComments(src)
  const found: string[] = []
  const re = /(['"`])([a-z][a-z0-9-]*:all)\1/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) found.push(m[2])
  return found
}

/** Texto completo de cada llamada `unstable_cache(...)`, con parentesis balanceados. */
export function unstableCacheCalls(src: string): string[] {
  const code = stripComments(src)
  const calls: string[] = []
  const re = /unstable_cache\s*\(/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    let depth = 1
    let i = m.index + m[0].length
    let quote: string | null = null
    const start = i
    while (i < code.length && depth > 0) {
      const c = code[i]
      if (quote) {
        if (c === '\\') i += 1
        else if (c === quote) quote = null
      } else if (c === "'" || c === '"' || c === '`') quote = c
      else if (c === '(') depth += 1
      else if (c === ')') depth -= 1
      i += 1
    }
    calls.push(code.slice(start, i - 1))
  }
  return calls
}

/** Clave de cache: el arreglo `['clave', ...]` que va justo antes del objeto de opciones. */
export function cacheKeyOf(call: string): string | null {
  const m = call.match(/\[\s*(['"`])([^'"`]+)\1[^\]]*\]\s*,\s*\{/)
  return m ? m[2] : null
}

/**
 * Caches sin tag a proposito. `about-counts` cuenta `clientes`, una coleccion
 * que esta fase no toca y que no tiene tag ni hook; entra por el TTL de 60 s.
 */
export const UNTAGGED_ALLOWED = new Set(['about-counts'])

/** Tag exigido por clave de cache, para las lecturas de autores y eventos. */
export const REQUIRED_TAG_BY_KEY: Record<string, string> = {
  'site-person': 'CACHE_TAGS.authors()',
  'cta-author': 'CACHE_TAGS.authors()',
  'about-author': 'CACHE_TAGS.authors()',
  'about-events': 'CACHE_TAGS.speakingEvents()',
}

export function cacheProblem(call: string): string | null {
  const key = cacheKeyOf(call) ?? '(sin clave)'
  const hasTags = /\btags\s*:/.test(call)
  if (!hasTags && !UNTAGGED_ALLOWED.has(key)) return `unstable_cache '${key}' sin tags`
  const required = REQUIRED_TAG_BY_KEY[key]
  if (required && !call.includes(required)) return `unstable_cache '${key}' sin ${required}`
  return null
}

/** `import` de payload o del config fuera de `import type`. */
export function runtimePayloadImports(src: string): string[] {
  const code = stripComments(src)
  const out: string[] = []
  const re = /^\s*import\s+(?!type\b)[^'"]*?from\s+['"](payload|@payload-config)['"]/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) out.push(m[1])
  return out
}

// ---------------------------------------------------------------------------
// Fixtures defectuosos: deben fallar. Si pasan, la verificacion no sirve.
// ---------------------------------------------------------------------------
check(hookProblem({ hooks: { afterChange: [() => 1], afterDelete: [() => 1] } }) === null, 'fixture: coleccion completa pasa', 'rechazo una coleccion con ambos hooks')
check(hookProblem({}) !== null, 'fixture defectuoso: coleccion sin hooks falla', 'acepto una coleccion sin hooks')
check(hookProblem({ hooks: { afterChange: [() => 1] } }) !== null, 'fixture defectuoso: sin afterDelete falla', 'acepto una coleccion sin afterDelete')
check(hookProblem({ hooks: { afterChange: [], afterDelete: [() => 1] } }) !== null, 'fixture defectuoso: afterChange vacio falla', 'acepto afterChange vacio')
check(looseTagLiterals("tags: ['websites:all']").length === 1, 'fixture defectuoso: literal suelto se detecta', 'no detecto websites:all')
check(looseTagLiterals('// `authors:all` solo en un comentario\n/* \'posts:all\' */ const a = 1').length === 0, 'fixture: tag en comentario no cuenta', 'conto un tag dentro de un comentario')
check(
  cacheProblem("unstable_cache(async () => 1, ['site-person'], { revalidate: 60 })") !== null,
  'fixture defectuoso: unstable_cache sin tags falla',
  'acepto una cache sin tags',
)
check(
  cacheProblem("unstable_cache(async () => 1, ['site-person'], { tags: [CACHE_TAGS.posts()], revalidate: 60 })") !== null,
  'fixture defectuoso: cache de autor con el tag equivocado falla',
  'acepto una cache de autor sin CACHE_TAGS.authors()',
)
check(
  cacheProblem("unstable_cache(async () => 1, ['site-person'], { tags: [CACHE_TAGS.authors()], revalidate: 60 })") === null,
  'fixture: cache de autor con tag correcto pasa',
  'rechazo una cache de autor bien etiquetada',
)
check(runtimePayloadImports("import { getPayload } from 'payload'").length === 1, 'fixture defectuoso: import de payload en runtime se detecta', 'no detecto el import')
check(runtimePayloadImports("import type { Page } from 'payload'").length === 0, 'fixture: import type de payload no cuenta', 'conto un import type')

// ---------------------------------------------------------------------------
// Comprobaciones reales
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const onlyIdx = process.argv.indexOf('--only')
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null

  // 1. Hooks de las seis colecciones. Import dinamico: sin las banderas de
  // arranque de Payload, importar las configuraciones solo lee objetos.
  const COLLECTIONS: Array<[string, () => Promise<{ [k: string]: HookShape }>, string]> = [
    ['case-studies', () => import('../../src/collections/CaseStudies'), 'CaseStudies'],
    ['websites', () => import('../../src/collections/Websites'), 'Websites'],
    ['authors', () => import('../../src/collections/Authors'), 'Authors'],
    ['posts', () => import('../../src/collections/Posts'), 'Posts'],
    ['categories', () => import('../../src/collections/Categories'), 'Categories'],
    ['speaking-events', () => import('../../src/collections/SpeakingEvents'), 'SpeakingEvents'],
  ]
  for (const [name, load, exportName] of COLLECTIONS) {
    if (only && only !== name) continue
    try {
      const mod = await load()
      const config = mod[exportName]
      const problem = config ? hookProblem(config) : `la coleccion no exporta ${exportName}`
      check(problem === null, `hooks de ${name}`, problem ?? '')
    } catch (err) {
      check(false, `hooks de ${name}`, `no se pudo importar la coleccion: ${(err as Error).message}`)
    }
  }

  // 2. Literales de tag sueltos en src/lib/*.ts (todos menos cache-tags.ts).
  const libFiles = readdirSync(LIB).filter((f) => f.endsWith('.ts') && f !== 'cache-tags.ts')
  const loose: string[] = []
  for (const f of libFiles) {
    for (const lit of looseTagLiterals(readFileSync(join(LIB, f), 'utf8'))) loose.push(`${f}: '${lit}'`)
  }
  check(loose.length === 0, 'ningun literal de tag fuera de cache-tags.ts', loose.join('; '))

  // 4. cache-tags.ts no importa payload ni el config en runtime (T-55-14).
  const tagsSrc = readFileSync(join(LIB, 'cache-tags.ts'), 'utf8')
  const bad = runtimePayloadImports(tagsSrc)
  check(bad.length === 0, 'cache-tags.ts sin imports de payload en runtime', bad.join(', '))

  // 3. unstable_cache con tags (solo sin --only: depende de la tarea 2).
  if (!only) {
    for (const f of ['person.ts', 'cta-data.ts', 'about-data.ts']) {
      const calls = unstableCacheCalls(readFileSync(join(LIB, f), 'utf8'))
      check(calls.length > 0, `${f} tiene unstable_cache`, 'no se encontro ninguna llamada')
      for (const call of calls) {
        const problem = cacheProblem(call)
        check(problem === null, `${f}: cache '${cacheKeyOf(call)}'`, problem ?? '')
      }
    }
  }

  if (failures > 0) {
    console.log(`\n${failures} FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 55-cache-tags')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
