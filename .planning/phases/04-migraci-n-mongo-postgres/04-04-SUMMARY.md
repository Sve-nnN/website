---
phase: 04-migraci-n-mongo-postgres
plan: 04
subsystem: migration-testimonials-clientes
tags: [migration, testimonials, clientes, postgres]
dependency-graph:
  requires: [media-remap]
  provides: [testimonials-remap, clientes-remap]
  affects: []
tech-stack:
  added: []
  patterns: ["localizedOrPlain helper for fields that turned out unlocalized in source data"]
key-files:
  created:
    - scripts/migrate/steps/03-testimonials-clientes.ts
decisions:
  - "Source testimonial fields (author/role/company/testimonial) were stored as plain strings, not the {es,en} shape the plan assumed -- added a shared helper handling both shapes rather than hardcoding one"
  - "Explicit '(sin especificar)' placeholder + needsReview log for any missing required role/company/testimonial text -- never invented, never silently dropped"
metrics:
  duration: "~10 min"
  completed: 2026-07-10
---

# Phase 4 Plan 04: Testimonials + Clientes Migration Summary

Migrated the single real Testimonial and all 6 real Clientes to the new Postgres backend, applying the new schema's stricter required-field rules explicitly (placeholder + needsReview log, never invented data).

## What Was Built

- `scripts/migrate/steps/03-testimonials-clientes.ts` — migrates `testimonials.json`/`clientes.json` with logo/avatar remapped via the media remap-table.

## Real Execution Result

1/1 testimonials and 6/6 clientes migrated, all with real Cloudinary-hosted logo/avatar URLs. `needsReview` came back empty — the one real testimonial and all 6 real clientes had complete required data in the source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Old source data for testimonials was stored as plain strings, not `{es,en}`**
- **Found during:** Task 1, first execution attempt
- **Issue:** `payload.create` failed with `ValidationError: field is invalid: Testimonial`. The plan's field_mapping assumed `role`/`company`/`testimonial` were all localized `{es,en}` objects in the dump (matching the old collection's `localized: true` field config), but the real dumped data for the one testimonial in production was plain strings (e.g. `"testimonial": "Trabajar con Juan fue lo mejor"`, not `{es: "..."}`)
- **Fix:** Added a `localizedOrPlain(value, locale)` helper that returns the value directly when it's a plain string (same value for both es/en) or extracts the per-locale key when it's an object. Applied consistently to `role`, `company`, and `testimonial` (the plan only anticipated needing this for role/company).
- **Files modified:** `scripts/migrate/steps/03-testimonials-clientes.ts`
- **Commit:** b7ddfbf

## Self-Check: PASSED

- FOUND: scripts/migrate/steps/03-testimonials-clientes.ts
- FOUND commit b7ddfbf
- Remap-table: testimonials 1/1, clientes 6/6 (verified on disk, gitignored)
- needsReview: empty (no missing required data found in the real source)
