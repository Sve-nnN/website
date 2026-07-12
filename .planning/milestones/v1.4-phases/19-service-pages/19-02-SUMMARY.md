---
phase: 19-service-pages
plan: 02
subsystem: seo
tags: [nextjs, app-router, routing, dual-locale]

requires:
  - phase: 19-service-pages
    provides: services-data.ts query helpers (plan 19-01)
provides:
  - 4 route files serving the services index + individual landings at dual URL segments (/services + /servicios, index + [slug])
affects: [19-05]

tech-stack:
  added: []
  patterns:
    - "Dual-segment route pattern: two thin route files (services/, servicios/) sharing the same lib-backed logic, both functional under either locale since next-intl has no pathnames config in this project"

key-files:
  created:
    - "src/app/(frontend)/[locale]/services/page.tsx"
    - "src/app/(frontend)/[locale]/servicios/page.tsx"
    - "src/app/(frontend)/[locale]/services/[slug]/page.tsx"
    - "src/app/(frontend)/[locale]/servicios/[slug]/page.tsx"
  modified: []

key-decisions:
  - "No manual <h1> in any of the 4 route files — the seeded Hero block (added in 19-05) owns the real H1, per the one-H1-per-page discipline established in Phase 18"
  - "[slug] routes delegate all slug validation to getServicePage's internal isServiceSlug allowlist — no duplicate guard logic in the route files themselves"

patterns-established: []

requirements-completed: [SEO-SVC-01, SEO-SVC-02, SEO-SVC-03]

duration: unknown
completed: 2026-07-12
---

# Phase 19 Plan 02: Dual-locale service routes

**4 thin route files make the services index and individual service landings reachable at /services, /servicios, /services/[slug], /servicios/[slug], all functional under either locale.**

## Performance
- **Tasks:** 2 completed (index routes, [slug] routes)
- **Files created:** 4

## Accomplishments
- Index routes (`services/page.tsx`, `servicios/page.tsx`) fetch via `getServicesIndexPage`, render via `RenderBlocks`, 404 cleanly via `notFound()` when the doc doesn't exist yet (expected until 19-05 seeds it).
- `[slug]` routes (`services/[slug]/page.tsx`, `servicios/[slug]/page.tsx`) fetch via `getServicePage`, which already guards against invalid slugs — routes only need to call `notFound()` on an `undefined` result, covering both "not a real service slug" and "not yet seeded" in one guard clause.
- No route introduces a manual `<h1>` — confirmed via grep, 0 matches across all 4 files.

## Task Commits
1. **Task 1: Index routes** — `9889dc7` (feat, bundled with Task 2)
2. **Task 2: Individual service routes** — `9889dc7` (feat)

## Files Created/Modified
- `src/app/(frontend)/[locale]/services/page.tsx`
- `src/app/(frontend)/[locale]/servicios/page.tsx`
- `src/app/(frontend)/[locale]/services/[slug]/page.tsx`
- `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx`

## Verification
- `npx tsc --noEmit` exit 0
- `grep -c "getServicesIndexPage\|getServicePage"` >= 1 in each respective file
- `grep -c "<h1"` = 0 in all 4 files
- Full production build (run later in 19-05) confirmed all 4 routes compile into the route manifest

## Deviations from Plan
None.

## Issues Encountered
None — routes correctly 404'd until 19-05 seeded real content, as anticipated by the plan.

## Next Phase Readiness
19-05's seed script targets exactly these 4 routes' data source (`pages` docs by the slugs defined in 19-01).

---
*Phase: 19-service-pages*
*Completed: 2026-07-12*
