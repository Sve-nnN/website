---
phase: 19-service-pages
plan: 01
subsystem: seo
tags: [payload-cms, nextjs, sitemap, lib-helpers, content-contracts]

requires:
  - phase: 18-seo-technical-fixes-metadata
    provides: one-H1-per-page discipline, plugin-seo already wired to 'pages' collection
provides:
  - Single source of truth for the 4 service slugs + index slug (src/lib/services-data.ts)
  - Local API query helpers with allowlist guard (getServicesIndexPage, getServicePage/isServiceSlug)
  - Content-authoring contracts (ServiceCopy/IndexPageCopy) for copy plans 19-03/19-04
  - Sitemap fix emitting correct /servicios(/slug) and /en/services(/slug) URLs for the 5 new pages
affects: [19-02, 19-03, 19-04, 19-05]

tech-stack:
  added: []
  patterns:
    - "Allowlist-before-query guard pattern (isServiceSlug run before any payload.find) to keep a dynamic [slug] route from ever probing arbitrary Pages docs by slug"

key-files:
  created:
    - src/lib/services-data.ts
    - scripts/seed-phase19-data/types.ts
  modified:
    - src/lib/sitemap-data.ts

key-decisions:
  - "Content-authoring types (types.ts) kept dependency-free from services-data.ts to avoid an import cycle between the two files created in this same plan"
  - "Sitemap fix special-cases only the 5 known service-page slugs inside the existing generic pages branch, leaving every other pages doc's URL computation byte-identical to before"

patterns-established:
  - "Allowlist-before-query guard for any future dynamic [slug] route added to this codebase"

requirements-completed: [SEO-SVC-01, SEO-SVC-02, SEO-SVC-03]

duration: unknown
completed: 2026-07-12
---

# Phase 19 Plan 01: Slug registry, content contracts, sitemap fix

**Foundation for Phase 19: a single source of truth for the 5 new service-page slugs, Local API query helpers with a security allowlist guard, the content-authoring type contracts downstream copy plans write against, and a sitemap fix so the new pages are listed under their real /servicios(/slug) and /en/services(/slug) routes.**

## Performance
- **Tasks:** 3 completed (content contracts, slug registry + query helpers, sitemap fix)
- **Files modified:** 3 (2 new, 1 modified)

## Accomplishments
- `src/lib/services-data.ts` exports `SERVICES_INDEX_SLUG`, `SERVICE_SLUGS` (4 slugs), `ServiceSlug` type, `isServiceSlug` guard, and `getServicesIndexPage`/`getServicePage` Local API helpers. `getServicePage` runs the allowlist check BEFORE any `payload.find` call (T-19-01 mitigation).
- `scripts/seed-phase19-data/types.ts` defines `ServiceCopy`/`IndexPageCopy`/`FaqItem`/`ProofLink` and their `Bilingual*` wrappers, consumed unchanged by plans 19-03/19-04/19-05.
- `src/lib/sitemap-data.ts` special-cases the 5 new `pages` docs to emit `/servicios(/slug)` (es) / `/en/services(/slug)` (en), with zero regression to any other collection or existing `pages` doc.

## Task Commits
1. **Task 1: Content-authoring contract** — `848157e` (feat, bundled with Tasks 2-3)
2. **Task 2: Slug registry + query helpers** — `848157e` (feat)
3. **Task 3: Sitemap path fix** — `848157e` (feat)

## Files Created/Modified
- `src/lib/services-data.ts` — slug registry, `isServiceSlug`, query helpers
- `scripts/seed-phase19-data/types.ts` — content-authoring contracts
- `src/lib/sitemap-data.ts` — special-cased path branching for the 5 new pages

## Verification
- `npx tsc --noEmit` exit 0
- `grep -c "SERVICE_SLUGS\|SERVICES_INDEX_SLUG\|isServiceSlug\|getServicePage\|getServicesIndexPage" src/lib/services-data.ts` >= 5
- `grep -rln "seo-technical-audit" src/ scripts/` confirmed single-source (only `services-data.ts` at this point in the phase)

## Deviations from Plan
None — followed plan as specified.

## Issues Encountered
None.

## Next Phase Readiness
19-02 (routes), 19-03/19-04 (copy), 19-05 (seed) all consumed this plan's exports unchanged.

---
*Phase: 19-service-pages*
*Completed: 2026-07-12*
