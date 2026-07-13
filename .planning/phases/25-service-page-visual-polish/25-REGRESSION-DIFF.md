# Phase 25 Regression Gate: FAIL (see below)

Diff of the post-change site (Plans 25-02/25-03) against the Plan 25-01 baseline, across all 8 service URLs (4 slugs x 2 locales). Same measurement scripts as 25-01, re-run verbatim, unmodified.

## Task 1: H1 / JSON-LD / ES-EN Parity

Source: `25-baseline-content.json` (pre-change, 25-01) vs `25-post-content.json` (post-change, this plan). Programmatic diff via `node -e` (see 25-04-PLAN.md verify block). Live ES/EN parity check via direct fetch against exact translation-namespace strings from `messages/en.json` / `messages/es.json` (`serviceScopeCard.*`, `relatedCaseStudyBlock.title`).

| URL | H1 count/text | BreadcrumbList itemListElement | ES/EN scope-card + framing parity |
|---|---|---|---|
| /servicios/seo-technical-audit | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /servicios/seo-consulting | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /servicios/fullstack-development | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /servicios/ai-seo-geo | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /en/services/seo-technical-audit | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |
| /en/services/seo-consulting | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |
| /en/services/fullstack-development | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |
| /en/services/ai-seo-geo | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |

**Programmatic diff result:** `PASS: 8/8 URLs, H1 + BreadcrumbList unchanged from baseline` (exact script output from `25-04-PLAN.md`'s Task 1 verify block).

**ES/EN parity detail:** For every URL, all 4 locale-specific `serviceScopeCard` strings (`title`/`scopeLabel`/`outcomeLabel`/`timelineLabel`) and the `relatedCaseStudyBlock.title` string were confirmed present verbatim, with zero occurrence of the opposite-locale equivalents anywhere in the response HTML — 8/8 URLs PASS, zero leakage. CTA button text also confirmed locale-correct on spot-check (e.g. `/servicios/seo-technical-audit` renders "Pedir una auditoría" / "Contáctame"; `/en/services/seo-technical-audit` renders "Request an audit" / "Contact me").

**Note on the out-of-band nav/link fix** (`src/lib/service-slugs.ts`, SiteHeader/Content-block/LocaleSwitcher touched between 25-01's baseline and 25-03's seed): no delta was observed on H1, JSON-LD, or scope-card/framing parity attributable to that fix — all checks above are clean PASS with byte-identical H1 text and deep-equal BreadcrumbList structure, so the nav fix had zero measurable impact on these three axes.

## Task 2: Lighthouse Mobile (production build, port 3027)

Source: `lh-phase25-baseline.json` (pre-change, 25-01, production build port 3026) vs `lh-phase25-post.json` (post-change, this plan, production build port 3027). Same script (`scripts/lighthouse-mobile.mjs`), same production-build/kill-PID pattern as 25-01 Task 2 / Phase 17 precedent. Background server confirmed killed after capture (`lsof -i :3027` clear, no orphan process).

Threshold per `25-04-PLAN.md`: flag if `performance` drops more than 5 points, or any CWV metric (LCP/CLS/TBT) crosses into a worse Lighthouse lab band than its baseline value (LCP good <=2500ms / needs-improvement <=4000ms / poor above; CLS good <=0.1 / needs-improvement <=0.25 / poor above; TBT good <=200ms / needs-improvement <=600ms / poor above).

| Route | Perf baseline -> post (delta) | LCP baseline -> post (band) | CLS baseline -> post (band) | TBT baseline -> post (band) | Verdict |
|---|---|---|---|---|---|
| /servicios/seo-technical-audit | 82 -> 79 (-3) | 3486ms -> 3753ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 173ms -> 120ms (good, no change) | PASS |
| /servicios/seo-consulting | 84 -> 82 (-2) | 3464ms -> 3552ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 79ms -> 75ms (good, no change) | PASS |
| /servicios/fullstack-development | 87 -> 85 (-2) | 3468ms -> 3543ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 49ms -> 63ms (good, no change) | PASS |
| /servicios/ai-seo-geo | 87 -> 83 (-4) | 3546ms -> 3565ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 46ms -> 98ms (good, no change) | PASS |
| /en/services/seo-technical-audit | 87 -> 86 (-1) | 3469ms -> 3550ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 46ms -> 102ms (good, no change) | PASS |
| /en/services/seo-consulting | 87 -> 83 (-4) | 3476ms -> 3552ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 51ms -> 75ms (good, no change) | PASS |
| **/en/services/fullstack-development** | **87 -> 81 (-6)** | 3467ms -> 3570ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 44ms -> 126ms (good, no change) | **FAIL (perf drop > 5pt threshold)** |
| /en/services/ai-seo-geo | 87 -> 83 (-4) | 3466ms -> 3542ms (needs-improvement, no change) | 0 -> 0 (good, no change) | 42ms -> 56ms (good, no change) | PASS |

**Automated verify script result:** `1 Lighthouse regressions found` — `/en/services/fullstack-development: performance dropped 6 points` (exact output from `25-04-PLAN.md`'s Task 2 verify block; script exits non-zero).

**Reproducibility check (not routing around the failure, confirming it is real):** because a single Lighthouse lab run carries inherent variance, `/en/services/fullstack-development` was re-run twice more in isolation, on a dedicated production build (port 3028, same kill-PID discipline, server confirmed clean afterward): **77**, then **78** — both *worse* than the officially recorded 81, and both further below the 87 baseline (drops of 10 and 9 points respectively). The regression is consistent across three independent runs, not a one-off noisy sample. No CWV band crossed a worse tier on this route (LCP/CLS/TBT all stayed within their baseline bands across all three runs), so this is a Performance-score-only regression, not a CWV band failure.

**No CWV lab-band crossings on any of the 8 routes.** LCP stays `needs-improvement` (unchanged) on all 8, CLS stays `good` (0 everywhere) on all 8, TBT stays `good` (<200ms) on all 8 including the flagged route (its worst observed TBT across 3 runs was 221ms, which crosses into `needs-improvement`, but the officially recorded run was 126ms — flagging this as a secondary, non-blocking observation since the plan's band-crossing rule is evaluated against the officially recorded run).

**Secondary observation (non-blocking, outside plan's must-have thresholds):** `accessibility` dropped uniformly from 98 -> 94 across all 8 routes (Task 1's SEO score improved uniformly 83 -> 85 across all 8). Because this shift is identical and site-wide rather than isolated to one route, it is not attributable to the isolated `/en/services/fullstack-development` performance regression above; most likely attributable to the out-of-band nav/link fix (`src/lib/service-slugs.ts` + SiteHeader/Content-block/LocaleSwitcher) that touched shared chrome on every page between the 25-01 baseline and this diff, or to a new shared component's accessibility markup (e.g. `ServiceScopeCard`/`RelatedCaseStudyBlock`/repeated CTA). The plan's must-haves (SVCPOL-07/08/09) do not gate on the accessibility category, so this does not affect the pass/fail verdict below, but is flagged here for follow-up since it is a real, uniform, unexplained 4-point drop across every URL in the phase.

**Investigation of the isolated fullstack-development regression:** rendered HTML byte-size is identical across all 4 EN service routes (9,668 bytes via dev-server fetch, same 10-block anatomy per 25-03), so this is not attributable to that landing carrying more content/markup than its siblings. The most likely confound: the main `next dev` server (port 3000, PID 65077) was running throughout this plan's execution, competing for CPU with the Lighthouse-under-CPU-throttling benchmark on the production-build port — this would explain route-to-route and run-to-run TBT variance (CPU-bound metric) without implicating any Phase 25 code change specifically. This is a plausible explanation, not a confirmed root cause; it does not change the verdict below.

---

## Phase 25 Regression Gate: FAIL (see below)

**7 of 8 routes PASS** on H1, JSON-LD, ES/EN parity, and Lighthouse performance/CWV thresholds. **1 of 8 routes (`/en/services/fullstack-development`) FAILS** the Lighthouse performance-drop threshold: baseline 87 -> post 81 (6-point drop, over the 5-point limit), confirmed reproducible across 3 independent runs (81, 77, 78). No CWV lab-band crossed into a worse tier on the officially recorded run for this route or any other route. H1/JSON-LD/ES-EN-parity are clean 8/8 PASS with zero regressions.

**This is not being silently glossed over.** Per this plan's own threat-model mitigation (T-25-10) and explicit instruction, this FAIL is surfaced as the closing verdict of Phase 25's regression gate rather than marked done. SVCPOL-08 (no CWV regression) is not fully satisfied as written — the specific failing metric is the aggregate Lighthouse Performance category score on one route, not any of the three named CWV metrics (LCP/CLS/TBT) individually, all of which stayed within their baseline lab band on every route including this one. SVCPOL-07 (H1/JSON-LD) and SVCPOL-09 (ES/EN parity) are fully satisfied, 8/8.
