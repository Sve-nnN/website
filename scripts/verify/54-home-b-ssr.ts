/**
 * Autoprueba de render de la segunda mitad de la home (fase 54, plan 54-14).
 *
 * Alimenta los mapeadores puros de src/lib/home-data-b.ts con el copy sembrado
 * (HOME_COPY_ES) y datos de prueba, renderiza cada seccion con el arnes de
 * servidor y comprueba la estructura del HTML. No toca ninguna base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-home-b-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { About } from '../../src/components/home/About'
import { AuditOffer } from '../../src/components/home/AuditOffer'
import { AuditorHighlightCard } from '../../src/components/home/AuditorHighlightCard'
import { Cases } from '../../src/components/home/Cases'
import { CodeFixes } from '../../src/components/home/CodeFixes'
import { Faq } from '../../src/components/home/Faq'
import { HomeView } from '../../src/components/home/HomeView'
import { Process } from '../../src/components/home/Process'
import { SiteCard } from '../../src/components/home/SiteCard'
import { Sites } from '../../src/components/home/Sites'
import { Testimonials } from '../../src/components/home/Testimonials'
import { mapHomeGlobal } from '../../src/lib/home-data'
import {
  assembleAbout,
  assembleCases,
  assembleHomeSectionsB,
  assembleSites,
  assembleTestimonials,
  emptySectionsB,
  hostnameOf,
  mapFeaturedCases,
  mapHomeGlobalB,
  mapLegacyBlocks,
  mapTestimonials,
  mapWebsite,
  type HomeSiteItem,
} from '../../src/lib/home-data-b'
import { HOME_COPY_ES } from '../db/data/54-home-copy'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

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

/** HTML sin las etiquetas style de Emotion, que viajan en el mismo string. */
function strip(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, '')
}

// Las rayas se escriben por codigo: ningun literal de raya larga o corta en este archivo.
const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)

const globalB = mapHomeGlobalB(HOME_COPY_ES as never, 'es')

// ---------------------------------------------------------------------------
// Proceso (tarea 1)
// ---------------------------------------------------------------------------
{
  check(globalB.process?.steps.length === 4, 'mapper: proceso con cuatro pasos', `pasos: ${globalB.process?.steps.length}`)
  const proc = globalB.process
  if (proc) {
    const html = strip(renderToHtml(createElement(Process, { process: proc })))
    check(/<ol[\s>]/.test(html) && countOf(html, /<li[\s>]/) === 4, 'proceso: cuatro li dentro de una lista ordenada', `li: ${countOf(html, /<li[\s>]/)}`)
    check(countOf(html, /<h3[\s>]/) === 4, 'proceso: cuatro h3', `h3: ${countOf(html, /<h3[\s>]/)}`)
    check(/<h2[^>]*id="proceso-t"/.test(html) && textOf(html).includes(HOME_COPY_ES.process.title), 'proceso: h2 con el titulo del global', 'falta el h2 proceso-t')
    check(/Paso 1/.test(html) && /Paso 4/.test(html), 'proceso: rotulo Paso n desde messages', 'falta Paso 1 o Paso 4')
    check(HOME_COPY_ES.process.steps.every((s) => html.includes(s.title)), 'proceso: titulos de los cuatro pasos', 'falta el titulo de un paso')
    check(!/\{\{|\{n\}/.test(html), 'proceso: sin llaves de plantilla', 'quedan llaves')
    check(!/<main[\s>]/.test(html), 'proceso: sin main', 'abre un main')
  }
  const emptyProcess = renderToHtml(createElement(Process, { process: { title: 'T', steps: [] } }))
  check(!/<section/.test(emptyProcess) && !/<h2/.test(emptyProcess), 'proceso: con cero pasos no deja encabezado', 'pinto una seccion vacia')
  const noTitle = mapHomeGlobalB({ process: { steps: [{ title: 'x' }] } } as never, 'es')
  check(noTitle.process === null, 'mapper: proceso sin titulo se omite', 'devolvio una seccion sin titulo')
  const badIcon = mapHomeGlobalB({ process: { title: 'T', steps: [{ title: 'x', icon: 'no-existe' }] } } as never, 'es')
  check(badIcon.process?.steps[0]?.icon === null, 'mapper: icono invalido a null', JSON.stringify(badIcon.process))
}

// ---------------------------------------------------------------------------
// Casos (tarea 1)
// ---------------------------------------------------------------------------
const CASE_DOCS = [
  { id: 1, slug: 'caso-salud', title: 'Clinica de urologia', sector: `Salud ${EM} Urologia`, heroMetric: '+406% clics interanuales' },
  { id: 2, slug: 'caso-ecommerce', title: 'Tienda de moda', sector: `E-commerce${EN}Moda`, heroMetric: '+68%' },
  { id: 3, slug: 'caso-b2b', title: 'Software B2B', sector: 'SaaS', heroMetric: '0 → 56 clics' },
  { id: 4, slug: 'caso-extra', title: 'Cuarto caso', sector: 'Otro', heroMetric: '+10%' },
]
{
  const items = mapFeaturedCases(CASE_DOCS)
  check(items.length === 3, 'casos: como maximo tres', `casos: ${items.length}`)
  check(items[0]?.metric === '+406 %' && items[0]?.label === 'clics interanuales', 'casos: cifra separada de su etiqueta', JSON.stringify(items[0]))
  check(items[1]?.metric === '+68 %' && items[1]?.label === null, 'casos: sin etiqueta en el dato queda null', JSON.stringify(items[1]))
  check(items[2]?.metric === '0 → 56 clics' && items[2]?.label === null, 'casos: texto que no calza queda entero como cifra', JSON.stringify(items[2]))
  check(items.every((i) => !i.tag?.includes(EM) && !i.tag?.includes(EN)), 'casos: sector sin raya larga ni corta', JSON.stringify(items.map((i) => i.tag)))
  check(items[0]?.tag === 'Salud, urologia', 'casos: la raya entre sector y subsector pasa a coma', `tag: ${items[0]?.tag}`)

  const sparse = mapFeaturedCases([
    7,
    null,
    { id: 5, slug: '', title: 'Sin slug', heroMetric: '+1%' },
    { id: 6, slug: 'sin-titulo', title: '  ', heroMetric: '+1%' },
    { id: 8, slug: 'sin-cifra', title: 'Sin cifra' },
    { id: 9, slug: 'ok', title: 'Completo', heroMetric: '+5%' },
  ])
  check(sparse.length === 1 && sparse[0]?.href === '/case-studies/ok', 'casos: omite ids sin poblar y entradas sin slug, titulo o cifra', JSON.stringify(sparse))

  const cases = assembleCases(globalB.casesText, items)
  check(cases !== null && cases.items[1]?.label === HOME_COPY_ES.cases.metricSuffix, 'casos: la etiqueta ausente cae a metricSuffix', JSON.stringify(cases?.items[1]))
  if (cases) {
    const raw = renderToHtml(createElement(Cases, { cases }))
    const html = strip(raw)
    check(countOf(html, /<h3[\s>]/) === 3, 'casos: tres h3', `h3: ${countOf(html, /<h3[\s>]/)}`)
    const links = [...html.matchAll(/<h3[^>]*><a[^>]*href="([^"]+)"/g)].map((m) => m[1])
    check(
      JSON.stringify(links) === JSON.stringify(items.map((i) => i.href)),
      'casos: cada h3 envuelve un enlace con el href del caso',
      JSON.stringify(links),
    )
    // La cifra va en su propio parrafo de 72px (4.5rem), separada de la etiqueta.
    const metricClass = html.match(/<p class="([^"]+)">\+406 %<\/p>/)?.[1]?.split(' ').find((c) => c.startsWith('css-')) ?? ''
    check(
      metricClass !== '' && new RegExp(`\\.${metricClass}\\{[^}]*font-size:4\\.5rem`).test(raw),
      'casos: la cifra va sola en un parrafo de 72px',
      `clase ${metricClass || '(ninguna)'} sin font-size:4.5rem`,
    )
    check(/clics interanuales<\/p>/.test(html) && !/\+406 % clics/.test(textOf(html)), 'casos: la etiqueta va aparte de la cifra', 'la etiqueta quedo pegada a la cifra')
    check(textOf(html).includes('Salud, urologia') && !textOf(html).includes(EM) && !textOf(html).includes(EN), 'casos: sector sin raya en el HTML', 'aparece una raya')
    check(
      new RegExp(`<a[^>]*href="/case-studies"[^>]*>${HOME_COPY_ES.cases.ctaLabel}</a>`).test(html),
      'casos: boton de pie hacia /case-studies',
      'falta el boton Ver todos los casos',
    )
    check(textOf(html).includes(HOME_COPY_ES.cases.note), 'casos: nota del pie', 'falta la nota')
    check(!/<main[\s>]/.test(html) && !/\{\{/.test(html), 'casos: sin main ni llaves dobles', 'main o llaves')
    check(JSON.stringify(headingLevels(html)) === '[2,3,3,3]', 'casos: encabezados h2 y tres h3', JSON.stringify(headingLevels(html)))
  }
  check(assembleCases(globalB.casesText, []) === null, 'casos: con cero casos no hay seccion', 'devolvio una seccion')
  check(assembleCases(globalB.casesText, null) === null, 'casos: con lectura fallida (null) no hay seccion', 'devolvio una seccion')
  check(assembleCases(null, items) === null, 'casos: sin titulo del global no hay seccion', 'devolvio una seccion')
  const emptyCases = renderToHtml(createElement(Cases, { cases: { title: 'T', lead: null, note: null, ctaLabel: null, items: [] } }))
  check(!/<section/.test(emptyCases) && !/<h2/.test(emptyCases), 'casos: el componente con cero casos no deja encabezado', 'pinto una seccion vacia')
}

// ---------------------------------------------------------------------------
// Sitios (tarea 2)
// ---------------------------------------------------------------------------
const SHOT = (n: number) => ({ id: n, alt: `Pagina de inicio del sitio ${n}`, url: `https://res.cloudinary.com/demo/image/upload/s-${n}.webp`, width: 1280, height: 800 })
const WEBSITE_DOCS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  slug: `sitio-${i + 1}`,
  title: `Sitio ${i + 1}`,
  industry: i % 2 === 0 ? 'Salud' : 'Moda',
  stack: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }],
  screenshots: [{ image: SHOT(i + 1) }],
  lighthouse: { performance: 83, accessibility: 90, bestPractices: 73, seo: 100 },
  lighthouseCapturedAt: i === 2 ? '2026-07-14T10:00:00.000Z' : '2026-07-10T10:00:00.000Z',
  client: { id: i + 1, websiteUrl: `https://www.sitio${i + 1}.com/` },
}))
const SITE_ITEMS = WEBSITE_DOCS.map((d) => mapWebsite(d)).filter((x): x is HomeSiteItem => x !== null)
{
  check(SITE_ITEMS.length === 5, 'sitios: el mapper trae los cinco', `sitios: ${SITE_ITEMS.length}`)
  check(SITE_ITEMS[0]?.domain === 'sitio1.com' && hostnameOf('javascript:alert(1)') === null && hostnameOf('') === null, 'sitios: dominio desde la URL del cliente, sin www ni esquemas ajenos', JSON.stringify(SITE_ITEMS[0]))
  check(SITE_ITEMS[0]?.href === '/websites/sitio-1', 'sitios: href a la pagina del sitio', `href: ${SITE_ITEMS[0]?.href}`)
  check(mapWebsite({ id: 1, slug: '', title: 'x' }) === null && mapWebsite({ id: 1, slug: 'x', title: ' ' }) === null, 'sitios: sin slug o sin titulo no hay tarjeta', 'devolvio tarjeta')
  const nullDoc = mapWebsite({ id: 9, slug: 'juan-tech-com', title: 'juan-tech.com', lighthouse: { performance: null, accessibility: null, bestPractices: null, seo: null }, lighthouseCapturedAt: '2026-07-14' })
  check(nullDoc !== null && Object.values(nullDoc.scores).every((v) => v === null), 'sitios: los cuatro puntajes null quedan null', JSON.stringify(nullDoc?.scores))

  // SiteCard con cuatro puntajes
  const full = strip(renderToHtml(createElement(SiteCard, { site: SITE_ITEMS[0] as HomeSiteItem })))
  check(countOf(full, /de 100/) === 4, 'sitecard: cuatro anillos con el sufijo accesible', `sufijos: ${countOf(full, /de 100/)}`)
  check(/aria-label="Puntajes de PageSpeed en móvil"/.test(full), 'sitecard: lista de puntajes con leyenda de messages', 'falta la leyenda')
  check(['Rendimiento', 'Accesibilidad', 'Buenas prácticas', 'SEO'].every((l) => full.includes(l)), 'sitecard: rotulos de los cuatro anillos desde messages', 'falta un rotulo')
  check(/<h3[^>]*><a[^>]*href="\/websites\/sitio-1"/.test(full), 'sitecard: h3 con el enlace estirado', 'falta el enlace')
  check(/<img[^>]*alt="Pagina de inicio del sitio 1"/.test(full) && /width="1280"/.test(full) && /height="800"/.test(full) && /loading="lazy"/.test(full), 'sitecard: captura con alt de Media, ancho, alto y lazy', 'falta algun atributo')
  check(full.includes('sitio1.com') && full.includes('Next.js') && /aria-label="Temas"/.test(full), 'sitecard: dominio y tecnologias con su rotulo', 'falta dominio o tecnologias')
  // Con puntajes null: ni lista ni leyendas
  const noScores = strip(renderToHtml(createElement(SiteCard, { site: nullDoc as HomeSiteItem })))
  check(!/Puntajes de PageSpeed/.test(noScores) && !/de 100/.test(noScores) && !/Rendimiento/.test(noScores), 'sitecard: con puntajes null no hay lista ni leyendas', 'quedo la lista o una leyenda')
  check(!/<img/.test(noScores) && !/Temas/.test(noScores), 'sitecard: sin captura ni tecnologias no pinta imagen ni lista', 'pinto imagen o lista vacia')
  // Valor mixto: solo los no nulos
  const mixed = mapWebsite({ ...WEBSITE_DOCS[0], lighthouse: { performance: 83, accessibility: null, bestPractices: 73, seo: null } }) as HomeSiteItem
  const mixedHtml = strip(renderToHtml(createElement(SiteCard, { site: mixed })))
  check(countOf(mixedHtml, /de 100/) === 2 && mixedHtml.includes('Rendimiento') && !mixedHtml.includes('Accesibilidad'), 'sitecard: con valor mixto solo los no nulos', `sufijos: ${countOf(mixedHtml, /de 100/)}`)

  // Sites con cinco sitios
  const sitesText = mapHomeGlobalB(HOME_COPY_ES as never, 'es').sitesText
  const sites = assembleSites(sitesText, SITE_ITEMS)
  check(sites?.capturedAt === '2026-07-14T10:00:00.000Z', 'sitios: la fecha es la captura mas reciente', `fecha: ${sites?.capturedAt}`)
  if (sites) {
    const raw = renderToHtml(createElement(Sites, { sites }))
    const html = strip(raw)
    const spans = [...html.matchAll(/<li class="([^"]+)"/g)]
      .map((m) => (m[1] ?? '').split(' ').find((c) => c.startsWith('css-')) ?? '')
      .map((cls) => raw.match(new RegExp(`\\.${cls}\\{[^}]*grid-column:span (\\d)`))?.[1])
      .filter((v): v is string => v !== undefined)
    check(JSON.stringify(spans) === '["2","2","2","3","3"]', 'sitios: rejilla de 6 columnas con tres tarjetas de 2 y dos de 3', JSON.stringify(spans))
    check(/repeat\(6, ?minmax\(0, ?1fr\)\)/.test(raw), 'sitios: rejilla de seis columnas desde md', 'falta repeat(6')
    check(textOf(html).includes('Puntajes de PageSpeed Insights en móvil, medidos el 14 de julio de 2026.'), 'sitios: nota con la fecha real formateada', `nota: ${textOf(html).match(/Puntajes de PageSpeed Insights[^.]*\./)?.[0]}`)
    check(!/6 de noviembre/.test(html) && !/\{date\}|\{\{/.test(html), 'sitios: ni la fecha del sandbox ni plantilla sin resolver', 'aparece la fecha del sandbox o llaves')
    check(new RegExp(`<a[^>]*href="/websites"[^>]*>${HOME_COPY_ES.sites.ctaLabel}</a>`).test(html), 'sitios: boton hacia /websites', 'falta el boton')
    check(countOf(html, /<h3[\s>]/) === 5 && /<h2[^>]*id="sitios-t"/.test(html), 'sitios: un h2 y cinco h3', JSON.stringify(headingLevels(html)))
    const en = textOf(strip(renderToHtml(createElement(Sites, { sites }), 'en')))
    check(en.includes('measured on July 14, 2026'), 'sitios EN: fecha formateada en ingles', `nota EN: ${en.match(/measured on[^.]*\./)?.[0]}`)
    const noDate = strip(renderToHtml(createElement(Sites, { sites: { ...sites, capturedAt: null } })))
    check(!/medidos el/.test(noDate) && /<h2/.test(noDate), 'sitios: sin fecha no hay nota', 'quedo la nota')
  }
  check(assembleSites(sitesText, []) === null && assembleSites(sitesText, null) === null && assembleSites(null, SITE_ITEMS) === null, 'sitios: sin sitios, sin lectura o sin titulo no hay seccion', 'devolvio una seccion')
  const emptySites = renderToHtml(createElement(Sites, { sites: { title: 'T', ctaLabel: null, items: [], capturedAt: null } }))
  check(!/<section/.test(emptySites) && !/<h2/.test(emptySites), 'sitios: el componente con cero sitios no deja encabezado', 'pinto una seccion vacia')
  const four = assembleSites(sitesText, SITE_ITEMS.slice(0, 4))
  const fourRaw = four ? renderToHtml(createElement(Sites, { sites: four })) : ''
  check(!/grid-column:span 2/.test(fourRaw) && /grid-column:span 3/.test(fourRaw), 'sitios: con cuatro, dos renglones de dos tarjetas', 'las columnas no son de 3')
}

// ---------------------------------------------------------------------------
// Testimonios (tarea 2)
// ---------------------------------------------------------------------------
{
  const docs = [
    { id: 1, name: 'Patricia Ibarra', role: 'CEO', company: 'Estylopia', testimonial: 'Trabajar con Juan fue lo mejor.' },
    { id: 2, name: 'Ana Lopez', role: 'Directora', company: 'Acme', testimonial: 'Resultados claros.' },
    { id: 3, name: 'Luis Perez', role: 'CTO', company: 'Beta', testimonial: 'Entrega puntual.' },
  ]
  const title = HOME_COPY_ES.testimonials.title
  const render = (n: number, locale: 'es' | 'en' = 'es') => {
    const t = assembleTestimonials(title, mapTestimonials(docs.slice(0, n)))
    return t ? strip(renderToHtml(createElement(Testimonials, { testimonials: t }), locale)) : ''
  }
  check(render(0) === '', 'testimonios: con cero no hay seccion', 'devolvio una seccion')
  const one = render(1)
  check(countOf(one, /<figure[\s>]/) === 1 && /<h2[^>]*id="testimonios-t"/.test(one), 'testimonios: con uno, una tarjeta', `figuras: ${countOf(one, /<figure[\s>]/)}`)
  check(textOf(one).includes('CEO de Estylopia'), 'testimonios: rol armado con la plantilla roleAt', 'falta "CEO de Estylopia"')
  check(textOf(render(1, 'en')).includes('CEO at Estylopia'), 'testimonios EN: rol con la plantilla en ingles', 'falta "CEO at Estylopia"')
  check(countOf(render(3), /<figure[\s>]/) === 3, 'testimonios: con tres, tres tarjetas', `figuras: ${countOf(render(3), /<figure[\s>]/)}`)
  check(!/\{\{/.test(render(3)) && !/testimonio\}/.test(render(3)), 'testimonios: nunca ranuras de muestra', 'aparece una ranura')
  const sparse = mapTestimonials([{ id: 1, name: 'Sin cita', testimonial: ' ' }, { id: 2, testimonial: 'Sin nombre' }, { id: 3, name: 'Solo rol', role: 'CEO', testimonial: 'Cita' }])
  check(sparse.length === 1 && sparse[0]?.company === null, 'testimonios: omite entradas sin cita o sin nombre', JSON.stringify(sparse))
  const roleOnly = assembleTestimonials(title, sparse)
  check(roleOnly !== null && textOf(strip(renderToHtml(createElement(Testimonials, { testimonials: roleOnly })))).includes('CEO') && !/ de /.test(textOf(strip(renderToHtml(createElement(Testimonials, { testimonials: roleOnly }))).replace(title, ''))), 'testimonios: sin empresa el rol va solo', 'el rol salio con la plantilla')
  check(assembleTestimonials(null, mapTestimonials(docs)) === null && assembleTestimonials(title, null) === null, 'testimonios: sin titulo o con lectura fallida no hay seccion', 'devolvio una seccion')
}

// ---------------------------------------------------------------------------
// Sobre mi (tarea 2)
// ---------------------------------------------------------------------------
{
  const noPhotosText = mapHomeGlobalB(HOME_COPY_ES as never, 'es').aboutText
  check(noPhotosText?.photos.length === 0, 'sobre mi: las fotos sin imagen enlazada no cuentan', `fotos: ${noPhotosText?.photos.length}`)
  const aboutNoImg = assembleAbout(noPhotosText, { seo: 15, dev: 13 })
  if (aboutNoImg) {
    const raw = renderToHtml(createElement(About, { about: aboutNoImg }))
    const html = strip(raw)
    check(!/<figure/.test(html) && !/<img/.test(html), 'sobre mi: sin imagenes no hay figuras', 'aparecio una figura')
    check(/<h2[^>]*id="sobre-t"/.test(html) && textOf(html).includes(HOME_COPY_ES.about.title), 'sobre mi: h2 con id sobre-t', 'falta el h2')
    check(countOf(html, /<p class="[^"]+">(15|13)<\/p>/) === 2 && html.includes('proyectos de SEO') && html.includes('proyectos de desarrollo'), 'sobre mi: dos contadores con su rotulo', 'faltan los contadores')
    check(/aria-label="Áreas"/.test(html) && countOf(html, /<li[\s>]/) === 5, 'sobre mi: cinco chips en una lista con aria-label de messages', `li: ${countOf(html, /<li[\s>]/)}`)
    check(/grid-template-columns:minmax\(0, ?1fr\);/.test(raw) || /grid-template-columns:minmax\(0,1fr\)/.test(raw), 'sobre mi: sin imagenes el texto ocupa el ancho completo', 'la rejilla no es de una columna')
  }
  const photosGlobal = {
    ...HOME_COPY_ES,
    about: {
      ...HOME_COPY_ES.about,
      photos: [
        { caption: 'Taller de SEO', image: { id: 1, url: 'https://res.cloudinary.com/demo/image/upload/taller.jpg', alt: 'Juan dando el taller', width: 1600, height: 1200 } },
        { image: { id: 2, url: 'https://res.cloudinary.com/demo/image/upload/escritorio.png', alt: 'Juan frente a una laptop', width: 1448, height: 1086 } },
        { image: { id: 3, url: 'https://res.cloudinary.com/demo/image/upload/retrato.jpg', alt: 'Retrato de Juan', width: 900, height: 1125 } },
        { image: { id: 4, url: 'https://res.cloudinary.com/demo/image/upload/cuarta.jpg', alt: 'Cuarta', width: 10, height: 10 } },
        { image: 7 },
      ],
    },
  }
  const withPhotos = assembleAbout(mapHomeGlobalB(photosGlobal as never, 'es').aboutText, { seo: 15, dev: 0 })
  check(withPhotos?.photos.length === 3 && withPhotos.devCount === null, 'sobre mi: hasta tres fotos y un contador en cero se omite', JSON.stringify(withPhotos?.photos.length))
  if (withPhotos) {
    const html = strip(renderToHtml(createElement(About, { about: withPhotos })))
    check(countOf(html, /<figure[\s>]/) === 3, 'sobre mi: tres figuras', `figuras: ${countOf(html, /<figure[\s>]/)}`)
    check(/<img[^>]*alt="Juan dando el taller"/.test(html) && /width="1600"/.test(html) && /height="1200"/.test(html), 'sobre mi: alt de Media y ancho y alto declarados', 'falta alt o dimensiones')
    check(countOf(html, /<figcaption/) === 1 && html.includes('Taller de SEO'), 'sobre mi: el pie solo en la foto que lo trae', `figcaption: ${countOf(html, /<figcaption/)}`)
    check(!/proyectos de desarrollo/.test(html) && html.includes('proyectos de SEO'), 'sobre mi: el contador sin valor se omite con su rotulo', 'quedo el contador en cero')
  }
  check(assembleAbout(null, { seo: 1, dev: 1 }) === null, 'sobre mi: sin titulo del global no hay seccion', 'devolvio una seccion')
}

// ---------------------------------------------------------------------------
// FAQ (tarea 2)
// ---------------------------------------------------------------------------
{
  const faq = mapHomeGlobalB(HOME_COPY_ES as never, 'es').faq
  check((faq?.items.length ?? 0) >= 5, 'faq: el mapper trae las cinco preguntas o mas', `items: ${faq?.items.length}`)
  if (faq) {
    const html = strip(renderToHtml(createElement(Faq, { faq })))
    check(
      faq.items.every((it) => textOf(html).includes(it.question) && textOf(html).includes(it.answer)),
      'faq: pregunta y respuesta de cada item estan en el HTML aunque el panel este cerrado',
      'falta una pregunta o respuesta',
    )
    check(countOf(html, /aria-expanded="true"/) === 1, 'faq: un solo panel abierto', `abiertos: ${countOf(html, /aria-expanded="true"/)}`)
    check(/<h2[^>]*id="faq-t"/.test(html) && countOf(html, /<h3[\s>]/) === faq.items.length, 'faq: h2 y un h3 por pregunta', JSON.stringify(headingLevels(html)))
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
    check(ids.length === new Set(ids).size, 'faq: ningun id repetido', JSON.stringify(ids.filter((id, i) => ids.indexOf(id) !== i)))
  }
  const sparse = mapHomeGlobalB({ faq: { title: 'T', items: [{ question: 'Sin respuesta' }, { answer: 'Sin pregunta' }] } } as never, 'es').faq
  check(sparse === null, 'faq: sin items validos no hay seccion', JSON.stringify(sparse))
  const emptyFaq = renderToHtml(createElement(Faq, { faq: { title: 'T', items: [] } }))
  check(!/<section/.test(emptyFaq) && !/<h2/.test(emptyFaq), 'faq: el componente con cero items no deja encabezado', 'pinto una seccion vacia')
}

// ---------------------------------------------------------------------------
// Bloques existentes y ensamblado final (tarea 3)
// ---------------------------------------------------------------------------
const LAYOUT = [
  {
    blockType: 'codeFixesBlock',
    title: 'Este sitio es el caso de estudio',
    intro: 'Arreglos reales de este repositorio publico.',
    repoUrl: 'https://github.com/juantech/juan-payload',
    repoLabel: 'Ver el repositorio',
    fixes: [
      { symptom: 'Google recibia dos hreflang', cause: 'Dos fuentes emitian la misma etiqueta.', filePath: 'src/lib/canonical.ts', language: 'ts', code: 'const a = 1 < 2 && "<script>alert(1)</script>"\nconst linea = "una linea muy larga que desborda el contenedor de codigo".repeat(10)', commitUrl: 'https://github.com/juantech/juan-payload/commit/abc1234', commitSha: 'abc1234', outcome: 'Cero errores en Search Console' },
      { symptom: 'El sitemap listaba redirecciones', filePath: 'src/lib/sitemap-data.ts', code: 'export const x = 1', commitUrl: 'javascript:alert(1)', commitSha: 'def5678' },
      { symptom: 'Tercer arreglo', filePath: 'src/a.ts', code: 'a()', commitUrl: 'https://github.com/juantech/juan-payload/commit/fff0000', commitSha: 'fff0000' },
      { symptom: 'Cuarto arreglo que no se muestra', filePath: 'src/b.ts', code: 'b()' },
      { symptom: 'Sin codigo', filePath: 'src/c.ts', code: '  ' },
    ],
  },
  { blockType: 'auditorHighlight', title: 'Mi auditor SEO', description: 'Un auditor propio con checks tecnicos.', ctaLabel: 'Probar el auditor', freeTierNote: 'El plan gratuito cubre una auditoria al mes.' },
  {
    blockType: 'auditOfferBlock',
    title: 'Auditoria SEO tecnica completa',
    description: 'Un informe con el plan de correccion.',
    price: '600 USD',
    priceCaption: 'Pago unico',
    creditNote: 'El importe se acredita si contratas la implementacion.',
    includes: [{ item: 'Rastreo e indexacion' }, { item: 'Core Web Vitals' }, { item: 'Datos estructurados' }, { item: 'Plan por impacto' }],
    deliveryNote: 'Entrega en 10 dias habiles',
    links: [{ link: { type: 'custom', url: '#contacto', label: 'Pedir la auditoria' } }],
  },
]
const legacy = mapLegacyBlocks(LAYOUT as never, 'es', 'Pedir auditoría 360')
{
  check(legacy.codeFixes?.fixes.length === 3, 'bloques: codeFixes con tres arreglos (omite el cuarto y el que no trae codigo)', `arreglos: ${legacy.codeFixes?.fixes.length}`)
  check(legacy.codeFixes?.fixes[1]?.commitUrl === null && legacy.codeFixes?.fixes[0]?.commitUrl?.startsWith('https://') === true, 'bloques: commitUrl con javascript: queda en null', JSON.stringify(legacy.codeFixes?.fixes[1]))
  const hostile = mapLegacyBlocks([{ blockType: 'codeFixesBlock', title: 'T', repoUrl: 'javascript:alert(1)', fixes: [{ symptom: 's', filePath: 'f', code: 'c', commitUrl: '/ruta-interna' }] }] as never, 'es', null)
  check(hostile.codeFixes?.repoUrl === null && hostile.codeFixes?.fixes[0]?.commitUrl === null, 'bloques: repoUrl y commitUrl solo aceptan http o https absolutos', JSON.stringify(hostile.codeFixes))
  check(legacy.auditOffer?.ctaLabel === 'Pedir la auditoria', 'bloques: el rotulo del CTA sale del primer enlace del bloque', `rotulo: ${legacy.auditOffer?.ctaLabel}`)
  const noLink = mapLegacyBlocks([{ blockType: 'auditOfferBlock', title: 'T', includes: [] }] as never, 'es', 'Pedir auditoría 360')
  check(noLink.auditOffer?.ctaLabel === 'Pedir auditoría 360', 'bloques: sin enlace propio el CTA cae al rotulo del hero', `rotulo: ${noLink.auditOffer?.ctaLabel}`)
  const none = mapLegacyBlocks([{ blockType: 'hero' }] as never, 'es', null)
  check(none.codeFixes === null && none.auditor === null && none.auditOffer === null && mapLegacyBlocks(null, 'es', null).auditor === null, 'bloques: un bloque ausente da null', JSON.stringify(none))
  check(mapLegacyBlocks([{ blockType: 'auditorHighlight', description: 'x' }] as never, 'es', null).auditor === null, 'bloques: auditor sin nota de plan gratuito se omite', 'devolvio el auditor')

  // CodeFixes
  if (legacy.codeFixes) {
    const html = strip(renderToHtml(createElement(CodeFixes, { block: legacy.codeFixes })))
    const regions = [...html.matchAll(/<div[^>]*role="region"[^>]*>/g)].map((m) => m[0])
    check(regions.length === 3 && regions.every((r) => /tabindex="0"/.test(r) && /aria-label="Código del arreglo [^"]+"/.test(r)), 'codefixes: tres regiones con tabindex 0, role region y aria-label con el nombre del arreglo', JSON.stringify(regions))
    check(/aria-label="Código del arreglo Google recibia dos hreflang"/.test(html), 'codefixes: el nombre de la region es el sintoma', 'falta el nombre')
    check(/<a[^>]*href="https:\/\/github\.com\/juantech\/juan-payload\/commit\/abc1234"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/.test(html) && html.includes('abc1234'), 'codefixes: el commit como chip con enlace externo en pestaña nueva', 'falta el chip del commit')
    check(countOf(html, /commit\/(abc1234|fff0000)/) === 2 && !/javascript:/.test(html), 'codefixes: el commit con esquema peligroso no llega al HTML', 'aparece javascript: o un enlace de mas')
    check(countOf(html, /se abre en otra pestaña/) === 3, 'codefixes: sufijo de nueva pestaña en repo y en los dos commits', `sufijos: ${countOf(html, /se abre en otra pestaña/)}`)
    check(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !/<script>alert/.test(html), 'codefixes: el codigo se escapa como texto (sin HTML en crudo)', 'el codigo llego sin escapar')
    check(countOf(html, /<h3[\s>]/) === 3 && /<h2[^>]*id="codigo-t"/.test(html), 'codefixes: h2 y tres h3', JSON.stringify(headingLevels(html)))
    check(html.includes('src/lib/canonical.ts') && html.includes('Cero errores en Search Console') && html.includes('Ver el repositorio'), 'codefixes: archivo, resultado y enlace al repo', 'falta archivo, resultado o repo')
    check(!/<main[\s>]/.test(html) && !/\{\{/.test(html), 'codefixes: sin main ni llaves dobles', 'main o llaves')
  }
  const emptyFixes = renderToHtml(createElement(CodeFixes, { block: { title: 'T', intro: null, repoLabel: null, repoUrl: null, fixes: [] } }))
  check(!/<section/.test(emptyFixes) && !/<h2/.test(emptyFixes), 'codefixes: con cero arreglos no deja encabezado', 'pinto una seccion vacia')

  // Auditor
  if (legacy.auditor) {
    const html = strip(renderToHtml(createElement(AuditorHighlightCard, { auditor: legacy.auditor })))
    check(/<h2[^>]*id="auditor-t"[^>]*>Mi auditor SEO<\/h2>/.test(html), 'auditor: h2 con el titulo y el id que nombra la seccion', 'falta el h2')
    check(/<a[^>]*href="https:\/\/auditor\.juan-tech\.com"[^>]*target="_blank"[^>]*rel="noopener"/.test(html) && html.includes('Probar el auditor') && html.includes('se abre en una pestaña nueva'), 'auditor: boton al auditor en pestaña nueva con su sufijo', 'falta el boton o el sufijo')
    check(html.includes(legacy.auditor.freeTierNote), 'auditor: nota del plan gratuito visible', 'falta la nota')
    check(countOf(html, /<li[\s>]/) === 4 && html.includes('checks técnicos'), 'auditor: las cuatro cifras verificables con su rotulo', `li: ${countOf(html, /<li[\s>]/)}`)
    check(/MuiButton-outlined/.test(html) && !/MuiButton-contained(?![A-Za-z])/.test(html), 'auditor: boton outlined, ningun contained', 'el boton no es outlined')
  }
  const noTitle = mapLegacyBlocks([{ blockType: 'auditorHighlight', description: 'd', freeTierNote: 'n' }] as never, 'es', null).auditor
  check(noTitle !== null && /Mi auditor SEO/.test(strip(renderToHtml(createElement(AuditorHighlightCard, { auditor: noTitle })))), 'auditor: sin titulo usa el encabezado de messages', 'falta el encabezado de respaldo')

  // AuditOffer
  if (legacy.auditOffer) {
    const html = strip(renderToHtml(createElement(AuditOffer, { offer: legacy.auditOffer })))
    const raw = renderToHtml(createElement(AuditOffer, { offer: legacy.auditOffer }))
    check(html.includes('600 USD') && html.includes('Pago unico'), 'oferta: precio y leyenda', 'falta el precio')
    check(countOf(html, /<li[\s>]/) === legacy.auditOffer.includes.length, 'oferta: tantos li como includes', `li: ${countOf(html, /<li[\s>]/)}`)
    check(countOf(html, /MuiButton-contained(?![A-Za-z])/) === 1, 'oferta: un solo boton contained', `contained: ${countOf(html, /MuiButton-contained(?![A-Za-z])/)}`)
    check(/<a[^>]*href="#contacto"[^>]*>Pedir la auditoria<\/a>/.test(html), 'oferta: el boton va a #contacto', 'falta el boton')
    const priceClass = html.match(/<p class="([^"]+)">600 USD<\/p>/)?.[1]?.split(' ').find((c) => c.startsWith('css-')) ?? ''
    check(priceClass !== '' && new RegExp(`\\.${priceClass}\\{[^}]*font-size:3rem`).test(raw), 'oferta: precio de 48px', `clase ${priceClass || '(ninguna)'}`)
    check(html.includes('El importe se acredita') && html.includes('Entrega en 10 dias habiles'), 'oferta: notas de credito y de entrega', 'faltan las notas')
    check(/<h2[^>]*id="oferta-t"/.test(html) && !/<main[\s>]/.test(html), 'oferta: h2 y sin main', 'falta el h2')
    check(/width:32px/.test(raw) && /height:32px/.test(raw), 'oferta: marca de verificacion en circulo de 32px', 'falta el circulo de 32px')
    const noCta = strip(renderToHtml(createElement(AuditOffer, { offer: { ...legacy.auditOffer, ctaLabel: null } })))
    check(!/<a[\s>]/.test(noCta), 'oferta: sin rotulo no hay boton', 'quedo un enlace')
  }
}

// HomeView completa
{
  const fixtureHome = mapHomeGlobal(HOME_COPY_ES as never, 'es', false)
  const CTA = { title: 'Hablemos de tu sitio', lead: 'Cuentame de que se trata.', email: 'hola@juan-tech.com', name: 'Juan', avatarUrl: null, isFallback: false }
  const photosGlobal = {
    ...HOME_COPY_ES,
    about: { ...HOME_COPY_ES.about, photos: [{ caption: 'Taller', image: { id: 1, url: 'https://res.cloudinary.com/demo/image/upload/t.jpg', alt: 'Taller', width: 1600, height: 1200 } }] },
  }
  const sectionsB = assembleHomeSectionsB({
    global: photosGlobal as never,
    locale: 'es',
    cases: mapFeaturedCases(CASE_DOCS),
    sites: SITE_ITEMS,
    counts: { seo: 15, dev: 13 },
    testimonials: mapTestimonials([{ id: 1, name: 'Patricia Ibarra', role: 'CEO', company: 'Estylopia', testimonial: 'Trabajar con Juan fue lo mejor.' }]),
    legacy,
    cta: CTA,
  })
  const clients = { title: 'Clientes que confiaron en mí', logos: [{ id: 1, src: 'https://res.cloudinary.com/demo/image/upload/l.webp', alt: 'Cliente 1', width: 200, height: 60, onDark: false }] }
  const data = { ...fixtureHome, clients, sectionsB }
  const render = (d: typeof data, locale: 'es' | 'en' = 'es') =>
    strip(renderToHtml(createElement(HomeView, { data: d, locale, fallbackTitle: 'Respaldo' }), locale))
  const html = render(data)

  check(countOf(html, /<h1[\s>]/) === 1 && headingLevels(html)[0] === 1, 'home: exactamente un h1 y es el del hero', JSON.stringify(headingLevels(html)))
  const levels = headingLevels(html)
  const jump = levels.findIndex((l, i) => i > 0 && l > (levels[i - 1] as number) + 1)
  check(jump === -1, 'home: los niveles de encabezado nunca saltan', `salto en el indice ${jump}: ${JSON.stringify(levels)}`)

  const ORDER = ['inicio', 'clientes', 'medicion', 'codigo', 'servicios', 'casos', 'auditor', 'proceso', 'sitios', 'sobre', 'testimonios', 'oferta', 'faq', 'contacto']
  const positions = ORDER.map((id) => html.indexOf(` id="${id}"`))
  check(positions.every((p) => p >= 0), 'home: aparecen las catorce secciones', `ausentes: ${ORDER.filter((_, i) => positions[i] === -1).join(', ')}`)
  check(positions.every((p, i) => i === 0 || p > (positions[i - 1] as number)), 'home: las secciones salen en el orden aprobado', ORDER.map((id, i) => `${id}@${positions[i]}`).join(' '))

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  check(dupes.length === 0, 'home: ningun id repetido en la pagina completa', `repetidos: ${JSON.stringify(dupes)}`)
  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1])
  check(controls.every((c) => ids.includes(c)), 'home: cada aria-controls resuelve a un id', `sin resolver: ${JSON.stringify(controls.filter((c) => !ids.includes(c)))}`)
  const labelled = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1])
  check(labelled.every((l) => ids.includes(l)), 'home: cada aria-labelledby resuelve a un id', `colgando: ${JSON.stringify(labelled.filter((l) => !ids.includes(l)))}`)
  // React 19 emite `javascript:throw new Error(...)` como marcador de todo <form> con action de servidor (atributo y script de reproduccion); no es un enlace del CMS.
  const withoutFormAction = html.replace(/javascript:throw/g, '')
  check(!/<main[\s>]/.test(html) && !/\{\{/.test(html) && !/javascript:/.test(withoutFormAction), 'home: sin main, sin llaves dobles y sin javascript:', `main:${/<main[\s>]/.test(html)} llaves:${html.match(/.{40}\{\{.{40}/)?.[0]} js:${withoutFormAction.match(/.{40}javascript:.{40}/)?.[0]}`)
  check(!textOf(html).includes(EM) && !textOf(html).includes(EN), 'home: el texto visible no lleva raya larga ni corta', 'aparece una raya')

  // Sin la segunda mitad la home sigue como en el plan 08
  const half = render({ ...data, sectionsB: emptySectionsB() })
  check(!/id="(codigo|casos|auditor|proceso|sitios|sobre|testimonios|oferta|faq|contacto)"/.test(half) && /id="servicios"/.test(half), 'home: con la segunda mitad vacia solo quedan las secciones de la primera', 'quedo una seccion de la segunda mitad')
  // Una seccion caida no se lleva a las demas
  const noSites = render({ ...data, sectionsB: { ...sectionsB, sites: null } })
  check(!/id="sitios"/.test(noSites) && /id="casos"/.test(noSites) && /id="faq"/.test(noSites) && /id="contacto"/.test(noSites), 'home: sin sitios las demas secciones siguen', 'una seccion cayo con la de sitios')

  // Respaldo EN: las secciones del global van en lang es y las del doc home no
  const en = render({ ...fixtureHome, clients, isFallback: true, sectionsB }, 'en')
  check(/role="note"/.test(en) && countOf(en, /lang="es"/) >= 9, 'home EN respaldo: aviso y las secciones del global en lang es', `lang es: ${countOf(en, /lang="es"/)}`)
  const esLangBlocks = (id: string) => new RegExp(`<div lang="es"><(?:section|div)[^>]*id="${id}"`).test(en)
  check(!esLangBlocks('codigo') && !esLangBlocks('auditor') && !esLangBlocks('oferta'), 'home EN respaldo: los bloques del doc home no van en lang es', 'un bloque del doc home quedo en lang es')
  check(['proceso', 'casos', 'sitios', 'sobre', 'testimonios', 'faq'].every((id) => esLangBlocks(id)), 'home EN respaldo: proceso, casos, sitios, sobre mi, testimonios y FAQ envueltos en lang es', 'falta algun envoltorio')
}

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nPASS 54-home-b-ssr')
