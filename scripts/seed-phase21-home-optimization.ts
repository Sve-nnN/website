/**
 * Phase 21 (Home Optimization & Service Linking — SEO-HOME-01/02):
 *
 * 1. In-place update of Home's existing `aboutSection` block: rewrites
 *    `paragraphs[0].text` and `features[2]` ("Arquitectura escalable" /
 *    "Scalable Architecture") to explicitly reinforce the "desarrollo real
 *    (Next.js/Payload/CMS headless) + SEO técnico" differentiator, echoing
 *    the already-approved language from Phase 19's `fullstackServiceCopy`
 *    (scripts/seed-phase19-data/group-b.ts). Every other block in Home's
 *    layout is left completely untouched.
 * 2. Adds a "Servicios"/"Services" item to the Header global's `navItems`,
 *    pointing at `/services` (a real, working URL confirmed 200 in both
 *    locales since Phase 19). Guarded against duplicate append on re-run.
 *
 * Id-reuse discipline: `content.layout` (Pages) and `navItems` (Header) are
 * both full-replaced by Payload on `update`/`updateGlobal` — every existing
 * item's `id` is read back from the DB and reused positionally before any
 * write, exact pattern already proven in scripts/seed-phase13-home-content.ts
 * and scripts/fix-header-navitems-es-labels.ts.
 *
 * Zero schema changes. Does not touch payload.config.ts.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase21-home-optimization.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const aboutParagraphCopy: Record<Locale, string> = {
  es: 'No veo el SEO y el desarrollo web como disciplinas aisladas. Los motores de búsqueda modernos evalúan la limpieza del código, la velocidad de carga y la arquitectura de la información — por eso construyo sobre Next.js y CMS headless (Payload), con el SEO técnico diseñado en el código desde el primer commit, en vez de parchado después con plugins genéricos sobre un WordPress estándar. Mi metodología se basa en auditar y construir soluciones donde la infraestructura técnica se convierte en el motor principal para el crecimiento orgánico, asegurando que tu web no solo funcione perfectamente, sino que domine en los resultados de búsqueda.',
  en: "I don't see SEO and web development as separate disciplines. Modern search engines evaluate code quality, load speed, and information architecture — that's why I build on Next.js and headless CMS (Payload), with technical SEO designed into the code from the first commit, instead of patched on afterward with generic plugins on a standard WordPress build. My approach is built on auditing and building solutions where technical infrastructure becomes the primary driver of organic growth — making sure your site not only runs flawlessly, but dominates the search results too.",
}

const aboutFeatureIndex = 2 // "Arquitectura escalable" / "Scalable Architecture"

const aboutFeatureDescriptionCopy: Record<Locale, string> = {
  es: 'Diseño de sistemas modulares y limpios sobre Next.js y CMS headless (Payload) — código mantenible, propio y auditable, sin builders ni plugins de terceros, que facilita el crecimiento del proyecto sin deuda técnica.',
  en: 'Modular, clean system design on Next.js and headless CMS (Payload) — proprietary, auditable, maintainable code with no third-party page builders or plugins, that lets a project grow without piling up technical debt.',
}

const NAV_SERVICES_URL = '/services'

const navLabelByLocale: Record<Locale, string> = {
  es: 'Servicios',
  en: 'Services',
}

type NavItem = {
  id?: string | null
  link: {
    type?: 'reference' | 'custom' | null
    newTab?: boolean | null
    url?: string | null
    label?: string | null
  }
}

async function updateAboutSectionCopy(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  if (docs.length === 0) {
    console.log("No 'home' Pages doc found by slug — cannot update aboutSection copy. Skipping.")
    return
  }

  const homeId = docs[0].id

  for (const locale of LOCALES) {
    const doc = await payload.findByID({ collection: 'pages', id: homeId, locale, depth: 0 })
    const layout = [...((doc.content?.layout ?? []) as Array<Record<string, unknown>>)]

    const aboutIndex = layout.findIndex((b) => b.blockType === 'aboutSection')
    if (aboutIndex === -1) {
      console.log(`No aboutSection block found in Home layout (locale=${locale}) — skipping.`)
      continue
    }

    const aboutBlock = layout[aboutIndex] as Record<string, unknown>
    const paragraphs = (aboutBlock.paragraphs as Array<Record<string, unknown>> | undefined) ?? []
    const features = (aboutBlock.features as Array<Record<string, unknown>> | undefined) ?? []

    const updatedParagraphs = paragraphs.length
      ? [{ ...paragraphs[0], text: aboutParagraphCopy[locale] }, ...paragraphs.slice(1)]
      : [{ text: aboutParagraphCopy[locale] }]

    const updatedFeatures = features.map((f, i) =>
      i === aboutFeatureIndex ? { ...f, description: aboutFeatureDescriptionCopy[locale] } : f,
    )

    layout[aboutIndex] = {
      ...aboutBlock,
      paragraphs: updatedParagraphs,
      features: updatedFeatures,
    }

    await payload.update({
      collection: 'pages',
      id: homeId,
      locale,
      data: { content: { layout: layout as never } },
    })
    console.log(`Updated aboutSection copy (locale=${locale})`)
  }
}

async function addServicesNavLink(payload: Awaited<ReturnType<typeof getPayload>>) {
  const headerEs = await payload.findGlobal({ slug: 'header', locale: 'es' })
  const existingEs = (headerEs.navItems ?? []) as NavItem[]

  const alreadyExists = existingEs.some((item) => item.link?.url === NAV_SERVICES_URL)
  if (alreadyExists) {
    console.log('Services nav item already exists, skipping append.')
    return
  }

  const navItemsEs: NavItem[] = [
    ...existingEs,
    { link: { type: 'custom', url: NAV_SERVICES_URL, label: navLabelByLocale.es, newTab: false } },
  ]

  await payload.updateGlobal({ slug: 'header', locale: 'es', data: { navItems: navItemsEs as never } })
  console.log('Header navItems updated (locale=es) — appended Servicios link')

  const refetchedEs = await payload.findGlobal({ slug: 'header', locale: 'es' })
  const refetchedItemsEs = (refetchedEs.navItems ?? []) as NavItem[]
  const newItemId = refetchedItemsEs[refetchedItemsEs.length - 1]?.id

  if (!newItemId) {
    throw new Error('Could not capture the newly-assigned id for the Services nav item after the es write.')
  }

  const headerEn = await payload.findGlobal({ slug: 'header', locale: 'en' })
  // By the time we read this, the array already contains the row created by
  // the `es` write above (navItems itself is a shared, non-localized array —
  // only `link.label` is localized). Filter it out here before re-appending
  // our own corrected version, otherwise the array ends up with two entries
  // sharing the same id in one write, and Payload keeps whichever one it
  // processes first (observed bug: the fallback-locale label "wins" instead
  // of the explicit `en` label passed below).
  const existingEn = ((headerEn.navItems ?? []) as NavItem[]).filter((item) => item.id !== newItemId)

  const navItemsEn: NavItem[] = [
    ...existingEn,
    { id: newItemId, link: { type: 'custom', url: NAV_SERVICES_URL, label: navLabelByLocale.en, newTab: false } },
  ]

  await payload.updateGlobal({ slug: 'header', locale: 'en', data: { navItems: navItemsEn as never } })
  console.log('Header navItems updated (locale=en) — appended Services link')
}

async function main() {
  const payload = await getPayload({ config })

  await updateAboutSectionCopy(payload)
  await addServicesNavLink(payload)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
