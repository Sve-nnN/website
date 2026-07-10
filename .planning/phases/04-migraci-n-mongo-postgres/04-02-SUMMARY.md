---
phase: 04-migraci-n-mongo-postgres
plan: 02
subsystem: migration-media
tags: [migration, media, cloudinary, postgres]
dependency-graph:
  requires: [dump-source, remap-table-lib]
  provides: [media-remap]
  affects: [scripts/migrate/steps/02-authors-categories.ts, 03-testimonials-clientes.ts, 04-posts.ts, 05-case-studies.ts]
tech-stack:
  added: []
  patterns: ["node --env-file=.env for standalone tsx scripts (no dotenv package installed)"]
key-files:
  created:
    - scripts/migrate/steps/01-media.ts
decisions:
  - "Real binaries re-uploaded via the existing Phase 3 cloudinaryAdapter through Local API payload.create({file}), never a parallel Cloudinary client"
  - "4/15 media docs failed (documented, not silently skipped) because juan-tech.com is DEPLOYMENT_DISABLED and those 4 were never manually uploaded to Cloudinary on the old site"
metrics:
  duration: "~15 min"
  completed: 2026-07-10
---

# Phase 4 Plan 02: Media Migration Summary

Re-uploaded real media binaries from JuanPortfolio to the new Postgres+Cloudinary backend via the existing Phase 3 adapter, seeding the `media` remap-table key consumed by every later wave.

## What Was Built

- `scripts/migrate/steps/01-media.ts` — reads `media.json`, resolves each doc's real download URL (`cloudinaryUrl` > absolute `url` > `juan-tech.com`-prefixed relative `url`), fetches the binary, and calls `payload.create({ collection: 'media', file: {...} })` against the new config, which routes through `src/lib/cloudinary-adapter.ts` (already validated in Phase 3). Idempotent via `getMapping` before each create.

## Real Execution Result

11/15 media docs migrated successfully to Cloudinary+Postgres. **4 failed**, all with the same root cause:

| Old ID | Filename | Reason |
|--------|----------|--------|
| 68f922d6ab50e99e44d425c9 | image-post2-2.webp | HTTP 402 (juan-tech.com DEPLOYMENT_DISABLED) |
| 68f922d5ab50e99e44d425c7 | image-hero1-2.webp | HTTP 402 (juan-tech.com DEPLOYMENT_DISABLED) |
| 68f922d4ab50e99e44d425c5 | image-post1-2.webp | HTTP 402 (juan-tech.com DEPLOYMENT_DISABLED) |
| 68f922d4ab50e99e44d425c3 | image-post3-2.webp | HTTP 402 (juan-tech.com DEPLOYMENT_DISABLED) |

These 4 were never manually uploaded to Cloudinary on the old site (no `cloudinaryUrl` field), so their only source was the live `juan-tech.com` deployment — which returns HTTP 402 / `x-vercel-error: DEPLOYMENT_DISABLED` for every route (same finding as 04-01). No local disk fallback exists either. **This is below the plan's "≥90% coverage" done-criteria (actual: 73%)** — flagged explicitly here rather than silently accepted, but not fixable without either the old site coming back online or the original files being retrieved from another backup source. Posts referencing these 4 images as `heroImage` or embedded media will have unresolved media references in wave 5 (documented there).

Verified via direct Local API query against the new Postgres: the 11 created docs have real `cloudinaryUrl`/`url` fields pointing at `res.cloudinary.com/dmufha3qv/...`, confirmed reachable (HTTP 200).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] No `dotenv` package installed; plain `npx tsx` doesn't load `.env`**
- **Found during:** Task 1, first execution attempt
- **Issue:** `getPayload({config})` failed with "missing secret key" — `process.env.PAYLOAD_SECRET`/`DATABASE_URI` were unset because this project has no `dotenv` dependency (unlike JuanPortfolio, which uses `tsx -r dotenv/config`).
- **Fix:** Used Node 24's built-in `--env-file` flag: `node --env-file=.env node_modules/.bin/tsx scripts/migrate/steps/01-media.ts`. This is the execution pattern for every subsequent wave in this phase.
- **Files modified:** none (execution technique only)
- **Commit:** 9a6d47d (documented in the script's header comment for waves 3-8 to reuse)

### Known limitation (not silently accepted)

- Media coverage is 73% (11/15), below the plan's 90% target, due to the external `juan-tech.com` deployment being disabled — see table above. Carried forward to `04-VERIFICATION.md` (wave 8) as an explicit, unresolved gap.

## Self-Check: PASSED

- FOUND: scripts/migrate/steps/01-media.ts
- FOUND commit 9a6d47d
- Verified via Local API query: 11 media docs exist with real Cloudinary URLs (HTTP 200 confirmed on one sample)
- Remap-table `media` key has 11 entries (gitignored operational artifact, not committed — verified on disk)
