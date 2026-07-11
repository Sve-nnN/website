/**
 * Populates the real Author (slug: juan-carlos-angulo) with the E-E-A-T
 * fields recovered in Phase 12-01: expertise[], education[], experience[],
 * plus socialLinks[] (recovered earlier but never populated with real data).
 *
 * Content source: 12-CONTEXT.md `<specifics>` (ES, verbatim from
 * localhost:3000/api/authors) with professional EN translations authored
 * directly in this script, per CONTEXT.md ("Traducciones EN se escriben
 * directamente en el seed script, no vía admin").
 *
 * Does NOT touch the existing avatar (Cloudinary asset migrated in Phase 4) —
 * verifyAvatar only reads and logs, never writes.
 *
 * Idempotent: upserts by slug, reuses sub-array `id`s across locale writes
 * (same pattern as scripts/seed-phase10-7-gap-fill.ts) to avoid duplicating
 * array rows in Postgres when updating a localized array field per locale.
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
  startDate: string
  endDate: string
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

async function seedExpertise(payload: Awaited<ReturnType<typeof getPayload>>, authorId: number | string) {
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

async function seedEducation(payload: Awaited<ReturnType<typeof getPayload>>, authorId: number | string) {
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

async function seedExperience(payload: Awaited<ReturnType<typeof getPayload>>, authorId: number | string) {
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

async function main() {
  const payload = await getPayload({ config })

  const author = await verifyAvatar(payload)

  await seedExpertise(payload, author.id)
  await seedEducation(payload, author.id)
  await seedExperience(payload, author.id)
  await seedSocialLinks(payload, author.id, author.socialLinks)

  const es = await payload.findByID({ collection: 'authors', id: author.id, locale: 'es' })
  const en = await payload.findByID({ collection: 'authors', id: author.id, locale: 'en' })

  console.log('\n--- Verification ---')
  console.log('ES expertise[0].topic:', es.expertise?.[0]?.topic)
  console.log('EN expertise[0].topic:', en.expertise?.[0]?.topic)
  console.log('ES education[0].degree:', es.education?.[0]?.degree)
  console.log('EN education[0].degree:', en.education?.[0]?.degree)
  console.log('ES experience[0].role:', es.experience?.[0]?.role)
  console.log('EN experience[0].role:', en.experience?.[0]?.role)
  console.log(
    'expertise/education/experience counts:',
    es.expertise?.length,
    es.education?.length,
    es.experience?.length,
  )

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
