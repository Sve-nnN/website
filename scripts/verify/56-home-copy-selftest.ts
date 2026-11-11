/**
 * Autoprueba del copy de la home y de Contacto (plan 56-09). No usa red ni base de datos.
 *
 *   node_modules/.bin/tsx scripts/verify/56-home-copy-selftest.ts
 *
 * Parte ES: estructura contra el global home-page (D-23: sin title ni meta de pagina), decisiones
 * D-22 aplicadas, sin notas "Bueno: hasta", sin la frase de Googlebot, cierre exacto de D-15,
 * lote 1 de CTAs aprobado, rayas, marcadores y href.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDecision } from '../db/data/56-content-decisions'
import { CTA_LOTE1 } from '../db/data/56-cta-lote1'
import {
  DECISIONS,
  EN_FALLBACKS,
  HOME_COPY_EN,
  HOME_COPY_ES,
  NON_LOCALIZED_KEYS,
  buildHomeCopy,
  splitHeroTitle,
  stripGooglebot,
} from '../db/data/56-home-copy'
import { HERO_MUESTRA_ESTADISTICA, HOME_DECISIONS } from '../db/data/56-options-home'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const MARKER_OPEN = '{'.repeat(2)

let bad = 0
function expect(label: string, ok: boolean, detail = '') {
  if (ok) console.log(`PASS ${label}`)
  else {
    bad += 1
    console.log(`FAIL ${label}${detail ? `: ${detail}` : ''}`)
  }
}

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

/** Todas las cadenas de un arbol con su ruta. */
function strings(value: unknown, path = '', out: [string, string][] = []): [string, string][] {
  if (typeof value === 'string') out.push([path, value])
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) strings(v, path ? `${path}.${k}` : k, out)
  }
  return out
}

/** Todas las claves de un arbol. */
function keysOf(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keysOf(v, out))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.add(k)
      keysOf(v, out)
    }
  }
  return out
}

const dec = (id: string, lang: 'es' | 'en') => resolveDecision(HOME_DECISIONS[id])?.[lang]
const row = (id: string) => CTA_LOTE1.find((r) => r.id === id)

// --- D-23: las claves del copy son un subconjunto de los campos del global home-page ---
const globalSrc = readFileSync(join(ROOT, 'src/globals/HomePage/index.ts'), 'utf8')
const globalNames = new Set<string>()
for (const m of globalSrc.matchAll(/(?:name:\s*|\b(?:text|area|num)\()\s*['"]([A-Za-z0-9_]+)['"]/g)) globalNames.add(m[1])
const topLevel = Object.keys(HOME_COPY_ES)
const FORBIDDEN_TOP = ['title', 'meta', 'metaTitle', 'metaDescription', 'description', 'seo']
expect('D-23: el copy no trae title ni meta de pagina en el nivel superior', !topLevel.some((k) => FORBIDDEN_TOP.includes(k)), topLevel.join(', '))
expect('D-23: cada clave del copy ES existe en el global home-page', [...keysOf(HOME_COPY_ES)].every((k) => globalNames.has(k)), [...keysOf(HOME_COPY_ES)].filter((k) => !globalNames.has(k)).join(', '))
expect('D-23: el nivel superior del copy son grupos del global', topLevel.every((k) => globalNames.has(k)), topLevel.join(', '))
expect('D-23: no hay claves meta en ningun nivel', ![...keysOf(HOME_COPY_ES)].some((k) => /^meta/i.test(k)))

// --- Decisiones D-22 aplicadas ---
expect('hero: titulo A en dos lineas', HOME_COPY_ES.hero.titleLine1 === 'Consultor SEO técnico' && HOME_COPY_ES.hero.titleLine2 === 'que también programa', `${HOME_COPY_ES.hero.titleLine1} / ${HOME_COPY_ES.hero.titleLine2}`)
expect('hero: las dos lineas juntas son el titulo de la decision', `${HOME_COPY_ES.hero.titleLine1} ${HOME_COPY_ES.hero.titleLine2}` === dec('D-22a', 'es'))
expect('hero: la etiqueta "Ingeniero de software" se conserva', HOME_COPY_ES.hero.eyebrow.startsWith('Ingeniero de software'))
expect('hero: texto 2 (D-22b)', HOME_COPY_ES.hero.lead === dec('D-22b', 'es') && /más de 18 clientes internacionales/.test(HOME_COPY_ES.hero.lead))
expect('hero: sin estadistica (D-22c ninguna)', HERO_MUESTRA_ESTADISTICA === false && HOME_COPY_ES.hero.statValue === '' && HOME_COPY_ES.hero.statCaption === '')
expect('tagline 2 (D-22d)', HOME_COPY_ES.tagline === dec('D-22d', 'es') && HOME_COPY_ES.tagline.startsWith('Diagnóstico, corrección y medición'))
expect('medicion: titulo 3 y texto 2 (D-22e y D-22f)', HOME_COPY_ES.vitals.title === 'Cómo ve Google la velocidad de tu sitio' && HOME_COPY_ES.vitals.lead === 'Las reviso en cada auditoría porque marcan cómo viven tu sitio Google y tus visitantes.')
expect('servicios: lead 3 (D-22g)', HOME_COPY_ES.services.lead === 'Desde la auditoría hasta el código en producción, con resultados que puedes medir.')
expect('servicios: item SEO tecnico con el texto nuevo', HOME_COPY_ES.services.items[0].body === 'Audito rastreo, indexación y datos estructurados, y corrijo lo que impide que Google entienda y posicione tus páginas.')

// --- Lo que Juan pidio quitar ---
expect('medicion: las notas "Bueno: hasta" no existen', HOME_COPY_ES.vitals.items.every((v) => v.note === '') && !strings(HOME_COPY_ES).some(([, v]) => /Bueno: hasta/.test(v)))
expect('medicion: se conservan name, desc, value y label de los cuatro items', HOME_COPY_ES.vitals.items.length === 4 && HOME_COPY_ES.vitals.items.every((v) => v.name && v.desc && v.value && v.label))
expect('medicion: las descripciones de Core Web Vitals no cambiaron', HOME_COPY_ES.vitals.items[0].desc === 'Cuánto tarda en pintarse el elemento principal' && HOME_COPY_ES.vitals.items[3].desc === 'Cuánto tarda el servidor en dar el primer byte')
expect('servicios: la frase de Googlebot no aparece en ningun texto', !strings(HOME_COPY_ES).some(([, v]) => /googlebot/i.test(v)))
expect('stripGooglebot deja la primera oracion sin agregar texto', stripGooglebot('Trabajo yo mismo en cada proyecto. Empiezo por lo que ve Googlebot y de ahí decido qué tocar.') === 'Trabajo yo mismo en cada proyecto.')

// --- Cierre y lote 1 de CTAs ---
expect('cierre ES exacto de D-15', HOME_COPY_ES.cta.lead === '¿Tienes un proyecto en mente? Cuéntame de qué se trata.' && !/empiezo por mirar/.test(HOME_COPY_ES.cta.lead))
expect('cierre: titulo del lote 1', HOME_COPY_ES.cta.title === 'Hablemos de tu sitio')
const LOTE_EN_GLOBAL: [string, string][] = [
  ['hero-cta', HOME_COPY_ES.hero.ctaLabel],
  ['services-cta', HOME_COPY_ES.services.ctaLabel],
  ['cierre-titulo', HOME_COPY_ES.cta.title],
  ['cierre-lead', HOME_COPY_ES.cta.lead],
  ['cases-cta', HOME_COPY_ES.cases.ctaLabel],
  ['sites-cta', HOME_COPY_ES.sites.ctaLabel],
  ['contact-response-note', HOME_COPY_ES.contact.infoRows[0].text],
]
for (const [id, value] of LOTE_EN_GLOBAL) {
  const r = row(id)
  expect(`lote 1 ${id}: el copy usa el texto aprobado`, r?.estado === 'aprobado' && r.es === value, `${r?.es} vs ${value}`)
}
expect('lote 1: los pasos de Contacto siguen con el valor vigente y Juan los aprobo tal cual (2026-11-10)', HOME_COPY_ES.contact.steps.map((s) => s.title).join('|') === 'Me cuentas el proyecto|Miro qué ve Google hoy|Te digo por dónde empezar' && ['contact-step-1', 'contact-step-2', 'contact-step-3'].every((id) => row(id)?.estado === 'aprobado'))
expect('lote 1: los CTA del header, de la oferta de auditoria y del auditor no estan en el copy (los lee master)', !JSON.stringify(HOME_COPY_ES).includes('Pedir la auditoría'))

// --- Rayas, marcadores y href ---
const all = strings(HOME_COPY_ES)
expect('sin raya larga ni media en el copy ES', !all.some(([, v]) => v.includes(EM_DASH) || v.includes(EN_DASH)))
expect('sin marcadores de ranura ni "pega aqui" en el copy ES', !all.some(([, v]) => v.includes(MARKER_OPEN) || /pega aquí/i.test(v) || /\[\[|\bTODO\b|\bFIXME\b/.test(v)))
const hrefOk = (h: string) => h.startsWith('#') || h.startsWith('https://') || h.startsWith('mailto:')
expect('ctaHref empieza por #, https o mailto', hrefOk(HOME_COPY_ES.hero.ctaHref), HOME_COPY_ES.hero.ctaHref)
expect('la regla de href rechaza javascript:, data: y http:', !['javascript:alert(1)', 'data:text/html,x', 'http://x.test', '//x.test'].some(hrefOk))

// --- Titulos sin punto ni coma (misma regla de 54) ---
const titleKeys = ['title', 'stepsTitle', 'faqTitle']
const badTitles = all.filter(([p, v]) => titleKeys.includes(p.split('.').pop() ?? '') && !p.includes('[') && /[.,]/.test(v))
expect('titulos de seccion y lineas del hero sin punto ni coma', badTitles.length === 0 && !/[.,]/.test(HOME_COPY_ES.hero.titleLine1 + HOME_COPY_ES.hero.titleLine2), JSON.stringify(badTitles))

// --- El titulo se divide bien para todas las opciones ---
const SPLITS: [string, 'es' | 'en', string, string][] = [
  ['Consultor SEO técnico que corrige el problema en el código', 'es', 'Consultor SEO técnico', 'que corrige el problema en el código'],
  ['Consultoría SEO técnica con ingeniería detrás', 'es', 'Consultoría SEO técnica', 'con ingeniería detrás'],
  ['Technical SEO consultant who also codes', 'en', 'Technical SEO consultant', 'who also codes'],
  ['Technical SEO consulting backed by engineering', 'en', 'Technical SEO consulting', 'backed by engineering'],
]
expect('splitHeroTitle divide las opciones B a E sin perder texto', SPLITS.every(([t, l, a, b]) => { const [x, y] = splitHeroTitle(t, l); return x === a && y === b && `${x} ${y}` === t }))

// --- Construccion ---
expect('buildHomeCopy("es") es estable y no comparte referencias', JSON.stringify(buildHomeCopy('es')) === JSON.stringify(HOME_COPY_ES) && buildHomeCopy('es') !== HOME_COPY_ES)
expect('conteos del copy ES iguales a los de la 54', HOME_COPY_ES.services.items.length === 5 && HOME_COPY_ES.process.steps.length === 4 && HOME_COPY_ES.vitals.items.length === 4 && HOME_COPY_ES.faq.items.length === 5 && HOME_COPY_ES.contact.steps.length === 3 && HOME_COPY_ES.contact.infoRows.length === 3)
expect('HOME-EN existe como decision propuesta con gate aprobado', DECISIONS.length === 1 && DECISIONS[0].id === 'HOME-EN' && DECISIONS[0].status === 'propuesto' && DECISIONS[0].gate === 'aprobado')

// =====================  Parte EN (lote 2 EN, D-14)  =====================

/** El ES sin los campos no localizados, para comparar contra el EN. */
function stripNl(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNl)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if ((NON_LOCALIZED_KEYS as readonly string[]).includes(k)) continue
      out[k] = stripNl(v)
    }
    return out
  }
  return value
}

/** Forma: claves y largo de las listas, sin mirar los valores. */
function shape(value: unknown): Json {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]))
  return typeof value === 'string' ? 's' : 'n'
}

const esLocalized = stripNl(HOME_COPY_ES)
// Test 1: mismas claves y mismas longitudes de lista en los campos localizados.
expect('EN tiene las mismas claves y largos de lista que el ES localizado', JSON.stringify(shape(HOME_COPY_EN)) === JSON.stringify(shape(esLocalized)))

// Test 2: centinela y lead.
expect('tagline EN no esta vacio (centinela del respaldo de idioma)', typeof HOME_COPY_EN.tagline === 'string' && HOME_COPY_EN.tagline.trim().length > 0)
expect('hero.lead EN no esta vacio', Boolean(HOME_COPY_EN.hero?.lead?.trim()))
expect('tagline EN es la decision D-22d en ingles', HOME_COPY_EN.tagline === dec('D-22d', 'en'))

// Test 3: nada quedo en espanol (cadena EN identica a su ES con mas de tres palabras).
const esFlat = new Map(strings(esLocalized))
const sameAsEs = strings(HOME_COPY_EN).filter(([p, v]) => v.trim().split(/\s+/).length > 3 && esFlat.get(p) === v)
expect('ninguna cadena EN larga es identica a su ES', sameAsEs.length === 0, JSON.stringify(sameAsEs))
expect('ningun EN cayo al ES por falta de traduccion', EN_FALLBACKS.length === 0, EN_FALLBACKS.join(', '))
const accented = strings(HOME_COPY_EN).filter(([, v]) => /[¿¡ñáéíóú]/i.test(v))
expect('el EN no trae signos ni letras del espanol', accented.length === 0, JSON.stringify(accented))

// Test 4: cierre EN exacto.
expect('cierre EN exacto de D-15', HOME_COPY_EN.cta?.lead === 'Have a project in mind? Tell me what it is about.')
expect('cierre EN: titulo del lote 1', HOME_COPY_EN.cta?.title === "Let's talk about your site")

// CTA del lote 1 en EN, tal cual los aprobo Juan.
const EN_LOTE: [string, string | undefined][] = [
  ['Request a 360 audit', HOME_COPY_EN.hero?.ctaLabel],
  ["Let's talk about your site", HOME_COPY_EN.services?.ctaLabel],
  ['See all case studies', HOME_COPY_EN.cases?.ctaLabel],
  ['See all websites', HOME_COPY_EN.sites?.ctaLabel],
  ['I usually reply within 48 hours.', HOME_COPY_EN.contact?.infoRows?.[0]?.text],
]
expect('los CTA del lote 1 aprobados salen tal cual en EN', EN_LOTE.every(([want, got]) => want === got), JSON.stringify(EN_LOTE.filter(([w, g]) => w !== g)))
expect('hero EN: titulo A de Juan en dos lineas', HOME_COPY_EN.hero?.titleLine1 === 'Technical SEO consultant' && HOME_COPY_EN.hero?.titleLine2 === 'who also codes')
expect('hero EN: texto 2 y sin estadistica', HOME_COPY_EN.hero?.lead === dec('D-22b', 'en') && HOME_COPY_EN.hero?.statValue === '' && HOME_COPY_EN.hero?.statCaption === '')
expect('medicion EN: titulo 3, texto 2 y sin notas', HOME_COPY_EN.vitals?.title === dec('D-22e', 'en') && HOME_COPY_EN.vitals?.lead === dec('D-22f', 'en') && (HOME_COPY_EN.vitals?.items ?? []).every((v) => v.note === ''))
expect('servicios EN: lead 3 e item SEO tecnico nuevo, sin Googlebot', HOME_COPY_EN.services?.lead === dec('D-22g', 'en') && HOME_COPY_EN.services?.items?.[0]?.body === dec('D-22g-item', 'en') && !strings(HOME_COPY_EN).some(([, v]) => /googlebot/i.test(v)))

// Test 5: rayas y marcadores en EN, y los campos no localizados no se repiten.
const allEn = strings(HOME_COPY_EN)
expect('sin raya larga ni media en el copy EN', !allEn.some(([, v]) => v.includes(EM_DASH) || v.includes(EN_DASH)))
expect('sin marcadores en el copy EN', !allEn.some(([, v]) => v.includes(MARKER_OPEN) || /pega aquí/i.test(v) || /\[\[|\bTODO\b|\bFIXME\b/.test(v)))
const nlKeys = [...keysOf(HOME_COPY_EN)].filter((k) => (NON_LOCALIZED_KEYS as readonly string[]).includes(k))
expect('el EN no lleva icon, tags, servicePage, porcentajes ni ctaHref', nlKeys.length === 0, nlKeys.join(', '))
expect('D-23: el EN tampoco trae title ni meta de pagina y sus claves existen en el global', !Object.keys(HOME_COPY_EN).some((k) => FORBIDDEN_TOP.includes(k)) && [...keysOf(HOME_COPY_EN)].every((k) => globalNames.has(k)))
const badTitlesEn = allEn.filter(([p, v]) => titleKeys.includes(p.split('.').pop() ?? '') && !p.includes('[') && /[.,]/.test(v))
expect('titulos EN sin punto ni coma', badTitlesEn.length === 0 && !/[.,]/.test((HOME_COPY_EN.hero?.titleLine1 ?? '') + (HOME_COPY_EN.hero?.titleLine2 ?? '')), JSON.stringify(badTitlesEn))
expect('no se traducen las etiquetas tecnicas', ['LCP', 'CLS', 'TBT', 'TTFB'].every((n, i) => HOME_COPY_EN.vitals?.items?.[i]?.name === n))
expect('los pasos de Contacto EN son traduccion fiel y quedan propuestos en HOME-EN', HOME_COPY_EN.contact?.steps?.[0]?.title === 'You tell me about the project' && DECISIONS[0].status === 'propuesto')

if (bad > 0) {
  console.log(`FAIL 56-home-copy-selftest: ${bad} caso(s)`)
  process.exit(1)
}
console.log('PASS 56-home-copy-selftest')
