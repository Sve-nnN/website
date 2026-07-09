# Phase 3: Cloudinary Media Spike - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 5 (1 new lib file, 2 modified config/collection files, 2 new spike/fixture files)
**Analogs found:** 5 / 5 (all matched — either in-repo or reference-repo verbatim, both already captured in RESEARCH.md)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/lib/cloudinary-adapter.ts` (new) | service (storage adapter) | file-I/O | `github.com/Sahitya1707/payload-cloudinary` `src/payload.config.ts` (reference repo, fetched verbatim into RESEARCH.md) — architecturally same shape as `@payloadcms/storage-s3`/`storage-r2`'s `GeneratedAdapter` wrapper | exact (reference repo is the direct template; official S3/R2 packages are the architectural precedent) |
| `src/payload.config.ts` (modify) | config | event-driven (conditional plugin registration) | itself — existing `plugins: [seoPlugin(...), redirectsPlugin(...)]` array in this same file | exact (extend existing array, follow existing conditional-gating convention used elsewhere in this file for env-driven config) |
| `src/collections/Media/index.ts` (modify) | model (collection config) | CRUD | itself — existing `upload.imageSizes` block | exact (in-place edit, gate `imageSizes` behind the same `hasCloudinaryCreds` flag) |
| `next.config.mjs` (modify) | config | request-response (image proxy allowlist) | itself — existing `images.remotePatterns: []` placeholder (comment already says "add Cloudinary hostname pattern in Phase 3") | exact (the file already has a stub waiting for this exact change) |
| `scripts/spike-cloudinary-upload.ts` (new) | test (smoke/spike script) | request-response (Local API round-trip) | `scripts/seed-phase2.ts` (existing standalone Payload Local API script — closest structural analog for "load config, call getPayload, do work, exit") | role-match (same Local API bootstrap idiom, different purpose) |

## Pattern Assignments

### `src/lib/cloudinary-adapter.ts` (service, file-I/O)

**Analog:** `github.com/Sahitya1707/payload-cloudinary/src/payload.config.ts` (reference repo, verbatim source captured in RESEARCH.md "Pattern 2"), corrected per RESEARCH.md "Pattern 3" and Pitfalls 1-3.

**Do not copy the reference's `handleUpload` verbatim** — it mutates `file` in place, which is a no-op for persistence under `@payloadcms/plugin-cloud-storage@3.85.2`'s `afterChange`-hook architecture (RESEARCH.md Pitfall 1). Use the corrected version below as the actual template.

**Imports + config pattern:**
```typescript
import { v2 as cloudinary } from 'cloudinary'
import type { HandleUpload, HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // NOT CLOUDINARY_NAME (reference repo's var name) — this project's .env uses CLOUDINARY_CLOUD_NAME (Pitfall 3)
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})
```

**Core pattern — handleUpload (corrected, returns metadata instead of mutating `file`):**
```typescript
export const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',

  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`,
          overwrite: false,
          use_filename: true,
        },
        (error, result) => {
          if (error) return reject(error)
          if (!result) return reject(new Error('No result returned from Cloudinary'))
          resolve(result)
        },
      )
      uploadStream.end(file.buffer)
    })
    return {
      filename: uploadResult.public_id,
      mimeType: uploadResult.format,
      filesize: uploadResult.bytes,
    }
  },
```

**Error handling pattern — handleDelete (matches reference repo's console.error-and-swallow convention, kept as-is — this is a spike, not hardened production error handling):**
```typescript
  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      await cloudinary.uploader.destroy(`media/${filename.replace(/\.[^/.]+$/, '')}`)
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },
```

**URL generation pattern (satisfies MEDIA-03's `f_auto,q_auto` requirement):**
```typescript
  generateFileURL(filename: string) {
    return cloudinary.url(`media/${filename}`, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto',
    })
  },

  staticHandler() {
    return new Response('Not implemented', { status: 501 })
  },
})
```

**Notes for the planner:**
- File does not exist yet — `src/lib/` directory does not exist in the repo yet either (confirmed via `find`), create both.
- `folder`/prefix convention: keep `media/` (matches reference, matches CONTEXT.md's "salvo razón en contra" default).
- No test framework exists in this repo (confirmed — no vitest/jest config found); do not add unit tests for this file beyond the smoke script below.

---

### `src/payload.config.ts` (config, event-driven conditional registration)

**Analog:** itself, lines 59-72 (existing `plugins` array)

**Existing pattern to extend** (`src/payload.config.ts:59-72`):
```typescript
plugins: [
  seoPlugin({
    collections: ['pages', 'posts', 'case-studies'],
    uploadsCollection: 'media',
    tabbedUI: true,
    generateTitle: ({ doc }: { doc: { title?: string } }) =>
      doc?.title ? `${doc.title} | Juan Carlos Angulo` : 'Juan Carlos Angulo',
    generateDescription: ({ doc }: { doc: { heroSubtitle?: string; excerpt?: string } }) =>
      doc?.heroSubtitle ?? doc?.excerpt ?? '',
  }),
  redirectsPlugin({
    collections: ['pages', 'posts', 'case-studies', 'categories', 'authors'],
  }),
],
```

**Pattern to add** (RESEARCH.md Pattern 1, verified against `@payloadcms/plugin-cloud-storage@3.85.2` types — conditional array spread is type-safe, no cast needed):
```typescript
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { cloudinaryAdapter } from './lib/cloudinary-adapter'

const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
)

// ...inside plugins: [ ... ]:
...(hasCloudinaryCreds
  ? [
      cloudStoragePlugin({
        collections: {
          media: {
            adapter: cloudinaryAdapter,
            disableLocalStorage: true,
            generateFileURL: ({ filename }) => cloudinaryAdapter().generateFileURL(filename),
          },
        },
      }),
    ]
  : []),
```

**Convention match:** this file already gates config by env presence elsewhere (`process.env.DATABASE_URI`, `process.env.PAYLOAD_SECRET || ''`, `process.env.RESEND_API_KEY || ''`), so the `hasCloudinaryCreds` boolean-gate style is consistent with the file's existing idiom, not a new pattern.

**Integration point:** `hasCloudinaryCreds` must be computed once near the top of the file (alongside `filename`/`dirname` at lines 23-24) and reused both in the `plugins` array and to gate `Media`'s `imageSizes` (see next section) — single source of truth, not two separate env checks.

---

### `src/collections/Media/index.ts` (model, CRUD)

**Analog:** itself, current full file (24 lines, already read in full)

**Current state (lines 1-24, full file):**
```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 300, height: undefined },
      { name: 'card', width: 768, height: undefined },
      { name: 'hero', width: 1600, height: undefined },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}
```

**Required change (RESEARCH.md Pitfall 2 + Open Question 1 — env-gate `imageSizes`, do not remove outright):** the shallow-merge metadata clobbering bug only manifests when Cloudinary storage + `imageSizes` are both active. Local-disk dev mode should keep resized variants; Cloudinary mode should rely on transformation URLs instead.

```typescript
import type { CollectionConfig } from 'payload'

const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: hasCloudinaryCreds
      ? undefined
      : [
          { name: 'thumbnail', width: 300, height: undefined },
          { name: 'card', width: 768, height: undefined },
          { name: 'hero', width: 1600, height: undefined },
        ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}
```

**Caution flagged in RESEARCH.md:** the `hasCloudinaryCreds` boolean here is computed independently in this file (module-level, `process.env` read at collection-config build time) — this duplicates the same computation done in `payload.config.ts`. Both must use the identical three env var names (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) to avoid the two gates drifting out of sync (same class of risk as the `defaultLocale` dual-definition pitfall already documented in this file's `payload.config.ts` comment at line 47-48). Planner should flag this as a one-line risk note in the plan, not necessarily extract to a shared constant (out of scope for a spike, but worth a code comment pointing at the twin location).

---

### `next.config.mjs` (config, request-response)

**Analog:** itself, current full file (17 lines)

**Current state (lines 1-16, full file):**
```javascript
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // remotePatterns intentionally empty in Phase 1 (local-disk media only);
    // add Cloudinary hostname pattern in Phase 3
    remotePatterns: [],
  },
}

export default withPayload(withNextIntl(nextConfig))
```

**Required change (RESEARCH.md "next.config.mjs addition", official Next.js `remotePatterns` shape):**
```javascript
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}
```

**Note:** the file already has a comment placeholder (`// add Cloudinary hostname pattern in Phase 3`) pointing at exactly this edit — this is a pre-flagged, expected change, not new territory. Remove the stale comment when making the edit.

---

### `scripts/spike-cloudinary-upload.ts` (test/spike, request-response — Local API round trip)

**Analog:** `scripts/seed-phase2.ts` (existing repo script — same "standalone Payload Local API bootstrap" role; read its header/bootstrap block for the exact `getPayload`/`@payload-config` import convention already used in this repo before finalizing the spike script, since RESEARCH.md's version uses a slightly generic import path assumption).

**Core pattern (from RESEARCH.md "Fastest end-to-end spike validation", already tailored to this project's collection/field names):**
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'

const payload = await getPayload({ config })

const doc = await payload.create({
  collection: 'media',
  data: { alt: 'spike test image' },
  filePath: './scripts/fixtures/test-image.jpg',
})

console.log('Created doc:', doc)
// Expect doc.filename to look like a Cloudinary public_id (e.g. "media/test-image"),
// NOT the original local filename with extension.

const res = await fetch(doc.url!)
console.log('Public URL status:', res.status) // expect 200
console.log('Public URL:', doc.url)

await payload.delete({ collection: 'media', id: doc.id })
const res2 = await fetch(doc.url!)
console.log('After delete, status (expect 404 or Cloudinary "not found"):', res2.status)

process.exit(0)
```

**Before finalizing:** Read `scripts/seed-phase2.ts` in full to confirm this repo's exact `getPayload`/config-import boilerplate (e.g., whether it uses `@payload-config` alias or a relative import to `src/payload.config.ts`, and whether `tsx` vs `payload run` is the established run command) — the planner/implementer should reconcile RESEARCH.md's generic version against that established convention rather than introducing a second import style.

**Companion file:** `scripts/fixtures/test-image.jpg` — new binary fixture, no code pattern needed, just needs to exist as a small real image.

---

## Shared Patterns

### Env-gated conditional config (cross-cutting: `payload.config.ts` + `Media/index.ts`)
**Source:** `src/payload.config.ts` existing convention (`process.env.DATABASE_URI`, `process.env.RESEND_API_KEY || ''`) generalized per RESEARCH.md Pattern 1
**Apply to:** both `payload.config.ts` (plugin registration) and `src/collections/Media/index.ts` (`imageSizes` toggle)
```typescript
const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
)
```
**Risk to flag:** this boolean is independently computed in two files (module-level in each). No existing shared-constants file (`src/lib/` doesn't exist yet) to centralize it in without adding new structure the spike doesn't otherwise need — planner's call whether to introduce `src/lib/env.ts` or accept the duplication for a spike-scoped phase.

### Promise-wrapping Cloudinary's callback-based `upload_stream`
**Source:** RESEARCH.md "Don't Hand-Roll" table — this is the SDK-documented pattern, not a hand-rolled utility
**Apply to:** `src/lib/cloudinary-adapter.ts` only
```typescript
const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(opts, (error, result) => {
    if (error) return reject(error)
    if (!result) return reject(new Error('No result returned from Cloudinary'))
    resolve(result)
  })
  uploadStream.end(file.buffer)
})
```

### `public_id`/filename prefix convention (`media/` folder)
**Source:** reference repo, kept per CONTEXT.md's explicit "keep unless reason against" instruction
**Apply to:** `handleUpload`, `handleDelete`, `generateFileURL` in `src/lib/cloudinary-adapter.ts` — all three must use the identical `media/${filename-without-extension}` construction or delete/URL-generation will silently target the wrong Cloudinary asset.

## No Analog Found

None — every file in scope has either an in-repo analog (existing file being edited) or the reference-repo/official-package analog already deep-diffed in RESEARCH.md.

## Metadata

**Analog search scope:** `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/src`, `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/scripts`, `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/next.config.mjs`, plus RESEARCH.md's already-fetched external sources (`github.com/Sahitya1707/payload-cloudinary`, `@payloadcms/plugin-cloud-storage@3.85.2` source/types)
**Files scanned:** `src/payload.config.ts`, `src/collections/Media/index.ts`, `next.config.mjs`, `scripts/seed-phase2.ts` (listing only, not read), repo directory tree (confirmed no `src/lib/`, no `@payloadcms/plugin-cloud-storage` or `cloudinary` in `node_modules` yet — both are new installs)
**Pattern extraction date:** 2026-07-09
</content>
