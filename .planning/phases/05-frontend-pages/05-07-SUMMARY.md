---
phase: 05-frontend-pages
plan: 07
subsystem: ui
tags: [payload-blocks, blog-listing, category-filter, seed-script]

requires:
  - phase: 05-04
    provides: RenderBlocks, ArchiveBlock renderer
  - phase: 05-05
    provides: SiteHeader/SiteFooter
provides:
  - /blog listing route
  - RenderBlocks sharedProps mechanism
  - ArchiveBlock empty-state copy + garbage-category rejection
  - Seeded real blog Pages doc
affects: [05-13]

tech-stack:
  added: []
  patterns:
    - "RenderBlocks now accepts an optional sharedProps object merged into every block's props, letting page components forward request-level context (search params, current-post context) without RenderBlocks needing per-block awareness"

key-files:
  created:
    - src/app/(frontend)/[locale]/blog/page.tsx
    - scripts/seed-blog-page.ts
  modified:
    - src/blocks/RenderBlocks.tsx
    - src/blocks/ArchiveBlock/config.ts
    - src/blocks/ArchiveBlock/Component.tsx

key-decisions:
  - "An activeCategory that doesn't match any real fetched category now resolves to zero results (empty state), not a silent fallback to unfiltered posts — verified against a real running server"

patterns-established:
  - "RenderBlocks sharedProps is the mechanism for forwarding page-level context into blocks — future pages (05-08's RelatedPosts context) should reuse this instead of inventing another prop-drilling path"

requirements-completed: [CONT-01, CONT-03]

duration: 30min
completed: 2026-07-09
---

# Phase 5 Plan 07: Blog Listing Summary

**/blog listing route with a featured-posts section above a category-filterable chronological grid, verified against a real running server for both the empty state and real category filtering.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments
- Built `/blog` route rendering the seeded `blog` Pages doc via `RenderBlocks`
- Extended `RenderBlocks` with a `sharedProps` mechanism to forward `?category=` into the `ArchiveBlock` renderer without client-component boundaries
- Discovered during verification that 05-04's `ArchiveBlock` renderer had no empty-state copy at all — added `emptyStateHeading`/`emptyStateBody` fields (UI-SPEC Copywriting Contract defaults) plus render logic
- Fixed an edge case: an unmatched `?category=` value previously fell through to an unfiltered "all posts" query instead of showing 0 results — now correctly resolves to the empty state
- Verified end-to-end against a real running server: garbage category → "Nothing here yet"; real category (`tech-seo`) → filtered grid, no errors

## Task Commits

1. **Task 1: /blog route + RenderBlocks sharedProps + ArchiveBlock empty-state fix** - `12f54c0` (feat)
2. **Task 2: Seed blog Pages doc, verify behavior** - `edf7a9a` (feat)

## Files Created/Modified
- `src/app/(frontend)/[locale]/blog/page.tsx` - new listing route
- `scripts/seed-blog-page.ts` - idempotent seed script
- `src/blocks/RenderBlocks.tsx` - added `sharedProps`
- `src/blocks/ArchiveBlock/config.ts`, `src/blocks/ArchiveBlock/Component.tsx` - empty-state fields + garbage-category rejection

## Decisions Made
- Garbage/unmatched category values resolve to an impossible filter (0 results) rather than being silently ignored, so the empty state correctly communicates "no matches" instead of misleadingly showing all posts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] ArchiveBlock had no empty-state copy**
- **Found during:** Task 2 verification (per the plan's own interface note anticipating this gap)
- **Issue:** 05-04's `ArchiveBlock` renderer rendered nothing when `docs.length === 0` — no UI-SPEC-mandated empty-state heading/body
- **Fix:** Added `emptyStateHeading`/`emptyStateBody` localized fields to the block config (editable defaults, not hardcoded) and render logic in the component
- **Files modified:** src/blocks/ArchiveBlock/config.ts, src/blocks/ArchiveBlock/Component.tsx
- **Committed in:** 12f54c0

**2. [Rule 1 - Bug] Unmatched category param silently fell back to unfiltered query**
- **Found during:** Task 2 verification
- **Issue:** When `?category=` didn't match any real category, `categoryFilter` stayed `undefined`, so the query ran without a `where` clause — showing all posts instead of 0 results, misleading the visitor
- **Fix:** Unmatched category now sets `categoryFilter = -1` (an impossible id), guaranteeing zero results
- **Files modified:** src/blocks/ArchiveBlock/Component.tsx
- **Committed in:** 12f54c0

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both were necessary for the blog listing's must-have "empty state, not blank page or crash" requirement. No scope creep — required a schema migration for the new fields, applied cleanly against real Neon Postgres.

## Issues Encountered
None beyond the deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
`/blog` is real and verified end-to-end. 05-08 (blog post detail) can reuse the `RenderBlocks` `sharedProps` pattern for `RelatedPosts`' current-post context.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
