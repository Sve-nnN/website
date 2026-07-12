# Phase 17 Plan 01 — Hero GrainGradient Performance & CWV Verification Report

## Methodology

- Local production build only (`PORT=3020 npm run build && PORT=3020 npm run start`, never `next dev`), confirmed HTTP 200 on `/en` before every measurement.
- Routes tested: `/en`, `/es` (Hero home routes — the only routes affected by the Phase 16 `GrainGradient` WebGL shader).
- `scripts/lighthouse-mobile.mjs` (Phase 11-03 runner, extended in this plan's Task 1 with `lcpMs`/`cls`/`tbtMs` extraction and comma-separated `--routes-only` support) ran the mobile form-factor Lighthouse audit against both routes.
- `scripts/verify-hero-grain-gradient.mjs` (Phase 16-03, unmodified) ran against the same production server via `BASE_URL` override, reusing its existing overflow/canvas/reduced-motion/content checks at 375/768/1280px.
- Chrome-for-Testing binary reused from the cached `.lighthouse-chrome/` directory (no re-download).

## Baseline note

The comparison baseline is Phase 11-03's post-11-02 `lh-current.json` `/en` and `/es` entries — the most recent local-production-build measurement taken **before** the Hero shader existed (Phase 16 shipped after Phase 11). Per 17-CONTEXT.md's explicit discretion note, this is the correct baseline to use; no fresh pre-milestone checkout or re-derivation was performed.

## Scores: baseline (Phase 11-03, pre-shader) vs current (post-Phase-16, shader live)

| Route | Baseline P/A/BP/SEO | Current P/A/BP/SEO | Δ Performance | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| `/en` | 92 / 96 / 96 / 100 | 89 / 96 / 96 / 100 | -3 | 3553 ms | 0 | 120 ms |
| `/es` | 90 / 92 / 96 / 100 | 87 / 96 / 96 / 100 | -3 | 3861 ms | 0 | 133 ms |

Accessibility, Best-Practices, and SEO are unchanged or improved on both routes (`/es` Accessibility 92→96). Neither route shows any regression outside the Performance category.

## Core Web Vitals lab-band assessment

- **LCP** (3.55s `/en`, 3.86s `/es`): both fall in Lighthouse's mobile "needs improvement" band (2.5s–4.0s), not "poor" (>4.0s). This band is consistent with a content-heavy, image/font-loaded Hero on a throttled mobile emulation profile — not a "poor" collapse attributable to the shader.
- **CLS** (0 on both routes): "good" band (<0.1), the best possible score — the shader's canvas is absolutely positioned inside its own wrapper and introduces zero layout shift.
- **TBT** (120 ms `/en`, 133 ms `/es`): "good" band (<200ms), well below the "needs improvement" threshold (200-600ms) and far from "poor" (>600ms) — the WebGL shader's JS/GPU work is not blocking the main thread in a way that shows up as a CWV lab-metric problem. (TBT is used here as Lighthouse's lab-metric proxy for INP; true INP requires real-user field data unavailable from a local production build.)

## Disposition: PASS — no significant regression

Applying 17-CONTEXT.md's stated threshold (Performance drop >~5 points, or CWV entering a "poor" band, warrants a flag; +/-2-3 points is normal variance):

- Performance Δ is -3 on both `/en` and `/es` — within the documented normal-variance band, not a flagged regression. (For context, Phase 11-03's own baseline-vs-then-current comparison showed -3 to -8 point swings between two non-shader states of the same app, run-to-run — a -3 point Δ here is consistent with ordinary Lighthouse lab noise, not a shader-attributable defect.)
- No CWV metric (LCP/CLS/TBT) entered the "poor" band on either route.
- No accessibility/best-practices/SEO regression.

**Conclusion: the Hero `GrainGradient` shader (Phase 16) does not introduce a significant Performance or Core Web Vitals regression.** No follow-up action required; nothing flagged for Juan's decision.

## Mobile spot-check (production build)

Re-ran `scripts/verify-hero-grain-gradient.mjs` against the same `PORT=3020` production server (BASE_URL override) as the "lighter re-confirmation against the production build" scoped by 17-CONTEXT.md — full dev-server verification was already completed in Phase 16-03.

- `/es` and `/en` at 1280x800: hero wrapper present, `data-motion="live"`, canvas painted (1280x426 `/es`, 1280x367 `/en`), coarse color check within dark-navy family, title/subtitle/CTA text unchanged.
- Overflow check (locale `/es`) at 375px, 768px, 1280px: zero horizontal overflow (`scrollWidth` matched viewport width at all three breakpoints).
- Reduced-motion emulation: `data-motion="reduced"` correctly reflects `prefers-reduced-motion: reduce`.
- **Result: 23 notes, 0 warnings, 0 failures — PASS (all hard assertions OK).**

## Summary

| Check | Result |
|---|---|
| Local-production-build current run captured (`/en`, `/es`) | PASS |
| Baseline comparison against Phase 11-03's pre-shader measurement | PASS (documented above) |
| Performance regression beyond ~5pt threshold | None found (Δ-3 both routes) |
| LCP/CLS/TBT in "poor" lab band | None — LCP needs-improvement, CLS good, TBT good |
| Accessibility/Best-Practices/SEO regression | None found |
| Mobile spot-check (375/768/1280px) against production build | PASS — 0 failures |
| Background production server left running | No — stopped after Task 2 and Task 3 |
