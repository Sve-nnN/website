# Phase 32 Plan 01 Summary: Capture Regression Baseline

**Status:** Complete

Captured mobile Lighthouse (production build, port 3040) and H1/JSON-LD snapshot for the 6-route baseline set (`/`, `/en`, `/seo-tecnico-madrid`, `/en/seo-tecnico-madrid`, `/seo-tecnico-lima`, `/en/seo-tecnico-lima`). Confirmed via curl that `/es` 307-redirects to `/` (as-needed locale prefix), so `/` and `/en` are the correct canonical home routes to measure. All 6 routes returned clean Lighthouse scores (no `error` keys) and exactly 1 H1 each, no JSON-LD parse errors. Wrote `32-REGRESSION-BASELINE.md` summarizing both captures in tables, matching Phase 28's `-DIFF.md` shape. Production server and `caffeinate` process killed and verified clear after capture. No code or content touched — measurement only.

**Files:** `lh-phase32-baseline.json`, `32-baseline-content.json`, `32-REGRESSION-BASELINE.md`
