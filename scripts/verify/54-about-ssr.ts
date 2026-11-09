/**
 * Autoprueba de render de Sobre mi (fase 54, plan 54-13).
 *
 * Pasa el copy sembrado (ABOUT_COPY_ES) y un autor, ponencias y conteos de
 * prueba por `assembleAboutData`, renderiza AboutView con el arnes de servidor
 * y comprueba la estructura del HTML. No toca base ni red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-about-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { AboutView } from '../../src/components/pages/AboutView'
import {
  assembleAboutData,
  formatDateRange,
  splitParagraphs,
  splitTalkTitle,
  type AboutData,
} from '../../src/lib/about-data'
import { ABOUT_COPY_ES } from '../db/data/54-about-copy'
import { checkAboutPage } from './54-about.mjs'
import { countOf, hasId, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

// ---------------------------------------------------------------------------
// Fixtures: nombres y URLs de prueba, nunca datos reales.
// ---------------------------------------------------------------------------
const AUTHOR = {
  name: 'Autora de Prueba',
  bio: 'Primer parrafo de la bio de prueba.\n\nSegundo parrafo de la bio de prueba.',
  yearsExperience: 4,
  education: [
    { degree: 'Carrera de prueba', institution: 'Universidad de Prueba', startDate: '2022-05-01T00:00:00.000Z', endDate: '2028-08-01T00:00:00.000Z' },
    { degree: 'Tecnico de prueba', institution: 'Instituto de Prueba', startDate: '2018-02-01T00:00:00.000Z', endDate: null },
  ],
}

const EVENTS = [
  { title: 'Taller de prueba (por Organizador de Prueba)', role: 'Co-instructor de prueba', description: 'Descripcion del taller de prueba.', location: 'Ciudad de Prueba', attendeeCount: 18, flyer: null },
  { title: 'Congreso de prueba', role: 'Ponente de prueba', description: 'Descripcion del congreso de prueba.', location: 'Otra Ciudad', attendeeCount: 100, flyer: null },
]

const MEDIA = {
  url: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/foto-de-prueba.jpg',
  width: 1122,
  height: 1402,
  alt: 'Texto alternativo de prueba de la foto',
}

const COPY = { ...ABOUT_COPY_ES, hero: { ...ABOUT_COPY_ES.hero, photo: MEDIA } }

type Overrides = Partial<{
  about: { data: Record<string, unknown>; isFallback: boolean } | null
  author: typeof AUTHOR | null
  events: typeof EVENTS | null
  counts: { seo: number | null; dev: number | null } | null
}>

function build(overrides: Overrides = {}, locale: 'es' | 'en' = 'es'): AboutData {
  const hasKey = (key: keyof Overrides) => Object.prototype.hasOwnProperty.call(overrides, key)
  return assembleAboutData({
    about: (hasKey('about') ? overrides.about : { data: COPY, isFallback: false }) as never,
    author: hasKey('author') ? (overrides.author as never) : AUTHOR,
    events: hasKey('events') ? (overrides.events as never) : EVENTS,
    counts: hasKey('counts') ? overrides.counts ?? null : { seo: 15, dev: 13 },
    locale,
  })
}

function renderRaw(data: AboutData, locale: 'es' | 'en' = 'es'): string {
  return renderToHtml(createElement(AboutView, { data, locale }), locale)
}

/** HTML sin las etiquetas style de Emotion (para contar marcado sin ruido). */
function render(data: AboutData, locale: 'es' | 'en' = 'es'): string {
  return renderRaw(data, locale).replace(/<style[\s\S]*?<\/style>/g, '')
}

// ---------------------------------------------------------------------------
// Mapeo y helpers puros
// ---------------------------------------------------------------------------
{
  const range = formatDateRange('2022-05-01T00:00:00.000Z', '2028-08-01T00:00:00.000Z', 'es')
  check(range.from === 'may 2022' && range.to === 'ago 2028', 'formatDateRange es: mes abreviado y ano', `dio ${JSON.stringify(range)}`)
  const open = formatDateRange('2018-02-01T00:00:00.000Z', null, 'en')
  check(open.from === 'Feb 2018' && open.to === null, 'formatDateRange en y fin abierto: to es null', `dio ${JSON.stringify(open)}`)
  check(formatDateRange(null, '2020-08-01T00:00:00.000Z', 'es').from === '', 'formatDateRange sin inicio: from vacio', 'devolvio un inicio')
  check(formatDateRange('no es fecha', null, 'es').from === '', 'formatDateRange con fecha invalida: from vacio', 'devolvio un inicio')
  const sept = formatDateRange('2022-09-01T00:00:00.000Z', null, 'es').from
  check(!/\s{2,}/.test(sept) && !sept.includes('.'), 'formatDateRange: sin dos espacios ni punto', `dio "${sept}"`)

  check(splitParagraphs('Uno.\n\nDos.\n\n\nTres.').length === 3, 'splitParagraphs separa por linea en blanco', 'no dio tres parrafos')
  check(splitParagraphs(null).length === 0 && splitParagraphs('  ').length === 0, 'splitParagraphs sin texto da lista vacia', 'no dio vacio')
  const talk = splitTalkTitle('Taller en Lima (por DinoRANK)')
  check(talk.title === 'Taller en Lima' && talk.by === 'DinoRANK', 'splitTalkTitle separa el organizador', `dio ${JSON.stringify(talk)}`)
  check(splitTalkTitle('Caracas SEO Fest').by === null, 'splitTalkTitle sin sufijo deja el titulo entero', 'invento un organizador')

  const data = build()
  check(data.name === AUTHOR.name, 'el h1 sale del nombre del autor', `dio ${data.name}`)
  check(data.experience?.stages.length === 5, 'cinco etapas mapeadas', `dio ${data.experience?.stages.length}`)
  check(data.experience?.stages[2]?.when?.startsWith('{{pendiente}}') === true, 'la fecha pendiente llega tal cual', 'se perdio el marcador')
  check(data.experience?.stages[4]?.link?.external === true, 'el enlace https de la etapa es externo', 'no se marco externo')
  check(data.specialties?.items.length === 4, 'cuatro areas mapeadas', `dio ${data.specialties?.items.length}`)
  check(data.education?.items[1]?.dates?.to === null, 'una educacion sin fin queda abierta', 'to no es null')
  check(data.talks?.items[0]?.by === 'Organizador de Prueba' && data.talks.items[0].title === 'Taller de prueba', 'la ponencia separa titulo y organizador', 'no separo')

  const evil = build({ about: { data: { ...COPY, experience: { ...COPY.experience, stages: [{ role: 'Rol', linkLabel: 'Ver', linkHref: 'javascript:alert(1)' }] } }, isFallback: false } })
  check(evil.experience?.stages[0]?.link === null, 'T-54-53: un href javascript: se descarta', 'el enlace sobrevivio')
}

// ---------------------------------------------------------------------------
// Estructura de la vista
// ---------------------------------------------------------------------------
{
  const html = render(build())
  check(countOf(html, /<h1[\s>]/) === 1, 'un solo h1', `h1 = ${countOf(html, /<h1[\s>]/)}`)
  check(textOf(html).includes(AUTHOR.name), 'el h1 lleva el nombre del autor', 'no aparece el nombre')
  check(!/<main[\s>]/.test(html), 'ninguna apertura de main', 'la vista declara main')

  const levels = headingLevels(html)
  const jumps = levels.some((l, i) => i > 0 && l - levels[i - 1] > 1)
  check(!jumps, 'jerarquia de encabezados sin saltos', `niveles ${levels.join(',')}`)

  // Timeline: lista con cinco items y aria-label.
  const tl = /<ul[^>]*MuiTimeline-root[^>]*>/.exec(html)
  check(tl !== null, 'el timeline se renderiza como ul', 'no hay ul MuiTimeline-root')
  check(tl !== null && /aria-label="Recorrido profesional"/.test(tl[0]), 'el timeline tiene aria-label del recorrido', 'falta aria-label')
  check(countOf(html, /<li[^>]*MuiTimelineItem-root/) === 5, 'el timeline tiene cinco items', `items = ${countOf(html, /<li[^>]*MuiTimelineItem-root/)}`)
  check(countOf(html, /<h3[\s>]/) >= 5, 'cada etapa tiene su h3', `h3 = ${countOf(html, /<h3[\s>]/)}`)

  // Punto: relleno si es la etapa actual, aro si no. Se lee de las reglas de Emotion.
  const raw = renderRaw(build())
  const css = (raw.match(/<style[\s\S]*?<\/style>/g) ?? []).join('\n')
  const dotCss = (current: boolean): string => {
    const m = new RegExp(`<span[^>]*class="([^"]*MuiTimelineDot-root[^"]*)"[^>]*data-current="${current}"`).exec(raw)
    if (!m) return ''
    return m[1].split(/\s+/).map((c) => (new RegExp(`\\.${c.replace(/[^\w-]/g, '\\$&')}\\{([^}]*)\\}`).exec(css)?.[1] ?? '')).join(';')
  }
  const currentDot = dotCss(true)
  const pastDot = dotCss(false)
  check(currentDot !== '' && pastDot !== '', 'los puntos llevan data-current', 'no se encontro el punto actual o el pasado')
  check(!/3px solid/.test(currentDot) && /3px solid/.test(pastDot), 'la etapa actual tiene el punto relleno y las otras el aro de 3px', `actual="${currentDot.slice(0, 120)}" pasado="${pastDot.slice(0, 120)}"`)
  check(countOf(raw, /data-current="true"/) === 2 && countOf(raw, /data-current="false"/) === 3, 'dos etapas actuales y tres pasadas', 'conteo de data-current distinto')

  // Fecha pendiente: aparece en el texto, jamas en aria-label ni title.
  check(textOf(html).includes('{{pendiente}}'), 'la fecha pendiente aparece en el texto', 'no se renderizo el marcador')
  check(!/(aria-label|title|aria-labelledby)="[^"]*pendiente/.test(raw), 'la fecha pendiente no entra a ningun aria-label ni title', 'el marcador esta en un atributo')
  check(!/aria-label="[^"]*\{\{/.test(raw), 'ningun aria-label lleva llaves', 'hay llaves en un aria-label')

  // Foto.
  const fig = /<figure[\s\S]*?<\/figure>/.exec(html)
  check(fig !== null && /<img[^>]*alt="Texto alternativo de prueba de la foto"/.test(fig[0]), 'con foto y alt hay figure con img y alt', 'falta la figura o el alt')
  check(fig !== null && /width="1122"/.test(fig[0]) && /height="1402"/.test(fig[0]), 'la foto declara ancho y alto', 'faltan width o height')
  check(fig !== null && /loading="eager"/.test(fig[0]) && /fetchpriority="high"/i.test(fig[0]), 'la foto es eager con fetchPriority high', 'falta loading o fetchpriority')
  const noAlt = build({ about: { data: { ...COPY, hero: { ...COPY.hero, photo: { ...MEDIA, alt: null } } }, isFallback: false } })
  const htmlNoAlt = render(noAlt)
  check(!/<figure/.test(htmlNoAlt) && !/<img/.test(htmlNoAlt), 'sin alt no hay figura ni img', 'se renderizo la foto')
  const noPhoto = render(build({ about: { data: ABOUT_COPY_ES, isFallback: false } }))
  check(!/<figure/.test(noPhoto), 'sin foto no hay figura', 'se renderizo la figura')

  // Contadores.
  const dl = /<dl[\s\S]*?<\/dl>/.exec(html)
  check(dl !== null && countOf(dl[0], /<dt[\s>]/) === 3 && countOf(dl[0], /<dd[\s>]/) === 3, 'tres contadores con dt y dd', 'no hay tres pares')
  check(dl !== null && dl[0].includes('4+') && dl[0].includes('>15<') && dl[0].includes('>13<'), 'contadores: 4+, 15 y 13', 'faltan cifras')
  const noYears = render(build({ author: { ...AUTHOR, yearsExperience: null as never } }))
  check(!noYears.includes('4+') && !textOf(noYears).includes('años de experiencia profesional'), 'sin años el contador no se renderiza', 'quedo la tarjeta de años')
  const noCounts = render(build({ author: { ...AUTHOR, yearsExperience: null as never }, counts: null }))
  check(!/<dl[\s>]/.test(noCounts), 'sin ningun contador no queda dl', 'quedo una dl vacia')

  // Botones de la bio.
  check(html.includes('href="/servicios"') && html.includes('href="/stack"'), 'es: botones a /servicios y /stack', 'faltan enlaces')
  check(!/href="\/stack"[^>]*target=/.test(html), 'Mi stack es interno: sin target', 'abre pestaña nueva')

  // Enlace externo de la etapa.
  check(/href="https:\/\/www\.aprendoclub\.com\/diplomado"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/.test(html), 'el enlace externo de la etapa lleva target y rel', 'falta target o rel')
  check(textOf(html).includes('se abre en otra pestaña'), 'el enlace externo lleva el sufijo de nueva pestaña', 'falta el sufijo')

  // Sin datos: no quedan secciones huerfanas.
  const empty = render(build({ about: null, author: AUTHOR, events: null, counts: null }))
  check(countOf(empty, /<h1[\s>]/) === 1 && !hasId(empty, 'about-experience-t'), 'sin global: queda el h1 y ninguna seccion huerfana', 'quedo una seccion')
  check(!/<ul[^>]*MuiTimeline-root/.test(empty), 'sin etapas no hay timeline', 'quedo el timeline')
}

// ---------------------------------------------------------------------------
// Secciones de la tarea 3: areas, educacion, ponencias, cierre y aviso EN
// ---------------------------------------------------------------------------
{
  const CTA = {
    title: 'Titulo del cierre de prueba',
    lead: 'Lead del cierre de prueba',
    email: 'correo@ejemplo.com',
    name: 'Autora de Prueba',
    avatarUrl: null,
    isFallback: false,
  }
  const renderCta = (data: AboutData, cta: typeof CTA | null, locale: 'es' | 'en' = 'es'): string =>
    renderToHtml(createElement(AboutView, { data, locale, cta }), locale).replace(/<style[\s\S]*?<\/style>/g, '')

  const html = renderCta(build(), CTA)

  // Areas: franja con lista de cuatro tarjetas.
  const areas = /<section[^>]*id="about-areas"[\s\S]*?<\/section>/.exec(html)
  check(areas !== null && countOf(areas[0], /<li[\s>]/) === 4, 'la lista de areas tiene cuatro tarjetas', `li = ${areas ? countOf(areas[0], /<li[\s>]/) : 'sin seccion'}`)
  check(areas !== null && countOf(areas[0], /<h3[\s>]/) === 4, 'cada area tiene su h3', 'faltan h3 en las areas')

  // Educacion con fechas armadas por dateRange y dateRangeOpen.
  const edu = /<section[^>]*id="about-education"[\s\S]*?<\/section>/.exec(html)
  check(edu !== null && countOf(edu[0], /<li[\s>]/) === 2, 'educacion: dos tarjetas en lista', 'no hay dos items')
  check(edu !== null && edu[0].includes('may 2022 a ago 2028'), 'educacion: fecha con dateRange', 'falta "may 2022 a ago 2028"')
  check(edu !== null && edu[0].includes('feb 2018 a hoy'), 'educacion: fecha abierta con dateRangeOpen', 'falta "feb 2018 a hoy"')
  check(!/\s{2,}(a|to)\s/.test(textOf(html)) && !/ {2}/.test(edu?.[0].replace(/<[^>]+>/g, '|') ?? ''), 'educacion: las fechas no traen dos espacios', 'hay dos espacios')

  // Ponencias.
  const talks = /<section[^>]*id="about-talks"[\s\S]*?<\/section>/.exec(html)
  check(talks !== null && countOf(talks[0], /<li[\s>]/) === 2, 'ponencias: dos tarjetas en lista', 'no hay dos items')
  check(talks !== null && talks[0].includes('por Organizador de Prueba'), 'ponencias: el organizador sale con about.by', 'falta "por ..."')
  check(talks !== null && talks[0].includes('18 asistentes') && talks[0].includes('100 asistentes'), 'ponencias: asistentes con plural de about.attendees', 'faltan asistentes')
  check(talks !== null && !/<img/.test(talks[0]), 'ponencias: sin flyer no hay imagen', 'se renderizo una imagen')
  const withFlyer = renderCta(build({ events: [{ ...EVENTS[0], flyer: MEDIA as never }] }), CTA)
  check(/<img[^>]*alt="Texto alternativo de prueba de la foto"[^>]*loading="lazy"/.test(/<section[^>]*id="about-talks"[\s\S]*?<\/section>/.exec(withFlyer)?.[0] ?? ''), 'ponencias: con flyer hay img con alt y lazy', 'falta la imagen')

  // Cierre.
  check(/id="contacto"/.test(html) && textOf(html).includes('Titulo del cierre de prueba'), 'cierre: CtaSection con id contacto y titulo', 'falta el cierre')
  check(!/id="contacto"/.test(renderCta(build(), null)), 'sin datos de cierre no se renderiza', 'quedo el cierre')

  // Orden y jerarquia.
  const order = ['about-areas', 'about-experience', 'about-education', 'about-talks', 'contacto'].map((id) => html.indexOf(`id="${id}"`))
  check(order.every((n, i) => n > -1 && (i === 0 || n > order[i - 1])), 'orden: areas, experiencia, educacion, ponencias y cierre', `posiciones ${order.join(',')}`)
  const levels = headingLevels(html)
  check(countOf(html, /<h1[\s>]/) === 1 && !levels.some((l, i) => i > 0 && l - levels[i - 1] > 1), 'con todas las secciones: un h1 y sin saltos', `niveles ${levels.join(',')}`)

  // Sin datos: se omiten sin encabezado huerfano.
  const bare = renderCta(build({ author: { ...AUTHOR, education: [] }, events: [] }), null)
  check(!hasId(bare, 'about-education-t') && !hasId(bare, 'about-talks-t'), 'sin educacion ni ponencias se omiten sus secciones', 'quedo un encabezado huerfano')
  check(!/id="about-education"/.test(bare) && !/id="about-talks"/.test(bare), 'sin educacion ni ponencias no quedan secciones vacias', 'quedo una seccion')
  const noAreas = renderCta(build({ about: { data: { ...COPY, specialties: { title: 'Areas', items: [] } }, isFallback: false } }), null)
  check(!hasId(noAreas, 'about-areas-t'), 'sin areas se omite la seccion', 'quedo el encabezado')

  // EN: sin traduccion cae al espanol con aviso y lang es.
  const strictEn = renderCta(build({}, 'en'), null, 'en')
  check(!/role="note"/.test(strictEn), 'en: con texto traducido no hay aviso', 'aparecio el aviso')
  check(strictEn.includes('href="/en/services"') && strictEn.includes('href="/en/stack"'), 'en: los botones llevan prefijo /en', 'faltan /en/services o /en/stack')
  check(strictEn.includes('18 attendees') && strictEn.includes('by Organizador de Prueba'), 'en: textos de interfaz en ingles', 'faltan "18 attendees" o "by ..."')
  check(/Feb 2018 to today/.test(strictEn) && /May 2022 to Aug 2028/.test(strictEn), 'en: fechas en ingles con dateRange', 'faltan fechas en ingles')

  const fallbackData = assembleAboutData({
    about: { data: COPY, isFallback: true },
    author: AUTHOR,
    events: EVENTS,
    counts: { seo: 15, dev: 13 },
    locale: 'en',
  })
  const fb = renderCta(fallbackData, { ...CTA, isFallback: true }, 'en')
  check(/role="note"/.test(fb) && /href="\/sobre-mi"[^>]*hrefLang="es"|hreflang="es"[^>]*href="\/sobre-mi"|href="\/sobre-mi"[^>]*lang="es"/i.test(fb), 'en con isFallback: TranslationNotice con enlace a /sobre-mi', 'falta el aviso o su enlace')
  check(countOf(fb, /lang="es"/) >= 8, 'en con isFallback: los contenedores del global van en lang es', `lang es = ${countOf(fb, /lang="es"/)}`)
  check(countOf(fb, /<h1[\s>]/) === 1, 'en con isFallback: un solo h1', 'h1 repetido')
  const esHtml = renderCta(build(), CTA)
  check(!/role="note"/.test(esHtml) && !/lang="es"/.test(esHtml), 'es: sin aviso ni lang es', 'aparecio aviso o lang es')
}

// ---------------------------------------------------------------------------
// El contrato HTTP de 54-about.mjs contra el render real de la vista
// ---------------------------------------------------------------------------
{
  for (const locale of ['es', 'en'] as const) {
    const viewHtml = renderToHtml(createElement(AboutView, { data: build({}, locale), locale, cta: null }), locale)
    // El header lo pone el layout; aqui se simula el del preview con el enlace inyectado.
    const link = locale === 'en' ? '/en/sobre-mi' : '/sobre-mi'
    const html = `<html><body><header><a href="${link}">Sobre mi</a></header><main id="main-content">${viewHtml}</main></body></html>`
    const list = checkAboutPage({ status: 200, html, xRobotsTag: 'noindex' }, { locale, expectPreview: true })
    check(list.length === 0, `real ${locale}: el contrato de 54-about.mjs pasa sobre el render de la vista`, list.join('; '))
  }
}

if (failures > 0) {
  console.log(`\n${failures} comprobacion(es) fallaron`)
  process.exit(1)
}
console.log('\nPASS 54-about-ssr')
