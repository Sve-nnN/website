// Verificador vivo de las lecciones de los casos (plan 56-06, CONT-02, D-16, D-03, T-56-19,
// T-56-20 y T-56-21).
//
// Por cada caso con lecciones en scripts/db/data/56-case-lessons.ts descarga
// BASE_URL/case-studies/<slug> y BASE_URL/en/case-studies/<slug>, extrae el texto visible
// (sin script, style, noscript ni svg) y exige que CADA fragmento de `figures` aparezca en el
// texto del caso del idioma correspondiente, con el formato de ese idioma ("47,108" y "4.2s"
// en los dos, "baldosa hidráulica" tal cual). Si una figure trae from, to y pct, recalcula el
// porcentaje redondeado y exige que el caso lo muestre ("+83%", "-47%").
//
// El texto del caso se toma SIN la seccion id="lecciones": si ya hubiera lecciones cargadas,
// una cifra no puede quedar "respaldada" por la propia leccion.
//
// Modos:
//   --selftest         HTML sintetico bueno y malos; cada malo debe dar al menos un fallo.
//   --only <slug>      Solo ese caso.
//   --expect-loaded    Ademas exige que los titulos de las lecciones aparezcan como h3 en el
//                      caso, en es y en. SOLO lo usa el gate del corte (fase 57): el cargador
//                      de lecciones se corre en el corte (D-03), asi que en la fase 56 nunca.
//   (sin modo)         Verificacion de cifras contra BASE_URL.
//
// Variables: BASE_URL (obligatoria sin --selftest). Para los casos que no tienen lecciones en el
// archivo imprime SKIP. Nunca escribe en ninguna base ni envia correos: solo GET.
//
// DNS: si esta maquina falla con ENOTFOUND dev.juan-tech.com por cache negativa de DNS,
// corre el script con
//   NODE_OPTIONS="--require <ruta del scratchpad de la sesion>/dnsfix.cjs"
// Ese archivo es temporal de la sesion y nunca entra al repo.

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { decodeEntities, getPage } from './55-page-contract.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx')

// Los 7 casos con lecciones esperadas (para imprimir SKIP si el archivo aun no los trae).
export const EXPECTED_SLUGS = [
  'pittsburgh-criminal-defense-legal-content-seo',
  'fabricante-baldosa-hidraulica-seo-espana',
  'immigration-law-atlanta-seo',
  'talleres-costura-miami-lanzamiento-seo-local',
  'urologo-seo-local-salud-santiago-rd',
  'edtech-financiera-infantil-crecimiento-organico-seo',
  'migracion-ecommerce-nextjs-seo-tecnico',
]

// ----------------------------------------------------------------- texto

const LESSONS_SECTION = /<section\b[^>]*\sid\s*=\s*["']lecciones["'][^>]*>[\s\S]*?<\/section>/i

function stripNonContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
}

/** Normaliza para comparar: comillas rectas, espacios colapsados, sin espacio junto a + ni a %, minusculas. */
export function norm(text) {
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\+\s+/g, '+')
    .replace(/\s+%/g, '%')
    .trim()
    .toLowerCase()
}

function visible(html) {
  return norm(decodeEntities(stripNonContent(html).replace(/<[^>]+>/g, ' ')))
}

/** Texto visible del caso SIN la seccion de lecciones. */
export function caseText(html) {
  const main = html.match(/<main\b[\s\S]*<\/main>/i)
  return visible((main ? main[0] : html).replace(LESSONS_SECTION, ' '))
}

/** Textos de los h3 de la seccion de lecciones (normalizados). */
export function lessonH3s(html) {
  const section = html.match(LESSONS_SECTION)
  if (!section) return []
  return [...section[0].matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) => visible(m[1]))
}

// ----------------------------------------------------------------- comprobaciones

/** Fallos de una leccion contra el texto de su caso en un idioma. Devuelve [] si todo esta. */
export function figureFailures(lesson, text, locale) {
  const out = []
  for (const f of lesson.figures) {
    const frag = locale === 'en' ? (f.textEn ?? f.text) : f.text
    if (!text.includes(norm(frag))) out.push(`la cifra o frase "${frag}" no aparece en el caso`)
    if (f.pct !== undefined) {
      const calc = Math.round(((f.to - f.from) / f.from) * 100)
      if (calc !== f.pct) out.push(`el porcentaje de "${frag}" no recalcula (${f.from} a ${f.to} da ${calc}, no ${f.pct})`)
      const shown = `${f.pct > 0 ? '+' : ''}${f.pct}%`
      if (!text.includes(shown)) out.push(`el caso no muestra el porcentaje ${shown} de "${frag}"`)
    }
  }
  return out
}

/** Con --expect-loaded: cada titulo de leccion debe estar como h3 del caso. */
export function loadedFailures(lessons, html, locale) {
  const h3s = lessonH3s(html)
  const out = []
  for (const l of lessons) {
    const title = norm(l[locale].title)
    if (!h3s.includes(title)) out.push(`el titulo "${l[locale].title}" no aparece como h3 en la seccion de lecciones`)
  }
  return out
}

/** Carga CASE_LESSONS del archivo de datos TypeScript con tsx (solo lectura de un archivo del repo). */
export function loadCaseLessons() {
  const code = "import('./scripts/db/data/56-case-lessons.ts').then((m) => console.log(JSON.stringify(m.CASE_LESSONS)))"
  const out = execFileSync(TSX, ['-e', code], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  return JSON.parse(out.trim().split('\n').pop())
}

// ----------------------------------------------------------------- autoprueba

function selftest() {
  let bad = 0
  const expect = (label, ok, detail = '') => {
    if (ok) console.log(`PASS selftest ${label}`)
    else {
      bad += 1
      console.log(`FAIL selftest ${label}${detail ? `: ${detail}` : ''}`)
    }
  }
  const lesson = {
    n: 1,
    es: { title: 'Titulo uno', body: 'Cuerpo' },
    en: { title: 'Title one', body: 'Body' },
    figures: [
      { text: '47,108' },
      { text: '86,000', from: 47108, to: 86000, pct: 83 },
      { text: 'decenas de artículos', textEn: 'Dozens of articles' },
    ],
    status: 'propuesto',
  }
  const page = (body, lessons = '') =>
    `<html><head><script>var x="47,108"</script></head><body><main>${body}${lessons}</main></body></html>`
  const goodEs = page('<p>El despacho tenia 47,108 clics</p><p>Antes</p><p>47,108</p><p>86,000</p><p>+ 83 %</p><p>Decenas de artículos sobre</p>')
  const goodEn = page('<p>47,108 clicks</p><p>86,000</p><p>+83%</p><p>Dozens of articles on</p>')
  expect('caso bueno en es no da fallos', figureFailures(lesson, caseText(goodEs), 'es').length === 0, figureFailures(lesson, caseText(goodEs), 'es').join(' | '))
  expect('caso bueno en en usa textEn y no da fallos', figureFailures(lesson, caseText(goodEn), 'en').length === 0, figureFailures(lesson, caseText(goodEn), 'en').join(' | '))
  expect('cifra ausente da fallo', figureFailures(lesson, caseText(page('<p>47,108</p><p>+83%</p><p>Decenas de artículos</p>')), 'es').some((m) => /86,000/.test(m)))
  expect('formato de otro idioma da fallo (47.108)', figureFailures(lesson, caseText(page('<p>47.108</p><p>86.000</p><p>+83%</p><p>decenas de artículos</p>')), 'es').length > 0)
  expect('la cifra solo dentro de script no cuenta', figureFailures({ ...lesson, figures: [{ text: 'solo en script' }] }, caseText(page('<script>solo en script</script><p>otra cosa</p>')), 'es').length > 0)
  expect('porcentaje que el caso no muestra da fallo', figureFailures(lesson, caseText(page('<p>47,108</p><p>86,000</p><p>Decenas de artículos</p>')), 'es').some((m) => /porcentaje \+83%/.test(m)))
  expect('porcentaje mal calculado da fallo', figureFailures({ ...lesson, figures: [{ text: '86,000', from: 47108, to: 86000, pct: 90 }] }, caseText(goodEs), 'es').some((m) => /no recalcula/.test(m)))
  const loaded = `<section id="lecciones"><ul><li><h3>Titulo uno</h3><p>47,108 y 86,000 en la propia leccion</p></li></ul></section>`
  expect('la seccion de lecciones no respalda las cifras del caso', figureFailures(lesson, caseText(page('<p>Decenas de artículos</p>', loaded)), 'es').some((m) => /47,108/.test(m)))
  expect('--expect-loaded acepta el titulo como h3', loadedFailures([lesson], page('', loaded), 'es').length === 0)
  expect('--expect-loaded falla sin la seccion', loadedFailures([lesson], page('<p>sin lecciones</p>'), 'es').length === 1)
  expect('--expect-loaded falla con otro titulo', loadedFailures([lesson], page('', loaded.replace('Titulo uno', 'Otro')), 'es').length === 1)
  expect('norm unifica "+ 83 %" con "+83%"', norm('+ 83 %') === norm('+83%'))
  expect('los 7 slugs esperados son unicos', new Set(EXPECTED_SLUGS).size === 7)
  console.log(bad === 0 ? 'PASS selftest 56-cases-lessons-live' : `FAIL selftest 56-cases-lessons-live (${bad})`)
  return bad === 0 ? 0 : 1
}

// ----------------------------------------------------------------- principal

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--selftest')) return selftest()

  const base = (process.env.BASE_URL ?? '').replace(/\/$/, '')
  if (!base) {
    console.error('FAIL BASE_URL es obligatoria (por ejemplo https://dev.juan-tech.com)')
    return 1
  }
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
  const expectLoaded = args.includes('--expect-loaded')
  if (args.includes('--only') && (!only || only.startsWith('--'))) {
    console.error('FAIL --only necesita el slug de un caso')
    return 1
  }

  let data
  try {
    data = loadCaseLessons()
  } catch (err) {
    console.error(`FAIL no se pudo leer scripts/db/data/56-case-lessons.ts: ${err.message}`)
    return 1
  }

  const slugs = only ? [only] : [...new Set([...EXPECTED_SLUGS, ...Object.keys(data)])]
  let failures = 0
  for (const slug of slugs) {
    const lessons = data[slug]
    if (!lessons || lessons.length === 0) {
      console.log(`SKIP ${slug}: sin lecciones en 56-case-lessons.ts`)
      continue
    }
    for (const locale of ['es', 'en']) {
      const url = `${base}${locale === 'en' ? '/en' : ''}/case-studies/${slug}`
      const page = await getPage(url)
      const label = `${slug} ${locale}`
      if (page.status !== 200) {
        failures += 1
        console.log(`FAIL ${label}: ${url} responde ${page.status}${page.error ? ` (${page.error})` : ''}`)
        continue
      }
      const text = caseText(page.html)
      const problems = []
      for (const lesson of lessons) {
        for (const msg of figureFailures(lesson, text, locale)) problems.push(`leccion ${lesson.n}: ${msg}`)
      }
      if (expectLoaded) problems.push(...loadedFailures(lessons, page.html, locale))
      if (problems.length === 0) {
        console.log(`PASS ${label}: ${lessons.length} lecciones con todas sus cifras en el caso${expectLoaded ? ' y cargadas como h3' : ''}`)
      } else {
        failures += problems.length
        for (const p of problems) console.log(`FAIL ${label}: ${p}`)
      }
    }
  }
  console.log(failures === 0 ? 'PASS 56-cases-lessons-live' : `FAIL 56-cases-lessons-live (${failures})`)
  return failures === 0 ? 0 : 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) process.exit(await main())
