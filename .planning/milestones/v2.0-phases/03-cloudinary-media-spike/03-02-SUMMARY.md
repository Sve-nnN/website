---
phase: 03-cloudinary-media-spike
plan: 02
subsystem: media
tags: [cloudinary, payload-cms, storage, migration, neon]

# Dependency graph
requires:
  - phase: 03-cloudinary-media-spike
    provides: cloudinary@2.10.0 and @payloadcms/plugin-cloud-storage@3.85.2 installed (03-01)
provides:
  - "Custom Cloudinary storage adapter (src/lib/cloudinary-adapter.ts), conditionally registered in payload.config.ts via hasCloudinaryCreds"
  - "Media.imageSizes gated off when Cloudinary is active (avoids shallow-merge clobbering bug), local-disk fallback intact"
  - "next.config.mjs images.remotePatterns allows res.cloudinary.com for next/image"
  - "Neon schema migrated to drop unused sizes_* columns from media table"
affects: [03-cloudinary-media-spike-wave3, 04-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["conditional plugin registration via env-var-derived boolean", "GeneratedAdapter handleUpload returns metadata instead of mutating file param"]

key-files:
  created: [src/lib/cloudinary-adapter.ts, src/migrations/20260709_223458_phase3_cloudinary_media.ts, src/migrations/20260709_223458_phase3_cloudinary_media.json]
  modified: [src/payload.config.ts, src/collections/Media/index.ts, next.config.mjs, src/migrations/index.ts]

key-decisions:
  - "handleUpload returns { filename, mimeType, filesize } instead of mutating the file parameter — reference repo (Sahitya1707/payload-cloudinary) pattern doesn't persist against @payloadcms/plugin-cloud-storage@3.85.2's afterChange architecture, per RESEARCH.md Pitfall 1"
  - "imageSizes gated by the same hasCloudinaryCreds boolean used for plugin registration — avoids the shallow-merge clobbering bug when plugin-cloud-storage runs handleUpload once per image size in parallel, per RESEARCH.md Pitfall 2"
  - "Used CLOUDINARY_CLOUD_NAME (already in .env) instead of the reference repo's CLOUDINARY_NAME, per RESEARCH.md Pitfall 3"
  - "Task 3 migration executed directly by the orchestrator in its own transcript, with Juan's direct authorization obtained via AskUserQuestion before code was even written — same escalation pattern as Phase 1 (01-10) and Phase 2 (02-02): auto-mode classifier correctly blocked the sub-agent from writing DDL against production without a verifiable authorization in its own transcript, so the orchestrator (which had the authorization) executed it instead of attempting to relay/bypass"

patterns-established: ["cloudinary-adapter.ts as src/lib/ single-responsibility adapter module, imported once into payload.config.ts plugins array"]

requirements-completed: [MEDIA-01, MEDIA-02, MEDIA-03]

# Metrics
duration: ~25min (code) + orchestrator-executed migration
completed: 2026-07-09
---

# Phase 03 Plan 02: Cloudinary Adapter, Conditional Wiring, and Neon Schema Migration Summary

**Built the corrected Cloudinary storage adapter (fixing two real bugs found in the reference implementation), wired it conditionally into payload.config.ts, gated Media's imageSizes to avoid a parallel-upload data-corruption bug, and applied the resulting schema migration to the real Neon database.**

## Performance

- **Tasks:** 3
- **Files modified:** 7 (1 new adapter, 2 new migration files, 4 modified)

## Accomplishments

- `src/lib/cloudinary-adapter.ts` created — Cloudinary storage adapter conforming to Payload's `GeneratedAdapter` interface (`handleUpload`, `handleDelete`, `generateURL`, `staticHandler`), with the two Pitfall fixes applied (return-not-mutate, correct env var name)
- `src/payload.config.ts` — `hasCloudinaryCreds` boolean (true only when all 3 `CLOUDINARY_*` env vars present) gates conditional registration of `cloudStoragePlugin` targeting the `media` collection
- `src/collections/Media/index.ts` — `imageSizes` set to `undefined` when `hasCloudinaryCreds` is true (relies on Cloudinary's own URL-transformation sizing instead), retains the original 3-size array (thumbnail/card/hero) for local-disk dev without credentials
- `next.config.mjs` — `images.remotePatterns` now includes `res.cloudinary.com` so `next/image` can optimize Cloudinary-hosted media
- Migration `20260709_223458_phase3_cloudinary_media` generated (clean DROP/ADD COLUMN of `sizes_thumbnail_*`/`sizes_card_*`/`sizes_hero_*` on `media`, no ambiguous rename prompts this time) and applied against the real Neon database — confirmed via `payload migrate:status` (`Ran: Yes`, batch 3) and an independent read-only query confirming 0 `sizes_*` columns remain on `media`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create corrected Cloudinary storage adapter** — `44fff77` (feat)
2. **Task 2: Wire conditional plugin registration, gate imageSizes, allow Cloudinary in next/image** — `e74c9c9` (feat)
3. **Task 3: [BLOCKING] Generate and apply Neon migration** — `326e82e` (feat) — executed by the orchestrator directly (not the sub-agent) after Juan's explicit authorization in the orchestrator's own transcript, per the checkpoint's escalation protocol

**Plan metadata:** (this commit, following SUMMARY write)

## Files Created/Modified

- `src/lib/cloudinary-adapter.ts` (new) — the storage adapter
- `src/payload.config.ts` — conditional plugin registration
- `src/collections/Media/index.ts` — gated `imageSizes`
- `next.config.mjs` — `remotePatterns` for `res.cloudinary.com`
- `src/migrations/20260709_223458_phase3_cloudinary_media.ts` / `.json` (new) — migration files
- `src/migrations/index.ts` — updated migration index

## Decisions Made

- **Task 3 execution routed through the orchestrator, not the sub-agent, after two denial cycles.** The auto-mode permission classifier denied both (a) the sub-agent attempting to run the migration directly, and (b) a second sub-agent spawn attempt for the same plan, both times correctly identifying that no verifiable Juan authorization existed in that sub-agent's own transcript. The orchestrator split the plan: dispatched a scoped sub-agent for Tasks 1-2 (pure code, no DB writes) with explicit instructions to stop before Task 3, then obtained Juan's direct authorization via `AskUserQuestion` in its own transcript, then executed `payload migrate:create` + `payload migrate` itself. This mirrors the exact pattern already established in Phase 1 (01-10) and Phase 2 (02-02) — cross-session/cross-agent authorization relay is never accepted, only direct authorization in the executing transcript.
- **No ambiguous rename prompts this time** (unlike Phase 2's migration) — this migration only removed columns cleanly, no `create column` vs `rename` disambiguation needed.

## Deviations from Plan

- Task 3 was executed by the orchestrator directly rather than the plan's assigned sub-agent, due to the permission classifier's correct refusal to accept relayed authorization. Functionally identical outcome (migration applied, verified) — process deviation only, not a scope or requirement deviation.

## Issues Encountered

- The sub-agent handling Tasks 1-2 experienced a mid-response connection drop while attempting to write this SUMMARY.md and close out metadata after the orchestrator had already applied Task 3 — no code or migration work was lost (all confirmed via git log and live `payload migrate:status` check), only the final documentation step needed to be completed by the orchestrator directly.

## User Setup Required

None beyond the authorization already given — Cloudinary credentials were already present in `.env` from project setup.

## Next Phase Readiness

- Adapter code, conditional wiring, and schema are all in place and migrated
- Wave 3 (03-03) can now run real end-to-end validation: upload/delete round-trip against the live Cloudinary account, `next/image` rendering confirmation, and local-disk-fallback verification

---
*Phase: 03-cloudinary-media-spike*
*Completed: 2026-07-09*

## Self-Check: PASSED

- FOUND: .planning/phases/03-cloudinary-media-spike/03-02-SUMMARY.md
- FOUND: commits 44fff77, e74c9c9, 326e82e
- Verified: `payload migrate:status` shows `20260709_223458_phase3_cloudinary_media` as `Ran: Yes`, batch 3
- Verified: 0 `sizes_*` columns remain on `media` table (live read-only query)
