/**
 * Autoprueba de render de la landing de servicio (fase 54, plan 54-09).
 *
 * Descarga el doc REAL de seo-technical-audit de la API publica anonima de
 * produccion (solo lectura), arma los fixtures de cada seccion con
 * `composeServiceSlots` y las renderiza con el arnes de servidor. No toca la
 * base. Comprueba estructura: un h1, niveles de encabezado sin saltos, lista de
 * Que incluye con tantos items como parrafos, lista ordenada con numerales
 * decorativos, aside con aria-labelledby que resuelve, paneles cerrados del FAQ
 * en el HTML, ids unicos y ningun main ni llaves dobles sin renderizar.
 *
 *   node_modules/.bin/tsx scripts/verify/54-service-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { FaqAccordion } from '../../src/components/mui/FaqAccordion'
import { MuiRichText } from '../../src/components/mui/rich-text/MuiRichText'
import { Section } from '../../src/components/mui/Section'
import { OtherServices } from '../../src/components/pages/service/OtherServices'
import { ServiceCaseProof } from '../../src/components/pages/service/ServiceCaseProof'
import { ServiceCtaBand } from '../../src/components/pages/service/ServiceCtaBand'
import { ServiceExtras } from '../../src/components/pages/service/ServiceExtras'
import { ServiceHero } from '../../src/components/pages/service/ServiceHero'
import { ServiceHow } from '../../src/components/pages/service/ServiceHow'
import { ServiceIncludes } from '../../src/components/pages/service/ServiceIncludes'
import { ServiceProblem } from '../../src/components/pages/service/ServiceProblem'
import { splitColumn } from '../../src/components/pages/service/column-parts'
import { buildTrail } from '../../src/lib/breadcrumbs'
import { composeServiceSlots, type ServiceLayoutBlock } from '../../src/lib/service-slots'
import {
  SERVICE_ICON_BY_SLUG,
  toMarqueeLogos,
  toTestimonialItems,
  type CaseProof,
  type OtherService,
} from '../../src/lib/service-view-data'
import { buildServiceHref } from '../../src/lib/service-slugs'
import { countOf, hasId, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

const BASE = process.env.SERVICE_SLOTS_BASE_URL ?? 'https://juan-tech.com'

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

type Doc = { title: string; slug: string; content?: { layout?: ServiceLayoutBlock[] } }

async function fetchDoc(slug: string, locale: 'es' | 'en'): Promise<Doc> {
  const json = await getJson<{ docs?: Doc[] }>(
    `${BASE}/api/pages?where[slug][equals]=${slug}&locale=${locale}&depth=0&limit=1`,
  )
  const doc = json.docs?.[0]
  if (!doc) throw new Error(`sin doc ${slug} ${locale}`)
  return doc
}

const noStyle = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '')

async function runLocale(locale: 'es' | 'en'): Promise<void> {
  const tag = `seo-technical-audit ${locale}`
  const doc = await fetchDoc('seo-technical-audit', locale)
  const slots = composeServiceSlots(doc.content?.layout ?? [])
  const section = <K extends string>(kind: K) =>
    slots.sections.find((s) => s.kind === kind) as Extract<(typeof slots.sections)[number], { kind: K }> | undefined

  const problem = section('problem')
  const two = section('twoColumns')
  const auditor = section('auditor')
  const caseSec = section('caseProof')
  const faq = section('faq')
  const cta = section('cta')
  if (!slots.hero || !slots.scope || !problem || !two || !auditor || !caseSec || !faq || !cta) {
    check(false, `${tag} fixtures`, 'el doc real no trae todas las ranuras')
    return
  }

  // ---- Fixtures ----
  const trail = buildTrail(locale, { slug: doc.slug, title: doc.title })
  const crumbs = trail.map((c) => ({ label: c.label, href: c.url }))
  const caseId = typeof caseSec.block.caseStudy === 'number' ? caseSec.block.caseStudy : null
  const caseDoc = caseId
    ? await getJson<{ slug: string; title: string; heroMetric?: string | null; sector?: string | null }>(
        `${BASE}/api/case-studies/${caseId}?locale=${locale}&depth=0`,
      )
    : null
  const proof: CaseProof = {
    slug: caseDoc?.slug ?? 'caso',
    title: caseDoc?.title ?? 'Caso',
    heroMetric: caseDoc?.heroMetric ?? '+406% clics interanuales',
    sector: caseDoc?.sector ?? null,
  }
  const others: OtherService[] = []
  for (const slug of ['seo-consulting', 'fullstack-development', 'ai-seo-geo'] as const) {
    const d = await fetchDoc(slug, locale)
    const scopeBlock = (d.content?.layout ?? []).find((b) => b.blockType === 'serviceScopeCard')
    others.push({
      slug,
      title: d.title,
      duration: scopeBlock?.blockType === 'serviceScopeCard' ? scopeBlock.timeline : null,
      icon: SERVICE_ICON_BY_SLUG[slug],
      href: buildServiceHref(locale, slug),
    })
  }

  const col0 = two.block.columns?.[0]?.richText
  const col1 = two.block.columns?.[1]?.richText
  const parts0 = splitColumn(col0)
  const parts1 = splitColumn(col1)

  const render = (el: React.ReactElement) => noStyle(renderToHtml(el, locale))

  const heroHtml = render(
    createElement(ServiceHero, {
      crumbs,
      title: slots.hero.title ?? doc.title,
      lead: slots.hero.subtitle,
      scope: {
        title: slots.scope.title,
        scope: slots.scope.scope,
        outcome: slots.scope.outcome,
        timeline: slots.scope.timeline,
      },
      cta: { label: 'Pedir una auditoria', href: '/contact' },
    }),
  )
  const problemHtml = render(
    createElement(ServiceProblem, { richTexts: (problem.block.columns ?? []).map((c) => c.richText) }),
  )
  const includesHtml = render(createElement(ServiceIncludes, { richText: col0 }))
  const howHtml = render(createElement(ServiceHow, { richText: col1 }))
  const extrasHtml = render(
    createElement(ServiceExtras, { heading: auditor.block.heading, narrative: auditor.block.narrative }),
  )
  const caseHtml = render(
    createElement(ServiceCaseProof, {
      proof,
      title: caseSec.block.title,
      framingText: caseSec.block.framingText,
    }),
  )
  const faqItems = (faq.block.faqs ?? []).map((f) => ({
    question: f.question,
    answer: createElement(MuiRichText, { data: f.answer as never, maxWidth: 720 }),
  }))
  const faqHtml = render(
    createElement(
      Section,
      { id: 'faq', title: faq.block.title?.trim() || 'Preguntas frecuentes' },
      createElement(FaqAccordion, { idPrefix: 'sf', items: faqItems, headingLevel: 3 }),
    ),
  )
  const otherHtml = render(createElement(OtherServices, { items: others }))
  const bandHtml = render(
    createElement(
      ServiceCtaBand,
      { link: { label: 'Pedir una auditoria', href: '/contact' } },
      createElement(MuiRichText, { data: cta.block.richText as never }),
    ),
  )

  const all = [heroHtml, problemHtml, includesHtml, howHtml, extrasHtml, caseHtml, faqHtml, otherHtml, bandHtml].join('\n')

  // ---- Encabezados ----
  check(countOf(heroHtml, /<h1[\s>]/) === 1, `${tag}: un solo h1 en el hero`, `h1 en hero: ${countOf(heroHtml, /<h1[\s>]/)}`)
  const h1Elsewhere = [problemHtml, includesHtml, howHtml, extrasHtml, caseHtml, faqHtml, otherHtml, bandHtml].reduce(
    (n, h) => n + countOf(h, /<h1[\s>]/),
    0,
  )
  check(h1Elsewhere === 0, `${tag}: ninguna otra seccion emite h1`, `h1 fuera del hero: ${h1Elsewhere}`)
  const levels = headingLevels(
    [heroHtml, problemHtml, includesHtml, howHtml, extrasHtml, caseHtml, faqHtml, otherHtml].join('\n'),
  )
  let jump = ''
  levels.forEach((lvl, i) => {
    const prev = i === 0 ? 0 : levels[i - 1]!
    if (lvl > prev + 1) jump = `salto de h${prev} a h${lvl} en la posicion ${i} (${levels.join(',')})`
  })
  check(levels[0] === 1 && jump === '', `${tag}: niveles h1, h2, h3 sin saltos`, jump || `empieza en h${levels[0]}`)
  check(countOf(includesHtml, /<h2[\s>]/) === 1 && countOf(howHtml, /<h2[\s>]/) === 1, `${tag}: Que incluye y Como trabajo tienen un h2 cada uno`, 'falta el h2 promovido')
  check(
    textOf(includesHtml).includes(parts0.title ?? '\u0000') && textOf(howHtml).includes(parts1.title ?? '\u0000'),
    `${tag}: los titulos h3 de las columnas se promueven a h2 con su texto`,
    'no aparece el texto del encabezado',
  )

  // ---- Que incluye ----
  check(countOf(includesHtml, /<ul[\s>]/) === 1, `${tag}: Que incluye es un ul`, `ul: ${countOf(includesHtml, /<ul[\s>]/)}`)
  check(
    countOf(includesHtml, /<li[\s>]/) === parts0.items.length && parts0.items.length > 0,
    `${tag}: Que incluye tiene tantos items como parrafos de la columna 1`,
    `li ${countOf(includesHtml, /<li[\s>]/)} contra ${parts0.items.length}`,
  )
  check(
    countOf(includesHtml, /<svg[^>]*aria-hidden="true"/) === parts0.items.length,
    `${tag}: cada item lleva su marca de verificacion decorativa`,
    `svg decorativos ${countOf(includesHtml, /<svg[^>]*aria-hidden="true"/)}`,
  )

  // ---- Como trabajo ----
  check(countOf(howHtml, /<ol[\s>]/) === 1, `${tag}: Como trabajo es un ol`, `ol: ${countOf(howHtml, /<ol[\s>]/)}`)
  const numerals = parts1.items.map((_, i) => String(i + 1).padStart(2, '0'))
  check(
    numerals.length > 0 &&
      numerals.every((n) => new RegExp(`<span[^>]*aria-hidden="true"[^>]*>${n}</span>`).test(howHtml)),
    `${tag}: los numerales mono son decorativos (aria-hidden)`,
    `faltan numerales ${numerals.join(', ')}`,
  )

  // ---- Aside ----
  const labelled = /<aside[^>]*aria-labelledby="([^"]+)"/.exec(heroHtml)
  check(Boolean(labelled && hasId(heroHtml, labelled[1]!)), `${tag}: el aside tiene aria-labelledby que resuelve`, 'sin aside o sin id')
  check(countOf(heroHtml, /<h3[\s>]/) === 2, `${tag}: el aside tiene dos h3 (incluye y logra)`, `h3 en el aside: ${countOf(heroHtml, /<h3[\s>]/)}`)

  // ---- Problema ----
  const firstH2Id = /<h2[^>]*\sid="([^"]+)"/.exec(problemHtml)
  check(
    Boolean(firstH2Id) && problemHtml.includes(`aria-labelledby="${firstH2Id![1]}"`),
    `${tag}: Problema se nombra con el id de su primer h2`,
    'el aria-labelledby no apunta al h2',
  )

  // ---- Prueba de caso, FAQ y otros ----
  check(caseHtml.includes(`href="${locale === 'en' ? '/en' : ''}/case-studies/${proof.slug}"`), `${tag}: el caso enlaza a /case-studies/<slug>`, 'href ausente')
  const closed = (faq.block.faqs ?? [])
    .slice(1)
    .map((f) => textOf(renderToHtml(createElement(MuiRichText, { data: f.answer as never }), locale)))
  check(
    closed.length > 0 && closed.every((txt) => txt === '' || textOf(faqHtml).includes(txt.slice(0, 60))),
    `${tag}: el texto de los paneles cerrados del FAQ esta en el HTML`,
    'falta el texto de un panel cerrado',
  )
  check(countOf(faqHtml, /<h3[\s>]/) === (faq.block.faqs ?? []).length, `${tag}: cada pregunta del FAQ es un h3`, `h3: ${countOf(faqHtml, /<h3[\s>]/)}`)
  check(countOf(otherHtml, /<li[\s>]/) === 3 && countOf(otherHtml, /<h3[\s>]/) === 3, `${tag}: Otros servicios son tres tarjetas con h3`, `li ${countOf(otherHtml, /<li[\s>]/)}`)
  check(
    others.every((o) => otherHtml.includes(`href="${o.href}"`)),
    `${tag}: Otros servicios usa el href dual por idioma`,
    `hrefs esperados ${others.map((o) => o.href).join(', ')}`,
  )
  check(countOf(bandHtml, /<form[\s>]/) === 0 && countOf(all, /<form[\s>]/) === 0, `${tag}: la banda y las secciones no llevan formulario`, 'hay un form')

  // ---- Higiene ----
  check(countOf(all, /<main[\s>]/) === 0, `${tag}: ninguna salida abre un main`, 'hay un main')
  check(!all.includes('{{'), `${tag}: ninguna salida trae llaves dobles sin renderizar`, 'hay {{')
  const ids = [...all.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!)
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  check(dup.length === 0, `${tag}: ningun id se repite`, `repetidos: ${[...new Set(dup)].join(', ')}`)
}

async function main(): Promise<void> {
  // ---- Mapeadores puros ----
  const logos = toMarqueeLogos([
    1,
    { id: 2, name: 'Sin logo', logo: 5 } as never,
    { id: 3, name: 'Con logo', logo: { id: 9, url: '/x.png', alt: null, width: 100, height: 40 }, onDark: true } as never,
  ])
  check(
    logos.length === 1 && logos[0]?.id === 3 && logos[0].alt === 'Con logo' && logos[0].onDark === true,
    'toMarqueeLogos omite ids sueltos y clientes sin logo con url',
    JSON.stringify(logos),
  )
  const items = toTestimonialItems([
    { id: 1, name: 'A', role: 'CEO', company: 'X', testimonial: 'Cita' },
    { id: 2, name: 'B', role: 'CTO', company: 'Y', testimonial: '   ' },
  ] as never)
  check(
    items.length === 1 && items[0]?.role === 'CEO · X',
    'toTestimonialItems omite citas vacias y une rol y empresa',
    JSON.stringify(items),
  )

  for (const locale of ['es', 'en'] as const) {
    try {
      await runLocale(locale)
    } catch (err) {
      check(false, `seo-technical-audit ${locale}`, err instanceof Error ? err.message : String(err))
    }
  }

  if (failures > 0) {
    console.log(`\n${failures} caso(s) en FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 54-service-ssr')
}

main().catch((err) => {
  console.log(`FAIL inesperado: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
