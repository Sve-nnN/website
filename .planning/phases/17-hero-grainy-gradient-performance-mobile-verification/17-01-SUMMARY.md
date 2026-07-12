---
phase: 17-hero-grainy-gradient-performance-mobile-verification
plan: 01
subsystem: testing
tags: [lighthouse, core-web-vitals, playwright, webgl, hero, verification]

# Dependency graph
requires:
  - phase: 16-hero-grainy-gradient
    provides: GrainGradient WebGL shader on the Hero (shape=blob), and scripts/verify-hero-grain-gradient.mjs
  - phase: 11-verificacion-cruzada-final
    provides: scripts/lighthouse-mobile.mjs runner and lh-current.json baseline scores (post-11-02, pre-shader)
provides:
  - Extended scripts/lighthouse-mobile.mjs with LCP/CLS/TBT extraction and comma-separated --routes-only support
  - Production-build Lighthouse CWV measurement for /en and /es with the shader live (lh-phase17-current.json)
  - Baseline-vs-current comparison report confirming no significant Performance/CWV regression (17-01-lighthouse-cwv-report.md)
  - Production-build mobile spot-check (375/768/1280px) re-confirmation, zero overflow/layout failures
affects: [milestone-v1.3-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Local production build (PORT=<n> npm run build && npm run start) for CWV measurement, never next dev"
    - "Reuse existing verification scripts via BASE_URL/--routes-only overrides instead of rebuilding new checks"

key-files:
  created:
    - .planning/phases/17-hero-grainy-gradient-performance-mobile-verification/lh-phase17-current.json
    - .planning/phases/17-hero-grainy-gradient-performance-mobile-verification/17-01-lighthouse-cwv-report.md
  modified:
    - scripts/lighthouse-mobile.mjs

key-decisions:
  - "Used Phase 11-03's post-11-02 lh-current.json /en and /es entries as the comparison baseline (most recent pre-shader local-production-build measurement), per 17-CONTEXT.md's discretion note — no fresh pre-milestone checkout performed."
  - "Applied the ~5-point Performance regression threshold and 'poor' CWV lab-band judgment from 17-CONTEXT.md; both routes came back at Δ-3, within normal variance — PASS disposition."

patterns-established:
  - "TBT used as Lighthouse's lab-metric proxy for INP, documented inline, since true INP requires real-user field data unavailable from a local production build."

requirements-completed: [HERO-ANIM-05, HERO-ANIM-06]

# Metrics
duration: ~20min
completed: 2026-07-12
---

# Phase 17: Hero Grainy Gradient — Performance & Mobile Verification Summary

**Confirmed with real Lighthouse + Playwright evidence against a local production build that the Hero's WebGL GrainGradient shader causes no significant Performance/CWV regression (Δ-3 on both /en and /es vs Phase 11's pre-shader baseline) and zero mobile layout/overflow breakage.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-12
- **Tasks:** 3 completed
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments
- Extended `scripts/lighthouse-mobile.mjs` (Phase 11 runner) to extract LCP/CLS/TBT alongside the existing 4 category scores, and to accept comma-separated `--routes-only` lists — no new script built, existing tooling reused per plan intent.
- Captured real Lighthouse mobile scores against a `PORT=3020` local production build (never `next dev`) for `/en` and `/es` with the Phase 16 shader live: Performance 89/87, Accessibility 96/96, Best-Practices 96/96, SEO 100/100, LCP 3553ms/3861ms, CLS 0/0, TBT 120ms/133ms.
- Compared against Phase 11-03's pre-shader baseline (92/90 Performance): both routes show a -3 point Δ, within the ~5-point/normal-variance threshold set in 17-CONTEXT.md — **no regression flagged**.
- Re-ran `scripts/verify-hero-grain-gradient.mjs` (Phase 16, unmodified) against the same production server via `BASE_URL` override — 23 notes, 0 warnings, 0 failures, zero horizontal overflow at 375/768/1280px.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend lighthouse-mobile.mjs with LCP/CLS/TBT extraction** - `ccf08cf` (feat)
2. **Task 2: Run production-build Lighthouse against /en and /es, capture CWV** - `a9d673d` (feat)
3. **Task 3: Production-build mobile spot-check + write verification report** - `6774c8f` (docs)

**Plan metadata:** (this commit, added after SUMMARY)

## Files Created/Modified
- `scripts/lighthouse-mobile.mjs` - Added `lcpMs`/`cls`/`tbtMs` extraction from Lighthouse audits per route; `--routes-only` now accepts a comma-separated list
- `.planning/phases/17-hero-grainy-gradient-performance-mobile-verification/lh-phase17-current.json` - Raw captured scores for /en and /es against the post-Phase-16 production build
- `.planning/phases/17-hero-grainy-gradient-performance-mobile-verification/17-01-lighthouse-cwv-report.md` - Baseline-vs-current comparison, CWV lab-band assessment, disposition, mobile spot-check result

## Decisions Made
- Baseline source: Phase 11-03's post-11-02 `lh-current.json` (pre-shader) — the most recent available comparison point per 17-CONTEXT.md's explicit discretion note.
- Regression threshold: ~5 Performance points or a CWV metric entering "poor" lab band, per 17-CONTEXT.md. Both routes measured well inside this threshold.

## Deviations from Plan

None requiring a code change. One transient issue was investigated and resolved without altering shipped code:

**Investigated: transient `Cannot read properties of undefined (reading 'toFixed')` on first Lighthouse run**
- **Found during:** Task 2 (first invocation of the extended runner against the freshly-started production server)
- **Issue:** The very first Lighthouse run against a cold-started `next start` process failed on both `/en` and `/es` with a `.toFixed()` error inside the new CLS-rounding code.
- **Investigation:** Isolated the audit object with a temporary debug script (removed after use, never committed) — `cumulative-layout-shift.numericValue` and all three new audit fields were present and well-formed on every subsequent run once the server had served a few warm requests. The failure did not reproduce with a warm server, single-route or multi-route.
- **Resolution:** No code change needed — the shipped `lighthouse-mobile.mjs` code was correct throughout. The official Task 2 command was re-run against the already-warmed server and completed cleanly, producing the committed `lh-phase17-current.json`.
- **Files modified:** None (debug script `scripts/.debug-lh.mjs` was created, used, and deleted; never committed).

---

**Total deviations:** 0 code changes; 1 transient issue investigated and resolved by re-running against a warm server.
**Impact on plan:** None — final artifacts and committed code match the plan exactly.

## Issues Encountered
None beyond the transient cold-start issue documented above, which resolved without a fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Milestone v1.3's verification gate for HERO-ANIM-05/06 is satisfied: no Performance/CWV regression, no mobile layout breakage from the Phase 16 shader.
- No follow-up action required from Juan — this is a clean PASS, not a flagged regression needing a decision.
- Background production server on port 3020 confirmed stopped after both Task 2 and Task 3; no orphaned process left running.

---
*Phase: 17-hero-grainy-gradient-performance-mobile-verification*
*Completed: 2026-07-12*

## Self-Check: PASSED

All created files exist (scripts/lighthouse-mobile.mjs, lh-phase17-current.json, 17-01-lighthouse-cwv-report.md, this SUMMARY). All 3 task commits (ccf08cf, a9d673d, 6774c8f) verified present in git log.
