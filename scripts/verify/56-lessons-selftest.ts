/**
 * Autoprueba de las lecciones de los casos (plan 56-06, CONT-02, D-16, D-17, T-56-19 y T-56-21).
 *
 * Sin red y sin base de datos. Revisa scripts/db/data/56-case-lessons.ts:
 *   - 7 casos con 3 lecciones cada uno (21), numeradas de 1 a 3;
 *   - title y body no vacios en es y en, de tipo texto (forma del campo `lessons` de CaseStudies);
 *   - ningun titulo con punto ni coma (CaseDetailView lo pinta como h3, regla de voz);
 *   - ninguna cadena con raya larga, raya media ni marcador de ranura (se arman por codigo);
 *   - sin voz de agencia (nosotros, nuestro, agencia, equipo, we, our, team);
 *   - toda cifra de titulo o cuerpo aparece en un fragmento de `figures` de su idioma;
 *   - cada figure con from y to recalcula su porcentaje redondeado;
 *   - los dos ajustes PARCIAL de RESEARCH 6 (baldosa 3 sin orden, migracion 2 sin cola);
 *   - estado valido y una decision LESSON-<slug>-<n> por leccion, gate aprobado.
 *
 *   node_modules/.bin/tsx scripts/verify/56-lessons-selftest.ts
 */
import { pathToFileURL } from 'node:url'

import { validateDecisions } from '../db/data/56-content-decisions'
import { CASE_LESSONS, CASE_SLUGS, DECISIONS, lessonId, type Lesson } from '../db/data/56-case-lessons'

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const MARKER_OPEN = '{'.repeat(2)
const STATUSES = ['aprobado', 'propuesto', 'pendiente']
const AGENCY_ES = /\b(nosotros|nuestr[oa]s?|agencia|equipo)\b/i
const AGENCY_EN = /\b(we|our|ours|agency|team)\b/i

/** Misma normalizacion que el verificador vivo: comillas rectas y sin espacio junto a + o %. */
export function norm(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\+\s+/g, '+')
    .replace(/\s+%/g, '%')
    .trim()
    .toLowerCase()
}

/** Numeros (con separadores de miles y decimales) de una cadena. */
export function numbersIn(text: string): string[] {
  return text.match(/\d+(?:[.,]\d+)*/g) ?? []
}

/** Problemas de una leccion. Vacio si esta bien. */
export function lessonProblems(slug: string, lesson: Lesson): string[] {
  const out: string[] = []
  const at = `${slug} leccion ${lesson.n}`
  const fail = (msg: string) => out.push(`${at}: ${msg}`)

  if (!STATUSES.includes(lesson.status)) fail(`estado invalido "${String(lesson.status)}"`)
  for (const loc of ['es', 'en'] as const) {
    const t = lesson[loc]
    if (!t || typeof t.title !== 'string' || typeof t.body !== 'string') {
      fail(`${loc}: title y body deben ser texto`)
      continue
    }
    if (!t.title.trim()) fail(`${loc}: title vacio`)
    if (!t.body.trim()) fail(`${loc}: body vacio`)
    if (/[.,]/.test(t.title)) fail(`${loc}: el titulo lleva punto o coma ("${t.title}")`)
    for (const [field, value] of Object.entries(t)) {
      if (value.includes(EM_DASH)) fail(`${loc}.${field}: raya larga`)
      if (value.includes(EN_DASH)) fail(`${loc}.${field}: raya media`)
      if (value.includes(MARKER_OPEN)) fail(`${loc}.${field}: marcador de ranura`)
    }
    const agency = loc === 'es' ? AGENCY_ES : AGENCY_EN
    if (agency.test(`${t.title} ${t.body}`)) fail(`${loc}: habla como agencia en lugar de Juan`)
  }

  if (!Array.isArray(lesson.figures) || lesson.figures.length === 0) {
    fail('sin figures: cada leccion lista el fragmento del caso que la respalda')
    return out
  }
  for (const f of lesson.figures) {
    if (!f.text || !f.text.trim()) fail('figure con text vacio')
    for (const v of [f.text, f.textEn ?? '']) {
      if (v.includes(EM_DASH) || v.includes(EN_DASH)) fail(`figure "${v}": raya larga o media`)
    }
    if (f.pct !== undefined) {
      if (f.from === undefined || f.to === undefined || f.from === 0) {
        fail(`figure "${f.text}": pct sin from y to validos`)
      } else {
        const calc = Math.round(((f.to - f.from) / f.from) * 100)
        if (calc !== f.pct) fail(`figure "${f.text}": pct ${f.pct} pero ${f.from} a ${f.to} da ${calc}`)
      }
    }
  }
  // Cero cifras inventadas: cada numero visible esta en un fragmento respaldado del mismo idioma.
  for (const loc of ['es', 'en'] as const) {
    const t = lesson[loc]
    if (!t) continue
    // El porcentaje de una figure con from y to cuenta como respaldado: el verificador vivo exige que el caso lo muestre.
    const backing = lesson.figures
      .map((f) => `${norm(loc === 'en' ? (f.textEn ?? f.text) : f.text)}${f.pct !== undefined ? ` ${Math.abs(f.pct)}` : ''}`)
      .join(' | ')
    for (const n of numbersIn(`${t.title} ${t.body}`)) {
      if (!backing.includes(n)) fail(`${loc}: la cifra "${n}" no tiene fragmento en figures`)
    }
  }
  return out
}

/** Problemas del conjunto completo de lecciones. */
export function allProblems(data: Record<string, Lesson[]> = CASE_LESSONS): string[] {
  const out: string[] = []
  const slugs = Object.keys(data)
  if (slugs.length !== 7) out.push(`se esperaban 7 casos y hay ${slugs.length}`)
  for (const slug of slugs) {
    const lessons = data[slug]
    if (lessons.length !== 3) out.push(`${slug}: se esperaban 3 lecciones y hay ${lessons.length}`)
    lessons.forEach((lesson, i) => {
      if (lesson.n !== i + 1) out.push(`${slug}: la leccion en la posicion ${i + 1} trae n=${lesson.n}`)
      out.push(...lessonProblems(slug, lesson))
    })
  }
  return out
}

function selftest(): number {
  let bad = 0
  const expect = (label: string, ok: boolean, detail = '') => {
    if (ok) console.log(`PASS ${label}`)
    else {
      bad += 1
      console.log(`FAIL ${label}${detail ? `: ${detail}` : ''}`)
    }
  }

  // --- datos reales
  const problems = allProblems()
  expect('las 21 lecciones pasan todas las reglas', problems.length === 0, problems.slice(0, 5).join(' | '))
  const total = CASE_SLUGS.reduce((n, s) => n + CASE_LESSONS[s].length, 0)
  expect('hay 7 casos y 21 lecciones', CASE_SLUGS.length === 7 && total === 21, `casos ${CASE_SLUGS.length}, lecciones ${total}`)

  // --- ajustes PARCIAL de RESEARCH 6
  const baldosa3 = CASE_LESSONS['fabricante-baldosa-hidraulica-seo-espana']?.[2]
  const baldosaText = baldosa3 ? { es: `${baldosa3.es.title} ${baldosa3.es.body}`, en: `${baldosa3.en.title} ${baldosa3.en.body}` } : { es: '', en: '' }
  expect(
    'baldosa leccion 3 no afirma que la indexabilidad vino antes de publicar mas paginas',
    baldosa3 !== undefined && !/\bantes\b|\bprimero\b/i.test(baldosaText.es) && !/\bbefore\b|\bfirst\b/i.test(baldosaText.en),
    `${baldosaText.es} / ${baldosaText.en}`,
  )
  const mig2 = CASE_LESSONS['migracion-ecommerce-nextjs-seo-tecnico']?.[1]
  expect(
    'migracion leccion 2 no conserva "sin esperar al lanzamiento"',
    mig2 !== undefined && !/lanzamiento/i.test(`${mig2.es.title} ${mig2.es.body}`) && !/launch/i.test(`${mig2.en.title} ${mig2.en.body}`),
  )
  const talleres1 = CASE_LESSONS['talleres-costura-miami-lanzamiento-seo-local']?.[0]
  expect('talleres leccion 1 titulo sin coma', talleres1 !== undefined && !/[.,]/.test(talleres1.es.title))
  const pitt1 = CASE_LESSONS['pittsburgh-criminal-defense-legal-content-seo']?.[0]
  expect(
    'pittsburgh leccion 1 usa el titulo acordado sin coma',
    pitt1?.es.title === 'Escalar exige contenido específico y no solo marca',
    pitt1?.es.title,
  )
  const edtech3 = CASE_LESSONS['edtech-financiera-infantil-crecimiento-organico-seo']?.[2]
  expect(
    'edtech leccion 3 conserva la caida del 25 por ciento en seis meses',
    edtech3 !== undefined && /25 %/.test(edtech3.es.body) && /seis meses/.test(edtech3.es.body) && /25%/.test(edtech3.en.body),
  )

  // --- decisiones
  const ids = DECISIONS.map((d) => d.id)
  const expectedIds = CASE_SLUGS.flatMap((s) => CASE_LESSONS[s].map((l) => lessonId(s, l.n)))
  expect('una decision LESSON-<slug>-<n> por leccion', ids.length === 21 && expectedIds.every((id) => ids.includes(id)))
  expect('el registro valida las decisiones (ids unicos, estado y gate)', validateDecisions(DECISIONS).length === 0, validateDecisions(DECISIONS).join(' | '))
  expect('todas las decisiones tienen gate aprobado (T-56-21)', DECISIONS.every((d) => d.gate === 'aprobado'))
  expect('toda decision trae fuente y vista previa en es y en', DECISIONS.every((d) => d.source && d.preview?.es && d.preview?.en))

  // --- la autoprueba detecta fallos (fixtures defectuosos)
  const good: Lesson = {
    n: 1,
    es: { title: 'Titulo valido', body: 'Subio a 47,108 clics.' },
    en: { title: 'Valid title', body: 'It rose to 47,108 clicks.' },
    figures: [{ text: '47,108' }],
    status: 'propuesto',
  }
  expect('fixture valido: cero problemas', lessonProblems('x', good).length === 0, lessonProblems('x', good).join(' | '))
  const mut = (patch: Partial<Lesson> & { es?: Lesson['es']; en?: Lesson['en'] }): Lesson => ({ ...good, ...patch })
  expect('detecta coma en el titulo', lessonProblems('x', mut({ es: { title: 'Uno, dos', body: 'a 47,108' } })).some((m) => /punto o coma/.test(m)))
  expect('detecta punto en el titulo', lessonProblems('x', mut({ en: { title: 'Uno. Dos', body: 'a 47,108' } })).some((m) => /punto o coma/.test(m)))
  expect('detecta raya larga', lessonProblems('x', mut({ es: { title: 'Ok', body: `a ${EM_DASH} b 47,108` } })).some((m) => /raya larga/.test(m)))
  expect('detecta raya media', lessonProblems('x', mut({ en: { title: 'Ok', body: `a ${EN_DASH} b 47,108` } })).some((m) => /raya media/.test(m)))
  expect('detecta marcador de ranura', lessonProblems('x', mut({ es: { title: 'Ok', body: `${MARKER_OPEN}pendiente}} 47,108` } })).some((m) => /marcador/.test(m)))
  expect('detecta cuerpo vacio', lessonProblems('x', mut({ en: { title: 'Ok', body: '' } })).some((m) => /body vacio/.test(m)))
  expect('detecta cifra sin respaldo', lessonProblems('x', mut({ es: { title: 'Ok', body: 'Subio a 99,999 clics.' } })).some((m) => /99,999/.test(m)))
  expect('detecta porcentaje mal calculado', lessonProblems('x', mut({ figures: [{ text: '47,108', from: 47108, to: 86000, pct: 90 }] })).some((m) => /da 83/.test(m)))
  expect('detecta leccion sin figures', lessonProblems('x', mut({ figures: [] })).some((m) => /sin figures/.test(m)))
  expect('detecta estado invalido', lessonProblems('x', mut({ status: 'listo' as Lesson['status'] })).some((m) => /estado invalido/.test(m)))
  expect('detecta voz de agencia', lessonProblems('x', mut({ es: { title: 'Ok', body: 'Nuestro equipo llego a 47,108.' } })).some((m) => /agencia/.test(m)))
  expect('detecta conteo de lecciones incorrecto', allProblems({ a: [good] }).some((m) => /7 casos/.test(m)))

  console.log(bad === 0 ? 'PASS 56-lessons-selftest' : `FAIL 56-lessons-selftest (${bad})`)
  return bad === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(selftest())
