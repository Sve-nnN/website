/**
 * Phase 3 spike: proves the Cloudinary storage adapter works end-to-end
 * against a real Cloudinary account via Payload's Local API.
 *
 * Standalone script — run outside Next.js's build/runtime, so it imports
 * `payload.config.ts` via a relative path (Next's `@payload-config` alias is
 * not resolvable here), matching the convention established in
 * `scripts/seed-phase2.ts`.
 *
 * Run with: npx tsx scripts/spike-cloudinary-upload.ts
 *
 * This is a genuine write against real infrastructure: it uploads and then
 * deletes one real test asset in the real Cloudinary account, and
 * creates/deletes one real row in the real Postgres `media` table. Do not
 * run this without explicit authorization (see 03-03-PLAN.md Task 2).
 *
 * Steps:
 * 1. Create a Media doc via the Local API using the small fixture image.
 * 2. Log the created doc and check whether `doc.filename` looks like a
 *    Cloudinary public_id (`media/...`, no local file extension) rather
 *    than the original local filename with extension.
 * 3. Fetch `doc.url` and confirm it returns 200, and that the URL string
 *    contains `f_auto`/`q_auto` (or their `fetch_format`/`quality`
 *    query-string equivalents).
 * 4. Delete the Media doc via the Local API, then re-fetch `doc.url` and
 *    confirm it no longer returns 200 (proving the Cloudinary asset itself
 *    was removed, not just the Postgres row).
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })

  const doc = await payload.create({
    collection: 'media',
    data: { alt: 'spike test image — Phase 3 validation, safe to delete' },
    filePath: './scripts/fixtures/test-image.jpg',
  })

  console.log('Created doc:', doc)

  const looksLikeCloudinaryPublicId =
    typeof doc.filename === 'string' &&
    doc.filename.includes('media/') &&
    !/\.[a-zA-Z0-9]+$/.test(doc.filename)
  console.log(
    'doc.filename looks like a Cloudinary public_id (media/..., no extension):',
    looksLikeCloudinaryPublicId,
    '—',
    doc.filename,
  )

  if (!doc.url) {
    console.error('doc.url is missing — cannot verify public URL. Failing spike.')
    process.exit(1)
  }

  const res = await fetch(doc.url)
  console.log('Public URL status:', res.status) // expect 200
  console.log('Public URL:', doc.url)

  const hasTransformParams =
    doc.url.includes('f_auto') ||
    doc.url.includes('q_auto') ||
    doc.url.includes('fetch_format') ||
    doc.url.includes('quality')
  console.log('URL contains f_auto/q_auto (or fetch_format/quality) params:', hasTransformParams)

  await payload.delete({ collection: 'media', id: doc.id })

  const res2 = await fetch(doc.url)
  console.log(
    'After delete, status (expect non-200, confirming Cloudinary asset removed):',
    res2.status,
  )

  process.exit(0)
}

run().catch((err) => {
  console.error('Spike failed:', err)
  process.exit(1)
})
