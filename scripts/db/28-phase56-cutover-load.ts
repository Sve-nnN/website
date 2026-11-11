/**
 * Fase 56 (plan 56-14): cargador del corte.
 *
 * SOLO PARA EL CORTE (fase 57). No correr con --apply antes del corte: master ya lee estos
 * datos (D-02) y el admin de master no conoce el campo lessons (D-03). Un guardado en ese
 * admin podria borrar las lecciones, y un cambio cargado antes cambia produccion al instante.
 * En la fase 56 este script solo se corre en seco (sin --apply), por Juan, contra la base.
 *
 * Que carga: cada item de CUTOVER_ITEMS (56-cutover-data.ts) que tenga aplicador.
 *   lessons       las lecciones de los 7 casos (ES, relectura de los id de fila, EN)
 *   media-alt     el alt de las 6 capturas (solo el campo alt, ES y EN)
 *   legal-date    effectiveDate del global legal-pages (un unico valor, D-09)
 *   websites-row  filas de Websites (stack, highlights, retos)
 *   author        la experiencia del autor
 *   testimonial   la cita del testimonio
 *   cta-master    el boton del header (los demas CTA viajan con el codigo o se cargan a mano)
 * Los items heading-master y el resto de cta-master NO los escribe este cargador: viven en el
 * codigo o dentro de bloques de docs pages sin localizador por id. Se listan como MANUAL.
 * post-translation solo se acepta si la decision elegida no es traducir; traducir el post
 * entero se planea aparte y aqui aborta. Un kind desconocido aborta.
 *
 * Banderas:
 *   (sin banderas)         DRY-RUN: lee, imprime respaldo, diff y razon. No escribe nada.
 *   --apply                escribe; exige --db-checked
 *   --db-checked           Juan confirmo con 04-which-database.ts contra que base apunta
 *   --only <lista>         solo kinds o ids (coincidencia exacta o por prefijo del id)
 *   --print-current        imprime en JSON el valor actual de cada item (respaldo, solo copy
 *                          publico, nunca credenciales). El JSON va a stdout, los avisos a stderr
 *   --overwrite-lessons    permite pisar lecciones existentes que difieran de las aprobadas
 *   --allow-shrink-rows    permite recortar filas de un arreglo (por ejemplo el stack de
 *                          Arianna pasa de 4 a 2 tags). Es destructivo: Juan lo aprueba por nombre
 *
 * Reglas de estado (D-01):
 *   - un item pendiente, o propuesto con gate aprobado, se NIEGA. Con --apply, si entre los items
 *     elegidos hay uno negado el script aborta antes de la primera escritura (usa --only para
 *     cargar un subconjunto).
 *   - un item propuesto con gate propuesto se carga y se anota en el aviso final para el handoff.
 *
 * Seguridad de la base (CLAUDE.md, Database Safety; incidente 2026-08-17):
 *   - Imprime host, puerto y nombre (nunca usuario ni clave) y rechaza toda base que no sea la
 *     de produccion via tunel o shared-postgres, ANTES de importar Payload.
 *   - La base sale solo de las variables del shell. Nunca se carga el .env del repo.
 *
 * Trampas de scripts contra Payload (memoria del proyecto):
 *   - fallbackLocale false cuando la lectura decide si escribir.
 *   - todo update de coleccion lleva draft false y el status de publicacion no cambia.
 *   - el grupo se envia COMPLETO (leido y fusionado), nunca parcial.
 *   - un arreglo con subcampos localizados comparte los id de fila entre idiomas: primero ES,
 *     se relee para obtener los id y recien entonces EN con esos id. Sin ellos Payload crea
 *     filas nuevas y se pierde el ES.
 *   - cada escritura vuelve a leer y compara.
 *   - las escrituras por script no invalidan el tag de unstable_cache: el efecto sale tras el TTL
 *     de 60 s. Se verifica contra el HTML servido, no contra el OK de este script.
 *   - no usa ninguna operacion de borrado de la Local API.
 *
 *   DATABASE_URI=<tunel> PAYLOAD_SECRET=migrate-only NEXT_PUBLIC_SERVER_URL=https://juan-tech.com \
 *     node_modules/.bin/tsx scripts/db/28-phase56-cutover-load.ts [banderas]
 */
import { pathToFileURL } from 'node:url'

import { CASE_LESSONS, CASE_SLUGS } from './data/56-case-lessons'
import {
  CUTOVER_ITEMS,
  CUT_KINDS,
  isEmptyValue,
  show,
  type CutItem,
  type CutKind,
  type CutValue,
} from './data/56-cutover-data'
import { LEGAL_EFFECTIVE_DATE } from './data/56-legal-copy'
import { assertSafeTarget, mergeGroupAllowShrink, safeTarget } from './data/56-seed-lib'

export type Locale = 'es' | 'en'

export type Opts = {
  apply: boolean
  dbChecked: boolean
  only: string[]
  printCurrent: boolean
  overwriteLessons: boolean
  allowShrinkRows: boolean
}

export type Io = { out: (line: string) => void; err: (line: string) => void }

/** Dependencias inyectables: la autoprueba pasa items, fecha legal y reloj propios. */
export type Deps = {
  items?: CutItem[]
  legalDate?: string
  now?: () => Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayloadLike = any
type Rec = Record<string, unknown>

// ---------------------------------------------------------------------------
// Utilidades puras
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const blank = (v: unknown): boolean => v === undefined || v === null || v === ''
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Cadena vacia y ausente cuentan igual; una fecha ISO se compara por dia. */
function normScalar(v: unknown): unknown {
  if (blank(v)) return undefined
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v)) return v.slice(0, 10)
  return v
}

/**
 * Campos de `desired` que difieren de `current`. Solo mira las claves que trae `desired`
 * (los id de fila y los demas campos del documento no cuentan).
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
  if (isObj(desired)) {
    if (!isObj(current)) return [path || '(raiz)']
    const out: string[] = []
    for (const key of Object.keys(desired)) out.push(...diffLenient(current[key], desired[key], path ? `${path}.${key}` : key))
    return out
  }
  return normScalar(current) === normScalar(desired) ? [] : [path || '(raiz)']
}

/** Texto corto de un valor para el dry-run. El respaldo completo sale con --print-current. */
function brief(v: unknown, max = 360): string {
  const s = JSON.stringify(v) ?? 'undefined'
  return s.length > max ? `${s.slice(0, max)} ...(${s.length} caracteres; completo con --print-current)` : s
}

export function parseArgs(argv: string[]): Opts {
  const has = (flag: string): boolean => argv.includes(flag)
  const only: string[] = []
  const at = argv.indexOf('--only')
  if (at >= 0) {
    for (const token of argv.slice(at + 1)) {
      if (token.startsWith('--')) break
      only.push(...token.split(',').filter(Boolean))
    }
    if (only.length === 0) throw new Error('--only necesita al menos un kind o un id de item')
  }
  return {
    apply: has('--apply'),
    dbChecked: has('--db-checked'),
    only,
    printCurrent: has('--print-current'),
    overwriteLessons: has('--overwrite-lessons'),
    allowShrinkRows: has('--allow-shrink-rows'),
  }
}

// ---------------------------------------------------------------------------
// Elegibilidad por estado (D-01)
// ---------------------------------------------------------------------------

export type StateKind = 'cargar' | 'pendiente' | 'rechazado' | 'sin-carga' | 'manual'
export type Eligibility = { state: StateKind; annotate: boolean; reason: string }

/** Kinds con aplicador. Los demas se listan como MANUAL. */
export function hasApplier(item: CutItem): boolean {
  switch (item.kind) {
    case 'lessons':
      return APPLIERS.lessons
    case 'media-alt':
      return APPLIERS['media-alt']
    case 'legal-date':
      return APPLIERS['legal-date']
    case 'websites-row':
      return APPLIERS['websites-row'] && /^websites:[a-z0-9-]+#/.test(item.target)
    case 'author':
      return APPLIERS.author && /^authors:[a-z0-9-]+#experience/.test(item.target)
    case 'testimonial':
      return APPLIERS.testimonial && /^testimonials:\d+/.test(item.target)
    case 'cta-master':
      return APPLIERS['cta-master'] && item.id === HEADER_CTA_ID
    default:
      return false
  }
}

/** Interruptor por aplicador. La tarea 2 los enciende al implementarlos. */
const APPLIERS = {
  lessons: true,
  'media-alt': false,
  'legal-date': false,
  'websites-row': false,
  author: false,
  testimonial: false,
  'cta-master': false,
}

const HEADER_CTA_ID = 'CUT-cta-master-header-cta'

const DAY_MS = 86_400_000

/** Dias de diferencia entre YYYY-MM-DD y hoy (UTC). NaN si el formato no es valido. */
function daysFromToday(date: string, now: Date): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return Number.NaN
  const a = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((a - b) / DAY_MS)
}

/**
 * Estado de carga de un item. Lanza si el item no se puede ni listar: kind desconocido, o un
 * post-translation con la decision de traducir (se planea aparte).
 */
export function eligibility(item: CutItem, ctx: { legalDate: string; now: Date }): Eligibility {
  if (!(CUT_KINDS as readonly string[]).includes(item.kind)) {
    throw new Error(`${item.id}: kind desconocido "${String(item.kind)}". Este cargador no lo conoce.`)
  }
  if (item.kind === 'post-translation') {
    if (item.chosen === 'traducir') {
      throw new Error(
        `${item.id}: la decision es traducir el post entero. Eso se planea aparte con /gsd-plan-phase 56 --gaps y este cargador no lo hace.`,
      )
    }
    return { state: 'sin-carga', annotate: false, reason: `sin carga: la decision elegida es ${item.chosen ?? 'aviso'} y no cambia contenido` }
  }
  if (item.kind === 'legal-date') {
    if (ctx.legalDate === '') {
      return { state: 'pendiente', annotate: false, reason: 'LEGAL_EFFECTIVE_DATE esta vacia: se fija el dia del corte (D-09)' }
    }
    const days = daysFromToday(ctx.legalDate, ctx.now)
    if (Number.isNaN(days)) {
      return { state: 'rechazado', annotate: false, reason: `LEGAL_EFFECTIVE_DATE "${ctx.legalDate}" no tiene la forma AAAA-MM-DD` }
    }
    if (Math.abs(days) > 1) {
      return { state: 'rechazado', annotate: false, reason: `LEGAL_EFFECTIVE_DATE ${ctx.legalDate} esta a ${Math.abs(days)} dias de hoy: debe ser el dia del corte (D-09)` }
    }
    return { state: 'cargar', annotate: false, reason: `fecha efectiva ${ctx.legalDate}, a un dia o menos de hoy` }
  }
  if (item.status === 'pendiente') {
    return { state: 'pendiente', annotate: false, reason: 'pendiente: Juan debe responder antes del corte' }
  }
  if (item.status === 'propuesto' && item.gate === 'aprobado') {
    return { state: 'rechazado', annotate: false, reason: 'propuesto, pero el gate exige aprobado: Juan debe aprobarlo antes de cargarlo' }
  }
  if (isEmptyValue(item.desired)) {
    return { state: 'sin-carga', annotate: false, reason: `sin desired: nada que cargar (elegido: ${item.chosen ?? 'actual'})` }
  }
  if (!hasApplier(item)) {
    return {
      state: 'manual',
      annotate: item.status === 'propuesto',
      reason: 'este cargador no lo escribe: vive en el codigo o en un bloque de docs pages. Viaja con el merge o se carga a mano segun el handoff',
    }
  }
  return {
    state: 'cargar',
    annotate: item.status === 'propuesto',
    reason: item.status === 'propuesto' ? 'propuesto con gate propuesto: se carga y se anota en el handoff' : 'aprobado',
  }
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

type LessonDesired = { es: { title: string; body: string }; en: { title: string; body: string } }

type Task = {
  key: string
  kind: CutKind
  items: CutItem[]
  elig: Eligibility
  /** Solo lessons: slug del caso y lecciones en orden. */
  slug?: string
  lessons?: LessonDesired[]
}

const KIND_ORDER: Record<CutKind, number> = {
  lessons: 1,
  'media-alt': 2,
  'websites-row': 3,
  author: 4,
  testimonial: 5,
  'cta-master': 6,
  'heading-master': 7,
  'post-translation': 8,
  'legal-date': 9,
}

const WORST: StateKind[] = ['pendiente', 'rechazado', 'sin-carga', 'manual']

function lessonDesired(item: CutItem): LessonDesired {
  const d = item.desired as { es?: { title?: string; body?: string }; en?: { title?: string; body?: string } } | undefined
  const ok = (x?: { title?: string; body?: string }): x is { title: string; body: string } =>
    typeof x?.title === 'string' && typeof x?.body === 'string' && x.title !== '' && x.body !== ''
  if (!d || !ok(d.es) || !ok(d.en)) {
    throw new Error(`${item.id}: la leccion no trae title y body en ES y EN`)
  }
  return { es: d.es, en: d.en }
}

/** Agrupa las lecciones por caso: un caso se carga completo o no se carga. */
function buildTasks(selected: CutItem[], eligs: Map<string, Eligibility>): Task[] {
  const tasks: Task[] = []
  const bySlug = new Map<string, { n: number; item: CutItem }[]>()
  for (const item of selected) {
    if (item.kind === 'lessons') {
      const m = /^case-studies:([a-z0-9-]+)#lessons\[(\d+)\]$/.exec(item.target)
      if (!m) throw new Error(`${item.id}: el target "${item.target}" no tiene la forma case-studies:<slug>#lessons[n]`)
      const list = bySlug.get(m[1]) ?? []
      list.push({ n: Number(m[2]), item })
      bySlug.set(m[1], list)
      continue
    }
    tasks.push({ key: item.id, kind: item.kind, items: [item], elig: eligs.get(item.id) as Eligibility })
  }
  for (const [slug, list] of bySlug) {
    if (!CASE_SLUGS.includes(slug)) throw new Error(`lecciones del caso "${slug}": ese slug no esta en 56-case-lessons.ts`)
    const source = CASE_LESSONS[slug]
    list.sort((a, b) => a.n - b.n)
    if (list.length !== source.length || list.some((x, i) => x.n !== i)) {
      throw new Error(
        `lecciones del caso "${slug}": se eligieron ${list.length} de ${source.length}. Un caso se carga completo (usa --only con el prefijo CUT-lessons-${slug}).`,
      )
    }
    const lessons = list.map((x) => lessonDesired(x.item))
    lessons.forEach((l, i) => {
      if (l.es.title !== source[i].es.title || l.es.body !== source[i].es.body || l.en.title !== source[i].en.title || l.en.body !== source[i].en.body) {
        throw new Error(`lecciones del caso "${slug}", leccion ${i + 1}: el texto de CUTOVER_ITEMS no coincide con 56-case-lessons.ts`)
      }
    })
    const states = list.map((x) => eligs.get(x.item.id) as Eligibility)
    const worst = WORST.map((s) => states.find((e) => e.state === s)).find(Boolean)
    const elig: Eligibility = worst ?? {
      state: 'cargar',
      annotate: states.some((e) => e.annotate),
      reason: states.some((e) => e.annotate) ? 'propuesto con gate propuesto: se carga y se anota en el handoff' : 'aprobado',
    }
    tasks.push({ key: `lessons:${slug}`, kind: 'lessons', items: list.map((x) => x.item), elig, slug, lessons })
  }
  return tasks.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}

// ---------------------------------------------------------------------------
// Plan (solo lectura) y escritura
// ---------------------------------------------------------------------------

type Ctx = { opts: Opts; log: (line: string) => void; legalDate: string }

type Plan = {
  /** Valor vivo en la base: el respaldo. */
  current: unknown
  /** Campos que difieren del deseado. Vacio si ya esta igual. */
  diff: string[]
  /** Lineas extra para el dry-run (filas que se descartarian, etc.). */
  notes: string[]
  /** Razones por las que el cargador se negaria a escribir. */
  blockers: string[]
  /** Ausente si no hay nada que escribir. Devuelve true si la relectura coincide. */
  write?: () => Promise<boolean>
}

async function findBySlug(payload: PayloadLike, collection: string, slug: string): Promise<Rec> {
  const res = await payload.find({
    collection: collection,
    where: { slug: { equals: slug } },
    limit: 2,
    depth: 0,
    locale: 'es',
    fallbackLocale: false,
  })
  const docs = (res?.docs ?? []) as Rec[]
  if (docs.length === 0) throw new Error(`no existe ${collection} con slug "${slug}"`)
  if (docs.length > 1) throw new Error(`hay ${docs.length} documentos de ${collection} con slug "${slug}": resuelvelo a mano`)
  return docs[0]
}

async function readById(payload: PayloadLike, collection: string, id: unknown, locale: Locale): Promise<Rec> {
  return (await payload.findByID({ collection: collection, id: id, locale: locale, fallbackLocale: false, depth: 0 })) as Rec
}

/** Todo update de coleccion lleva draft false: sin el, un doc publicado pasa a borrador. */
async function updateDoc(payload: PayloadLike, collection: string, id: unknown, locale: Locale, data: Rec): Promise<void> {
  await payload.update({ collection: collection, id: id, locale: locale, data: data, draft: false, fallbackLocale: false, depth: 0 })
}

type LessonRow = { id?: unknown; title: string; body: string }

function lessonRows(doc: Rec): LessonRow[] {
  const rows = Array.isArray(doc.lessons) ? (doc.lessons as Rec[]) : []
  return rows.map((r) => ({ id: r.id, title: str(r.title), body: str(r.body) }))
}

async function planLessons(payload: PayloadLike, task: Task, ctx: Ctx): Promise<Plan> {
  const slug = task.slug as string
  const desired = task.lessons as LessonDesired[]
  const docEs = await findBySlug(payload, 'case-studies', slug)
  const id = docEs.id
  const docEn = await readById(payload, 'case-studies', id, 'en')
  const status = docEs._status
  const rowsEs = lessonRows(docEs)
  const rowsEn = lessonRows(docEn)
  const current = { status, es: rowsEs, en: rowsEn }

  const isEmpty = [...rowsEs, ...rowsEn].every((r) => r.title === '' && r.body === '')
  const same =
    rowsEs.length === desired.length &&
    rowsEn.length === desired.length &&
    desired.every((d, i) => rowsEs[i].title === d.es.title && rowsEs[i].body === d.es.body && rowsEn[i].title === d.en.title && rowsEn[i].body === d.en.body)

  const diff: string[] = same ? [] : isEmpty ? ['sin lecciones en la base'] : desired.map((_, i) => `lessons[${i}]`)
  const notes: string[] = []
  const blockers: string[] = []
  if (status !== 'published') blockers.push(`el caso no esta publicado (status ${String(status)}): no se toca un caso que no sirve master`)
  if (!same && !isEmpty && !ctx.opts.overwriteLessons) {
    blockers.push('el caso ya tiene lecciones distintas: revisa el respaldo y vuelve con --overwrite-lessons')
  }
  if (!same && !isEmpty && rowsEs.length > desired.length) {
    notes.push(`DESCARTA ${rowsEs.length - desired.length} fila(s) de lessons que sobran respecto de las ${desired.length} aprobadas`)
  }

  const write = same
    ? undefined
    : async (): Promise<boolean> => {
        // 1. ES, conservando los id de las filas que ya existen.
        const esRows = desired.map((d, i) => ({ ...(rowsEs[i]?.id !== undefined ? { id: rowsEs[i].id } : {}), title: d.es.title, body: d.es.body }))
        await updateDoc(payload, 'case-studies', id, 'es', { lessons: esRows })
        // 2. Releer ES para obtener los id de fila.
        const afterEs = lessonRows(await readById(payload, 'case-studies', id, 'es'))
        if (afterEs.length !== desired.length || afterEs.some((r) => r.id === undefined || r.id === null)) {
          throw new Error(`tras escribir ES la relectura trae ${afterEs.length} filas y se esperaban ${desired.length} con id: no se escribe EN`)
        }
        // 3. EN con esos id. Sin ellos Payload crea filas nuevas y se pierde el ES.
        const enRows = desired.map((d, i) => ({ id: afterEs[i].id, title: d.en.title, body: d.en.body }))
        await updateDoc(payload, 'case-studies', id, 'en', { lessons: enRows })
        // 4. Releer ES y EN y comparar; el status de publicacion no cambia.
        const finalEs = await readById(payload, 'case-studies', id, 'es')
        const finalEn = await readById(payload, 'case-studies', id, 'en')
        const re = lessonRows(finalEs)
        const rn = lessonRows(finalEn)
        const okRows =
          re.length === desired.length &&
          rn.length === desired.length &&
          desired.every((d, i) => re[i].title === d.es.title && re[i].body === d.es.body && rn[i].title === d.en.title && rn[i].body === d.en.body)
        const okStatus = finalEs._status === status
        ctx.log(
          okRows && okStatus
            ? `  OK   lessons ${slug}: releido en ES y EN, ${desired.length} filas, status ${String(status)}`
            : `  FALLA lessons ${slug}: filas ${re.length}/${rn.length} de ${desired.length}, status ${String(finalEs._status)} (antes ${String(status)})`,
        )
        return okRows && okStatus
      }
  return { current, diff, notes, blockers, write }
}

// ---------------------------------------------------------------------------
// Despacho
// ---------------------------------------------------------------------------

async function planTask(payload: PayloadLike, task: Task, ctx: Ctx): Promise<Plan> {
  switch (task.kind) {
    case 'lessons':
      return planLessons(payload, task, ctx)
    default:
      throw new Error(`${task.key}: sin aplicador para el kind ${task.kind}`)
  }
}

const STATE_LABEL: Record<StateKind, string> = {
  cargar: 'CARGAR',
  pendiente: 'PENDIENTE',
  rechazado: 'SE NIEGA',
  'sin-carga': 'SIN CARGA',
  manual: 'MANUAL',
}

/** ¿Se calcula el diff de este item aunque no se vaya a cargar? Solo si tiene aplicador y algo que comparar. */
function wantsPlan(task: Task): boolean {
  if (task.kind === 'lessons' || task.kind === 'legal-date') return true
  if (task.elig.state === 'manual' || task.elig.state === 'sin-carga') return false
  return task.items.every((i) => hasApplier(i) && !isEmptyValue(i.desired))
}

// ---------------------------------------------------------------------------
// Ejecucion (inyectable: la autoprueba usa una Local API falsa en memoria)
// ---------------------------------------------------------------------------

/**
 * Devuelve el codigo de salida. `loadPayload` solo se llama despues de que la guardia de base y
 * las comprobaciones puras pasan: con una base de Neon nunca se importa Payload.
 */
export async function run(
  opts: Opts,
  env: { DATABASE_URI?: string },
  loadPayload: () => Promise<PayloadLike>,
  io: Io,
  deps: Deps = {},
): Promise<number> {
  const log = opts.printCurrent ? io.err : io.out
  const items = deps.items ?? CUTOVER_ITEMS
  const legalDate = deps.legalDate ?? LEGAL_EFFECTIVE_DATE
  const now = (deps.now ?? (() => new Date()))()

  log(`=== ${opts.printCurrent ? 'RESPALDO (solo lectura)' : opts.apply ? 'APLICANDO EL CORTE' : 'DRY-RUN (nada se escribe)'} ===`)
  log('  SOLO PARA EL CORTE (fase 57): --apply no se corre antes de que 56-gate --gate pase')
  log(`  base: ${safeTarget(env.DATABASE_URI)}`)

  if (opts.apply && opts.printCurrent) {
    log('ABORT: --print-current es de solo lectura y no se combina con --apply.')
    return 1
  }
  try {
    assertSafeTarget(env.DATABASE_URI, opts.apply, opts.dbChecked)
  } catch (err) {
    log(`ABORT: ${(err as Error).message}`)
    return 1
  }

  // Comprobaciones puras ANTES de abrir Payload.
  const selected = items.filter((i) => opts.only.length === 0 || opts.only.some((t) => i.kind === t || i.id === t || i.id.startsWith(t)))
  if (selected.length === 0) {
    log(`ABORT: --only ${opts.only.join(' ')} no coincide con ningun item.`)
    return 1
  }
  const eligs = new Map<string, Eligibility>()
  let tasks: Task[]
  try {
    for (const item of selected) eligs.set(item.id, eligibility(item, { legalDate, now }))
    tasks = buildTasks(selected, eligs)
  } catch (err) {
    log(`ABORT: ${(err as Error).message}`)
    return 1
  }
  log(`  items elegidos: ${selected.length} en ${tasks.length} tarea(s)`)

  // Import dinamico: nada de Payload se carga si la guardia de base aborta.
  let payload: PayloadLike
  try {
    payload = await loadPayload()
  } catch (err) {
    log(`ABORT abriendo Payload: ${(err as Error).message}`)
    return 1
  }
  const ctx: Ctx = { opts, log, legalDate }

  // Plan completo (solo lectura) ANTES de la primera escritura.
  const plans = new Map<string, Plan>()
  const readErrors: string[] = []
  for (const task of tasks) {
    if (!opts.printCurrent && !wantsPlan(task)) continue
    if (opts.printCurrent && !hasApplier(task.items[0]) && task.kind !== 'lessons') continue
    try {
      plans.set(task.key, await planTask(payload, task, ctx))
    } catch (err) {
      readErrors.push(`${task.key}: ${(err as Error).message}`)
    }
  }

  if (opts.printCurrent) {
    const snapshot: Record<string, unknown> = {}
    for (const task of tasks) {
      const plan = plans.get(task.key)
      snapshot[task.key] = plan ? plan.current : { fuente: 'registro de 56-cutover-data.ts (sin aplicador)', current: task.items.length === 1 ? (task.items[0].current as CutValue) : null }
    }
    for (const e of readErrors) log(`ERROR leyendo ${e}`)
    io.out(JSON.stringify(snapshot, null, 2))
    log('Respaldo impreso. Guardalo fuera del repo antes de aplicar.')
    return readErrors.length === 0 ? 0 : 1
  }

  // Informe por tarea.
  for (const task of tasks) {
    const first = task.items[0]
    log(`\n[${STATE_LABEL[task.elig.state]}] ${task.key}  estado=${first.status} gate=${first.gate}`)
    log(`  razon: ${task.elig.reason}`)
    const plan = plans.get(task.key)
    if (!plan) {
      const err = readErrors.find((e) => e.startsWith(`${task.key}:`))
      if (err) log(`  ERROR de lectura: ${err.slice(task.key.length + 2)}`)
      else log(`  respaldo registrado: ${brief(task.items.length === 1 ? show(first.current as CutValue) : `${task.items.length} items`)}`)
      continue
    }
    log(`  respaldo (valor actual en la base): ${brief(plan.current)}`)
    log(plan.diff.length === 0 ? '  diff: igual, nada que escribir' : `  diff: ${plan.diff.length} campo(s) -> ${plan.diff.slice(0, 8).join(', ')}${plan.diff.length > 8 ? ' ...' : ''}`)
    for (const n of plan.notes) log(`  ${n}`)
    for (const b of plan.blockers) log(`  SE NEGARIA: ${b}`)
  }

  const count = (s: StateKind): number => tasks.filter((t) => t.elig.state === s).length
  const loadable = tasks.filter((t) => t.elig.state === 'cargar')
  log(
    `\nRESUMEN: ${tasks.length} tarea(s): ${loadable.length} cargable(s), ${count('rechazado')} negada(s) por propuesto con gate aprobado, ${count('pendiente')} pendiente(s), ${count('manual')} manual(es), ${count('sin-carga')} sin carga`,
  )
  if (loadable.length === 0) log('Ningun item aprobado para cargar: no se escribe nada.')
  const annotated = loadable.filter((t) => t.elig.annotate)
  if (annotated.length > 0) {
    log(`AVISO para el handoff: se cargarian items propuestos con gate propuesto: ${annotated.map((t) => t.key).join(', ')}`)
  }
  for (const e of readErrors) log(`ERROR leyendo ${e}`)

  if (!opts.apply) {
    log('\nDRY-RUN: no se escribio nada. La carga real es del corte (fase 57): --apply --db-checked tras 56-gate --gate en PASS.')
    return readErrors.length === 0 ? 0 : 1
  }

  // --apply: todo o nada antes de la primera escritura.
  const refused = tasks.filter((t) => t.elig.state === 'rechazado' || t.elig.state === 'pendiente')
  if (refused.length > 0) {
    log(`ABORT: hay item(s) sin aprobar entre los elegidos (${refused.map((t) => t.key).join(', ')}). No se escribio nada. Usa --only para cargar un subconjunto aprobado.`)
    return 1
  }
  if (readErrors.length > 0) {
    log('ABORT: fallo la lectura previa de algun item. No se escribio nada.')
    return 1
  }
  const blocked = loadable.filter((t) => (plans.get(t.key)?.blockers.length ?? 0) > 0)
  if (blocked.length > 0) {
    for (const t of blocked) for (const b of plans.get(t.key)?.blockers ?? []) log(`ABORT ${t.key}: ${b}`)
    log('No se escribio nada.')
    return 1
  }
  if (loadable.length === 0) return 0

  let allOk = true
  try {
    for (const task of loadable) {
      const plan = plans.get(task.key) as Plan
      log(`\nEscribiendo ${task.key}`)
      if (!plan.write) {
        log('  nada que escribir (idempotente)')
        continue
      }
      log(`  respaldo antes de escribir: ${brief(plan.current, 2000)}`)
      allOk = (await plan.write()) && allOk
    }
  } catch (err) {
    log(`ABORT escribiendo: ${(err as Error).message}\n  Lo escrito antes de este error queda aplicado. Revisa con el respaldo impreso arriba.`)
    return 1
  }

  log('\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. Verifica contra el HTML servido, no contra este OK:')
  if (loadable.some((t) => t.kind === 'lessons')) log('  node scripts/verify/56-cases-lessons-live.mjs --expect-loaded')
  if (loadable.some((t) => t.kind === 'legal-date')) log('  node scripts/verify/56-legal-live.mjs --expect-date')
  return allOk ? 0 : 1
}

async function main(): Promise<void> {
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
