/**
 * Phase 14 (Target Keyword Field — SEO-KW-01 / SEO-KW-02):
 *
 * Populates the new `targetKeyword` group field (en/es plain text, NOT
 * localized) on two docs with the picks already locked in
 * research/keyword-research/KEYWORD-RESEARCH.md:
 *
 * 1. Home (`pages`, slug=home): es="seo técnico", en="technical seo consultant"
 * 2. The real Author (`authors`, slug=juan-carlos-angulo):
 *    es="auditoría seo técnico", en="technical seo specialist"
 *
 * Since `targetKeyword.en`/`targetKeyword.es` are plain (non-localized) text
 * sub-fields of a group, a single `payload.update()` call per doc writes
 * both values in one shot — no per-locale loop needed (unlike Phase 13's
 * script, which looped over locales only because those fields ARE
 * `localized: true`).
 *
 * Idempotent: `update` always sets the same two values regardless of
 * current state — targetKeyword is a singleton group, not an array, so
 * there's no duplication risk on re-run.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase14-target-keyword.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = homeDocs[0]

  if (!homeDoc) {
    console.error('No `home` Pages doc found by slug — cannot seed Phase 14 targetKeyword. Aborting.')
    process.exit(1)
  }

  await payload.update({
    collection: 'pages',
    id: homeDoc.id,
    data: {
      targetKeyword: {
        es: 'seo técnico',
        en: 'technical seo consultant',
      },
    },
  })

  console.log(`Phase 14 targetKeyword: updated Home Pages doc (id=${homeDoc.id})`)

  const { docs: authorDocs } = await payload.find({
    collection: 'authors',
    where: { slug: { equals: 'juan-carlos-angulo' } },
    limit: 1,
  })

  const authorDoc = authorDocs[0]

  if (!authorDoc) {
    console.error(
      'No `juan-carlos-angulo` Authors doc found by slug — cannot seed Phase 14 targetKeyword. Aborting.',
    )
    process.exit(1)
  }

  await payload.update({
    collection: 'authors',
    id: authorDoc.id,
    data: {
      targetKeyword: {
        es: 'auditoría seo técnico',
        en: 'technical seo specialist',
      },
    },
  })

  console.log(`Phase 14 targetKeyword: updated Author doc (id=${authorDoc.id}, slug=juan-carlos-angulo)`)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
