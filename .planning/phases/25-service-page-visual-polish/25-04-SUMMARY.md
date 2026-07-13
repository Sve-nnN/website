---
phase: 25-service-page-visual-polish
plan: 04
subsystem: testing
tags: [lighthouse, seo, json-ld, regression-gate, ci-tooling]

# Dependency graph
requires:
  - phase: 25-service-page-visual-polish
    plan: 01
    provides: Baseline artifacts (25-baseline-content.json, lh-phase25-baseline.json) and reusable capture scripts, both reused verbatim
  - phase: 25-service-page-visual-polish
    plan: 03
    provides: Post-change 10-block anatomy live on all 8 service URLs, the subject under test
provides:
  - Post-change H1/JSON-LD snapshot (25-post-content.json) for all 8 service URLs
  - Post-change Lighthouse mobile scores (lh-phase25-post.json) for all 8 service URLs, production build
  - 25-REGRESSION-DIFF.md — the phase's closing regression-gate record, explicit top-line verdict
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reproducibility check before recording a threshold FAIL — re-ran the flagged route in isolation twice more before concluding it wasn't single-run Lighthouse noise"

key-files:
  created:
    - .planning/phases/25-service-page-visual-polish/25-post-content.json
    - .planning/phases/25-service-page-visual-polish/lh-phase25-post.json
    - .planning/phases/25-service-page-visual-polish/25-REGRESSION-DIFF.md
  modified: []

key-decisions:
  - "Recorded an explicit FAIL verdict rather than rounding a 6-point drop down to 'close enough' to the 5-point threshold — the plan's own threat-model mitigation (T-25-10) requires this to be surfaced, not glossed over"
  - "Before concluding the flagged route's drop was a real regression (vs. single-run Lighthouse noise), re-ran it twice more in isolation on a dedicated production build/port — both reruns (77, 78) were worse than the officially recorded 81, confirming reproducibility rather than a favorable-baseline fluke"

requirements-completed: []

# Metrics
duration: 35min
completed: 2026-07-13
---

# Phase 25 Plan 04: Regression Diff vs 25-01 Baseline Summary

**Re-ran the exact 25-01 measurement tooling (H1/JSON-LD capture + production-build Lighthouse mobile) against all 8 post-change service URLs and diffed programmatically against the 25-01 baseline: H1/JSON-LD/ES-EN-parity are a clean 8/8 PASS, but Lighthouse Performance regressed 6 points (over the 5-point threshold, confirmed reproducible across 3 runs) on `/en/services/fullstack-development` — explicit phase-closing verdict is FAIL, recorded in 25-REGRESSION-DIFF.md, not silently marked done.**

## PHASE 25 REGRESSION GATE: FAIL

**This is the load-bearing line of this summary.** 7 of 8 service URLs pass every check in this plan (H1 identity, BreadcrumbList JSON-LD identity, ES/EN parity, Lighthouse performance/CWV thresholds). One URL, `/en/services/fullstack-development`, fails the Lighthouse Performance-drop threshold: baseline 87 -> post 81 (a 6-point drop, exceeding the plan's 5-point limit). This was not a one-off noisy sample — it was re-run twice more in isolation and came back 77 and 78, both worse than the officially recorded 81. No individual CWV metric (LCP/CLS/TBT) crossed into a worse Lighthouse lab band on any of the 8 routes, including this one, on the officially recorded run.

Per this plan's own instructions (and its threat-model mitigation T-25-10), this FAIL is being surfaced plainly rather than routed around. **The phase should not be marked complete by the orchestrator based on this plan's evidence alone** — Juan needs to decide whether the 6-point Performance drop on this one route is acceptable (it stays within the same CWV lab bands as baseline; no metric got objectively worse in category, only the aggregate score shifted) or whether it needs investigation/fix before Phase 25 closes.

## Performance

- **Duration:** ~35 min
- **Started:** production build + Lighthouse capture began after Task 1 completed
- **Tasks:** 2 completed
- **Files created:** 3 (25-post-content.json, lh-phase25-post.json, 25-REGRESSION-DIFF.md)

## Accomplishments

- `25-post-content.json` captured against the running dev server (port 3000), same methodology as 25-01's content baseline (H1/JSON-LD markup doesn't vary between dev/prod HTML)
- Programmatic diff (exact `node -e` script from the plan) confirms: `h1.count===1` and `h1.texts[0]` byte-identical to baseline, and every `BreadcrumbList.itemListElement` deep-equal to baseline, on all 8 URLs — **PASS: 8/8 URLs, H1 + BreadcrumbList unchanged from baseline**
- Live ES/EN parity check against the exact translation-namespace strings (`messages/en.json`/`messages/es.json` `serviceScopeCard.*` and `relatedCaseStudyBlock.title`) confirms zero cross-locale leakage on all 8 URLs — Spanish pages show only Spanish scope-card/framing labels, English pages show only English ones, 8/8 PASS
- CTA button text spot-checked as locale-correct (e.g. "Pedir una auditoría"/"Contáctame" on ES, "Request an audit"/"Contact me" on EN)
- `lh-phase25-post.json` captured against a dedicated production build (`PORT=3027`, verbatim Phase 17/25-01 build->start->lighthouse->kill pattern), background server confirmed killed cleanly afterward (`lsof -i :3027` clear)
- 7 of 8 routes pass the Lighthouse Performance-drop threshold (deltas of -1 to -4 points) with zero CWV lab-band crossings anywhere
- `/en/services/fullstack-development` failed the threshold (87 -> 81, -6 points); confirmed reproducible via 2 additional isolated re-runs (77, 78), ruling out single-run noise as the explanation
- `25-REGRESSION-DIFF.md` written with the explicit top-line `## Phase 25 Regression Gate: FAIL (see below)` verdict, full per-URL/per-route tables for both tasks, and an investigation section on the isolated regression (ruled out content-size difference; flagged the concurrently-running dev server on port 3000 as a plausible CPU-contention confound, not a confirmed root cause)

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-capture H1/JSON-LD snapshot, diff against baseline, verify ES/EN parity** - `578a2c7` (test)
2. **Task 2: Re-run Lighthouse mobile baseline, diff CWV against 25-01** - `d1acbee` (test)

## Files Created/Modified

- `.planning/phases/25-service-page-visual-polish/25-post-content.json` - Post-change H1/JSON-LD snapshot, all 8 URLs
- `.planning/phases/25-service-page-visual-polish/lh-phase25-post.json` - Post-change Lighthouse mobile scores, all 8 routes, production build
- `.planning/phases/25-service-page-visual-polish/25-REGRESSION-DIFF.md` - Closing regression-gate record: explicit FAIL verdict, full diff tables, reproducibility check, investigation notes

## Decisions Made

- Recorded the FAIL verdict as written rather than treating a 6-point drop as "essentially passing" a 5-point threshold — the plan is explicit that any drop over 5 points is a hard flag, and its own threat model requires the verdict not be glossed over
- Before finalizing the verdict, re-ran the flagged route twice more in isolation (dedicated production build, port 3028, same kill-PID discipline) specifically to rule out single-sample Lighthouse noise before committing to a FAIL classification — both reruns came back worse than the official run, confirming the regression is real and reproducible, not a favorable-baseline artifact
- Investigated but did not attempt to fix the regression: this plan's scope is measurement and diffing only, not remediation. Rendered-HTML byte size is identical across all 4 EN service routes, ruling out "this landing has more content" as the explanation; the most plausible confound is that the main `next dev` server (port 3000) was running concurrently with every Lighthouse capture in this plan, adding CPU contention noise to a CPU-throttled lab benchmark — flagged as a methodology note for whoever re-measures, not asserted as the confirmed cause

## Deviations from Plan

None from the plan's instructions — the plan explicitly anticipated a possible FAIL outcome and specified exactly how to handle it (Task 2, action item 4, and threat T-25-10). The reproducibility re-run (2 extra Lighthouse passes on the flagged route) was an in-scope diagnostic step to make the FAIL verdict trustworthy, not a plan deviation; it did not modify any tracked artifact and was not committed as separate files.

## Issues Encountered

- One route (`/en/services/fullstack-development`) failed the Lighthouse Performance-drop threshold — see "PHASE 25 REGRESSION GATE: FAIL" above and `25-REGRESSION-DIFF.md` for full detail. This is a genuine measurement finding, not an execution error in this plan.
- A secondary, non-blocking observation: `accessibility` dropped uniformly 98 -> 94 across all 8 routes (not gated by the plan's must-haves, which only cover H1/JSON-LD/CWV/ES-EN-parity). Flagged in `25-REGRESSION-DIFF.md` for follow-up since it's a real, site-wide, currently-unexplained shift.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. This plan only captures and diffs measurement data; no UI/content was added.

## Threat Flags

None - this plan introduced no new network endpoint, auth path, file access pattern, or schema surface. Both threat-register mitigations (T-25-10 repudiation, T-25-11 orphan process) were followed as specified: the FAIL verdict is surfaced plainly (this document, top line), and the background Lighthouse server (port 3027, then port 3028 for the reproducibility re-run) was confirmed killed with no orphan process after each capture.

## Next Phase Readiness

**Not clear to close Phase 25 based on this plan's evidence alone.** H1/JSON-LD/ES-EN-parity are fully verified clean (SVCPOL-07, SVCPOL-09 satisfied, 8/8). SVCPOL-08 (no CWV regression) is not fully satisfied as written: 7/8 routes clean, 1/8 route (`/en/services/fullstack-development`) shows a reproducible 6-point Lighthouse Performance drop, though all three individual CWV metrics (LCP/CLS/TBT) stayed within their baseline lab bands on every route. Juan needs to decide: accept this specific Performance-score delta as within acceptable variance (all CWV bands hold), or route back to `/en/services/fullstack-development`'s content/markup for investigation before considering the phase closed. The orchestrator should surface this FAIL verdict rather than mark the phase complete automatically.

---
*Phase: 25-service-page-visual-polish*
*Completed: 2026-07-13*

## Self-Check: PASSED

All created files verified present on disk (`25-post-content.json`, `lh-phase25-post.json`, `25-REGRESSION-DIFF.md`); both task commits (`578a2c7`, `d1acbee`) verified present in git log.
