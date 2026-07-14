# Phase 36 Regression Gate: PASS — 6/6 routes clean

**Captured:** 2026-07-14, production build (`npx next build` + `PORT=3042 npx next start`, `caffeinate -u` held throughout), same Chrome-for-Testing runner (`scripts/lighthouse-mobile.mjs`), mobile form factor. Same 6 routes as Phase 32's baseline: `/`, `/en`, `/seo-tecnico-madrid`, `/en/seo-tecnico-madrid`, `/seo-tecnico-lima`, `/en/seo-tecnico-lima`.

Diff of the post-Phase-33/34/35 site against the Phase 32 baseline (`.planning/phases/32-regression-baseline/lh-phase32-baseline.json` + `32-baseline-content.json`). Threshold per `36-CONTEXT.md`: flag if `performance` drops more than 5 points, or any CWV metric (LCP/CLS/TBT) crosses into a worse Lighthouse lab band than its Phase 32 value. Bands: LCP good <=2500ms / needs-improvement <=4000ms / poor above; CLS good <=0.1 / needs-improvement <=0.25 / poor above; TBT good <=200ms / needs-improvement <=600ms / poor above.

## Task 1: Lighthouse Mobile Diff

| Route | Perf baseline -> post (delta) | LCP baseline -> post (band) | TBT baseline -> post (band) | CLS baseline -> post (band) | Verdict |
|---|---|---|---|---|---|
| / | 84 -> 85 (+1) | 4094ms -> 4106ms (poor, no change) | 154ms -> 142ms (good, no change) | 0 -> 0 (good, no change) | PASS |
| /en | 85 -> 85 (0) | 4236ms -> 4108ms (poor, no change) | 75ms -> 159ms (good, no change) | 0 -> 0 (good, no change) | PASS |
| /seo-tecnico-madrid | 88 -> 88 (0)* | 3795ms -> 3797ms (needs-improvement, no change) | 65ms -> 88ms (good, no change) | 0 -> 0 (good, no change) | PASS |
| /en/seo-tecnico-madrid | 89 -> 87 (-2) | 3782ms -> 3828ms (needs-improvement, no change) | 64ms -> 131ms (good, no change) | 0 -> 0 (good, no change) | PASS |
| /seo-tecnico-lima | 89 -> 88 (-1) | 3783ms -> 3797ms (needs-improvement, no change) | 60ms -> 108ms (good, no change) | 0 -> 0 (good, no change) | PASS |
| /en/seo-tecnico-lima | 89 -> 89 (0) | 3785ms -> 3814ms (needs-improvement, no change) | 60ms -> 57ms (good, no change) | 0 -> 0 (good, no change) | PASS |

**6/6 routes PASS.** No route dropped more than 5 Performance points, and no CWV metric (LCP/CLS/TBT) crossed into a worse lab band than its Phase 32 baseline on any route. Raw data: `lh-phase36-post.json`.

\* `/seo-tecnico-madrid` note — see reproducibility check below; this row already reflects the reproduced, representative value, not the original one-off anomalous run.

### Reproducibility check: `/seo-tecnico-madrid` anomalous first run (confirmed noise, not a regression)

The official capture's first pass returned `performance: 62`, `tbtMs: 1714` for `/seo-tecnico-madrid` — a large enough delta from the 88/65ms baseline to warrant investigation before accepting it, per Phase 28's discipline of not routing around flagged results without reproducing them first. Ran 3 isolated clean re-runs against the same still-running production server immediately after:

| Run | Performance | LCP | TBT |
|---|---|---|---|
| Official (flagged) | 62 | 3824ms | 1714ms |
| Re-run 1 | 88 | 3802ms | 122ms |
| Re-run 2 | 88 | 3797ms | 88ms |
| Re-run 3 | 89 | 3796ms | 42ms |

**Verdict: confirmed noise, not a real regression.** 3 of 4 total runs cluster tightly around 88-89 performance / 42-122ms TBT, matching the Phase 32 baseline (88 / 65ms) almost exactly. Only the single official run spiked to 1714ms TBT — a single-run outlier consistent with a transient scheduling hiccup (background process contention, GC pause, or similar one-off Lighthouse lab noise) rather than anything caused by Phase 33-35's code. This table uses re-run 2 (88 / 3797ms / 88ms) as the representative value in the diff table above, and `lh-phase36-post.json` has been updated to record this value plus a `_note` field documenting the full repro for anyone auditing the raw JSON later.

### Note on Madrid/Lima LCP (expected, not a regression)

Per `36-CONTEXT.md`, Phase 34 added real new content to Madrid/Lima (`LocalProofSection` block + `local-landing` Hero variant fields) — some LCP shift on these 2 routes was expected and would have been an acceptable, honestly-documented PASS-with-explanation even if it had crossed a band. In practice it did not: LCP moved by only 2-46ms across all 4 Madrid/Lima routes (well within normal lab-measurement noise), staying in the same `needs-improvement` band as the Phase 32 baseline on every route. The added content did not measurably affect LCP timing.

## Task 2: H1 / JSON-LD Diff

| Route | H1 baseline | H1 post | H1 verdict | JSON-LD baseline | JSON-LD post | JSON-LD verdict |
|---|---|---|---|---|---|---|
| / | 1, "Juan Carlos Angulo: Ingeniero de Software y Experto SEO" | 1, "Juan Carlos Angulo: Ingeniero de Software y Experto SEO" | PASS (byte-identical) | Person | Person | PASS (unchanged) |
| /en | 1, "Juan Carlos Angulo: Software Engineer &amp; SEO Expert" | 1, "Juan Carlos Angulo: Software Engineer &amp; SEO Expert" | PASS (byte-identical) | Person | Person | PASS (unchanged) |
| /seo-tecnico-madrid | 1, "SEO Técnico en Madrid / España" | 1, "SEO Técnico en Madrid / España" | PASS (byte-identical) | none | none | PASS (unchanged) |
| /en/seo-tecnico-madrid | 1, "Technical SEO in Madrid / Spain" | 1, "Technical SEO in Madrid / Spain" | PASS (byte-identical) | none | none | PASS (unchanged) |
| /seo-tecnico-lima | 1, "SEO Técnico en Lima" | 1, "SEO Técnico en Lima" | PASS (byte-identical) | none | none | PASS (unchanged) |
| /en/seo-tecnico-lima | 1, "Technical SEO in Lima" | 1, "Technical SEO in Lima" | PASS (byte-identical) | none | none | PASS (unchanged) |

**6/6 routes PASS.** Every route still has exactly 1 H1, byte-identical text to the Phase 32 baseline — confirming Phase 34's local-landing content additions (LocalProofSection block, Hero variant's new city/stat/ring fields) landed below the H1, not replacing it, and Phase 35's component-level fixes (badge/button/card radius, AboutSection gap, ServiceScopeCard padding, ContactFormBlock sidebar radius) touched none of these 6 routes' heading copy. JSON-LD presence/absence and types are unchanged on all 6 routes — Home routes still carry a single `Person` node, Madrid/Lima routes still carry none (a pre-existing gap noted but not required by any v1.7 requirement, consistent with Phase 32's own note). Raw data: `36-post-content.json`.

## Overall Verdict: PASS (6/6 routes clean on both axes)

No regression was found that required gap closure. The one anomalous reading (`/seo-tecnico-madrid`'s first-run TBT spike) was investigated per Phase 28's reproduce-before-concluding discipline and confirmed to be single-run measurement noise, not a defect introduced by Phase 33, 34, or 35's changes — 3 clean re-runs landed back at the baseline value. Madrid/Lima's real new content (Phase 34) produced no measurable LCP degradation. Phase 35's 6 component-level code fixes (button/badge/card radius, AboutSection gap, ServiceScopeCard padding, ContactFormBlock sidebar radius) introduced zero Lighthouse or content regressions on any of the 6 measured routes.

**REG-02 is satisfied.** The milestone's closing gate is PASS — v1.7 is clear to close.
