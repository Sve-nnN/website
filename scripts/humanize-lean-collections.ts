/**
 * Phase 30 Plan 01, Task 3 — humanize Authors, Testimonials, SpeakingEvents,
 * Categories in Juan's calibrated voice (both locales), calibrated against
 * research/voice-sample-juan.md and 29-VOICE-PROFILE.md.
 *
 * Clientes is an intentional no-op — every field (name, websiteUrl) is a
 * non-localized proper noun/URL, confirmed correct as-is in 30-PATTERNS.md.
 * No update logic exists for Clientes in this script by design.
 *
 * Fields NOT touched anywhere below (non-localized, correct as-is):
 *   Authors.name/avatar/yearsExperience/socialLinks[].url
 *   Testimonials.name/company/avatar
 *   SpeakingEvents.coSpeakers[].name/date/attendeeCount/link/flyer
 *   SpeakingEvents.location — confirmed via live read to hold a city/country
 *     proper noun ("Lima, Peru" / "Caracas, Venezuela"), left untouched per
 *     29-FIELD-AUDIT.md Action Needed #4.
 *   Categories.slug
 * No meta.title/meta.description/targetKeyword field is touched anywhere.
 *
 * Only fields with a genuine content change are included in each `data`
 * payload passed to `payload.update` — Payload only replaces fields present
 * in the update call, so array sub-fields not mentioned here (e.g. Authors
 * credentials/expertise/education/experience, confirmed already in-voice via
 * a live read before this script was written) are left completely
 * untouched, no id-reuse fetch needed for them.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-lean-collections.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

type Locale = 'es' | 'en'
const LOCALES: Locale[] = ['es', 'en']

async function run() {
  const payload = await getPayload({ config })

  // ---------------------------------------------------------------------
  // AUTHORS — only `bio` genuinely changes. jobTitle, credentials, expertise,
  // education, experience were confirmed already in Juan's calibrated voice
  // via a live read before writing this script (short technical labels,
  // quantified facts, no em dash) and are left untouched.
  //
  // ES bio: rhythm was already close to the voice sample (this is the
  // "referencia positiva" per 29-VOICE-PROFILE.md) but used em dashes
  // ("—rastreo, indexabilidad...—"), which the voice sample explicitly never
  // does. Replaced with parentheses.
  // EN bio: rewritten from a compressed/listy register ("I build... I
  // conduct... and help...") to the same mixed long/short rhythm as the ES
  // version, per VOICE-PROFILE's explicit rule against a more "polished/
  // corporate" EN register.
  // ---------------------------------------------------------------------
  const authorsBioByLocale: Record<Locale, string> = {
    es: `Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda.

Mi trabajo combina la auditoría técnica SEO (rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados) con el desarrollo full-stack usando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica con correcciones directas a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe para desarrolladores y profesionales de tecnología en Latinoamérica y España.`,
    en: `I'm Juan Carlos Angulo, a Software Engineer and Technical SEO Consultant based in Lima, Peru, with over four years of professional experience. My work sits at the intersection of software development and search engine optimization: technical SEO audits (crawlability, Core Web Vitals, Schema.org, indexation) combined with full-stack development in Next.js and Payload CMS. I help businesses grow their organic visibility by fixing issues directly in the code, no intermediaries involved. I also run juan-tech.com, a bilingual technical blog for developers and tech professionals across Latin America and Spain.`,
  }

  const { docs: authorDocs } = await payload.find({ collection: 'authors', limit: 0 })
  for (const doc of authorDocs) {
    for (const locale of LOCALES) {
      await payload.update({
        collection: 'authors',
        id: doc.id,
        locale,
        data: { bio: authorsBioByLocale[locale] },
      })
    }
  }
  console.log(`Authors: bio rewritten for ${authorDocs.length} doc(s) (es/en)`)

  // ---------------------------------------------------------------------
  // TESTIMONIALS — role ("CEO") is a title acronym, correct in both locales
  // unchanged. `testimonial` had the literal Spanish text duplicated into
  // the en locale (a real locale-parity bug, not a translation) — fixed
  // with a faithful, minimal EN rendering, no invented claims added.
  // ---------------------------------------------------------------------
  const testimonialTextByLocale: Record<number | string, Record<Locale, string>> = {}

  const { docs: testimonialDocs } = await payload.find({ collection: 'testimonials', limit: 0 })
  for (const doc of testimonialDocs) {
    // Only the known live testimonial (Patricia Ibarra / Estylopia) is
    // rewritten explicitly; any other doc's testimonial is left untouched
    // rather than guessed at.
    if (doc.name === 'Patricia Ibarra') {
      testimonialTextByLocale[doc.id] = {
        es: 'Trabajar con Juan fue lo mejor.',
        en: 'Working with Juan was the best decision we made.',
      }
    }
  }

  for (const doc of testimonialDocs) {
    const rewrite = testimonialTextByLocale[doc.id]
    if (!rewrite) continue
    for (const locale of LOCALES) {
      await payload.update({
        collection: 'testimonials',
        id: doc.id,
        locale,
        data: { testimonial: rewrite[locale] },
      })
    }
  }
  console.log(
    `Testimonials: testimonial text fixed for ${Object.keys(testimonialTextByLocale).length} doc(s) (es/en) — locale-collapse bug (identical es/en text) corrected`,
  )

  // ---------------------------------------------------------------------
  // SPEAKING EVENTS — title kept (already good). `role` used em dashes
  // ("Co-instructor — Tech SEO") which the voice sample explicitly never
  // does — replaced with a comma. `description` for the Caracas event had
  // redundant "first conference... first conference" phrasing in both
  // locales, tightened without losing any fact (100 attendees, Caracas,
  // Venezuela, first SEO conference).
  // ---------------------------------------------------------------------
  const speakingEventsRewrites: Record<
    string,
    { role: Record<Locale, string>; description?: Record<Locale, string> }
  > = {
    'Taller SEO + IA en Lima (por DinoRANK)': {
      role: { es: 'Co-instructor, SEO Técnico', en: 'Co-instructor, Technical SEO' },
      // description already factual and specific (4-hour workshop, 18
      // attendees, DinoRANK, Lm Marketing) — no em dash, no filler, left
      // unchanged.
    },
    'Caracas SEO Fest': {
      role: { es: 'Ponente, SEO Técnico', en: 'Speaker, Technical SEO' },
      description: {
        es: 'La primera conferencia de SEO de Venezuela, con 100 asistentes. Dedicada a compartir conocimiento, estrategias y herramientas de posicionamiento en Google con expertos y emprendedores de toda la región.',
        en: "Venezuela's first SEO conference, held in Caracas with 100 attendees. Focused on sharing Google-ranking knowledge, strategies, and tools with experts and entrepreneurs from across the region.",
      },
    },
  }

  const { docs: speakingEventDocs } = await payload.find({ collection: 'speaking-events', limit: 0 })
  let speakingEventsUpdated = 0
  for (const doc of speakingEventDocs) {
    const titleEs = (doc.title as unknown as Record<Locale, string>)?.es ?? (doc.title as unknown as string)
    const rewrite = speakingEventsRewrites[titleEs as string]
    if (!rewrite) continue
    for (const locale of LOCALES) {
      const data: Record<string, string> = { role: rewrite.role[locale] }
      if (rewrite.description) data.description = rewrite.description[locale]
      await payload.update({
        collection: 'speaking-events',
        id: doc.id,
        locale,
        data,
      })
    }
    speakingEventsUpdated++
  }
  console.log(`SpeakingEvents: role (+ description where noted) rewritten for ${speakingEventsUpdated} doc(s) (es/en)`)

  // ---------------------------------------------------------------------
  // CATEGORIES — title/description. Beyond the plan's two named globals
  // bugs, live data surfaced 3 more real locale-parity gaps in Categories
  // (Rule 1 auto-fix, same bug class): "General" and "Development" have no
  // en title at all, "Development"'s es title literally holds the English
  // word untranslated, and "SEO Strategy"'s en description is the literal
  // placeholder string "Test category." (a stub masquerading as real copy,
  // explicitly the kind of thing 29-VOICE-PROFILE.md's geo-pages caution
  // warns against carrying into production).
  // ---------------------------------------------------------------------
  const categoryRewritesBySlug: Record<
    string,
    { title?: Partial<Record<Locale, string>>; description?: Partial<Record<Locale, string>> }
  > = {
    'tech-seo': {
      description: {
        en: 'Guides on crawling, indexing, rendering, and web architecture optimization. Strategies to align source code with search engines and fix infrastructure bottlenecks.',
      },
    },
    'cs-fundamentals': {
      description: {
        en: 'Theoretical and practical foundations of software engineering: algorithmic complexity analysis, data structures, and code efficiency evaluation.',
      },
    },
    general: {
      title: { en: 'General' },
    },
    development: {
      title: { es: 'Desarrollo', en: 'Development' },
    },
    seo: {
      // "Test category." was a literal placeholder left in production —
      // replaced with a real translation of the es description.
      description: {
        en: 'Organic ranking methodologies, information architecture through topic clusters, and E-E-A-T optimization. Data-driven strategies to dominate the SERPs.',
      },
    },
  }

  const { docs: categoryDocs } = await payload.find({ collection: 'categories', limit: 0 })
  let categoriesUpdated = 0
  for (const doc of categoryDocs) {
    const rewrite = categoryRewritesBySlug[doc.slug as string]
    if (!rewrite) continue
    for (const locale of LOCALES) {
      const data: Record<string, string> = {}
      if (rewrite.title?.[locale]) data.title = rewrite.title[locale] as string
      if (rewrite.description?.[locale]) data.description = rewrite.description[locale] as string
      if (Object.keys(data).length === 0) continue
      await payload.update({
        collection: 'categories',
        id: doc.id,
        locale,
        data,
      })
    }
    categoriesUpdated++
  }
  console.log(`Categories: title/description locale-parity gaps fixed for ${categoriesUpdated} doc(s)`)

  console.log('Clientes: intentional no-op (every field is a non-localized proper noun/URL, see 30-PATTERNS.md)')

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
