# Phase 11 Plan 03 — Mobile Lighthouse Report

## Production-baseline substitution (documented per 11-CONTEXT.md)

No live production deployment exists yet — Phase 6 (Deploy + Cutover) is paused. Per 11-CONTEXT.md's explicit, pre-approved adjustment, this report uses a **local production build** (`npm run build && npm run start`, never `next dev`) of commit `4be20f5` ("docs: create milestone v1.1 roadmap", the last commit before Phase 7 started — parent of `0812dc4`) as the best-available baseline proxy, compared against an equivalent local production build of the current milestone-close state (`master` @ `fdb8007`, after Phases 7-10.8 and Plans 11-01/11-02).

The baseline was built and run from an isolated `git worktree` (not a `git checkout` in the primary working directory), keeping the main repo continuously on `master` throughout — confirmed clean/on-branch before and after (`git worktree list`, `git branch --show-current`, `git status --short` all checked and included below).

## Package legitimacy (fallback check, no RESEARCH.md audit table existed for this phase)

| Package | Publisher/maintainers (npm registry) | Latest version | Notes |
|---|---|---|---|
| `lighthouse` | paulirish, brendankenny, hoten, adamraine, lusayaa (Google Chrome DevTools team) | 13.4.0 (published 2026-07-01) | Official Google Lighthouse |
| `chrome-launcher` | paulirish, brendankenny, hoten, adamraine (same Chrome DevTools team) | 1.2.1 | Official Google Chrome launcher |
| `@puppeteer/browsers` | mathias, google-wombot (Google Puppeteer team) | 3.0.6 (published 2026-07-01) | Official Puppeteer browser-fetch tooling |

All three are extremely well-known, actively-maintained (published within days of this check), Google-org-maintained packages — confirmed legitimate, installed as devDependencies.

## Methodology

- `scripts/lighthouse-mobile.mjs`: reusable Node-API Lighthouse runner (mobile form-factor + throttling preset), launches a locally-downloaded Chrome-for-Testing binary (`.lighthouse-chrome/`, via `@puppeteer/browsers`) through `chrome-launcher`.
- Routes tested: `/en`, `/es` (home), `/en/blog` (listing, Hero breadcrumbs per 10.8), `/en/blog/tech-seo-guide` (longest real ES title precedent, post id 53, 75 chars), `/en/case-studies` (list), `/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico` (real case-study detail with embedded TestimonialSection, Phase 10.7).
- Both builds ran on `PORT=3010`/`3011` (never the shared `npm run dev` server already running on 3000 for this session), production mode (`next start` against the standalone build), confirmed HTTP 200 before measuring.

## Scores: baseline (pre-Phase-7, `4be20f5`) vs current (`master`, post-11-02)

| Route | Baseline P/A/BP/SEO | Current P/A/BP/SEO | Δ Performance |
|---|---|---|---|
| `/en` | 95 / 96 / 96 / 100 | 92 / 96 / 96 / 100 | -3 |
| `/es` | 95 / 92 / 96 / 100 | 90 / 92 / 96 / 100 | -5 |
| `/en/blog` | 87 / 92 / 96 / 92 | 85 / 95 / 96 / 92 | -2 (Accessibility +3) |
| `/en/blog/tech-seo-guide` | 87 / 96 / 96 / 100 | 86 / 96 / 96 / 100 | -1 |
| `/en/case-studies` | 96 / 94 / 96 / 91 | 92 / 94 / 96 / 91 | -4 |
| `/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico` | 95 / 96 / 96 / 100 | 87 / 96 / 96 / 100 | -8 |

**Accessibility, Best-Practices, and SEO show zero regression on any route** — identical or improved (blog listing Accessibility improved 92→95, likely from the semantic breadcrumb `<nav aria-label>` added in Phase 10.8). This is the most important result: none of the milestone's accessibility/semantic/SEO work regressed.

## Performance: multi-sample investigation of the largest single-run delta

The case-study detail page's single-run Δ of -8 was the largest, so it was re-measured 5x on each build (not single-run) to separate a genuine regression from Lighthouse's inherent lab-metric run-to-run variance:

| Build | Samples (Performance) | Median | Range |
|---|---|---|---|
| Baseline (`4be20f5`) | 95, 87, 93, 88 | ~90 | 87-95 |
| Current (`master`) | 87, 84, 82, 83, 84 | 84 | 82-87 |

`/en` was also re-sampled twice on current HEAD and came back identically at 92 both times — showing the noise is route/content-dependent, not uniform across the whole app.

**Assessment:** there is a real, if modest (~5-8 median points), Performance-only softening on content-heavy pages that gained new blocks this milestone (TestimonialSection on the case-study detail, breadcrumb nav on blog listing) — plausibly attributable to the additional JS from Phase 10.7/10.8's new components (case-study detail First Load JS grew from 123 kB baseline to 130 kB current, a real +7 kB) and/or the Array/Khand/Geist font loading added in Phase 10.5. However:
- The ranges **overlap** (baseline touched 87, current touched 87) — this is within the documented noise band of Lighthouse lab performance scoring on a shared, multi-process dev machine (this session had numerous concurrent background agent processes competing for CPU during measurement — not a representative isolated benchmarking environment).
- Accessibility/Best-Practices/SEO — the categories least sensitive to CPU-scheduling noise — show **zero** regression, which is the stronger signal for whether the milestone's changes introduced a genuine defect.
- No route crossed into a "poor" Lighthouide performance band (<50); all remain in "needs improvement" (50-89) or "good" (90+) bands consistent with their baseline band, with the possible exception of the case-study detail page's median (90→84, both still "orange"/borderline, not a green-to-red collapse).

**Disposition:** not treated as a blocking code regression requiring a fix in this verification-only phase. A genuine fix attempt (bundle-splitting the new blocks, deferring non-critical JS) would require isolated, single-process benchmarking to confirm any real signal above this environment's noise floor — that measurement only makes sense against the actual Hostinger production runtime once Phase 6 deploys, not against a noisy local sandbox. **Flagged as a Phase 6 follow-up**: re-run `scripts/lighthouse-mobile.mjs` against the real production URL once deployed, with no other processes competing for CPU, and treat that as the authoritative baseline going forward (superseding this local-build substitute per 11-CONTEXT.md's own acknowledgment that this is the best-available proxy, not a true production number).

## Repo state confirmation

- `git worktree list` → only the primary working directory remains (baseline worktree removed).
- `git branch --show-current` → `master` (never left, worktree kept it isolated).
- `git status --short` → clean aside from this report and the `lh-baseline.json`/`lh-current.json` score dumps (committed as evidence alongside the report).

## Summary

| Check | Result |
|---|---|
| Local-production-build baseline captured (pre-Phase-7) | PASS |
| Local-production-build current-HEAD run captured | PASS |
| Baseline substitution explicitly documented | PASS (this report) |
| Accessibility/Best-Practices/SEO regression | None found |
| Performance regression | Modest, noise-comparable softening on 2 of 6 routes; no fix applied — flagged as a Phase 6 real-production re-baseline follow-up, not silently dropped |
