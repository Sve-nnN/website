/**
 * Autoprueba de render de las landings SEO tecnico Lima y Madrid (fase 54, plan 54-15).
 *
 * Descarga de la API publica anonima de produccion (solo lectura) los docs
 * `seo-tecnico-lima` y `seo-tecnico-madrid` en es y en, los reparte con
 * `composeLocalSlots` y renderiza cada seccion con el arnes de servidor. No toca
 * la base. Comprueba sobre todo T-54-62: ningun marcador `[PLACEHOLDER]` en el
 * HTML, la prueba local de Madrid sin marcado alguno y la cifra del hero bien
 * separada.
 *
 *   node_modules/.bin/tsx scripts/verify/54-local-ssr.ts
 *
 * Con DNS roto hacia juan-tech.com, precargar el arreglo de la sesion con
 * NODE_OPTIONS="--require <scratchpad>/dnsfix.cjs" (ese archivo no entra al repo).
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { FaqAccordion } from '../../src/components/mui/FaqAccordion'
import { PageHero } from '../../src/components/mui/PageHero'
import { MuiRichText } from '../../src/components/mui/rich-text/MuiRichText'
import { Section } from '../../src/components/mui/Section'
import { LocalHeroActions, LocalHeroStat, LocalProof } from '../../src/components/pages/LocalLanding'
import {
  composeLocalSlots,
  splitInlineStat,
  type LocalLayoutBlock,
  type LocalSection,
} from '../../src/lib/local-landing-view'
import { isPlaceholder } from '../../src/lib/placeholder'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

const BASE = process.env.SERVICE_SLOTS_BASE_URL ?? 'https://juan-tech.com'
const SLUGS = ['seo-tecnico-lima', 'seo-tecnico-madrid'] as const

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

async function getJson<T>(url: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
    }
  }
  throw new Error(`red: ${url} fallo dos veces (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`)
}

type Doc = { title: string; slug: string; content?: { layout?: LocalLayoutBlock[] } }

async function fetchDoc(slug: string, locale: 'es' | 'en'): Promise<Doc> {
  const json = await getJson<{ docs?: Doc[] }>(
    `${BASE}/api/pages?where[slug][equals]=${slug}&locale=${locale}&depth=0&limit=1`,
  )
  const doc = json.docs?.[0]
  if (!doc) throw new Error(`sin doc ${slug} ${locale}`)
  return doc
}

const noStyle = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '')

function runPure(): void {
  const tag = 'splitInlineStat'
  const a = splitInlineStat('+40 proyectos entregados')
  check(a.figure === '+40' && a.caption === 'proyectos entregados', `${tag}: "+40 proyectos entregados"`, JSON.stringify(a))
  const b = splitInlineStat('Proyectos entregados')
  check(b.figure === null && b.caption === 'Proyectos entregados', `${tag}: sin numero da figura null`, JSON.stringify(b))
  const c = splitInlineStat('98% de aciertos')
  check(c.figure === '98' && c.caption === '% de aciertos', `${tag}: el numero es solo el prefijo numerico`, JSON.stringify(c))
  const d = splitInlineStat(null)
  check(d.figure === null && d.caption === '', `${tag}: null no lanza`, JSON.stringify(d))

  const html = noStyle(renderToHtml(createElement(LocalHeroStat, { text: '+40 proyectos entregados' })))
  check(
    /<aside/.test(html) && />\+40</.test(html) && /proyectos entregados/.test(html),
    'LocalHeroStat: aside con cifra y caption',
    'no hay aside con +40 y el caption',
  )
  check(/font-size:\s*72px|72px/.test(renderToHtml(createElement(LocalHeroStat, { text: '+40 x' }))), 'LocalHeroStat: cifra de 72px', 'sin 72px')
  const noFigure = noStyle(renderToHtml(createElement(LocalHeroStat, { text: 'Sin cifra al inicio' })))
  check(/<aside/.test(noFigure) && countOf(noFigure, /<p[\s>]/) === 1, 'LocalHeroStat: sin cifra solo pinta el caption', noFigure)
  const empty = noStyle(renderToHtml(createElement(LocalHeroStat, { text: '' }))).trim()
  check(empty === '', 'LocalHeroStat: texto vacio no renderiza', empty)
  const ph = noStyle(renderToHtml(createElement(LocalHeroStat, { text: '[PLACEHOLDER] Estadistica real pendiente' }))).trim()
  check(ph === '', 'LocalHeroStat: un marcador no renderiza', ph)

  // Prueba local sintetica
  const real = { id: 'a', value: '18', label: 'Asistentes reales' }
  const fake = { id: 'b', value: '0', label: '[PLACEHOLDER] dato pendiente' }
  const fakeValue = { id: 'c', value: '[PLACEHOLDER]', label: 'Etiqueta real' }
  const onlyReal = noStyle(
    renderToHtml(
      createElement(LocalProof, {
        stats: [real, fake, fakeValue],
        testimonial: { quote: '[PLACEHOLDER] x', authorName: '[PLACEHOLDER] y', authorBusiness: '[PLACEHOLDER] z' },
      }),
    ),
  )
  check(countOf(onlyReal, /<li[\s>]/) === 1, 'LocalProof: una estadistica real y dos marcadores dan una tarjeta', `li: ${countOf(onlyReal, /<li[\s>]/)}`)
  check(!onlyReal.includes('[PLACEHOLDER]') && !/<blockquote/.test(onlyReal), 'LocalProof: sin marcador ni cita', 'hay marcador o blockquote')
  const quoteOnly = noStyle(
    renderToHtml(
      createElement(LocalProof, {
        stats: [fake],
        testimonial: { quote: 'Cita real', authorName: '[PLACEHOLDER] y', authorBusiness: 'Negocio real' },
      }),
    ),
  )
  check(
    /<blockquote[^>]*>Cita real/.test(quoteOnly) && quoteOnly.includes('Negocio real') && !quoteOnly.includes('[PLACEHOLDER]') && countOf(quoteOnly, /<li[\s>]/) === 0,
    'LocalProof: cita real sin estadisticas, con el autor marcador omitido',
    quoteOnly.slice(0, 300),
  )
  const nothing = noStyle(
    renderToHtml(createElement(LocalProof, { stats: [fake], testimonial: { quote: '[PLACEHOLDER] x' } })),
  ).trim()
  check(nothing === '', 'LocalProof: sin nada real devuelve null, sin marcado', nothing.slice(0, 200))
  const none = noStyle(renderToHtml(createElement(LocalProof, { stats: null, testimonial: null }))).trim()
  check(none === '', 'LocalProof: stats y testimonio nulos no lanzan ni pintan', none.slice(0, 200))

  const actions = noStyle(
    renderToHtml(
      createElement(LocalHeroActions, {
        actions: [
          { label: 'Hablar', href: '/contact', appearance: 'primary' },
          { label: 'Casos', href: '/case-studies', appearance: 'outline' },
        ],
      }),
    ),
  )
  check(countOf(actions, /<a[\s>]/) === 2, 'LocalHeroActions: dos enlaces', `a: ${countOf(actions, /<a[\s>]/)}`)

  // composeLocalSlots sintetico
  const layout = [
    { blockType: 'hero' },
    { blockType: 'content', columns: [] },
    { blockType: 'callToAction', links: [] },
    { blockType: 'localProofSection', stats: [] },
    { blockType: 'hero' },
    { blockType: 'faq' },
    { blockType: 'auditorCallout' },
    { blockType: 'callToAction', links: [] },
  ] as unknown as LocalLayoutBlock[]
  const slots = composeLocalSlots(layout)
  const kinds = slots.sections.map((s) => (s.kind === 'cta' ? `cta:${s.closing}` : s.kind)).join(',')
  check(slots.hero !== null, 'composeLocalSlots: el primer hero va a su ranura', 'sin hero')
  check(
    kinds === 'prose,cta:false,proof,generic,faq,generic,cta:true',
    'composeLocalSlots: orden, hero extra y blockType desconocido a generic, solo el ultimo cta es closing',
    kinds,
  )
  check(composeLocalSlots(null).sections.length === 0 && composeLocalSlots(undefined).hero === null, 'composeLocalSlots: layout nulo', 'no maneja null')
}

async function runDoc(slug: (typeof SLUGS)[number], locale: 'es' | 'en'): Promise<void> {
  const tag = `${slug} ${locale}`
  const doc = await fetchDoc(slug, locale)
  const { hero, sections } = composeLocalSlots(doc.content?.layout ?? [])
  if (!hero) {
    check(false, `${tag}: hero`, 'el doc real no trae hero')
    return
  }
  const section = <K extends LocalSection['kind']>(kind: K) =>
    sections.find((s) => s.kind === kind) as Extract<LocalSection, { kind: K }> | undefined

  const proof = section('proof')
  const faq = section('faq')
  const prose = sections.filter((s): s is Extract<LocalSection, { kind: 'prose' }> => s.kind === 'prose')
  check(
    !sections.some((s) => s.kind === 'generic'),
    `${tag}: ningun bloque cae a generic`,
    sections.filter((s) => s.kind === 'generic').map((s) => s.block.blockType).join(','),
  )
  check(
    sections.filter((s) => s.kind === 'cta' && s.closing).length === 1,
    `${tag}: un solo cierre`,
    'cierres != 1',
  )

  const render = (el: React.ReactElement) => noStyle(renderToHtml(el, locale))
  const statText = isPlaceholder(hero.inlineStat) ? null : (hero.inlineStat ?? null)
  const heroHtml = render(
    createElement(
      PageHero,
      {
        crumbs: [{ label: locale === 'es' ? 'Inicio' : 'Home', href: '/' }, { label: hero.title ?? doc.title }],
        eyebrow: hero.cityName ?? undefined,
        title: hero.title ?? doc.title,
        lead: hero.subtitle ?? undefined,
        aside: statText ? createElement(LocalHeroStat, { text: statText }) : undefined,
      },
      createElement(LocalHeroActions, {
        actions: (hero.links ?? []).flatMap((l) =>
          l.link?.url && l.link.label
            ? [{ label: l.link.label, href: l.link.url, appearance: l.link.appearance === 'outline' ? ('outline' as const) : ('primary' as const) }]
            : [],
        ),
      }),
    ),
  )
  const proofHtml = proof
    ? render(createElement(LocalProof, { stats: proof.block.stats, testimonial: proof.block.testimonial }))
    : ''
  const proseHtml = prose
    .map((p) =>
      render(
        createElement(
          'div',
          null,
          ...(p.block.columns ?? []).map((c, i) => createElement(MuiRichText, { key: i, data: c.richText as never, maxWidth: 760 })),
        ),
      ),
    )
    .join('\n')
  const faqHtml = faq
    ? render(
        createElement(
          Section,
          { id: 'faq', py: true, title: faq.block.title?.trim() || 'FAQ' },
          createElement(FaqAccordion, {
            idPrefix: 'lf',
            headingLevel: 3,
            items: (faq.block.faqs ?? []).map((f) => ({
              question: f.question,
              answer: createElement(MuiRichText, { data: f.answer as never, maxWidth: 720 }),
            })),
          }),
        ),
      )
    : ''

  const all = [heroHtml, proofHtml, proseHtml, faqHtml].join('\n')

  // ---- Marcadores (T-54-62) ----
  check(!all.includes('[PLACEHOLDER]'), `${tag}: ninguna salida contiene [PLACEHOLDER]`, 'el marcador llego al HTML')
  check(!/Testimonio real pendiente|Nombre pendiente|Negocio pendiente|Estadistica real pendiente|Reemplazar con dato real/i.test(textOf(all)), `${tag}: ningun texto de relleno en el HTML`, 'hay texto de relleno')

  // ---- Prueba local ----
  const realStats = (proof?.block.stats ?? []).filter((s) => !isPlaceholder(s.value) && !isPlaceholder(s.label))
  const cards = countOf(proofHtml, /<li[\s>]/)
  check(cards === realStats.length, `${tag}: una tarjeta por estadistica real`, `tarjetas ${cards}, reales ${realStats.length}`)
  if (slug === 'seo-tecnico-lima') {
    check(realStats.length === 1 && cards === 1, `${tag}: Lima produce una tarjeta con su dato real`, `reales ${realStats.length}, tarjetas ${cards}`)
    check(
      realStats.every((s) => textOf(proofHtml).includes((s.label ?? '').trim())),
      `${tag}: la etiqueta real aparece en el HTML`,
      'falta la etiqueta',
    )
  } else {
    const realQuote = proof?.block.testimonial?.quote && !isPlaceholder(proof.block.testimonial.quote)
    if (realStats.length === 0 && !realQuote) {
      check(proofHtml.trim() === '', `${tag}: Madrid no produce marcado alguno en la prueba local`, proofHtml.slice(0, 200))
    } else {
      console.log(`INFO ${tag}: ya trae datos reales (${realStats.length} estadisticas), se omite la comprobacion de vacio`)
    }
  }

  // ---- Hero ----
  check(countOf(heroHtml, /<h1[\s>]/) === 1, `${tag}: un solo h1 en el hero`, `h1: ${countOf(heroHtml, /<h1[\s>]/)}`)
  check(
    countOf([proofHtml, proseHtml, faqHtml].join('\n'), /<h1[\s>]/) === 0,
    `${tag}: ninguna otra seccion emite h1`,
    'h1 fuera del hero',
  )
  if (hero.cityName) check(textOf(heroHtml).includes(hero.cityName), `${tag}: el eyebrow es la ciudad`, 'falta cityName')
  const asideCount = countOf(heroHtml, /<aside[\s>]/)
  check(
    asideCount === (statText ? 1 : 0),
    `${tag}: aside del hero solo con estadistica real`,
    `aside: ${asideCount}, statText: ${statText ? 'si' : 'no'}`,
  )
  if (statText) {
    const { figure } = splitInlineStat(statText)
    check(figure !== null && heroHtml.includes(`>${figure}<`), `${tag}: la cifra del hero esta separada`, `figura ${figure}`)
  }

  // ---- Estructura ----
  const levels = headingLevels(all)
  let jump = ''
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] - levels[i - 1] > 1) jump = `${levels[i - 1]} a ${levels[i]}`
  }
  check(jump === '', `${tag}: niveles de encabezado sin saltos`, `salto ${jump}`)
  check(!/<main[\s>]/.test(all), `${tag}: ninguna apertura de main`, 'hay main')
  check(!/\{\{/.test(all), `${tag}: sin llaves dobles`, 'hay {{')
  check(
    /<h2[\s>]/.test(proseHtml) && countOf(proseHtml, /<h2[^>]*\sid="/) === countOf(proseHtml, /<h2[\s>]/),
    `${tag}: los h2 de la prosa llevan id`,
    'algun h2 sin id',
  )
  if (faq) {
    const n = faq.block.faqs?.length ?? 0
    check(n > 0 && countOf(faqHtml, /<h3[\s>]/) === n, `${tag}: un h3 de resumen por pregunta del FAQ`, `h3: ${countOf(faqHtml, /<h3[\s>]/)}, preguntas: ${n}`)
  }
}

async function main(): Promise<void> {
  runPure()
  for (const slug of SLUGS) {
    for (const locale of ['es', 'en'] as const) {
      try {
        await runDoc(slug, locale)
      } catch (err) {
        check(false, `${slug} ${locale}`, err instanceof Error ? err.message : String(err))
      }
    }
  }

  if (failures > 0) {
    console.log(`\n${failures} caso(s) en FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 54-local-ssr')
}

main().catch((err) => {
  console.log(`FAIL inesperado: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
