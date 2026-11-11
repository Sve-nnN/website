/**
 * Autoprueba de los datos del corte de la fase 56 (plan 56-13, D-02, T-56-46, T-56-47, T-56-48).
 *
 *   node_modules/.bin/tsx scripts/verify/56-cutover-selftest.ts          offline: forma, origenes y gate
 *   node_modules/.bin/tsx scripts/verify/56-cutover-selftest.ts --live   ademas, solo GET a produccion: el
 *                                                                        respaldo sigue igual que lo que sirve
 *
 * Sin banderas no usa red, no abre ninguna base y no escribe archivos. Imprime PASS o FAIL
 * por caso y sale con 1 ante cualquier FAIL.
 *
 * Reglas de forma (itemProblems), probadas primero con fixtures buenos y malos:
 *   - id con la forma CUT-<prefijo del kind>-<nombre>, unico, kind conocido;
 *   - target presente, loadAt siempre `corte`;
 *   - current no vacio (es el respaldo) y sin marcador de ranura;
 *   - un item aprobado trae desired;
 *   - ni desired ni los textos de revision traen raya larga ni media. `current` queda exento: es el
 *     valor vivo copiado tal cual y las capturas de Websites sirven hoy un alt con raya larga.
 */
import { CAPTURE_ALTS } from '../db/data/56-alt-texts'
import * as loader from '../db/28-phase56-cutover-load'
import { CASE_SLUGS, flatLessons, lessonId } from '../db/data/56-case-lessons'
import { CTA_MAP } from '../db/data/56-cta-map'
import {
  CUTOVER_ITEMS,
  CUT_ID_PREFIX,
  CUT_KINDS,
  DECISIONS,
  LIVE_AUTHOR_EXPERIENCE,
  LIVE_TESTIMONIAL,
  LIVE_WEBSITES,
  OWNED_ITEMS,
  PROD_API,
  bilingual,
  isEmptyValue,
  show,
  type CutItem,
  type CutValue,
} from '../db/data/56-cutover-data'
import { validateDecisions } from '../db/data/56-content-decisions'
import { LEGAL_EFFECTIVE_DATE } from '../db/data/56-legal-copy'
import { discoverDecisions } from './56-gate'

const EM = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const OPEN = '{' + '{'

let bad = 0
function expect(label: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`PASS ${label}`)
  else {
    bad += 1
    console.log(`FAIL ${label}${detail ? `: ${detail}` : ''}`)
  }
}

/** Todas las cadenas de un valor. */
function strings(v: CutValue | undefined): string[] {
  if (v === undefined || v === null) return []
  if (typeof v === 'string') return [v]
  if (typeof v === 'number' || typeof v === 'boolean') return []
  if (Array.isArray(v)) return v.flatMap((x) => strings(x))
  return Object.values(v).flatMap((x) => strings(x))
}

const hasDash = (s: string): boolean => s.includes(EM) || s.includes(EN_DASH)

/** Texto de revision de un item: todo salvo `current`. */
function reviewStrings(item: CutItem): string[] {
  return [
    item.label,
    item.target,
    item.source,
    item.note ?? '',
    ...strings(item.desired),
    ...(item.evidence ?? []),
    ...Object.values(item.options ?? {}).flatMap((o) => [o.es ?? '', o.en ?? '', o.note ?? '']),
  ]
}

/** Problemas de forma de un item. Vacio si cumple. */
export function itemProblems(item: CutItem): string[] {
  const out: string[] = []
  const p = (why: string) => out.push(`${item.id || '(sin id)'}: ${why}`)
  if (!/^CUT-[a-z-]+-[A-Za-z0-9_.-]+$/.test(item.id ?? '')) p('el id no tiene la forma CUT-<kind>-<nombre>')
  else if (!item.id.startsWith(`CUT-${CUT_ID_PREFIX[item.kind]}-`)) p(`el id no empieza por CUT-${CUT_ID_PREFIX[item.kind]}-`)
  if (!CUT_KINDS.includes(item.kind)) p(`kind desconocido "${String(item.kind)}"`)
  if (!item.target || !item.target.trim()) p('falta el target')
  if (item.loadAt !== 'corte') p(`loadAt es "${String(item.loadAt)}" y debe ser corte (D-02)`)
  if (isEmptyValue(item.current)) p('current esta vacio: no hay respaldo del valor actual (T-56-46)')
  if (!item.capturedAt) p('falta capturedAt')
  if (item.status === 'aprobado' && isEmptyValue(item.desired)) p('esta aprobado y no tiene desired')
  if (strings(item.current).some((s) => s.includes(OPEN))) p('current trae un marcador de ranura')
  for (const s of reviewStrings(item)) {
    if (hasDash(s)) p(`trae raya larga o media: "${s.slice(0, 60)}"`)
    if (s.includes(OPEN)) p(`trae un marcador de ranura: "${s.slice(0, 60)}"`)
  }
  if (item.chosen !== undefined && item.options && !(item.chosen in item.options) && !['actual', 'propuesto'].includes(item.chosen)) {
    p(`chosen "${item.chosen}" no esta en options`)
  }
  return out
}

// ---------------------------------------------------------------------------
// Fixtures de las reglas
// ---------------------------------------------------------------------------

const good: CutItem = {
  id: 'CUT-testimonial-prueba',
  kind: 'testimonial',
  label: 'Prueba',
  target: 'testimonials:1',
  loadAt: 'corte',
  current: { es: 'uno', en: 'one' },
  status: 'propuesto',
  gate: 'propuesto',
  source: 'fixture',
  capturedAt: '2026-11-10',
}

function rules(): void {
  expect('fixture bueno no tiene problemas', itemProblems(good).length === 0, itemProblems(good).join(' | '))
  expect('un item sin respaldo falla', itemProblems({ ...good, current: '' }).some((x) => /current esta vacio/.test(x)))
  expect('un respaldo con arreglo vacio falla', itemProblems({ ...good, current: [] }).some((x) => /current esta vacio/.test(x)))
  expect('un item aprobado sin desired falla', itemProblems({ ...good, status: 'aprobado' }).some((x) => /no tiene desired/.test(x)))
  expect('un item aprobado con desired pasa', itemProblems({ ...good, status: 'aprobado', desired: 'x' }).length === 0)
  expect('loadAt distinto de corte falla', itemProblems({ ...good, loadAt: 'ahora' as unknown as 'corte' }).some((x) => /loadAt/.test(x)))
  expect('un desired con raya larga falla', itemProblems({ ...good, desired: `a ${EM} b` }).some((x) => /raya/.test(x)))
  expect('un desired con raya media falla', itemProblems({ ...good, desired: { es: `a ${EN_DASH} b` } }).some((x) => /raya/.test(x)))
  expect('un marcador de ranura en desired falla', itemProblems({ ...good, desired: `${OPEN}pendiente}}` }).some((x) => /marcador/.test(x)))
  expect('un marcador de ranura en current falla', itemProblems({ ...good, current: `${OPEN}pendiente}}` }).some((x) => /marcador/.test(x)))
  expect('current con raya larga pasa (respaldo literal)', itemProblems({ ...good, current: `Apturio ${EM} captura` }).length === 0)
  expect('un id mal formado falla', itemProblems({ ...good, id: 'cut-x' }).length > 0)
  expect('un id con otro kind falla', itemProblems({ ...good, id: 'CUT-author-x' }).some((x) => /no empieza/.test(x)))
  expect('bilingual separa es y en', bilingual({ es: 'a', en: 'b' }).en === 'b' && bilingual('z').es === 'z')
  expect('show escribe objetos y arreglos', show({ a: ['x', 'y'] }) === 'a: x; y')
}

// ---------------------------------------------------------------------------
// Datos reales
// ---------------------------------------------------------------------------

async function realData(): Promise<void> {
  const problems = CUTOVER_ITEMS.flatMap(itemProblems)
  expect(`los ${CUTOVER_ITEMS.length} items cumplen las reglas de forma`, problems.length === 0, problems.join(' | '))

  const ids = CUTOVER_ITEMS.map((i) => i.id)
  expect('ids de items unicos', new Set(ids).size === ids.length)
  expect('todo item es loadAt corte', CUTOVER_ITEMS.every((i) => i.loadAt === 'corte'))

  // Lecciones y alt: exactamente los de sus archivos de origen
  const lessonItems = CUTOVER_ITEMS.filter((i) => i.kind === 'lessons')
  const lessonSrc = flatLessons()
  expect(
    'las lecciones del corte son exactamente las 21 de 56-case-lessons.ts',
    lessonItems.length === 21 &&
      lessonSrc.length === 21 &&
      lessonSrc.every(({ slug, lesson }) => {
        const item = lessonItems.find((i) => i.governedBy === lessonId(slug, lesson.n))
        if (!item) return false
        const d = item.desired as { es: { title: string; body: string }; en: { title: string; body: string } }
        return d.es.title === lesson.es.title && d.es.body === lesson.es.body && d.en.title === lesson.en.title && d.en.body === lesson.en.body
      }),
  )
  const altItems = CUTOVER_ITEMS.filter((i) => i.kind === 'media-alt')
  expect(
    'los alt del corte son exactamente las 6 capturas de 56-alt-texts.ts',
    altItems.length === 6 &&
      CAPTURE_ALTS.length === 6 &&
      CAPTURE_ALTS.every((row) => {
        const item = altItems.find((i) => i.governedBy === `ALT-${row.key}`)
        if (!item) return false
        const cur = item.current as { es: string; en: string }
        if (cur.es !== row.actualEs || cur.en !== row.actualEn) return false
        if (!row.loadable) return item.desired === undefined && item.status === 'pendiente'
        const d = item.desired as { es: string; en: string }
        return d.es === row.es && d.en === row.en
      }),
  )
  const juanTechAlt = altItems.find((i) => i.governedBy === 'ALT-juan-tech')
  expect('el alt de la captura de Juan Tech no se carga (pagina de Vercel en pausa)', !!juanTechAlt && juanTechAlt.desired === undefined && juanTechAlt.status === 'pendiente')

  // CTAs con loadAt corte
  const ctaItems = CUTOVER_ITEMS.filter((i) => i.kind === 'cta-master')
  const ctaCorte = CTA_MAP.filter((e) => e.loadAt === 'corte')
  expect(
    `las ${ctaCorte.length} filas CTA con loadAt corte de 56-cta-map.ts estan registradas`,
    ctaItems.length === ctaCorte.length && ctaCorte.every((e) => ctaItems.some((i) => i.id === `CUT-cta-master-${e.id}`)),
  )

  // Fecha legal
  const legal = CUTOVER_ITEMS.find((i) => i.kind === 'legal-date')
  expect(
    'la fecha legal sigue a LEGAL_EFFECTIVE_DATE (pendiente hasta el corte, aprobada con valor)',
    !!legal && (LEGAL_EFFECTIVE_DATE === '' ? legal.status === 'pendiente' && legal.desired === undefined : legal.status === 'aprobado' && legal.desired === LEGAL_EFFECTIVE_DATE),
  )

  // Arianna Lupi (D-13): stack verificado, textos sin inventar
  const stack = CUTOVER_ITEMS.find((i) => i.id === 'CUT-websites-ariannalupi-stack')
  const stackTexts = stack ? strings(stack.desired) : []
  expect(
    'Arianna: el stack deseado es Astro y Cloudflare, sin Next.js, Payload, Neon ni Hostinger',
    !!stack &&
      stackTexts.includes('Astro') &&
      stackTexts.includes('Cloudflare') &&
      !stackTexts.some((t) => /Next\.js|Payload|Neon|Hostinger/.test(t)) &&
      stack.status === 'propuesto',
  )
  const cur = stack ? strings(stack.current) : []
  expect('Arianna: el respaldo trae el stack que sirve hoy (Next.js, Payload CMS, Neon Postgres, Hostinger)', ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'].every((t) => cur.includes(t)))
  const textos = CUTOVER_ITEMS.find((i) => i.id === 'CUT-websites-ariannalupi-textos')
  expect('Arianna: highlights y retos quedan pendientes y sin texto inventado', !!textos && textos.status === 'pendiente' && textos.desired === undefined && !isEmptyValue(textos.current))

  // Otras filas: solo se afirma lo verificado
  const apturio = CUTOVER_ITEMS.find((i) => i.id === 'CUT-websites-apturio-com')
  expect('Apturio: no se cambia nada porque Hostinger se verifica por cabeceras', !!apturio && apturio.desired === undefined && apturio.chosen === 'sin-cambio' && (apturio.evidence ?? []).some((e) => /hostinger/i.test(e)))
  const club = CUTOVER_ITEMS.find((i) => i.id === 'CUT-websites-aprendoclub-com')
  const clubDes = club ? strings(club.desired) : []
  expect('Aprendoclub: Hostinger sale y entran Vercel y Cloudflare', !!club && !clubDes.some((t) => /Hostinger/.test(t)) && clubDes.includes('Vercel') && clubDes.includes('Cloudflare'))
  const jt = CUTOVER_ITEMS.find((i) => i.id === 'CUT-websites-juan-tech-com')
  const jtDes = jt ? strings(jt.desired) : []
  expect('Juan Tech: Neon y Hostinger salen y entran Hetzner y Dokploy', !!jt && !jtDes.some((t) => /Neon|Hostinger/.test(t)) && jtDes.includes('Hetzner') && jtDes.includes('Dokploy'))
  const loops = CUTOVER_ITEMS.find((i) => i.id === 'CUT-websites-loopsgrowth-com')
  expect('Loops Growth: no se crea fila (sin desired) y el respaldo dice que no existe', !!loops && loops.desired === undefined && loops.chosen === 'no-crear' && /Sin fila/.test(show(loops.current)))
  expect('ninguna fila de Websites con desired nombra Hostinger en el dato nuevo', CUTOVER_ITEMS.filter((i) => i.kind === 'websites-row').every((i) => !strings(i.desired).some((t) => /Hostinger/.test(t))))

  // Testimonio (D-20) y recursividad (D-21)
  const t = CUTOVER_ITEMS.find((i) => i.kind === 'testimonial')
  const tc = (t?.current ?? {}) as { es?: string; en?: string }
  expect('Testimonio: solo el de Patricia Ibarra, sin cita inventada (desired vacio con la opcion dejar)', !!t && t.chosen === 'dejar' && t.desired === undefined && tc.es === LIVE_TESTIMONIAL.es && tc.en === LIVE_TESTIMONIAL.en && /Patricia Ibarra/.test(t.target))
  expect('Testimonio: hay exactamente un testimonio registrado', CUTOVER_ITEMS.filter((i) => i.kind === 'testimonial').length === 1)
  const post = CUTOVER_ITEMS.find((i) => i.kind === 'post-translation')
  expect('Recursividad: registrada con su respaldo EN y la opcion recomendada aviso', !!post && post.id === 'CUT-post-translation-recursividad' && post.chosen === 'aviso' && /22 %/.test(show(post.current)) && post.status === 'propuesto')
  const author = CUTOVER_ITEMS.find((i) => i.kind === 'author')
  const aDes = author?.desired as { es: { experience: { endDate: string | null }[] }; en: { experience: { endDate: string | null }[] } } | undefined
  expect(
    'Autor: solo cambia endDate de la fila de AprendoSEO y las otras dos filas quedan igual',
    !!aDes &&
      aDes.es.experience[1].endDate === null &&
      aDes.en.experience[1].endDate === null &&
      aDes.es.experience[0].endDate === LIVE_AUTHOR_EXPERIENCE.es[0].endDate &&
      aDes.es.experience[2].endDate === LIVE_AUTHOR_EXPERIENCE.es[2].endDate,
  )

  // Decisiones propias
  const own = validateDecisions(DECISIONS)
  expect('las decisiones propias son validas', own.length === 0, own.join(' | '))
  expect('las decisiones propias llevan prefijo CUT- y salen de items sin governedBy', DECISIONS.length === OWNED_ITEMS.length && DECISIONS.every((d) => d.id.startsWith('CUT-')))
  expect('ningun item aprobado propio carece de desired y ninguna decision aprobada queda sin opcion elegida', OWNED_ITEMS.every((i) => i.status !== 'aprobado' || !isEmptyValue(i.desired)))

  // Cruce con las decisiones que mandan el estado de los items gobernados
  const discovered = await discoverDecisions()
  expect('el descubrimiento del gate no tiene problemas de forma', discovered.problems.length === 0, discovered.problems.join(' | '))
  const byId = new Map(discovered.decisions.map((d) => [d.id, d]))
  const governed = CUTOVER_ITEMS.filter((i) => i.governedBy !== undefined)
  const mismatch = governed.filter((i) => {
    const d = byId.get(i.governedBy as string)
    return !d || d.status !== i.status
  })
  expect(`los ${governed.length} items gobernados coinciden en estado con su decision`, mismatch.length === 0, mismatch.map((i) => `${i.id} -> ${i.governedBy}`).join(', '))
  expect('las decisiones CUT- aparecen en el gate', DECISIONS.every((d) => byId.has(d.id)))
}

// ---------------------------------------------------------------------------
// Cargador del corte (28-phase56-cutover-load.ts) con una Local API falsa en memoria
// ---------------------------------------------------------------------------
//
// La Local API falsa modela las dos trampas que importan: un arreglo con subcampos localizados
// comparte los id de fila entre idiomas (escribir EN sin id crea filas nuevas), y un update de una
// coleccion con borradores sin draft false deja el doc en borrador. No tiene ninguna operacion de
// borrado: si el cargador intentara borrar, lanzaria y el caso fallaria. No abre ninguna base, no
// usa la red y no lee el .env.

type Locale = 'es' | 'en'
type Sub = 'plain' | 'loc'
type FieldDef = 'plain' | 'loc' | { array: Record<string, Sub> } | { group: Record<string, Sub> }
type Schema = Record<string, FieldDef>
type Row = Record<string, unknown>
type FakeDoc = { id: number; status?: string; data: Row }
type FakeWrite = { op: 'update' | 'updateGlobal'; target: string; id?: unknown; locale: Locale; data: Row; draft?: unknown }

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const isRow = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v)

function viewField(def: FieldDef, raw: unknown, locale: Locale): unknown {
  if (def === 'plain') return raw
  if (def === 'loc') return isRow(raw) ? raw[locale] : undefined
  const sub = 'array' in def ? def.array : def.group
  const viewRow = (r: Row): Row => {
    const out: Row = {}
    if ('id' in r) out.id = r.id
    for (const [k, d] of Object.entries(sub)) out[k] = d === 'loc' ? (isRow(r[k]) ? (r[k] as Row)[locale] : undefined) : r[k]
    return out
  }
  if ('array' in def) return Array.isArray(raw) ? (raw as Row[]).map(viewRow) : []
  return isRow(raw) ? viewRow(raw) : {}
}

function applyData(schema: Schema, store: Row, data: Row, locale: Locale, nextId: () => number): void {
  for (const [k, v] of Object.entries(data)) {
    const def = schema[k]
    if (def === undefined) throw new Error(`campo desconocido ${k}`)
    if (def === 'plain') store[k] = clone(v)
    else if (def === 'loc') store[k] = { ...(isRow(store[k]) ? (store[k] as Row) : {}), [locale]: v }
    else {
      const sub = 'array' in def ? def.array : def.group
      const mergeRow = (base: Row, incoming: Row): Row => {
        const row: Row = { ...base }
        for (const [sk, sv] of Object.entries(incoming)) {
          if (sk === 'id') continue
          const sd = sub[sk]
          if (sd === undefined) throw new Error(`subcampo desconocido ${k}.${sk}`)
          row[sk] = sd === 'loc' ? { ...(isRow(row[sk]) ? (row[sk] as Row) : {}), [locale]: sv } : clone(sv)
        }
        return row
      }
      if ('array' in def) {
        const cur = Array.isArray(store[k]) ? (store[k] as Row[]) : []
        store[k] = (v as Row[]).map((inc) => {
          const existing = inc.id !== undefined ? cur.find((r) => r.id === inc.id) : undefined
          return mergeRow(existing ?? { id: nextId() }, inc)
        })
      } else {
        store[k] = mergeRow(isRow(store[k]) ? (store[k] as Row) : {}, v as Row)
      }
    }
  }
}

type CollectionSpec = { schema: Schema; drafts: boolean; docs: FakeDoc[] }
type GlobalSpec = { schema: Schema; data: Row }

function makeFake(spec: { collections: Record<string, CollectionSpec>; globals?: Record<string, GlobalSpec> }) {
  const collections = clone(spec.collections)
  const globals = clone(spec.globals ?? {})
  const writes: FakeWrite[] = []
  let seq = 1000
  const nextId = () => ++seq
  const needFalse = (args: { fallbackLocale?: unknown }, what: string) => {
    if (args.fallbackLocale !== false) throw new Error(`la lectura ${what} debe usar fallbackLocale: false`)
  }
  const coll = (name: unknown): CollectionSpec => {
    const c = collections[String(name)]
    if (!c) throw new Error(`coleccion desconocida ${String(name)}`)
    return c
  }
  const view = (c: CollectionSpec, d: FakeDoc, locale: Locale): Row => {
    const out: Row = { id: d.id, _status: d.status }
    for (const [k, def] of Object.entries(c.schema)) out[k] = viewField(def, d.data[k], locale)
    return out
  }
  return {
    collections,
    globals,
    writes,
    nextId,
    async find(args: { collection: string; where?: Row; limit?: number; locale: Locale; fallbackLocale?: unknown }) {
      needFalse(args, `de ${args.collection}`)
      const c = coll(args.collection)
      const [field, cond] = Object.entries(args.where ?? {})[0] as [string, Row]
      const docs = c.docs.filter((d) => {
        const v = viewField(c.schema[field], d.data[field], args.locale)
        if ('equals' in cond) return v === cond.equals
        if ('like' in cond) return typeof v === 'string' && v.includes(String(cond.like))
        return false
      })
      return { docs: docs.slice(0, args.limit ?? 10).map((d) => view(c, d, args.locale)) }
    },
    async findByID(args: { collection: string; id: number; locale: Locale; fallbackLocale?: unknown }) {
      needFalse(args, `de ${args.collection}`)
      const c = coll(args.collection)
      const d = c.docs.find((x) => x.id === args.id)
      if (!d) throw new Error(`no existe ${args.collection} ${args.id}`)
      return view(c, d, args.locale)
    },
    async update(args: { collection: string; id: number; locale: Locale; data: Row; draft?: unknown; fallbackLocale?: unknown }) {
      const c = coll(args.collection)
      const d = c.docs.find((x) => x.id === args.id)
      if (!d) throw new Error(`no existe ${args.collection} ${args.id}`)
      writes.push({ op: 'update', target: args.collection, id: args.id, locale: args.locale, data: clone(args.data), draft: args.draft })
      applyData(c.schema, d.data, clone(args.data), args.locale, nextId)
      // Sin draft false, un update de una coleccion con borradores despublica el doc.
      if (c.drafts) d.status = args.draft === false ? (d.status ?? 'published') : 'draft'
      return view(c, d, args.locale)
    },
    async findGlobal(args: { slug: string; locale: Locale; fallbackLocale?: unknown }) {
      needFalse(args, `del global ${args.slug}`)
      const g = globals[args.slug]
      if (!g) throw new Error(`global desconocido ${args.slug}`)
      const out: Row = {}
      for (const [k, def] of Object.entries(g.schema)) out[k] = viewField(def, g.data[k], args.locale)
      return out
    },
    async updateGlobal(args: { slug: string; locale: Locale; data: Row }) {
      const g = globals[args.slug]
      if (!g) throw new Error(`global desconocido ${args.slug}`)
      writes.push({ op: 'updateGlobal', target: args.slug, locale: args.locale, data: clone(args.data) })
      applyData(g.schema, g.data, clone(args.data), args.locale, nextId)
      return {}
    },
  }
}

type Fake = ReturnType<typeof makeFake>

const PROD_URI = 'postgresql://x:y@127.0.0.1:15432/juantech?sslmode=disable'
const NEON_URI = 'postgresql://x:y@ep-hidden-heart-atc1vys8.c-2.us-west-2.aws.neon.tech/neondb'
const NOW = new Date('2026-11-20T12:00:00Z')

const LESSON_SCHEMA: Schema = { title: 'loc', slug: 'plain', lessons: { array: { title: 'loc', body: 'loc' } } }

/** Siete casos publicados, sin lecciones: el estado de produccion hoy. */
function caseDocs(): FakeDoc[] {
  return CASE_SLUGS.map((slug, i) => ({ id: i + 1, status: 'published', data: { title: { es: slug, en: slug }, slug } }))
}

function fakeCases(): Fake {
  return makeFake({ collections: { 'case-studies': { schema: LESSON_SCHEMA, drafts: true, docs: caseDocs() } } })
}

const sink = () => {
  const lines: string[] = []
  return { lines, io: { out: (l: string) => lines.push(l), err: (l: string) => lines.push(l) } }
}

const baseOpts = (over: Partial<loader.Opts> = {}): loader.Opts => ({
  apply: false,
  dbChecked: false,
  only: [],
  printCurrent: false,
  overwriteLessons: false,
  allowShrinkRows: false,
  ...over,
})

async function runLoader(opts: loader.Opts, fake: Fake, over: { uri?: string; items?: CutItem[]; legalDate?: string } = {}) {
  let loads = 0
  const { lines, io } = sink()
  const code = await loader.run(
    opts,
    { DATABASE_URI: over.uri ?? PROD_URI },
    async () => {
      loads += 1
      return fake
    },
    io,
    { items: over.items, legalDate: over.legalDate ?? '', now: () => NOW },
  )
  return { code, loads, text: lines.join('\n') }
}

/** Los items reales con el estado de las lecciones cambiado, para probar la carga con items aprobados. */
function withLessonStatus(status: 'aprobado' | 'propuesto' | 'pendiente', only?: (i: CutItem) => boolean): CutItem[] {
  return CUTOVER_ITEMS.map((i) => (i.kind === 'lessons' && (!only || only(i)) ? { ...i, status } : i))
}

const lessonOf = (slug: string, n: number) => flatLessons().find((x) => x.slug === slug && x.lesson.n === n)!.lesson

async function loaderTracer(): Promise<void> {
  // Argumentos
  const a = loader.parseArgs(['--apply', '--db-checked', '--only', 'lessons,CUT-media', 'testimonial', '--overwrite-lessons'])
  expect('cargador: parseArgs lee --only con comas y espacios hasta la siguiente bandera', a.only.join('|') === 'lessons|CUT-media|testimonial' && a.apply && a.dbChecked && a.overwriteLessons && !a.allowShrinkRows)
  let threw = false
  try {
    loader.parseArgs(['--only'])
  } catch {
    threw = true
  }
  expect('cargador: --only sin valor falla', threw)

  // Dry-run sobre los items reales
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ only: ['lessons'] }), fake)
    expect('cargador: el dry-run sale 0 y no escribe nada', r.code === 0 && fake.writes.length === 0, `codigo ${r.code}, escrituras ${fake.writes.length}`)
    expect('cargador: el dry-run imprime DRY-RUN y la base como host:puerto/base sin usuario', r.text.includes('DRY-RUN') && r.text.includes('127.0.0.1:15432/juantech') && !r.text.includes('x:y'))
    const sin = (r.text.match(/sin lecciones en la base/g) ?? []).length
    expect('cargador: el dry-run lista los 7 casos con "sin lecciones en la base"', sin === 7, `aparece ${sin} veces`)
    expect('cargador: con las lecciones propuestas y gate aprobado el dry-run dice SE NIEGA y no las carga', (r.text.match(/\[SE NIEGA\] lessons:/g) ?? []).length === 7)
    expect('cargador: el dry-run recuerda que es solo para el corte', /SOLO PARA EL CORTE/.test(r.text))
  }

  // Guardia de base
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true }), fake)
    expect('cargador: --apply sin --db-checked falla antes de importar Payload', r.code === 1 && r.loads === 0 && fake.writes.length === 0 && /--db-checked/.test(r.text), `codigo ${r.code}, cargas ${r.loads}`)
  }
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true }), fake, { uri: NEON_URI })
    expect('cargador: una base de Neon falla antes de importar nada', r.code === 1 && r.loads === 0 && fake.writes.length === 0 && /neon/i.test(r.text), `codigo ${r.code}, cargas ${r.loads}`)
  }
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true }), fake, { uri: 'postgresql://x:y@127.0.0.1:15432/otra' })
    expect('cargador: una base con otro nombre falla antes de importar nada', r.code === 1 && r.loads === 0)
  }
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ printCurrent: true, apply: true, dbChecked: true }), fake)
    expect('cargador: --print-current junto a --apply aborta', r.code === 1 && fake.writes.length === 0)
  }

  // Negativas por estado
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true, only: ['lessons'] }), fake)
    expect('cargador: --apply se niega ante lecciones propuestas con gate aprobado y no escribe', r.code === 1 && fake.writes.length === 0 && /sin aprobar/.test(r.text), `codigo ${r.code}`)
  }
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true, only: ['lessons'] }), fake, { items: withLessonStatus('pendiente') })
    expect('cargador: --apply se niega ante lecciones pendientes y no escribe', r.code === 1 && fake.writes.length === 0)
  }
  {
    const fake = fakeCases()
    const first = CASE_SLUGS[0]
    const items = withLessonStatus('aprobado', (i) => i.id !== `CUT-lessons-${first}-2`).map((i) => (i.id === `CUT-lessons-${first}-2` ? { ...i, status: 'pendiente' as const } : i))
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true, only: ['lessons'] }), fake, { items })
    expect('cargador: una sola leccion pendiente niega el caso entero y no escribe ninguno', r.code === 1 && fake.writes.length === 0)
  }
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true, only: ['lessons'] }), fake, { items: withLessonStatus('propuesto').map((i) => (i.kind === 'lessons' ? { ...i, gate: 'propuesto' as const } : i)) })
    expect('cargador: propuesto con gate propuesto SI se carga y se anota para el handoff', r.code === 0 && fake.writes.length === 14 && /AVISO para el handoff/.test(r.text), `codigo ${r.code}, escrituras ${fake.writes.length}`)
  }

  // Carga de punta a punta con lecciones aprobadas
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true, only: ['lessons'] }), fake, { items: withLessonStatus('aprobado') })
    expect('cargador: --apply --db-checked con lecciones aprobadas sale 0', r.code === 0, `codigo ${r.code}\n${r.text.split('\n').slice(-12).join('\n')}`)
    const updates = fake.writes.filter((w) => w.op === 'update')
    expect('cargador: escribe ES y EN por cada uno de los 7 casos (14 escrituras)', updates.length === 14)
    expect('cargador: todo update lleva draft false', updates.every((w) => w.draft === false))
    const order = CASE_SLUGS.every((_, i) => updates[i * 2].locale === 'es' && updates[i * 2 + 1].locale === 'en' && updates[i * 2].id === updates[i * 2 + 1].id)
    expect('cargador: cada caso escribe ES y despues EN', order)
    const enRows = updates.filter((w) => w.locale === 'en').flatMap((w) => w.data.lessons as Row[])
    expect('cargador: el EN se escribe siempre con el id de fila releido', enRows.length === 21 && enRows.every((r) => typeof r.id === 'number'))
    const storeIds = new Set(fake.collections['case-studies'].docs.flatMap((d) => (d.data.lessons as Row[]).map((r) => r.id)))
    expect('cargador: los id del EN son los de las filas creadas por el ES (sin filas duplicadas)', enRows.every((r) => storeIds.has(r.id)) && storeIds.size === 21)
    const okStore = flatLessons().every(({ slug, lesson }) => {
      const d = fake.collections['case-studies'].docs.find((x) => x.data.slug === slug)!
      const row = (d.data.lessons as Row[])[lesson.n - 1] as { title: { es: string; en: string }; body: { es: string; en: string } }
      return row.title.es === lesson.es.title && row.body.es === lesson.es.body && row.title.en === lesson.en.title && row.body.en === lesson.en.body
    })
    expect('cargador: las 21 lecciones quedan en ES y EN y se releen iguales', okStore)
    expect('cargador: el status de publicacion sigue en published en los 7 casos', fake.collections['case-studies'].docs.every((d) => d.status === 'published'))
    expect('cargador: no toca ningun otro campo del caso', fake.collections['case-studies'].docs.every((d) => Object.keys(d.data).sort().join() === 'lessons,slug,title'))
    expect('cargador: avisa del TTL y de la verificacion viva', /60 s/.test(r.text) && /56-cases-lessons-live\.mjs --expect-loaded/.test(r.text))
    const again = await runLoader(baseOpts({ apply: true, dbChecked: true, only: ['lessons'] }), fake, { items: withLessonStatus('aprobado') })
    expect('cargador: repetir la carga es idempotente (no escribe de nuevo)', again.code === 0 && fake.writes.length === 14 && /nada que escribir/.test(again.text))
  }

  // La Local API falsa reproduce la trampa: un EN sin id crea filas nuevas y se pierde el ES
  {
    const fake = fakeCases()
    const doc = fake.collections['case-studies'].docs[0]
    await fake.update({ collection: 'case-studies', id: doc.id, locale: 'es', data: { lessons: [{ title: 'uno', body: 'a' }, { title: 'dos', body: 'b' }] }, draft: false })
    await fake.update({ collection: 'case-studies', id: doc.id, locale: 'en', data: { lessons: [{ title: 'one', body: 'a' }, { title: 'two', body: 'b' }] }, draft: false })
    const rows = (await fake.findByID({ collection: 'case-studies', id: doc.id, locale: 'es', fallbackLocale: false })).lessons as Row[]
    expect('cargador: la Local API falsa pierde el ES si el EN se escribe sin id (la trampa existe)', rows.length === 2 && rows.every((r) => r.title === undefined))
    expect('cargador: la Local API falsa despublica si un update no lleva draft false', await (async () => {
      const f = fakeCases()
      await f.update({ collection: 'case-studies', id: 1, locale: 'es', data: { slug: 'x' } })
      return f.collections['case-studies'].docs[0].status === 'draft'
    })())
  }

  // Lecciones existentes que difieren
  {
    const slug = CASE_SLUGS[0]
    const seeded = (): Fake => {
      const docs = caseDocs()
      docs[0].data.lessons = [
        { id: 101, title: { es: 'Otra uno', en: 'Other one' }, body: { es: 'x', en: 'x' } },
        { id: 102, title: { es: 'Otra dos', en: 'Other two' }, body: { es: 'y', en: 'y' } },
        { id: 103, title: { es: 'Otra tres', en: 'Other three' }, body: { es: 'z', en: 'z' } },
      ]
      return makeFake({ collections: { 'case-studies': { schema: LESSON_SCHEMA, drafts: true, docs } } })
    }
    const items = withLessonStatus('aprobado')
    const only = [`CUT-lessons-${slug}`]
    const f1 = seeded()
    const dry = await runLoader(baseOpts({ only }), f1, { items })
    expect('cargador: el dry-run de un caso con lecciones distintas imprime el respaldo y avisa que se negaria', dry.code === 0 && /Otra uno/.test(dry.text) && /SE NEGARIA: .*--overwrite-lessons/.test(dry.text) && f1.writes.length === 0)
    const r1 = await runLoader(baseOpts({ apply: true, dbChecked: true, only }), f1, { items })
    expect('cargador: se niega a pisar lecciones distintas sin --overwrite-lessons y no escribe', r1.code === 1 && f1.writes.length === 0 && /--overwrite-lessons/.test(r1.text))
    const f2 = seeded()
    const r2 = await runLoader(baseOpts({ apply: true, dbChecked: true, only, overwriteLessons: true }), f2, { items })
    const rows = f2.collections['case-studies'].docs[0].data.lessons as Row[]
    expect('cargador: con --overwrite-lessons pisa, conserva los id de fila y suma 2 escrituras', r2.code === 0 && f2.writes.length === 2 && rows.map((r) => r.id).join() === '101,102,103' && (rows[0].title as Row).en === lessonOf(slug, 1).en.title && (rows[2].body as Row).es === lessonOf(slug, 3).es.body)
  }

  // Un caso no publicado y una seleccion parcial
  {
    const docs = caseDocs()
    docs[0].status = 'draft'
    const f = makeFake({ collections: { 'case-studies': { schema: LESSON_SCHEMA, drafts: true, docs } } })
    const r = await runLoader(baseOpts({ apply: true, dbChecked: true, only: [`CUT-lessons-${CASE_SLUGS[0]}`] }), f, { items: withLessonStatus('aprobado') })
    expect('cargador: se niega a tocar un caso que no esta publicado', r.code === 1 && f.writes.length === 0 && /no esta publicado/.test(r.text))
    const g = fakeCases()
    const p = await runLoader(baseOpts({ only: [`CUT-lessons-${CASE_SLUGS[0]}-1`] }), g, { items: withLessonStatus('aprobado') })
    expect('cargador: una leccion suelta aborta porque el caso se carga completo', p.code === 1 && /se carga completo/.test(p.text) && g.writes.length === 0)
    const n = await runLoader(baseOpts({ only: ['nada-que-ver'] }), fakeCases())
    expect('cargador: --only sin coincidencias aborta', n.code === 1 && /no coincide con ningun item/.test(n.text))
  }

  // --print-current
  {
    const fake = fakeCases()
    const r = await runLoader(baseOpts({ printCurrent: true, only: [`CUT-lessons-${CASE_SLUGS[0]}`] }), fake)
    expect('cargador: --print-current sale 0, no escribe y manda el JSON a la salida', r.code === 0 && fake.writes.length === 0 && /"lessons:/.test(r.text))
  }
}

// ---------------------------------------------------------------------------
// Lectura viva (solo GET)
// ---------------------------------------------------------------------------

async function getJson(url: string): Promise<{ docs?: Record<string, unknown>[]; totalDocs?: number }> {
  const res = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} respondio ${res.status}`)
  return (await res.json()) as { docs?: Record<string, unknown>[]; totalDocs?: number }
}

const tags = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => (x as { tag?: string }).tag ?? '') : [])
const texts = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => (x as { text?: string }).text ?? '') : [])
const same = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i])

async function live(): Promise<void> {
  const [es, en] = await Promise.all([
    getJson(`${PROD_API}/websites?limit=50&depth=0&locale=es`),
    getJson(`${PROD_API}/websites?limit=50&depth=0&locale=en`),
  ])
  for (const [slug, site] of Object.entries(LIVE_WEBSITES)) {
    const e = es.docs?.find((d) => d.slug === slug)
    const n = en.docs?.find((d) => d.slug === slug)
    expect(
      `vivo: la fila ${slug} sigue igual que el respaldo`,
      !!e && !!n && same(tags(e.stack), site.stack) && same(texts(e.highlights), site.highlights.es) && same(texts(n.highlights), site.highlights.en) && same(texts(e.challenges), site.challenges.es) && same(texts(n.challenges), site.challenges.en),
      'el dato cambio en produccion desde el respaldo (DRIFT)',
    )
  }
  expect('vivo: Websites no tiene fila loopsgrowth-com', !es.docs?.some((d) => d.slug === 'loopsgrowth-com'))

  const [tes, ten] = await Promise.all([getJson(`${PROD_API}/testimonials?depth=0&locale=es`), getJson(`${PROD_API}/testimonials?depth=0&locale=en`)])
  expect('vivo: un solo testimonio y con la misma cita en ES y EN', tes.totalDocs === 1 && (tes.docs?.[0] as { testimonial?: string })?.testimonial === LIVE_TESTIMONIAL.es && (ten.docs?.[0] as { testimonial?: string })?.testimonial === LIVE_TESTIMONIAL.en)

  const [aes] = await Promise.all([getJson(`${PROD_API}/authors?depth=0&locale=es&limit=5`)])
  const exp = ((aes.docs?.[0] as { experience?: { company?: string; endDate?: string | null }[] })?.experience ?? []).find((x) => x.company === 'AprendoSEO')
  expect('vivo: la fila AprendoSEO del autor sigue con fin en feb 2026', !!exp && (exp.endDate ?? '').startsWith('2026-02-01'))

  const cases = await getJson(`${PROD_API}/case-studies?depth=0&locale=es&limit=1`)
  expect('vivo: case-studies no devuelve el campo lessons', !!cases.docs?.[0] && !('lessons' in cases.docs[0]))
}

async function main(): Promise<void> {
  rules()
  await realData()
  await loaderTracer()
  if (process.argv.includes('--live')) await live()
  if (bad > 0) {
    console.log(`\nFAIL 56-cutover-selftest: ${bad} caso(s)`)
    process.exit(1)
  }
  console.log('\nPASS 56-cutover-selftest')
}

main().catch((err) => {
  console.log(`FAIL 56-cutover-selftest: ${(err as Error).message}`)
  process.exit(1)
})
