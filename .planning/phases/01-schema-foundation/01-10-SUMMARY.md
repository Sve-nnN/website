---
phase: 01-schema-foundation
plan: 10
subsystem: database-migration
tags: [postgres, neon, drizzle, payload-migrate, schema-push]
dependency-graph:
  requires: [01-09]
  provides: [live-neon-schema, initial-migration-file]
  affects: [src/migrations/20260709_191127_initial.ts, src/migrations/20260709_191127_initial.json, src/migrations/index.ts, Neon Postgres database]
tech-stack:
  added: []
  patterns:
    - "payload migrate:create / payload migrate as the sole sanctioned path for schema changes reaching Postgres — push:false hard-coded, no live-push ever used"
key-files:
  created:
    - src/migrations/20260709_191127_initial.ts
    - src/migrations/20260709_191127_initial.json
  modified:
    - src/migrations/index.ts
decisions:
  - ".env already had a valid Neon UNPOOLED DATABASE_URI (provisioned pre-planning) — Task 1 checkpoint resolved automatically via grep verification, no human interruption needed"
metrics:
  duration: 5 min
  completed: 2026-07-09
---

# Phase 1 Plan 10: Initial Migration Against Live Neon Postgres Summary

Generated the initial SQL migration from the completed 9-collection `payload.config.ts` via `payload migrate:create`, and applied it against the real Neon Postgres database via `payload migrate` — the first time this project touches a live database. `push: false` was never overridden; the migration file is the sole source of schema truth, committed to git.

## What Was Built

- **Task 1 (checkpoint, auto-resolved):** Verified `.env` already contained a `DATABASE_URI` (count 1) with zero `-pooler` occurrences in the hostname — confirms the UNPOOLED/direct Neon connection string was already provisioned correctly before this plan ran. No value was printed, logged, or asked of Juan; `.env` was left untouched.
- **Task 2:** Ran `CI=true PAYLOAD_MIGRATING=true npx payload migrate:create initial`, generating `src/migrations/20260709_191127_initial.ts` (+ matching `.json`) and updating `src/migrations/index.ts`. Then ran `npx payload migrate` to apply it against the live Neon database.

## Verification

- `git check-ignore .env` → exits 0 (confirmed gitignored).
- `ls src/migrations/*_initial.ts` → exactly one file.
- `grep -c "works\|ad_banners\|keyword_metrics\|page_metrics\|gsc_metrics\|broken_links" src/migrations/*_initial.ts` → 0 (no DROP-listed collections present).
- `grep -cE "case_studies|case-studies"` → 100 occurrences (present).
- `grep -cE "clientes"` → 11 occurrences (present).
- `npx payload migrate` completed cleanly: `Migrated: 20260709_191127_initial (1766ms)`.
- `npx payload migrate:status` → table shows `20260709_191127_initial | Batch 1 | Ran: Yes`.
- Full `CREATE TABLE` inventory confirms all 9 KEEP-list collections plus their block/version/rels sub-tables (`users`, `media`, `pages` + blocks, `posts`, `authors`, `categories`, `case_studies` + sub-tables, `testimonials`, `clientes`), plus Payload internals (`payload_migrations`, `payload_preferences`, `payload_locked_documents`, `payload_jobs`, `payload_kv`, `users_sessions`) and the `redirects` plugin table (from `redirectsPlugin` wired in `payload.config.ts`).
- `git status --short` after commit → clean working tree, no unintended deletions (`git diff --diff-filter=D HEAD~1 HEAD` empty).

## Deviations from Plan

None — plan executed exactly as written (per the revised version with the Task 1 pre-check for an already-valid `DATABASE_URI`).

## Known Stubs

None.

## Self-Check: PASSED

- `test -f src/migrations/20260709_191127_initial.ts` → FOUND
- `test -f src/migrations/20260709_191127_initial.json` → FOUND
- `test -f src/migrations/index.ts` → FOUND
- Commit `af212d4` (Task 2) → FOUND in `git log`
- `.env` diff after execution → unchanged (no modifications made)
