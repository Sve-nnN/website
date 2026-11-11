/**
 * Helpers puros de la fase 56 (sin Payload ni red).
 *
 * Los usa scripts/db/25-phase56-verify-schema.ts (solo lectura) y, en el caso de
 * mergeGroupAllowShrink, el script de siembra del plan 56-12. Se prueban por
 * autoprueba sin tocar ninguna base.
 *
 * Reexporta lo que la fase necesita de 54-seed-lib para que los planes de la 56
 * importen de un solo sitio.
 */
import { findPendingMarkers, mergeGroup } from './54-seed-lib'
import type { Decision } from './56-content-decisions'

export {
  assertNoForbiddenChars,
  assertSafeTarget,
  findPendingMarkers,
  mergeGroup,
  safeTarget,
} from './54-seed-lib'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type CheckResult = { name: string; ok: boolean; why: string }

function isPlainObject(v: unknown): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function pick(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

function nonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

/** Un estado Lexical cuenta como "con hijos" solo si algun nodo lleva texto. */
export function lexicalHasText(value: unknown): boolean {
  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false
    const n = node as { text?: unknown; children?: unknown }
    if (typeof n.text === 'string' && n.text.trim() !== '') return true
    return Array.isArray(n.children) && n.children.some(walk)
  }
  if (!value || typeof value !== 'object') return false
  return walk((value as { root?: unknown }).root)
}

// ---------------------------------------------------------------------------
// Estado del global legal-pages
// ---------------------------------------------------------------------------

/** Lectura de legal-pages en un idioma. `null` significa que no se pudo leer. */
export type LegalLocaleState = {
  privacyBody: unknown
  termsBody: unknown
  effectiveDate: unknown
} | null

export type LegalState = {
  es: LegalLocaleState
  en: LegalLocaleState
  /** Verdadero si alguna lectura fallo con permission denied. */
  permissionDenied?: boolean
}

export function evaluateLegalState(
  state: LegalState,
  opts: { expectSeeded: boolean; expectDate?: boolean },
): CheckResult[] {
  const out: CheckResult[] = []
  const add = (name: string, ok: boolean, why: string) => out.push({ name, ok, why })

  const unreadable = (lang: string) =>
    state.permissionDenied
      ? `no se pudo leer ${lang}: permission denied, el rol conectado no puede leer las tablas nuevas (falta el GRANT SELECT de la migracion)`
      : `no se pudo leer ${lang} (falta aplicar la migracion phase56_legal_shadow)`

  add('global legal-pages legible en es', state.es !== null, state.es ? 'leido' : unreadable('es'))
  add('global legal-pages legible en en', state.en !== null, state.en ? 'leido' : unreadable('en'))

  if (opts.expectSeeded) {
    for (const [lang, st] of [['es', state.es], ['en', state.en]] as const) {
      add(`legal-pages.privacy.body con texto en ${lang}`, lexicalHasText(st?.privacyBody), lexicalHasText(st?.privacyBody) ? 'ok' : 'vacio')
      add(`legal-pages.terms.body con texto en ${lang}`, lexicalHasText(st?.termsBody), lexicalHasText(st?.termsBody) ? 'ok' : 'vacio')
    }
  }

  if (opts.expectDate) {
    const date = state.es?.effectiveDate ?? state.en?.effectiveDate
    add('legal-pages.effectiveDate no vacia', nonEmptyString(date), nonEmptyString(date) ? `${String(date)}` : 'vacia')
  }
  return out
}

// ---------------------------------------------------------------------------
// Estado sombra de home-page y about-page (fase 56, siembra EN)
// ---------------------------------------------------------------------------

export type ShadowLocaleState = {
  home: Record<string, unknown> | null
  about: Record<string, unknown> | null
}

export type Shadow56State = { es: ShadowLocaleState; en: ShadowLocaleState }

/** Conteos esperados de listas de home-page (los mismos de la 54). */
export const HOME_LIST_COUNTS: readonly [string, number][] = [
  ['services.items', 5],
  ['process.steps', 4],
  ['vitals.items', 4],
  ['faq.items', 5],
  ['contact.steps', 3],
  ['contact.infoRows', 3],
]

export function evaluateShadow56State(
  state: Shadow56State,
  opts: { expectShadowSeeded: boolean; expectedStages: number },
): CheckResult[] {
  const out: CheckResult[] = []
  const add = (name: string, ok: boolean, why: string) => out.push({ name, ok, why })

  for (const lang of ['es', 'en'] as const) {
    const st = state[lang]
    add(`home-page legible en ${lang}`, st.home !== null, st.home ? 'leido' : 'no se pudo leer')
    add(`about-page legible en ${lang}`, st.about !== null, st.about ? 'leido' : 'no se pudo leer')
  }

  if (!opts.expectShadowSeeded) return out

  // Centinelas EN: si faltan, /en cae al espanol.
  const enTag = pick(state.en.home, 'tagline')
  add('home-page.tagline EN no vacio (centinela)', nonEmptyString(enTag), nonEmptyString(enTag) ? 'ok' : 'vacio, /en cae al espanol')
  const enLead = pick(state.en.home, 'hero.lead')
  add('home-page.hero.lead EN no vacio (centinela)', nonEmptyString(enLead), nonEmptyString(enLead) ? 'ok' : 'vacio')
  const enAboutLead = pick(state.en.about, 'hero.lead')
  add('about-page.hero.lead EN no vacio (centinela)', nonEmptyString(enAboutLead), nonEmptyString(enAboutLead) ? 'ok' : 'vacio, /en/sobre-mi cae al espanol')

  for (const lang of ['es', 'en'] as const) {
    for (const [path, expected] of HOME_LIST_COUNTS) {
      const v = pick(state[lang].home, path)
      const n = Array.isArray(v) ? v.length : 0
      add(`home-page.${path} tiene ${expected} en ${lang}`, n === expected, `hay ${n}`)
    }
    const stages = pick(state[lang].about, 'experience.stages')
    const n = Array.isArray(stages) ? stages.length : 0
    add(
      `about-page.experience.stages tiene ${opts.expectedStages} en ${lang}`,
      n === opts.expectedStages,
      `hay ${n}`,
    )
    const markers = findPendingMarkers((state[lang].about ?? {}) as Json)
    add(
      `about-page sin marcadores de ranura en ${lang}`,
      markers.length === 0,
      markers.length === 0 ? 'ok' : `marcador en ${markers.join(', ')}`,
    )
  }
  return out
}

// ---------------------------------------------------------------------------
// mergeGroupAllowShrink (lo usa 56-12 solo con bandera explicita y aprobacion de Juan)
// ---------------------------------------------------------------------------

export type DiscardedRow = { path: string; id: unknown }

/**
 * Igual que mergeGroup de la 54, pero cuando `current` tiene mas filas que
 * `desired` recorta el arreglo y devuelve las filas descartadas (ruta e id) en
 * lugar de lanzar. Quien lo llama debe mostrar esa lista a Juan antes de
 * escribir: recortar filas es una operacion destructiva.
 */
export function mergeGroupAllowShrink(
  current: Json,
  desired: Json,
  path = '',
): { merged: Json; discarded: DiscardedRow[] } {
  const discarded: DiscardedRow[] = []

  const walk = (cur: Json, des: Json, p: string): Json => {
    if (Array.isArray(des)) {
      const arr = Array.isArray(cur) ? cur : []
      for (let i = des.length; i < arr.length; i++) {
        const row = arr[i]
        discarded.push({ path: `${p || '(raiz)'}[${i}]`, id: isPlainObject(row) ? (row.id ?? null) : null })
      }
      return des.map((d, i) => walk(arr[i] as Json, d, `${p}[${i}]`))
    }
    if (isPlainObject(des)) {
      const base = isPlainObject(cur) ? cur : {}
      const out: Record<string, Json> = { ...base }
      for (const key of Object.keys(des)) {
        out[key] = walk(base[key], des[key], p ? `${p}.${key}` : key)
      }
      return out
    }
    return des
  }

  return { merged: walk(current, desired, path), discarded }
}

/** Reexporta mergeGroup con el nombre original para los tests de contraste. */
export const mergeGroupStrict = mergeGroup

/** Este modulo no registra decisiones; el arreglo vacio cumple la convencion de 56-gate. */
export const DECISIONS: Decision[] = []
