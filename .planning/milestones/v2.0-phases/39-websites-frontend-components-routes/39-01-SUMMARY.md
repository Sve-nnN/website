---
phase: 39-websites-frontend-components-routes
plan: 01
subsystem: ui
tags: [nextjs, react, payload, breadcrumbs, sitemap]

# Dependency graph
requires:
  - phase: 38-websites-schema-collection-design
    provides: Websites collection schema, generated Website/Cliente payload-types
provides:
  - WebsiteCard component (client/title/industry/lighthouse-performance card, structural clone of CaseStudyCard)
  - buildWebsitesTrail() breadcrumb helper (sibling to buildCaseStudiesTrail, shares buildSectionTrail)
  - websites entry in sitemap-data.ts (SITEMAP_COLLECTIONS, SitemapEntry group, SITEMAP_GROUP_LABELS)
affects: [39-02, 39-03, 39-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WebsiteCard mirrors CaseStudyCard's exact field-mapping contract (client/title/industry/heroMetric-equivalent)"
    - "buildWebsitesTrail is a thin wrapper over buildSectionTrail, matching the existing Section-union extension pattern"
    - "sitemap-data.ts extended purely via union types + array entry — zero new URL-branching logic"

key-files:
  created: [src/components/WebsiteCard.tsx]
  modified: [src/lib/breadcrumbs.ts, src/lib/sitemap-data.ts]

key-decisions:
  - "WebsiteCard uses website.lighthouse?.performance != null (not truthy) so a real 0 score still renders, matching CaseStudyCard's null-hide semantics for heroMetric"
  - "Websites section segment kept 'websites' in both es/en (same precedent as case-studies — no locale-prefixed segment)"

patterns-established:
  - "Section-union extension pattern: add to Section type, SECTION_LABELS, SECTION_SEGMENTS, then export a thin buildXTrail() wrapper"

requirements-completed: [WEB-06, WEB-09, WEB-11]

# Metrics
duration: 8min
completed: 2026-07-14
---

# Phase 39 Plan 01: Websites Frontend Foundation Summary

**WebsiteCard component, buildWebsitesTrail() breadcrumb helper, and websites sitemap entry — the dependency-free foundation Plans 39-02/03/04 build on**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-14T16:47:00Z
- **Completed:** 2026-07-14T16:55:40Z
- **Tasks:** 3 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `WebsiteCard` component created as a structural clone of `CaseStudyCard`, rendering client label, title, industry subtitle, and conditional Lighthouse-performance metric
- `buildWebsitesTrail(locale, current?)` added to breadcrumbs.ts, producing 2-level index trail / 3-level detail trail identical in shape to `buildCaseStudiesTrail`
- `websites` collection entry added to sitemap-data.ts's generic `SITEMAP_COLLECTIONS` array — no special-case URL branching needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WebsiteCard component** - `8e278da` (feat)
2. **Task 2: Add buildWebsitesTrail() to breadcrumbs.ts** - `7475e17` (feat)
3. **Task 3: Add websites entry to sitemap-data.ts** - `be3b08c` (feat)

**Plan metadata:** (pending — see final commit below)

## Files Created/Modified
- `src/components/WebsiteCard.tsx` - New component rendering client/title/industry/lighthouse-performance for a Website doc
- `src/lib/breadcrumbs.ts` - Extended Section union/SECTION_LABELS/SECTION_SEGMENTS with 'websites'; added buildWebsitesTrail()
- `src/lib/sitemap-data.ts` - Extended SitemapCollection/SitemapEntry group unions with 'websites'; added websites entry to SITEMAP_COLLECTIONS and SITEMAP_GROUP_LABELS

## Decisions Made
- Followed the plan's exact field-mapping and null-check semantics (`!= null` for lighthouse.performance) — no deviation from interface spec.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `WebsiteCard`, `buildWebsitesTrail()`, and the `websites` sitemap entry are stable and ready for Plans 39-02 (Home curated block), 39-03, and 39-04 (listing/detail routes) to consume.
- No routes, blocks, or schema changes were made in this plan — purely foundational, dependency-free pieces per the plan's objective.

## Self-Check: PASSED

All claimed files and commits verified present on disk / in git log.

---
*Phase: 39-websites-frontend-components-routes*
*Completed: 2026-07-14*
