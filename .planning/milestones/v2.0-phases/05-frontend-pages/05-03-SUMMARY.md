---
phase: 05-frontend-pages
plan: 03
subsystem: database
tags: [payload, blocks, postgres, migration]

requires:
  - phase: 05-02
    provides: FeaturedContent global + Clientes relationship target these blocks read from
provides:
  - FeaturedPostsBlock, FeaturedCaseStudiesBlock, ClientLogosBlock configs
  - ArchiveBlock enableCategoryFilter conditional field
  - Pages collection registering all 16 blocks
  - Applied migration against real Neon Postgres
affects: [05-04, 05-05, 05-06, 05-07, 05-09]

tech-stack:
  added: []
  patterns:
    - "Featured*Block configs are intentionally thin (title+limit only) — curated doc lists come from FeaturedContent global at render time, never duplicated onto the block itself"
    - "ArchiveBlock extended with a sibling conditional field (enableCategoryFilter) rather than spawning a new block slug, per its own established precedent"

key-files:
  created:
    - src/blocks/FeaturedPostsBlock/config.ts
    - src/blocks/FeaturedCaseStudiesBlock/config.ts
    - src/blocks/ClientLogosBlock/config.ts
    - src/migrations/20260710_040718_phase5_new_blocks_and_category_filter.ts
  modified:
    - src/blocks/ArchiveBlock/config.ts
    - src/collections/Pages/index.ts

key-decisions:
  - "No selectedDocs field added to Featured*Block configs to avoid two competing curation mechanisms (global vs per-block), per interface guidance in the plan"

patterns-established: []

requirements-completed: [CONT-01, CONT-03]

duration: 15min
completed: 2026-07-09
---

# Phase 5 Plan 03: New Blocks + ArchiveBlock Category Filter Summary

**FeaturedPostsBlock/FeaturedCaseStudiesBlock/ClientLogosBlock configs plus an ArchiveBlock category-filter toggle, registered on Pages (16 blocks total) and migrated against real Neon Postgres.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments
- Added `FeaturedPostsBlock`/`FeaturedCaseStudiesBlock` (title+limit, reading curated docs from the `FeaturedContent` global at render time)
- Added `ClientLogosBlock` (title + optional `clients` relationship, self-contained curation surface)
- Extended `ArchiveBlock` with `enableCategoryFilter` (conditioned on `relationTo === 'posts'`), honoring the block's own "never spawn a new slug" precedent
- Registered all 3 new blocks on `Pages` (13 → 16 blocks)
- Generated and applied migration against the real Neon Postgres

## Task Commits

1. **Task 1: 3 new block configs + ArchiveBlock extension** - `902e0f9` (feat)
2. **Task 2: Register blocks on Pages + migration** - `690c53b` (feat)

## Files Created/Modified
- `src/blocks/FeaturedPostsBlock/config.ts`, `src/blocks/FeaturedCaseStudiesBlock/config.ts`, `src/blocks/ClientLogosBlock/config.ts` - new block configs
- `src/blocks/ArchiveBlock/config.ts` - added `enableCategoryFilter` checkbox
- `src/collections/Pages/index.ts` - registered 3 new blocks
- `src/migrations/20260710_040718_phase5_new_blocks_and_category_filter.ts` - schema migration, applied

## Decisions Made
None beyond what the plan specified - followed the interface guidance exactly (no per-block selectedDocs field on Featured*Block).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All Payload block contracts named in the UI-SPEC Page Inventory now exist. Wave 3 (RenderBlocks registry + renderers) can now build renderers for all 16 blocks, and Wave 4 page plans can compose Home/Blog listing layouts using these new blocks.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
