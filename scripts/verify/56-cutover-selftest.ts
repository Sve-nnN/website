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
import { flatLessons, lessonId } from '../db/data/56-case-lessons'
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
