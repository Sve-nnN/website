/**
 * Phase 31 Plan 15 — humanize CaseStudies.clientContext + .conclusion (docs
 * 14-20, both locales), calibrated against research/voice-sample-juan.md and
 * .planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md
 * ("Case studies" section: same treatment as blog posts, extra care that
 * figures stay exact).
 *
 * Explicitly does NOT touch challenge[]/solution[] (already rewritten in
 * Phase 37) or testimonialSection (third-party attributed quotes, never
 * paraphrased). Only `clientContext`/`conclusion` are present in each
 * `payload.update` data payload, so every other field on these 7 docs is
 * structurally untouched by this script.
 *
 * Doc 20 (pittsburgh-criminal-defense-legal-content-seo) was anonymized in
 * Phase 37 (see 37-04-SUMMARY.md) — no real firm name ("Worgul, Sarna &
 * Ness"), no real domain ("pittsburghcriminalattorney.com"), no real county
 * ("Allegheny County"), no exact review count ("300 five-star reviews" /
 * "300 reseñas de cinco estrellas"). This script guards that anonymization
 * both before writing (fails fast if any of those literal strings are found
 * live, which would mean a pre-existing regression outside this plan's
 * scope) and after writing (confirms the rewrite didn't reintroduce them).
 *
 * All 7 docs' clientContext/conclusion fields contain exactly one paragraph
 * per locale (confirmed via a live read during planning and again in this
 * script's pre-write snapshot) — the rewrite below preserves that 1:1
 * paragraph count/order, only changing wording/rhythm.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-case-studies-content.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

type Locale = 'es' | 'en'
const LOCALES: Locale[] = ['es', 'en']
const CASE_STUDY_IDS = [14, 15, 16, 17, 18, 19, 20] as const

const DOC20_REAL_IDENTITY_STRINGS = [
  'Worgul, Sarna & Ness',
  'Worgul',
  'pittsburghcriminalattorney.com',
  'Allegheny County',
  '300 five-star reviews',
  '300 reseñas de cinco estrellas',
]

// Voceo markers per plan's <verify> section (es only — voceo doesn't apply to en).
const VOCEO_MARKERS = [
  'vos',
  'tenés',
  'tenes',
  'podés',
  'podes',
  'querés',
  'queres',
  'sabés',
  'sabeś',
  'usás',
  'usaś',
  'necesitás',
  'necesitaś',
  'trabajás',
  'trabajaś',
  'sospechás',
  'sospechaś',
  'preferís',
  'preferiś',
  'mirá',
]

function paragraph(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    children: [{ type: 'text', version: 1, text }],
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

function richTextFromParagraphs(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map(paragraph),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// Extracts plain text (paragraphs joined with a single space) from a richText
// field's `root.children[].children[].text` tree, for verification only.
function extractPlainText(richText: unknown): string {
  const root = (richText as { root?: { children?: unknown[] } } | undefined)?.root
  if (!root?.children) return ''
  const paragraphs = root.children as Array<{ children?: Array<{ text?: string }> }>
  return paragraphs
    .map((p) => (p.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')
}

// -------------------------------------------------------------------------
// Rewrite content — one paragraph per field per locale, matching the live
// paragraph count (all 7 docs have exactly 1 paragraph per field/locale).
// Every KPI number, date, sector descriptor, and (doc 20) anonymized
// substitution is preserved verbatim from the live content dumped during
// planning; only wording/rhythm changed, calibrated against
// research/voice-sample-juan.md (mixed long/short sentences, first person
// where natural, zero em dash, tuteo only/no voceo in es).
// -------------------------------------------------------------------------
const REWRITES: Record<
  number,
  { clientContext: Record<Locale, string>; conclusion: Record<Locale, string> }
> = {
  14: {
    clientContext: {
      es: 'Trabajé con una tienda online de más de 4,000 SKUs que necesitaba migrar de una plantilla de comercio genérica a una arquitectura headless en Next.js. El reto real era no perder el posicionamiento acumulado en más de tres años de trabajo SEO durante el proceso.',
      en: 'I worked with an online store carrying over 4,000 SKUs that needed to move from a generic commerce template to a headless Next.js architecture. The real challenge was not losing the search rankings built over three-plus years of SEO work during the process.',
    },
    conclusion: {
      es: 'La migración se completó sin que hubiera una sola semana de caída de tráfico durante el corte. El crecimiento que vino después confirma algo que repito seguido a clientes nerviosos por una migración: bien planificada, es una oportunidad de mejora SEO, no solo un riesgo que hay que mitigar.',
      en: 'The migration went through without a single week of traffic decline during cutover. The growth that followed confirms something I tell nervous clients before any migration: done right, it is an SEO opportunity, not just a risk to manage.',
    },
  },
  15: {
    clientContext: {
      es: 'Esta plataforma de educación financiera está dirigida a padres de niños de 8 a 12 años en mercados hispanohablantes. Combina una app gamificada con productos complementarios (libros, ebooks, sets de juego físicos) para enseñar finanzas personales de forma accesible, y casi toda su estrategia de adquisición pasa por el blog: artículos sobre finanzas para niños, manualidades y actividades familiares que capturan búsquedas informacionales de alto volumen.',
      en: "This financial-education platform targets parents of kids aged 8 to 12 in Spanish-speaking markets. It pairs a gamified app with complementary products (books, ebooks, physical game sets) to teach personal finance in an accessible way, and almost its entire acquisition strategy runs through the blog: educational articles about kids' finance, crafts, and family activities that pull in high-volume informational searches.",
    },
    conclusion: {
      es: 'En doce meses completos, el tráfico orgánico de la plataforma prácticamente se duplicó y las impresiones crecieron un 141%, con el blog educativo como motor principal de adquisición. Vale la nota honesta: los últimos seis meses del periodo (enero-junio 2026) muestran una caída del 25% en clics frente al semestre anterior, aunque las impresiones se mantuvieron estables. Todavía estoy investigando si es un ajuste de algoritmo o estacionalidad, pero no parece una pérdida de visibilidad estructural. La escala de esta cuenta, miles de clics y más de un millón de impresiones mensuales, sigue siendo con diferencia la más grande entre mis clientes de SEO.',
      en: 'Over a full 12-month period, this platform’s organic traffic nearly doubled and impressions grew 141%, with the educational blog as the primary acquisition engine. An honest note: the last six months of the period (Jan-Jun 2026) show a 25% click decline versus the prior six months, even as impressions held steady. I am still investigating whether that is an algorithm shift or seasonality, but it does not look like a structural loss of visibility. This account’s scale, thousands of clicks and over a million monthly impressions, remains by far the largest among my SEO clients.',
    },
  },
  16: {
    clientContext: {
      es: 'Este urólogo tiene más de 20 años de experiencia en Santiago, República Dominicana, especializado en endourología y cirugía laparoscópica para condiciones prostáticas, cálculos renales e infertilidad masculina. Su sitio era relativamente nuevo en términos de historial de indexación, así que dependía por completo de contenido educativo específico por condición para atraer pacientes que buscan información antes de agendar una consulta.',
      en: 'This urologist has over 20 years of experience in Santiago, Dominican Republic, specializing in endourology and laparoscopic surgery for prostate conditions, kidney stones, and male infertility. His site was relatively new in terms of indexing history, so it depended entirely on condition-specific educational content to reach patients researching before booking a consultation.',
    },
    conclusion: {
      es: 'La escala absoluta sigue siendo modesta, porque es el sitio de un solo profesional, no una cadena de clínicas. Pero el crecimiento porcentual es real y se sostuvo a lo largo de un año completo: los clics se multiplicaron por cinco y las impresiones por casi diez. Hoy existe visibilidad de marca y de contenido educativo donde antes prácticamente no había ninguna.',
      en: "The absolute scale is still modest, since this is a single practitioner's site, not a clinic chain. But the percentage growth is real and held up across a full year: clicks grew fivefold and impressions nearly tenfold. Brand and educational-content visibility exist now where there was practically none before.",
    },
  },
  17: {
    clientContext: {
      es: 'Este negocio ofrece talleres de costura presenciales en Hallandale Beach, Miami, dirigidos a niños de 6 a 12 años y a adultos mayores de 50+, con un programa pensado para el encuentro intergeneracional: espacios para desarrollar paciencia, creatividad y motricidad. Cuando empezamos a trabajar juntos era un sitio nuevo, sin historial previo de tráfico orgánico registrado.',
      en: 'This business runs in-person sewing workshops in Hallandale Beach, Miami, for kids aged 6-12 and adults 50+, through a program built for intergenerational gatherings: spaces designed to develop patience, creativity, and motor skills. When we started working together it was a brand-new site, with no prior recorded organic traffic history.',
    },
    conclusion: {
      es: 'Los números absolutos son pequeños, como corresponde a un negocio local nuevo con talleres presenciales y no a un e-commerce de escala. Pero la historia es honesta y real: en su primer año medible, el sitio pasó de cero presencia orgánica a capturar sus primeras búsquedas de marca y locales de alta intención. Esa es la base que hace falta antes de poder escalar cualquier estrategia de contenido.',
      en: 'The absolute numbers are small, as fits a new local business running in-person workshops rather than an e-commerce operation at scale. But the story is honest and real: in its first measurable year, the site went from zero organic presence to capturing its first high-intent branded and local searches. That is the foundation you need before any content strategy can scale.',
    },
  },
  18: {
    clientContext: {
      es: 'Este despacho de abogados de inmigración tiene sede en Atlanta, Georgia, y lleva más de tres décadas en el oficio. Su equipo lleva casos de inmigración familiar, empresarial, defensa contra la deportación y naturalización para clientes en todo Estados Unidos.',
      en: 'This immigration law firm is based in Atlanta, Georgia, with more than three decades in the business. Its team handles family and business immigration, deportation defense, and naturalization cases for clients across the United States.',
    },
    conclusion: {
      es: 'El crecimiento no es un evento puntual: se sostiene mes a mes a lo largo de los doce meses completos analizados, y el contenido educativo sobre el propio proceso migratorio (no solo las búsquedas de marca) fue uno de los motores del salto. La consulta local "immigration lawyer atlanta" también mejoró, aunque de forma más moderada, lo que sugiere que el crecimiento viene principalmente de captar demanda informacional que antes no se atendía, y no tanto de ganar posiciones en la consulta comercial de marca.',
      en: 'This growth is not a one-off spike: it holds steady month over month across the full twelve-month period, and educational content about the immigration process itself (not just branded search) drove a meaningful share of the jump. The local query "immigration lawyer atlanta" also improved, though more modestly, which suggests the growth comes mainly from capturing informational demand that was not being served before, rather than from gaining ground on the branded commercial query.',
    },
  },
  19: {
    clientContext: {
      es: 'Este fabricante familiar de baldosas hidráulicas y terrazo artesanal tiene sede en España y lleva décadas en el oficio. Producen cientos de modelos con métodos de fabricación tradicionales y venden a proyectos residenciales y comerciales, dentro y fuera del país.',
      en: 'This family-run manufacturer of hydraulic tiles and artisan terrazzo is based in Spain and has decades in the craft. They produce hundreds of models using traditional manufacturing methods and sell to residential and commercial projects, both in Spain and abroad.',
    },
    conclusion: {
      es: 'El crecimiento se sostiene en un mercado donde compite contra distribuidores mucho más grandes. Es un fabricante artesanal con catálogo limitado frente a marketplaces de materiales de construcción, así que cuadruplicar los clics en la consulta genérica "baldosa hidráulica" es una señal clara de que el contenido y la estructura del sitio lograron capturar demanda que antes se iba a la competencia.',
      en: 'The growth holds up in a market where they compete against much larger distributors. This is an artisan manufacturer with a limited catalog going up against building-materials marketplaces, so quadrupling clicks on the generic query "baldosa hidráulica" is a clear signal that the content and site structure captured demand that used to go to the competition.',
    },
  },
  // Doc 20 — anonymized in Phase 37. No firm name, no domain, no county, no
  // exact review count anywhere in this rewrite (city "Pittsburgh" and
  // region "Western Pennsylvania" are kept, consistent with docs 15-19's
  // pattern of naming cities/regions but never brand names/domains/counts).
  20: {
    clientContext: {
      es: 'Este despacho de abogados de defensa criminal tiene sede en Pittsburgh, Pensilvania. Se dedica exclusivamente a defensa penal: DUI, delitos de armas, drogas, delitos de cuello blanco y más. Representa clientes en la región de Pittsburgh y el oeste de Pensilvania, y tiene detrás un historial sólido de reseñas de cinco estrellas.',
      en: 'This criminal defense law firm is based in Pittsburgh, Pennsylvania. It practices criminal defense exclusively: DUI, weapons charges, drug crimes, white-collar offenses, and more. It represents clients across the Pittsburgh region and Western Pennsylvania, backed by a strong track record of five-star reviews.',
    },
    conclusion: {
      es: 'El despacho ya tenía una base sólida de tráfico antes de este periodo, así que el reto no era partir de cero sino escalar: casi duplicar un volumen que ya superaba los 47,000 clics anuales, apoyado en una estrategia de contenido legal específico y no solo en búsquedas de marca. La posición promedio en escritorio mejoró de 36.3 a 19.2, lo que muestra que el trabajo también alcanzó al contenido que antes quedaba fuera de la primera página.',
      en: 'The firm already had a solid traffic base going into this period, so the challenge was not starting from zero but scaling: nearly doubling a volume that already exceeded 47,000 annual clicks, driven by a specific legal-content strategy rather than relying only on branded search. Average desktop position improved from 36.3 to 19.2, showing the work also reached content that used to sit off page one.',
    },
  },
}

// -------------------------------------------------------------------------
// Deviation (Rule 2/3 — discovered live during this plan's execution, NOT
// part of the original task list): doc 14 is the one CaseStudies doc that
// predates Phase 37's bilingual-parity pass — its `kpis[].label`,
// `challenge[].text`, `solution[].title/description`, and
// `results.metrics[].label` have NO `es` values at all (English-only),
// unlike docs 15-20 which are fully bilingual (confirmed via a live check
// before writing this backfill). Payload validates the ENTIRE document for
// required+localized fields on every `update` call regardless of what's in
// the `data` payload, so this pre-existing gap blocks ANY `locale: 'es'`
// write to doc 14 — including this plan's clientContext/conclusion rewrite,
// which never touches these fields.
//
// Fix: backfill faithful, literal ES translations (not voice-rewritten —
// this area is out of this plan's scope beyond unblocking the write) for
// doc 14's four field groups, preserving every id and every non-localized
// number (kpis.value, results.metrics.before/after) byte-for-byte. This
// mirrors the exact fix Phase 37 already applied to doc 20 for the same bug
// class (see 37-04-SUMMARY.md).
// -------------------------------------------------------------------------
const DOC14_ES_BACKFILL = {
  kpis: {
    '6a512386966b7af8e578b043': 'Crecimiento de tráfico',
    '6a512386966b7af8e578b044': 'Mejora del LCP móvil',
    '6a512386966b7af8e578b045': 'Semanas sin caída',
  } as Record<string, string>,
  resultsMetrics: {
    '6a512386966b7af8e578b04c': 'Tráfico orgánico mensual',
    '6a512386966b7af8e578b04d': 'LCP móvil promedio',
    '6a512386966b7af8e578b04e': 'Páginas indexadas',
  } as Record<string, string>,
  challenge: {
    '6a512386966b7af8e578b046':
      'El sitio original tenía Core Web Vitals deficientes, con un LCP móvil por encima de 4 segundos.',
    '6a512386966b7af8e578b047':
      'La migración de plataforma implicaba cambiar la estructura de URLs de miles de páginas de producto y categoría.',
    '6a512386966b7af8e578b048':
      'El equipo de marketing necesitaba seguir publicando contenido al mismo ritmo durante toda la migración.',
  } as Record<string, string>,
  solution: {
    '6a512386966b7af8e578b049': {
      title: 'Mapa de redirecciones 301, uno a uno',
      description:
        'El inventario de URLs en vivo se congeló antes del corte, y se construyó y verificó una tabla de redirecciones contra el sitemap anterior, evitando la pérdida de link equity.',
    },
    '6a512386966b7af8e578b04a': {
      title: 'Renderizado híbrido con Next.js',
      description:
        'Las páginas de producto y categoría pasaron a generación estática incremental, reduciendo el LCP móvil de 4.2s a 1.6s.',
    },
    '6a512386966b7af8e578b04b': {
      title: 'Datos estructurados y sitemap dinámico',
      description:
        'Se implementó JSON-LD de Product/BreadcrumbList junto con un sitemap generado desde base de datos que siempre refleja el catálogo actual.',
    },
  } as Record<string, { title: string; description: string }>,
}

async function backfillDoc14EsLocaleGap(payload: Awaited<ReturnType<typeof getPayload>>) {
  const doc14En = await payload.findByID({ collection: 'case-studies', id: 14, locale: 'en', depth: 0 })

  const kpis = ((doc14En.kpis ?? []) as Array<{ id: string; value: string }>).map((row) => ({
    id: row.id,
    value: row.value,
    label: DOC14_ES_BACKFILL.kpis[row.id],
  }))
  const metrics = (((doc14En.results as { metrics?: Array<{ id: string; before: string; after: string }> })
    ?.metrics ?? []) as Array<{ id: string; before: string; after: string }>
  ).map((row) => ({
    id: row.id,
    before: row.before,
    after: row.after,
    label: DOC14_ES_BACKFILL.resultsMetrics[row.id],
  }))
  const challenge = ((doc14En.challenge ?? []) as Array<{ id: string }>).map((row) => ({
    id: row.id,
    text: DOC14_ES_BACKFILL.challenge[row.id],
  }))
  const solution = ((doc14En.solution ?? []) as Array<{ id: string }>).map((row) => ({
    id: row.id,
    title: DOC14_ES_BACKFILL.solution[row.id].title,
    description: DOC14_ES_BACKFILL.solution[row.id].description,
  }))

  const missing = [
    ...kpis.filter((r) => !r.label),
    ...metrics.filter((r) => !r.label),
    ...challenge.filter((r) => !r.text),
    ...solution.filter((r) => !r.title || !r.description),
  ]
  if (missing.length > 0) {
    console.error('FATAL: doc 14 ES backfill map is missing translations for live row ids:', missing)
    process.exit(1)
  }

  await payload.update({
    collection: 'case-studies',
    id: 14,
    locale: 'es',
    data: {
      kpis,
      results: {
        periodBefore: (doc14En.results as { periodBefore?: string })?.periodBefore,
        periodAfter: (doc14En.results as { periodAfter?: string })?.periodAfter,
        metrics,
      },
      challenge,
      solution,
    },
  })
  console.log(
    'Doc 14: backfilled missing es translations for kpis/results.metrics/challenge/solution (pre-existing gap, blocks any es-locale write) — all non-localized numbers (value/before/after) preserved byte-for-byte from live en doc',
  )
}

async function run() {
  const payload = await getPayload({ config })

  // -------------------------------------------------------------------
  // Guard 1: confirm live doc count is exactly 7 with ids 14-20.
  // -------------------------------------------------------------------
  const { docs } = await payload.find({ collection: 'case-studies', limit: 0, depth: 0 })
  const liveIds = docs.map((d) => d.id).sort((a, b) => Number(a) - Number(b))
  const expectedIds = [...CASE_STUDY_IDS]
  const idsMatch =
    liveIds.length === expectedIds.length &&
    liveIds.every((id, i) => Number(id) === expectedIds[i])
  if (!idsMatch) {
    console.error(
      `FATAL: expected exactly 7 CaseStudies docs with ids ${expectedIds.join(',')}, found ${liveIds.length}: ${liveIds.join(',')}`,
    )
    process.exit(1)
  }
  console.log(`Guard 1 passed: live CaseStudies count is 7, ids ${liveIds.join(',')}`)

  // -------------------------------------------------------------------
  // Guard 2 (pre-write): doc 20's live clientContext must NOT contain any
  // real-identity string from Phase 37's anonymization. If any are found,
  // stop — this would mean the anonymization regressed before this plan
  // even ran, which is out of scope to silently fix here.
  // -------------------------------------------------------------------
  const preWriteSnapshot: Record<number, { challenge: unknown; solution: unknown }> = {}
  const doc20Pre = await payload.findByID({
    collection: 'case-studies',
    id: 20,
    locale: 'all',
    depth: 0,
  })
  const doc20PreText = JSON.stringify(doc20Pre.clientContext) + JSON.stringify(doc20Pre.conclusion)
  const foundRealIdentityPre = DOC20_REAL_IDENTITY_STRINGS.filter((s) => doc20PreText.includes(s))
  if (foundRealIdentityPre.length > 0) {
    console.error(
      `FATAL: doc 20 live content already contains real-identity strings BEFORE this plan's rewrite: ${foundRealIdentityPre.join(', ')}. This is a pre-existing regression of Phase 37's anonymization — stopping rather than proceeding on an assumption.`,
    )
    process.exit(1)
  }
  console.log('Guard 2 passed: doc 20 anonymization confirmed intact BEFORE rewrite')

  // Snapshot challenge[]/solution[] on all 7 docs for the post-write
  // byte-identity check (confirms the partial-update discipline held).
  for (const id of CASE_STUDY_IDS) {
    const doc = await payload.findByID({ collection: 'case-studies', id, locale: 'all', depth: 0 })
    preWriteSnapshot[id] = { challenge: doc.challenge, solution: doc.solution }
  }
  console.log('Pre-write snapshot of challenge[]/solution[] captured for all 7 docs')

  // Deviation (Rule 2/3, see comment above `DOC14_ES_BACKFILL`): doc 14's
  // kpis/challenge/solution/results.metrics have no `es` values at all,
  // which blocks any `locale: 'es'` write to doc 14 via Payload's
  // full-document required-field validation. Backfill BEFORE the main
  // rewrite loop so the subsequent clientContext/conclusion write succeeds.
  await backfillDoc14EsLocaleGap(payload)

  // -------------------------------------------------------------------
  // Write: clientContext + conclusion, per locale, per doc. Only these two
  // fields are present in each `data` payload.
  // -------------------------------------------------------------------
  for (const id of CASE_STUDY_IDS) {
    const rewrite = REWRITES[id]
    for (const locale of LOCALES) {
      await payload.update({
        collection: 'case-studies',
        id,
        locale,
        data: {
          clientContext: richTextFromParagraphs([rewrite.clientContext[locale]]),
          conclusion: richTextFromParagraphs([rewrite.conclusion[locale]]),
        },
      })
    }
    console.log(`Doc ${id}: clientContext + conclusion rewritten (es, en)`)
  }

  // -------------------------------------------------------------------
  // Self-verification pass: read back all 7 docs, both locales.
  // -------------------------------------------------------------------
  let failures = 0

  for (const id of CASE_STUDY_IDS) {
    const doc = await payload.findByID({ collection: 'case-studies', id, locale: 'all', depth: 0 })

    // 3. challenge[]/solution[] byte-identical to pre-write snapshot.
    // Exception: doc 14 — its `es` side was intentionally backfilled (see
    // `backfillDoc14EsLocaleGap`, a documented deviation to unblock the
    // `es`-locale write); for doc 14 only, compare the `en` side (which
    // must remain byte-identical) instead of the full object.
    const pre = preWriteSnapshot[id]
    const challengeIdentical =
      id === 14
        ? JSON.stringify((doc.challenge as Array<{ text?: { en?: string } }>).map((r) => r.text?.en)) ===
          JSON.stringify((pre.challenge as Array<{ text?: { en?: string } }>).map((r) => r.text?.en))
        : JSON.stringify(doc.challenge) === JSON.stringify(pre.challenge)
    const solutionIdentical =
      id === 14
        ? JSON.stringify(
            (doc.solution as Array<{ title?: { en?: string }; description?: { en?: string } }>).map((r) => [
              r.title?.en,
              r.description?.en,
            ]),
          ) ===
          JSON.stringify(
            (pre.solution as Array<{ title?: { en?: string }; description?: { en?: string } }>).map((r) => [
              r.title?.en,
              r.description?.en,
            ]),
          )
        : JSON.stringify(doc.solution) === JSON.stringify(pre.solution)
    if (!challengeIdentical) {
      console.error(`FAIL doc ${id}: challenge[] is NOT byte-identical to pre-write state`)
      failures++
    }
    if (!solutionIdentical) {
      console.error(`FAIL doc ${id}: solution[] is NOT byte-identical to pre-write state`)
      failures++
    }

    for (const locale of LOCALES) {
      const clientContextText = extractPlainText(
        (doc.clientContext as unknown as Record<Locale, unknown>)[locale],
      )
      const conclusionText = extractPlainText(
        (doc.conclusion as unknown as Record<Locale, unknown>)[locale],
      )
      const combinedText = `${clientContextText} ${conclusionText}`

      // 5. Zero em dash characters.
      if (combinedText.includes('—')) {
        console.error(`FAIL doc ${id} (${locale}): em dash character found in rewritten content`)
        failures++
      }

      // 5. Zero voceo markers (es only).
      if (locale === 'es') {
        const lowerText = combinedText.toLowerCase()
        const foundVoceo = VOCEO_MARKERS.filter((marker) =>
          new RegExp(`\\b${marker}\\b`, 'i').test(lowerText),
        )
        if (foundVoceo.length > 0) {
          console.error(`FAIL doc ${id} (es): voceo marker(s) found: ${foundVoceo.join(', ')}`)
          failures++
        }
      }

      // 4. Doc 20 anonymization confirmed intact post-write.
      if (id === 20) {
        const foundRealIdentityPost = DOC20_REAL_IDENTITY_STRINGS.filter((s) =>
          combinedText.includes(s),
        )
        if (foundRealIdentityPost.length > 0) {
          console.error(
            `FAIL doc 20 (${locale}): real-identity string(s) reintroduced post-write: ${foundRealIdentityPost.join(', ')}`,
          )
          failures++
        }
      }
    }
  }

  if (failures > 0) {
    console.error(`\nSelf-verification FAILED with ${failures} issue(s). See above.`)
    process.exit(1)
  }

  console.log(
    '\nSelf-verification PASSED: all 7 docs rewritten (es/en), challenge[]/solution[] byte-identical to pre-write state, doc 20 anonymization intact, zero em dash, zero voceo.',
  )
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
