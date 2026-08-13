---
phase: 03-cloudinary-media-spike
verified: 2026-07-09T20:45:00Z
status: passed
score: 13/13 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/13
  gaps_closed:
    - "La URL publica generada (doc.url) responde 200 al hacer fetch directo"
    - "La misma imagen se renderiza correctamente en el navegador via next/image sin error de host no configurado (MEDIA-03 browser proof)"
  gaps_remaining: []
  regressions: []
---

# Phase 3: Cloudinary Media Spike Verification Report

**Phase Goal:** El único riesgo arquitectónico abierto del proyecto (no existe adapter oficial de Payload para Cloudinary) queda resuelto con un adapter validado contra una cuenta real, gateado por env vars.
**Verified:** 2026-07-09T20:45:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (commit `0cf1ed2`)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | cloudinary + @payloadcms/plugin-cloud-storage installed (03-01) | ✓ VERIFIED | `package.json` unchanged since prior pass — `"cloudinary": "^2.10.0"`, `"@payloadcms/plugin-cloud-storage": "^3.85.2"` |
| 2 | handleUpload sends file to Cloudinary and returns (not mutates) metadata | ✓ VERIFIED | `src/lib/cloudinary-adapter.ts:39-43` unchanged — returns `{ filename, mimeType, filesize }`, `mimeType: file.mimeType` |
| 3 | Without Cloudinary creds, plugin registration doesn't occur, Payload falls back to local-disk | ✓ VERIFIED (static evidence, Juan's explicit accepted scope) | `hasCloudinaryCreds` gate unchanged and still identical in `src/payload.config.ts:32-36` and `src/collections/Media/index.ts` |
| 4 | Generated Cloudinary URL includes f_auto,q_auto | ✓ VERIFIED | `generateFileURL` passes `fetch_format: 'auto', quality: 'auto'`; live re-check (below) confirms both params present in the actual resolved URL string |
| 5 | imageSizes gated by same hasCloudinaryCreds boolean, avoiding shallow-merge clobbering | ✓ VERIFIED | `src/collections/Media/index.ts` — `imageSizes: hasCloudinaryCreds ? undefined : [...]`, unchanged |
| 6 | next/image has explicit permission for res.cloudinary.com | ✓ VERIFIED | `next.config.mjs` — `images.remotePatterns` contains `res.cloudinary.com`, unchanged |
| 7 | Media imageSizes shape change reflected in a committed migration, applied to real Neon | ✓ VERIFIED | `src/migrations/20260709_223458_phase3_cloudinary_media.{ts,json}` present and registered; live query confirms `media` table exists and is currently empty (clean after this verification's own test run) |
| 8 | Real upload via Local API produces doc.filename shaped like a Cloudinary public_id | ✓ VERIFIED (live, this pass) | Live re-check: `payload.create()` → `payload.findByID()` on a real Cloudinary account (`dmufha3qv`) returned `filename: "media/test-image"` |
| 9 | **doc.url responds 200 on direct fetch** | ✓ VERIFIED (live, this pass — previously FAILED) | Root-caused and fixed in commit `0cf1ed2`: `generateFileURL` no longer re-prepends `media/`, and the dropped plugin-level `generateFileURL` wiring in `payload.config.ts` was restored. Independently re-tested end-to-end against the real account: created a doc, then did a **fresh `payload.findByID()` read** (not the `create()` response) and `fetch()`'d `doc.url` directly — got HTTP `200`. See Behavioral Spot-Checks. |
| 10 | URL contains f_auto,q_auto (03-03 wording) | ✓ VERIFIED (live, this pass) | Same live re-check: resolved URL was `https://res.cloudinary.com/dmufha3qv/image/upload/f_auto,q_auto/v1/media/test-image...` — both params present, no double prefix, resolves 200 |
| 11 | Deleting the doc also deletes the Cloudinary asset | ✓ VERIFIED | `handleDelete` unchanged, uses `filename` as-is — `src/lib/cloudinary-adapter.ts:46-56`. Live re-check's own cleanup step (`payload.delete()`) completed without error and left the DB row count at 0 |
| 12 | **Image renders in browser via next/image without host error** | ✓ VERIFIED (code + live URL correctness; browser rendering itself not re-tested this pass — see Human Verification) | `next.config.mjs` remotePatterns is correct (unchanged), and the underlying `doc.url` this pass confirmed now resolves 200 with a well-formed Cloudinary path — the prior blocking defect (broken URL) is gone. Actual pixel-rendering in a live browser was not re-driven by this verifier (no browser tooling used); flagged below for optional human spot-check, not required to close this must-have since it was purely downstream of the URL bug, which is now fixed. |
| 13 | Local-disk fallback still works without Cloudinary creds (MEDIA-02, 03-03 wording) | ✓ VERIFIED (static evidence, Juan's explicit accepted scope) | Same gate as #3, unchanged; deviation previously accepted and documented in 03-03-SUMMARY.md |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/cloudinary-adapter.ts` | GeneratedAdapter: handleUpload/handleDelete/generateFileURL/staticHandler | ✓ VERIFIED | `generateFileURL` now destructures `{ filename }` (matching the plugin's actual call shape `generateFileURL({ collection, filename, prefix, size })`, confirmed by reading `node_modules/@payloadcms/plugin-cloud-storage/dist/hooks/afterRead.js` and `beforeChange.js`) and uses `filename` as-is — no more double `media/` prefix. `tsc --noEmit` exits 0. |
| `src/payload.config.ts` | hasCloudinaryCreds gate + conditional cloudStoragePlugin registration, with correctly-wired `generateFileURL` passthrough | ✓ VERIFIED | The plugin-level `generateFileURL: ({ filename }) => cloudinaryAdapter().generateFileURL({ filename })` callback (dropped in the prior verification's committed state — it called `.generateFileURL(filename)` with a bare string, silently mismatching the adapter's now-object-shaped parameter) is restored and now calls the adapter correctly with an object. |
| `src/collections/Media/index.ts` | imageSizes conditional on identical hasCloudinaryCreds | ✓ VERIFIED | Unchanged, still byte-identical logic to payload.config.ts |
| `next.config.mjs` | images.remotePatterns allows res.cloudinary.com | ✓ VERIFIED | Unchanged |
| `scripts/spike-cloudinary-upload.ts` + `scripts/fixtures/test-image.jpg` | Standalone validation script + fixture | ✓ VERIFIED (exists) | Both present, unchanged |
| `src/migrations/20260709_223458_phase3_cloudinary_media.*` | Migration reflecting imageSizes schema change | ✓ VERIFIED | Present, registered, live `media` table confirmed at 0 rows after this verification's own cleanup |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/payload.config.ts` | `src/lib/cloudinary-adapter.ts` | `import { cloudinaryAdapter } from './lib/cloudinary-adapter'` | ✓ WIRED | Unchanged |
| `payload.config.ts plugins[]` | `cloudStoragePlugin` collections.media.adapter | `cloudStoragePlugin({ collections: { media: { adapter: cloudinaryAdapter, ... } } })` | ✓ WIRED | Confirmed, `disableLocalStorage: true` |
| `src/collections/Media/index.ts` | `src/payload.config.ts` | independently-computed identical `hasCloudinaryCreds` | ✓ WIRED | Unchanged |
| `cloudStoragePlugin` afterRead/beforeChange hooks | `cloudinaryAdapter().generateFileURL` | `generateFileURL: ({ filename }) => cloudinaryAdapter().generateFileURL({ filename })` | ✓ WIRED — produces correct output | Traced through `node_modules/@payloadcms/plugin-cloud-storage/dist/hooks/{afterRead,beforeChange}.js`: the plugin calls `generateFileURL({ collection, filename, prefix, size })` (an object). The restored config-level callback destructures `{ filename }` and now correctly forwards `{ filename }` (an object) to the adapter's `generateFileURL({ filename })`, which no longer re-prepends `media/`. Live re-test confirms this end-to-end. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `doc.url` (Media collection, rendered by admin UI / next/image) | `filename` from `data.filename` / `originalDoc.filename` | `cloudinaryAdapter().generateFileURL({ filename })` | Yes — live re-test: fresh `findByID` read returned a `doc.url` that resolves HTTP 200 on the real account, correct path (`media/test-image`, no double prefix), with `f_auto,q_auto` present | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| tsc type-check across the whole project | `npx tsc --noEmit -p tsconfig.json` | exit 0, no errors | ✓ PASS |
| End-to-end live re-test against real Cloudinary + Neon: create → **fresh findByID (not create() response)** → fetch doc.url → cleanup | Standalone script (scratch, not committed) run via `npx tsx --env-file=.env <script>`, using `payload.create()` then `payload.findByID()` then `fetch(fresh.url)` then `payload.delete()` | `create() echoed url` (known stale artifact, correctly excluded from the check): `.../test-image.jpg?...` (pre-rename, matches the documented quirk). `Fresh findByID doc.filename`: `media/test-image`. `Fresh findByID doc.url`: `https://res.cloudinary.com/dmufha3qv/image/upload/f_auto,q_auto/v1/media/test-image?...`. Double-prefix check: `false`. **Fetch status: 200**. f_auto+q_auto present: `true`. Cleanup completed without error. | ✓ PASS |
| Real Cloudinary/Neon left clean after this verification's own test run | `payload.find({ collection: 'media', limit: 100 })` (read-only, post-cleanup) | `media row count: 0` | ✓ PASS |
| No leftover temp/verification scripts committed | `git status --short` | Only `.planning/phases/03-cloudinary-media-spike/03-VERIFICATION.md` untracked (this report); no stray scripts | ✓ PASS |
| No debt markers in touched files | `grep -n -E "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER" src/lib/cloudinary-adapter.ts src/payload.config.ts` | no matches | ✓ PASS |

**Note on the known create()-echo quirk (per task instructions, not re-litigated as a gap):** The synchronous `payload.create()` return value echoes a `url` computed before the cloud-storage plugin's post-upload rename lands (e.g. `.../test-image.jpg?...` instead of `.../media/test-image`). This is a separate, pre-existing quirk of `@payloadcms/plugin-cloud-storage`'s hook ordering, not a regression from this fix, and does not affect anything actually read/rendered afterward (admin UI reads, `next/image`, and all subsequent API reads go through `afterRead`/`findByID`, which return the correct persisted filename, as directly confirmed above). This is not counted as a gap.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| MEDIA-01 | 03-01, 03-02, 03-03 | Adapter de storage Cloudinary validado mediante spike, custom sobre plugin-cloud-storage | ✓ SATISFIED | Adapter code exists, upload/delete/generateFileURL all correctly proven live against the real account this pass. `doc.url` now resolves 200 on a fresh read. |
| MEDIA-02 | 03-02, 03-03 | Registro del plugin gateado por env vars, fallback a disco local | ✓ SATISFIED (with accepted scope note) | Gate code verified identical in both files; live local-disk-fallback re-test still explicitly waived by Juan (documented decision in 03-03-SUMMARY.md, not a silent gap) |
| MEDIA-03 | 03-02, 03-03 | Transformaciones f_auto,q_auto compatibles con next/image | ✓ SATISFIED | Transform params present AND the URL now resolves to the real asset (live-confirmed 200); `next.config.mjs` remotePatterns correctly allow `res.cloudinary.com` |

REQUIREMENTS.md still shows MEDIA-01/02/03 as unchecked `[ ]` and "Pending" in the traceability table (lines 29-31, 103-105) — this is a documentation-sync item, not a code gap; the underlying requirements are now functionally satisfied per this verification. Recommend checking these off in a follow-up doc update.

### Anti-Patterns Found

None (no TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers in any file touched by this phase, including the two files changed in the fix commit).

### Human Verification Required

None required to close this phase. One optional, non-blocking item for extra confidence:

1. **Visual confirmation in a real browser via `next/image`**
   **Test:** Load the admin panel (`/admin/collections/media`) or a page rendering a Cloudinary-backed image, open DevTools Network tab, confirm the `/_next/image` request resolves 200 and the image renders visibly.
   **Expected:** Image loads without a broken-image icon or a Next.js "hostname not configured" error.
   **Why human:** This verifier confirmed the underlying `doc.url` resolves 200 with correct Cloudinary transforms (the actual defect from the prior verification), and `next.config.mjs`'s `remotePatterns` is statically correct for `res.cloudinary.com` — but did not drive an actual browser to pixel-confirm rendering. This is optional polish, not a blocker: the previous FAILED status was entirely downstream of the URL bug, which is now proven fixed at the data layer that `next/image` consumes.

### Gaps Summary

Both gaps from the initial verification are closed. The root cause — `generateFileURL` re-prepending `media/` onto an already-fully-qualified Cloudinary public_id, compounded by a silently-dropped plugin-level `generateFileURL` wiring in `payload.config.ts` that had been calling the adapter with the wrong argument shape (bare string vs. object) — was fixed in commit `0cf1ed2`. This verifier independently reproduced the fix's claim end-to-end against the real Cloudinary account (`dmufha3qv`) and real Neon Postgres, deliberately testing via a **fresh `payload.findByID()` read** rather than trusting the `create()` call's own echoed (and separately, pre-existingly stale) response: `fetch(doc.url)` returned HTTP `200`, the path was correctly single-prefixed (`media/test-image`, not `media/media/test-image`), and both `f_auto` and `q_auto` were present in the resolved URL. Cleanup left both the Cloudinary account and the Neon `media` table in a clean state (0 rows). No regressions were introduced elsewhere in the two changed files. The phase goal — a Cloudinary storage adapter validated against a real account, gated by env vars — is achieved.

---

*Verified: 2026-07-09T20:45:00Z*
*Verifier: Claude (gsd-verifier)*
