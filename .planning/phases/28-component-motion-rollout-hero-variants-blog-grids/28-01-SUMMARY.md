---
phase: 28-component-motion-rollout-hero-variants-blog-grids
plan: 01
subsystem: tooling
tags: [regression-baseline, lighthouse, h1-jsonld, motion-rollout-gate, scripts]

# Dependency graph
requires:
  - phase: 25-service-page-visual-polish
    provides: "capture-service-page-snapshot.mjs and lighthouse-mobile.mjs regression-baseline pattern, reused verbatim here"
provides:
  - "Pre-change H1/JSON-LD snapshot (28-baseline-content.json) for the 6 Phase 28 representative routes"
  - "Pre-change Lighthouse mobile scores, production build (lh-phase28-baseline.json) for the same 6 routes"
  - "capture-service-page-snapshot.mjs now accepts an optional --routes flag, backward-compatible with Phase 25's own no-flag re-run"
affects: [28-02-hero-variant-motion, 28-03-blog-grid-motion, 28-04-post-change-regression-diff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "--routes flag parsing mirrors lighthouse-mobile.mjs's --routes-only exactly (comma-separated, trim, filter-empty, null fallback to hardcoded default array)"

key-files:
  created:
    - .planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-baseline-content.json
    - .planning/phases/28-component-motion-rollout-hero-variants-blog-grids/lh-phase28-baseline.json
  modified:
    - scripts/capture-service-page-snapshot.mjs

key-decisions:
  - "Used `npx next build` instead of the plan's literal `PORT=3033 npm run build` — project CLAUDE.md hard-bans `npm run build` because it runs `payload migrate` against the live production Neon DB with no dev/staging separation; Phase 27's established pattern (`npx next build`) was followed instead, per explicit instruction from Juan for this run"
  - "Stopped the dev server (port 3000) before running the production build to avoid `.next` build-artifact contention between `next dev` and `next build`, even though the plan's routes run on a separate port (3033)"

requirements-completed: [MOTION-04]

# Metrics
duration: ~15min
completed: 2026-07-13
---

# Phase 28 Plan 01: Pre-change Regression Baseline Summary

**Captured the pre-Hero/blog-grid-motion regression baseline — H1/JSON-LD snapshot and Lighthouse mobile (production build) scores for the 6 Phase 28 representative routes — and added a backward-compatible `--routes` flag to `capture-service-page-snapshot.mjs` so it stops being hardcoded to Phase 25's service-page URL set.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 (both auto)
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `capture-service-page-snapshot.mjs` gained an optional `--routes` CLI flag (comma-separated, trim, filter-empty), defaulting to `null` so the original hardcoded `URLS` constant (Phase 25's 8 service-page URLs) is used unchanged when the flag is omitted — verified byte-for-byte via a live no-flag re-run (8/8 routes captured, same output shape)
- `28-baseline-content.json` captured: H1 count + JSON-LD types for `/en`, `/es`, `/en/blog`, `/servicios`, `/en/services`, `/en/seo-tecnico-lima` — all 6 routes returned exactly 1 `<h1>`
- `lh-phase28-baseline.json` captured via a real `next build` + `next start` on port 3033: Lighthouse mobile performance/accessibility/best-practices/seo/LCP/CLS/TBT for the same 6 routes, zero errors
- Production server on port 3033 confirmed killed with no orphan process after the Lighthouse run

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --routes flag, capture pre-change H1/JSON-LD snapshot** — `3bc5565` (feat)
2. **Task 2: Capture pre-change Lighthouse mobile baseline (production build)** — `77f8729` (feat)

_No plan-metadata commit — orchestrator owns STATE.md/ROADMAP.md updates and will make the final metadata commit itself._

## Files Created/Modified
- `scripts/capture-service-page-snapshot.mjs` — added `--routes` flag (`parseArgs`), `main()` now iterates `args.routes ?? URLS`
- `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/28-baseline-content.json` — pre-change H1/JSON-LD snapshot, 6 routes
- `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/lh-phase28-baseline.json` — pre-change Lighthouse mobile scores, 6 routes

## Baseline Data Captured

### H1 / JSON-LD (`28-baseline-content.json`)

| Route | H1 count | JSON-LD types |
|---|---|---|
| `/en` | 1 | Person |
| `/es` | 1 | Person |
| `/en/blog` | 1 | (none) |
| `/servicios` | 1 | BreadcrumbList |
| `/en/services` | 1 | BreadcrumbList |
| `/en/seo-tecnico-lima` | 1 | (none) |

### Lighthouse mobile, production build (`lh-phase28-baseline.json`)

| Route | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|
| `/en` | 64 | 96 | 96 | 100 | 3810 | 0 | 1086 |
| `/es` | 72 | 96 | 96 | 100 | 4097 | 0 | 566 |
| `/en/blog` | 82 | 95 | 96 | 92 | 3799 | 0 | 34 |
| `/servicios` | 86 | 98 | 96 | 83 | 3668 | 0 | 234 |
| `/en/services` | 89 | 98 | 96 | 75 | 3623 | 0 | 115 |
| `/en/seo-tecnico-lima` | 90 | 98 | 96 | 91 | 3627 | 0 | 43 |

These are the reference numbers 28-04's closing gate will diff against (Performance >5pt regression / CWV-band-crossing thresholds, per MOTION-04).

## Decisions Made
- Followed Phase 27's established `npx next build` pattern instead of the plan's literal `PORT=3033 npm run build` step — this project's `CLAUDE.md` hard-bans `npm run build` locally because it runs `payload migrate` against the live production Neon DB with no dev/staging separation. This was an explicit instruction for this execution run and does not change the plan's actual baseline-capture outcome (same production-build artifact, same Lighthouse invocation, same output file).
- Stopped the `next dev` server (port 3000) before running the production build, to avoid `.next` directory contention between dev and build processes, even though the two servers run on different ports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/CLAUDE.md constraint] Used `npx next build` instead of `npm run build`**
- **Found during:** Task 2, before running the production build
- **Issue:** The plan's Task 2 action literally specifies `PORT=3033 npm run build`, reasoning it's "safe here since Phase 28 makes zero schema changes." However, this project's `CLAUDE.md` imposes a hard project-wide rule: never run `npm run build` because its `payload migrate` step targets the live production Neon DB with no dev/staging separation — and this execution run's own instructions repeated that constraint explicitly.
- **Fix:** Ran `npx next build` (skips `payload migrate`/`generate:importmap`/`generate:types`, only invokes `next build`) followed by `PORT=3033 npx next start`, matching Phase 27's established safe pattern. No schema-affecting commands ran.
- **Files modified:** None (build-process choice only, no code change)
- **Commit:** N/A (no file change from this decision — captured as a decision + deviation note only)

**2. [Rule 3 - Transient tooling failure] First Lighthouse run failed on `/en`, `/es`, and crashed on `/en/blog`**
- **Found during:** Task 2, first `lighthouse-mobile.mjs` invocation
- **Issue:** Chrome-for-Testing returned `Audit "largest-contentful-paint" did not return a numeric value` for the first two routes, then a `Protocol error (Page.navigate): Target closed` crash on the third — consistent with a cold-started/flaky headless Chrome session, not a code or server issue (the prod server itself stayed healthy and responsive throughout, confirmed via a direct `curl` health check).
- **Fix:** Re-ran the exact same `lighthouse-mobile.mjs` command a second time with no code changes; all 6 routes captured cleanly with numeric scores on the retry.
- **Files modified:** None
- **Commit:** N/A (no code change; the successful retry's output is what's committed in `lh-phase28-baseline.json`)

## Issues Encountered

None blocking. The transient Lighthouse/Chrome flakiness on the first run (see Deviation 2) resolved on retry with no further action needed.

## User Setup Required

None — no external service configuration required. Both capture scripts are standalone Node scripts with no new dependencies.

## Next Phase Readiness

Plans 28-02 (Hero variant motion) and 28-03 (blog-grid motion) can now proceed — the pre-change baseline they must not regress against is committed and reproducible:
- `28-baseline-content.json` and `lh-phase28-baseline.json` are the reference files 28-04's closing gate will re-diff against, using the same 6 route keys.
- `capture-service-page-snapshot.mjs --routes <comma-separated-paths>` is reusable for any future route set without touching the script again.
- Phase 25's own baseline/diff workflow remains fully reproducible — the new `--routes` flag is additive only.

---
*Phase: 28-component-motion-rollout-hero-variants-blog-grids*
*Completed: 2026-07-13*

## Self-Check: PASSED

All created/modified files verified present on disk; both task commits (3bc5565, 77f8729) verified present in git log.
