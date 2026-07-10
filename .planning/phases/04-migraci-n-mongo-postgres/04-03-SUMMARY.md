---
phase: 04-migraci-n-mongo-postgres
plan: 03
subsystem: migration-authors-categories
tags: [migration, authors, categories, postgres]
dependency-graph:
  requires: [media-remap]
  provides: [authors-remap, categories-remap]
  affects: [scripts/migrate/steps/04-posts.ts]
tech-stack:
  added: []
  patterns: ["upsert-by-slug to resolve Phase 2 seed-script slug collisions"]
key-files:
  created:
    - scripts/migrate/steps/02-authors-categories.ts
decisions:
  - "Upsert-by-slug (find then update-or-create) instead of blind create, because Phase 2's seed-phase2.ts already created placeholder docs with the identical real slugs (author 'juan-carlos-angulo', category 'seo')"
  - "Skip the locale='en' update call entirely when a category has zero English source content, to avoid tripping required-field validation on an explicit undefined write"
metrics:
  duration: "~15 min"
  completed: 2026-07-10
---

# Phase 4 Plan 03: Authors + Categories Migration Summary

Migrated the single real Author (Juan Carlos Angulo) and all 5 real Categories to the new Postgres backend, with verbatim slugs and the avatar resolved to its Cloudinary-migrated media doc.

## What Was Built

- `scripts/migrate/steps/02-authors-categories.ts` — migrates `authors.json` and `categories.json`, avatar remapped via `getMapping(table, 'media', ...)`, slugs verbatim, per-locale field population (es create, en update).

## Real Execution Result

1/1 authors and 5/5 categories migrated. Verified via direct Local API query (`payload.findByID`) that the author doc has real bilingual `jobTitle`/`bio`, the real Cloudinary-hosted avatar (`res.cloudinary.com/.../juan-angulo-portrait-1`), and slug `juan-carlos-angulo` verbatim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Slug unique-constraint collision with Phase 2's seed script**
- **Found during:** Task 1, first execution attempt
- **Issue:** `payload.create` failed with `ValidationError: field is invalid: slug`. Phase 2's `scripts/seed-phase2.ts` had already created a placeholder author with slug `juan-carlos-angulo` and a placeholder category with slug `seo`, to validate the i18n/SEO pipeline end to end — both slugs are identical to real production slugs in the source dump, since `seo`/`juan-carlos-angulo` are real, meaningful identifiers, not test-only strings.
- **Fix:** Changed the migration to upsert-by-slug: `payload.find({where:{slug:{equals:doc.slug}}})` first; if found, `payload.update` the existing doc with real data (overwriting the Phase 2 placeholder content in place); if not found, `payload.create` as before. Slug itself is never touched during the update path (already correct).
- **Files modified:** `scripts/migrate/steps/02-authors-categories.ts`
- **Commit:** 38f07fb

**2. [Rule 1 - Bug] Explicit `undefined` write to a required, localized field on categories with no English source content**
- **Found during:** Task 1, second execution attempt (after fix #1)
- **Issue:** `payload.update({locale:'en', data:{title: undefined, ...}})` failed with `ValidationError: field is invalid: Title` for categories that only ever had an `es` title in the old source (never localized). Payload's required-field validation for the `en` locale rejected the explicit `undefined`.
- **Fix:** Build the `en` update payload conditionally, only including `title`/`description` keys that actually have English source content; skip the `payload.update` call for `locale:'en'` entirely if there's nothing to write.
- **Files modified:** `scripts/migrate/steps/02-authors-categories.ts`
- **Commit:** 38f07fb

## Self-Check: PASSED

- FOUND: scripts/migrate/steps/02-authors-categories.ts
- FOUND commit 38f07fb
- Remap-table: authors 1/1, categories 5/5 (verified on disk, gitignored)
- Verified via direct Local API query: author doc has real bilingual content + remapped Cloudinary avatar + verbatim slug
