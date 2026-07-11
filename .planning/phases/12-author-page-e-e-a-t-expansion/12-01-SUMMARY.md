---
phase: 12-author-page-e-e-a-t-expansion
plan: 01
subsystem: data-schema
tags: [payload, postgres, migration, authors]
requires: []
provides:
  - Authors collection with expertise[]/education[]/experience[] fields
  - Postgres migration for the new columns
  - Regenerated payload-types.ts with Author.expertise/education/experience
affects:
  - src/collections/Authors/index.ts
  - src/migrations/index.ts
  - src/payload-types.ts
tech-stack:
  added: []
  patterns:
    - "array field with localized sub-fields (topic/degree/institution/company/role), matching the existing credentials[] pattern"
    - "payload migrate:create -> payload migrate -> payload generate:types sequence, push:false respected throughout"
key-files:
  created:
    - src/migrations/20260711_201023_phase12_author_eeat_fields.ts
    - src/migrations/20260711_201023_phase12_author_eeat_fields.json
  modified:
    - src/collections/Authors/index.ts
    - src/migrations/index.ts
    - src/payload-types.ts
decisions:
  - "certificate upload field from the JuanPortfolio analog's education[] was NOT ported, per CONTEXT.md — no real certificate files available"
metrics:
  duration: "~15 min"
  completed: 2026-07-11
---

# Phase 12 Plan 01: Author Schema Recovery Summary

Recovers `expertise[]`, `education[]`, `experience[]` array fields on the `Authors` collection (trimmed intentionally in Phase 1), backed by a generated-and-applied Postgres migration with `push:false` respected throughout, and regenerated `payload-types.ts`.

## What Was Built

**Task 1 — Authors collection fields** (`src/collections/Authors/index.ts`):
- `expertise[]`: single localized `topic` text field, required — renders as Badge tags on the author page.
- `education[]`: `degree`/`institution` (localized text, required), `logo` (optional upload -> media), `startDate`/`endDate` (date, monthOnly picker), `description` (localized textarea, optional).
- `experience[]`: `company`/`role` (localized text, required), `startDate`/`endDate` (date, monthOnly picker), `description` (localized textarea, optional).
- All 3 fields inserted between `credentials` and `yearsExperience`, grouping the E-E-A-T fields together as specified.
- `certificate` upload was explicitly NOT ported (CONTEXT.md decision — no real certificate files available).
- Collection header comment updated to reflect the Phase 12 field recovery, preserving the Phase 1 historical context for the fields that remain unchanged.

**Task 2 — Migration + types**:
- `payload migrate:create phase12_author_eeat_fields` generated `src/migrations/20260711_201023_phase12_author_eeat_fields.ts` (+ `.json`), auto-registered in `src/migrations/index.ts`.
- Applied against the dev Postgres database with `payload migrate` — no `push: true` used anywhere; `payload.config.ts`'s `push: false` was left untouched.
- `payload generate:types` regenerated `src/payload-types.ts`; the `Author` interface now includes `expertise`, `education`, and `experience` with the expected shape (arrays of objects, `logo` typed as an optional relation to `Media`, dates as `string | null`).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/collections/Authors/index.ts
- FOUND: src/migrations/20260711_201023_phase12_author_eeat_fields.ts
- FOUND commit e9b215d (Task 1: collection fields)
- FOUND commit c3c688f (Task 2: migration + types)
