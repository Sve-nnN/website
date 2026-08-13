# Phase 31 Regression Diff — Final Milestone v1.6 Lighthouse Gate

**Captured:** 2026-07-17, production build (`npx next build` + `PORT=3046 npx next start`, `caffeinate -u` held throughout), Chrome-for-Testing via `scripts/lighthouse-mobile.mjs`, mobile form factor. Raw data: `lh-phase31-post.json`.

Purpose: confirm zero CWV/performance regression across both v1.6 tracks before closing the milestone — Track A's motion work (home + geo-pages, measured against Phase 32's baseline) and Track B's content rewrite (blog + case-studies, measured against this phase's own Plan 31-01 pre-capture).

Threshold rule (identical to Phase 36's Regression Gate): flag a route if `performance` drops more than 5 points, or if any CWV metric (LCP/CLS/TBT) crosses into a worse Lighthouse lab band than its baseline value. Bands: LCP good <=2500ms / needs-improvement <=4000ms / poor above. CLS good <=0.1 / needs-improvement <=0.25 / poor above. TBT good <=200ms / needs-improvement <=600ms / poor above.

## Measurement note: first-run noise on `/` and `/seo-tecnico-madrid`

The first Lighthouse pass returned anomalous scores for `/` (performance 62, TBT 1506ms) and `/seo-tecnico-madrid` (performance 79, TBT 384ms) — both far outside any plausible regression band and inconsistent with the other 8 routes' stable numbers on the same run. Per the plan's instruction and the Phase 28 precedent, these two routes were re-measured with 2 clean, isolated re-runs each:

- `/`: rerun 1 = perf 84 / TBT 101ms, rerun 2 = perf 85 / TBT 73ms — both consistent with the Phase 32 baseline (perf 84).
- `/seo-tecnico-madrid`: rerun 1 = perf 89 / TBT 63ms, rerun 2 = perf 88 / TBT 66ms — both consistent with the Phase 32 baseline (perf 88).

This confirms the first pass was measurement noise (cold-start Chrome/CPU contention on the first Lighthouse run of the session), not a real regression. `lh-phase31-post.json` was updated to record the reproducible, stable values (rerun 2) for both routes before the diff below was computed.

## Track A — Home + Geo-pages (baseline: `lh-phase32-baseline.json`, captured 2026-07-14)

| Route | Perf (before→after) | A11y | BP | SEO (before→after) | LCP (before→after) | CLS | TBT (before→after) | Status |
|---|---|---|---|---|---|---|---|---|
| / | 84 → 85 | 96 → 96 | 96 → 96 | 100 → 100 | 4094ms poor → 4238ms poor | 0 → 0 good | 154ms good → 73ms good | clean |
| /en | 85 → 85 | 96 → 96 | 96 → 96 | 100 → 100 | 4236ms poor → 4244ms poor | 0 → 0 good | 75ms good → 82ms good | clean |
| /seo-tecnico-madrid | 88 → 88 | 98 → 98 | 96 → 96 | 91 → 100 | 3795ms needs-improvement → 3785ms needs-improvement | 0 → 0 good | 65ms good → 66ms good | clean |
| /en/seo-tecnico-madrid | 89 → 89 | 98 → 98 | 96 → 96 | 91 → 100 | 3782ms needs-improvement → 3794ms needs-improvement | 0 → 0 good | 64ms good → 43ms good | clean |
| /seo-tecnico-lima | 89 → 89 | 98 → 98 | 96 → 96 | 91 → 100 | 3783ms needs-improvement → 3786ms needs-improvement | 0 → 0 good | 60ms good → 48ms good | clean |
| /en/seo-tecnico-lima | 89 → 89 | 98 → 98 | 96 → 96 | 91 → 100 | 3785ms needs-improvement → 3782ms needs-improvement | 0 → 0 good | 60ms good → 58ms good | clean |

No route drops more than 5 performance points; no CWV metric crosses into a worse band. All 6 routes' SEO score improved from 91 to 100 (unrelated to this phase — Phase 30's meta/JSON-LD work on geo-pages landed after the Phase 32 baseline was captured; noted here for completeness, not a Phase 31 change).

**Track A result: 6/6 routes clean.**

## Track B — Blog + Case Studies (baseline: `lh-phase31-pre.json`, captured by Plan 31-01, this phase)

| Route | Perf (before→after) | A11y | BP | SEO | LCP (before→after) | CLS (before→after) | TBT (before→after) | Status |
|---|---|---|---|---|---|---|---|---|
| /blog/tech-seo-guide | 75 → 84 | 96 → 96 | 96 → 96 | 100 → 100 | 4113ms poor → 3695ms needs-improvement | 0 good → 0.019 good | 159ms good → 29ms good | clean (improved) |
| /en/blog/tech-seo-guide | 81 → 84 | 96 → 96 | 96 → 96 | 100 → 100 | 3598ms needs-improvement → 3690ms needs-improvement | 0 → 0 good | 16ms good → 27ms good | clean |
| /case-studies/migracion-ecommerce-nextjs-seo-tecnico | 77 → 79 | 96 → 96 | 96 → 96 | 100 → 100 | 4919ms poor → 4371ms poor | 0 → 0 good | 55ms good → 32ms good | clean (improved) |
| /en/case-studies/migracion-ecommerce-nextjs-seo-tecnico | 75 → 79 | 96 → 96 | 96 → 96 | 100 → 100 | 4435ms poor → 4366ms poor | 0 → 0 good | 31ms good → 36ms good | clean |

No route drops in performance (all 4 improved or held steady); no CWV metric crosses into a worse band (`/blog/tech-seo-guide`'s LCP actually improved out of the poor band into needs-improvement). The rewritten richText content (72 posts + 7 case studies, Plans 31-02 through 31-15) did not add render-blocking weight or degrade CWV on the two representative routes measured both before and after the sweep.

**Track B result: 4/4 routes clean.**

## Overall Verdict

**RESULT: PASS**

All 10 routes across both v1.6 tracks show zero regression against their correct baseline. The only anomalous readings (first-pass `/` and `/seo-tecnico-madrid`) were confirmed as measurement noise via 2 clean re-runs each and corrected in `lh-phase31-post.json` before this diff was computed — no unresolved flags remain. This closes Phase 31's success criterion 5 and is the final gate for milestone v1.6 (Track A + Track B).
