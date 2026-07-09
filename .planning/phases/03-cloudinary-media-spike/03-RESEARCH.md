# Phase 3: Cloudinary Media Spike - Research

**Researched:** 2026-07-09
**Domain:** Payload CMS 3.85.2 custom cloud-storage adapter (Cloudinary), Next.js 15 image optimization
**Confidence:** HIGH — the reference repo's actual source was fetched and diffed line-by-line against the current `@payloadcms/plugin-cloud-storage@3.85.2` type definitions and hook implementations (not paraphrased, not assumed)

## Summary

The `GeneratedAdapter` interface (`handleUpload`, `handleDelete`, `generateURL`/`generateFileURL`, `staticHandler`) has **not broken** between the reference repo's target (`@payloadcms/plugin-cloud-storage@^3.36.1`) and the current `3.85.2` — all fields the reference code implements still type-check today. This is the good news: the reference code compiles as-is.

The bad news, found only by reading the plugin's actual hook source (not the type defs): the **runtime architecture changed** between those versions in a way that breaks a load-bearing (if accidental) behavior of the reference implementation. In 3.36.1, Cloudinary upload happened in a `beforeChange` hook (pre-save); in 3.85.2 it happens in a **new `afterChange` hook** (post-save) that supports `handleUpload` **returning** metadata (`{ filename, mimeType, filesize }`) which then gets persisted via a follow-up `payload.update()` call. The reference repo's `handleUpload` does not return anything — it mutates the local `file` parameter in place, which was already a no-op for persistence purposes even in the original 3.36.1 architecture (the mutation target is a throwaway local copy, not `data`). It happened to "work" in the demo only by coincidence (the derived Cloudinary `public_id` matches the original local filename minus extension, which `generateFileURL` also uses to rebuild the same URL). **This must be fixed during the port**: `handleUpload` should `return { filename: uploadResult.public_id, mimeType: uploadResult.format, filesize: uploadResult.bytes }` instead of mutating `file` — this is the officially-supported 3.85.2 pattern and is more robust than relying on filename coincidence.

A second, more consequential gap: the reference repo's `Media` collection has **no `imageSizes`**, but this project's real `src/collections/Media/index.ts` already defines three (`thumbnail`, `card`, `hero`). Payload's cloud-storage `afterChange` hook calls `handleUpload` once per file — once for the original, once per size — **in parallel** via `Promise.all`, then merges every call's returned metadata into a single object with a **shallow spread** (`{...acc, ...metadata}`). If each size's `handleUpload` call independently returns `{ sizes: { thumbnail: {...} } }`-shaped metadata, later results silently clobber earlier ones' `sizes` key rather than deep-merging distinct size names — this is a genuine limitation in the plugin framework, not a coding mistake to "just fix." **Recommendation: disable Payload's local `imageSizes`/sharp resizing on the Media collection when Cloudinary is active, and use Cloudinary's own URL-based transformations (`w_300`, `w_768`, `w_1600`, combined with `f_auto,q_auto`) to serve size variants on demand instead.** This is also the idiomatic Cloudinary pattern (transform-on-delivery, not pre-generate-on-upload) and directly satisfies MEDIA-03.

**Primary recommendation:** Port the reference repo's adapter into `src/lib/cloudinary-adapter.ts`, fix `handleUpload` to return metadata instead of mutating `file`, drop/bypass `imageSizes` for the Cloudinary path (serve sizes via Cloudinary transformation URLs instead), fix the env var name mismatch (repo uses `CLOUDINARY_NAME`, this project's `.env` already has `CLOUDINARY_CLOUD_NAME` — use the latter), and gate `cloudStoragePlugin(...)` registration behind an `if` that checks all three env vars are present.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File upload to Cloudinary | API / Backend (Payload server, Node process) | — | `handleUpload` runs server-side inside Payload's `afterChange` hook; the Node process holds Cloudinary API secret and streams the buffer server-to-server |
| Asset deletion | API / Backend | — | `handleDelete` runs server-side, same trust boundary as upload (needs `CLOUDINARY_API_SECRET`) |
| Public delivery URL generation | API / Backend (computed at write-time via `generateFileURL`) | CDN / Static (Cloudinary itself serves the bytes) | Payload computes/stores the URL string; actual byte delivery + `f_auto,q_auto` transformation happens on Cloudinary's CDN, never proxied through the Node server |
| Image resizing / responsive variants | CDN / Static (Cloudinary on-the-fly transformation) | — | Recommendation of this research: stop using Payload's local `sharp`-based `imageSizes` (Frontend/Backend tier) for the Cloudinary path; let Cloudinary's URL transformation API own this responsibility instead |
| `next/image` optimization pass-through | Frontend Server (SSR) / Browser | — | `next.config.mjs` `images.remotePatterns` allows Next's image optimizer to fetch from `res.cloudinary.com`; actual optimization is skipped/passed-through since Cloudinary already serves optimized bytes via `f_auto,q_auto` |
| Local-disk fallback (no Cloudinary env vars) | API / Backend | — | Payload's default upload handling when `cloudStoragePlugin` is not registered at all — same tier as the Cloudinary path, just a different adapter |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `cloudinary` | `2.10.0` [VERIFIED: npm registry] | Official Cloudinary Node.js SDK — `v2.uploader.upload_stream`, `v2.uploader.destroy`, `v2.url()` | Official vendor SDK, 874k downloads/week [VERIFIED: npm registry, `api.npmjs.org/downloads`], published continuously since 2012, no viable alternative — this is the only correct choice |
| `@payloadcms/plugin-cloud-storage` | `3.85.2` [VERIFIED: npm registry, matches project's other `@payloadcms/*` packages] | Official adapter framework (`GeneratedAdapter` interface, `cloudStoragePlugin()`) that the custom Cloudinary adapter plugs into | This is what `@payloadcms/storage-s3`/`storage-r2` are thin wrappers over; using it directly for Cloudinary (which has no official adapter) is the officially-sanctioned pattern for custom storage backends |

### Supporting
None beyond the above — no new npm packages are needed if the custom-adapter path (primary plan) is used. No new package legitimacy concerns beyond `cloudinary` itself.

### Alternatives Considered (fallback packages only, per CONTEXT.md decision — not installed unless the custom adapter hits a real blocker)
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom adapter | `@jhb.software/payload-cloudinary-plugin@0.4.0` [VERIFIED: npm registry, published 2026-06-19] | Team-backed monorepo (`jhb-software/payload-plugins`), tightest Payload version pin (`^3.85.1`) found among community options — but package itself is pre-1.0 (API can still shift) |
| Custom adapter | `payload-storage-cloudinary@1.2.1` (nlvcodes) [VERIFIED: npm registry, published 2026-04-02] | Correctly targets Payload `^3.0.0`, zero open issues, but only 6 GitHub stars — thin validation |
| Either fallback | `payload-cloudinary@2.3.0` (SyedMuzamilM) [VERIFIED: npm registry, published 2026-06-09] | **Still explicitly excluded** — `peerDependencies.payload` declares `^2.0.0` despite depending on `@payloadcms/plugin-cloud-storage@^3.25.0` (v3-only). Quality-control red flag stands; do not install even as a last-resort fallback without manually overriding the peer-dep check and testing thoroughly first |

**Installation (primary path — custom adapter, no new packages beyond `cloudinary`):**
```bash
npm install cloudinary
```

**Version verification performed:** `npm view cloudinary version` → `2.10.0`, published 2026-07-08 (one day before this research). `npm view @payloadcms/plugin-cloud-storage version` → `3.85.2`, matches the rest of this project's `@payloadcms/*` suite (lockstep versioning confirmed in STACK.md).

## Package Legitimacy Audit

> slopcheck could not be installed in this research session (sandboxed environment denied the `pip install --break-system-packages` step). Per the graceful-degradation protocol, `cloudinary` is tagged `[ASSUMED]` below despite strong manual verification signals — the planner should still gate its install behind a lightweight `checkpoint:human-verify` (a one-line "does `npm install cloudinary` succeed and match the below stats" check, not a heavyweight review) given the manual signals are already very strong.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `cloudinary` | npm | 13+ years (published 2012-06-25) [VERIFIED: npm registry `time.created`] | 874,251/week [VERIFIED: `api.npmjs.org/downloads`] | `github.com/cloudinary/cloudinary_npm` [VERIFIED: npm registry `repository.url`, matches official Cloudinary org] | not run (sandboxed) — manually verified via age/downloads/repo instead | **[ASSUMED]** — Approved with high confidence based on manual verification; recommend a trivial `checkpoint:human-verify` at install time rather than a full re-audit |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck did not run)
**Packages flagged as suspicious [SUS]:** none — `cloudinary` shows none of the slopsquatting risk signals (age, downloads, official repo all check out)

No `postinstall` script risk found: `npm view cloudinary scripts.postinstall` returned empty.

## Architecture Patterns

### System Architecture Diagram

```
Admin/Local API upload request
        │
        ▼
Payload beforeChange hooks (image resize via sharp, IF imageSizes still enabled —
        │                    see "Don't Hand-Roll" below for why to disable this)
        ▼
Document saved to Postgres (original local filename, e.g. "photo.jpg")
        │
        ▼
@payloadcms/plugin-cloud-storage afterChange hook fires
        │
        ├─► adapter.handleUpload({file: original, ...})  ──┐
        │                                                    │  cloudinary.uploader.upload_stream()
        └─► adapter.handleUpload({file: size N, ...})  ──────┤  (Promise-wrapped, callback SDK)
                                                               │
                                                               ▼
                                                    Cloudinary API (network call,
                                                    CLOUDINARY_API_SECRET required)
                                                               │
                                                               ▼
                                                    uploadResult { public_id, format, bytes }
                                                               │
        ┌──────────────────────────────────────────────────────┘
        ▼
handleUpload RETURNS { filename: public_id, mimeType: format, filesize: bytes }
(do NOT rely on mutating the `file` param — see Common Pitfalls)
        │
        ▼
plugin-cloud-storage merges all handleUpload results (SHALLOW spread — see pitfall)
        │
        ▼
req.payload.update({ id, data: uploadMetadata })  →  Postgres row updated with
        │                                             Cloudinary filename/public_id
        ▼
Frontend requests media URL
        │
        ▼
generateFileURL({ filename }) → cloudinary.url(`media/${filename}`, { secure: true,
                                  fetch_format: 'auto', quality: 'auto' })
        │
        ▼
next/image renders <img src="https://res.cloudinary.com/.../f_auto,q_auto/media/photo">
        │  (next.config.mjs images.remotePatterns allows res.cloudinary.com)
        ▼
Browser fetches directly from Cloudinary CDN — never proxied through the Node server
```

### Recommended Project Structure
```
src/
├── lib/
│   └── cloudinary-adapter.ts   # ported + fixed custom GeneratedAdapter (see Code Examples)
├── collections/
│   └── Media/
│       └── index.ts            # existing — add conditional imageSizes removal for Cloudinary path (see Pitfalls)
└── payload.config.ts           # conditional cloudStoragePlugin registration
next.config.mjs                 # add res.cloudinary.com to images.remotePatterns
```

### Pattern 1: Conditional Plugin Registration (env-gated)
**What:** Only register `cloudStoragePlugin` when all three Cloudinary env vars are present; otherwise Payload's default local-disk upload handling applies automatically (no explicit "local adapter" needed — omitting the plugin IS the local-disk path).
**When to use:** Always for this project — dev machines without Cloudinary credentials must still work (per CONTEXT.md).
**Example:**
```typescript
// Source: verified against @payloadcms/plugin-cloud-storage@3.85.2 types.d.ts
// (Plugin[] accepts a conditionally-built array; spreading an empty array in
// strict TS mode is fully type-safe — no `any`/`as` cast needed.)
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { cloudinaryAdapter } from './lib/cloudinary-adapter'

const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
)

export default buildConfig({
  // ...
  plugins: [
    seoPlugin({ /* ... */ }),
    redirectsPlugin({ /* ... */ }),
    ...(hasCloudinaryCreds
      ? [
          cloudStoragePlugin({
            collections: {
              media: {
                adapter: cloudinaryAdapter,
                disableLocalStorage: true,
                generateFileURL: ({ filename }) =>
                  cloudinaryAdapter.generateFileURL(filename),
              },
            },
          }),
        ]
      : []),
  ],
})
```

### Pattern 2: The Actual Reference Adapter Code (verbatim from `github.com/Sahitya1707/payload-cloudinary`, `src/payload.config.ts`, fetched 2026-07-09)
**What:** The full, real, working `handleUpload`/`handleDelete`/`staticHandler` implementation from the reference repo — not paraphrased.
**Source:** `https://raw.githubusercontent.com/Sahitya1707/payload-cloudinary/master/src/payload.config.ts` [VERIFIED: fetched directly, repo confirmed public, last pushed 2026-05-03]
```typescript
import { v2 as cloudinary } from 'cloudinary'
import type { HandleUpload, HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,       // NOTE: this project's .env uses
  api_key: process.env.CLOUDINARY_API_KEY,        // CLOUDINARY_CLOUD_NAME — use that
  api_secret: process.env.CLOUDINARY_API_SECRET,  // name instead, see Pitfall 3
})

const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',
  async handleUpload({
    file,
    collection,
    data,
    req,
    clientUploadContext,
  }: Parameters<HandleUpload>[0]) {
    try {
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
      // ORIGINAL (fragile) reference behavior — mutates local `file`, does NOT
      // persist to the DB record. DO NOT PORT AS-IS — see fixed version below.
      file.filename = uploadResult.public_id
      file.mimeType = `${uploadResult.format}`
      file.filesize = uploadResult.bytes
    } catch (err) {
      console.error('Upload Error', err)
    }
  },

  async handleDelete({ collection, doc, filename, req }: Parameters<HandleDelete>[0]) {
    try {
      await cloudinary.uploader.destroy(`media/${filename.replace(/\.[^/.]+$/, '')}`)
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },
  staticHandler() {
    return new Response('Not implemented', { status: 501 })
  },
})
```
```typescript
// Registration in the reference's plugins array:
cloudStoragePlugin({
  collections: {
    media: {
      adapter: cloudinaryAdapter,
      disableLocalStorage: true,
      generateFileURL: ({ filename }) => cloudinary.url(`media/${filename}`, { secure: true }),
    },
  },
})
```

### Pattern 3: Corrected `handleUpload` for 3.85.2 (return metadata, don't mutate)
**What:** The fix required to port the reference adapter correctly onto the current `afterChange`-based hook architecture.
**Why:** `@payloadcms/plugin-cloud-storage@3.85.2`'s `HandleUpload` type now allows returning `Partial<FileData & TypeWithID>` [VERIFIED: `types.d.ts` diff, see Common Pitfalls] — this return value is what actually gets written back to the document via `req.payload.update()`. Mutating the `file` parameter (the reference's approach) has no effect on persistence in either version.
```typescript
// Fixed version — return metadata instead of mutating `file`
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
}
```

### Anti-Patterns to Avoid
- **Mutating the `file` parameter inside `handleUpload` to signal a filename change:** Has no effect on the persisted document in `@payloadcms/plugin-cloud-storage@3.85.2` (or in `3.36.1`, where it was a coincidental no-op). Return metadata instead.
- **Keeping Payload's local `imageSizes` (sharp resizing) active alongside Cloudinary storage:** Causes a shallow-merge metadata clobbering bug across parallel per-size `handleUpload` calls (see Common Pitfalls) and duplicates work Cloudinary already does better via URL transformations.
- **Hardcoding `CLOUDINARY_NAME` (reference repo's var name):** This project's `.env` already defines `CLOUDINARY_CLOUD_NAME` (confirmed present) — use that name in `cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, ... })`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive image size variants (thumbnail/card/hero) when using Cloudinary | Payload's local `imageSizes` + `sharp` pre-generation pipeline | Cloudinary URL transformation segments (`w_300`, `w_768`, `w_1600`, `c_fill` as needed) computed at render time via `cloudinary.url(publicId, { width, crop, fetch_format: 'auto', quality: 'auto' })` | Payload's `imageSizes` pipeline pre-generates and uploads N extra files per upload, and — per this research — the current plugin-cloud-storage version cannot reliably persist per-size Cloudinary filenames back to `sizes.<name>.filename` when multiple sizes upload in parallel (shallow-merge bug). Cloudinary's own on-the-fly transform API solves the same problem better and is what MEDIA-03 (`f_auto,q_auto`) already implies using |
| Promise-wrapping a callback API | A hand-rolled generic promisify utility | The direct `new Promise((resolve, reject) => { cloudinary.uploader.upload_stream(opts, (err, result) => ...) })` pattern already in the reference repo | `util.promisify` doesn't cleanly wrap `upload_stream` because it returns a writable stream synchronously (that you must `.end()`) in addition to taking a callback — the manual Promise wrapper is the standard, documented pattern for this exact SDK method, not something to abstract further |

**Key insight:** The reference implementation is architecturally sound as a *template* but was tested only against a `Media` collection with zero `imageSizes` — the moment real `imageSizes` enter the picture (as they already do in this project), the naive per-file-metadata-return pattern breaks down. The correct fix is not "write cleverer merge logic" but "stop generating local size variants Cloudinary can already produce on demand."

## Common Pitfalls

### Pitfall 1: `handleUpload` file mutation does not persist (across both 3.36.1 and 3.85.2)
**What goes wrong:** Copying the reference repo's `file.filename = uploadResult.public_id` pattern verbatim gives the illusion of working (Cloudinary URLs might resolve by coincidence for single-file, no-imageSizes collections) but the Postgres `filename` column keeps the original local filename.
**Why it happens:** `file` in `handleUpload`'s args is a freshly-constructed plain object from `getIncomingFiles()`, not a reference to the document being saved. Mutating it is discarded once the function returns.
**How to avoid:** Return `{ filename, mimeType, filesize }` from `handleUpload` (supported since the `afterChange`-hook rewrite; type signature confirms `HandleUpload` may return `Partial<FileData & TypeWithID> | Promise<...>` in 3.85.2 vs only `void` in 3.36.1 — this is the one **additive, backward-compatible** interface change found between the two versions).
**Warning signs:** After a real upload, the Payload admin still shows the original local filename/extension instead of a Cloudinary `public_id`, or `next/image` 404s because `generateFileURL` builds a URL from a filename Cloudinary never actually stored under.

### Pitfall 2: `imageSizes` + Cloudinary = shallow-merge metadata clobbering
**What goes wrong:** With `imageSizes: [thumbnail, card, hero]` still active (as in this project's current `Media` collection), Payload uploads the original PLUS 3 resized files, calling `handleUpload` once per file (4 total, concurrently via `Promise.all`). If each call for a size returns `{ sizes: { <sizeName>: { filename: ... } } }`, `afterChange.js`'s merge (`uploadResults.reduce((acc, m) => ({...acc, ...m}), {})`) does a **shallow** spread — the last-resolved size's `sizes` object completely replaces, rather than merges with, the previous ones'. Only one size's Cloudinary filename survives in the final `payload.update()` call; the other sizes keep stale local filenames pointing nowhere (since `disableLocalStorage: true` deleted the local copies).
**Why it happens:** [VERIFIED via direct source read of `@payloadcms/plugin-cloud-storage@3.85.2/dist/hooks/afterChange.js`] — this is a real limitation in the plugin framework itself, present regardless of adapter implementation quality.
**How to avoid:** For the spike, disable/remove `imageSizes` from the `Media` collection's `upload` config when Cloudinary is the active adapter (env-gate this the same way the plugin registration is gated), and rely on Cloudinary URL transformations for size variants instead. If per-size Payload-native resizing is a hard requirement later, it would need a custom `afterChange` collection hook that bypasses the plugin's built-in merge and does an atomic `payload.update()` with a fully-assembled `sizes` object — out of scope for this spike.
**Warning signs:** Uploading a test image and finding only `thumbnail` (or whichever size resolves last) has a valid Cloudinary URL while `card`/`hero` 404.

### Pitfall 3: Env var name mismatch
**What goes wrong:** Reference repo's `cloudinary.config()` reads `process.env.CLOUDINARY_NAME`; this project's `.env` (confirmed via `grep`) already defines `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (the CONTEXT.md-documented, already-loaded set). Porting the reference code verbatim silently uses `undefined` for `cloud_name`, and Cloudinary SDK calls fail with an auth/config error, not a clear "missing env var" error.
**Why it happens:** Different naming convention chosen by the reference repo's author vs. this project's `.env` (which matches the official Cloudinary SDK's own most common convention, `CLOUDINARY_CLOUD_NAME`).
**How to avoid:** Use `process.env.CLOUDINARY_CLOUD_NAME` in the ported adapter, and use the same three names in the `hasCloudinaryCreds` gate check.
**Warning signs:** `cloudinary.uploader.upload_stream` throwing `Must supply cloud_name` or similar at runtime.

### Pitfall 4: `staticHandler()` arity looks wrong but isn't
**What goes wrong:** The reference's `staticHandler()` takes zero parameters, while the current type signature is `StaticHandler = (req: PayloadRequest, args: {...}) => Promise<Response> | Response`. This looks like a type mismatch.
**Why it happens/why it's actually fine:** TypeScript structurally allows a function with fewer declared parameters to satisfy a type expecting more (a function that ignores its arguments is a valid implementation of a type that would pass them) — this is standard, sound TS behavior, not a version-compatibility issue. [VERIFIED: `types.d.ts` diff shows `StaticHandler`'s `args.params` gained an optional `prefix` field and a top-level optional `headers` field between 3.36.1 and 3.85.2 — both additive, non-breaking]
**How to avoid:** No action needed — port `staticHandler()` as-is.
**Warning signs:** None expected; flagged here only because it may look suspicious during code review.

## Code Examples

### Full Ported Adapter (recommended starting point for `src/lib/cloudinary-adapter.ts`)
```typescript
// Source: ported + corrected from github.com/Sahitya1707/payload-cloudinary
// (fetched verbatim 2026-07-09), fixes applied per Pitfalls 1-3 above.
import { v2 as cloudinary } from 'cloudinary'
import type { HandleUpload, HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

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

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      await cloudinary.uploader.destroy(`media/${filename.replace(/\.[^/.]+$/, '')}`)
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },

  generateFileURL(filename: string) {
    // f_auto,q_auto per MEDIA-03 — official Cloudinary syntax, comma-separated
    // within one transformation segment (confirmed via official docs, 2026-07-09)
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

### next.config.mjs addition
```javascript
// Source: Next.js official docs pattern for remotePatterns, verified 2026-07-09
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

### Fastest end-to-end spike validation (Local API, no admin UI needed)
```typescript
// scripts/spike-cloudinary-upload.ts — run with `payload run` or `tsx`
// Fastest way to validate the whole chain in one shot: upload via Local API,
// confirm the returned doc has a Cloudinary-shaped filename, then fetch the
// generated URL directly to confirm it 200s.
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'

const payload = await getPayload({ config })

const doc = await payload.create({
  collection: 'media',
  data: { alt: 'spike test image' },
  filePath: './scripts/fixtures/test-image.jpg', // any small real image file
})

console.log('Created doc:', doc)
// Expect doc.filename to look like a Cloudinary public_id (e.g. "media/test-image"),
// NOT the original local filename with extension, if Pitfall 1's fix was applied.

const res = await fetch(doc.url!)
console.log('Public URL status:', res.status) // expect 200
console.log('Public URL:', doc.url)

await payload.delete({ collection: 'media', id: doc.id })
const res2 = await fetch(doc.url!)
console.log('After delete, status (expect 404 or Cloudinary "not found"):', res2.status)

process.exit(0)
```
This is faster and more diagnostic than uploading through the admin UI first — it directly surfaces whether `handleUpload`'s return value was persisted correctly (Pitfall 1) and whether `handleDelete` actually removed the asset, in under 10 seconds per run, before touching the browser at all. Follow up with one admin-UI upload only as a final human-visible confirmation, not as the primary test loop.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `handleUpload` mutates local `file` object, relies on filename coincidence for URL correctness | `handleUpload` returns `Partial<FileData & TypeWithID>`, persisted via `req.payload.update()` in a new `afterChange` hook | Between `@payloadcms/plugin-cloud-storage@3.36.1` (repo's target, referenced April/May 2026) and `3.85.2` (current, 2026-07-01) | Reference code must be adapted, not copy-pasted, to reliably persist Cloudinary filenames — see Pattern 3 |
| Upload happens in `beforeChange` (pre-save) | Upload happens in `afterChange` (post-save, followed by a metadata-patch update) | Same window as above | Minor: a document briefly exists in Postgres with its pre-Cloudinary local filename between create and the follow-up update; not a blocker for this spike but worth knowing if debugging timing-sensitive tests |

**Deprecated/outdated:** None found — `plugin-cloud-storage`'s core adapter contract (`GeneratedAdapter`) is stable; only the internal wiring around it evolved.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `cloudinary` npm package legitimacy — approved without slopcheck (sandboxed, tool unavailable this session) | Package Legitimacy Audit | Low — age (13 yrs), downloads (874k/wk), and official GitHub org all independently corroborate; risk is near-zero but formally unverified by the required tool. Planner should still gate the install behind a trivial `checkpoint:human-verify` |
| A2 | `@jhb.software/payload-cloudinary-plugin` and `payload-storage-cloudinary` remain viable fallbacks if the custom adapter hits a blocker | Standard Stack / Alternatives | Low — these are documented only as a fallback path per CONTEXT.md, not the primary plan; if needed, re-verify their current version/compat at that time since this research did not deep-dive their internals |

## Open Questions

1. **Does the "disable `imageSizes` for Cloudinary path" recommendation need to be env-conditional in the collection config, or can it just be removed outright?**
   - What we know: The shallow-merge bug (Pitfall 2) only manifests when Cloudinary storage + `imageSizes` are both active. In local-disk fallback mode (no Cloudinary creds), Payload's native `imageSizes`/sharp pipeline works completely normally and has no such issue.
   - What's unclear: Whether dev environments without Cloudinary creds should keep getting resized local variants (arguably useful for local testing) while production (with Cloudinary) does not.
   - Recommendation: Make `imageSizes` conditional on the same `hasCloudinaryCreds` flag used for plugin registration — `upload: { imageSizes: hasCloudinaryCreds ? undefined : [...] }` — so local dev behavior is unchanged and only the Cloudinary path switches to transformation-URL-based sizing. Planner should turn this into an explicit task.

2. **Exact folder/prefix convention:** CONTEXT.md says keep the reference's `media/` prefix pattern "salvo razón en contra" — no reason against it was found during this research; keep `media/` as the Cloudinary folder prefix.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Cloudinary account credentials (`CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`) | MEDIA-01, MEDIA-02 | ✓ [VERIFIED: env var names confirmed present via `grep` on `.env`, values not read per security protocol] | — | Local disk storage (Payload default, already the current behavior) |
| `cloudinary` npm package | MEDIA-01 | Not yet installed in project — needs `npm install cloudinary` | latest `2.10.0` on registry | None needed — this is the only path |
| Network access to Cloudinary API from dev machine | Spike validation | Assumed available (standard outbound HTTPS) — not directly tested this research session | — | None; blocking if firewalled, unlikely in this environment |

**Missing dependencies with no fallback:** none blocking — `cloudinary` package install is a standard `npm install`, credentials already present.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in project yet (no `vitest.config.*`/`jest.config.*`/`pytest.ini` found under project root during Phase 1-2 scaffolding per prior research) |
| Config file | none — see Wave 0 Gaps |
| Quick run command | `tsx scripts/spike-cloudinary-upload.ts` (spike script, not a formal test, but the fastest automatable check for this phase) |
| Full suite command | n/a — this phase is a spike, not feature code with a permanent test suite |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MEDIA-01 | Adapter uploads/deletes/generates URL correctly against real Cloudinary account | smoke (Local API script) | `tsx scripts/spike-cloudinary-upload.ts` | ❌ Wave 0 |
| MEDIA-02 | Plugin registration correctly gated by env vars (both paths: with and without creds) | manual + smoke | Run app once with creds present, once with `.env` Cloudinary vars temporarily unset, confirm no crash in either mode | ❌ Wave 0 (manual verification step, not automatable without env-swapping harness) |
| MEDIA-03 | `f_auto,q_auto` present in generated URLs, `next/image` renders without "unconfigured host" error | smoke + manual browser check | Inspect `doc.url` string from spike script for `f_auto,q_auto`; manually load a test page with `next/image` pointed at a Cloudinary media doc | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** run the spike script after any adapter code change
- **Per wave merge:** n/a (single-wave spike phase)
- **Phase gate:** spike script must show `200` status on the generated URL and `mimeType`/`filename` reflecting a Cloudinary `public_id` (not the original local filename) before considering MEDIA-01 done

### Wave 0 Gaps
- [ ] `scripts/spike-cloudinary-upload.ts` — the validation script itself (see Code Examples for starting content)
- [ ] `scripts/fixtures/test-image.jpg` — a small real image file to upload in the spike
- [ ] No formal test framework install needed for this phase — it is explicitly a spike, not permanent feature code with regression coverage

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — no new auth surface introduced |
| V3 Session Management | no | N/A |
| V4 Access Control | yes | `access: { read: () => true }` on Media collection (already existing, public read is intentional for public media) — no change needed for this phase |
| V5 Input Validation | yes | Cloudinary SDK's `resource_type: 'auto'` + Payload's existing `mimeTypes: ['image/*']` restriction on the Media collection bound the upload surface; do not widen `mimeTypes` without reconsidering upload abuse risk |
| V6 Cryptography | yes | `CLOUDINARY_API_SECRET` must never be exposed client-side — the adapter runs entirely server-side (`handleUpload`/`handleDelete` execute inside Payload's Node process, never in a client bundle); confirm no `NEXT_PUBLIC_` prefix is ever applied to any Cloudinary secret var |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Secret leakage via client bundle (accidentally prefixing `CLOUDINARY_API_SECRET` with `NEXT_PUBLIC_`) | Information Disclosure | Keep all three Cloudinary env vars unprefixed (server-only); this project's existing `.env` already does this correctly — verify no future refactor changes it |
| Unrestricted file upload leading to storage abuse / cost runaway on Cloudinary | Denial of Service | Existing `mimeTypes: ['image/*']` restriction on the Media collection already scopes uploads to images; Cloudinary account-level upload presets/limits are an account-config concern outside this phase's scope but worth flagging to Juan for later account hardening |
| Public `read: () => true` access control on Media collection combined with Cloudinary public URLs | (accepted risk, not a threat) | Intentional — media is meant to be publicly viewable on a portfolio site; no mitigation needed, just documented as an accepted, deliberate access-control decision |

## Sources

### Primary (HIGH confidence)
- `https://raw.githubusercontent.com/Sahitya1707/payload-cloudinary/master/src/payload.config.ts` — fetched verbatim, full adapter source
- `https://raw.githubusercontent.com/Sahitya1707/payload-cloudinary/master/src/collections/Media.ts` — confirmed no `imageSizes` in reference
- `https://raw.githubusercontent.com/Sahitya1707/payload-cloudinary/master/package.json` — confirmed exact target versions (`payload@3.33.0`, `@payloadcms/plugin-cloud-storage@^3.36.1`, `cloudinary@^2.6.0`)
- `https://cdn.jsdelivr.net/npm/@payloadcms/plugin-cloud-storage@3.85.2/dist/hooks/afterChange.js` — current hook implementation, source of Pitfall 1 & 2 findings
- `https://cdn.jsdelivr.net/npm/@payloadcms/plugin-cloud-storage@3.36.1/dist/hooks/beforeChange.js` — old hook implementation, confirms architecture shift
- `https://unpkg.com/@payloadcms/plugin-cloud-storage@3.85.2/dist/types.d.ts` and `@3.36.1` — direct type-definition diff confirming `GeneratedAdapter` interface is additive/backward-compatible
- `npm view cloudinary version/time.created/repository.url`, `npm view @payloadcms/plugin-cloud-storage version` — live registry queries, 2026-07-09
- `api.npmjs.org/downloads/point/last-week/cloudinary` — live download stats
- `https://cloudinary.com/documentation/image_optimization` (WebFetch) — confirmed `f_auto,q_auto` comma-separated syntax and `cloudinary.url()` Node SDK options

### Secondary (MEDIUM confidence)
- WebSearch: Next.js `images.remotePatterns` syntax — cross-checked against multiple community sources, consistent with official Next.js docs pattern (protocol/hostname/pathname shape)
- Project files read directly: `.env`/`.env.example` (var names only, not values, per security protocol), `next.config.mjs`, `src/payload.config.ts`, `src/collections/Media/index.ts` (existing `imageSizes` config confirmed)

### Tertiary (LOW confidence)
- Initial WebSearch snippet claiming "never f_auto,q_auto with a comma" — contradicted by official Cloudinary docs fetch (WebFetch), discarded in favor of the verified official syntax

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — single-package install, versions verified live against npm registry
- Architecture (adapter port + pitfalls): HIGH — based on direct source-code diffing of the actual plugin internals across both versions, not documentation or training-data inference
- imageSizes/Cloudinary interaction gap: HIGH — verified via reading `afterChange.js`'s actual merge logic, a genuine and non-obvious finding
- Pitfalls: HIGH — each pitfall traced to specific verified source lines
- Security domain: MEDIUM — standard, low-novelty concerns for this stack; no deep pentest-style analysis performed (out of scope for a spike)

**Research date:** 2026-07-09
**Valid until:** ~30 days (Payload/plugin-cloud-storage ships frequent minor releases; re-verify `GeneratedAdapter` shape if implementation is delayed past early August 2026)
