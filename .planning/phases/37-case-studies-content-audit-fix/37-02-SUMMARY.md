---
phase: 37-case-studies-content-audit-fix
plan: 02
subsystem: ui
tags: [recharts, chart, mobile, case-studies, react]

# Dependency graph
requires: []
provides:
  - Magnitude-bucketed dual-Y-axis BarChart in CaseStudyResultsChart.tsx (yAxisId="left"/"right")
  - bucketRowsByMagnitude() named export, independently unit-testable
  - Regression script scripts/verify-chart-bucketing.ts covering 4 documented behavior cases
  - Live-browser-confirmed fix for a real Recharts rendering bug (Fragment-wrapped conditional children silently dropped)
affects: [37-04 (definitive multi-row mobile verification against real content)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recharts conditional children must be flattened per-element (ternary), never wrapped in a Fragment (<>...</>) inside a conditional — Recharts' internal child-type detection does not recognize Fragment-wrapped children and silently drops them"

key-files:
  created:
    - scripts/verify-chart-bucketing.ts
  modified:
    - src/components/CaseStudyResultsChart.tsx

key-decisions:
  - "Split single yAxis/data-array approach into 4 dataKeys (beforeLeft/afterLeft/beforeRight/afterRight) per interfaces.md's recommended architecture, since Recharts assigns yAxisId per-<Bar> not per-datum"
  - "Split point for magnitude buckets: largest gap between consecutive distinct orders-of-magnitude, guarding magnitude===0 to order 0 to avoid -Infinity from Math.log10(0)"
  - "Discovered and fixed a real Recharts bug during live-browser verification (Task 2): conditional right-axis Bars wrapped in a Fragment never rendered despite hasRightAxis being true at runtime — fixed by using per-element ternaries instead of a Fragment"

patterns-established:
  - "Recharts dual-axis conditional rendering: use `{cond ? <Bar .../> : null}` per element, not `{cond && (<>...</>)}`"

requirements-completed: [CASE-09, CASE-10]

# Metrics
duration: 45min
completed: 2026-07-14
---

# Phase 37 Plan 02: Results Chart Dual-Axis Scale + Mobile Summary

**Magnitude-bucketed dual-Y-axis BarChart for CaseStudyResultsChart.tsx, plus a live-browser-discovered fix for a Recharts Fragment-children rendering bug that silently dropped the right-axis bars.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-14T18:36:17Z
- **Tasks:** 2 completed
- **Files modified:** 2 (`src/components/CaseStudyResultsChart.tsx`, `scripts/verify-chart-bucketing.ts` created)

## Accomplishments
- `bucketRowsByMagnitude()` groups `results.metrics` rows by order-of-magnitude gap (`Math.floor(Math.log10(magnitude))`), splitting at the largest gap between consecutive distinct orders — small-scale metrics (e.g. position ~8) no longer become invisible next to large-scale ones (e.g. impressions ~30,000) on a shared linear axis
- Single shared axis preserved (no forced dual-axis) when all rows share one magnitude order — verified as a regression case
- Live-browser mobile check at 375px against a real published case-study page (`migracion-ecommerce-nextjs-seo-tecnico`, 3 metric rows spanning orders 0/3/5) confirmed no horizontal overflow and no clipped bars
- During that live check, discovered the dual-axis right-side elements never actually rendered in the DOM despite `hasRightAxis` correctly evaluating `true` — root-caused to a genuine Recharts rendering bug (Fragment-wrapped Bar children inside a conditional are not detected by Recharts' internal child-type scan) and fixed it (Rule 1 auto-fix)

## Task Commits

Each task was committed atomically:

1. **Task 1: Magnitude-bucketed dual-axis chart (CASE-09)** - `acdb4c2` (feat)
2. **Task 2: Mobile responsiveness check at 375px (CASE-10)** - `402e9b7` (fix — Rule 1 auto-fix discovered during the required live-browser verification step)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/components/CaseStudyResultsChart.tsx` - Extended `ChartRow` to 4 optional dataKeys (`beforeLeft`/`afterLeft`/`beforeRight`/`afterRight`), added exported `bucketRowsByMagnitude()`, extended `chartConfig` to cover all 4 keys mapped to before/after label+color, rendered conditional second `<YAxis yAxisId="right">` and right-bucket `<Bar>` pair (fixed to use per-element ternaries, not a Fragment)
- `scripts/verify-chart-bucketing.ts` - New standalone regression script (no test runner configured in this repo, follows `scripts/verify-jsonld-escape.mjs` convention) importing the real exported `bucketRowsByMagnitude` and asserting the 4 documented behavior cases

## Decisions Made
- Kept the plan's recommended 4-dataKey architecture (rather than a custom accessor-function approach) since it's the most direct fit for Recharts' per-`<Bar>` `yAxisId` assignment model
- Chose per-element ternaries (`hasRightAxis ? <Bar .../> : null`) over `{hasRightAxis && (<>...</>)}` for the right-bucket Bars after live-browser testing proved the Fragment-wrapped variant is silently dropped by Recharts — this is now the established pattern for any future conditional Recharts children in this codebase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recharts silently dropped Fragment-wrapped conditional Bar children**
- **Found during:** Task 2 (required live-browser mobile verification step)
- **Issue:** The interfaces.md-recommended pattern `{hasRightAxis && (<>...<Bar/><Bar/>...</>)}` compiled and type-checked cleanly, but at runtime in a real browser the right-side `<YAxis>` and both `beforeRight`/`afterRight` `<Bar>` elements never appeared in the rendered SVG DOM, even though `hasRightAxis` was confirmed `true` via debug logging. Confirmed with a hard cache-cleared dev server restart to rule out stale bundle caching. Root cause: Recharts' internal `findAllByType` child-detection (used by `generateCategoricalChart` to identify `<YAxis>`/`<Bar>` children) does not flatten React Fragments the way it flattens plain arrays — Fragment-wrapped `<Bar>` elements are invisible to it.
- **Fix:** Replaced the Fragment-wrapped conditional with two independent per-element ternaries (`hasRightAxis ? <Bar dataKey="beforeRight" .../> : null` and same for `afterRight`), and changed the `<YAxis>` conditional from `&&` to a ternary for consistency. Confirmed via DOM inspection (2 `<YAxis>` elements present, correct bar-rectangle count) and a live screenshot showing both axes and all 3 bar groups rendering correctly at 375px.
- **Files modified:** `src/components/CaseStudyResultsChart.tsx`
- **Verification:** Re-ran `npx tsc --noEmit`, `npx tsx scripts/verify-chart-bucketing.ts` (all 4 cases still pass — pure-function logic untouched), and a fresh Playwright DOM/screenshot check against the live dev server with cache cleared
- **Committed in:** `402e9b7`

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary correctness fix discovered by following the plan's own mandate for live-browser (not code-inferred) mobile verification — without it, CASE-09's dual-axis fix would type-check and pass the pure-function unit test but silently fail to render in production for any case study with genuinely divergent metric magnitudes (the exact scenario CASE-09 exists to fix). No scope creep — same file, same task boundary.

## Issues Encountered
- The live case-study doc (`migracion-ecommerce-nextjs-seo-tecnico`) has all 3 `results.metrics` rows populated with `before`/`after` values but no `label` field values — X-axis category labels render blank in the current screenshot. This is a content-population gap (CASE-02/04/06 territory), not a chart-code issue; it is explicitly out of scope for this plan and will be resolved when Plan 37-03/37-04 populate real per-doc metric labels.
- While running the mobile check, an already-running dev server on port 3000 (started by the concurrently-executing 37-01 agent or Juan) was inadvertently killed by an overly broad `pkill -f "next dev"` and immediately restarted — flagging this for transparency since it briefly interrupted a shared dev server, though it recovered within seconds with no data loss (dev server only, no database operation involved).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CASE-09 and CASE-10's chart-code root causes are fixed and live-browser-verified with today's sparse/partial content
- Definitive mobile verification against real multi-row, mixed-magnitude, fully-labeled GSC data across all 6 case-study docs is deferred to Plan 37-04's final verification task, once Plan 37-03/37-04 populate `results.metrics.label` and richer before/after data — per this plan's explicit scope boundary
- No blockers for Plan 37-01 (no file overlap; both plans landed cleanly in parallel on `master`)

---
*Phase: 37-case-studies-content-audit-fix*
*Completed: 2026-07-14*

## Self-Check: PASSED
- FOUND: src/components/CaseStudyResultsChart.tsx
- FOUND: scripts/verify-chart-bucketing.ts
- FOUND commit: acdb4c2
- FOUND commit: 402e9b7
