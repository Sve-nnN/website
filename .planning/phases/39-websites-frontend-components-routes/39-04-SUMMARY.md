---
phase: 39-websites-frontend-components-routes
plan: 04
subsystem: ui
tags: [nextjs, react, payload, jsonld, breadcrumbs, seo]

# Dependency graph
requires:
  - phase: 39-websites-frontend-components-routes
    provides: "WebsiteCard component and buildWebsitesTrail() breadcrumb helper (Plan 39-01)"
provides:
  - "/[locale]/websites listing route (WEB-09)"
  - "/[locale]/websites/[slug] detail route (WEB-09, WEB-10)"
  - "CreativeWork + BreadcrumbList JSON-LD on the detail page (WEB-10)"
affects: [40-websites-content-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Websites routes are structural clones of /case-studies routes, field-remapped per 39-UI-SPEC.md's mapping table"
    - "Sections with no field backing are omitted entirely, never rendered as empty placeholders"

key-files:
  created:
    - "src/app/(frontend)/[locale]/websites/page.tsx"
    - "src/app/(frontend)/[locale]/websites/[slug]/page.tsx"
  modified: []

key-decisions:
  - "Detail page hero stays text-only (no heroImage field on Websites) instead of faking a hero image band"
  - "Lighthouse score grid renders unconditionally (4 fixed cards) since lighthouse + lighthouseCapturedAt are guaranteed populated per Phase 38"
  - "JSON-LD uses '@type': 'CreativeWork' explicitly, never 'SoftwareApplication'"

patterns-established:
  - "CaseStudy-to-Websites route cloning pattern: copy structure verbatim, remap only fields present in the target collection, drop everything else"

requirements-completed: [WEB-09, WEB-10]

# Metrics
duration: 15min
completed: 2026-07-14
---

# Phase 39 Plan 04: Websites Public Routes Summary

**Two Next.js App Router pages (/[locale]/websites listing and /[locale]/websites/[slug] detail) cloned structurally from the existing Case Studies routes, with CreativeWork + BreadcrumbList JSON-LD on the detail page**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-14T17:02:39Z (approx, see git log for exact commit timestamps)
- **Completed:** 2026-07-14T17:20:00Z
- **Tasks:** 3
- **Files modified:** 2 (both created)

## Accomplishments
- `/[locale]/websites` listing page: WebsiteCard grid, breadcrumbs via `buildWebsitesTrail`, bilingual empty state, BreadcrumbList JSON-LD
- `/[locale]/websites/[slug]` detail page: hero (client/industry/year chips + title + role, no fake hero image), 4 fixed Lighthouse score cards, Highlights, Challenges, Stack badges, Screenshots grid, optional related-case-study link
- Detail page JSON-LD emits `'@type': 'CreativeWork'` — confirmed no `'SoftwareApplication'` anywhere in the file
- All CaseStudy-only sections (clientContext, solution, testimonialSection, results, conclusion, author) correctly omitted — no field backing on Websites

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the /[locale]/websites listing page** - `bb22754` (feat)
2. **Task 2: Create the detail page — data, hero, Lighthouse grid, Highlights/Challenges** - `58019da` (feat)
3. **Task 3: Complete the detail page — Stack, Screenshots, related link, JSON-LD** - `6a3bc18` (feat)

_Note: Task 2 intentionally left the JSX file unclosed (Container/main open) per plan instruction, to be completed by Task 3 in the same file — this is why Task 2's commit alone would not pass `tsc`; `tsc` was only required to pass after Task 3._

## Files Created/Modified
- `src/app/(frontend)/[locale]/websites/page.tsx` - Websites listing route, structural clone of `/case-studies/page.tsx`
- `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` - Websites detail route with CreativeWork JSON-LD, structural clone of `/case-studies/[slug]/page.tsx`

## Decisions Made
- Followed the plan's CaseStudy-to-Websites field mapping table exactly (see 39-04-PLAN.md Interfaces section) — no deviations from the specified remap/drop/replace/new decisions per section.
- Screenshots use a `relative aspect-video` wrapper per the codebase's established `next/image fill` responsive pattern (matches the plan's explicit instruction).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- During Task 1 verification, `npx tsc --noEmit` reported pre-existing errors in `src/blocks/ArchiveBlock/Component.tsx` and `src/blocks/FeaturedWebsitesBlock/Component.tsx` — these belong to the concurrently-executing plans 39-02 and 39-03 (in-progress at the time), not to this plan's files. Confirmed via `grep` that no errors referenced the websites route files. By Task 3's verification, those concurrent plans had completed and `tsc --noEmit` passed cleanly with zero errors across the whole project.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both Websites public routes are live and ready to render real content once Phase 40 (Websites content migration) populates the `websites` collection.
- Empty state on `/[locale]/websites` will render correctly until then (bilingual "Coming soon" / "Próximamente" copy).
- No blockers.

---
*Phase: 39-websites-frontend-components-routes*
*Completed: 2026-07-14*

## Self-Check: PASSED

- FOUND: src/app/(frontend)/[locale]/websites/page.tsx
- FOUND: src/app/(frontend)/[locale]/websites/[slug]/page.tsx
- FOUND: bb22754 (Task 1 commit)
- FOUND: 58019da (Task 2 commit)
- FOUND: 6a3bc18 (Task 3 commit)
