---
status: passed
---

# Phase 36 Verification: Regression Gate

## Success Criteria (from ROADMAP.md, "Phase 36: Regression Gate")

1. **La misma medición de Lighthouse/CWV de Phase 32 se vuelve a correr sobre las mismas rutas y se diffea programáticamente contra el baseline** — PASS. `lh-phase36-post.json`, 6/6 routes, same `scripts/lighthouse-mobile.mjs` runner, same production-build discipline (`npx next build` + `PORT=3042 npx next start`, `caffeinate -u` held). Programmatic per-route diff against `lh-phase32-baseline.json` documented in `36-REGRESSION-DIFF.md`.
2. **H1/JSON-LD se vuelven a verificar en las mismas rutas y se diffean contra el baseline de Phase 32** — PASS. `36-post-content.json`, 6/6 routes, diffed against `32-baseline-content.json` — byte-identical H1 text and unchanged JSON-LD presence/types on all 6 routes.
3. **Queda un veredicto explícito PASS/FAIL registrado en un documento, con gap closure corrido si el veredicto es FAIL** — PASS. `36-REGRESSION-DIFF.md` states an explicit overall verdict (PASS, 6/6 routes clean). No gap closure was required since no real regression was found — one anomalous single-run Lighthouse reading on `/seo-tecnico-madrid` was investigated with 3 reproducibility re-runs (same discipline as Phase 28) and confirmed to be measurement noise, not a code regression, before being accepted into the diff table.
4. **El milestone solo se considera cerrable cuando el gate final es PASS** — PASS. The gate's overall verdict is PASS; v1.7 is clear to close.

## Additional checks performed

- Confirmed via `git diff --stat` (pre-commit) that only `.planning/phases/36-regression-gate/*` and the milestone-close doc updates (STATE.md/ROADMAP.md/REQUIREMENTS.md) changed in this phase — no `src/` code touched, consistent with this being a measurement-only phase that did not need a gap-closure code fix.
- Production server process (PID) and `caffeinate` process both confirmed killed post-capture via `lsof -i :3042` (empty) and `ps aux | grep next` (no `next start`/`next dev` processes remaining).
- Reproducibility discipline applied to the one anomalous reading before accepting any number into the final diff table, matching the rigor `28-REGRESSION-DIFF.md` established as this project's precedent for flagged Lighthouse deltas.

## Verdict: PASSED — 4/4 must-haves verified. Milestone v1.7 is closed.
