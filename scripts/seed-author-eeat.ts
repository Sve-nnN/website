/**
 * Populates the real Author (slug: juan-carlos-angulo) with the E-E-A-T
 * fields recovered in Phase 12-01: expertise[], education[], experience[],
 * plus socialLinks[] (recovered earlier but never populated with real data).
 * Also seeds the standalone `speaking-events` collection (added mid-Phase 12
 * per Juan's request) with the 2 real speaking engagements, and adds a 3rd
 * `experience[]` item for Juan's ongoing aprendoclub coach role.
 *
 * Content source: 12-CONTEXT.md `<specifics>` (ES, verbatim from
 * localhost:3000/api/authors) with professional EN translations authored
 * directly in this script, per CONTEXT.md ("Traducciones EN se escriben
 * directamente en el seed script, no vía admin"). The speaking-events and
 * aprendoclub-experience content was provided directly by Juan mid-phase
 * (Caracas SEO Fest, DinoRANK/Lm Marketing workshop in Lima, aprendoclub
 * Senior Tech SEO Analyst coach role) — used verbatim, no invented dates.
 *
 * Does NOT touch the existing avatar (Cloudinary asset migrated in Phase 4) —
 * verifyAvatar only reads and logs, never writes.
 *
 * Idempotent: upserts by slug, reuses sub-array `id`s across locale writes
 * (same pattern as scripts/seed-phase10-7-gap-fill.ts) to avoid duplicating
 * array rows in Postgres when updating a localized array field per locale.
 * speaking-events docs are upserted by `title` (ES) since the collection has
 * no natural slug.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-author-eeat.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

const AUTHOR_SLUG = 'juan-carlos-angulo'

type Expertise = { topic: string; id?: string }
type Education = {
  degree: string
  institution: string
  startDate: string
  endDate: string
  id?: string
}
type Experience = {
  role: string
  company: string
  startDate?: string | null
  endDate?: string | null
  description?: string
  id?: string
}

const expertiseCopy: Record<(typeof LOCALES)[number], Omit<Expertise, 'id'>[]> = {
  es: [
    { topic: 'SEO Técnico Avanzado (Rastreo e indexación)' },
    { topic: 'Rendimiento Web (WPO & Core Web Vitals)' },
    { topic: 'Algoritmia y Estructuras de Datos' },
    { topic: 'Optimización de Tasa de Conversión (CRO)' },
  ],
  en: [
    { topic: 'Advanced Technical SEO (Crawling & Indexing)' },
    { topic: 'Web Performance (WPO & Core Web Vitals)' },
    { topic: 'Algorithms & Data Structures' },
    { topic: 'Conversion Rate Optimization (CRO)' },
  ],
}

const educationCopy: Record<(typeof LOCALES)[number], Omit<Education, 'id'>[]> = {
  es: [
    {
      degree: 'Ingeniero de software',
      institution: 'Universidad Peruana de Ciencias Aplicadas (UPC)',
      startDate: '2022-05-01',
      endDate: '2028-08-01',
    },
    {
      degree: 'Técnico en informática',
      institution: 'Universidad Politécnica Territorial del Estado Bolívar',
      startDate: '2018-02-01',
      endDate: '2020-08-01',
    },
  ],
  en: [
    {
      degree: 'Software Engineering',
      institution: 'Universidad Peruana de Ciencias Aplicadas (UPC)',
      startDate: '2022-05-01',
      endDate: '2028-08-01',
    },
    {
      degree: 'IT Technician',
      institution: 'Universidad Politécnica Territorial del Estado Bolívar',
      startDate: '2018-02-01',
      endDate: '2020-08-01',
    },
  ],
}

const experienceCopy: Record<(typeof LOCALES)[number], Omit<Experience, 'id'>[]> = {
  es: [
    {
      role: 'Senior Tech SEO Analyst',
      company: 'aprendoclub',
      startDate: null,
      endDate: null,
      description:
        'Coach del Diplomado de SEO + AIO en aprendoclub, la academia de marketing con IA fundada por Arianna Lupi. Acompaña a estudiantes hispanohablantes en su formación como especialistas SEO. Más info: https://www.aprendoclub.com/diplomado',
    },
    {
      role: 'Especialista en Tech SEO',
      company: 'AprendoSEO',
      startDate: '2022-11-01',
      endDate: '2026-02-01',
    },
    {
      role: 'Desarrollador Web',
      company: 'Cripto Avances & Nakama Digital',
      startDate: '2022-01-01',
      endDate: '2022-09-01',
    },
  ],
  en: [
    {
      role: 'Senior Tech SEO Analyst',
      company: 'aprendoclub',
      startDate: null,
      endDate: null,
      description:
        'Coach for the SEO + AIO Diploma program at aprendoclub, the AI-marketing academy founded by Arianna Lupi. Mentors Spanish-speaking students becoming SEO specialists. More info: https://www.aprendoclub.com/diplomado',
    },
    {
      role: 'Technical SEO Specialist',
      company: 'AprendoSEO',
      startDate: '2022-11-01',
      endDate: '2026-02-01',
    },
    {
      role: 'Web Developer',
      company: 'Cripto Avances & Nakama Digital',
      startDate: '2022-01-01',
      endDate: '2022-09-01',
    },
  ],
}

const socialLinksData = [
  { platform: 'linkedin' as const, url: 'https://linkedin.com/in/juancangulo' },
  { platform: 'github' as const, url: 'https://github.com/sve-nnn' },
  { platform: 'website' as const, url: 'https://juan-tech.com' },
]

type SpeakingEventSeed = {
  title: string
  description: string
  role: string
  coSpeakers?: { name: string }[]
  date?: string | null
  location?: string
  attendeeCount?: number
  link: string
}

// Real content provided directly by Juan mid-Phase 12 — used verbatim, no
// invented dates/details. No exact date confirmed for either event, so
// `date` is left unset per Juan's explicit instruction (do not invent).
const speakingEventsCopy: Record<(typeof LOCALES)[number], SpeakingEventSeed[]> = {
  es: [
    {
      title: 'Caracas SEO Fest',
      description:
        'La primera conferencia de SEO de Venezuela · 100 asistentes. La primera conferencia de posicionamiento en Google realizada en Caracas, dedicada a compartir conocimientos, estrategias y herramientas con expertos y emprendedores de toda la región.',
      role: 'Ponente — SEO Técnico',
      location: 'Caracas, Venezuela',
      attendeeCount: 100,
      link: 'https://www.youtube.com/watch?v=rT5qjas_qBY',
    },
    {
      title: 'Taller SEO + IA en Lima (por DinoRANK)',
      description:
        'Taller de 4 horas co-dictado con Arianna Lupi (Consultora SEO / Instructora SEO / Fundadora), con 18 asistentes entre profesionales, marketers, emprendedores y SEOs. Se enseñó keyword research con IA, creación de outlines y briefs con IA, y auditorías SEO con IA, usando DinoRANK (suite oficial de aprendoclub). Organizado en Lima, Perú, junto con Lm Marketing (Agencia SEO).',
      role: 'Co-instructor — Tech SEO',
      coSpeakers: [{ name: 'Arianna Lupi' }],
      location: 'Lima, Perú',
      attendeeCount: 18,
      link: 'https://www.linkedin.com/posts/arianna-lupi_mi-primer-taller-seo-ia-en-lima-por-activity-7381742452396941312-Mcvm',
    },
  ],
  en: [
    {
      title: 'Caracas SEO Fest',
      description:
        "Venezuela's first SEO conference · 100 attendees. The first Google-ranking conference held in Caracas, dedicated to sharing knowledge, strategies, and tools with experts and entrepreneurs from across the region.",
      role: 'Speaker — Technical SEO',
      location: 'Caracas, Venezuela',
      attendeeCount: 100,
      link: 'https://www.youtube.com/watch?v=rT5qjas_qBY',
    },
    {
      title: 'SEO + AI Workshop in Lima (by DinoRANK)',
      description:
        'A 4-hour workshop co-taught with Arianna Lupi (SEO Consultant / SEO Instructor / Founder), with 18 attendees including professionals, marketers, entrepreneurs, and SEOs. Covered AI-assisted keyword research, AI-assisted outlines and briefs, and AI-assisted SEO audits, using DinoRANK (aprendoclub’s official suite). Organized in Lima, Peru, together with Lm Marketing (SEO Agency).',
      role: 'Co-instructor — Tech SEO',
      coSpeakers: [{ name: 'Arianna Lupi' }],
      location: 'Lima, Peru',
      attendeeCount: 18,
      link: 'https://www.linkedin.com/posts/arianna-lupi_mi-primer-taller-seo-ia-en-lima-por-activity-7381742452396941312-Mcvm',
    },
  ],
}

/**
 * Compares an existing localized array (as read back from Payload, `id`
 * included) against this script's expected seed content for the same
 * locale, ignoring the `id` field. Used to guard seedExpertise/seedEducation/
 * seedExperience against clobbering manual /admin edits, mirroring the
 * diff-and-warn pattern already used by seedSocialLinks.
 */
function itemsMatchExpected<T extends Record<string, unknown>>(
  existing: T[] | null | undefined,
  expected: readonly Omit<T, 'id'>[],
  keys: (keyof T)[],
): boolean {
  if (!existing || existing.length !== expected.length) return false
  return existing.every((item, i) => keys.every((k) => item[k] === (expected[i] as T)[k]))
}

async function verifyAvatar(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs } = await payload.find({
    collection: 'authors',
    where: { slug: { equals: AUTHOR_SLUG } },
    limit: 1,
    depth: 1,
  })

  const author = docs[0]

  if (!author) {
    throw new Error(
      `No Author found with slug="${AUTHOR_SLUG}" — this script assumes the real Author already exists (migrated in Phase 4). Aborting.`,
    )
  }

  const avatar = typeof author.avatar === 'object' ? author.avatar : null

  if (!avatar) {
    console.warn(
      'Avatar no encontrado — el Author existe pero sin avatar asignado; no se re-sube, per CONTEXT.md, revisar manualmente.',
    )
  } else {
    console.log(`Avatar confirmado: ${avatar.url ?? '(sin url)'} (id=${avatar.id}) — no se re-sube.`)
  }

  return author
}

async function seedExpertise(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: number | string,
  existingExpertise: Expertise[] | null | undefined,
) {
  if (
    existingExpertise &&
    existingExpertise.length > 0 &&
    !itemsMatchExpected(existingExpertise, expertiseCopy.es, ['topic'])
  ) {
    console.warn(
      'Expertise: el Author ya tiene valores DIFERENTES a los esperados (locale=es) — no se sobrescriben para no perder datos reales. Revisar manualmente si corresponde actualizar.',
    )
    return
  }

  let savedIds: (string | undefined)[] = []

  for (const locale of LOCALES) {
    const items: Expertise[] = expertiseCopy[locale].map((item, i) => ({
      ...item,
      ...(savedIds[i] ? { id: savedIds[i] } : {}),
    }))

    await payload.update({
      collection: 'authors',
      id: authorId,
      locale,
      data: { expertise: items },
    })

    if (savedIds.length === 0) {
      const refetched = await payload.findByID({ collection: 'authors', id: authorId, depth: 0 })
      savedIds = (refetched.expertise ?? []).map((e) => e.id ?? undefined)
    }

    console.log(`Expertise: updated locale=${locale} (${items.length} items)`)
  }
}

async function seedEducation(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: number | string,
  existingEducation: Education[] | null | undefined,
) {
  if (
    existingEducation &&
    existingEducation.length > 0 &&
    !itemsMatchExpected(existingEducation, educationCopy.es, ['degree', 'institution', 'startDate', 'endDate'])
  ) {
    console.warn(
      'Education: el Author ya tiene valores DIFERENTES a los esperados (locale=es) — no se sobrescriben para no perder datos reales. Revisar manualmente si corresponde actualizar.',
    )
    return
  }

  let savedIds: (string | undefined)[] = []

  for (const locale of LOCALES) {
    const items: Education[] = educationCopy[locale].map((item, i) => ({
      ...item,
      ...(savedIds[i] ? { id: savedIds[i] } : {}),
    }))

    await payload.update({
      collection: 'authors',
      id: authorId,
      locale,
      data: { education: items },
    })

    if (savedIds.length === 0) {
      const refetched = await payload.findByID({ collection: 'authors', id: authorId, depth: 0 })
      savedIds = (refetched.education ?? []).map((e) => e.id ?? undefined)
    }

    console.log(`Education: updated locale=${locale} (${items.length} items)`)
  }
}

async function seedExperience(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: number | string,
  existingExperience: Experience[] | null | undefined,
) {
  if (
    existingExperience &&
    existingExperience.length > 0 &&
    !itemsMatchExpected(existingExperience, experienceCopy.es, [
      'role',
      'company',
      'startDate',
      'endDate',
      'description',
    ])
  ) {
    console.warn(
      'Experience: el Author ya tiene valores DIFERENTES a los esperados (locale=es) — no se sobrescriben para no perder datos reales. Revisar manualmente si corresponde actualizar.',
    )
    return
  }

  let savedIds: (string | undefined)[] = []

  for (const locale of LOCALES) {
    const items: Experience[] = experienceCopy[locale].map((item, i) => ({
      ...item,
      ...(savedIds[i] ? { id: savedIds[i] } : {}),
    }))

    await payload.update({
      collection: 'authors',
      id: authorId,
      locale,
      data: { experience: items },
    })

    if (savedIds.length === 0) {
      const refetched = await payload.findByID({ collection: 'authors', id: authorId, depth: 0 })
      savedIds = (refetched.experience ?? []).map((e) => e.id ?? undefined)
    }

    console.log(`Experience: updated locale=${locale} (${items.length} items)`)
  }
}

async function seedSocialLinks(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: number | string,
  existingSocialLinks: { platform: string; url: string }[] | null | undefined,
) {
  const hasExisting = existingSocialLinks && existingSocialLinks.length > 0

  if (hasExisting) {
    const matches =
      existingSocialLinks!.length === socialLinksData.length &&
      existingSocialLinks!.every(
        (link, i) => link.platform === socialLinksData[i].platform && link.url === socialLinksData[i].url,
      )

    if (matches) {
      console.log('SocialLinks: ya coinciden con los valores esperados — no-op.')
      return
    }

    console.warn(
      'SocialLinks: el Author ya tiene valores DIFERENTES a los esperados — no se sobrescriben para no perder datos reales. Revisar manualmente si corresponde actualizar.',
    )
    return
  }

  // socialLinks is NOT localized — single update, no locale loop.
  await payload.update({
    collection: 'authors',
    id: authorId,
    data: { socialLinks: socialLinksData },
  })

  console.log(`SocialLinks: escritos ${socialLinksData.length} items (campo no localizado).`)
}

/**
 * Standalone collection — upserts by ES title (no natural slug field on
 * speaking-events). For each of the 2 real events: finds an existing doc by
 * its ES title (queried via the `es` locale, the collection's defaultLocale),
 * then creates it if missing or updates it per locale if it already exists.
 */
async function seedSpeakingEvents(payload: Awaited<ReturnType<typeof getPayload>>) {
  for (let i = 0; i < speakingEventsCopy.es.length; i++) {
    const esItem = speakingEventsCopy.es[i]

    const { docs: existing } = await payload.find({
      collection: 'speaking-events',
      locale: 'es',
      where: { title: { equals: esItem.title } },
      limit: 1,
    })

    let eventId: number | string

    if (existing[0]) {
      eventId = existing[0].id
      console.log(`SpeakingEvent already exists (title="${esItem.title}", id=${eventId}) — updating.`)
    } else {
      const created = await payload.create({
        collection: 'speaking-events',
        locale: 'es',
        data: {
          title: esItem.title,
          description: esItem.description,
          role: esItem.role,
          coSpeakers: esItem.coSpeakers,
          date: esItem.date ?? null,
          location: esItem.location,
          attendeeCount: esItem.attendeeCount,
          link: esItem.link,
        },
      })
      eventId = created.id
      console.log(`Created SpeakingEvent (title="${esItem.title}", id=${eventId})`)
    }

    for (const locale of LOCALES) {
      const item = speakingEventsCopy[locale][i]

      await payload.update({
        collection: 'speaking-events',
        id: eventId,
        locale,
        data: {
          title: item.title,
          description: item.description,
          role: item.role,
          coSpeakers: item.coSpeakers,
          date: item.date ?? null,
          location: item.location,
          attendeeCount: item.attendeeCount,
          link: item.link,
        },
      })

      console.log(`SpeakingEvent "${item.title}": updated locale=${locale}`)
    }
  }
}

async function main() {
  const payload = await getPayload({ config })

  const author = await verifyAvatar(payload)

  await seedExpertise(payload, author.id, author.expertise)
  await seedEducation(payload, author.id, author.education)
  await seedExperience(payload, author.id, author.experience)
  await seedSocialLinks(payload, author.id, author.socialLinks)
  await seedSpeakingEvents(payload)

  const es = await payload.findByID({ collection: 'authors', id: author.id, locale: 'es' })
  const en = await payload.findByID({ collection: 'authors', id: author.id, locale: 'en' })
  const { docs: speakingEventsEs } = await payload.find({ collection: 'speaking-events', locale: 'es' })

  console.log('\n--- Verification ---')
  console.log('ES expertise[0].topic:', es.expertise?.[0]?.topic)
  console.log('EN expertise[0].topic:', en.expertise?.[0]?.topic)
  console.log('ES education[0].degree:', es.education?.[0]?.degree)
  console.log('EN education[0].degree:', en.education?.[0]?.degree)
  console.log('ES experience[0].role:', es.experience?.[0]?.role, '@', es.experience?.[0]?.company)
  console.log('EN experience[0].role:', en.experience?.[0]?.role, '@', en.experience?.[0]?.company)
  console.log(
    'expertise/education/experience counts:',
    es.expertise?.length,
    es.education?.length,
    es.experience?.length,
  )
  console.log('speaking-events count:', speakingEventsEs.length)

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
