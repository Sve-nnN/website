/**
 * Phase 34 (LOCAL-03/LOCAL-04/LOCAL-05) — applies the Phase 33
 * `Hero/local-landing` variant + `LocalProofSection` block to the two
 * REAL, already-live pages `seo-tecnico-madrid` and `seo-tecnico-lima`.
 *
 * This does NOT create new pages. It fetches each existing page doc (both
 * locales), leaves the existing `content`/`faq`/`callToAction` blocks
 * completely untouched, and:
 *   1. Converts the existing `hero` block (index 0) from `variant: 'listing'`
 *      to `variant: 'local-landing'`, keeping its existing `title`/`subtitle`
 *      (already real, already correct per locale) and adding the new
 *      local-landing fields (cityName, inlineStat, ringSide, ringOpacity,
 *      ringFlipX, links).
 *   2. Inserts a new `localProofSection` block right after the hero block.
 *
 * PLACEHOLDER CONTENT (explicitly authorized by Juan for this phase, real
 * data pending — see 34-01-SUMMARY.md for the full placeholder table):
 *   - Madrid hero.inlineStat: no equivalent real fact exists yet for Madrid,
 *     marked `[PLACEHOLDER]`.
 *   - Madrid localProofSection: all 3 stats + the testimonial (both cities'
 *     testimonials) are placeholders — Juan has not supplied a real Madrid
 *     stat, and testimonials for both cities await real client data from
 *     Google Search Console / real client feedback he is still connecting.
 *   - Lima localProofSection stat #1 ("18 asistentes...") IS a real,
 *     already-seeded fact (2025 DinoRANK/Arianna Lupi workshop, see
 *     .planning/milestones/v1.4-phases/20-seo-local-geo-pages/). Stats #2/#3
 *     and the testimonial are placeholders.
 *   - Lima hero.inlineStat reuses that same real workshop fact — NOT a
 *     placeholder.
 * Every placeholder value is prefixed with the literal string
 * `[PLACEHOLDER]` so `grep -r "\[PLACEHOLDER\]"` across a DB export finds
 * all of them. Real (non-placeholder) CTA copy ("Conversar sobre tu
 * proyecto" / "Talk about your project", linking to /contact — matching
 * the existing site-wide CTA convention, e.g. scripts/seed-phase20-data/copy.ts)
 * and the /case-studies destination for Lima's secondary button are real,
 * not placeholders.
 *
 * This is an additive/non-destructive content UPDATE via the Payload Local
 * API (no schema migration, no drops) — per project CLAUDE.md's DB safety
 * rules, does not require pause-for-confirmation.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/phase34-apply-local-landing.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

type AnyBlock = Record<string, unknown>

/** Generic recursive id-reuse: copies `id` from `reference` into `fresh`
 * wherever both are arrays (matched by index) or plain objects, so that a
 * second per-locale `update()` call doesn't spawn duplicate array rows for
 * fields Payload just assigned ids to on the first (`es`) write. Same intent
 * as `reapplyIds()` in scripts/seed-phase20-geo-pages.ts, generalized to
 * walk any array-bearing key instead of hardcoding `columns`/`faqs`/`links`. */
function applyIds(fresh: unknown, reference: unknown): unknown {
  if (Array.isArray(fresh)) {
    const refArr = Array.isArray(reference) ? reference : []
    return fresh.map((item, i) => applyIds(item, refArr[i]))
  }
  if (fresh && typeof fresh === 'object') {
    const freshObj = fresh as AnyBlock
    const refObj = (reference && typeof reference === 'object' ? reference : {}) as AnyBlock
    const result: AnyBlock = { ...freshObj }
    if ('id' in refObj && refObj.id != null) {
      result.id = refObj.id
    }
    for (const key of Object.keys(freshObj)) {
      if (Array.isArray(freshObj[key])) {
        result[key] = applyIds(freshObj[key], refObj[key])
      }
    }
    return result
  }
  return fresh
}

const CTA_LABEL: Record<Locale, string> = {
  es: 'Conversar sobre tu proyecto',
  en: 'Talk about your project',
}

const CASE_STUDIES_LABEL: Record<Locale, string> = {
  es: 'Ver casos en Lima',
  en: 'See Lima case studies',
}

const CITY_NAME: Record<'madrid' | 'lima', string> = {
  madrid: 'Madrid',
  lima: 'Lima',
}

const MADRID_INLINE_STAT: Record<Locale, string> = {
  es: '[PLACEHOLDER] Estadistica real pendiente — reemplazar antes de publicar',
  en: '[PLACEHOLDER] Real stat pending — replace before publishing',
}

const LIMA_INLINE_STAT: Record<Locale, string> = {
  es: '+18 asistentes en el taller SEO + IA 2025 (con Arianna Lupi)',
  en: '+18 attendees at the 2025 SEO + AI workshop (with Arianna Lupi)',
}

const MADRID_STATS: Record<Locale, { value: string; label: string }[]> = {
  es: [
    { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (clientes en Espana)' },
    { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (proyectos en Espana)' },
    { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (keywords investigadas)' },
  ],
  en: [
    { value: '0', label: '[PLACEHOLDER] Replace with real data (clients in Spain)' },
    { value: '0', label: '[PLACEHOLDER] Replace with real data (projects in Spain)' },
    { value: '0', label: '[PLACEHOLDER] Replace with real data (keywords researched)' },
  ],
}

const LIMA_STATS: Record<Locale, { value: string; label: string }[]> = {
  es: [
    { value: '18', label: 'Asistentes en el taller SEO + IA 2025 (con Arianna Lupi)' },
    { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (clientes en Lima)' },
    { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (proyectos en Lima)' },
  ],
  en: [
    { value: '18', label: '2025 SEO + AI workshop attendees (with Arianna Lupi)' },
    { value: '0', label: '[PLACEHOLDER] Replace with real data (clients in Lima)' },
    { value: '0', label: '[PLACEHOLDER] Replace with real data (projects in Lima)' },
  ],
}

const TESTIMONIAL_AUTHOR_NAME = '[PLACEHOLDER] Nombre pendiente / Name pending'

const TESTIMONIAL: Record<Locale, { quote: string; authorBusiness: string }> = {
  es: {
    quote: '[PLACEHOLDER] Testimonio real pendiente — reemplazar antes de publicar.',
    authorBusiness: '[PLACEHOLDER] Negocio pendiente',
  },
  en: {
    quote: '[PLACEHOLDER] Real testimonial pending — replace before publishing.',
    authorBusiness: '[PLACEHOLDER] Business pending',
  },
}

type CityKey = 'madrid' | 'lima'

const RING: Record<CityKey, { ringSide: 'left' | 'right'; ringOpacity: number; ringFlipX: boolean }> = {
  madrid: { ringSide: 'right', ringOpacity: 0.25, ringFlipX: false },
  lima: { ringSide: 'left', ringOpacity: 0.35, ringFlipX: true },
}

function buildHeroLinks(city: CityKey, locale: Locale) {
  const links: AnyBlock[] = [
    {
      link: {
        type: 'custom',
        newTab: false,
        url: '/contact',
        label: CTA_LABEL[locale],
        appearance: 'default',
      },
    },
  ]
  if (city === 'lima') {
    links.push({
      link: {
        type: 'custom',
        newTab: false,
        url: '/case-studies',
        label: CASE_STUDIES_LABEL[locale],
        appearance: 'outline',
      },
    })
  }
  return links
}

function buildHero(city: CityKey, locale: Locale, existingHero: AnyBlock): AnyBlock {
  const ring = RING[city]
  return {
    ...existingHero,
    variant: 'local-landing',
    ...ring,
    cityName: CITY_NAME[city],
    inlineStat: city === 'madrid' ? MADRID_INLINE_STAT[locale] : LIMA_INLINE_STAT[locale],
    links: buildHeroLinks(city, locale),
  }
}

function buildLocalProofSection(city: CityKey, locale: Locale): AnyBlock {
  const stats = city === 'madrid' ? MADRID_STATS[locale] : LIMA_STATS[locale]
  const testimonial = TESTIMONIAL[locale]
  return {
    blockType: 'localProofSection',
    stats,
    testimonial: {
      quote: testimonial.quote,
      authorName: TESTIMONIAL_AUTHOR_NAME,
      authorBusiness: testimonial.authorBusiness,
    },
  }
}

async function applyToPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  city: CityKey,
) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale: 'es',
    limit: 1,
    depth: 0,
  })
  const doc = docs[0]
  if (!doc) {
    throw new Error(`Page with slug "${slug}" not found — refusing to create a new page (Phase 34 must not create pages).`)
  }
  const docId = doc.id

  // Fetch both locales' current layout independently (content/faq/callToAction
  // must stay exactly as-is per locale).
  const layoutByLocale: Record<Locale, AnyBlock[]> = { es: [], en: [] }
  for (const locale of LOCALES) {
    const { docs: localeDocs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      locale,
      limit: 1,
      depth: 0,
    })
    layoutByLocale[locale] = ((localeDocs[0]?.content as { layout?: AnyBlock[] } | undefined)?.layout ?? []) as AnyBlock[]
  }

  const heroIdxEs = layoutByLocale.es.findIndex((b) => b.blockType === 'hero')
  if (heroIdxEs === -1) {
    throw new Error(`No hero block found on "${slug}" — expected an existing hero block to convert.`)
  }

  // --- Pass 1: write locale 'es' first (assigns ids to new array rows) ---
  const freshEs = [...layoutByLocale.es]
  freshEs[heroIdxEs] = buildHero(city, 'es', layoutByLocale.es[heroIdxEs])
  freshEs.splice(heroIdxEs + 1, 0, buildLocalProofSection(city, 'es'))

  await payload.update({
    collection: 'pages',
    id: docId,
    locale: 'es',
    data: { content: { layout: freshEs as never } },
  })

  // Re-fetch to discover the ids Payload just assigned to the new rows.
  const { docs: reFetchedEsDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale: 'es',
    limit: 1,
    depth: 0,
  })
  const referenceLayout = ((reFetchedEsDocs[0]?.content as { layout?: AnyBlock[] } | undefined)?.layout ?? []) as AnyBlock[]

  // --- Pass 2: build 'en' layout structurally identical (same block order,
  // same row counts), then reuse the ids just assigned. ---
  const freshEn = [...layoutByLocale.en]
  const heroIdxEn = freshEn.findIndex((b) => b.blockType === 'hero')
  freshEn[heroIdxEn] = buildHero(city, 'en', layoutByLocale.en[heroIdxEn])
  freshEn.splice(heroIdxEn + 1, 0, buildLocalProofSection(city, 'en'))

  const freshEnWithIds = applyIds(freshEn, referenceLayout) as AnyBlock[]

  await payload.update({
    collection: 'pages',
    id: docId,
    locale: 'en',
    data: { content: { layout: freshEnWithIds as never } },
  })

  console.log(`Updated "${slug}" (id=${docId}) — hero -> local-landing, localProofSection inserted at index ${heroIdxEs + 1}.`)
}

async function main() {
  const payload = await getPayload({ config })

  await applyToPage(payload, 'seo-tecnico-madrid', 'madrid')
  await applyToPage(payload, 'seo-tecnico-lima', 'lima')

  // --- Confirmation: re-fetch and print the relevant fields ---
  for (const slug of ['seo-tecnico-madrid', 'seo-tecnico-lima']) {
    for (const locale of LOCALES) {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        depth: 0,
      })
      const layout = ((docs[0]?.content as { layout?: AnyBlock[] } | undefined)?.layout ?? []) as AnyBlock[]
      const hero = layout.find((b) => b.blockType === 'hero')
      const proof = layout.find((b) => b.blockType === 'localProofSection')
      console.log(`\n=== ${slug} [${locale}] ===`)
      console.log('hero:', JSON.stringify({
        variant: hero?.variant,
        cityName: hero?.cityName,
        inlineStat: hero?.inlineStat,
        ringSide: hero?.ringSide,
        ringOpacity: hero?.ringOpacity,
        ringFlipX: hero?.ringFlipX,
        links: hero?.links,
      }, null, 2))
      console.log('localProofSection:', JSON.stringify(proof, null, 2))
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
