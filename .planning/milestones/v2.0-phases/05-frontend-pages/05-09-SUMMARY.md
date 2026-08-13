---
phase: 05-frontend-pages
plan: 09
subsystem: database
tags: [payload, case-studies, e-e-a-t, empty-state]

requires:
  - phase: 05-04
    provides: RichTextRenderer
  - phase: 05-05
    provides: AuthorByline/AuthorCard, getFallbackHeroImage
provides:
  - /case-studies listing page (grid or empty state)
  - Full case study detail page (KPIs, structured sections, author byline)
  - CaseStudies.author relationship (previously missing)
affects: [05-13]

tech-stack:
  added: []
  patterns:
    - "Empty states (0 real case studies today) render explicit localized copy, never a blank div or crash — same principle as the blog listing's empty state (05-07)"

key-files:
  created:
    - src/app/(frontend)/[locale]/case-studies/page.tsx
    - scripts/backfill-case-study-author.ts
  modified:
    - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
    - src/collections/CaseStudies/index.ts

key-decisions:
  - "Added CaseStudies.author (relationship->authors, optional) directly rather than emitting a checkpoint:decision — the plan itself recommended adding it inline as a data-model gap fix, and Phase 4 confirms exactly 1 real author exists to backfill against"

patterns-established: []

requirements-completed: [CONT-01, CONT-02]

duration: 30min
completed: 2026-07-09
---

# Phase 5 Plan 09: Case Studies Listing + Detail Summary

**Case studies listing (grid or localized empty state) and a full structured detail page (KPIs, El cliente/reto/solución, before-after results, author E-E-A-T byline), with the previously-missing CaseStudies.author relationship added and backfilled.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments
- Built `/case-studies` listing: card grid or a localized "coming soon" empty state (verified against the real 0-row table)
- Discovered `CaseStudies` had no `author` relationship — added it, generated + applied a migration, and wrote an idempotent backfill script (verified as a correct no-op against 0 real case studies)
- Rewrote the case study detail page to render the full structured model: hero (with fallback image), 4-6 KPI cards, clientContext ("El cliente"), challenge list ("El reto"), numbered solution steps ("La solución"), before/after results table with accent-colored deltas ("Resultados"), conclusion, and the author E-E-A-T byline/card
- Verified end-to-end against a real running server: empty-state copy renders in both locales, unknown detail slugs return a real 404

## Task Commits

1. **Task 1: Case studies listing page** - `5abf558` (feat)
2. **Task 2: Full detail page + author relationship** - `466c48b` (feat)

## Files Created/Modified
- `src/app/(frontend)/[locale]/case-studies/page.tsx` - new listing route
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` - full structured detail rewrite
- `src/collections/CaseStudies/index.ts` - added `author` relationship
- `scripts/backfill-case-study-author.ts` - idempotent backfill

## Decisions Made
- Added the missing `author` field directly (not a `checkpoint:decision`) since the plan itself named this the recommended resolution and the backfill target (single real Author doc) was unambiguous

## Deviations from Plan
None beyond the plan's own anticipated `author`-field gap, which was resolved exactly as the plan specified.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Case studies pages are ready to receive real content once Juan authors case studies post-launch; the empty state is intentional and correct until then. 05-13's bilingual QA can verify both the empty state and (once seeded) a populated detail page.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-09*

## Self-Check: PASSED
