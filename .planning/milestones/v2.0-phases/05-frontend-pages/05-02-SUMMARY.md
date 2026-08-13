---
phase: 05-frontend-pages
plan: 02
subsystem: database
tags: [payload, postgres, globals, e-e-a-t, migration]

requires:
  - phase: 05-01
    provides: nothing structural (parallel wave-1 plan, no code dependency)
provides:
  - Header/Footer/FeaturedContent globals (site chrome + curation mechanism)
  - Authors E-E-A-T fields (credentials, yearsExperience, socialLinks)
  - Applied migration against real Neon Postgres
  - Confirmed-clean database (no Phase 1/2 test fixtures)
affects: [05-04, 05-05, 05-06, 05-07, 05-08, 05-09, 05-10]

tech-stack:
  added: []
  patterns:
    - "Globals follow the existing Llms global shape (GlobalConfig, admin.group: 'Site')"
    - "Nav/footer links reuse the existing link()/linkGroup() field factories instead of hand-rolled href/label pairs"
    - "Guarded fixture-cleanup scripts verify id+field match before delete, never blanket delete by id"

key-files:
  created:
    - src/globals/Header/index.ts
    - src/globals/Footer/index.ts
    - src/globals/FeaturedContent/index.ts
    - src/migrations/20260710_040235_phase5_header_footer_featured_authors.ts
    - scripts/cleanup-phase1-fixtures.ts
  modified:
    - src/collections/Authors/index.ts
    - src/payload.config.ts

key-decisions:
  - "Task 3 fixture cleanup was a no-op: Juan had already manually deleted the 4 known Phase 1/2 fixtures before Phase 5 planning began. The guarded script was still written (required artifact) and run to confirm 0 remain and it's idempotent."

patterns-established:
  - "FeaturedContent global is the single source of truth for 'featured' curation across Home + Blog — later plans must read from here, not derive from recency"

requirements-completed: [CONT-01, CONT-02]

duration: 20min
completed: 2026-07-09
---

# Phase 5 Plan 02: Site Globals + Authors E-E-A-T Expansion Summary

**Header/Footer/FeaturedContent globals plus Authors credentials/yearsExperience/socialLinks fields, migrated against the real Neon Postgres, with confirmed-clean fixture state.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3 completed
- **Files modified:** 9

## Accomplishments
- Added `Header` global (logo, navItems via reused `link()` field, ctaButton with UI-SPEC default copy)
- Added `Footer` global (columns, socialLinks, legalLinks, copyrightText)
- Added `FeaturedContent` global as the manual curation mechanism for featured posts/case studies (CONTEXT.md's explicit requirement — not recency-derived)
- Expanded `Authors` with `credentials` (array), `yearsExperience` (number), `socialLinks` (array) without touching existing migrated field names
- Generated and applied a migration against the real Neon Postgres database
- Confirmed the real database is already clean of the 4 known Phase 1/2 test fixtures (Juan removed them manually before Phase 5 planning)

## Task Commits

1. **Task 1: Header, Footer, FeaturedContent globals + config registration** - `178ea6b` (feat)
2. **Task 2: Authors E-E-A-T expansion + migration** - `643405f` (feat)
3. **Task 3: Cleanup script for Phase 1/2 test fixtures** - `4187cb8` (feat)

## Files Created/Modified
- `src/globals/Header/index.ts`, `src/globals/Footer/index.ts`, `src/globals/FeaturedContent/index.ts` - new globals
- `src/payload.config.ts` - registered all 3 globals
- `src/collections/Authors/index.ts` - added credentials/yearsExperience/socialLinks
- `src/migrations/20260710_040235_phase5_header_footer_featured_authors.ts` - schema migration, applied
- `scripts/cleanup-phase1-fixtures.ts` - guarded one-off cleanup script

## Decisions Made
- Task 3 was executed as a verification-only run since Juan had already manually removed the fixtures; the script itself was still written per the plan's required artifact and confirmed idempotent (0 deleted, 4 skipped as "not found")

## Deviations from Plan

None - plan executed exactly as written, aside from Task 3 being a confirmed no-op per Juan's prior manual cleanup (expected per orchestrator instructions, not a deviation).

## Issues Encountered
- `npx tsx scripts/cleanup-phase1-fixtures.ts` initially failed with "missing secret key" because `tsx` doesn't auto-load `.env`. Resolved with `node --env-file=.env node_modules/.bin/tsx scripts/cleanup-phase1-fixtures.ts`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Header/Footer/FeaturedContent globals and Authors E-E-A-T fields are live in the real database, ready for Wave 3 (SiteHeader/SiteFooter, AuthorByline/AuthorCard components) and Wave 4 (page plans) to consume.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
