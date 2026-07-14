# Phase 36 Plan 01 Summary: Regression Gate

**Status:** Complete

Re-ran the exact Phase 32 measurement (mobile Lighthouse, production build port 3042; H1/JSON-LD snapshot) against the same 6 routes after Phase 33-35's work landed, and diffed programmatically against the Phase 32 baseline. Result: **PASS, 6/6 routes clean** on both Lighthouse (no >5pt performance drop, no CWV band crossing) and H1/JSON-LD integrity (byte-identical H1 text, unchanged JSON-LD presence/types on all 6 routes).

One anomalous reading surfaced during the official Lighthouse capture — `/seo-tecnico-madrid` scored `performance: 62`/`tbtMs: 1714` on its first run, a large enough delta from the 88/65ms baseline to investigate rather than accept. Reproduced with 3 clean re-runs (88/3802/122, 88/3797/88, 89/3796/42, all tightly clustered around the baseline), confirming the spike was single-run lab noise, not a regression caused by Phase 33-35's code. The diff table and `lh-phase36-post.json` were both updated to use the reproduced, representative value with a documented note, rather than silently keeping the outlier or silently discarding it without explanation.

Madrid/Lima's real new content from Phase 34 (LocalProofSection block, local-landing Hero variant fields) produced no measurable LCP degradation — all 4 routes moved by only 2-46ms, staying in the same `needs-improvement` band as baseline. Phase 35's 6 component-level code fixes (button/badge/card radius, AboutSection gap, ServiceScopeCard padding, ContactFormBlock sidebar radius) introduced zero Lighthouse or content regressions on any measured route.

No gap closure was required — the gate passed cleanly on the first full pass (after the one noise-investigation re-run).

**Files:** `lh-phase36-post.json`, `36-post-content.json`, `36-REGRESSION-DIFF.md`

## Verification

- Production server (`next start`, port 3042) and `caffeinate -u` confirmed killed and clear via `lsof -i :3042` and `ps aux | grep next` after capture.
- `36-post-content.json` confirms exactly 1 H1 per route, 0/6 routes with duplicate or missing headings.
- Programmatic band-comparison confirmed 0/6 routes crossed a worse LCP/CLS/TBT lab band.

## Deviations from Plan

None beyond the planned reproducibility check (Task 1 step 4 in `36-01-PLAN.md` explicitly anticipated this — "if any route shows an anomalous delta, reproduce with 2-3 clean re-runs before concluding real vs. noise").
