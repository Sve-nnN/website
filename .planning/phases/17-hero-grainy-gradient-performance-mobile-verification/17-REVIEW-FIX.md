---
phase: 17-hero-grainy-gradient-performance-mobile-verification
fixed_at: 2026-07-12T05:37:09Z
review_path: .planning/phases/17-hero-grainy-gradient-performance-mobile-verification/17-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 17: Code Review Fix Report

**Fixed at:** 2026-07-12T05:37:09Z
**Source review:** .planning/phases/17-hero-grainy-gradient-performance-mobile-verification/17-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01, WR-02, WR-03, WR-04 — Info finding IN-01 excluded, scope is critical_warning)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: No defensive handling for Lighthouse audits that fail to compute a numericValue

**Files modified:** `scripts/lighthouse-mobile.mjs`
**Commit:** 497b89d
**Applied fix:** Added a `safeNumeric(audits, id, decimals)` helper that reads `audits[id]?.numericValue` with optional chaining and throws an actionable error (including `scoreDisplayMode`) if the value is missing or not a finite number, instead of letting a raw `.toFixed()`/`Math.round()` call on `undefined` throw an opaque `TypeError`. `lcpMs`, `cls`, and `tbtMs` extraction in `runLighthouse()` now route through this helper. The thrown error is still caught by the existing per-route `try/catch` in `main()`, so a cold-start failure now surfaces as a clear, diagnosable message in `scores[route].error` instead of a generic crash trace.

### WR-02: Per-route failures never surface as a non-zero exit code

**Files modified:** `scripts/lighthouse-mobile.mjs`
**Commit:** 1ae83df
**Applied fix:** After writing the scores (to file or stdout), `main()` now computes `failedRoutes` from `Object.entries(scores).filter(([, v]) => v.error)`. If any route failed, it logs the failed route list to stderr and sets `process.exitCode = 1`. A partially-failed run (e.g. one route errors, others succeed) will now correctly fail a CI check on `$?` instead of always exiting 0.

### WR-03: `--routes-only` with no following value crashes with an unhandled TypeError

**Files modified:** `scripts/lighthouse-mobile.mjs`
**Commit:** 7ae9405
**Applied fix:** `parseArgs()` now captures `argv[++i]` into a local `raw` variable and guards the `.split(',')` call behind a truthiness check (`raw ? ... : []`) before assigning `args.routesOnly`. A trailing `--routes-only` with no value now falls back to `null` (and downstream `args.routesOnly ?? ROUTES` picks the full route list) instead of throwing `Cannot read properties of undefined (reading 'split')`.

### WR-04: `--routes-only ""` silently produces zero routes instead of falling back to the full route list

**Files modified:** `scripts/lighthouse-mobile.mjs`
**Commit:** 7ae9405 (same commit as WR-03 — both findings are the identical `parseArgs` code region and are fixed by one code change)
**Applied fix:** The parsed comma-separated list is only assigned to `args.routesOnly` when non-empty (`parsed.length > 0 ? parsed : null`). An empty string, or a string that reduces to zero routes after trimming/filtering (e.g. `","`), now falls back to `null` — restoring the pre-Phase-17 behavior where `args.routesOnly ?? ROUTES` runs against the full route list rather than looping zero times and silently writing an empty `{}` scores file.

## Skipped Issues

None — all 4 in-scope findings (WR-01 through WR-04) were fixed.

**Note:** Finding IN-01 (`--no-sandbox` Chrome flag hardcoded) was intentionally excluded — it is an Info-severity finding and this fix run's scope is `critical_warning` (Critical/BLOCKER + Warning only).

## Verification

- `node --check scripts/lighthouse-mobile.mjs` passed after each of the 3 commits (no syntax errors introduced).
- Full-file re-read confirmed all four fixes are present, mutually consistent (WR-03/WR-04 share one code region), and no surrounding code was corrupted.
- Live smoke-test against a running dev/prod server was not performed in this pass (no server was running in the isolated worktree); syntax validation and manual code-path review substitute per the task's "otherwise just confirm no syntax errors" fallback instruction.

---

_Fixed: 2026-07-12T05:37:09Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
