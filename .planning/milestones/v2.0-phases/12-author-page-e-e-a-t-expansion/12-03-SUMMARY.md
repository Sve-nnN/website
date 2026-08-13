---
phase: 12-author-page-e-e-a-t-expansion
plan: 03
subsystem: content-seed
tags: [payload, seed-script, i18n, e-e-a-t]
requires:
  - "12-01 (Authors collection expertise/education/experience fields)"
provides:
  - Real Author (slug juan-carlos-angulo) populated with expertise(4)/education(2)/experience(2)/socialLinks(3), ES+EN
affects:
  - scripts/seed-author-eeat.ts
  - "authors collection data (Postgres, dev DB)"
tech-stack:
  added: []
  patterns:
    - "sub-array id reuse across locale writes (es first, then en) to avoid duplicating localized array rows in Postgres, same pattern as seed-phase10-7-gap-fill.ts"
    - "idempotent socialLinks write: no-op if matching, skip+warn if existing values differ, write only if empty"
key-files:
  created:
    - scripts/seed-author-eeat.ts
decisions:
  - "description sub-field left unassigned on all 6 education/experience items — no real description text available in source; field remains admin-editable"
metrics:
  duration: "~10 min"
  completed: 2026-07-11
---

# Phase 12 Plan 03: Author E-E-A-T Content Seed Summary

Created and ran `scripts/seed-author-eeat.ts`, populating the real Author (`slug: juan-carlos-angulo`) with `expertise[]` (4), `education[]` (2), `experience[]` (2), and `socialLinks[]` (3) in both ES and EN, per the real content specified in 12-CONTEXT.md `<specifics>`.

## What Was Built

**Task 1 — `scripts/seed-author-eeat.ts`**: idempotent Local API script following the `seed-phase10-7-gap-fill.ts` pattern (`getPayload`/`config` import, `LOCALES = ['es', 'en']`). Contains `verifyAvatar` (read-only, logs the Cloudinary avatar URL, never re-uploads), `seedExpertise`/`seedEducation`/`seedExperience` (each looping ES then EN, reusing sub-array `id`s from the first pass to avoid Postgres row duplication), and `seedSocialLinks` (non-localized, single write, only if the array is empty — warns and skips if differing real values already exist).

**Task 2 — executed against dev DB**: ran via `node --env-file=.env node_modules/.bin/tsx scripts/seed-author-eeat.ts`. Output confirmed:
- Avatar found and untouched: `portfolio/juan-angulo-portrait` (id=15), Cloudinary URL logged, no re-upload.
- 4 expertise / 2 education / 2 experience items written for both `es` and `en`, with distinct localized text confirmed by direct `findByID` verification (e.g. ES "SEO Técnico Avanzado..." vs EN "Advanced Technical SEO..."; ES "Ingeniero de software" vs EN "Software Engineering"; ES "Especialista en Tech SEO" vs EN "Technical SEO Specialist").
- 3 socialLinks written (linkedin/github/website).
- Re-ran the script a second time to confirm idempotency: expertise/education/experience counts stayed at 4/2/2 (no duplication via id reuse), socialLinks reported "ya coinciden — no-op".

## Deviations from Plan

None — plan executed exactly as written. `description` sub-field intentionally left unset on all 6 education/experience items (no real description text available in source data), as explicitly called out by the plan.

## Self-Check: PASSED

- FOUND: scripts/seed-author-eeat.ts
- FOUND commit 933b438 (Task 1: seed script)
- Task 2 (script execution) produced no additional file changes to commit — verified via idempotent re-run against the dev DB, both runs exit 0.
