---
phase: 25-service-page-visual-polish
plan: 01
subsystem: testing
tags: [lighthouse, seo, json-ld, regression-baseline, ci-tooling]

# Dependency graph
requires:
  - phase: 22-breadcrumbs
    provides: buildTrail/buildBreadcrumbJsonLd — the BreadcrumbList JSON-LD this baseline snapshots
  - phase: 23-canonical-hreflang
    provides: buildServiceAlternates — canonical URL structure the 8 target URLs assume
provides:
  - Reusable H1+JSON-LD capture script (scripts/capture-service-page-snapshot.mjs), re-run verbatim in 25-05
  - Pre-change content baseline (25-baseline-content.json) for 8 service URLs
  - Pre-change Lighthouse mobile baseline (lh-phase25-baseline.json) for 8 service URLs, production build
affects: [25-02-service-landing-anatomy, 25-03-social-proof-case-study, 25-04-scope-card, 25-05-regression-diff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Regex-based H1/JSON-LD extraction (no new npm dependency, tolerant of nested tags) mirrors lighthouse-mobile.mjs's CLI arg-parsing style"
    - "Production-build Lighthouse capture pattern (PORT=N build -> start & -> lighthouse -> kill PID) reused verbatim from Phase 17"

key-files:
  created:
    - scripts/capture-service-page-snapshot.mjs
    - .planning/phases/25-service-page-visual-polish/25-baseline-content.json
    - .planning/phases/25-service-page-visual-polish/lh-phase25-baseline.json
  modified: []

key-decisions:
  - "Baseline captured against the dev server for content (H1/JSON-LD, which don't vary between dev/prod HTML) and against a production build for Lighthouise (perf scores are dev-mode-invalid per Phase 17 precedent)"

patterns-established:
  - "Pattern: baseline-then-diff regression gate for high-risk visual phases — capture script written once, re-run unmodified for the post-change comparison in a later plan"

requirements-completed: [SVCPOL-07, SVCPOL-08]

# Metrics
duration: 12min
completed: 2026-07-13
---

# Phase 25 Plan 01: Regression Baseline Capture Summary

**Pre-change H1/JSON-LD content snapshot and production-build Lighthouse mobile baseline captured for all 8 service-page URLs (4 slugs x 2 locales), gating Plans 25-02 through 25-04 from touching any landing before this exists.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-13T01:55:00Z
- **Completed:** 2026-07-13T02:07:18Z
- **Tasks:** 2 completed
- **Files modified:** 3 (1 new script, 2 new baseline JSON files)

## Accomplishments
- `scripts/capture-service-page-snapshot.mjs` written as a standalone, dependency-free ESM script that fetches the 8 canonical service URLs, extracts every `<h1>` and every `application/ld+json` block, and fails loudly (exit 1) if any URL 404s or has zero H1s
- `25-baseline-content.json` captured: 8/8 URLs, each with exactly 1 H1 and a `BreadcrumbList` JSON-LD entry — confirms Phase 22/23's breadcrumb + canonical work is intact going into this phase
- `lh-phase25-baseline.json` captured against a real local production build (`PORT=3026`, no dev-mode scores): 8/8 routes scored, zero errors, Performance 82-87, Accessibility 98, Best Practices 96, SEO 83 across all 8 URLs, CLS 0 everywhere, LCP ~3.4-3.5s, TBT 42-173ms

## Task Commits

Each task was committed atomically:

1. **Task 1: Capture H1 + JSON-LD content snapshot for all 8 URLs** - `0a29443` (feat)
2. **Task 2: Capture Lighthouse mobile baseline for all 8 URLs (production build)** - `7d676ba` (feat)

**Plan metadata:** (this commit, docs: complete plan — created by orchestrator, not this executor)

## Files Created/Modified
- `scripts/capture-service-page-snapshot.mjs` - Reusable H1/JSON-LD extraction script, re-run verbatim in 25-05 for the post-change diff
- `.planning/phases/25-service-page-visual-polish/25-baseline-content.json` - Per-URL H1 text/count + parsed JSON-LD blocks, pre-change
- `.planning/phases/25-service-page-visual-polish/lh-phase25-baseline.json` - Per-URL Lighthouse mobile scores (Performance/Accessibility/Best-Practices/SEO + LCP/CLS/TBT), pre-change

## Decisions Made
- Content snapshot run against the already-running `next dev` server (port 3000) rather than the production build — H1/JSON-LD markup does not vary between dev and prod rendering, and reusing the running dev server avoided an unnecessary extra build cycle for Task 1.
- Lighthouse baseline run against a dedicated production build on port 3026 (isolated from the dev server on 3000), following the Phase 17 pattern verbatim: build, background `next start`, run Lighthouse, kill the PID, confirm the port is clear afterward.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both baseline files are committed and ready for Plan 25-05 to diff against once Plans 25-02 through 25-04 have modified the service landings. The capture script is designed to be re-run with zero modification for that diff. No blockers for Plan 25-02 to proceed.

---
*Phase: 25-service-page-visual-polish*
*Completed: 2026-07-13*

## Self-Check: PASSED

All created files verified present on disk; both task commits (`0a29443`, `7d676ba`) verified present in git log.
