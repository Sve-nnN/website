/**
 * Fase 56 (plan 56-12): siembra el contenido sombra de home-page y about-page.
 *
 * Qué escribe, y solo esto:
 *   - global `home-page`  (copy de la home y de Contacto)
 *   - global `about-page` (copy de Sobre mí)
 * Los dos son globals sombra que master no lee (D-02): nada que master sirva se
 * sobrescribe. Nunca toca title ni meta (D-23), lecciones, alt de capturas, filas de
 * Websites, autores ni testimonios (eso se carga en el corte, plan 56-14).
 *
 * IDIOMAS. Por defecto solo siembra ES. El EN es opt-in:
 *   --include-en           siembra también EN (la decisión HOME-EN y ABOUT-EN debe estar
 *                          aprobada en el registro; si sigue propuesta exige además
 *                          --allow-proposed-en, que significa "Juan la aprobó fuera del repo")
 *   --allow-proposed-en    permite sembrar un EN que el registro aún marca propuesto
 * Con EN incluido el centinela EN (tagline y hero.lead de home, hero.lead de about) debe
 * traer texto: si queda vacío el script aborta (Pitfall 1: /en caería al español).
 *
 * DRY-RUN POR DEFECTO. Sin `--apply` solo lee e imprime el diff.
 *   --apply                escribe; exige --db-checked
 *   --db-checked           Juan confirmó con 04-which-database.ts contra qué base apunta
 *   --only home|about      siembra solo uno de los dos globals
 *   --print-current        imprime en JSON el grupo actual de cada global y locale (solo copy
 *                          público) para que Juan lo guarde como respaldo fuera del repo
 *   --allow-shrink-stages  permite recortar filas de about-page (5 etapas a 4). Es el ÚNICO
 *                          paso destructivo: mergeGroup se niega a borrar filas, así que aquí
 *                          se usa mergeGroupAllowShrink, se imprime la fila descartada y la
 *                          bandera solo vale junto a --apply. Juan lo aprueba por nombre.
 *
 * Seguridad de la base (CLAUDE.md, Database Safety; incidente 2026-08-17):
 *   - Imprime host, puerto y nombre (nunca usuario ni contraseña) y rechaza toda base que
 *     no sea la de producción vía túnel o shared-postgres, ANTES de importar Payload.
 *   - La base sale solo de las variables del shell. Nunca se carga el .env del repo.
 *
 * Trampas de scripts contra Payload (memoria del proyecto):
 *   - `fallbackLocale: false` cuando la lectura decide si escribir.
 *   - El grupo se envía COMPLETO (leído y fusionado), nunca parcial.
 *   - Cada escritura vuelve a leer y compara.
 *   - Las escrituras por script no invalidan el tag de `unstable_cache`: el efecto sale
 *     tras el TTL de 60 s. Verificar contra el HTML servido, no contra el OK de este script.
 *   - No usa ninguna operación de borrado de la Local API.
 *
 *   DATABASE_URI=<túnel> PAYLOAD_SECRET=migrate-only \
 *     node_modules/.bin/tsx scripts/db/26-phase56-seed-shadow.ts [banderas]
 */
import { pathToFileURL } from 'node:url'

import { ABOUT_COPY_EN, ABOUT_COPY_ES, DECISIONS as ABOUT_DECISIONS } from './data/56-about-copy'
import type { DecisionStatus } from './data/56-content-decisions'
import { DECISIONS as HOME_DECISIONS, HOME_COPY_EN, HOME_COPY_ES } from './data/56-home-copy'
import {
  assertNoForbiddenChars,
  assertSafeTarget,
  mergeGroupAllowShrink,
  safeTarget,
} from './data/56-seed-lib'

type Copy = Record<string, unknown>
type Locale = 'es' | 'en'
export type GlobalSlug = 'home-page' | 'about-page'

export type Opts = {
  apply: boolean
  dbChecked: boolean
  only: 'home' | 'about' | null
  includeEn: boolean
  allowProposedEn: boolean
  allowShrinkStages: boolean
  printCurrent: boolean
}

export type Source = {
  slug: GlobalSlug
  short: 'home' | 'about'
  es: Copy
  en: Copy
  enDecisionId: string
  enStatus: DecisionStatus
  /** Rutas del copy EN que deben traer texto (centinelas del respaldo de idioma). */
  sentinels: string[]
}

export type Io = { out: (line: string) => void; err: (line: string) => void }

/** Claves que nunca pueden viajar en el copy de un global (D-23: title y meta son de master). */
const FORBIDDEN_TOP_KEYS = ['title', 'meta', 'slug', 'description', 'seo'] as const

function statusOf(decisions: { id: string; status: DecisionStatus }[], id: string): DecisionStatus {
  return decisions.find((d) => d.id === id)?.status ?? 'pendiente'
}

export const DEFAULT_SOURCES: Source[] = [
  {
    slug: 'home-page',
    short: 'home',
    es: HOME_COPY_ES as unknown as Copy,
    en: HOME_COPY_EN as unknown as Copy,
    enDecisionId: 'HOME-EN',
    enStatus: statusOf(HOME_DECISIONS, 'HOME-EN'),
    sentinels: ['tagline', 'hero.lead'],
  },
  {
    slug: 'about-page',
    short: 'about',
    es: ABOUT_COPY_ES as unknown as Copy,
    en: ABOUT_COPY_EN as unknown as Copy,
    enDecisionId: 'ABOUT-EN',
    enStatus: statusOf(ABOUT_DECISIONS, 'ABOUT-EN'),
    sentinels: ['hero.lead'],
  },
]

// ---------------------------------------------------------------------------
// Utilidades puras
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

const isEmptyValue = (v: unknown) => v === undefined || v === null || v === ''

/**
 * Como buildDiff de 54-seed-lib, pero una cadena vacía y un valor ausente cuentan como
 * iguales: el copy manda '' para quitar notas y cifras, y Payload puede devolver null.
 */
export function diffLenient(current: unknown, desired: unknown, path = ''): string[] {
  if (Array.isArray(desired)) {
    if (!Array.isArray(current)) return [path || '(raiz)']
    const out: string[] = []
    if (current.length !== desired.length) out.push(`${path}.length`)
    const n = Math.min(current.length, desired.length)
    for (let i = 0; i < n; i++) out.push(...diffLenient(current[i], desired[i], `${path}[${i}]`))
    return out
  }
  if (isPlainObject(desired)) {
    if (!isPlainObject(current)) return [path || '(raiz)']
    const out: string[] = []
    for (const key of Object.keys(desired)) {
      out.push(...diffLenient(current[key], desired[key], path ? `${path}.${key}` : key))
    }
    return out
  }
  if (isEmptyValue(desired) && isEmptyValue(current)) return []
  return current === desired ? [] : [path || '(raiz)']
}

function getByPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const token of path.split(/[.[\]]/).filter(Boolean)) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[token]
  }
  return cur
}

function nonEmpty(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

/** Interpreta las banderas. Lanza ante un valor de --only inválido. */
export function parseArgs(argv: string[]): Opts {
  const has = (flag: string) => argv.includes(flag)
  const idx = argv.indexOf('--only')
  let only: Opts['only'] = null
  if (idx >= 0) {
    const value = argv[idx + 1]
    if (value !== 'home' && value !== 'about') {
      throw new Error(`--only acepta "home" o "about" y recibio "${String(value)}"`)
    }
    only = value
  }
  return {
    apply: has('--apply'),
    dbChecked: has('--db-checked'),
    only,
    includeEn: has('--include-en'),
    allowProposedEn: has('--allow-proposed-en'),
    allowShrinkStages: has('--allow-shrink-stages'),
    printCurrent: has('--print-current'),
  }
}

// ---------------------------------------------------------------------------
// Plan (solo lectura) y escritura
// ---------------------------------------------------------------------------

type Discarded = { key: string; path: string; id: unknown; summary: string }

type Plan = {
  src: Source
  locale: Locale
  copy: Copy
  data: Record<string, unknown>
  discarded: Discarded[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayloadLike = any

async function readGlobal(payload: PayloadLike, slug: string, locale: Locale): Promise<Record<string, unknown>> {
  return (await payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 0 })) as Record<string, unknown>
}

function describeRow(row: unknown): string {
  if (!isPlainObject(row)) return '(sin datos)'
  const parts = ['when', 'org', 'role', 'label', 'title']
    .filter((k) => nonEmpty(row[k]))
    .map((k) => `${k}="${String(row[k])}"`)
  return parts.length > 0 ? parts.join(' ') : '(sin when, org ni role)'
}

async function planFor(payload: PayloadLike, src: Source, locale: Locale, log: (l: string) => void): Promise<Plan> {
  const copy = locale === 'es' ? src.es : src.en
  const current = await readGlobal(payload, src.slug, locale)
  const data: Record<string, unknown> = {}
  const discarded: Discarded[] = []

  log(`\n--- global ${src.slug} (locale ${locale}) ---`)
  for (const key of Object.keys(copy)) {
    const diff = diffLenient(current[key], copy[key], key)
    const { merged, discarded: dropped } = mergeGroupAllowShrink(
      current[key] as never,
      copy[key] as never,
      key,
    )
    for (const d of dropped) {
      discarded.push({
        key,
        path: d.path,
        id: d.id,
        summary: describeRow(getByPath(current, d.path)),
      })
    }
    if (diff.length === 0 && dropped.length === 0) {
      log(`  igual   ${key}`)
      continue
    }
    log(`  difiere ${key}: ${diff.length} campo(s)${diff.length <= 6 ? ` -> ${diff.join(', ')}` : ''}`)
    // Grupo COMPLETO: lo leído fusionado con el copy, nunca un grupo parcial.
    data[key] = merged
  }
  for (const d of discarded) {
    log(`  DESCARTA ${d.path} (id ${String(d.id)}): ${d.summary}`)
  }
  return { src, locale, copy, data, discarded }
}

async function writePlan(payload: PayloadLike, plan: Plan, log: (l: string) => void): Promise<boolean> {
  await payload.updateGlobal({ slug: plan.src.slug, locale: plan.locale, data: plan.data })

  const after = await readGlobal(payload, plan.src.slug, plan.locale)
  const remaining = diffLenient(after, plan.copy)
  log(
    remaining.length === 0
      ? `  OK   ${plan.src.slug} (${plan.locale}): releido y comparado, sin diferencias`
      : `  FALLA ${plan.src.slug} (${plan.locale}): tras escribir siguen difiriendo ${remaining.join(', ')}`,
  )
  return remaining.length === 0
}

// ---------------------------------------------------------------------------
// Ejecucion (inyectable: la autoprueba usa una Local API falsa en memoria)
// ---------------------------------------------------------------------------

/**
 * Devuelve el codigo de salida. `loadPayload` solo se llama despues de que la guardia de
 * base y las comprobaciones puras pasan: con una base de Neon nunca se importa Payload.
 */
export async function run(
  opts: Opts,
  env: { DATABASE_URI?: string },
  loadPayload: () => Promise<PayloadLike>,
  io: Io,
  sources: Source[] = DEFAULT_SOURCES,
): Promise<number> {
  // En --print-current stdout es el JSON del respaldo: el resto va a stderr.
  const log = opts.printCurrent ? io.err : io.out
  log(`=== ${opts.printCurrent ? 'RESPALDO (solo lectura)' : opts.apply ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} ===`)
  log(`  base: ${safeTarget(env.DATABASE_URI)}`)

  if (opts.allowShrinkStages && !opts.apply) {
    log('ABORT: --allow-shrink-stages solo vale junto a --apply. El dry-run sin la bandera ya lista la fila que sobra.')
    return 1
  }
  try {
    assertSafeTarget(env.DATABASE_URI, opts.apply, opts.dbChecked)
  } catch (err) {
    log(`ABORT: ${(err as Error).message}`)
    return 1
  }

  const selected = sources.filter((s) => opts.only === null || s.short === opts.only)
  const locales: Locale[] = opts.includeEn ? ['es', 'en'] : ['es']
  if (!opts.printCurrent) {
    log(`  globals: ${selected.map((s) => s.slug).join(', ')}`)
    log(`  idiomas: ${locales.join(', ')}${opts.includeEn ? '' : ' (EN no incluido: usa --include-en cuando Juan lo apruebe)'}`)
  }

  // Comprobaciones puras ANTES de abrir Payload.
  if (!opts.printCurrent) {
    for (const src of selected) {
      for (const locale of locales) {
        const copy = locale === 'es' ? src.es : src.en
        try {
          assertNoForbiddenChars(copy)
        } catch (err) {
          log(`ABORT en ${src.slug} (${locale}): ${(err as Error).message}`)
          return 1
        }
        const bad = Object.keys(copy).filter((k) => (FORBIDDEN_TOP_KEYS as readonly string[]).includes(k))
        if (bad.length > 0) {
          log(`ABORT en ${src.slug} (${locale}): el copy trae claves de master (${bad.join(', ')}); title y meta nunca se escriben (D-23)`)
          return 1
        }
      }
      if (opts.includeEn) {
        log(`  ${src.enDecisionId} (EN de ${src.short}): estado ${src.enStatus}`)
        if (src.enStatus !== 'aprobado' && !opts.allowProposedEn) {
          log(`ABORT: ${src.enDecisionId} sigue ${src.enStatus}. Juan debe aprobarlo; si ya lo hizo fuera del repo, agrega --allow-proposed-en.`)
          return 1
        }
        const empty = src.sentinels.filter((p) => !nonEmpty(getByPath(src.en, p)))
        if (empty.length > 0) {
          log(`ABORT: centinela EN vacio en ${src.slug} (${empty.join(', ')}): /en caeria al espanol (Pitfall 1)`)
          return 1
        }
      }
    }
  }

  // Import dinamico: nada de Payload se carga si la guardia de base aborta.
  let payload: PayloadLike
  try {
    payload = await loadPayload()
  } catch (err) {
    log(`ABORT abriendo Payload: ${(err as Error).message}`)
    return 1
  }

  if (opts.printCurrent) {
    const snapshot: Record<string, unknown> = {}
    for (const src of selected) {
      for (const locale of ['es', 'en'] as Locale[]) {
        try {
          snapshot[`${src.slug}:${locale}`] = await readGlobal(payload, src.slug, locale)
        } catch (err) {
          log(`ABORT leyendo ${src.slug} (${locale}): ${(err as Error).message}`)
          return 1
        }
      }
    }
    io.out(JSON.stringify(snapshot, null, 2))
    log('Respaldo impreso. Guardalo fuera del repo antes de aplicar.')
    return 0
  }

  // Validar que el copy solo trae claves del global (cuando Payload expone su config).
  const configured = (payload.config?.globals ?? []) as { slug: string; fields: { name?: string }[] }[]
  for (const src of selected) {
    const cfg = configured.find((g) => g.slug === src.slug)
    if (!cfg) continue
    const names = new Set(cfg.fields.map((f) => f.name).filter(Boolean))
    for (const locale of locales) {
      const copy = locale === 'es' ? src.es : src.en
      const stray = Object.keys(copy).filter((k) => !names.has(k))
      if (stray.length > 0) {
        log(`ABORT: el copy ${locale} de ${src.slug} trae claves que el global no tiene (${stray.join(', ')})`)
        return 1
      }
    }
  }

  // Plan completo (solo lectura) ANTES de la primera escritura: un recorte sin bandera
  // aborta sin dejar nada a medias.
  const plans: Plan[] = []
  try {
    for (const src of selected) {
      for (const locale of locales) plans.push(await planFor(payload, src, locale, log))
    }
  } catch (err) {
    log(`ABORT leyendo los globals: ${(err as Error).message}\n  (la migracion phase56_legal_shadow y las de la 54 deben estar aplicadas)`)
    return 1
  }

  const shrinking = plans.filter((p) => p.discarded.length > 0)
  if (shrinking.length > 0) {
    log('\n  RECORTE DETECTADO: la base tiene mas filas que el copy. Es el unico paso destructivo.')
    log('  Respaldo: corre antes --print-current y guarda el JSON fuera del repo.')
    if (!opts.allowShrinkStages) {
      log(
        opts.apply
          ? 'ABORT: sin --allow-shrink-stages no se recorta nada. No se escribio ningun global.'
          : '  AVISO: con --apply este script se negaria a recortar sin --allow-shrink-stages.',
      )
      if (opts.apply) return 1
    } else {
      log('  --allow-shrink-stages activo: Juan debe haber escrito "apruebo recortar etapas de about-page de 5 a 4".')
    }
  }

  if (!opts.apply) {
    log('\nDRY-RUN: no se escribe. Vuelve a correr con --apply --db-checked.')
    return 0
  }

  let allOk = true
  try {
    for (const plan of plans) {
      log(`\nEscribiendo ${plan.src.slug} (${plan.locale})`)
      if (Object.keys(plan.data).length === 0) {
        log('  nada que escribir (idempotente)')
        continue
      }
      allOk = (await writePlan(payload, plan, log)) && allOk
    }
  } catch (err) {
    log(`ABORT escribiendo: ${(err as Error).message}\n  Lo escrito antes de este error queda aplicado. Revisa con 25-phase56-verify-schema.ts.`)
    return 1
  }

  log('\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. Verifica contra el HTML servido, no contra este OK.')
  return allOk ? 0 : 1
}

async function main() {
  let opts: Opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(`ABORT: ${(err as Error).message}`)
    process.exit(1)
  }
  const code = await run(
    opts,
    process.env,
    async () => {
      const { getPayload } = await import('payload')
      const config = (await import('../../src/payload.config')).default
      return getPayload({ config })
    },
    { out: (l) => console.log(l), err: (l) => console.error(l) },
  )
  process.exit(code)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
