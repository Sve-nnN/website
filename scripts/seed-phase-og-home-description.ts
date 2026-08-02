/**
 * Milestone v2.0 follow-up (out of Phase 41/42/43 scope, requested directly
 * by Juan): rewrites Home's `meta.description` (both locales) — it was 34-36
 * chars ("Ingeniero de software y experto SEO." / "Software engineer and SEO
 * expert."), opengraph.to flags anything under ~110 chars as a missed
 * opportunity (optimal 110-160).
 *
 * New copy targets the locked Phase 14 keyword picks
 * (research/keyword-research/KEYWORD-RESEARCH.md): es="seo técnico",
 * en="technical seo consultant". Grounded in Home's real live hero/section
 * copy (fetched from https://juan-tech.com on 2026-08-01 — see
 * research/serp-intent-home-description.md), not fabricated. Humanized
 * against research/voice-sample-juan.md: first person, no em dash, no AI
 * filler phrases.
 *
 * `meta.description` (plugin-seo) IS localized -- one `update()` call per
 * locale, matching Phase 13's convention (unlike Phase 14's targetKeyword,
 * which is a non-localized group field).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase-og-home-description.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const DESCRIPTIONS = {
  es: 'Soy ingeniero de software y consultor de SEO técnico: auditorías, rendimiento web y arquitectura Next.js/Payload para posicionar tu sitio en Google.',
  en: "I'm a software engineer and technical SEO consultant: audits, performance, and Next.js/Payload architecture to get your site ranking on Google.",
} as const

async function main() {
  const payload = await getPayload({ config })

  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = homeDocs[0]

  if (!homeDoc) {
    console.error('No `home` Pages doc found by slug — cannot update meta.description. Aborting.')
    process.exit(1)
  }

  for (const [locale, description] of Object.entries(DESCRIPTIONS) as Array<
    [keyof typeof DESCRIPTIONS, string]
  >) {
    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      // `pages` has versions.drafts enabled — without an explicit `draft:
      // false`, the previous run of this script silently landed on a draft
      // version instead of the published doc the frontend/REST API reads
      // (confirmed live: og:tag stayed unchanged after "success").
      draft: false,
      data: {
        meta: {
          description,
        },
      },
    })
    console.log(`[${locale}] meta.description updated (${description.length} chars)`)
  }

  // Self-verify against the published doc (overrideAccess:false + no draft
  // param = exactly what the unauthenticated REST/frontend read path sees)
  // instead of trusting the update() call's return value blindly.
  for (const locale of Object.keys(DESCRIPTIONS) as Array<keyof typeof DESCRIPTIONS>) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      locale,
      limit: 1,
      overrideAccess: false,
    })
    const actual = docs[0]?.meta?.description
    const expected = DESCRIPTIONS[locale]
    if (actual !== expected) {
      console.error(
        `[${locale}] VERIFY FAILED — published doc reads "${actual}", expected "${expected}"`,
      )
      process.exit(1)
    }
    console.log(`[${locale}] verified on published doc: "${actual}"`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
